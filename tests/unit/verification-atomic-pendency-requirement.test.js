'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const { VerificationService } = require('../../src/application/verification-service.js');

function createHarness() {
    const verification = {
        bonificacao: { consAssessoria: 'Sim' },
        analise: { consAssessoria: 'Não analisado' },
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-ATOMIC': { '2026-08_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [],
        logs: []
    };
    const calls = [];
    const service = new VerificationService({
        dataService: {
            async execute(command) {
                calls.push(command.name);
                return { ok: true, value: await command.mutate() };
            }
        },
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => state.logs.push({ action, details }),
        getCurrentProfile: () => 'controlador',
        getCurrentDate: () => new Date('2026-08-23T12:00:00Z'),
        fluxo,
        retificacoes
    });
    return { service, state, calls, verification };
}

test('Assessoria agregada não pertence ao fluxo técnico genérico do VerificationService', async () => {
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-ATOMIC',
            compKey: '2026-08_BASIC',
            documentKey: 'consAssessoria',
            value: 'Incorreto',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(harness.verification.analise.consAssessoria, 'Não analisado');
    assert.equal(harness.state.pendencies.length, 0);
    assert.equal(harness.state.logs.length, 0);
    assert.equal(harness.calls.length, 0);
});
