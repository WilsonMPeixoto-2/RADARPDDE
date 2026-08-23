'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const { VerificationService } = require('../../src/application/verification-service.js');

function createHarness(currentProfile = '') {
    const verification = {
        bonificacao: {
            extCC: '',
            extINV: '',
            notaFiscal: '',
            consAssessoria: '',
            declBBAgil: '',
            encampInventario: ''
        },
        analise: {
            extCC: 'Não analisado',
            extINV: 'Não analisado',
            notaFiscal: 'Não analisado',
            consAssessoria: 'Não analisado',
            declBBAgil: 'Não analisado',
            encampInventario: 'Não analisado'
        },
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Um' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        logs: []
    };
    const calls = [];
    const dataService = {
        async execute(command) {
            calls.push(command);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    let id = 0;
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => state.logs.unshift({ action, details }),
        getCurrentUser: () => ({ name: 'Assistente Teste', role: 'Assistente CRE' }),
        getCurrentProfile: () => currentProfile,
        createId: prefix => `${prefix}-${++id}`,
        now: () => '2026-07-14T12:00:00.000Z',
        fluxo,
        retificacoes,
        reopenConsolidation: (_schoolId, _compKey, target, changed) => {
            if (changed) target.resultadoBonif = '';
        }
    });
    return { state, calls, verification, service };
}

test('perfil SME autenticado não eleva acesso informando outro perfil na chamada', async () => {
    const harness = createHarness('sme');

    await assert.rejects(
        () => harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Sim',
            profile: 'controlador'
        }),
        error => error?.code === 'FORBIDDEN'
    );
    await assert.rejects(
        () => harness.service.retify({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            programId: 'BASIC',
            bonification: { extCC: 'Não' },
            bonusResult: 'inapta',
            justification: 'Tentativa indevida.',
            profile: 'assistente'
        }),
        error => error?.code === 'FORBIDDEN'
    );
    assert.equal(harness.calls.length, 0);
});

test('altera bonificação e aplica dependências de N/A sem duplicar a regra operacional', async () => {
    const harness = createHarness();

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Não se aplica',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.notaFiscal, 'Não se aplica');
    assert.equal(result.value.verification.bonificacao.encampInventario, 'Não se aplica');
    assert.equal(result.value.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.value.verification.analise.notaFiscal, 'Correto');
    assert.equal(harness.state.logs[0].action, 'Bonificação Alterada');
});

test('ao sair de N/A para Sim reinicializa a análise de Nota Fiscal', async () => {
    const harness = createHarness();
    await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Não se aplica',
        profile: 'controlador'
    });

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Sim',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.notaFiscal, 'Sim');
    assert.equal(result.value.verification.analise.notaFiscal, 'Não analisado');
});

test('ao sair de N/A para Não reinicializa a análise de Nota Fiscal', async () => {
    const harness = createHarness();
    await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Não se aplica',
        profile: 'controlador'
    });

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Não',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.notaFiscal, 'Não');
    assert.equal(result.value.verification.analise.notaFiscal, 'Não analisado');
});

test('valida entrega e nota cadastrada antes de alterar análise técnica', async () => {
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'extCC',
            value: 'Correto',
            profile: 'controlador'
        }),
        error => error && error.code === 'DELIVERY_REQUIRED'
    );

    harness.verification.bonificacao.extCC = 'Sim';
    const result = await harness.service.setTechnicalAnalysis({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Incorreto',
        profile: 'controlador'
    });
    assert.equal(result.value.verification.analise.extCC, 'Incorreto');
    assert.equal(result.value.shouldOpenPendency, true);
});

test('consolida somente preenchimento válido e retifica com antes/depois auditável', async () => {
    const harness = createHarness();
    Object.keys(harness.verification.bonificacao).forEach(key => {
        harness.verification.bonificacao[key] = 'Sim';
    });

    const closed = await harness.service.closeBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        profile: 'controlador'
    });
    assert.equal(['apta', 'inapta'].includes(closed.value.status), true);

    const retified = await harness.service.retify({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        programId: 'BASIC',
        bonification: { extCC: 'Não' },
        bonusResult: 'inapta',
        justification: 'Correção administrativa documentada.',
        profile: 'assistente'
    });
    assert.equal(retified.value.verification.bonificacao.extCC, 'Não');
    assert.equal(retified.value.verification.resultadoBonif, 'inapta');
    assert.equal(retified.value.retification.before.resultadoBonif, closed.value.status);
    assert.equal(retified.value.retification.justificativa, 'Correção administrativa documentada.');
    assert.equal(harness.state.logs[0].action, 'Consolidação retificada');
});
