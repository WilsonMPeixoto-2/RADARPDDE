import { generateKeyPairSync, createPrivateKey, createPublicKey, privateDecrypt, createDecipheriv, createHash, constants } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod, lstat, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT, CANDIDATE_SHA } from './backup-production.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');

async function protectedDirectory(outputDir, password, create = false) {
  if (typeof outputDir !== 'string' || !path.isAbsolute(outputDir) || typeof password !== 'string' || !password) {
    throw new Error('Explicit absolute output directory and existing protected database password required');
  }
  const directory = path.resolve(outputDir);
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Backup output must be a real directory');
  await chmod(directory, 0o700);
  return directory;
}

// Release-only helper: the private key is never written in plaintext.
export async function prepareRecoveryKey({ outputDir, password }) {
  const directory = await protectedDirectory(outputDir, password, true);
  if ((await readdir(directory)).length) throw new Error('Refuse to replace recovery material in a nonempty output directory');
  const keys = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: password }
  });
  const publicKeyFile = path.join(directory, 'recipient-public.pem');
  const privateKeyFile = path.join(directory, 'recipient-private.encrypted.pem');
  await writeFile(publicKeyFile, keys.publicKey, { mode: 0o600, flag: 'wx' });
  await writeFile(privateKeyFile, keys.privateKey, { mode: 0o600, flag: 'wx' });
  await writeFile(path.join(directory, 'RECOVERY.txt'),
    `PR562 recovery for candidate ${CANDIDATE_SHA}: private key is encrypted PKCS#8 using the Supabase Production database password at backup time. Preserve that password through any later rotation. Decrypt the key locally, unwrap envelope.wrappedKey with RSA-OAEP-SHA256, decrypt backup.tar.gz.enc with AES-256-GCM and envelope.iv/tag, and verify envelope.archiveSha256. Restore only into an isolated PostgreSQL 17/Supabase environment before planning recovery. This artifact expires after 90 days; retain a controlled external copy if longer retention is needed. Never upload plaintext keys, database dumps, or Auth records.\n`,
    { mode: 0o600, flag: 'wx' });
  return { publicKeyFile, privateKeyFile };
}

function validateEnvelope(envelope) {
  const hash = /^[a-f0-9]{64}$/;
  if (envelope.schemaVersion !== 1 || envelope.cipher !== 'aes-256-gcm' || envelope.keyWrap !== 'rsa-oaep-sha256'
      || ![envelope.recipientSpkiSha256, envelope.ciphertextSha256, envelope.archiveSha256].every(value => typeof value === 'string' && hash.test(value))
      || !['iv', 'tag', 'wrappedKey'].every(field => typeof envelope[field] === 'string')
      || Buffer.from(envelope.iv, 'base64').length !== 12 || Buffer.from(envelope.tag, 'base64').length !== 16
      || Buffer.from(envelope.wrappedKey, 'base64').length < 384) {
    throw new Error('Unsupported or invalid backup encryption envelope');
  }
}

export async function verifyBackup({ outputDir, password }) {
  const directory = await protectedDirectory(outputDir, password);
  const evidenceFile = path.join(directory, 'evidence.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  // A failed recheck must never leave an earlier successful certification behind.
  evidence.authenticatedDecryptionVerified = false;
  delete evidence.recoveryKey;
  await writeFile(evidenceFile, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  if (evidence.projectRef !== PROJECT || evidence.candidateSha !== CANDIDATE_SHA
      || evidence.restoreVerified !== true || evidence.sourceReadOnly !== true || evidence.sourceSnapshotConsistent !== true) {
    throw new Error('Candidate, restore, consistent-snapshot or read-only verification missing');
  }

  const envelope = JSON.parse(await readFile(path.join(directory, 'envelope.json'), 'utf8'));
  validateEnvelope(envelope);
  if (evidence.ciphertextSha256 !== envelope.ciphertextSha256 || evidence.recipientSpkiSha256 !== envelope.recipientSpkiSha256) {
    throw new Error('Backup envelope does not match restoration evidence');
  }
  let privateKey;
  try {
    privateKey = createPrivateKey({ key: await readFile(path.join(directory, 'recipient-private.encrypted.pem')), passphrase: password });
  } catch {
    throw new Error('Recovery key could not be opened with the provided passphrase');
  }
  const publicKey = createPublicKey(privateKey);
  if (publicKey.asymmetricKeyType !== 'rsa' || publicKey.asymmetricKeyDetails.modulusLength < 3072
      || digest(publicKey.export({ type: 'spki', format: 'der' })) !== envelope.recipientSpkiSha256) {
    throw new Error('Recovery key does not match the backup recipient');
  }

  let key;
  try {
    key = privateDecrypt({ key: privateKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(envelope.wrappedKey, 'base64'));
    if (key.length !== 32) throw new Error('Unexpected encryption key length');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const plaintextHash = createHash('sha256');
    const ciphertextHash = createHash('sha256');
    for await (const chunk of createReadStream(path.join(directory, 'backup.tar.gz.enc'))) {
      ciphertextHash.update(chunk);
      const plaintext = decipher.update(chunk);
      plaintextHash.update(plaintext);
      plaintext.fill(0);
    }
    const final = decipher.final();
    plaintextHash.update(final);
    final.fill(0);
    if (plaintextHash.digest('hex') !== envelope.archiveSha256 || ciphertextHash.digest('hex') !== envelope.ciphertextSha256) {
      throw new Error('Archive hash differs');
    }
  } catch {
    throw new Error('Backup authenticated decryption/hash mismatch');
  } finally {
    key?.fill(0);
  }

  evidence.authenticatedDecryptionVerified = true;
  evidence.recoveryKey = 'encrypted PKCS#8 in artifact; passphrase is backup-time SUPABASE_DB_PASSWORD';
  await writeFile(evidenceFile, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  return evidence;
}

async function main() {
  const options = { outputDir: process.env.BACKUP_OUTPUT_DIR, password: process.env.SUPABASE_DB_PASSWORD };
  if (process.argv[2] === 'prepare') await prepareRecoveryKey(options);
  else if (process.argv[2] === 'verify') {
    await verifyBackup(options);
    console.log('Isolated restoration and authenticated decryption verified; no credentials printed.');
  } else throw new Error('Expected prepare or verify');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.umask(0o077);
  main().catch(() => {
    console.error('PR562 recovery-key preparation or verification failed; no credentials or private diagnostic details are printed.');
    process.exitCode = 1;
  });
}
