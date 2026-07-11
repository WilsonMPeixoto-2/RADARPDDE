'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ACTIVE_STATUSES,
    DOCUMENT_ERROR_TYPES,
    PENDENCY_SCHEMA_VERSION,
    PENDENCY_STATUS,
    buildDocumentContextKey,
    cancelPendency,
    createDocumentPendency,
    findActivePendency,
    getNextActor,
    isActivePendency,
    isDocumentaryPendency,
    recordReanalysis,
    registerCorrectiveSubmission,
    reopenPendency,
    validateDocumentErrors
} = require('../src/domain/pendencias.js');

const DOCUMENT_CONTEXT = {
    escolaId: '04.31.001',
    competencia: '2026-05',
    programaId: 'ED_FAMILIA',
    documentoKey: 'extCC'
};

const SCHOOL_SUBMISSION_AUDIT = {
    eventId: 'evt-envio-1',
    at: '2026-07-10T13:30:00.000Z',
    usuario: 'Ana Escola',
    perfil: 'escola'
};

const CONTROLLER_REVIEW_AUDIT = {
    eventId: 'evt-reanalise-1',
    at: '2026-07-14T16:45:00.000Z',
    usuario: 'Maria Controladora',
    perfil: 'controlador'
};

function createOpenPendencyFixture() {
    return {
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
            id: 'evt-abertura-1',
            tipo: 'abertura',
            dataHora: '2026-05-31T13:45:00.000Z',
            usuario: 'Maria Controladora',
            perfil: 'controlador',
            detalhe: 'Pendência documental aberta.',
            erros: ['Documento ilegível', 'Sem assinatura'],
            tentativaId: null
        }],
        cancelamento: null,
        contextoIncompleto: false,
        bonificacao: 1,
        resultadoBonif: 'Bonificada',
        pontualidade: true
    };
}

function createAwaitingPendencyFixture() {
    const pendency = createOpenPendencyFixture();
    pendency.status = 'Aguardando reanálise';
    pendency.responsavel = 'Controlador';
    pendency.tentativas = [{
        id: 'tentativa-1',
        numero: 1,
        dataDisponibilizacao: '2026-07-10',
        dataRegistro: '2026-07-10T13:30:00.000Z',
        observacao: 'Arquivo corrigido e disponibilizado.',
        link: 'https://arquivos.example/extrato-corrigido.pdf',
        registradoPor: 'Ana Escola',
        status: 'aguardando',
        dataAnalise: null,
        analisadoPor: null,
        resultado: null,
        errosEncontrados: [],
        observacaoAnalise: null
    }];
    pendency.historico.push({
        id: 'evt-envio-1',
        tipo: 'novo_envio',
        dataHora: '2026-07-10T13:30:00.000Z',
        usuario: 'Ana Escola',
        perfil: 'escola',
        detalhe: 'Novo envio corretivo registrado para reanálise.',
        erros: ['Documento ilegível', 'Sem assinatura'],
        tentativaId: 'tentativa-1'
    });
    return pendency;
}

function createResolvedPendencyFixture() {
    const pendency = createAwaitingPendencyFixture();
    pendency.status = 'Resolvida';
    pendency.errosAtuais = [];
    pendency.motivo = null;
    pendency.responsavel = null;
    pendency.dataResolucao = '2026-07-14';
    pendency.tentativas[0] = {
        ...pendency.tentativas[0],
        status: 'analisada',
        dataAnalise: '2026-07-14T16:45:00.000Z',
        analisadoPor: 'Maria Controladora',
        resultado: 'correto',
        errosEncontrados: [],
        observacaoAnalise: 'Correção confirmada no documento.'
    };
    pendency.historico.push({
        id: 'evt-reanalise-1',
        tipo: 'reanalise_correta',
        dataHora: '2026-07-14T16:45:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Reanálise confirmou a correção do documento.',
        erros: [],
        tentativaId: 'tentativa-1'
    });
    return pendency;
}

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

test('impede que mutações do conjunto público alterem a regra de atividade', () => {
    function attemptMutation(mutate, didChange, restore) {
        let error = null;
        try {
            mutate();
        } catch (caughtError) {
            error = caughtError;
        }

        const changed = didChange();
        if (changed) {
            restore();
        }

        return { changed, error };
    }

    const addResult = attemptMutation(
        () => ACTIVE_STATUSES.add('Resolvida'),
        () => ACTIVE_STATUSES.has('Resolvida'),
        () => ACTIVE_STATUSES.delete('Resolvida')
    );
    const deleteResult = attemptMutation(
        () => ACTIVE_STATUSES.delete('Aberta'),
        () => !ACTIVE_STATUSES.has('Aberta'),
        () => ACTIVE_STATUSES.add('Aberta')
    );
    const clearResult = attemptMutation(
        () => ACTIVE_STATUSES.clear(),
        () => ACTIVE_STATUSES.size !== 2,
        () => {
            ACTIVE_STATUSES.add('Aberta');
            ACTIVE_STATUSES.add('Aguardando reanálise');
        }
    );

    assert.equal(Object.isFrozen(ACTIVE_STATUSES), true);
    for (const result of [addResult, deleteResult, clearResult]) {
        assert.equal(result.changed, false);
        assert.equal(result.error instanceof TypeError, true);
        assert.match(result.error.message, /imutável/);
    }
    assert.equal(isActivePendency({ status: 'Aberta' }), true);
    assert.equal(isActivePendency({ status: 'Resolvida' }), false);
});

test('não expõe o Set mutável interno pelo callback de forEach', () => {
    let callbackSet = null;
    ACTIVE_STATUSES.forEach((value, repeatedValue, set) => {
        assert.equal(value, repeatedValue);
        callbackSet = set;
    });

    assert.equal(callbackSet, ACTIVE_STATUSES);
    assert.throws(() => callbackSet.add('Resolvida'), /imutável/);
    assert.equal(isActivePendency({ status: 'Resolvida' }), false);
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

test('não seleciona registro canônico ou legado quando o contexto-alvo está incompleto', () => {
    const canonical = {
        id: 'pend-canonical',
        ...DOCUMENT_CONTEXT,
        status: 'Aberta',
        item: 'Educação e Família - Extrato Conta Corrente'
    };
    const legacy = {
        id: 'pend-legacy',
        escolaId: DOCUMENT_CONTEXT.escolaId,
        competencia: DOCUMENT_CONTEXT.competencia,
        status: 'Aberta',
        item: canonical.item
    };
    const withoutSchool = {
        competencia: DOCUMENT_CONTEXT.competencia,
        programaId: DOCUMENT_CONTEXT.programaId,
        documentoKey: DOCUMENT_CONTEXT.documentoKey,
        item: canonical.item
    };
    const withoutCompetence = {
        escolaId: DOCUMENT_CONTEXT.escolaId,
        programaId: DOCUMENT_CONTEXT.programaId,
        documentoKey: DOCUMENT_CONTEXT.documentoKey,
        item: canonical.item
    };

    assert.equal(findActivePendency([canonical, legacy], withoutSchool), undefined);
    assert.equal(findActivePendency([canonical, legacy], withoutCompetence), undefined);
});

test('fallback legado exige escola e competência exatas no contexto-alvo completo', () => {
    const item = 'Educação e Família - Extrato Conta Corrente';
    const withoutSchool = {
        id: 'legacy-without-school',
        competencia: DOCUMENT_CONTEXT.competencia,
        status: 'Aberta',
        item
    };
    const withoutCompetence = {
        id: 'legacy-without-competence',
        escolaId: DOCUMENT_CONTEXT.escolaId,
        status: 'Aberta',
        item
    };
    const matchingLegacy = {
        id: 'legacy-matching',
        escolaId: DOCUMENT_CONTEXT.escolaId,
        competencia: DOCUMENT_CONTEXT.competencia,
        status: 'Aberta',
        item
    };
    const completeTarget = { ...DOCUMENT_CONTEXT, item };

    assert.equal(findActivePendency([withoutSchool], completeTarget), undefined);
    assert.equal(findActivePendency([withoutCompetence], completeTarget), undefined);
    assert.equal(findActivePendency([matchingLegacy], completeTarget), matchingLegacy);
});

test('fallback legado não infere documento quando falta identidade textual', () => {
    const legacyWithoutItem = {
        id: 'legacy-without-item',
        escolaId: DOCUMENT_CONTEXT.escolaId,
        competencia: DOCUMENT_CONTEXT.competencia,
        status: 'Aberta'
    };

    assert.equal(findActivePendency([legacyWithoutItem], DOCUMENT_CONTEXT), undefined);
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

test('registra o primeiro envio corretivo sem resolver nem mutar a pendência aberta', () => {
    const source = createOpenPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = registerCorrectiveSubmission(source, {
        id: ' tentativa-1 ',
        dataDisponibilizacao: ' 2026-07-10 ',
        observacao: ' Arquivo corrigido e disponibilizado. ',
        link: ' https://arquivos.example/extrato-corrigido.pdf '
    }, SCHOOL_SUBMISSION_AUDIT);

    assert.deepEqual(source, sourceSnapshot);
    assert.notEqual(result, source);
    assert.equal(result.status, 'Aguardando reanálise');
    assert.equal(result.responsavel, 'Controlador');
    assert.equal(result.dataResolucao, null);
    assert.deepEqual(result.errosAtuais, ['Documento ilegível', 'Sem assinatura']);
    assert.equal(result.bonificacao, 1);
    assert.equal(result.resultadoBonif, 'Bonificada');
    assert.equal(result.pontualidade, true);
    assert.deepEqual(result.tentativas, [{
        id: 'tentativa-1',
        numero: 1,
        dataDisponibilizacao: '2026-07-10',
        dataRegistro: '2026-07-10T13:30:00.000Z',
        observacao: 'Arquivo corrigido e disponibilizado.',
        link: 'https://arquivos.example/extrato-corrigido.pdf',
        registradoPor: 'Ana Escola',
        status: 'aguardando',
        dataAnalise: null,
        analisadoPor: null,
        resultado: null,
        errosEncontrados: [],
        observacaoAnalise: null
    }]);
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-envio-1',
        tipo: 'novo_envio',
        dataHora: '2026-07-10T13:30:00.000Z',
        usuario: 'Ana Escola',
        perfil: 'escola',
        detalhe: 'Novo envio corretivo registrado para reanálise.',
        erros: ['Documento ilegível', 'Sem assinatura'],
        tentativaId: 'tentativa-1'
    });
});

test('substitui a tentativa ainda aguardando e preserva ambas ao registrar novo envio', () => {
    const source = createAwaitingPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = registerCorrectiveSubmission(source, {
        id: 'tentativa-2',
        dataDisponibilizacao: '2026-07-12',
        observacao: 'Versão final do extrato enviada.',
        link: '   '
    }, {
        eventId: 'evt-envio-2',
        at: '2026-07-12T11:00:00.000Z',
        usuario: 'Ana Escola',
        perfil: 'escola'
    });

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Aguardando reanálise');
    assert.equal(result.responsavel, 'Controlador');
    assert.equal(result.tentativas.length, 2);
    assert.deepEqual(result.tentativas[0], {
        ...source.tentativas[0],
        status: 'substituida_antes_da_analise'
    });
    assert.deepEqual(result.tentativas[1], {
        id: 'tentativa-2',
        numero: 2,
        dataDisponibilizacao: '2026-07-12',
        dataRegistro: '2026-07-12T11:00:00.000Z',
        observacao: 'Versão final do extrato enviada.',
        link: null,
        registradoPor: 'Ana Escola',
        status: 'aguardando',
        dataAnalise: null,
        analisadoPor: null,
        resultado: null,
        errosEncontrados: [],
        observacaoAnalise: null
    });
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.equal(result.historico.at(-1).tipo, 'novo_envio');
    assert.equal(result.historico.at(-1).tentativaId, 'tentativa-2');
});

test('reanálise incorreta reabre com novos erros e preserva o histórico anterior', () => {
    const source = createAwaitingPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = recordReanalysis(source, {
        resultado: 'incorreto',
        observacao: ' Persistem divergências no extrato. ',
        errosEncontrados: [' Dados divergentes ', 'Sem assinatura', 'Dados divergentes']
    }, CONTROLLER_REVIEW_AUDIT);

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Aberta');
    assert.equal(result.responsavel, 'Escola');
    assert.equal(result.dataResolucao, null);
    assert.deepEqual(result.errosAtuais, ['Dados divergentes', 'Sem assinatura']);
    assert.equal(result.motivo, 'Dados divergentes');
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.historico[0].erros, ['Documento ilegível', 'Sem assinatura']);
    assert.deepEqual(result.tentativas[0], {
        ...source.tentativas[0],
        status: 'analisada',
        dataAnalise: '2026-07-14T16:45:00.000Z',
        analisadoPor: 'Maria Controladora',
        resultado: 'incorreto',
        errosEncontrados: ['Dados divergentes', 'Sem assinatura'],
        observacaoAnalise: 'Persistem divergências no extrato.'
    });
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-reanalise-1',
        tipo: 'reanalise_incorreta',
        dataHora: '2026-07-14T16:45:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Reanálise identificou erros no documento corrigido.',
        erros: ['Dados divergentes', 'Sem assinatura'],
        tentativaId: 'tentativa-1'
    });
});

test('somente a reanálise correta resolve e usa a data da confirmação do controlador', () => {
    const source = createAwaitingPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = recordReanalysis(source, {
        resultado: 'correto',
        observacao: ' Correção confirmada no documento. '
    }, CONTROLLER_REVIEW_AUDIT);

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Resolvida');
    assert.deepEqual(result.errosAtuais, []);
    assert.equal(result.motivo, null);
    assert.equal(result.responsavel, null);
    assert.equal(result.dataResolucao, '2026-07-14');
    assert.equal(result.bonificacao, source.bonificacao);
    assert.equal(result.resultadoBonif, source.resultadoBonif);
    assert.equal(result.pontualidade, source.pontualidade);
    assert.deepEqual(result.tentativas[0], {
        ...source.tentativas[0],
        status: 'analisada',
        dataAnalise: '2026-07-14T16:45:00.000Z',
        analisadoPor: 'Maria Controladora',
        resultado: 'correto',
        errosEncontrados: [],
        observacaoAnalise: 'Correção confirmada no documento.'
    });
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-reanalise-1',
        tipo: 'reanalise_correta',
        dataHora: '2026-07-14T16:45:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Reanálise confirmou a correção do documento.',
        erros: [],
        tentativaId: 'tentativa-1'
    });
});

test('arquivo indisponível reabre com o erro canônico e evento próprio', () => {
    const source = createAwaitingPendencyFixture();

    const result = recordReanalysis(source, {
        resultado: 'arquivo_indisponivel',
        observacao: 'O endereço informado não permite acessar o arquivo.',
        errosEncontrados: ['Documento ilegível']
    }, CONTROLLER_REVIEW_AUDIT);

    assert.equal(result.status, 'Aberta');
    assert.equal(result.responsavel, 'Escola');
    assert.equal(result.dataResolucao, null);
    assert.deepEqual(result.errosAtuais, ['Arquivo não localizado ou inacessível']);
    assert.equal(result.motivo, 'Arquivo não localizado ou inacessível');
    assert.equal(result.tentativas[0].status, 'analisada');
    assert.equal(result.tentativas[0].resultado, 'arquivo_indisponivel');
    assert.deepEqual(result.tentativas[0].errosEncontrados, [
        'Arquivo não localizado ou inacessível'
    ]);
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-reanalise-1',
        tipo: 'arquivo_indisponivel',
        dataHora: '2026-07-14T16:45:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Reanálise não localizou um arquivo acessível.',
        erros: ['Arquivo não localizado ou inacessível'],
        tentativaId: 'tentativa-1'
    });
});

test('cancela pendência ativa com justificativa e auditoria sem resolução normal', () => {
    const source = createAwaitingPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = cancelPendency(source, {
        justificativa: ' Pendência aberta para o documento errado. '
    }, {
        eventId: 'evt-cancelamento-1',
        at: '2026-07-15T09:10:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador'
    });

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Cancelada');
    assert.equal(result.responsavel, null);
    assert.equal(result.dataResolucao, null);
    assert.equal(isActivePendency(result), false);
    assert.deepEqual(result.tentativas, source.tentativas);
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.cancelamento, {
        justificativa: 'Pendência aberta para o documento errado.',
        dataHora: '2026-07-15T09:10:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador'
    });
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-cancelamento-1',
        tipo: 'cancelamento',
        dataHora: '2026-07-15T09:10:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Pendência cancelada: Pendência aberta para o documento errado.',
        erros: ['Documento ilegível', 'Sem assinatura'],
        tentativaId: null
    });
});

test('rejeita cancelamento de registro já cancelado ou fora dos estados ativos', () => {
    const cancelled = {
        ...createOpenPendencyFixture(),
        status: 'Cancelada',
        responsavel: null
    };
    const resolved = createResolvedPendencyFixture();
    const cancellation = { justificativa: 'Correção administrativa.' };
    const audit = {
        eventId: 'evt-cancelamento-2',
        at: '2026-07-15T10:00:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador'
    };

    assert.throws(() => cancelPendency(cancelled, cancellation, audit), /já está cancelada/i);
    assert.throws(() => cancelPendency(resolved, cancellation, audit), /somente pendências ativas/i);
});

test('reabre somente resolvida com justificativa, novos erros e todo o histórico preservado', () => {
    const source = createResolvedPendencyFixture();
    source.cancelamento = {
        justificativa: 'Registro legado preservado.',
        dataHora: '2026-06-01T10:00:00.000Z',
        usuario: 'Operador legado',
        perfil: 'controlador'
    };
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = reopenPendency(source, {
        justificativa: ' A correção aprovada não correspondia à competência. ',
        erros: [' Competência incorreta ', 'Documento incompleto', 'Competência incorreta']
    }, {
        eventId: 'evt-reabertura-1',
        at: '2026-07-16T12:00:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador'
    });

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.status, 'Aberta');
    assert.deepEqual(result.errosAtuais, ['Competência incorreta', 'Documento incompleto']);
    assert.equal(result.motivo, 'Competência incorreta');
    assert.equal(result.responsavel, 'Escola');
    assert.equal(result.dataResolucao, null);
    assert.deepEqual(result.tentativas, source.tentativas);
    assert.deepEqual(result.cancelamento, source.cancelamento);
    assert.deepEqual(result.historico.slice(0, -1), source.historico);
    assert.deepEqual(result.historico.at(-1), {
        id: 'evt-reabertura-1',
        tipo: 'reabertura',
        dataHora: '2026-07-16T12:00:00.000Z',
        usuario: 'Maria Controladora',
        perfil: 'controlador',
        detalhe: 'Pendência reaberta: A correção aprovada não correspondia à competência.',
        erros: ['Competência incorreta', 'Documento incompleto'],
        tentativaId: null
    });
});

test('rejeita envio corretivo fora dos estados aberta e aguardando reanálise', () => {
    const submission = {
        id: 'tentativa-nova',
        dataDisponibilizacao: '2026-07-17',
        observacao: 'Novo arquivo.'
    };

    assert.throws(
        () => registerCorrectiveSubmission(createResolvedPendencyFixture(), submission, SCHOOL_SUBMISSION_AUDIT),
        /envio corretivo.*Aberta.*Aguardando reanálise/i
    );
    assert.throws(
        () => registerCorrectiveSubmission({
            ...createOpenPendencyFixture(),
            status: 'Cancelada'
        }, submission, SCHOOL_SUBMISSION_AUDIT),
        /envio corretivo.*Aberta.*Aguardando reanálise/i
    );
});

test('rejeita reanálise fora de aguardando ou sem tentativa atual aguardando', () => {
    const review = {
        resultado: 'correto',
        observacao: 'Documento correto.'
    };
    const withoutAwaitingAttempt = createAwaitingPendencyFixture();
    withoutAwaitingAttempt.tentativas[0].status = 'analisada';

    assert.throws(
        () => recordReanalysis(createOpenPendencyFixture(), review, CONTROLLER_REVIEW_AUDIT),
        /somente.*Aguardando reanálise/i
    );
    assert.throws(
        () => recordReanalysis(withoutAwaitingAttempt, review, CONTROLLER_REVIEW_AUDIT),
        /tentativa aguardando/i
    );
});

test('rejeita resultado de reanálise não suportado', () => {
    assert.throws(() => recordReanalysis(createAwaitingPendencyFixture(), {
        resultado: 'aprovado',
        observacao: 'Documento conferido.'
    }, CONTROLLER_REVIEW_AUDIT), /resultado de reanálise não suportado/i);
});

test('rejeita reanálise sem confirmação do perfil controlador', () => {
    const source = createAwaitingPendencyFixture();
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    assert.throws(() => recordReanalysis(source, {
        resultado: 'correto',
        observacao: 'Documento conferido pela escola.'
    }, {
        ...CONTROLLER_REVIEW_AUDIT,
        perfil: 'escola'
    }), /somente.*controlador/i);
    assert.deepEqual(source, sourceSnapshot);
});

test('rejeita reabertura de pendência que não esteja resolvida', () => {
    assert.throws(() => reopenPendency(createOpenPendencyFixture(), {
        justificativa: 'Revisão necessária.',
        erros: ['Dados divergentes']
    }, CONTROLLER_REVIEW_AUDIT), /somente pendências resolvidas/i);
});

test('exige id, data de disponibilização e observação no envio corretivo', () => {
    const source = createOpenPendencyFixture();
    const valid = {
        id: 'tentativa-1',
        dataDisponibilizacao: '2026-07-10',
        observacao: 'Arquivo enviado.'
    };

    assert.throws(
        () => registerCorrectiveSubmission(source, { ...valid, id: ' ' }, SCHOOL_SUBMISSION_AUDIT),
        /ID da tentativa é obrigatório/
    );
    assert.throws(
        () => registerCorrectiveSubmission(source, {
            ...valid,
            dataDisponibilizacao: ' '
        }, SCHOOL_SUBMISSION_AUDIT),
        /Data de disponibilização é obrigatória/
    );
    assert.throws(
        () => registerCorrectiveSubmission(source, { ...valid, observacao: '' }, SCHOOL_SUBMISSION_AUDIT),
        /Observação do envio é obrigatória/
    );
});

test('exige observação e novos erros quando a reanálise é incorreta', () => {
    const source = createAwaitingPendencyFixture();

    assert.throws(() => recordReanalysis(source, {
        resultado: 'correto',
        observacao: ' '
    }, CONTROLLER_REVIEW_AUDIT), /Observação da reanálise é obrigatória/);
    assert.throws(() => recordReanalysis(source, {
        resultado: 'incorreto',
        observacao: 'Persistem erros.',
        errosEncontrados: []
    }, CONTROLLER_REVIEW_AUDIT), /ao menos um erro documental/i);
});

test('exige justificativa no cancelamento', () => {
    assert.throws(() => cancelPendency(createOpenPendencyFixture(), {
        justificativa: ' '
    }, CONTROLLER_REVIEW_AUDIT), /Justificativa do cancelamento é obrigatória/);
});

test('exige justificativa e ao menos um erro válido na reabertura', () => {
    const source = createResolvedPendencyFixture();

    assert.throws(() => reopenPendency(source, {
        justificativa: '',
        erros: ['Dados divergentes']
    }, CONTROLLER_REVIEW_AUDIT), /Justificativa da reabertura é obrigatória/);
    assert.throws(() => reopenPendency(source, {
        justificativa: 'Revisão necessária.',
        erros: []
    }, CONTROLLER_REVIEW_AUDIT), /ao menos um erro documental/i);
});

test('inicializa arrays legados ausentes sem mutar o registro de origem', () => {
    const source = createOpenPendencyFixture();
    delete source.tentativas;
    delete source.historico;
    const sourceSnapshot = JSON.parse(JSON.stringify(source));

    const result = registerCorrectiveSubmission(source, {
        id: 'tentativa-legada-1',
        dataDisponibilizacao: '2026-07-10',
        observacao: 'Arquivo legado corrigido.'
    }, SCHOOL_SUBMISSION_AUDIT);

    assert.deepEqual(source, sourceSnapshot);
    assert.equal(result.tentativas.length, 1);
    assert.equal(result.tentativas[0].numero, 1);
    assert.equal(result.historico.length, 1);
    assert.equal(result.historico[0].tipo, 'novo_envio');
});
