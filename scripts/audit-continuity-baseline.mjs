#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'audit-output');
const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.sql', '.yml', '.yaml', '.toml', '.ini', '.env', '.example'
]);
const BUSINESS_TERMS = [
  'inventário', 'inventariacao', 'inventariação', 'nota fiscal', 'notas fiscais', 'pendência', 'pendencias', 'pendências',
  'assessoria', 'boleto_internet', 'boleto internet', 'a_identificar', 'bonificação', 'bonificacao', 'consolidação', 'consolidacao',
  'competência', 'competencia', 'controlador', 'assistente', 'inventario', 'sme', 'reload', 'recarregar', 'duplo clique', 'clique repetido'
];
const CURRENT_LANGUAGE = [
  /plano execut[aá]vel corrente/iu,
  /porta de entrada execut[aá]vel vigente/iu,
  /fila (?:execut[aá]vel )?atual/iu,
  /pr[oó]xima sequ[eê]ncia/iu,
  /o trabalho real come[cç]a/iu,
  /a frente ativa [ée]/iu
];
const SUPERSEDED_SIGNAL = /R1\s*[–-]\s*R9[\s\S]{0,260}(?:hist[oó]ric|n[aã]o deve ser executad[oa] literalmente)|(?:hist[oó]ric|n[aã]o deve ser executad[oa] literalmente)[\s\S]{0,260}R1\s*[–-]\s*R9/iu;

function gitFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function isText(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || pathname === 'AGENTS.md' || pathname === 'README.md' || pathname.endsWith('.env.example');
}

function readText(relative) {
  try {
    return fs.readFileSync(path.join(ROOT, relative), 'utf8');
  } catch {
    return null;
  }
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

function matchesAll(text, regex) {
  const result = [];
  for (const match of text.matchAll(regex)) result.push(match[1] ?? match[0]);
  return unique(result);
}

function firstMatch(text, regex) {
  const match = text.match(regex);
  return match ? String(match[1] ?? match[0]).trim() : null;
}

function markdownLinks(text) {
  const links = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, '');
    if (!raw || /^(?:https?:|mailto:|#)/i.test(raw)) continue;
    links.push({ target: raw.split('#')[0], line: lineNumberAt(text, match.index ?? 0) });
  }
  return links;
}

function resolveLink(source, target) {
  if (!target) return null;
  const normalized = path.normalize(path.join(path.dirname(source), target)).replaceAll('\\', '/');
  return normalized.replace(/^\.\//, '');
}

function documentMetadata(relative, text, trackedSet) {
  const links = markdownLinks(text).map(link => {
    const resolved = resolveLink(relative, link.target);
    return { ...link, resolved, exists: resolved ? trackedSet.has(resolved) : false };
  });
  const currentClaims = [];
  for (const regex of CURRENT_LANGUAGE) {
    for (const match of text.matchAll(new RegExp(regex.source, `${regex.flags.includes('g') ? regex.flags : regex.flags + 'g'}`))) {
      currentClaims.push({ text: match[0], line: lineNumberAt(text, match.index ?? 0) });
    }
  }
  return {
    path: relative,
    bytes: Buffer.byteLength(text),
    lines: text.split('\n').length,
    title: firstMatch(text, /^#\s+(.+)$/m),
    updated: firstMatch(text, /^\*\*(?:Atualizado em|Atualizado|Data):\*\*\s*(.+)$/mi),
    status: firstMatch(text, /^\*\*(?:Status|Situa[cç][aã]o):\*\*\s*(.+)$/mi),
    documentClass: firstMatch(text, /^\*\*(?:Classe documental|Classe):\*\*\s*(.+)$/mi),
    prs: matchesAll(text, /#(\d{1,4})\b/g).map(Number),
    adrs: matchesAll(text, /\bADR-(\d{3})\b/g).map(v => `ADR-${v}`),
    shas: matchesAll(text, /\b([0-9a-f]{7,40})\b/gi).filter(value => /[a-f]/i.test(value)),
    links,
    missingLinks: links.filter(link => !link.exists),
    currentClaims,
    mentionsR1R9: /\bR1\b[\s\S]{0,400}\bR9\b/u.test(text),
    explicitlyMarksR1R9Historical: SUPERSEDED_SIGNAL.test(text),
    ruleLines: text.split('\n').map((line, index) => ({ line: index + 1, text: line.trim() }))
      .filter(entry => entry.text && /(?:regra|decis[aã]o|contrato|guardrail|preservar|n[aã]o deve|proib|superad|vigente|can[oô]nic)/iu.test(entry.text))
      .slice(0, 500)
  };
}

function sourceMetadata(relative, text) {
  const operations = matchesAll(text, /\bname\s*:\s*['"]([^'"]+)['"]/g)
    .filter(value => /[:_-]/.test(value));
  const rpcs = unique([
    ...matchesAll(text, /executeRpc\(\s*['"]([^'"]+)['"]/g),
    ...matchesAll(text, /\.rpc\(\s*['"]([^'"]+)['"]/g),
    ...matchesAll(text, /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-zA-Z0-9_]+)/gi)
  ]);
  const tables = matchesAll(text, /\.from\(\s*['"]([^'"]+)['"]/g);
  const radarGlobals = matchesAll(text, /\b(?:root|window)\.(Radar[A-Za-z0-9_]+)/g);
  const statuses = unique([
    ...matchesAll(text, /['"](Não encaminhada|Encaminhada|Inventariada|Aberta|Aguardando reanálise|Resolvida|Cancelada|Não analisado|Correto|Incorreto|Não se aplica)['"]/g)
  ]);
  const terms = {};
  const lower = text.toLocaleLowerCase('pt-BR');
  for (const term of BUSINESS_TERMS) {
    const needle = term.toLocaleLowerCase('pt-BR');
    const count = lower.split(needle).length - 1;
    if (count > 0) terms[term] = count;
  }
  return {
    path: relative,
    bytes: Buffer.byteLength(text),
    lines: text.split('\n').length,
    operations,
    rpcs,
    tables,
    radarGlobals,
    statuses,
    businessTerms: terms
  };
}

function classify(relative) {
  if (/^(?:AGENTS\.md|README\.md|docs\/)/.test(relative)) return 'documentation';
  if (/^(?:src\/|app\.js$|index\.html$|styles\.css$|supabase\/migrations\/|supabase\/functions\/)/.test(relative)) return 'product-source';
  if (/^(?:tests\/|supabase\/tests\/|\.github\/workflows\/)/.test(relative)) return 'validation';
  if (/^(?:scripts\/)/.test(relative)) return 'tooling';
  return 'other';
}

const files = gitFiles();
const trackedSet = new Set(files);
const records = [];
const documents = [];
const sources = [];
const unreadableText = [];

for (const relative of files) {
  const absolute = path.join(ROOT, relative);
  const stat = fs.statSync(absolute);
  const category = classify(relative);
  const ext = path.extname(relative).toLowerCase();
  const record = { path: relative, category, bytes: stat.size, extension: ext || null };
  records.push(record);

  if (!isText(relative)) continue;
  const text = readText(relative);
  if (text == null) {
    unreadableText.push(relative);
    continue;
  }
  if (category === 'documentation') documents.push(documentMetadata(relative, text, trackedSet));
  if (['product-source', 'validation', 'tooling'].includes(category)) sources.push(sourceMetadata(relative, text));
}

const currentStage = documents.find(doc => doc.path === 'docs/CURRENT_STAGE.md');
const activeR1Claims = documents.flatMap(doc => doc.currentClaims
  .filter(claim => doc.mentionsR1R9 || /R1|source-first|fila|plano/i.test(claim.text))
  .map(claim => ({ path: doc.path, ...claim, historicalSignalInSameDoc: doc.explicitlyMarksR1R9Historical })));

const missingLinks = documents.flatMap(doc => doc.missingLinks.map(link => ({ source: doc.path, ...link })));
const docClasses = {};
for (const doc of documents) {
  const key = doc.documentClass || '(sem classe explícita)';
  docClasses[key] = (docClasses[key] || 0) + 1;
}
const categories = {};
for (const file of records) categories[file.category] = (categories[file.category] || 0) + 1;

const operationIndex = {};
const rpcIndex = {};
const statusIndex = {};
for (const source of sources) {
  for (const operation of source.operations) (operationIndex[operation] ||= []).push(source.path);
  for (const rpc of source.rpcs) (rpcIndex[rpc] ||= []).push(source.path);
  for (const status of source.statuses) (statusIndex[status] ||= []).push(source.path);
}
for (const index of [operationIndex, rpcIndex, statusIndex]) {
  for (const key of Object.keys(index)) index[key] = unique(index[key]);
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  git: {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  },
  summary: {
    trackedFiles: records.length,
    categories,
    documents: documents.length,
    productSourceFiles: sources.filter(source => classify(source.path) === 'product-source').length,
    validationFiles: sources.filter(source => classify(source.path) === 'validation').length,
    toolingFiles: sources.filter(source => classify(source.path) === 'tooling').length,
    unreadableText: unreadableText.length,
    missingInternalLinks: missingLinks.length,
    documentsWithCurrentR1Claims: activeR1Claims.length,
    distinctOperations: Object.keys(operationIndex).length,
    distinctRpcs: Object.keys(rpcIndex).length
  },
  authorityCheckpoint: {
    currentStageUpdated: currentStage?.updated || null,
    currentStageStatus: currentStage?.status || null,
    currentStageExplicitlyMarksR1R9Historical: currentStage?.explicitlyMarksR1R9Historical || false
  },
  files: records,
  documents,
  sources,
  indexes: { operationIndex, rpcIndex, statusIndex },
  findings: {
    missingLinks,
    activeR1Claims,
    unreadableText,
    documentClasses: docClasses
  }
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'continuity-baseline.json'), JSON.stringify(report, null, 2));

const md = [];
md.push('# Inventário mecânico para auditoria de continuidade', '');
md.push(`- HEAD: \`${report.git.head}\``);
md.push(`- Branch: \`${report.git.branch}\``);
md.push(`- Arquivos versionados: **${report.summary.trackedFiles}**`);
md.push(`- Documentos textuais indexados: **${report.summary.documents}**`);
md.push(`- Arquivos de código do produto indexados: **${report.summary.productSourceFiles}**`);
md.push(`- Arquivos de validação indexados: **${report.summary.validationFiles}**`);
md.push(`- Operações distintas encontradas: **${report.summary.distinctOperations}**`);
md.push(`- RPCs/funções distintas encontradas: **${report.summary.distinctRpcs}**`);
md.push(`- Links internos ausentes: **${report.summary.missingInternalLinks}**`);
md.push(`- Afirmações de execução corrente potencialmente relacionadas a R1–R9: **${report.summary.documentsWithCurrentR1Claims}**`, '');

md.push('## Categorias', '');
for (const [key, value] of Object.entries(categories).sort()) md.push(`- ${key}: ${value}`);
md.push('', '## Possíveis conflitos de continuidade', '');
if (!activeR1Claims.length) md.push('- Nenhum padrão automático encontrado.');
else for (const finding of activeR1Claims) md.push(`- \`${finding.path}:${finding.line}\` — ${finding.text}${finding.historicalSignalInSameDoc ? ' (o mesmo documento também contém sinal de superação)' : ''}`);

md.push('', '## Links internos ausentes', '');
if (!missingLinks.length) md.push('- Nenhum.');
else for (const finding of missingLinks.slice(0, 300)) md.push(`- \`${finding.source}:${finding.line}\` → \`${finding.target}\` (resolvido como \`${finding.resolved}\`)`);

md.push('', '## Índice de operações', '');
for (const [name, paths] of Object.entries(operationIndex).sort()) md.push(`- \`${name}\`: ${paths.map(item => `\`${item}\``).join(', ')}`);

md.push('', '## Índice de RPCs/funções', '');
for (const [name, paths] of Object.entries(rpcIndex).sort()) md.push(`- \`${name}\`: ${paths.map(item => `\`${item}\``).join(', ')}`);

fs.writeFileSync(path.join(OUT_DIR, 'continuity-baseline.md'), md.join('\n') + '\n');
console.log(JSON.stringify(report.summary, null, 2));
