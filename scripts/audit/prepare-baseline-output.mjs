import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceRoot = path.join(rootDir, 'docs/evidence/global-baseline');

for (const name of ['desktop', 'android', 'iphone']) {
  await rm(path.join(evidenceRoot, name), { recursive: true, force: true });
  await mkdir(path.join(evidenceRoot, name), { recursive: true });
}
await rm(path.join(evidenceRoot, 'manifest.json'), { force: true });
console.log('Diretórios de captura preparados.');
