'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ACTIVE_STATUSES,
    DOCUMENT_ERROR_TYPES,
    PENDENCY_SCHEMA_VERSION,
    PENDENCY_STATUS,
    buildDocumentContextKey,
    createDocumentPendency,
    findActivePendency,
    getNextActor,
    isActivePendency,
    isDocumentaryPendency,
    validateDocumentErrors
} = require('../src/domain/pendencias.js');

const DOCUMENT_CONTEXT = {
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'ED_FAMILIA',
    documentoKey: 'extCC'
};

test('expõe a versão e os quatro estados canônicos imutáveis', () => {
    assert.equal(PENDENCY_SCHEMA_VERSION, 2);
    assert.deepEqual(PENDENCY_STATUS, {
        OPEN: 'Aberta',
        AWAITING_REVIEW: 'Aguardando reanálise',
        RESOLVED: 'Resolvida',
        CANCELLED: 'Cancelada'
    });
    assert.equal(Object.isFrozen(PENDENCY_STATUS), true);
    assert.deepEqual([...ACTIVE_STATUSES], ['Aberta', 'Aguardando reanálise']);
});

test('expõe somente os tipos canônicos de erro documental', () => {
    assert.deepEqual(DOCUMENT_ERROR_TYPES, [
        'Documento ausente',
        'Documento ilegível',
        'Competência incorreta',
        'Extrato incompleto',
        'Sem assinatura',
        'Arquivo incompatível',
        'Dados divergentes',
        'Documento incompleto',
        'Arquivo não localizado ou inacessível',
        'Outro'
    ]);
    assert.equal(Object.isFrozen(DOCUMENT_ERROR_TYPES), true);
});

test('considera apenas Aberta e Aguardando reanálise como ativas', () => {
    assert.equal(isActivePendency({ status: 'Aberta' }), true);
    assert.equal(isActivePendency({ status: 'Aguardando reanálise' }), true);
    assert.equal(isActivePendency({ status: 'Resolvida' }), false);
    assert.equal(isActivePendency({ status: 'Cancelada' }), false);
});

test('deriva o próximo ator a partir do estado', () => {
    assert.equal(getNextActor({ status: 'Aberta' }), 'Escola');
    assert.equal(getNextActor({ status: 'Aguardando reanálise' }), 'Controlador');
    assert.equal(getNextActor({ status: 'Resolvida' }), null);
    assert.equal(getNextActor({ status: 'Cancelada' }), null);
});

test('reconhece pendência documental somente com programa e documento', () => {
    assert.equal(isDocumentaryPendency({ programaId: ' ED_FAMILIA ', documentoKey: ' extCC ' }), true);
    assert.equal(isDocumentaryPendency({ programaId: 'ED_FAMILIA', documentoKey: ' ' }), false);
    assert.equal(isDocumentaryPendency({ programaId: '', documentoKey: 'extCC' }), false);
});

test('constrói chave documental exata e prioriza a competência de origem', () => {
    assert.equal(
        buildDocumentContextKey(DOCUMENT_CONTEXT),
        '04.31.001::2026-05::ED_FAMILIA::extCC'
    );
    assert.equal(buildDocumentContextKey({
        ...DOCUMENT_CONTEXT,
        competencia: '2026-06',
        competenciaOrigem: ' 2026-05 '
    }), '04.31.001::2026-05::ED_FAMILIA::extCC');
});

test('ignora duplicata resolvida e encontra a ativa no contexto estruturado exato', () => {
    const resolved = { id: 'pend-resolved', ...DOCUMENT_CONTEXT, status: 'Resolvida' };
    const otherProgram = {
        id: 'pend-other-program',
        ...DOCUMENT_CONTEXT,
        programaId: 'TEMPO_APRENDER',
        status: 'Aberta',
        item: 'Educação e Família - Extrato Conta Corrente'
    };
    const active = { id: 'pend-active', ...DOCUMENT_CONTEXT, status: 'Aberta' };

    assert.equal(findActivePendency([resolved, otherProgram, active], DOCUMENT_CONTEXT), active);
});

test('normaliza erros únicos e mantém Documento ausente isolado', () => {
    assert.deepEqual(validateDocumentErrors([' Documento ilegível ', 'Sem assinatura', 'Documento ilegível']), [
        'Documento ilegível',
        'Sem assinatura'
    ]);
    assert.deepEqual(validateDocumentErrors(['Documento ausente']), ['Documento ausente']);
    assert.throws(
        () => validateDocumentErrors(['Documento ausente', 'Documento ilegível']),
        /Documento ausente deve ser selecionado isoladamente/
    );
    assert.throws(() => validateDocumentErrors([]), /ao menos um erro documental/i);
});

test('cria o registro documental canônico com compatibilidade e evento de abertura', () => {
    const pendency = createDocumentPendency({
        id: ' pend-42 ',
        escolaId: ' 04.31.001 ',
        competencia: ' 2026-05 ',
        programaId: ' ED_FAMILIA ',
        documentoKey: ' extCC ',
        item: ' Educação e Família - Extrato Conta Corrente ',
        errosAtuais: [' Documento ilegível ', 'Sem assinatura', 'Documento ilegível'],
        observacao: ' O extrato não permite conferir os dados. ',
        dataAbertura: ' 2026-05-31 '
    }, {
        eventId: ' evt-42 ',
        timestamp: '2026-05-31T13:45:00.000Z',
        usuario: ' Maria Controladora ',
        perfil: ' controlador '
    });

    assert.deepEqual(pendency, {
        schemaVersion: 2,
        tipo: 'documental',
        id: 'pend-42',
        escolaId: '04.31.001',
        competencia: '2026-05',
        competenciaOrigem: '2026-05',
        programaId: 'ED_FAMILIA',
        documentoKey: 'extCC',
        item: 'Educação e Família - Extrato Conta Corrente',
        status: 'Aberta',
        errosAtuais: ['Documento ilegível', 'Sem assinatura'],
        motivo: 'Documento ilegível',
        observacao: 'O extrato não permite conferir os dados.',
        responsavel: 'Escola',
        dataAbertura: '2026-05-31',
        dataResolucao: null,
        tentativas: [],
        historico: [{
            id: 'evt-42',
            tipo: 'abertura',
            dataHora: '2026-05-31T13:45:00.000Z',
            usuario: 'Maria Controladora',
            perfil: 'controlador',
            detalhe: 'Pendência documental aberta.',
            erros: ['Documento ilegível', 'Sem assinatura'],
            tentativaId: null
        }],
        cancelamento: null,
        contextoIncompleto: false
    });
});
