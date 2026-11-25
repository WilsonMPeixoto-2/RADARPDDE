'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const guidance = require('../../src/domain/operational-guidance.js');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
const codecNode = acorn.parse(appSource, { ecmaVersion: 'latest', sourceType: 'script' }).body
    .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'encodePendencyIdReference');
const encodePendencyIdReference = vm.runInNewContext('(' + appSource.slice(codecNode.start, codecNode.end) + ')');

function fixture(overrides = {}) {
    return {
        now: '2026-05-20T12:00:00Z', competence: '2026-05',
        schools: [{ id: 'ESC-A', denominação: 'Escola A', designação: '04.31.001', programasIds: ['BASIC', 'LEITURA'] }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }, { id: 'LEITURA', name: 'PDDE Leitura' }],
        capabilities: { fiscal: true, inventory: false }, encodePendencyIdReference,
        pendencies: [], invoices: [], assets: [], verifications: {}, ...overrides
    };
}
function pendency(id, overrides = {}) {
    return { id, escolaId: 'ESC-A', competenciaOrigem: '2026-05', programaId: 'BASIC',
        documentoKey: 'extCC', status: 'Aberta', responsavel: 'Escola', dataAbertura: '2026-04-01',
        historico: [], tentativas: [], ...overrides };
}
function invoice(id, overrides = {}) {
    return { id, escolaId: 'ESC-A', competencia: '2026-05', programaId: 'BASIC',
        compKey: '2026-05_BASIC', tipo: 'consumo', numero: id, analiseDocumentoFiscal: 'Não analisado', ...overrides };
}

test('fila distingue trabalho pronto para reanálise, providência externa e dois relógios reais', () => {
    const model = guidance.buildGuidance(fixture({ pendencies: [
        pendency('ABERTA', { historico: [{ tipo: 'reanalise_incorreta', dataHora: '2026-05-18T12:00:00Z' }] }),
        pendency('REANALISE', { status: 'Aguardando reanálise', tentativas: [{ id: 'ENVIO-REAL',
            status: 'aguardando', dataRegistro: '2026-05-10T12:00:00Z' }] })
    ] }));
    assert.equal(model.items[0].group, 'review');
    assert.equal(model.items[0].actor, 'Equipe de análise');
    assert.equal(model.items[0].stageDays, 10);
    assert.equal(model.items[0].historicDays, 49);
    assert.equal(model.items[1].group, 'follow_up');
    assert.equal(model.items[1].actor, 'Escola');
    assert.equal(model.items[1].stageDays, 2);
    assert.equal(model.items[1].historicDays, 49);
    assert.deepEqual(model.items[0].target, { entity: 'pendency', id: 'REANALISE', schoolId: 'ESC-A', competence: '2026-05', programId: 'BASIC' });
});

test('Pendências preservam IDs legados tipados, zero e referências hostis pelo codec existente', () => {
    const ids = [123, '123', 0, `pend-'/</div><img src=x onerror=alert(1)>`];
    const model = guidance.buildGuidance(fixture({ pendencies: ids.map(id => pendency(id)) }));
    assert.equal(model.items.length, ids.length);
    assert.equal(model.scope.duplicateIdentities, 0);
    assert.equal(new Set(model.items.map(item => item.key)).size, ids.length);
    for (const id of ids) {
        const item = model.items.find(candidate => candidate.target.id === id);
        assert.ok(item, `Referência ${encodePendencyIdReference(id)} preservada`);
        assert.ok(item.key.includes(encodePendencyIdReference(id)));
    }
    const duplicate = guidance.buildGuidance(fixture({ pendencies: [pendency(123), pendency(123), pendency('123')] }));
    assert.equal(duplicate.scope.duplicateIdentities, 1);
    assert.deepEqual(duplicate.items.map(item => item.target.id), ['123']);
});

test('datas ausentes, futuras e sem envio não viram prazo zero nem falsa duração de etapa', () => {
    const model = guidance.buildGuidance(fixture({ pendencies: [
        pendency('FUTURA', { dataAbertura: '2026-06-01' }),
        pendency('SEM-DATA', { dataAbertura: null }),
        pendency('SEM-ENVIO', { status: 'Aguardando reanálise' })
    ] }));
    assert.deepEqual(model.ages.historical, { total: 3, valid: 1, missing: 2, median: 49, p90: 49 });
    assert.deepEqual(model.ages.review, { total: 1, valid: 0, missing: 1, median: null, p90: null });
    assert.equal(model.items.find(item => item.target.id === 'SEM-ENVIO').stageDays, null);
    assert.equal(guidance.daysSince('texto inválido', '2026-05-20'), null);
});

test('mês e escolas delimitam o universo; registros de outro recorte não entram nos indicadores', () => {
    const model = guidance.buildGuidance(fixture({
        pendencies: [pendency('A'), pendency('OUTRA-ESCOLA', { escolaId: 'ESC-B' }), pendency('OUTRO-MES', { competenciaOrigem: '2026-04' })],
        invoices: [invoice('N-A'), invoice('N-B', { escolaId: 'ESC-B' }), invoice('N-04', { competencia: '2026-04' })],
        assets: [{ id: 'B-A', escolaId: 'ESC-A', competencia: '2026-05', status: 'Encaminhada' },
            { id: 'B-ANTIGO', escolaId: 'ESC-A', competencia: '2026-04', status: 'Não encaminhada' },
            { id: 'B-SEM-MES', escolaId: 'ESC-A', status: 'Encaminhada' }]
    }));
    assert.equal(model.scope.schoolCount, 1);
    assert.equal(model.scope.activePendencies, 1);
    assert.equal(model.scope.invoices, 1);
    assert.equal(model.scope.assets, 1);
    assert.equal(model.scope.undatedAssets, 1);
    assert.ok(model.items.every(item => item.schoolId === 'ESC-A' && item.competence === '2026-05'));
});

test('despesa A identificar não é classificada como nota com análise fiscal faltante', () => {
    const model = guidance.buildGuidance(fixture({ invoices: [
        invoice('IDENTIFICAR', { tipo: 'a_identificar', analiseDocumentoFiscal: 'Incorreto' }),
        invoice('FISCAL', { analiseConsultaAssessoria: 'Correto' })
    ] }));
    assert.equal(model.groups.find(group => group.id === 'identify').count, 1);
    assert.equal(model.groups.find(group => group.id === 'analysis').count, 1);
    assert.match(model.items.find(item => item.group === 'identify').reason, /provisório/);
    assert.match(model.items.find(item => item.group === 'analysis').reason, /independente/);
});

test('análise fiscal usa compatibilidade canônica da nota única sem copiar avaliação mensal para várias notas', () => {
    const legacy = invoice('LEGADA');
    delete legacy.analiseDocumentoFiscal;
    const one = fixture({ invoices: [legacy], verifications: { 'ESC-A': { '2026-05_BASIC': {
        analise: { notaFiscal: 'Correto' }, resultadoBonif: 'apta'
    } } } });
    assert.equal(guidance.buildGuidance(one).groups.find(group => group.id === 'analysis').count, 0);
    one.invoices.push({ ...legacy, id: 'SEGUNDA', numero: 'SEGUNDA' });
    const two = guidance.buildGuidance(one);
    assert.equal(two.groups.find(group => group.id === 'analysis').count, 2);
    assert.equal(two.scope.consolidatedContexts, 1);
    assert.equal(two.groups.find(group => group.id === 'bonus').count, 0);
});

test('Pendência fiscal ativa direciona para o caso existente; Assessoria não substitui a análise fiscal', () => {
    const model = guidance.buildGuidance(fixture({ invoices: [invoice('FISCAL'), invoice('ASSESSORIA')], pendencies: [
        pendency('P-FISCAL', { documentoKey: 'notaFiscal', registeredInvoiceId: 'FISCAL' }),
        pendency('P-ASS', { documentoKey: 'consAssessoria', registeredInvoiceId: 'ASSESSORIA' })
    ] }));
    const analysis = model.items.filter(item => item.group === 'analysis');
    assert.equal(analysis.length, 1);
    assert.equal(analysis[0].target.id, 'ASSESSORIA');
});

test('bonificação só considera contextos existentes e distingue preenchimento de consolidação', () => {
    const ready = { bonificacao: { extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica', encampInventario: 'Não se aplica', declBBAgil: 'Não se aplica' },
        analise: {}, resultadoBonif: '', bonificacaoPendenteConsolidacao: true };
    const source = fixture({ verifications: { 'ESC-A': { '2026-05_BASIC': ready } } });
    const model = guidance.buildGuidance(source);
    assert.equal(model.scope.existingContexts, 1);
    assert.equal(model.groups.find(group => group.id === 'bonus').count, 1);
    assert.equal(model.items[0].canConsolidate, true);
    assert.equal(model.items[0].target.contextKey, '2026-05_BASIC');
    assert.ok(!model.items.some(item => item.programId === 'LEITURA'));
    ready.bonificacao.extCC = '';
    const incomplete = guidance.buildGuidance(source).items[0];
    assert.equal(incomplete.canConsolidate, false);
    assert.match(incomplete.reason, /Extrato Conta Corrente/);
});

test('alterações pendentes pedem reconsolidação sem apagar ou descontar o resultado histórico', () => {
    const verification = { bonificacao: { extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica', encampInventario: 'Não se aplica', declBBAgil: 'Não se aplica' },
        resultadoBonif: 'apta', bonificacaoPendenteConsolidacao: true };
    const source = fixture({ verifications: { 'ESC-A': { '2026-05_BASIC': verification } } });
    const pending = guidance.buildGuidance(source);
    assert.equal(pending.scope.consolidatedContexts, 1);
    assert.equal(pending.scope.existingContexts, 1);
    assert.equal(pending.items.length, 1);
    assert.equal(pending.items[0].title, 'Consolidar alterações da bonificação');
    assert.equal(pending.items[0].canConsolidate, true);
    assert.match(pending.items[0].reason, /resultado histórico Apta continua registrado/);
    assert.ok(!pending.items.some(item => item.programId === 'LEITURA'));
    verification.bonificacao.extCC = '';
    assert.equal(guidance.buildGuidance(source).items[0].canConsolidate, false);
    assert.match(guidance.buildGuidance(source).items[0].reason, /respostas de entrega ainda faltantes: Extrato Conta Corrente/);
    verification.bonificacaoPendenteConsolidacao = false;
    const settled = guidance.buildGuidance(source);
    assert.equal(settled.items.length, 0);
    assert.equal(settled.scope.consolidatedContexts, 1);
    assert.equal(verification.resultadoBonif, 'apta');
});

test('Inventário vê apenas seu domínio, sem sugerir operações fiscais, e terminal não vira pendência', () => {
    const model = guidance.buildGuidance(fixture({ capabilities: { fiscal: false, inventory: true },
        pendencies: [pendency('P-FISCAL')], invoices: [invoice('N-FISCAL')],
        assets: [
            { id: 'B-AGUARDA', escolaId: 'ESC-A', competencia: '2026-05', status: 'Encaminhada', item: 'Mesa' },
            { id: 'B-TERMINAL', escolaId: 'ESC-A', competencia: '2026-05', status: 'Inventariada', item: 'Cadeira' }
        ]
    }));
    assert.equal(model.items.length, 1);
    assert.equal(model.items[0].group, 'inventory');
    assert.equal(model.items[0].actor, 'Inventário');
    assert.equal(model.scope.invoices, 0);
    assert.equal(model.scope.assets, 2);
    assert.equal(model.scope.activePendencies, 0);
});

test('Pendência manual mantém a área responsável registrada, sem atribuí-la à escola', () => {
    const model = guidance.buildGuidance(fixture({ pendencies: [pendency('MANUAL', {
        programaId: null, documentoKey: 'Outro', item: 'Ajuste administrativo', responsavel: 'Verbas Federais'
    })] }));
    assert.equal(model.items[0].actor, 'Verbas Federais');
    assert.match(model.items[0].reason, /providência de Verbas Federais/);
    assert.doesNotMatch(model.items[0].title, /Registrar novo envio/);
});

test('orientação é leitura pura, identidade ambígua não produz botão e nova chamada usa estado corrigido', () => {
    const source = fixture({ pendencies: [pendency('P-1')], invoices: [invoice('DUP'), invoice('DUP')] });
    const before = JSON.stringify(source);
    const first = guidance.buildGuidance(source);
    assert.equal(JSON.stringify(source), before);
    assert.equal(source.encodePendencyIdReference, encodePendencyIdReference);
    assert.equal(first.scope.duplicateIdentities, 1);
    assert.equal(first.items.length, 1);
    source.pendencies[0].status = 'Resolvida';
    assert.equal(guidance.buildGuidance(source).items.length, 0);
});

test('contextos de escolas diferentes têm sugestões distintas e nunca são fundidos por nome de programa', () => {
    const source = fixture({ schools: [{ id: 'ESC-A' }, { id: 'ESC-B' }], verifications: {
        'ESC-A': { '2026-05_BASIC': { bonificacao: { extCC: 'Sim' } } },
        'ESC-B': { '2026-05_BASIC': { bonificacao: { extCC: 'Sim' } } }
    } });
    const model = guidance.buildGuidance(source);
    assert.equal(model.items.length, 2);
    assert.equal(new Set(model.items.map(item => item.key)).size, 2);
    assert.equal(model.scope.existingContexts, 2);
});
