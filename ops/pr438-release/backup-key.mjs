import { generateKeyPairSync, createPrivateKey, privateDecrypt, createDecipheriv, createHash, constants } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

// Release-only helper. No Production write or plaintext key/archive is produced here.
const dir = process.env.BACKUP_OUTPUT_DIR;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!dir || !password) throw new Error('Explicit output directory and existing protected database password required');
if (process.argv[2] === 'prepare') {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const keys = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: password }
  });
  await writeFile(path.join(dir, 'recipient-public.pem'), keys.publicKey, { mode: 0o600 });
  await writeFile(path.join(dir, 'recipient-private.encrypted.pem'), keys.privateKey, { mode: 0o600 });
  await writeFile(path.join(dir, 'RECOVERY.txt'), 'PR438 recovery: private key is encrypted PKCS#8 using the Supabase Production database password at backup time. Preserve that password through any later rotation. Decrypt the key locally, unwrap envelope.wrappedKey with RSA-OAEP-SHA256, decrypt backup.tar.gz.enc with AES-256-GCM and envelope.iv/tag, and verify envelope.archiveSha256. Restore only into an isolated PostgreSQL 17/Supabase environment before planning recovery. This artifact expires after 90 days; retain a controlled external copy if longer retention is needed. Never upload plaintext keys, database dumps, or Auth records.\n');
} else if (process.argv[2] === 'verify') {
  const envelope = JSON.parse(await readFile(path.join(dir, 'envelope.json'), 'utf8'));
  const privateKey = createPrivateKey({ key: await readFile(path.join(dir, 'recipient-private.encrypted.pem')), passphrase: password });
  const key = privateDecrypt({ key: privateKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(envelope.wrappedKey, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path.join(dir, 'backup.tar.gz.enc'))) hash.update(decipher.update(chunk));
  hash.update(decipher.final());
  key.fill(0);
  if (hash.digest('hex') !== envelope.archiveSha256) throw new Error('Backup authenticated decryption/hash mismatch');
  const file = path.join(dir, 'evidence.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  if (!evidence.restoreVerified || !evidence.sourceReadOnly) throw new Error('Backup restore/read-only verification missing');
  evidence.authenticatedDecryptionVerified = true;
  evidence.recoveryKey = 'encrypted PKCS#8 in artifact; passphrase is backup-time SUPABASE_DB_PASSWORD';
  await writeFile(file, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  console.log('Isolated restoration and authenticated decryption verified; no credentials printed.');
} else throw new Error('Expected prepare or verify');
