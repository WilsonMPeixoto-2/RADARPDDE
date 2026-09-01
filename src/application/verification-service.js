(function installRadarVerificationService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const competencia = typeof module !== 'undefined' && module.exports
        ? require('../domain/competencia.js')
        : root.RadarCompetencia;
    const fluxo = typeof module !== 'undefined' && module.exports
        ? require('../domain/fluxo-operacional.js')
        : root.RadarFluxoOperacional;
    const retificacoes = typeof module !== 'undefined' && module.exports
        ? require('../domain/retificacoes.js')
        : root.RadarRetificacoes;
    const pendencias = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('../domain/service-advisory.js')
        : root.RadarServiceAdvisory;
    const api = factory(
        contract,
        competencia,
        fluxo,
        retificacoes,
        pendencias,
        serviceAdvisory
    );

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarVerificationService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createVerificationServiceApi(
    contract,
    defaultCompetence,
    defaultFlow,
    defaultRetifications,
    pendencyDomain,
    serviceAdvisory
) {
    'use strict';

    if (!contract || !defaultCompetence || !defaultFlow || !defaultRetifications || !serviceAdvisory) {
        throw new Error('Contrato de dados e domínios de verificação são obrigatórios.');
    }
    const { RepositoryError, cloneValue } = contract;
    const { deriveServiceAdvisory } = serviceAdvisory;
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        boletoInternet: 'Boleto de pagamento de Internet',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });
    const EDITABLE_PROFILES = new Set(['controlador', 'assistente']);
    const SERVICE_ADVISORY_DERIVED_BONIFICATION_KEYS = new Set([
        'consAssessoria',
        'consEnviada'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'assistente cre' || normalized === 'assistente de verbas federais') return 'assistente';
        return normalized;
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function asRepositoryError(error, operation) {
        if (error instanceof RepositoryError) return error;
        return new RepositoryError('VALIDATION_FAILED', error?.message || 'Operação documental inválida.', {
            operation,
            cause: error
        });
    }

    function splitCompKey(compKey, programId) {
        const value = text(compKey);
        const suffix = text(programId);
        if (suffix && value.endsWith(`_${suffix}`)) {
            return { competence: value.slice(0, -(suffix.length + 1)), programId: suffix };
        }
        const separator = value.indexOf('_');
        return separator < 0
            ? { competence: value, programId: suffix }
            : { competence: value.slice(0, separator), programId: value.slice(separator + 1) };
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function pendencyMatchesMonthlyContext(pendency, context) {
        const schoolId = text(pendency?.escolaId || pendency?.school_id);
        const competence = text(
            pendency?.competenciaOrigem
            || pendency?.competencia
            || pendency?.competence_origin
            || pendency?.competence_id
        );
        const programId = text(pendency?.programaId || pendency?.program_id);
        if (schoolId !== context.schoolId) return false;
        if (competence && competence !== context.competence) return false;
        if (programId && context.programId && programId !== context.programId) return false;
        return true;
    }

    class VerificationService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.ensureVerification = options.ensureVerification;
            this.appendLog = options.appendLog;
            this.getCurrentUser = options.getCurrentUser || (() => ({ name: 'Sistema', role: 'sistema' }));
            this.getCurrentProfile = options.getCurrentProfile || (() => '');
            this.getCurrentDate = options.getCurrentDate || (() => new Date());
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date().toISOString());
            this.competence = options.competencia || defaultCompetence;
            this.flow = options.fluxo || defaultFlow;
            this.retifications = options.retificacoes || defaultRetifications;
            this.reopenConsolidation = options.reopenConsolidation || (() => {});
            this.pendencyService = options.pendencyService || null;
            this.verificationWriteQueues = new Map();
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.ensureVerification !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_VERIFICATION_SERVICE', 'Dependências do serviço de verificações inválidas.', 'construct');
            }
        }

        assertEditable(profile, operation) {
            const normalized = normalizeProfile(this.getCurrentProfile() || profile);
            if (!EDITABLE_PROFILES.has(normalized)) {
                fail('FORBIDDEN', 'O perfil atual não pode alterar verificações documentais.', operation);
            }
            return normalized;
        }

        assertCompetenceEditable(compKey, operation) {
            const { competence } = splitCompKey(compKey);
            if (this.competence.isFutureCompetence(competence, this.getCurrentDate())) {
                fail(
                    'FUTURE_COMPETENCE',
                    `${this.competence.formatCompetencia(competence)} ainda é uma competência futura e permanece somente para consulta até o início do mês.`,
                    operation,
                    { competence }
                );
            }
            return competence;
        }

        getVerification(schoolId, compKey) {
            return this.ensureVerification(text(schoolId), text(compKey));
        }

        runSerializedVerificationWrite(input, operation) {
            const key = `${text(input?.schoolId)}::${text(input?.compKey)}`;
            const previous = this.verificationWriteQueues.get(key) || Promise.resolve();
            const run = previous.catch(() => undefined).then(operation);
            this.verificationWriteQueues.set(key, run);
            return run.finally(() => {
                if (this.verificationWriteQueues.get(key) === run) {
                    this.verificationWriteQueues.delete(key);
                }
            });
        }

        getMonthlyEvaluation(input = {}) {
            const schoolId = text(input.schoolId);
            const compKey = text(input.compKey);
            const { competence, programId } = splitCompKey(compKey, input.programId);
            const verification = input.verification || this.getVerification(schoolId, compKey);
            const state = this.getState() || {};
            const pendencies = list(state.pendencies || state.pendencias).filter(pendency => (
                pendencyMatchesMonthlyContext(pendency, { schoolId, competence, programId })
            ));
            return this.flow.evaluateMonthlyEvaluation({
                bonification: verification?.bonificacao || verification?.bonification || {},
                analysis: verification?.analise || verification?.analysis || {},
                bonusResult: verification?.resultadoBonif || verification?.bonus_result || '',
                programId,
                pendencies
            });
        }

        appendSchoolLog(schoolId, action, details) {
            const log = this.appendLog(action, details, { escolaId: schoolId, schoolId });
            if (log && typeof log === 'object') {
                if (!text(log.escolaId) && !text(log.school_id)) log.escolaId = schoolId;
                const stored = list(this.getState()?.logs).find(item => String(item?.id) === String(log.id));
                if (stored && !text(stored.escolaId) && !text(stored.school_id)) stored.escolaId = schoolId;
            }
            return log || null;
        }

        async persistAtomicVerification(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            if (typeof repository.saveVerificationWithLog !== 'function') return defaultPersist();

            const { competence, programId } = splitCompKey(persistence.compKey, persistence.programId);
            const verification = list(snapshot?.entities?.verifications).find(record => (
                String(record.school_id) === String(persistence.schoolId)
                && String(record.competence_id) === String(competence)
                && String(record.program_id) === String(programId)
            ));
            const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));

            if (!verification || !administrativeLog) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'A verificação ou o histórico da operação não foi produzido para persistência.',
                    'persistAtomicVerification',
                    {
                        schoolId: persistence.schoolId,
                        compKey: persistence.compKey,
                        logId: persistence.logId
                    }
                );
            }

            return repository.saveVerificationWithLog({
                verification,
                expectedVersion: persistence.expectedVersion,
                administrativeLog
            });
        }

        async setBonification(input = {}) {
            const profile = this.assertEditable(input.profile, 'setBonification');
            this.assertCompetenceEditable(input.compKey, 'setBonification');
            return this.runSerializedVerificationWrite(input, async () => {
                const schoolId = text(input.schoolId);
                const compKey = text(input.compKey);
                const documentKey = text(input.documentKey);
                const { programId } = splitCompKey(compKey);
                if (documentKey === 'boletoInternet') {
                    fail(
                        'DOCUMENT_NOT_APPLICABLE',
                        'Boleto de pagamento de Internet é um tipo de gasto de Notas Fiscais e não possui bonificação documental independente.',
                        'setBonification',
                        { programId, documentKey }
                    );
                }
                if (SERVICE_ADVISORY_DERIVED_BONIFICATION_KEYS.has(documentKey)) {
                    fail(
                        'DOCUMENT_NOT_APPLICABLE',
                        'Consulta à Assessoria é derivada das Notas Fiscais de serviço e não pode ser alterada como bonificação mensal.',
                        'setBonification',
                        { programId, documentKey }
                    );
                }
                const value = text(input.value);
                const currentVerification = this.getVerification(schoolId, compKey);
                const currentValue = text(currentVerification?.bonificacao?.[documentKey]);
                const currentState = this.getState();
                const currentContextInvoices = documentKey === 'notaFiscal'
                    ? list(currentState.registeredInvoices).filter(note => (
                        note.escolaId === schoolId && note.compKey === compKey
                    ))
                    : [];
                const currentAdvisory = documentKey === 'notaFiscal'
                    ? deriveServiceAdvisory(currentContextInvoices)
                    : null;
                const advisoryAlreadyCanonical = !currentAdvisory || (
                    text(currentVerification?.bonificacao?.consAssessoria) === currentAdvisory.delivery
                    && (currentVerification?.bonificacao?.consEnviada === true) === currentAdvisory.sent
                    && text(currentVerification?.analise?.consAssessoria) === currentAdvisory.analysis
                );
                if (currentValue === value && advisoryAlreadyCanonical) {
                    return {
                        ok: true,
                        value: {
                            verification: cloneValue(currentVerification),
                            unchanged: true
                        }
                    };
                }

                const persistence = {};
                return this.dataService.execute({
                    name: 'verification:set-bonification',
                    changedEntities: ['verifications', 'administrativeLogs'],
                    remoteResultIsAuthoritative: true,
                    mutate: () => {
                        const state = this.getState();
                        const verification = this.getVerification(schoolId, compKey);
                        persistence.schoolId = schoolId;
                        persistence.compKey = compKey;
                        persistence.expectedVersion = rowVersionOf(verification);
                        if (verification.resultadoBonif && profile !== 'assistente') {
                            fail(
                                'CONSOLIDATED_VERIFICATION',
                                'Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos na bonificação.',
                                'setBonification'
                            );
                        }
                        const registeredNotes = list(state.registeredInvoices).filter(note => (
                            note.escolaId === schoolId && note.compKey === compKey
                        ));
                        if (documentKey === 'notaFiscal' && value === 'Não se aplica' && registeredNotes.length > 0) {
                            fail(
                                'FISCAL_NOTES_EXIST',
                                `Existem notas fiscais cadastradas (${registeredNotes.map(note => note.numero).join(', ')}). Para marcar N/A, faça a exclusão individual de cada nota antes. Nenhuma nota ou bem foi excluído.`,
                                'setBonification'
                            );
                        }
                        if (documentKey === 'declBBAgil' && value === 'Não se aplica') {
                            const activePendency = this.findActivePendency(
                                state,
                                schoolId,
                                compKey,
                                documentKey
                            );
                            if (activePendency) {
                                fail(
                                    'ACTIVE_PENDENCY',
                                    'A Declaração BB Ágil possui pendência ativa. Resolva ou cancele a pendência antes de marcar N/A.',
                                    'setBonification',
                                    { pendencyId: activePendency.id }
                                );
                            }
                        }
                        const beforeBonification = cloneValue(verification.bonificacao || {});
                        const beforeAnalysis = cloneValue(verification.analise || {});
                        verification.bonificacao = verification.bonificacao || {};
                        verification.analise = verification.analise || {};
                        verification.bonificacao[documentKey] = value;
                        if (documentKey === 'declBBAgil') {
                            if (value === 'Não se aplica') {
                                verification.analise.declBBAgil = 'Correto';
                            } else if (
                                (value === 'Sim' || value === 'Não')
                                && beforeBonification.declBBAgil === 'Não se aplica'
                            ) {
                                verification.analise.declBBAgil = 'Não analisado';
                            }
                        }
                        if (documentKey === 'notaFiscal') {
                            if (value === 'Não se aplica') {
                                verification.bonificacao.encampInventario = 'Não se aplica';
                                verification.analise.encampInventario = 'Correto';
                                verification.analise.notaFiscal = 'Correto';
                            } else if (value === 'Sim' || value === 'Não') {
                                if (beforeBonification.notaFiscal === 'Não se aplica') {
                                    verification.analise.notaFiscal = 'Não analisado';
                                }
                                if (verification.bonificacao.encampInventario === 'Não se aplica') {
                                    verification.bonificacao.encampInventario = '';
                                    verification.analise.encampInventario = 'Não analisado';
                                }
                            }

                            const advisory = deriveServiceAdvisory(registeredNotes);
                            verification.bonificacao.consAssessoria = advisory.delivery;
                            verification.bonificacao.consEnviada = advisory.sent;
                            verification.analise.consAssessoria = advisory.analysis;
                        }
                        const changed = JSON.stringify(beforeBonification) !== JSON.stringify(verification.bonificacao)
                            || JSON.stringify(beforeAnalysis) !== JSON.stringify(verification.analise);
                        this.reopenConsolidation(schoolId, compKey, verification, changed);
                        const log = this.appendSchoolLog(
                            schoolId,
                            'Bonificação Alterada',
                            `Bonificação de ${DOCUMENT_LABELS[documentKey] || documentKey} em ${compKey} da escola ${schoolId} alterada para "${value}".`
                        );
                        persistence.logId = text(log?.id);
                        return { verification: cloneValue(verification) };
                    },
                    persist: context => this.persistAtomicVerification(context, persistence)
                });
            });
        }

        findActivePendency(state, schoolId, compKey, documentKey) {
            if (!pendencyDomain) return null;
            const { competence, programId } = splitCompKey(compKey);
            const context = pendencyDomain.buildPendencyLookupContext({
                escolaId: schoolId,
                competencia: competence,
                programaId: programId,
                documentoKey: documentKey
            });
            return pendencyDomain.findActivePendency(
                list(state?.pendencies),
                context
            ) || null;
        }

        async setTechnicalAnalysis(input = {}) {
            this.assertEditable(input.profile, 'setTechnicalAnalysis');
            this.assertCompetenceEditable(input.compKey, 'setTechnicalAnalysis');
            const technicalDocumentKey = text(input.documentKey);
            const { programId: technicalProgramId } = splitCompKey(input.compKey);
            if (technicalDocumentKey === 'notaFiscal') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'A situação técnica de Notas Fiscais é calculada automaticamente a partir de cada despesa e não pode ser alterada diretamente.',
                    'setTechnicalAnalysis',
                    { programId: technicalProgramId, documentKey: technicalDocumentKey }
                );
            }
            if (technicalDocumentKey === 'boletoInternet') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Boleto de pagamento de Internet é avaliado pela análise técnica de Notas Fiscais e não possui análise documental independente.',
                    'setTechnicalAnalysis',
                    { programId: technicalProgramId, documentKey: technicalDocumentKey }
                );
            }
            if (technicalDocumentKey === 'consAssessoria') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'A análise da Consulta à Assessoria é individual por Nota Fiscal de serviço e não pode ser alterada como análise mensal agregada.',
                    'setTechnicalAnalysis',
                    { programId: technicalProgramId, documentKey: technicalDocumentKey }
                );
            }
            const requestedValue = text(input.value);
            if (requestedValue === 'Incorreto') {
                fail(
                    'PENDENCY_REQUIRED',
                    'A análise “Incorreto” deve ser confirmada junto com a abertura da pendência, na mesma operação.',
                    'setTechnicalAnalysis',
                    {
                        schoolId: text(input.schoolId),
                        compKey: text(input.compKey),
                        documentKey: text(input.documentKey)
                    }
                );
            }
            return this.runSerializedVerificationWrite(input, async () => {
                const persistence = {};
                return this.dataService.execute({
                    name: 'verification:set-technical-analysis',
                    changedEntities: ['verifications', 'administrativeLogs'],
                    remoteResultIsAuthoritative: true,
                    mutate: () => {
                        const state = this.getState();
                        const schoolId = text(input.schoolId);
                        const compKey = text(input.compKey);
                        const documentKey = text(input.documentKey);
                        const value = requestedValue;
                        const activePendency = input.activePendency
                            || this.findActivePendency(state, schoolId, compKey, documentKey);
                        if (activePendency) {
                            fail(
                                'ACTIVE_PENDENCY',
                                activePendency.status === 'Aguardando reanálise'
                                    ? 'Esta análise aguarda reanálise. Use Reanalisar para registrar o resultado.'
                                    : 'Esta análise possui pendência aberta. Use Registrar novo envio para prosseguir.',
                                'setTechnicalAnalysis',
                                { pendencyId: activePendency.id }
                            );
                        }
                        const verification = this.getVerification(schoolId, compKey);
                        persistence.schoolId = schoolId;
                        persistence.compKey = compKey;
                        persistence.expectedVersion = rowVersionOf(verification);
                        verification.analise = verification.analise || {};
                        verification.bonificacao = verification.bonificacao || {};
                        if (
                            documentKey === 'declBBAgil'
                            && text(verification.bonificacao[documentKey]) === 'Não se aplica'
                        ) {
                            fail(
                                'DOCUMENT_NOT_APPLICABLE',
                                'A Declaração BB Ágil marcada como N/A não possui análise técnica editável.',
                                'setTechnicalAnalysis',
                                { documentKey }
                            );
                        }
                        if (value !== 'Não analisado' && !text(verification.bonificacao[documentKey])) {
                            fail(
                                'DELIVERY_REQUIRED',
                                'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).',
                                'setTechnicalAnalysis'
                            );
                        }
                        if (value === 'Correto' && this.flow.requiresLateCorrect({
                            bonusResult: verification.resultadoBonif,
                            deliveryStatus: verification.bonificacao[documentKey]
                        })) {
                            fail(
                                'LATE_ANALYSIS_REQUIRED',
                                'Este documento não foi entregue no período da bonificação já consolidada. Se o arquivo recebido posteriormente estiver correto, registre como "Correto (Atrasado)".',
                                'setTechnicalAnalysis',
                                { documentKey }
                            );
                        }
                        const fiscalNotes = list(state.registeredInvoices).filter(note => (
                            note.escolaId === schoolId && note.compKey === compKey
                        ));
                        if (documentKey === 'notaFiscal' && this.flow.shouldRequireFiscalNote({
                            bonificacaoNotaFiscal: verification.bonificacao.notaFiscal,
                            analiseValue: value,
                            fiscalNotes
                        })) {
                            fail(
                                'FISCAL_NOTE_REQUIRED',
                                'Você declarou que há entrega de Notas Fiscais no Drive (Sim), mas não cadastrou nenhuma Nota Fiscal no sistema. Por favor, cadastre pelo menos uma Nota Fiscal antes de marcar como Correto.',
                                'setTechnicalAnalysis'
                            );
                        }
                        const oldValue = verification.analise[documentKey];
                        verification.analise[documentKey] = value;
                        const log = this.appendSchoolLog(
                            schoolId,
                            'Análise Técnica Alterada',
                            `Análise técnica de ${DOCUMENT_LABELS[documentKey] || documentKey} em ${compKey} da escola ${schoolId} alterada de "${oldValue}" para "${value}".`
                        );
                        persistence.logId = text(log?.id);
                        return {
                            verification: cloneValue(verification),
                            shouldOpenPendency: false
                        };
                    },
                    persist: context => this.persistAtomicVerification(context, persistence)
                });
            });
        }

        async closeBonification(input = {}) {
            this.assertEditable(input.profile, 'closeBonification');
            this.assertCompetenceEditable(input.compKey, 'closeBonification');
            return this.runSerializedVerificationWrite(input, async () => {
                const schoolId = text(input.schoolId);
                const compKey = text(input.compKey);
                const currentVerification = this.getVerification(schoolId, compKey);
                const currentEvaluation = this.getMonthlyEvaluation({
                    schoolId,
                    compKey,
                    verification: currentVerification
                });
                if (currentEvaluation.canConsolidate
                    && text(currentVerification.resultadoBonif)
                    && text(currentVerification.resultadoBonif) === text(currentEvaluation.bonusResult)) {
                    return {
                        ok: true,
                        value: {
                            status: currentEvaluation.bonusResult,
                            evaluation: cloneValue(currentEvaluation),
                            verification: cloneValue(currentVerification),
                            unchanged: true
                        }
                    };
                }

                const persistence = {};
                return this.dataService.execute({
                    name: 'verification:close-bonification',
                    changedEntities: ['verifications', 'administrativeLogs'],
                    remoteResultIsAuthoritative: true,
                    mutate: () => {
                        const verification = this.getVerification(schoolId, compKey);
                        persistence.schoolId = schoolId;
                        persistence.compKey = compKey;
                        persistence.expectedVersion = rowVersionOf(verification);
                        const evaluation = this.getMonthlyEvaluation({
                            schoolId,
                            compKey,
                            verification
                        });
                        if (!evaluation.canConsolidate) {
                            fail(
                                'INCOMPLETE_BONIFICATION',
                                `Preencha todos os itens de bonificação antes de consolidar: ${evaluation.missingFields.map(key => DOCUMENT_LABELS[key] || key).join(', ')}.`,
                                'closeBonification',
                                { missingFields: [...evaluation.missingFields] }
                            );
                        }
                        verification.resultadoBonif = evaluation.bonusResult;
                        const log = this.appendSchoolLog(
                            schoolId,
                            'Bonificação Consolidada',
                            `A bonificação da escola ${schoolId} para ${compKey} foi fechada como "${evaluation.bonusResult.toUpperCase()}".`
                        );
                        persistence.logId = text(log?.id);
                        return {
                            status: evaluation.bonusResult,
                            evaluation: cloneValue(evaluation),
                            verification: cloneValue(verification)
                        };
                    },
                    persist: context => this.persistAtomicVerification(context, persistence)
                });
            });
        }

        async retify(input = {}) {
            const profile = normalizeProfile(this.getCurrentProfile() || input.profile);
            if (!this.retifications.canRetify(profile)) {
                fail('FORBIDDEN', 'Retificação permitida somente ao perfil Assistente nesta fase.', 'retify');
            }
            this.assertCompetenceEditable(input.compKey, 'retify');
            const retificationContext = splitCompKey(input.compKey, input.programId);
            const requestedBonification = input.bonification || input.bonificacao || {};
            const derivedAdvisoryKey = [...SERVICE_ADVISORY_DERIVED_BONIFICATION_KEYS]
                .find(key => Object.prototype.hasOwnProperty.call(requestedBonification, key));
            if (derivedAdvisoryKey) {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Consulta à Assessoria é derivada das Notas Fiscais de serviço e não pode ser retificada como bonificação mensal.',
                    'retify',
                    {
                        programId: retificationContext.programId,
                        documentKey: derivedAdvisoryKey
                    }
                );
            }
            if (Object.prototype.hasOwnProperty.call(requestedBonification, 'boletoInternet')) {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Boleto de pagamento de Internet é um tipo de gasto de Notas Fiscais e não pode ser retificado como item documental independente.',
                    'retify',
                    {
                        programId: retificationContext.programId,
                        documentKey: 'boletoInternet'
                    }
                );
            }
            return this.runSerializedVerificationWrite(input, async () => {
                const persistence = {};
                return this.dataService.execute({
                    name: 'verification:retify',
                    changedEntities: ['verifications', 'administrativeLogs'],
                    remoteResultIsAuthoritative: true,
                    mutate: () => {
                        const state = this.getState();
                        const schoolId = text(input.schoolId);
                        const compKey = text(input.compKey);
                        const { competence, programId } = retificationContext;
                        const verification = this.getVerification(schoolId, compKey);
                        persistence.schoolId = schoolId;
                        persistence.compKey = compKey;
                        persistence.programId = programId;
                        persistence.expectedVersion = rowVersionOf(verification);
                        const user = this.getCurrentUser() || {};
                        try {
                            const result = this.retifications.applyRetification(verification, {
                                bonificacao: cloneValue(requestedBonification),
                                resultadoBonif: Object.prototype.hasOwnProperty.call(input, 'bonusResult')
                                    ? input.bonusResult
                                    : input.resultadoBonif,
                                justificativa: text(input.justification || input.justificativa)
                            }, {
                                id: this.createId('retificacao'),
                                escolaId: schoolId,
                                competencia: competence,
                                programaId: programId,
                                usuario: text(user.name || user.nome || user.email) || 'Sistema',
                                perfil: profile,
                                at: this.now()
                            });
                            if (!state.verifications[schoolId]) state.verifications[schoolId] = {};
                            state.verifications[schoolId][compKey] = result.verification;
                            const log = this.appendSchoolLog(
                                schoolId,
                                'Consolidação retificada',
                                `Consolidação da escola ${schoolId} em ${compKey} retificada com justificativa auditável.`
                            );
                            persistence.logId = text(log?.id);
                            return {
                                verification: cloneValue(result.verification),
                                retification: cloneValue(result.retification)
                            };
                        } catch (error) {
                            throw asRepositoryError(error, 'retify');
                        }
                    },
                    persist: context => this.persistAtomicVerification(context, persistence)
                });
            });
        }

        async setSubmission(input = {}) {
            if (!this.pendencyService || typeof this.pendencyService.registerAttempt !== 'function') {
                fail('INVALID_PENDENCY_SERVICE', 'Serviço de pendências indisponível.', 'setSubmission');
            }
            return this.pendencyService.registerAttempt(input);
        }
    }

    return Object.freeze({ VerificationService });
}));
