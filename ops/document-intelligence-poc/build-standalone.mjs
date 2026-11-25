// Package the same synthetic demonstration for offline review. No dependencies.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: node ops/document-intelligence-poc/build-standalone.mjs <output.html>');
const root = new URL('./', import.meta.url);
const [html, engine, fixture, readme] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('reconcile.mjs', root), 'utf8'),
  readFile(new URL('fixtures/synthetic-case.json', root), 'utf8'),
  readFile(new URL('README.md', root), 'utf8')
]);
const importLine = "import { reconcileBundle, reviewProposal } from './reconcile.mjs';";
const loadLines = /const response = await fetch\('\.\/fixtures\/synthetic-case\.json'\);\s*if \(!response.ok\) throw new Error\('[^']+'\);\s*bundle = await response.json\(\);/;
if (!html.includes(importLine) || !loadLines.test(html)) throw new Error('Prototype structure changed; review standalone packaging.');
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const embeddedFixture = JSON.stringify(JSON.parse(fixture)).replaceAll('<', '\\u003c');
const output = html
  .replace(importLine, () => engine.replace(/^export /gm, ''))
  .replace(loadLines, () => `bundle = ${embeddedFixture};`)
  .replace('href="README.md"', 'href="#method"')
  .replace('</main>', `<details id="method" class="panel"><summary>Método e limites da demonstração</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit">${escapeHtml(readme)}</pre></details>\n  </main>`);
await writeFile(resolve(destination), output);
console.log(`Standalone demonstration written (${Buffer.byteLength(output)} bytes).`);
