'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const competencia = require('../../src/domain/competencia.js');
const { VerificationService } = require('../../src/application/verification-service.js');

const REFERENCE_DATE = new Date(2026, 7, 16, 12, 0, 0);

test('identifica competência futura em relação ao mês civil local de referência', () => {
    assert.equal(typeof competencia.isFutureCompetence, 'function');
    assert.equal(competencia.isFutureCompetence('2026-07', REFERENCE_DATE), false);
    assert.equal(competencia.isFutureCompetence('2026-08', REFERENCE_DATE), false);
    assert.equal(competencia.isFutureCompetence('2026-09', REFERENCE_DATE), true);
    assert.equal(competencia.isFutureCompetence('2026-12_BASIC', REFERENCE_DATE), true);
    assert.equal(competencia.isFutureCompetence('2027-01', REFERENCE_DATE), true);
});

function createServiceHarness() {
    const currentVerification = {
        bonificacao: { extCC: '' },
        analise: { extCC: 'Não analisado' },
        resultadoBonif: ''
    };
    const futureVerification = structuredClone(currentVerification);
    const state = {
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': currentVerification,
                '2026-09_BASIC': futureVerification
            }
        },
        registeredInvoices: [],
        pendencies: [],
        logs: []
    };
    let executeCalls = 0;
    const dataService = {
        async execute(command) {
            executeCalls += 1;
            return { ok: true, value: await command.mutate() };
        }
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: (schoolId, compKey) => state.verifications[schoolId][compKey],
        appendLog: () => ({ id: 'log-temporal' }),
        getCurrentDate: () => REFERENCE_DATE
    });
    return { service, currentVerification, futureVerification, getExecuteCalls: () => executeCalls };
}

test('VerificationService rejeita gravação em competência futura antes de iniciar persistência', async () => {
    const harness = createServiceHarness();

    await assert.rejects(
        () => harness.service.setBonification({
            profile: 'controlador',
            schoolId: 'ESC-1',
            compKey: '2026-09_BASIC',
            documentKey: 'extCC',
            value: 'Sim'
        }),
        error => error?.code === 'FUTURE_COMPETENCE'
    );

    assert.equal(harness.getExecuteCalls(), 0);
    assert.equal(harness.futureVerification.bonificacao.extCC, '');
});

test('VerificationService mantém competência corrente editável', async () => {
    const harness = createServiceHarness();

    await harness.service.setBonification({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        documentKey: 'extCC',
        value: 'Sim'
    });

    assert.equal(harness.getExecuteCalls(), 1);
    assert.equal(harness.currentVerification.bonificacao.extCC, 'Sim');
});
