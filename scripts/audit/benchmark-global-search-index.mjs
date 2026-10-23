import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Fuse = require('fuse.js');
const {
  createSearchCatalog,
  createSearchEngine,
  searchCatalog
} = require('../../src/domain/global-search-index.js');

// Massa FICTICIA: mesmo numero de escolas da 4ª CRE, sem dados de Production.
// A contagem de pendencias e uma carga de estresse, nao uma contagem institucional.
const schools = Array.from({ length: 163 }, (_, i) => {
  const number = String(i + 1).padStart(3, '0');
  const id = '04.31.' + number;
  return {
    id,
    'denominação': 'Escola Municipal Unidade ' + number,
    'designação': id,
    programasIds: i % 2 === 0 ? ['BASIC', 'CONECTADA'] : ['BASIC']
  };
});
const pendencies = Array.from({ length: 400 }, (_, i) => ({
  id: 'P-SYN-' + String(i + 1).padStart(3, '0'),
  escolaId: schools[i % schools.length].id,
  documento: 'Pendencia documental sintetica ' + String(i + 1).padStart(3, '0'),
  status: i % 3 === 0 ? 'Aberta' : 'Aguardando reanálise',
  programaId: i % 2 === 0 ? 'BASIC' : 'CONECTADA',
  competencia: '2026-05'
}));
const context = {
  schools,
  pendencies,
  programs: [
    { id: 'BASIC', name: 'PDDE Basico' },
    { id: 'CONECTADA', name: 'Educacao Conectada' }
  ],
  competencies: [{ id: '2026-05', label: 'Maio de 2026' }],
  modules: [{ id: 'dashboard', title: 'Dashboard', visible: true }],
  allowedSchoolIds: schools.map(s => s.id)
};
const queries = [
  'unidade 021', 'unidade 122', 'pendencia documental 047',
  'educacao conectada', 'dashboard', 'maio 2026',
  'unidade 013', 'pendencia 300'
];
const resultIds = (engine, query) =>
  searchCatalog(engine, query, 8).map(item => item.id);

function rebuildEveryQuery() {
  const results = [];
  for (const query of queries) {
    const catalog = createSearchCatalog(context);
    const engine = createSearchEngine(Fuse, catalog);
    results.push(resultIds(engine, query));
  }
  return results;
}

function reuseWithinStableContext() {
  const catalog = createSearchCatalog(context);
  const engine = createSearchEngine(Fuse, catalog);
  return queries.map(query => resultIds(engine, query));
}
const baselineResults = rebuildEveryQuery();
assert.deepEqual(reuseWithinStableContext(), baselineResults,
  'Mesmo indice deve preservar exatamente identidades e ranking em todos os termos');
assert.ok(baselineResults.some(items => items.length > 0),
  'Conjunto de consultas deve conter correspondencias reais');

// Mudanca de escopo: reuso exige reconstruir o indice apos troca de permissao.
const restricted = { ...context, allowedSchoolIds: schools.slice(0, 21).map(s => s.id) };
const allowed = createSearchCatalog(restricted);
assert.equal(allowed.some(x => x.id === 'school:04.31.022'), false);
assert.equal(allowed.some(x => x.id === 'pendency:P-SYN-022'), false);

// Mudanca de pendencia: indice velho NAO reflete o estado novo; invalidacao e obrigatoria.
const catalogBefore = createSearchCatalog(context);
const staleEngine = createSearchEngine(Fuse, catalogBefore);
const marker = 'Documento Exclusivo Reanalise ZXQ777';
assert.equal(resultIds(staleEngine, marker).length, 0);
const modified = {
  ...context,
  pendencies: context.pendencies.map((p, i) =>
    i === 0 ? { ...p, documento: marker } : p)
};
const refreshedEngine = createSearchEngine(Fuse, createSearchCatalog(modified));
assert.deepEqual(resultIds(refreshedEngine, marker), ['pendency:P-SYN-001']);
assert.equal(resultIds(staleEngine, marker).length, 0,
  'Controle negativo: sem invalidacao, nova pendencia nao aparece');

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
}
function timing(fn) {
  const start = performance.now();
  const results = fn();
  return { ms: performance.now() - start, results };
}
// Warmup deliberado; sem impor metas temporais em maquina CI desconhecida.
for (let i=0; i<4; i++) { rebuildEveryQuery(); reuseWithinStableContext(); }
const rebuild = [], reuse = [];
for (let i=0; i<24; i++) {
  // Alternancia de ordem limita vies sistematico de aquecimento.
  if (i % 2 === 0) {
    const a=timing(rebuildEveryQuery); rebuild.push(a.ms);
    const b=timing(reuseWithinStableContext); reuse.push(b.ms);
    assert.deepEqual(a.results, b.results);
  } else {
    const b=timing(reuseWithinStableContext); reuse.push(b.ms);
    const a=timing(rebuildEveryQuery); rebuild.push(a.ms);
    assert.deepEqual(a.results, b.results);
  }
}
const rebuildMedian = median(rebuild);
const reuseMedian = median(reuse);
const report = {
  label: 'A8_DIAGNOSTICO_SINTETICO_NAO_PRODUCTION',
  scenario: { schools:schools.length, pendencies:pendencies.length, queries:queries.length,
    iterations:rebuild.length, engine:'Fuse.js 7.5.0' },
  controls: {
    sameResultsAndOrder:true, scopeFiltered:true,
    staleIndexDetected:true, newPendencyDetectedAfterRebuild:true
  },
  node:process.version,
  medianMs: {
    buildCatalogAndIndexEachQuery:Number(rebuildMedian.toFixed(3)),
    buildOncePerStableContext:Number(reuseMedian.toFixed(3))
  },
  observedRatio:Number((rebuildMedian/reuseMedian).toFixed(3)),
  limitations:[
    'Massa sintetica e CPU de GitHub Runner, nao medicao browser/DOM/usuario real.',
    'Indice unico so e valido entre eventos de alteracao de dados/escopo/sessao.',
    'Nao valida politica completa de invalidacao, logout ou races; sem runtime alterado.',
    'Tempos de sequencias de 8 queries; a amostra nao representa p95 populacional.'
  ]
};
console.log(JSON.stringify(report, null, 2));
