import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { analyzeManifest, assertAnalysisCurrent, verifyPdfIdentity } from './analyze.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
function main() {
  const options = {};
  for (let index = 2; index < process.argv.length; index += 2) {
    const flag = process.argv[index];
    if (!['--manifest', '--output', '--target-exercise', '--previous-result'].includes(flag) || !process.argv[index + 1]) {
      throw new Error('Usage: --manifest <private.json> --output <private.json> --target-exercise <year> [--previous-result <private.json>]');
    }
    options[flag.slice(2)] = process.argv[index + 1];
  }
  if (!options.manifest || !options.output || !options['target-exercise']) throw new Error('Manifest, output and target exercise are required.');
  const started = performance.now();
  const manifest = JSON.parse(readFileSync(options.manifest, 'utf8'));
  for (const document of manifest.documents) {
    const bytes = readFileSync(document.source.path);
    verifyPdfIdentity(document, createHash('sha256').update(bytes).digest('hex'));
  }
  if (options['previous-result']) assertAnalysisCurrent(JSON.parse(readFileSync(options['previous-result'], 'utf8')), manifest);
  const analysis = analyzeManifest(manifest, { targetExercise: Number(options['target-exercise']) });
  analysis.execution = {
    node: process.version, generatedAt: new Date().toISOString(),
    extractionMs: manifest.elapsedMs, analysisAndByteVerificationMs: Number((performance.now() - started).toFixed(3)),
    extractor: manifest.extractor, currentPdfBytesVerified: true
  };
  const destination = path.resolve(options.output);
  mkdirSync(path.dirname(destination), { recursive: true });
  const physicalDirectory = realpathSync(path.dirname(destination));
  const relative = path.relative(root, physicalDirectory);
  if (!relative.startsWith(`..${path.sep}`) && relative !== '..') throw new Error('Private analysis output must be outside the Git repository.');
  const temporary = path.join(physicalDirectory, `.local-document-pilot-${process.pid}.json`);
  writeFileSync(temporary, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  renameSync(temporary, path.join(physicalDirectory, path.basename(destination)));
  process.stdout.write(`${JSON.stringify({ documents: analysis.documents.length, pairs: analysis.pairs.length,
    requiresHumanReview: true, privateOutputWritten: true, elapsedMs: analysis.execution.analysisAndByteVerificationMs })}\n`);
}

try {
  main();
} catch {
  // Never emit exception text: filesystem and JSON errors can contain private data.
  process.stderr.write(`${JSON.stringify({ error: 'local-document-analysis-failed',
    message: 'Check the local manifest, PDF inputs, arguments and private output permissions.' })}\n`);
  process.exitCode = 1;
}
