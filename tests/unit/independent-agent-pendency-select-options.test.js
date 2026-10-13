'use strict';

/*
 * AUDITORIA INDEPENDENTE — OUTRO AGENTE (não Codex).
 * Evidência comportamental: opções do filtro escolar com/sem registros de Pendência.
 * Origem: contraprovas do PR #441. Contrato de opções reconciliado pelo agente
 * principal: catálogo completo da sessão, inclusive escolas sem Pendências.
 * Usa a função renderFilters ORIGINAL em VM Node, expondo-a exclusivamente
 * em memória. DOM/Authorization são simulados; Auth real em E2E separado.
 *
 * node --test tests/unit/independent-agent-pendency-select-options.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../src/integration/task-9-pendencias-page.js'), 'utf8'
);
const point = '    function installWhenReady() {';
assert.ok(source.includes(point), 'A localização do hook de instrumentação deve ser revisada quando Task9 mudar.');

// Não modifica o arquivo carregado da aplicação, apenas fornece acesso à
// função ORIGINAL renderFilters no contexto de execução do teste.
const instrumented = source.replace(point, [
  '    root.__independentRenderFilterHtml = (model, schoolId) => {',
  '        pageState.filters.schoolId = schoolId;',
  '        return renderFilters(model);',
  '    };',
  point
].join('\n'));

function buildInput() {
  const schools = [
    { id: 'ESC-LOCAL', denominacao: 'Escola Local Autorizada' },
    { id: 'ESC-OTHER', denominacao: 'Outra Escola' }
  ];
  const window = {
    document: { readyState: 'complete', addEventListener() {} },
    addEventListener() {},
    removeEventListener() {},
    // Instalação total da página não é o objetivo desta prova: renderFilters
    // é exposta exclusivamente no contexto VM como função original.
  };
  const context = vm.createContext({
    window, document: window.document,
    pendencias: [], escolas: schools, programas: [], controladores: [], contatos: [],
    escapeHtml: value => String(value),
    formatCompetenciaText: value => String(value)
  });
  vm.runInContext(instrumented, context, { filename: 'task-9-pendencias-page.js', timeout: 4000 });
  return window.__independentRenderFilterHtml;
}

function record(schoolId) {
  return {
    schoolId, schoolName: schoolId === 'ESC-LOCAL' ? 'Escola Local Autorizada' : 'Outra Escola',
    schoolDesignation: schoolId === 'ESC-LOCAL' ? '04.00.001' : '04.00.002',
    competence: '2026-05', programId: 'BASIC', programName: 'PDDE Básico',
    documentKey: 'notaFiscal', documentName: 'Nota Fiscal',
    errors: [], controllerId: 'controller-local', controllerName: 'Controlador Local'
  };
}

function schoolOptions(html) {
  const select = html.match(/<select id="pendency-filter-school"[\s\S]*?<\/select>/);
  assert.ok(select, 'O HTML real de Task9 deve conter o select escolar');
  return [...select[0].matchAll(/<option\b([^>]*)>/g)].map(match => {
    const attr = match[1];
    return {
      value: attr.match(/\bvalue="([^"]*)"/)?.[1] || '',
      selected: /\bselected(?:\s|$)/.test(attr)
    };
  });
}

test('CONTROLE: sem filtro ativo e sem Pendências exibe Todas selecionada', () => {
  const output = buildInput()({ records: [] }, '');
  const options = schoolOptions(output);
  assert.equal(options[0].selected, true);
  assert.deepEqual(options.map(option => option.value).sort(), ['', 'ESC-LOCAL', 'ESC-OTHER']);
});

test('CONTROLE: escola com Pendência é listada e selecionada', () => {
  const output = buildInput()({ records: [record('ESC-LOCAL')] }, 'ESC-LOCAL');
  const options = schoolOptions(output);
  assert.equal(options.find(option => option.value === 'ESC-LOCAL')?.selected, true);
});

test('contrato reconciliado: escola sem registro continua selecionável depois de limpar', () => {
  const output = buildInput()({ records: [record('ESC-OTHER')] }, '');
  const options = schoolOptions(output);
  assert.equal(options.some(option => option.value === 'ESC-LOCAL'), true);
  assert.equal(options[0].selected, true);
});

test('RED: escola do filtro autorizado não pode sumir do seletor quando não possui Pendências', () => {
  const output = buildInput()({ records: [] }, 'ESC-LOCAL');
  const options = schoolOptions(output);
  assert.equal(options.find(option => option.value === 'ESC-LOCAL')?.selected, true,
    'Escola selecionada deve ser representada como option mesmo com zero Pendências');
});

test('RED: escola do filtro não pode sumir quando há Pendências apenas de outras escolas', () => {
  const output = buildInput()({ records: [record('ESC-OTHER')] }, 'ESC-LOCAL');
  const options = schoolOptions(output);
  assert.equal(options.find(option => option.value === 'ESC-LOCAL')?.selected, true,
    'Opções calculadas de model.records não incluem a escola selecionada sem registros');
});

// Controles acrescentados pelo agente principal ao avaliar a proposta externa.
test('catálogo não inventa opção para identificador ausente', () => {
  const options = schoolOptions(buildInput()({ records: [] }, 'ESC-INEXISTENTE'));
  assert.equal(options.some(option => option.value === 'ESC-INEXISTENTE'), false);
});

test('escola selecionada já representada não ganha opção duplicada', () => {
  const options = schoolOptions(buildInput()({ records: [record('ESC-LOCAL')] }, 'ESC-LOCAL'));
  assert.equal(options.filter(option => option.value === 'ESC-LOCAL').length, 1);
});

// O catálogo da sessão é a autoridade das opções, não o histórico de registros.
test('registro sem escola no catálogo não amplia as opções', () => {
  const options = schoolOptions(buildInput()({ records: [record('ESC-FORA')] }, ''));
  assert.equal(options.some(option => option.value === 'ESC-FORA'), false);
});
