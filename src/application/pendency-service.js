(function installRadarPendencyService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const domain = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const api = factory(contract, domain);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarPendencyService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createPendencyServiceApi(contract, defaultDomain) {
    'use strict';

    if (!contract || !defaultDomain) {
        throw new Error('Contrato de dados e domínio de pendências são obrigatórios.');
    }
    const { RepositoryError, cloneValue } = contract;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function asRepositoryError(error, operation) {
        if (error instanceof RepositoryError) return error;
        return new RepositoryError('VALIDATION_FAILED', error?.message || 'Operação de pendência inválida.', {
            operation,
            cause: error
        });
    }

    class PendencyService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.domain = options.domain || defaultDomain;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            this.getCurrentUser = options.getCurrentUser || (() => ({ name: 'Sistema', role: 'sistema' }));
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date().toISOString());
            this.getCorrectAnalysisLabel = options.getCorrectAnalysisLabel || (() => 'Correto');
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_PENDENCY_SERVICE', 'Dependências do serviço de pendências inválidas.', 'construct');
            }
        }

        audit(prefix) {
            const user = this.getCurrentUser() || {};
            return {
                eventId: this.createId(prefix),
                at: this.now(),
                usuario: text(user.name || user.nome || user.email) || 'Sistema',
                perfil: text(user.role || user.perfil) || 'sistema'
            };
        }

        find(state, pendencyId, operation) {
            const index = state.pendencies.findIndex(item => String(item.id) === text(pendencyId));
            if (index < 0) fail('NOT_FOUND', 'Pendência não localizada.', operation);
            return { index, pendency: state.pendencies[index] };
        }

        verificationFor(state, pendency, operation) {
            if (!this.domain.isDocumentaryPendency(pendency)) {
                fail('INCOMPLETE_CONTEXT', 'A pendência não possui contexto documental completo.', operation);
            }
            const compKey = `${pendency.competenciaOrigem || pendency.competencia}_${pendency.programaId}`;
            const verification = state.verifications?.[pendency.escolaId]?.[compKey];
            if (!verification) fail('NOT_FOUND', 'Verificação documental não localizada.', operation);
            verification.analise = verification.analise || {};
            verification.bonificacao = verification.bonificacao || {};
            return { verification, compKey };
        }

        appendSchoolLog(schoolId, action, details) {
            const log = this.appendLog(action, details, { escolaId: schoolId, schoolId });
            if (log && typeof log === 'object' && !text(log.escolaId) && !text(log.school_id)) {
                log.escolaId = schoolId;
            }
            return log || null;
        }

        persistPendencyCommand(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            if (typeof repository.savePendencyCommand !== 'function') return defaultPersist();
            const pendency = list(snapshot?.entities?.pendencies)
                .find(record => String(record.id) === String(persistence.pendencyId));
            const attempt = persistence.attemptId
                ? list(snapshot?.entities?.pendencyAttempts)
                    .find(record => String(record.id) === String(persistence.attemptId))
                : null;
            const verification = persistence.verificationContext
                ? list(snapshot?.entities?.verifications).find(record => (
                    String(record.school_id) === String(persistence.verificationContext.schoolId)
                    && String(record.competence_id) === String(persistence.verificationContext.competence)
                    && String(record.program_id || '') === String(persistence.verificationContext.programId || '')
                ))
                : null;
            const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            if (!pendency || !administrativeLog
                || (persistence.attemptId && !attempt)
                || (persistence.verificationContext && !verification)) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'O agregado de pendência não foi produzido integralmente para persistência.',
                    'persistPendencyCommand',
                    cloneValue(persistence)
                );
            }
            return repository.savePendencyCommand({
                operation: persistence.operation,
                pendency,
                expectedPendencyVersion: persistence.expectedPendencyVersion,
                attempt,
                verification,
                expectedVerificationVersion: persistence.expectedVerificationVersion,
                administrativeLog
            });
        }

        async open(input = {}) {
            const persistence = { operation: 'open', expectedPendencyVersion: null };
            return this.dataService.execute({
                name: 'pendency:open',
                changedEntities: ['pendencies', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const context = {
                        escolaId: text(input.schoolId || input.escolaId),
                        competencia: text(input.competence || input.competencia),
                        competenciaOrigem: text(input.competence || input.competencia),
                        programaId: text(input.programId || input.programaId),
                        documentoKey: text(input.documentKey || input.documentoKey),
                        item: text(input.item)
                    };
                    const documentary = Boolean(context.programaId && context.documentoKey);
                    const existing = documentary
                        ? this.domain.findActivePendency(state.pendencies, context)
                        : null;
                    if (documentary && existing) {
                        fail(
                            'DUPLICATE_PENDENCY',
                            'Já existe uma pendência ativa para esta escola, competência, programa e documento.',
                            'open',
                            { existingPendencyId: existing.id }
                        );
                    }
                    try {
                        const id = text(input.id) || this.createId('pend');
                        const openingDate = text(input.openingDate || input.dataAbertura) || this.now().slice(0, 10);
                        const observation = text(input.observation || input.observacao);
                        const opened = documentary
                            ? this.domain.createDocumentPendency({
                                id,
                                escolaId: context.escolaId,
                                competencia: context.competencia,
                                programaId: context.programaId,
                                documentoKey: context.documentoKey,
                                item: context.item,
                                erros: input.errors || input.erros,
                                observacao: observation,
                                dataAbertura: openingDate
                            }, this.audit('evento-pendencia'))
                            : this.domain.normalizePendencyRecord({
                                id,
                                escolaId: context.escolaId,
                                competencia: context.competencia,
                                item: context.item,
                                motivo: text(input.reason || input.motivo),
                                responsavel: text(input.responsible || input.responsavel),
                                status: 'Aberta',
                                dataAbertura: openingDate,
                                dataResolucao: null,
                                observacao: observation
                            });
                        state.pendencies.push(opened);
                        const log = this.appendSchoolLog(
                            opened.escolaId,
                            'Pendência Aberta',
                            `Pendência ${opened.id} aberta para ${opened.item}.`
                        );
                        persistence.pendencyId = opened.id;
                        persistence.logId = text(log?.id);
                        return { pendency: cloneValue(opened) };
                    } catch (error) {
                        throw asRepositoryError(error, 'open');
                    }
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        }

        async registerAttempt(input = {}) {
            const persistence = { operation: 'register_attempt' };
            return this.dataService.execute({
                name: 'pendency:register-attempt',
                changedEntities: ['pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, input.pendencyId, 'registerAttempt');
                    const { verification } = this.verificationFor(state, pendency, 'registerAttempt');
                    persistence.pendencyId = pendency.id;
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    persistence.verificationContext = {
                        schoolId: pendency.escolaId,
                        competence: pendency.competenciaOrigem || pendency.competencia,
                        programId: pendency.programaId
                    };
                    const bonificationBefore = cloneValue(verification.bonificacao);
                    const resultBefore = cloneValue(verification.resultadoBonif);
                    try {
                        const next = this.domain.registerCorrectiveSubmission(pendency, {
                            id: text(input.attemptId) || this.createId('tentativa'),
                            dataDisponibilizacao: text(input.availabilityDate || input.dataDisponibilizacao),
                            observacao: text(input.observation || input.observacao),
                            link: text(input.link) || null
                        }, this.audit('evento-envio'));
                        verification.analise[pendency.documentoKey] = 'Não analisado';
                        state.pendencies[index] = next;
                        if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                            || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                            fail('BONIFICATION_INVARIANT', 'O novo envio não pode alterar a bonificação.', 'registerAttempt');
                        }
                        const school = state.schools.find(item => item.id === pendency.escolaId);
                        const program = state.programs.find(item => item.id === pendency.programaId);
                        const schoolName = school?.denominação || school?.denominacao || school?.id || pendency.escolaId;
                        const programName = program?.name || pendency.programaId;
                        const log = this.appendSchoolLog(
                            pendency.escolaId,
                            'Novo envio registrado',
                            `Novo envio de ${pendency.item} (${pendency.documentoKey}) no programa ${programName} (${pendency.programaId}) para ${schoolName}, competência ${pendency.competenciaOrigem || pendency.competencia}, disponibilizado em ${text(input.availabilityDate || input.dataDisponibilizacao)}.`
                        );
                        persistence.attemptId = list(next.tentativas).at(-1)?.id || null;
                        persistence.logId = text(log?.id);
                        return { pendency: cloneValue(next), verification: cloneValue(verification) };
                    } catch (error) {
                        throw asRepositoryError(error, 'registerAttempt');
                    }
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        }

        async reanalyze(input = {}) {
            const persistence = {};
            return this.dataService.execute({
                name: 'pendency:reanalyze',
                changedEntities: ['pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, input.pendencyId, 'reanalyze');
                    const { verification } = this.verificationFor(state, pendency, 'reanalyze');
                    persistence.pendencyId = String(pendency.id);
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    const bonificationBefore = cloneValue(verification.bonificacao);
                    const resultBefore = cloneValue(verification.resultadoBonif);
                    const awaitingAttempt = [...(pendency.tentativas || [])]
                        .reverse()
                        .find(attempt => attempt && attempt.status === 'aguardando');
                    persistence.attemptId = text(awaitingAttempt?.id) || null;
                    try {
                        const next = this.domain.recordReanalysis(pendency, {
                            resultado: text(input.result || input.resultado),
                            erros: input.errors || input.erros,
                            observacao: text(input.observation || input.observacao) || 'Regularização confirmada.'
                        }, this.audit('evento-reanalise'));
                        const result = text(input.result || input.resultado);
                        verification.analise[pendency.documentoKey] = result === 'correto'
                            ? this.getCorrectAnalysisLabel(
                                pendency.competenciaOrigem || pendency.competencia,
                                awaitingAttempt?.dataDisponibilizacao
                            )
                            : 'Incorreto';
                        state.pendencies[index] = next;
                        if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                            || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                            fail('BONIFICATION_INVARIANT', 'A reanálise não pode alterar a bonificação.', 'reanalyze');
                        }
                        const school = state.schools.find(item => item.id === pendency.escolaId);
                        const program = state.programs.find(item => item.id === pendency.programaId);
                        const schoolName = school?.denominação || school?.denominacao || school?.id || pendency.escolaId;
                        const programName = program?.name || pendency.programaId;
                        const log = this.appendSchoolLog(
                            pendency.escolaId,
                            'Reanálise registrada',
                            `Reanálise de ${pendency.item} (${pendency.documentoKey}) no programa ${programName} (${pendency.programaId}) para ${schoolName}, competência ${pendency.competenciaOrigem || pendency.competencia}, tentativa ${awaitingAttempt?.id || 'não identificada'}, resultado ${result}.`
                        );
                        persistence.logId = text(log?.id);
                        return { pendency: cloneValue(next), verification: cloneValue(verification) };
                    } catch (error) {
                        throw asRepositoryError(error, 'reanalyze');
                    }
                },
                persist: async ({ snapshot, repository, defaultPersist }) => {
                    if (typeof repository.reanalyzePendencyWithVerification !== 'function') {
                        return defaultPersist();
                    }
                    const pendency = list(snapshot?.entities?.pendencies)
                        .find(record => String(record.id) === String(persistence.pendencyId));
                    const attempt = persistence.attemptId
                        ? list(snapshot?.entities?.pendencyAttempts)
                            .find(record => String(record.id) === String(persistence.attemptId))
                        : null;
                    const verification = pendency
                        ? list(snapshot?.entities?.verifications).find(record => (
                            String(record.school_id) === String(pendency.school_id)
                            && String(record.competence_id) === String(pendency.competence_origin)
                            && String(record.program_id || '') === String(pendency.program_id || '')
                        ))
                        : null;
                    const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                        .find(record => String(record.id) === String(persistence.logId));
                    if (!pendency || !verification || !administrativeLog
                        || (persistence.attemptId && !attempt)) {
                        fail(
                            'PERSISTENCE_CONTEXT_MISSING',
                            'O agregado da reanálise não foi produzido integralmente para persistência.',
                            'reanalyze',
                            cloneValue(persistence)
                        );
                    }
                    return repository.reanalyzePendencyWithVerification({
                        pendency,
                        attempt,
                        verification,
                        expectedPendencyVersion: persistence.expectedPendencyVersion,
                        expectedVerificationVersion: persistence.expectedVerificationVersion,
                        administrativeLog
                    });
                }
            });
        }

        async resolve(input = {}) {
            return this.reanalyze({
                ...input,
                result: 'correto',
                observation: text(input.observation || input.observacao) || 'Pendência regularizada.'
            });
        }

        async cancel(input = {}) {
            return this.updateStatus('cancel', input, (pendency) => this.domain.cancelPendency(
                pendency,
                { justificativa: text(input.justification || input.justificativa) },
                this.audit('evento-cancelamento')
            ), 'Pendência Cancelada');
        }

        async reopen(input = {}) {
            return this.updateStatus('reopen', input, (pendency) => this.domain.reopenPendency(
                pendency,
                {
                    justificativa: text(input.justification || input.justificativa),
                    erros: input.errors || input.erros
                },
                this.audit('evento-reabertura')
            ), 'Pendência Reaberta');
        }

        async updateStatus(operation, input, updater, logAction) {
            const persistence = { operation: 'update_status' };
            return this.dataService.execute({
                name: `pendency:${operation}`,
                changedEntities: ['pendencies', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, input.pendencyId, operation);
                    persistence.pendencyId = pendency.id;
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);
                    try {
                        const next = updater(pendency);
                        state.pendencies[index] = next;
                        const log = this.appendSchoolLog(next.escolaId, logAction, `${logAction}: ${next.id}.`);
                        persistence.logId = text(log?.id);
                        return { pendency: cloneValue(next) };
                    } catch (error) {
                        throw asRepositoryError(error, operation);
                    }
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        }

        async registerContact(input = {}) {
            const persistence = {};
            return this.dataService.execute({
                name: 'pendency:register-contact',
                changedEntities: ['pendencyContacts', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const pendencyId = text(input.pendencyId || input.pendenciaId);
                    const pendency = pendencyId
                        ? this.find(state, pendencyId, 'registerContact').pendency
                        : null;
                    const schoolId = text(input.schoolId || input.escolaId || pendency?.escolaId);
                    const channel = text(input.channel || input.tipo);
                    const description = text(input.description || input.desc);
                    if (!schoolId || !channel || !description) {
                        fail('VALIDATION_FAILED', 'Escola, canal e descrição do contato são obrigatórios.', 'registerContact');
                    }
                    const contact = {
                        id: text(input.id) || this.createId('cont'),
                        escolaId: schoolId,
                        tipo: channel,
                        dataAtendimento: text(input.serviceDate || input.dataAtendimento) || this.now().slice(0, 10),
                        dataRegistro: this.now(),
                        desc: description,
                        pendenciaId: pendencyId || null,
                        competencia: pendency?.competenciaOrigem || pendency?.competencia || null,
                        programaId: pendency?.programaId || null,
                        documentoKey: pendency?.documentoKey || null,
                        data: text(input.serviceDate || input.dataAtendimento) || this.now().slice(0, 10),
                        dataHora: this.now(),
                        descricao: description,
                        observacao: description,
                        responsavel: text(this.getCurrentUser()?.name) || 'Sistema',
                        usuario: text(this.getCurrentUser()?.name) || 'Sistema',
                        perfil: text(this.getCurrentUser()?.role) || 'sistema'
                    };
                    state.contacts.push(contact);
                    const log = this.appendLog(
                        'Contato Registrado',
                        pendencyId
                            ? `Contato via ${channel} associado à pendência ${pendencyId}.`
                            : `Contato via ${channel} registrado para a escola ${schoolId}.`,
                        { escolaId: schoolId, schoolId }
                    );
                    persistence.contactId = contact.id;
                    persistence.logId = text(log?.id);
                    persistence.operationId = text(input.operationId || input.operation_id)
                        || `contact:${contact.id}`;
                    return { contact: cloneValue(contact), pendency: pendency ? cloneValue(pendency) : null };
                },
                persist: ({ snapshot, repository, defaultPersist }) => {
                    if (typeof repository.savePendencyContactWithLog !== 'function') return defaultPersist();
                    const contact = (snapshot.entities.pendencyContacts || [])
                        .find(record => String(record.id) === String(persistence.contactId));
                    const administrativeLog = (snapshot.entities.administrativeLogs || [])
                        .find(record => String(record.id) === String(persistence.logId));
                    if (!contact || !administrativeLog) {
                        fail(
                            'PERSISTENCE_CONTEXT_MISSING',
                            'O contato ou o histórico da operação não foi produzido para persistência.',
                            'registerContact',
                            { contactId: persistence.contactId, logId: persistence.logId }
                        );
                    }
                    return repository.savePendencyContactWithLog({
                        contact,
                        operationId: persistence.operationId,
                        administrativeLog
                    });
                }
            });
        }
    }

    return Object.freeze({ PendencyService });
}));
