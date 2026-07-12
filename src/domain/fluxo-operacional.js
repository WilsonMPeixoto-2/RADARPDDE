(function (root, factory) {
    const competenciaApi = typeof module === 'object' && module.exports
        ? require('./competencia.js')
        : root && root.RadarCompetencia;
    const api = factory(competenciaApi);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarFluxoOperacional = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (RadarCompetencia) {
    'use strict';

    const DOCUMENT_KEYS = Object.freeze([
        'extCC',
        'extINV',
        'notaFiscal',
        'consAssessoria',
        'declBBAgil',
        'encampInventario'
    ]);
    const REQUIRED_DOCUMENT_KEYS = new Set(['extCC', 'extINV', 'declBBAgil']);
    const VALID_VALUES = new Set(['Sim', 'Não', 'Não se aplica']);
    const EDITABLE_PROFILES = new Set(['controlador', 'assistente']);
    const CORRECT_ANALYSES = new Set(['Correto', 'Correto (Atrasado)']);

    function normalizeText(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function buildPendencyContext(input = {}) {
        const splitContext = RadarCompetencia.splitCompetenciaContext(input.compProgKey);
        const programaNome = normalizeText(input.programaNome) || splitContext.contextId;
        const documentoNome = normalizeText(input.documentoNome);

        return Object.freeze({
            competencia: splitContext.competenciaKey,
            programaId: splitContext.contextId,
            documentoKey: normalizeText(input.documentoKey),
            documentoNome,
            item: [programaNome, documentoNome].filter(Boolean).join(' - ')
        });
    }

    function pendencyMatchesContext(pendency = {}, context = {}) {
        const pendencyCompetencia = normalizeText(
            pendency.competenciaOrigem || pendency.competencia
        );
        const contextCompetencia = normalizeText(context.competencia);

        if (pendencyCompetencia && contextCompetencia
            && pendencyCompetencia !== contextCompetencia) {
            return false;
        }

        const pendencyProgramaId = normalizeText(pendency.programaId);
        const pendencyDocumentoKey = normalizeText(pendency.documentoKey);
        if (pendencyProgramaId || pendencyDocumentoKey) {
            return pendencyProgramaId === normalizeText(context.programaId)
                && pendencyDocumentoKey === normalizeText(context.documentoKey);
        }

        const pendencyItem = normalizeText(pendency.item);
        return pendencyItem === normalizeText(context.item)
            || pendencyItem === normalizeText(context.documentoNome);
    }

    function createEmptyVerification() {
        return {
            bonificacao: Object.fromEntries(DOCUMENT_KEYS.map(key => [key, ''])),
            analise: Object.fromEntries(DOCUMENT_KEYS.map(key => [key, 'Não analisado'])),
            resultadoBonif: ''
        };
    }

    function evaluateBonification(bonificacao = {}) {
        const missingFields = DOCUMENT_KEYS.filter(key => {
            const value = bonificacao[key];
            return !VALID_VALUES.has(value)
                || (REQUIRED_DOCUMENT_KEYS.has(key) && value === 'Não se aplica');
        });

        if (missingFields.length > 0) {
            return Object.freeze({
                canConsolidate: false,
                status: null,
                missingFields: Object.freeze(missingFields)
            });
        }

        const status = DOCUMENT_KEYS.some(key => bonificacao[key] === 'Não')
            ? 'inapta'
            : 'apta';

        return Object.freeze({
            canConsolidate: true,
            status,
            missingFields: Object.freeze([])
        });
    }

    function hasStartedValue(value) {
        return value !== undefined
            && value !== null
            && value !== ''
            && value !== false;
    }

    function getProgramBonificationStatus(verification = {}) {
        const result = normalizeText(verification.resultadoBonif);
        if (result === 'apta' || result === 'inapta') {
            return result;
        }

        const bonificacao = verification.bonificacao || {};
        const hasStarted = DOCUMENT_KEYS.some(key => hasStartedValue(bonificacao[key]));
        return hasStarted ? 'em-apuracao' : 'nao-lancada';
    }

    function getProgramTechnicalAnalysisStatus(verification = {}) {
        const analise = verification.analise || {};
        const values = DOCUMENT_KEYS.map(key => (
            normalizeText(analise[key]) || 'Não analisado'
        ));

        if (values.includes('Incorreto')) {
            return 'incorreto';
        }
        if (values.every(value => CORRECT_ANALYSES.has(value))) {
            return values.includes('Correto (Atrasado)')
                ? 'correto-atrasado'
                : 'correto';
        }
        if (values.every(value => value === 'Não analisado')) {
            return 'nao-analisado';
        }
        return 'em-analise';
    }

    function canRegisterFiscalNote(profile, bonificacaoNotaFiscal) {
        return EDITABLE_PROFILES.has(profile) && bonificacaoNotaFiscal === 'Sim';
    }

    function shouldRequireFiscalNote(input = {}) {
        const isCorrectAnalysis = CORRECT_ANALYSES.has(input.analiseValue);
        const fiscalNotes = Array.isArray(input.fiscalNotes) ? input.fiscalNotes : [];

        return input.bonificacaoNotaFiscal === 'Sim'
            && isCorrectAnalysis
            && fiscalNotes.length === 0;
    }

    return Object.freeze({
        DOCUMENT_KEYS,
        buildPendencyContext,
        canRegisterFiscalNote,
        createEmptyVerification,
        evaluateBonification,
        getProgramBonificationStatus,
        getProgramTechnicalAnalysisStatus,
        pendencyMatchesContext,
        shouldRequireFiscalNote
    });
}));
