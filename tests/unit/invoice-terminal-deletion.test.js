'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InvoiceService } = require('../../src/application/invoice-service.js');

function harness(status = 'Inventariada', gate = Promise.resolve()) {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', processoInventario: 'PROC-1' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        registeredInvoices: [{ id: 'NF-1', escolaId: 'ESC-1', compKey: '2026-05_BASIC',
            competencia: '2026-05', programaId: 'BASIC', tipo: 'permanente',
            numero: '100', desc: 'Equipamento', valor: 900, bemId: 'BEM-1', rowVersion: 2 }],
        assets: [{ id: 'BEM-1', escolaId: 'ESC-1', competencia: '2026-05',
            tipo: 'permanente', status, valor: 900, notaFiscal: '100', rowVersion: 3,
            inventariadorId: 'INV-1', dataInventariacao: '2026-05-20T12:00:00Z' }],
        verifications: { 'ESC-1': { '2026-05_BASIC': {
            bonificacao: { notaFiscal: 'Sim', encampInventario: 'Sim' },
            analise: { notaFiscal: 'Correto', encampInventario: 'Correto' },
            resultadoBonif: 'APTA'
        } } },
        pendencies: [], logs: []
    };
    const calls = { queued: 0, persisted: 0 };
    const service = new InvoiceService({
        getState: () => state,
        dataService: { async execute(command) {
            calls.queued++;
            await gate;
            const value = await command.mutate();
            calls.persisted++;
            return { ok: true, value };
        } },
        appendLog(action, details) {
            const log = { id: 'LOG-1', action, details };
            state.logs.push(log);
            return log;
        }
    });
    return { state, calls, service, remove: () => service.remove({
        id: 'NF-1', schoolId: 'ESC-1', profile: 'controlador'
    }) };
}

test('exclusão de NF inventariada é recusada antes de fila, mutação e persistência', async () => {
    const h = harness();
    const before = structuredClone(h.state);
    await assert.rejects(h.remove, error => error.code === 'ASSET_ALREADY_INVENTORIED');
    assert.deepEqual(h.state, before);
    assert.deepEqual(h.calls, { queued: 0, persisted: 0 });
});

for (const replaceLink of [false, true]) {
    test(`reconfere patrimônio ao executar remoção enfileirada (vínculo trocado: ${replaceLink})`, async () => {
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const h = harness('Encaminhada', gate);
        const pending = h.remove();
        assert.equal(h.calls.queued, 1);
        // Outra operação aplica objetos novos, como o StatePort; não modificar
        // o objeto capturado pelo plano antigo e produzir um falso GREEN.
        const assetId = replaceLink ? 'BEM-2' : 'BEM-1';
        h.state.assets = [{ ...h.state.assets[0], id: assetId, status: 'Inventariada', rowVersion: 4 }];
        h.state.registeredInvoices = [{ ...h.state.registeredInvoices[0], bemId: assetId }];
        const committed = structuredClone(h.state);
        const rejected = assert.rejects(pending, error => error.code === 'ASSET_ALREADY_INVENTORIED');
        release();
        await rejected;
        assert.deepEqual(h.state, committed, 'preserva a inventariação já confirmada e todas as projeções');
        assert.equal(h.calls.persisted, 0);
    });
}

for (const status of ['Não encaminhada', 'Encaminhada']) {
    test(`exclusão elegível continua removendo NF e bem ${status}`, async () => {
        const h = harness(status);
        const result = await h.remove();
        assert.equal(result.ok, true);
        assert.equal(h.state.assets.length, 0);
        assert.equal(h.state.registeredInvoices.length, 0);
        assert.equal(h.state.logs.length, 1);
        assert.equal(h.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif, 'APTA');
        assert.equal(h.calls.persisted, 1);
    });
}
