'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    cancelPendency,
    createDocumentPendency,
    normalizePendencyRecord,
    recordReanalysis,
    registerCorrectiveSubmission,
    reopenPendency
} = require('../../src/domain/pendencias.js');

function audit(id, at = '2026-09-03T19:40:00.000Z') {
    return {
        eventId: id,
        at,
        usuario: 'Controlador Teste',
        perfil: 'controlador'
    };
}

function openFixture() {
    return createDocumentPendency({
        id: 'pend-next-actor-1',
        escolaId: '04.31.001',
        competencia: '2026-09',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        item: 'Extrato Conta Corrente',
        erros: ['Documento incompleto'],
        observacao: 'Documento precisa de correção.',
        dataAbertura: '2026-09-03'
    }, audit('evt-open'));
}

test('transições documentais mantêm responsavel e proximoAtor sincronizados', () => {
    const opened = openFixture();
    assert.equal(opened.status, 'Aberta');
    assert.equal(opened.responsavel, 'Escola');
    assert.equal(opened.proximoAtor, 'Escola');

    const awaiting = registerCorrectiveSubmission(opened, {
        id: 'attempt-1',
        dataDisponibilizacao: '2026-09-03',
        observacao: 'Documento corrigido disponibilizado.',
        link: 'https://drive.example/arquivo'
    }, audit('evt-submit', '2026-09-03T19:41:00.000Z'));

    assert.equal(awaiting.status, 'Aguardando reanálise');
    assert.equal(awaiting.responsavel, 'Controlador');
    assert.equal(awaiting.proximoAtor, 'Controlador');
    assert.equal(Object.hasOwn(awaiting, 'nextActor'), false);
    assert.equal(Object.hasOwn(awaiting, 'next_actor'), false);

    const reopenedByIncorrectReview = recordReanalysis(awaiting, {
        resultado: 'incorreto',
        observacao: 'Ainda há inconsistência.',
        erros: ['Dados divergentes']
    }, audit('evt-review-bad', '2026-09-03T19:42:00.000Z'));

    assert.equal(reopenedByIncorrectReview.status, 'Aberta');
    assert.equal(reopenedByIncorrectReview.responsavel, 'Escola');
    assert.equal(reopenedByIncorrectReview.proximoAtor, 'Escola');

    const awaitingAgain = registerCorrectiveSubmission(reopenedByIncorrectReview, {
        id: 'attempt-2',
        dataDisponibilizacao: '2026-09-03',
        observacao: 'Nova correção disponibilizada.'
    }, audit('evt-submit-2', '2026-09-03T19:43:00.000Z'));

    const resolved = recordReanalysis(awaitingAgain, {
        resultado: 'correto',
        observacao: 'Correção confirmada.'
    }, audit('evt-review-ok', '2026-09-03T19:44:00.000Z'));

    assert.equal(resolved.status, 'Resolvida');
    assert.equal(resolved.responsavel, null);
    assert.equal(resolved.proximoAtor, null);

    const reopened = reopenPendency(resolved, {
        justificativa: 'Nova conferência necessária.',
        erros: ['Documento incompleto']
    }, audit('evt-reopen', '2026-09-03T19:45:00.000Z'));

    assert.equal(reopened.status, 'Aberta');
    assert.equal(reopened.responsavel, 'Escola');
    assert.equal(reopened.proximoAtor, 'Escola');

    const cancelled = cancelPendency(reopened, {
        justificativa: 'Registro cancelado administrativamente.'
    }, audit('evt-cancel', '2026-09-03T19:46:00.000Z'));

    assert.equal(cancelled.status, 'Cancelada');
    assert.equal(cancelled.responsavel, null);
    assert.equal(cancelled.proximoAtor, null);
});

test('normalização documental elimina projeção legada stale do próximo ator', () => {
    const normalized = normalizePendencyRecord({
        ...openFixture(),
        status: 'Aguardando reanálise',
        responsavel: 'Controlador',
        proximoAtor: 'Escola',
        nextActor: 'Escola',
        next_actor: 'Escola'
    });

    assert.equal(normalized.status, 'Aguardando reanálise');
    assert.equal(normalized.responsavel, 'Controlador');
    assert.equal(normalized.proximoAtor, 'Controlador');
    assert.equal(Object.hasOwn(normalized, 'nextActor'), false);
    assert.equal(Object.hasOwn(normalized, 'next_actor'), false);
});
