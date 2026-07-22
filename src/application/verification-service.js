(function installRadarVerificationService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const fluxo = typeof module !== 'undefined' && module.exports
        ? require('../domain/fluxo-operacional.js')
        : root.RadarFluxoOperacional;
    const retificacoes = typeof module !== 'undefined' && module.exports
        ? require('../domain/retificacoes.js')
        : root.RadarRetificacoes;
    const pendencias = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const api = factory(contract, fluxo, retificacoes, pendencias);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarVerificationService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createVerificationServiceApi(
    contract,
    defaultFlow,
    defaultRetifications,
    pendencyDomain
) {
    'use strict';

    if (!contract || !defaultFlow || !defaultRetifications) {
        throw new Error('Contrato de dados e domínios de verificação são obrigatórios.');
    }
    const { RepositoryError, cloneValue } = contract;
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });
    const EDITABLE_PROFILES = new Set(['controlador', 'assistente']);

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

    class VerificationService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.ensureVerification = options.ensureVerification;
            this.appendLog = options.appendLog;
            this.getCurrentUser = options.getCurrentUser || (() => ({ name: 'Sistema', role: 'sistema' }));
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date().toISOString());
            this.flow = options.fluxo || defaultFlow;
            this.retifications = options.retificacoes || defaultRetifications;
            this.reopenConsolidation = options.reopenConsolidation || (() => {});
            this.pendencyService = options.pendencyService || null;
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.ensureVerification !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_VERIFICATION_SERVICE', 'Dependências do serviço de verificações inválidas.', 'construct');
            }
        }

        assertEditable(profile, operation) {
            const normalized = normalizeProfile(profile);
            if (!EDITABLE_PROFILES.has(normalized)) {
                fail('FORBIDDEN', 'O perfil atual não pode alterar verificações documentais.', operation);
            }
            return normalized;
        }

        getVerification(schoolId, compKey) {
            return this.ensureVerification(text(schoolId), text(compKey));
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
            const persistence = {};
            return this.dataService.execute({
                name: 'verification:set-bonification',
                changedEntities: ['verifications', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const schoolId = text(input.schoolId);
                    const compKey = text(input.compKey);
                    const documentKey = text(input.documentKey);
                    const value = text(input.value);
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
                    const before = cloneValue(verification.bonificacao || {});
                    verification.bonificacao = verification.bonificacao || {};
                    verification.analise = verification.analise || {};
                    verification.bonificacao[documentKey] = value;
                    if (documentKey === 'notaFiscal') {
                        if (value === 'Não se aplica') {
                            verification.bonificacao.encampInventario = 'Não se aplica';
                            verification.analise.encampInventario = 'Correto';
                            verification.bonificacao.consAssessoria = 'Não se aplica';
                            verification.analise.consAssessoria = 'Correto';
                            verification.analise.notaFiscal = 'Correto';
                        } else if (value === 'Sim' || value === 'Não') {
                            if (verification.bonificacao.encampInventario === 'Não se aplica') {
                                verification.bonificacao.encampInventario = '';
                                verification.analise.encampInventario = 'Não analisado';
                            }
                            if (verification.bonificacao.consAssessoria === 'Não se aplica') {
                                verification.bonificacao.consAssessoria = '';
                                verification.analise.consAssessoria = 'Não analisado';
                            }
                        }
                    }
                    const changed = JSON.stringify(before) !== JSON.stringify(verification.bonificacao);
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
        }

        findActivePendency(state, schoolId, compKey, documentKey) {
            if (!pendencyDomain) return null;
            const { competence, programId } = splitCompKey(compKey);
            return pendencyDomain.findActivePendency(list(state?.pendencies), {
                escolaId: schoolId,
                competencia: competence,
                competenciaOrigem: competence,
                programaId: programId,
                documentoKey: documentKey
            }) || null;
        }

        async setTechnicalAnalysis(input = {}) {
            this.assertEditable(input.profile, 'setTechnicalAnalysis');
            const persistence = {};
            return this.dataService.execute({
                name: 'verification:set-technical-analysis',
                changedEntities: ['verifications', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const schoolId = text(input.schoolId);
                    const compKey = text(input.compKey);
                    const documentKey = text(input.documentKey);
                    const value = text(input.value);
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
                    if (value !== 'Não analisado' && !text(verification.bonificacao[documentKey])) {
                        fail(
                            'DELIVERY_REQUIRED',
                            'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).',
                            'setTechnicalAnalysis'
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
                        shouldOpenPendency: value === 'Incorreto'
                    };
                },
                persist: context => this.persistAtomicVerification(context, persistence)
            });
        }

        async closeBonification(input = {}) {
            this.assertEditable(input.profile, 'closeBonification');
            const persistence = {};
            return this.dataService.execute({
                name: 'verification:close-bonification',
                changedEntities: ['verifications', 'administrativeLogs'],
                mutate: () => {
                    const schoolId = text(input.schoolId);
                    const compKey = text(input.compKey);
                    const verification = this.getVerification(schoolId, compKey);
                    persistence.schoolId = schoolId;
                    persistence.compKey = compKey;
                    persistence.expectedVersion = rowVersionOf(verification);
                    const evaluation = this.flow.evaluateBonification(verification.bonificacao);
                    if (!evaluation.canConsolidate) {
                        fail(
                            'INCOMPLETE_BONIFICATION',
                            `Preencha todos os itens de bonificação antes de consolidar: ${evaluation.missingFields.map(key => DOCUMENT_LABELS[key] || key).join(', ')}.`,
                            'closeBonification',
                            { missingFields: [...evaluation.missingFields] }
                        );
                    }
                    verification.resultadoBonif = evaluation.status;
                    const log = this.appendSchoolLog(
                        schoolId,
                        'Bonificação Consolidada',
                        `A bonificação da escola ${schoolId} para ${compKey} foi fechada como "${evaluation.status.toUpperCase()}".`
                    );
                    persistence.logId = text(log?.id);
                    return { status: evaluation.status, verification: cloneValue(verification) };
                },
                persist: context => this.persistAtomicVerification(context, persistence)
            });
        }

        async retify(input = {}) {
            const profile = normalizeProfile(input.profile);
            if (!this.retifications.canRetify(profile)) {
                fail('FORBIDDEN', 'Retificação permitida somente ao perfil Assistente nesta fase.', 'retify');
            }
            const persistence = {};
            return this.dataService.execute({
                name: 'verification:retify',
                changedEntities: ['verifications', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const schoolId = text(input.schoolId);
                    const compKey = text(input.compKey);
                    const { competence, programId } = splitCompKey(compKey, input.programId);
                    const verification = this.getVerification(schoolId, compKey);
                    persistence.schoolId = schoolId;
                    persistence.compKey = compKey;
                    persistence.programId = programId;
                    persistence.expectedVersion = rowVersionOf(verification);
                    const user = this.getCurrentUser() || {};
                    try {
                        const result = this.retifications.applyRetification(verification, {
                            bonificacao: cloneValue(input.bonification || input.bonificacao || {}),
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
