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

    function requireText(value, fieldName) {
        const normalized = normalizeText(value);
        if (!normalized) {
            throw new TypeError(`${fieldName} é obrigatório.`);
        }
        return normalized;
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

    function createDocumentPendency(input = {}, audit = {}) {
        const competencia = requireText(
            input.competenciaOrigem || input.competencia,
            'Competência'
        );
        const errosAtuais = validateDocumentErrors(input.errosAtuais || input.erros);
        const status = PENDENCY_STATUS.OPEN;
        const eventId = requireText(audit.eventId || audit.id, 'ID do evento');
        const timestamp = normalizeIsoTimestamp(
            audit.timestamp || audit.dataHora || audit.at
        );
        const usuario = requireText(
            audit.usuario || audit.user || audit.usuarioId,
            'Usuário do evento'
        );
        const perfil = requireText(audit.perfil || audit.profile, 'Perfil do evento');

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
            historico: [{
                id: eventId,
                tipo: 'abertura',
                dataHora: timestamp,
                usuario,
                perfil,
                detalhe: 'Pendência documental aberta.',
                erros: [...errosAtuais],
                tentativaId: null
            }],
            cancelamento: null,
            contextoIncompleto: false
        };
    }

    return Object.freeze({
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
    });
}));
