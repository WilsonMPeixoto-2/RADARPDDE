(function (root, factory) {
    const fluxoOperacionalApi = typeof module === 'object' && module.exports
        ? require('./fluxo-operacional.js')
        : root && root.RadarFluxoOperacional;
    const api = factory(fluxoOperacionalApi);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarPendencias = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (RadarFluxoOperacional) {
    'use strict';

    const PENDENCY_SCHEMA_VERSION = 2;
    const PENDENCY_STATUS = Object.freeze({
        OPEN: 'Aberta',
        AWAITING_REVIEW: 'Aguardando reanálise',
        RESOLVED: 'Resolvida',
        CANCELLED: 'Cancelada'
    });
    const ACTIVE_STATUS_VALUES = Object.freeze([
        PENDENCY_STATUS.OPEN,
        PENDENCY_STATUS.AWAITING_REVIEW
    ]);
    const INTERNAL_ACTIVE_STATUSES = new Set(ACTIVE_STATUS_VALUES);
    const ACTIVE_STATUSES = createImmutableSet(ACTIVE_STATUS_VALUES);
    const DOCUMENT_ERROR_TYPES = Object.freeze([
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

    function normalizeText(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function createImmutableSet(values) {
        const mutatingMethods = new Set(['add', 'delete', 'clear']);
        const target = new Set(values);
        let immutableSet;

        function forEach(callback, thisArg) {
            if (typeof callback !== 'function') {
                throw new TypeError('Callback de forEach deve ser uma função.');
            }

            target.forEach(value => {
                callback.call(thisArg, value, value, immutableSet);
            });
        }

        immutableSet = new Proxy(target, {
            get(set, property) {
                if (mutatingMethods.has(property)) {
                    return function blockMutation() {
                        throw new TypeError('ACTIVE_STATUSES é imutável.');
                    };
                }
                if (property === 'forEach') {
                    return forEach;
                }

                const value = Reflect.get(set, property, set);
                return typeof value === 'function' ? value.bind(set) : value;
            }
        });

        return Object.freeze(immutableSet);
    }

    function normalizeUniqueNonEmptyStrings(values) {
        if (!Array.isArray(values)) {
            return [];
        }

        return [...new Set(values.map(normalizeText).filter(Boolean))];
    }

    function requireText(value, fieldName, message) {
        const normalized = normalizeText(value);
        if (!normalized) {
            throw new TypeError(message || `${fieldName} é obrigatório.`);
        }
        return normalized;
    }

    function clonePendency(pendency) {
        return JSON.parse(JSON.stringify(pendency));
    }

    function ensurePendencyArrays(pendency) {
        pendency.tentativas = Array.isArray(pendency.tentativas)
            ? pendency.tentativas
            : [];
        pendency.historico = Array.isArray(pendency.historico)
            ? pendency.historico
            : [];
        return pendency;
    }

    function findLatestAwaitingAttempt(pendency = {}) {
        const attempts = Array.isArray(pendency.tentativas) ? pendency.tentativas : [];
        return [...attempts]
            .reverse()
            .find(attempt => attempt && attempt.status === 'aguardando') || null;
    }

    function isActivePendency(pendency = {}) {
        return INTERNAL_ACTIVE_STATUSES.has(normalizeText(pendency.status));
    }

    function isDocumentaryPendency(pendency = {}) {
        return Boolean(
            normalizeText(pendency.programaId)
            && normalizeText(pendency.documentoKey)
        );
    }

    function getNextActor(pendency = {}) {
        const status = normalizeText(pendency.status);
        if (status === PENDENCY_STATUS.OPEN) {
            return 'Escola';
        }
        if (status === PENDENCY_STATUS.AWAITING_REVIEW) {
            return 'Controlador';
        }
        return null;
    }

    function getCanonicalCompetence(context = {}) {
        return normalizeText(context.competenciaOrigem || context.competencia);
    }

    function getStructuredContextParts(context = {}) {
        return [
            normalizeText(context.escolaId),
            getCanonicalCompetence(context),
            normalizeText(context.programaId),
            normalizeText(context.documentoKey)
        ];
    }

    function buildDocumentContextKey(context = {}) {
        return getStructuredContextParts(context).join('::');
    }

    function hasCompleteStructuredContext(context = {}) {
        return getStructuredContextParts(context).every(Boolean);
    }

    function sameDocumentContext(pendency, context) {
        if (!hasCompleteStructuredContext(context)) {
            return false;
        }

        if (hasCompleteStructuredContext(pendency)) {
            return buildDocumentContextKey(pendency) === buildDocumentContextKey(context);
        }

        const pendencyParts = getStructuredContextParts(pendency);
        const contextParts = getStructuredContextParts(context);
        const hasExactSchoolAndCompetence = pendencyParts[0] === contextParts[0]
            && pendencyParts[1] === contextParts[1];
        const isTextOnlyLegacyContext = !pendencyParts[2] && !pendencyParts[3];
        const legacyItem = normalizeText(pendency && pendency.item);
        const hasTargetTextIdentity = Boolean(
            normalizeText(context && context.item)
            || normalizeText(context && context.documentoNome)
        );

        if (!hasExactSchoolAndCompetence
            || !isTextOnlyLegacyContext
            || !legacyItem
            || !hasTargetTextIdentity) {
            return false;
        }

        if (!RadarFluxoOperacional
            || typeof RadarFluxoOperacional.pendencyMatchesContext !== 'function') {
            return false;
        }

        return RadarFluxoOperacional.pendencyMatchesContext(pendency, {
            ...context,
            competencia: getCanonicalCompetence(context)
        });
    }

    function findActivePendency(pendencies, context = {}) {
        if (!Array.isArray(pendencies)) {
            return undefined;
        }

        return pendencies.find(pendency => (
            isActivePendency(pendency) && sameDocumentContext(pendency, context)
        ));
    }

    function validateDocumentErrors(errors) {
        const normalizedErrors = normalizeUniqueNonEmptyStrings(errors);
        if (normalizedErrors.length === 0) {
            throw new TypeError('Informe ao menos um erro documental.');
        }
        if (normalizedErrors.includes('Documento ausente') && normalizedErrors.length > 1) {
            throw new TypeError('Documento ausente deve ser selecionado isoladamente.');
        }
        return normalizedErrors;
    }

    function normalizeIsoTimestamp(value) {
        const normalized = requireText(value, 'Data e hora do evento');
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime())) {
            throw new TypeError('Data e hora do evento deve estar em formato ISO válido.');
        }
        return parsed.toISOString();
    }

    function createHistoryEvent(type, audit = {}, detail, errors, attemptId) {
        return {
            id: requireText(audit.eventId || audit.id, 'ID do evento'),
            tipo: type,
            dataHora: normalizeIsoTimestamp(audit.at || audit.timestamp || audit.dataHora),
            usuario: requireText(
                audit.usuario || audit.user || audit.usuarioId,
                'Usuário do evento'
            ),
            perfil: requireText(audit.perfil || audit.profile, 'Perfil do evento'),
            detalhe: detail,
            erros: Array.isArray(errors) ? [...errors] : [],
            tentativaId: normalizeText(attemptId) || null
        };
    }

    function createDocumentPendency(input = {}, audit = {}) {
        const competencia = requireText(
            input.competenciaOrigem || input.competencia,
            'Competência'
        );
        const errosAtuais = validateDocumentErrors(input.errosAtuais || input.erros);
        const status = PENDENCY_STATUS.OPEN;
        const openingEvent = createHistoryEvent(
            'abertura',
            audit,
            'Pendência documental aberta.',
            errosAtuais,
            null
        );

        return {
            schemaVersion: PENDENCY_SCHEMA_VERSION,
            tipo: 'documental',
            id: requireText(input.id, 'ID da pendência'),
            escolaId: requireText(input.escolaId, 'Escola'),
            competencia,
            competenciaOrigem: competencia,
            programaId: requireText(input.programaId, 'Programa'),
            documentoKey: requireText(input.documentoKey, 'Documento'),
            item: requireText(input.item, 'Item'),
            status,
            errosAtuais,
            motivo: errosAtuais[0],
            observacao: requireText(input.observacao, 'Observação'),
            responsavel: getNextActor({ status }),
            dataAbertura: requireText(input.dataAbertura, 'Data de abertura'),
            dataResolucao: null,
            tentativas: [],
            historico: [openingEvent],
            cancelamento: null,
            contextoIncompleto: false
        };
    }

    function registerCorrectiveSubmission(pendency = {}, submission = {}, audit = {}) {
        const status = normalizeText(pendency.status);
        if (status !== PENDENCY_STATUS.OPEN && status !== PENDENCY_STATUS.AWAITING_REVIEW) {
            throw new Error(
                'Envio corretivo permitido somente para pendência Aberta ou Aguardando reanálise.'
            );
        }

        const attemptId = requireText(submission.id, 'ID da tentativa');
        const availabilityDate = requireText(
            submission.dataDisponibilizacao,
            'Data de disponibilização',
            'Data de disponibilização é obrigatória.'
        );
        const observation = requireText(
            submission.observacao,
            'Observação do envio',
            'Observação do envio é obrigatória.'
        );
        const next = ensurePendencyArrays(clonePendency(pendency));
        const previousAwaitingAttempt = findLatestAwaitingAttempt(next);

        if (previousAwaitingAttempt) {
            previousAwaitingAttempt.status = 'substituida_antes_da_analise';
        }

        const event = createHistoryEvent(
            'novo_envio',
            audit,
            'Novo envio corretivo registrado para reanálise.',
            next.errosAtuais,
            attemptId
        );
        const attempt = {
            id: attemptId,
            numero: next.tentativas.length + 1,
            dataDisponibilizacao: availabilityDate,
            dataRegistro: event.dataHora,
            observacao: observation,
            link: normalizeText(submission.link) || null,
            registradoPor: event.usuario,
            status: 'aguardando',
            dataAnalise: null,
            analisadoPor: null,
            resultado: null,
            errosEncontrados: [],
            observacaoAnalise: null
        };

        next.tentativas.push(attempt);
        next.status = PENDENCY_STATUS.AWAITING_REVIEW;
        next.responsavel = getNextActor(next);
        next.dataResolucao = null;
        next.historico.push(event);
        return next;
    }

    function recordReanalysis(pendency = {}, review = {}, audit = {}) {
        if (normalizeText(pendency.status) !== PENDENCY_STATUS.AWAITING_REVIEW) {
            throw new Error('Reanálise permitida somente para pendência Aguardando reanálise.');
        }

        const next = ensurePendencyArrays(clonePendency(pendency));
        const attempt = findLatestAwaitingAttempt(next);
        if (!attempt) {
            throw new Error('Não há tentativa aguardando reanálise.');
        }

        const result = normalizeText(review.resultado);
        if (!['correto', 'incorreto', 'arquivo_indisponivel'].includes(result)) {
            throw new TypeError('Resultado de reanálise não suportado.');
        }
        const observation = requireText(
            review.observacao,
            'Observação da reanálise',
            'Observação da reanálise é obrigatória.'
        );
        let errors;
        let eventType;
        let eventDetail;

        if (result === 'correto') {
            errors = [];
            eventType = 'reanalise_correta';
            eventDetail = 'Reanálise confirmou a correção do documento.';
        } else if (result === 'incorreto') {
            errors = validateDocumentErrors(review.errosEncontrados || review.erros);
            eventType = 'reanalise_incorreta';
            eventDetail = 'Reanálise identificou erros no documento corrigido.';
        } else {
            errors = ['Arquivo não localizado ou inacessível'];
            eventType = 'arquivo_indisponivel';
            eventDetail = 'Reanálise não localizou um arquivo acessível.';
        }

        const attemptId = requireText(attempt.id, 'ID da tentativa aguardando');
        const event = createHistoryEvent(
            eventType,
            audit,
            eventDetail,
            errors,
            attemptId
        );
        if (normalizeText(event.perfil).toLocaleLowerCase('pt-BR') !== 'controlador') {
            throw new Error('Reanálise permitida somente ao perfil Controlador.');
        }

        attempt.status = 'analisada';
        attempt.dataAnalise = event.dataHora;
        attempt.analisadoPor = event.usuario;
        attempt.resultado = result;
        attempt.errosEncontrados = [...errors];
        attempt.observacaoAnalise = observation;

        next.errosAtuais = [...errors];
        next.motivo = errors[0] || null;
        next.status = result === 'correto'
            ? PENDENCY_STATUS.RESOLVED
            : PENDENCY_STATUS.OPEN;
        next.responsavel = getNextActor(next);
        next.dataResolucao = result === 'correto' ? event.dataHora.slice(0, 10) : null;
        next.historico.push(event);
        return next;
    }

    function cancelPendency(pendency = {}, cancellation = {}, audit = {}) {
        const justification = requireText(
            cancellation.justificativa,
            'Justificativa do cancelamento',
            'Justificativa do cancelamento é obrigatória.'
        );
        const status = normalizeText(pendency.status);
        if (status === PENDENCY_STATUS.CANCELLED) {
            throw new Error('A pendência já está cancelada.');
        }
        if (!isActivePendency(pendency)) {
            throw new Error('Somente pendências ativas podem ser canceladas.');
        }

        const next = ensurePendencyArrays(clonePendency(pendency));
        const event = createHistoryEvent(
            'cancelamento',
            audit,
            `Pendência cancelada: ${justification}`,
            next.errosAtuais,
            null
        );

        next.status = PENDENCY_STATUS.CANCELLED;
        next.responsavel = getNextActor(next);
        next.dataResolucao = null;
        next.cancelamento = {
            justificativa: justification,
            dataHora: event.dataHora,
            usuario: event.usuario,
            perfil: event.perfil
        };
        next.historico.push(event);
        return next;
    }

    function reopenPendency(pendency = {}, input = {}, audit = {}) {
        if (normalizeText(pendency.status) !== PENDENCY_STATUS.RESOLVED) {
            throw new Error('Somente pendências resolvidas podem ser reabertas.');
        }

        const justification = requireText(
            input.justificativa,
            'Justificativa da reabertura',
            'Justificativa da reabertura é obrigatória.'
        );
        const errors = validateDocumentErrors(input.errosAtuais || input.erros);
        const next = ensurePendencyArrays(clonePendency(pendency));
        const event = createHistoryEvent(
            'reabertura',
            audit,
            `Pendência reaberta: ${justification}`,
            errors,
            null
        );

        next.status = PENDENCY_STATUS.OPEN;
        next.errosAtuais = [...errors];
        next.motivo = errors[0];
        next.responsavel = getNextActor(next);
        next.dataResolucao = null;
        next.historico.push(event);
        return next;
    }

    return Object.freeze({
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
    });
}));
