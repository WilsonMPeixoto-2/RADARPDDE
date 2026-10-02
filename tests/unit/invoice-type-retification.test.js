'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InvoiceService } = require('../../src/application/invoice-service.js');
const { protectInvoiceService } = require('../../src/integration/auditable-retification.js');

function harness({ type = 'consumo', status = 'Resolvida', documentKey = 'notaFiscal', assetStatus = 'Encaminhada', profile = 'controlador', beforeMutate } = {}) {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', processoInventario: 'PROC-1' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: { 'ESC-1': { '2026-05_BASIC': {
            rowVersion: 8, bonificacao: { notaFiscal: 'Não', extCC: 'Sim', consAssessoria: 'Não se aplica', encampInventario: 'Não se aplica' },
            analise: { notaFiscal: 'Correto', consAssessoria: 'Correto', encampInventario: 'Correto' }, resultadoBonif: 'APTA'
        } } },
        registeredInvoices: [{ id: 'NF-1', escolaId: 'ESC-1', compKey: '2026-05_BASIC',
            competencia: '2026-05', programaId: 'BASIC', tipo: type, numero: '123', desc: 'Lançamento',
            descricao: 'Lançamento', valor: 150, bemId: type === 'permanente' ? 'BEM-1' : null,
            analiseDocumentoFiscal: 'Correto', rowVersion: 3, dataRegistro: '2026-05-01T12:00:00Z'
        }],
        assets: type === 'permanente' ? [{ id: 'BEM-1', escolaId: 'ESC-1', competencia: '2026-05',
            item: 'PDDE Básico - Lançamento', descricao: 'PDDE Básico - Lançamento', tipo: 'permanente',
            valor: 150, notaFiscal: '123', status: assetStatus, processoInventario: 'PROC-1', rowVersion: 4
        }] : [],
        pendencies: [{ id: 'PEND-1', registeredInvoiceId: 'NF-1', documentoKey: documentKey, status,
            documentSnapshot: { tipo: type, numero: '123', valor: 150 }, historico: [{ id: 'EVENT-1', tipo: 'abertura' }]
        }],
        logs: []
    };
    const commands = [];
    const service = new InvoiceService({
        getState: () => state,
        dataService: { async execute(command) {
            commands.push(command);
            beforeMutate?.(state);
            return { ok: true, value: await command.mutate() };
        } },
        getCurrentProfile: () => profile,
        appendLog(action, details) { const log = { id: 'LOG-1', action, details }; state.logs.push(log); return log; },
        now: () => '2026-10-01T20:00:00Z'
    });
    protectInvoiceService(service);
    const save = (expenseType, extra = {}) => service.save({
        id: 'NF-1', schoolId: 'ESC-1', compKey: '2026-05_BASIC', description: 'Lançamento',
        invoiceNumber: '123', amount: 150, expenseType, profile: 'controlador', ...extra
    });
    return { state, commands, service, save };
}

for (const status of ['Resolvida', 'Cancelada']) {
    for (const [from, to] of [['consumo', 'servico'], ['servico', 'consumo'], ['consumo', 'permanente'], ['permanente', 'servico'], ['servico', 'permanente'], ['permanente', 'consumo']]) {
        test(`corrige ${from} → ${to} com histórico fiscal ${status}, preservando histórico e bonificação`, async () => {
            const h = harness({ type: from, status });
            const history = structuredClone(h.state.pendencies);
            const bonus = structuredClone(h.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao);
            const result = await h.save(to);
            assert.equal(result.ok, true);
            assert.equal(h.state.registeredInvoices[0].id, 'NF-1');
            assert.equal(h.state.registeredInvoices[0].tipo, to);
            assert.deepEqual(h.state.pendencies, history);
            assert.equal(h.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao.notaFiscal, bonus.notaFiscal);
            assert.equal(h.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao.extCC, bonus.extCC);
            assert.equal(h.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif, 'APTA');
            assert.match(h.state.logs[0].details, new RegExp(`Tipo de gasto: ${from} → ${to}`));
            assert.match(h.state.logs[0].details, /NF-1/);
            assert.equal(result.value.expectedVersions.invoice, 3);
            assert.equal(result.value.expectedVersions.verification, 8);
            if (from === 'permanente') {
                assert.equal(result.value.expectedVersions.asset, 4);
                assert.equal(result.value.removedAsset.id, 'BEM-1');
                assert.equal(h.state.assets.length, 0);
            }
            if (to === 'permanente') {
                assert.equal(h.state.assets.length, 1);
                assert.equal(h.state.assets[0].id, h.state.registeredInvoices[0].bemId);
                assert.equal(h.state.assets[0].status, 'Encaminhada');
            }
            if (to === 'servico') {
                assert.equal(h.state.registeredInvoices[0].consultaAssessoriaEnviada, false);
                assert.equal(h.state.registeredInvoices[0].analiseConsultaAssessoria, 'Não analisado');
            }
        });
    }
}

for (const status of ['Aberta', 'Aguardando reanálise']) {
    test(`não corrige tipo com Pendência fiscal ${status}, mas permite dados cadastrais`, async () => {
        const h = harness({ status });
        const before = structuredClone(h.state);
        await assert.rejects(() => h.save('servico'), error => error.code === 'INVOICE_HISTORY_LOCKED');
        assert.deepEqual(h.state, before);
        await h.save('consumo', { amount: 160 });
        assert.equal(h.state.registeredInvoices[0].valor, 160);
        assert.equal(h.state.pendencies[0].status, status);
    });
}
for (const status of ['Resolvida', 'Cancelada']) {
    test(`histórico de Assessoria ${status} continua bloqueando tipo`, async () => {
        const h = harness({ type: 'servico', status, documentKey: 'consAssessoria' });
        const before = structuredClone(h.state);
        await assert.rejects(() => h.save('consumo'), error => error.code === 'INVOICE_HISTORY_LOCKED');
        assert.deepEqual(h.state, before);
    });
}

test('histórico fiscal encerrado não libera mudança de contexto ou exclusão', async () => {
    const h = harness();
    for (const target of [
        { schoolId: 'ESC-2' }, { compKey: '2026-06_BASIC' }, { compKey: '2026-05_OTHER' }
    ]) {
        await assert.rejects(() => h.save('servico', target), error => error.code === 'INVOICE_HISTORY_LOCKED');
    }
    await assert.rejects(() => h.service.remove({ id: 'NF-1', schoolId: 'ESC-1', profile: 'controlador' }),
        error => error.code === 'INVOICE_HISTORY_LOCKED');
    assert.equal(h.commands.length, 0);
});

test('a_identificar continua exigindo identificação pela Pendência, mesmo encerrada', async () => {
    const h = harness({ type: 'a_identificar' });
    await assert.rejects(() => h.save('consumo'), error => error.code === 'UNIDENTIFIED_EXPENSE_WORKFLOW_REQUIRED');
    assert.equal(h.commands.length, 0);
});

test('não converte permanente com bem Inventariada nem altera patrimônio', async () => {
    const h = harness({ type: 'permanente', assetStatus: 'Inventariada' });
    const before = structuredClone(h.state);
    await assert.rejects(() => h.save('servico'), error => error.code === 'INVOICE_HISTORY_LOCKED');
    assert.deepEqual(h.state, before);
    assert.equal(h.commands.length, 0);
});

test('reconfere o histórico ao aplicar a mutação se outra Pendência surgir após planejamento', async () => {
    const h = harness({ beforeMutate(state) { state.pendencies.push({
        id: 'PEND-2', registeredInvoiceId: 'NF-1', documentoKey: 'notaFiscal', status: 'Aberta'
    }); } });
    await assert.rejects(() => h.save('servico'), error => error.code === 'INVOICE_HISTORY_LOCKED');
    assert.equal(h.state.registeredInvoices[0].tipo, 'consumo');
    assert.equal(h.state.logs.length, 0);
});

test('tipo permanece protegido quando versão ou estado histórico são desconhecidos', async () => {
    for (const invalid of ['version', 'status']) {
        const h = harness();
        if (invalid === 'version') delete h.state.registeredInvoices[0].rowVersion;
        else h.state.pendencies[0].status = 'Desconhecido';
        await assert.rejects(() => h.save('servico'), error => error.code === 'INVOICE_HISTORY_LOCKED');
        assert.equal(h.commands.length, 0);
    }
});

test('flexibilização não concede escrita aos perfis de consulta ou Inventário', async () => {
    for (const profile of ['sme', 'inventario']) {
        const h = harness({ profile });
        await assert.rejects(() => h.save('servico', { profile }), error => error.code === 'FORBIDDEN');
        assert.equal(h.commands.length, 0);
    }
});

