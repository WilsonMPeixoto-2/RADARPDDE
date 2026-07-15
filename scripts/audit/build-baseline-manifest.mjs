import { execFile } from 'node:child_process';
import { readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceRoot = path.join(rootDir, 'docs/evidence/global-baseline');
const captures = [];

for (const viewport of ['desktop', 'android', 'iphone']) {
  const directory = path.join(evidenceRoot, viewport);
  const names = (await readdir(directory)).filter(name => name.endsWith('.png')).sort();
  for (const name of names) {
    const match = name.match(/^([^_]+)__([^_]+)__([^_]+)__(desktop|android|iphone)\.png$/);
    if (!match) throw new Error(`Nome de captura inválido: ${name}`);
    const imagePath = path.join(directory, name);
    const metadataPath = imagePath.replace(/\.png$/, '.meta.json');
    const fileStat = await stat(imagePath);
    if (fileStat.size < 6000) throw new Error(`Captura pequena ou vazia: ${viewport}/${name}`);
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    captures.push({
      profile: match[1],
      surface: match[2],
      state: match[3],
      viewport,
      file: `${viewport}/${name}`,
      bytes: fileStat.size,
      captureMode: metadata.captureMode,
      documentHeight: metadata.documentHeight
    });
    await unlink(metadataPath);
  }
}

if (captures.length !== 24) throw new Error(`Esperadas 24 capturas; encontradas ${captures.length}`);
const commitOverride = String(process.env.RADAR_BASELINE_COMMIT || '').trim();
const commit = commitOverride || (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: rootDir })).stdout.trim();
const manifest = { schemaVersion: 1, commit, captures };
await writeFile(path.join(evidenceRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Manifesto gravado com ${captures.length} capturas.`);
