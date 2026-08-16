'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const { VerificationService } = require('../../src/application/verification-service.js');

const PAST_DATE = new Date(2026, 7, 16, 12, 0, 0);

test('domínio exige Correto (Atrasado) somente após não entrega consolidada', () => {
    assert.equal(typeof fluxo.requiresLateCorrect, 'function');

    assert.equal(fluxo.requiresLateCorrect({
        bonusResult: 'inapta',
        deliveryStatus: 'Não'
    }), true);
    assert.equal(fluxo.requiresLateCorrect({
        bonusResult: 'apta',
        deliveryStatus: 'Não'
    }), true);
    assert.equal(fluxo.requiresLateCorrect({
        bonusResult: '',
        deliveryStatus: 'Não'
    }), false);
    assert.equal(fluxo.requiresLateCorrect({
        bonusResult: 'apta',
        deliveryStatus: 'Sim'
    }), false);
});

function createHarness({ consolidated = true, deliveryStatus = 'Não' } = {}) {
    const verification = {
        bonificacao: { extCC: deliveryStatus },
        analise: { extCC: 'Não analisado' },
        resultadoBonif: consolidated ? 'inapta' : ''
    };
    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [],
        logs: []
    };
    const dataService = {
        async execute(command) {
            return { ok: true, value: await command.mutate() };
        }
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: () => ({ id: 'log-late' }),
        getCurrentDate: () => PAST_DATE
    });
    return { service, verification };
}

test('serviço rejeita Correto comum após bonificação consolidada com Não', async () => {
    const harness = createHarness({ consolidated: true, deliveryStatus: 'Não' });

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            profile: 'controlador',
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Correto'
        }),
        error => error?.code === 'LATE_ANALYSIS_REQUIRED'
    );

    assert.equal(harness.verification.analise.extCC, 'Não analisado');
});

test('serviço aceita Correto (Atrasado) após bonificação consolidada com Não', async () => {
    const harness = createHarness({ consolidated: true, deliveryStatus: 'Não' });

    await harness.service.setTechnicalAnalysis({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto (Atrasado)'
    });

    assert.equal(harness.verification.analise.extCC, 'Correto (Atrasado)');
});

test('Correto comum continua válido antes da consolidação ou quando entrega foi Sim', async () => {
    const notConsolidated = createHarness({ consolidated: false, deliveryStatus: 'Não' });
    await notConsolidated.service.setTechnicalAnalysis({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto'
    });
    assert.equal(notConsolidated.verification.analise.extCC, 'Correto');

    const deliveredOnTime = createHarness({ consolidated: true, deliveryStatus: 'Sim' });
    await deliveredOnTime.service.setTechnicalAnalysis({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto'
    });
    assert.equal(deliveredOnTime.verification.analise.extCC, 'Correto');
});
