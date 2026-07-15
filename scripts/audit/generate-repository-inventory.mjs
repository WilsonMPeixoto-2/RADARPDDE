import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.html', '.css', '.sql', '.yml', '.yaml', '.txt']);

function classifyFile(filePath) {
  if (['app.js', 'index.html', 'styles.css'].includes(filePath)) return 'frontend-core';
  if (['config.js', 'config.runtime.js', '.env.example'].includes(filePath)) return 'configuration';
  if (filePath.startsWith('src/domain/')) return 'domain';
  if (filePath.startsWith('src/application/')) return 'application';
  if (filePath.startsWith('src/data/')) return 'data';
  if (filePath.startsWith('src/integration/')) return 'integration';
  if (filePath.startsWith('src/styles/')) return 'styles';
  if (filePath.startsWith('tests/unit/')) return 'unit-tests';
  if (filePath.startsWith('tests/integration/')) return 'integration-tests';
  if (filePath.startsWith('tests/e2e/')) return 'e2e-tests';
  if (filePath.startsWith('tests/audit/')) return 'audit-tests';
  if (filePath.startsWith('supabase/migrations/')) return 'migrations';
  if (filePath.startsWith('supabase/tests/')) return 'database-tests';
  if (filePath.startsWith('.github/workflows/')) return 'workflows';
  if (filePath.startsWith('docs/')) return 'documentation';
  if (filePath.startsWith('scripts/')) return 'scripts';
  return 'other';
}

async function trackedFiles(rootDir) {
  const { stdout } = await execFileAsync('git', ['ls-files', '-z'], { cwd: rootDir, encoding: 'buffer' });
  return stdout.toString('utf8').split('\0').filter(Boolean).sort((a, b) => a.localeCompare(b));
}

async function inspectFile(rootDir, filePath) {
  const absolutePath = path.join(rootDir, filePath);
  const fileStat = await stat(absolutePath);
  const record = { path: filePath, category: classifyFile(filePath), bytes: fileStat.size };
  const extension = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(extension) || ['app.js', 'styles.css'].includes(filePath)) {
    const content = await readFile(absolutePath, 'utf8');
    record.lines = content === '' ? 0 : content.split(/\r?\n/).length;
  }
  return record;
}

function extractRuntimeExtensions(configSource) {
  return {
    styles: [...configSource.matchAll(/loadStylesheet\('([^']+)'\)/g)].map(match => match[1]),
    scripts: [...configSource.matchAll(/loadScript\('([^']+)'/g)].map(match => match[1])
  };
}

export async function generateRepositoryInventory(rootDir) {
  const [packageSource, configSource, paths] = await Promise.all([
    readFile(path.join(rootDir, 'package.json'), 'utf8'),
    readFile(path.join(rootDir, 'config.js'), 'utf8'),
    trackedFiles(rootDir)
  ]);
  const packageJson = JSON.parse(packageSource);
  const files = [];
  for (const filePath of paths) files.push(await inspectFile(rootDir, filePath));
  const categories = [...new Set(files.map(file => file.category))].sort();

  return {
    schemaVersion: 1,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      engines: packageJson.engines,
      scripts: Object.fromEntries(Object.entries(packageJson.scripts).sort(([a], [b]) => a.localeCompare(b))),
      devDependencies: Object.fromEntries(Object.entries(packageJson.devDependencies).sort(([a], [b]) => a.localeCompare(b)))
    },
    runtimeExtensions: extractRuntimeExtensions(configSource),
    supabase: { migrationCount: files.filter(file => file.category === 'migrations' && file.path.endsWith('.sql')).length },
    summaries: Object.fromEntries(categories.map(category => [category, files.filter(file => file.category === category).length])),
    files
  };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outputPath = path.join(rootDir, 'docs/evidence/global-baseline/repository-inventory.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(await generateRepositoryInventory(rootDir), null, 2)}\n`, 'utf8');
  console.log(`Inventário gravado em ${path.relative(rootDir, outputPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
