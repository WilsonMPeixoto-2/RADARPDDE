'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pendencyDomain = require('../../src/domain/pendencias.js');
const { PendencyService } = require('../../src/application/pendency-service.js');

function createHarness() {
    const state = {
        pendencies: [],
        contacts: [],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    bonificacao: { extCC: 'Sim' },
                    analise: { extCC: 'Incorreto' },
                    resultadoBonif: 'apta'
                }
            }
        },
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
    const service = new PendencyService({
        dataService,
        domain: pendencyDomain,
        getState: () => state,
        appendLog: (action, details) => state.logs.unshift({ action, details }),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-${++id}`,
        now: () => '2026-07-14T12:00:00.000Z',
        getCorrectAnalysisLabel: () => 'Correto'
    });
    return { state, calls, service };
}

const documentaryInput = Object.freeze({
    schoolId: 'ESC-1',
    competence: '2026-05',
    programId: 'BASIC',
    documentKey: 'extCC',
    item: 'Extrato Conta Corrente',
    errors: ['Documento ilegível', 'Sem assinatura'],
    observation: 'Documento com duas falhas.'
});

test('abre pendência documental com múltiplos erros e impede duplicidade ativa', async () => {
    const harness = createHarness();

    const opened = await harness.service.open(documentaryInput);

    assert.equal(opened.value.pendency.status, 'Aberta');
    assert.equal(opened.value.pendency.responsavel, 'Escola');
    assert.deepEqual(opened.value.pendency.errosAtuais, ['Documento ilegível', 'Sem assinatura']);
    assert.equal(opened.value.pendency.historico[0].tipo, 'abertura');
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['pendencies', 'administrativeLogs']
    );
    await assert.rejects(
        () => harness.service.open(documentaryInput),
        error => error && error.code === 'DUPLICATE_PENDENCY'
    );
});

test('abre pendência manual pelo mesmo gateway sem inventar contexto documental', async () => {
    const harness = createHarness();
    const opened = await harness.service.open({
        schoolId: 'ESC-1',
        competence: '2026-05',
        item: 'Prestação de contas',
        reason: 'Aguardando documento físico',
        responsible: 'Escola',
        observation: 'Cobrar a direção.'
    });

    assert.equal(opened.value.pendency.tipo, 'legada');
    assert.equal(opened.value.pendency.status, 'Aberta');
    assert.equal(opened.value.pendency.programaId, undefined);
    assert.equal(opened.value.pendency.responsavel, 'Escola');
});

test('numera tentativas, reabre após erro e resolve por reanálise sem alterar bonificação', async () => {
    const harness = createHarness();
    const opened = await harness.service.open(documentaryInput);
    const pendencyId = opened.value.pendency.id;
    const beforeBonification = structuredClone(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao
    );

    const firstSubmission = await harness.service.registerAttempt({
        pendencyId,
        availabilityDate: '2026-07-15',
        observation: 'Primeiro envio.',
        link: 'https://drive.google.com/file/primeiro'
    });
    assert.equal(firstSubmission.value.pendency.status, 'Aguardando reanálise');
    assert.equal(firstSubmission.value.pendency.tentativas[0].numero, 1);
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].analise.extCC, 'Não analisado');

    const rejected = await harness.service.reanalyze({
        pendencyId,
        result: 'incorreto',
        errors: ['Dados divergentes'],
        observation: 'Ainda incorreto.'
    });
    assert.equal(rejected.value.pendency.status, 'Aberta');
    assert.deepEqual(rejected.value.pendency.errosAtuais, ['Dados divergentes']);
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].analise.extCC, 'Incorreto');

    const secondSubmission = await harness.service.registerAttempt({
        pendencyId,
        availabilityDate: '2026-07-16',
        observation: 'Segundo envio.'
    });
    assert.equal(secondSubmission.value.pendency.tentativas[1].numero, 2);

    const resolved = await harness.service.reanalyze({
        pendencyId,
        result: 'correto',
        observation: 'Documento regularizado.'
    });
    assert.equal(resolved.value.pendency.status, 'Resolvida');
    assert.equal(resolved.value.pendency.responsavel, null);
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].analise.extCC, 'Correto');
    assert.deepEqual(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao,
        beforeBonification
    );
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif, 'apta');
});

test('cancela, reabre resolvida e registra contato sem alterar estados indevidos', async () => {
    const harness = createHarness();
    const first = await harness.service.open(documentaryInput);
    const cancelled = await harness.service.cancel({
        pendencyId: first.value.pendency.id,
        justification: 'Lançamento indevido.'
    });
    assert.equal(cancelled.value.pendency.status, 'Cancelada');

    const second = await harness.service.open({
        ...documentaryInput,
        documentKey: 'extINV',
        item: 'Extrato Investimento'
    });
    const id = second.value.pendency.id;
    await harness.service.registerAttempt({
        pendencyId: id,
        availabilityDate: '2026-07-15',
        observation: 'Envio.'
    });
    await harness.service.resolve({ pendencyId: id, observation: 'Regularizado.' });
    const reopened = await harness.service.reopen({
        pendencyId: id,
        justification: 'Nova inconsistência identificada.',
        errors: ['Documento incompleto']
    });
    assert.equal(reopened.value.pendency.status, 'Aberta');
    assert.deepEqual(reopened.value.pendency.errosAtuais, ['Documento incompleto']);

    const contact = await harness.service.registerContact({
        pendencyId: id,
        channel: 'E-mail',
        description: 'Direção comunicada.'
    });
    assert.equal(contact.value.contact.pendenciaId, id);
    assert.equal(harness.state.contacts.length, 1);
    assert.equal(harness.state.pendencies.find(item => item.id === id).status, 'Aberta');
});
