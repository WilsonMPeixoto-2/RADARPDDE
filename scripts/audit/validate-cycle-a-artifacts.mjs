import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  'docs/reference/PRODUCT_DECISIONS.md',
  'docs/reference/CHANGE_CLASSIFICATION.md',
  'docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md',
  'docs/reference/PRODUCT_SURFACE_CATALOG.md',
  'docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md',
  'docs/audits/2026-07-15-inventario-tecnico-global.md',
  'docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md',
  'docs/audits/2026-07-15-produto-estado-atual.md',
  'docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md',
  'docs/evidence/global-baseline/manifest.json',
  'docs/evidence/global-baseline/repository-inventory.json'
];

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function localLinks(source) {
  return [...source.matchAll(/\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\)/g)]
    .map(match => match[1].split('#')[0]).filter(Boolean);
}

export async function validateCycleAArtifacts(rootDir) {
  const errors = [];
  for (const relativePath of REQUIRED_FILES) {
    if (!(await exists(path.join(rootDir, relativePath)))) errors.push(`Arquivo ausente: ${relativePath}`);
  }

  for (const relativePath of REQUIRED_FILES.filter(file => file.endsWith('.md'))) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!(await exists(absolutePath))) continue;
    const source = await readFile(absolutePath, 'utf8');
    if (/\b(TBD|TODO|implement later|fill in details)\b/i.test(source)) errors.push(`Placeholder proibido: ${relativePath}`);
    for (const link of localLinks(source)) {
      const target = path.resolve(path.dirname(absolutePath), decodeURIComponent(link));
      if (!(await exists(target))) errors.push(`Link quebrado em ${relativePath}: ${link}`);
    }
  }

  const catalog = await readFile(path.join(rootDir, 'docs/reference/PRODUCT_SURFACE_CATALOG.md'), 'utf8').catch(() => '');
  const surfaceCount = [...catalog.matchAll(/^## S-\d{2} —/gm)].length;
  if (surfaceCount < 18) errors.push(`Catálogo possui ${surfaceCount} superfícies; mínimo 18`);

  const manifest = JSON.parse(await readFile(path.join(rootDir, 'docs/evidence/global-baseline/manifest.json'), 'utf8').catch(() => '{"captures":[]}'));
  for (const capture of manifest.captures || []) {
    if (!(await exists(path.join(rootDir, 'docs/evidence/global-baseline', capture.file)))) errors.push(`Captura ausente: ${capture.file}`);
  }
  const captureCount = (manifest.captures || []).length;
  if (captureCount !== 24) errors.push(`Manifesto possui ${captureCount} capturas; esperado 24`);

  return { errors, surfaceCount, captureCount };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = await validateCycleAArtifacts(rootDir);
  if (result.errors.length) {
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Ciclo A válido: ${result.surfaceCount} superfícies e ${result.captureCount} capturas.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
