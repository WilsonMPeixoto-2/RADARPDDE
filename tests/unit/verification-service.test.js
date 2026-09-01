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

test('ao sair de N/A para Sim sem NF de serviço mantém Assessoria em N/A / Correto', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.notaFiscal = 'Não se aplica';
    harness.verification.bonificacao.consAssessoria = 'Não se aplica';
    harness.verification.bonificacao.consEnviada = false;
    harness.verification.analise.notaFiscal = 'Correto';
    harness.verification.analise.consAssessoria = 'Correto';

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Sim',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.notaFiscal, 'Sim');
    assert.equal(result.value.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.value.verification.bonificacao.consEnviada, false);
    assert.equal(result.value.verification.analise.consAssessoria, 'Correto');
});

test('mesma bonificação de Nota Fiscal corrige Assessoria derivada incoerente em vez de falso no-op', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.notaFiscal = 'Sim';
    harness.verification.bonificacao.consAssessoria = '';
    harness.verification.bonificacao.consEnviada = true;
    harness.verification.analise.consAssessoria = 'Não analisado';

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Sim',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.value.verification.bonificacao.consEnviada, false);
    assert.equal(result.value.verification.analise.consAssessoria, 'Correto');
    assert.equal(harness.calls.length, 1);
    assert.equal(result.value.unchanged, undefined);
});

test('mesma bonificação de Nota Fiscal deriva Assessoria a partir das NFs de serviço atuais', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.notaFiscal = 'Sim';
    harness.verification.bonificacao.consAssessoria = 'Não se aplica';
    harness.verification.bonificacao.consEnviada = false;
    harness.verification.analise.consAssessoria = 'Correto';
    harness.state.registeredInvoices.push({
        id: 'nota-servico',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        tipo: 'servico',
        numero: 'NF-SERV-RED',
        consultaAssessoriaEnviada: false,
        analiseConsultaAssessoria: 'Não analisado'
    });

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'notaFiscal',
        value: 'Sim',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.consAssessoria, 'Não');
    assert.equal(result.value.verification.bonificacao.consEnviada, false);
    assert.equal(result.value.verification.analise.consAssessoria, 'Não analisado');
    assert.equal(harness.calls.length, 1);
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

test('Declaração BB Ágil em N/A neutraliza a análise técnica e ao voltar para Sim/Não reinicia a conferência', async () => {
    for (const nextValue of ['Sim', 'Não']) {
        const harness = createHarness();

        const notApplicable = await harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'declBBAgil',
            value: 'Não se aplica',
            profile: 'controlador'
        });

        assert.equal(notApplicable.value.verification.bonificacao.declBBAgil, 'Não se aplica');
        assert.equal(notApplicable.value.verification.analise.declBBAgil, 'Correto');

        const applicableAgain = await harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'declBBAgil',
            value: nextValue,
            profile: 'controlador'
        });

        assert.equal(applicableAgain.value.verification.bonificacao.declBBAgil, nextValue);
        assert.equal(applicableAgain.value.verification.analise.declBBAgil, 'Não analisado');
    }
});

test('Declaração BB Ágil não pode ser marcada N/A enquanto houver pendência ativa', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.declBBAgil = 'Não';
    harness.verification.analise.declBBAgil = 'Incorreto';
    harness.state.pendencies.push({
        id: 'PEND-BB-1',
        escolaId: 'ESC-1',
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'declBBAgil',
        status: 'Aberta'
    });

    await assert.rejects(
        () => harness.service.setBonification({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'declBBAgil',
            value: 'Não se aplica',
            profile: 'controlador'
        }),
        error => error?.code === 'ACTIVE_PENDENCY'
    );

    assert.equal(harness.verification.bonificacao.declBBAgil, 'Não');
    assert.equal(harness.verification.analise.declBBAgil, 'Incorreto');
});

test('repetir a mesma bonificação é no-op sem nova persistência ou log', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.extCC = 'Sim';

    const result = await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Sim',
        profile: 'controlador'
    });

    assert.equal(result.value.verification.bonificacao.extCC, 'Sim');
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.logs.length, 0);
});

test('consolidar novamente sem alteração é no-op sem segundo log', async () => {
    const harness = createHarness();
    Object.keys(harness.verification.bonificacao).forEach(key => {
        harness.verification.bonificacao[key] = 'Sim';
    });
    harness.verification.resultadoBonif = 'apta';

    const result = await harness.service.closeBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        profile: 'controlador'
    });

    assert.equal(result.value.status, 'apta');
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.logs.length, 0);
});

test('análise agregada de Notas Fiscais não aceita alteração direta', async () => {
    const harness = createHarness();
    harness.verification.bonificacao.notaFiscal = 'Sim';

    await assert.rejects(
        () => harness.service.setTechnicalAnalysis({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            documentKey: 'notaFiscal',
            value: 'Correto',
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(harness.verification.analise.notaFiscal, 'Não analisado');
    assert.equal(harness.calls.length, 0);
});

test('valida entrega antes de alterar análise técnica regular', async () => {
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
        value: 'Correto',
        profile: 'controlador'
    });
    assert.equal(result.value.verification.analise.extCC, 'Correto');
    assert.equal(result.value.shouldOpenPendency, false);
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
