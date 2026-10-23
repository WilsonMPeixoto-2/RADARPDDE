// Diagnóstico opt-in: amplia o alcance do Knip sem excluir nem modificar arquivos.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const knip = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'knip.cmd' : 'knip');
const args = [
  '--config', 'knip.config.cjs',
  '--include', 'files,exports,types',
  '--reporter', 'json',
  '--no-progress', '--no-exit-code', '--no-config-hints'
];
const result = spawnSync(knip, args, {
  cwd: root, encoding: 'utf8', timeout: 180_000,
  shell: process.platform === 'win32',
  maxBuffer: 12 * 1024 * 1024
});

if (result.error || result.status !== 0) {
  process.stderr.write(result.stderr || '');
  throw new Error('Knip não executou corretamente. Faça npm ci e confira o ambiente: '
    + String(result.error?.message || result.signal || result.status));
}
let output;
try {
  output = JSON.parse(result.stdout.trim());
} catch {
  throw new Error('Knip executou, mas não produziu o JSON esperado. '
    + (result.stderr || '').slice(0, 1500));
}
if (!Array.isArray(output?.issues)) throw new Error('Formato inesperado do relatório Knip.');
const totals = { files: 0, exports: 0, types: 0 };
for (const issue of output.issues) {
  for (const kind of Object.keys(totals)) {
    if (Array.isArray(issue[kind])) totals[kind] += issue[kind].length;
  }
}
const folder = path.join(root, 'artifacts', 'tooling');
await mkdir(folder, { recursive: true });
const file = path.join(folder, 'knip-deep-diagnostic.json');
await writeFile(file, JSON.stringify({
  command: 'knip --config knip.config.cjs --include files,exports,types --reporter json --no-exit-code',
  informationalOnly: true,
  totals,
  ...output
}, null, 2) + '\n', 'utf8');
console.log('Knip profundo, apenas diagnóstico:', JSON.stringify(totals));
console.log('Relatório:', path.relative(root, file));
console.log('Atenção: referências dinâmicas/IIFE podem gerar falsos positivos. Nada foi removido.');
