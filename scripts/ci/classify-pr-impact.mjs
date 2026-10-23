// Piloto isolado A5. Classificador conservador, sem alterar workflows.
// "full" e o padrao seguro diante de qualquer incerteza.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const KNIP_SCRIPT_KEY = 'analyze:unused:deep';
const KNIP_SCRIPT_VALUE = 'node scripts/audit/inspect-knip-deep.mjs && node scripts/audit/verify-knip-dynamic-references.mjs';
const SAFE_TOOLING_PATHS = new Set([
  'scripts/audit/inspect-knip-deep.mjs',
  'scripts/audit/verify-knip-dynamic-references.mjs'
]);

function docsOnlyPath(path) {
  return (/^docs\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.md$/).test(path)
    || /^(?:README|CONTRIBUTING|CHANGELOG)\.md$/.test(path);
}

function knipScriptOnlyChange(before, after) {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return false;
  if (!before.scripts || !after.scripts) return false;
  const originalScripts = {...before.scripts};
  const updatedScripts = {...after.scripts};
  // Nao aceitar alteracao de uma script existente, mesmo parecendo tooling.
  if (Object.hasOwn(originalScripts, KNIP_SCRIPT_KEY)) return false;
  if (updatedScripts[KNIP_SCRIPT_KEY] !== KNIP_SCRIPT_VALUE) return false;
  delete updatedScripts[KNIP_SCRIPT_KEY];
  const originalOther = {...before};
  const updatedOther = {...after};
  delete originalOther.scripts;
  delete updatedOther.scripts;
  return JSON.stringify(originalScripts) === JSON.stringify(updatedScripts)
    && JSON.stringify(originalOther) === JSON.stringify(updatedOther);
}

/**
 * @param {string[]} paths caminhos mudados por merge-base...HEAD
 * @param {{beforePackage?: object|null, afterPackage?: object|null}} options
 */
export function classifyDiff(paths, {beforePackage = null, afterPackage = null} = {}) {
  if (!Array.isArray(paths) || paths.length === 0 || paths.some(x => typeof x !== 'string' || !x)) {
    return {scope:'full', reason:'diff vazio ou invalido; executar verificacao completa'};
  }
  const unique = [...new Set(paths)];
  const unknown = unique.filter(path => !docsOnlyPath(path)
    && !SAFE_TOOLING_PATHS.has(path)
    && path !== 'package.json');
  if (unknown.length) {
    return {scope:'full', reason:'mudanca fora da allowlist; verificacao completa', examples:unknown.slice(0,5)};
  }
  if (unique.includes('package.json') && !knipScriptOnlyChange(beforePackage, afterPackage)) {
    return {scope:'full', reason:'package.json alterado alem de script Knip exato ou contexto incompleto'};
  }
  const tooling = unique.some(x => SAFE_TOOLING_PATHS.has(x) || x === 'package.json');
  return {scope:tooling ? 'tooling-only' : 'docs-only', reason:tooling
    ? 'somente diagnostico Knip conhecido e documentos'
    : 'somente arquivos Markdown documentais', fileCount:unique.length};
}

function git(...args) {
  return execFileSync('git', args, {encoding:'utf8',maxBuffer:16*1024*1024});
}
function packageAt(ref) {
  try { return JSON.parse(git('show', ref + ':package.json')); }
  catch { return null; } // Ausencia de dados nunca autoriza pular teste.
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const baseRef = process.env.RADAR_CI_BASE_REF || 'origin/main';
    // Invariantes: base remota ja buscada, diff de tres pontos.
    const baseSha = git('merge-base', baseRef, 'HEAD').trim();
    if (!/^[0-9a-f]{40}$/.test(baseSha)) throw new Error('merge-base nao encontrado');
    const files = git('diff','--name-only','--diff-filter=ACMRD',baseSha,'HEAD').trim().split('\n').filter(Boolean);
    const result = classifyDiff(files, {
      beforePackage: files.includes('package.json') ? packageAt(baseSha) : null,
      afterPackage: files.includes('package.json') ? packageAt('HEAD') : null
    });
    console.log(JSON.stringify({...result,files},null,2));
  } catch (error) {
    console.log(JSON.stringify({scope:'full',reason:'falha ao calcular diff; verificacao completa',
      detail:String(error?.message||error).slice(0,200)},null,2));
  }
}
