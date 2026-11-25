import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createPrivateKey } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { encryptArchive, PROJECT, CANDIDATE_SHA, validateBackupPaths } from './backup-production.mjs';
import { prepareRecoveryKey, verifyBackup } from './backup-key.mjs';

const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'radar-pr562-key-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const outputDir = path.join(root, 'sealed');
  const privateDir = path.join(root, 'private');
  await mkdir(privateDir, { mode: 0o700 });
  const password = 'synthetic-test-only-password-not-a-credential';
  const { publicKeyFile, privateKeyFile } = await prepareRecoveryKey({ outputDir, password });
  const plaintext = Buffer.from('SYNTHETIC BACKUP CONTENT ONLY\n'.repeat(1500));
  const archive = path.join(privateDir, 'synthetic.tar.gz');
  await writeFile(archive, plaintext, { mode: 0o600 });
  const envelope = await encryptArchive(archive, publicKeyFile, outputDir);
  const evidence = {
    schemaVersion: 1, projectRef: PROJECT, candidateSha: CANDIDATE_SHA,
    restoreVerified: true, sourceReadOnly: true, sourceSnapshotConsistent: true,
    ciphertextSha256: envelope.ciphertextSha256, recipientSpkiSha256: envelope.recipientSpkiSha256
  };
  await writeFile(path.join(outputDir, 'evidence.json'), JSON.stringify(evidence), { mode: 0o600 });
  return { outputDir, privateDir, password, publicKeyFile, privateKeyFile, plaintext, envelope, evidence };
}

test('encrypted PKCS8 and RSA3072/AES256GCM roundtrip verifies synthetic bytes without a plaintext output file', async t => {
  const f = await fixture(t);
  const pem = await readFile(f.privateKeyFile, 'utf8');
  assert.match(pem, /BEGIN ENCRYPTED PRIVATE KEY/);
  assert.throws(() => createPrivateKey(pem));
  const evidence = await verifyBackup(f);
  assert.equal(evidence.authenticatedDecryptionVerified, true);
  assert.equal(evidence.candidateSha, CANDIDATE_SHA);
  assert.equal(f.envelope.archiveSha256, hash(f.plaintext));
  assert.deepEqual((await readdir(f.outputDir)).sort(), [
    'RECOVERY.txt', 'backup.tar.gz.enc', 'envelope.json', 'evidence.json',
    'recipient-private.encrypted.pem', 'recipient-public.pem'
  ].sort());
  assert.equal((await stat(f.outputDir)).mode & 0o777, 0o700);
  for (const name of await readdir(f.outputDir)) {
    assert.equal((await stat(path.join(f.outputDir, name))).mode & 0o777, 0o600);
  }
  await assert.rejects(prepareRecoveryKey(f), /nonempty/);
  assert.equal(await readFile(f.privateKeyFile, 'utf8'), pem);
});

test('a tampered ciphertext fails GCM authentication even when its unkeyed checksums are replaced', async t => {
  const f = await fixture(t);
  await verifyBackup(f);
  const ciphertextFile = path.join(f.outputDir, 'backup.tar.gz.enc');
  const ciphertext = await readFile(ciphertextFile);
  ciphertext[Math.floor(ciphertext.length / 2)] ^= 0x01;
  await writeFile(ciphertextFile, ciphertext);
  f.envelope.ciphertextSha256 = hash(ciphertext);
  f.evidence.ciphertextSha256 = f.envelope.ciphertextSha256;
  f.evidence.authenticatedDecryptionVerified = true;
  await writeFile(path.join(f.outputDir, 'envelope.json'), JSON.stringify(f.envelope));
  await writeFile(path.join(f.outputDir, 'evidence.json'), JSON.stringify(f.evidence));
  await assert.rejects(verifyBackup(f), /authenticated decryption\/hash mismatch/);
  assert.equal(JSON.parse(await readFile(path.join(f.outputDir, 'evidence.json'), 'utf8')).authenticatedDecryptionVerified, false);
});

test('an incorrect passphrase cannot certify the backup or retain an earlier successful certification', async t => {
  const f = await fixture(t);
  await verifyBackup(f);
  await assert.rejects(verifyBackup({ ...f, password: 'a-different-synthetic-passphrase' }), /provided passphrase/);
  const evidence = JSON.parse(await readFile(path.join(f.outputDir, 'evidence.json'), 'utf8'));
  assert.equal(evidence.authenticatedDecryptionVerified, false);
  assert.equal('recoveryKey' in evidence, false);
});

test('plaintext backup paths cannot overlap the directory intended for upload', () => {
  const options = { privateDir: '/tmp/radar-private', outputDir: '/tmp/radar-sealed', publicKeyFile: '/tmp/radar-sealed/recipient-public.pem' };
  assert.deepEqual(validateBackupPaths(options), options);
  assert.throws(() => validateBackupPaths({ ...options, privateDir: options.outputDir }), /separate and non-nested/);
  assert.throws(() => validateBackupPaths({ ...options, privateDir: `${options.outputDir}/plaintext` }), /separate and non-nested/);
  assert.throws(() => validateBackupPaths({ ...options, outputDir: `${options.privateDir}/sealed` }), /separate and non-nested/);
  assert.throws(() => validateBackupPaths({ ...options, outputDir: 'relative-output' }), /absolute/);
});
