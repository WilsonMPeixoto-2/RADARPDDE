import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ENGINE = '24.x';
const MAJOR = '24';

function updateJson(relativePath, mutate) {
  const absolutePath = path.join(ROOT, relativePath);
  const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  mutate(data);
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

updateJson('package.json', packageJson => {
  packageJson.engines = { ...(packageJson.engines || {}), node: ENGINE };
});

updateJson('package-lock.json', lockfile => {
  if (!lockfile.packages?.['']) {
    throw new Error('package-lock.json sem pacote raiz');
  }
  lockfile.packages[''].engines = {
    ...(lockfile.packages[''].engines || {}),
    node: ENGINE
  };
});

fs.writeFileSync(path.join(ROOT, '.nvmrc'), `${MAJOR}\n`, 'utf8');
fs.writeFileSync(path.join(ROOT, '.node-version'), `${MAJOR}\n`, 'utf8');

console.log(`Runtime Node sincronizado para ${ENGINE}.`);
