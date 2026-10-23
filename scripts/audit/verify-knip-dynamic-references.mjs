// Ferramenta de diagnóstico, nunca remove arquivos.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'artifacts/tooling/knip-deep-baseline.json');
const report = JSON.parse(await readFile(source, 'utf8'));
if (!Array.isArray(report.issues)) throw new Error('JSON Knip sem issues.');
const loaders = [
  'config.js',
  'src/integration/product-extensions-bootstrap.js',
  'src/integration/exercise-management.js',
  'src/integration/mobile-navigation.js',
  'src/integration/navigation-routes.js',
  'src/integration/auth-gate.js'
];
const contents = await Promise.all(loaders.map(async loader => ({
  loader, content: await readFile(path.join(root, loader), 'utf8')
})));
function explicitlyReferenced(sourceText, file) {
  return ["'", '"', String.fromCharCode(96)].some(quote => (
    sourceText.includes(quote + file + quote)
    || sourceText.includes(quote + '/' + file + quote)
  ));
}
const files = [...new Set(report.issues.flatMap(issue =>
  (issue.files || []).map(item => item.name).filter(Boolean)
))].sort();
const classification = files.map(file => ({
  file,
  referencedBy: contents
    .filter(({content}) => explicitlyReferenced(content, file))
    .map(({loader}) => loader)
}));
const unresolved = classification.filter(item => item.referencedBy.length === 0);
const result = {
  baselineFileCount: files.length,
  dynamicReferencesFound: classification.length - unresolved.length,
  unresolvedCount: unresolved.length,
  classification,
  caution: 'Referência textual de loader não prova execução real nem ausência de código morto.'
};
const output = path.join(root, 'artifacts/tooling/knip-dynamic-classification.json');
await mkdir(path.dirname(output), {recursive: true});
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({
  files: files.length,
  referencedByDynamicLoaders: result.dynamicReferencesFound,
  unresolved: unresolved.map(x => x.file)
}, null, 2));
if (process.env.RADAR_EXPECT_KNIP_A1 === '1' &&
    (files.length !== 34 || unresolved.length !== 0)) {
  throw new Error('Contraprova da classificação A1 mudou: investigar diff antes de alterar Knip.');
}
