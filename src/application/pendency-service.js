(function installRadarPendencyService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const domain = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const accessPolicy = typeof module !== 'undefined' && module.exports
        ? require('../domain/access-policy.js')
        : root.RadarAccessPolicy;
    const invoiceDocumentAnalysis = typeof module !== 'undefined' && module.exports
        ? require('../domain/invoice-document-analysis.js')
        : root.RadarInvoiceDocumentAnalysis;
    const invoiceEffects = typeof module !== 'undefined' && module.exports
        ? require('../domain/invoice-effects.js')
        : root.RadarInvoiceEffects;
    const api = factory(
        contract,
        domain,
        accessPolicy,
        invoiceDocumentAnalysis,
        invoiceEffects
    );

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarPendencyService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createPendencyServiceApi(
    contract,
    defaultDomain,
    accessPolicy,
    invoiceDocumentAnalysis,
    invoiceEffects
) {
    'use strict';

    if (!contract || !defaultDomain || !accessPolicy || !invoiceDocumentAnalysis || !invoiceEffects) {
        throw new Error('Contrato de dados, domínios de pendências/análise fiscal, planner de efeitos e política de acesso são obrigatórios.');
    }
    const { RepositoryError, cloneValue } = contract;
    const {
        deriveInvoiceDocumentAnalysis,
        isUnidentifiedExpense,
        normalizeInvoiceDocumentAnalysis
    } = invoiceDocumentAnalysis;
    const { planInvoiceEffects } = invoiceEffects;
    const IDENTIFIED_EXPENSE_TYPES = new Set([
        'consumo',
        'permanente',
        'servico',
        'boleto_internet'
    ]);

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
            this.getCurrentProfile = options.getCurrentProfile || (() => 'controlador');
            this.getAuthenticatedRole = options.getAuthenticatedRole || (() => {
                try {
                    return globalThis?.RadarAuthContext?.authorization?.role || '';
                } catch (_error) {
                    return '';
                }
            });
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date().toISOString());
            this.getCorrectAnalysisLabel = options.getCorrectAnalysisLabel || (() => 'Correto');
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_PENDENCY_SERVICE', 'Dependências do serviço de pendências inválidas.', 'construct');
            }
        }

        assertCapability(capability, operation) {
            const profile = this.getCurrentProfile();
            if (!accessPolicy.hasCapability(profile, capability)) {
                fail(
                    'FORBIDDEN',
                    'O perfil atual possui acesso somente para consulta nesta operação.',
                    operation,
                    { profile: accessPolicy.normalizeProfile(profile), capability }
                );
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

        auditContext() {
            const authenticatedRole = accessPolicy.normalizeProfile(this.getAuthenticatedRole());
            const visualProfile = accessPolicy.normalizeProfile(this.getCurrentProfile());
            return {
                authenticatedRole: authenticatedRole || null,
                simulatedProfile: authenticatedRole === 'technical_admin' ? visualProfile || null : null
            };
        }

        decorateAdministrativeLog(record) {
            if (!record || typeof record !== 'object') return record;
            const decorated = cloneValue(record);
            const currentDetails = decorated.details && typeof decorated.details === 'object'
                && !Array.isArray(decorated.details)
                ? cloneValue(decorated.details)
                : {};
            const context = this.auditContext();
            if (context.authenticatedRole) currentDetails.authenticatedRole = context.authenticatedRole;
            if (context.simulatedProfile) currentDetails.simulatedProfile = context.simulatedProfile;
            else delete currentDetails.simulatedProfile;
            decorated.details = currentDetails;
            return decorated;
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
            if (log && typeof log === 'object') {
                if (!text(log.escolaId) && !text(log.school_id)) log.escolaId = schoolId;
                const context = this.auditContext();
                log.authenticatedRole = context.authenticatedRole;
                log.simulatedProfile = context.simulatedProfile;
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
            const administrativeLogRecord = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            const administrativeLog = this.decorateAdministrativeLog(administrativeLogRecord);
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

        isLinkedInvoiceDocumentPendency(pendency = {}) {
            return text(pendency.documentoKey || pendency.document_key) === 'notaFiscal'
                && Boolean(text(
                    pendency.registeredInvoiceId
                    || pendency.registered_invoice_id
                ));
        }

        findLinkedInvoice(state, invoiceId, operation) {
            const id = text(invoiceId);
            const invoice = state.registeredInvoices.find(item => String(item.id) === id);
            if (!invoice) {
                fail(
                    'INVOICE_NOT_FOUND',
                    'Despesa ou Nota Fiscal vinculada à pendência não localizada.',
                    operation,
                    { registeredInvoiceId: id }
                );
            }
            return invoice;
        }

        assertLinkedInvoiceContext(invoice, context, operation) {
            const expectedCompKey = `${context.competencia}_${context.programaId}`;
            if (text(invoice.escolaId) !== context.escolaId
                || text(invoice.compKey) !== expectedCompKey) {
                fail(
                    'INVOICE_CONTEXT_MISMATCH',
                    'A despesa vinculada e a pendência pertencem a contextos diferentes.',
                    operation,
                    {
                        registeredInvoiceId: invoice.id,
                        expectedSchoolId: context.escolaId,
                        expectedCompKey
                    }
                );
            }
        }

        syncInvoiceDocumentAggregate(state, invoice, verification, legacyFallback = null) {
            const invoices = state.registeredInvoices.filter(item => (
                item.escolaId === invoice.escolaId
                && item.compKey === invoice.compKey
            ));
            verification.analise = verification.analise || {};
            const aggregate = deriveInvoiceDocumentAnalysis(
                invoices,
                legacyFallback || verification.analise.notaFiscal || 'Não analisado'
            );
            verification.analise.notaFiscal = aggregate;
            return aggregate;
        }

        documentSnapshot(invoice = {}) {
            return {
                registeredInvoiceId: text(invoice.id),
                tipo: text(invoice.tipo),
                numero: text(invoice.numero) || null,
                descricao: text(invoice.desc || invoice.descricao),
                valor: Number(invoice.valor || 0)
            };
        }

        persistInvoiceDocumentCommand(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            const capabilities = repository.capabilities?.() || {};
            if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') {
                return defaultPersist();
            }
            const entities = snapshot.entities || {};
            const invoice = list(entities.registeredInvoices)
                .find(record => String(record.id) === String(persistence.invoiceId));
            const pendency = list(entities.pendencies)
                .find(record => String(record.id) === String(persistence.pendencyId));
            const attempt = persistence.attemptId
                ? list(entities.pendencyAttempts)
                    .find(record => String(record.id) === String(persistence.attemptId))
                : null;
            const verification = list(entities.verifications).find(record => (
                String(record.school_id) === String(persistence.schoolId)
                && String(record.competence_id) === String(persistence.competence)
                && String(record.program_id || '') === String(persistence.programId || '')
            ));
            const administrativeLogRecord = list(entities.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            const administrativeLog = this.decorateAdministrativeLog(administrativeLogRecord);

            if (!invoice || !pendency || !verification || !administrativeLog
                || (persistence.attemptId && !attempt)) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'O agregado individual da Nota Fiscal não foi produzido integralmente para persistência.',
                    'persistInvoiceDocumentCommand',
                    cloneValue(persistence)
                );
            }

            if (persistence.operation === 'open') {
                return repository.executeRpc('save_invoice_document_with_pendency', {
                    p_invoice: invoice,
                    p_expected_invoice_version: persistence.expectedInvoiceVersion,
                    p_verification_patch: verification,
                    p_expected_verification_version: persistence.expectedVerificationVersion,
                    p_pendency: pendency,
                    p_administrative_log: administrativeLog
                }, 'saveInvoiceDocumentWithPendency');
            }
            if (persistence.operation === 'register_attempt') {
                const asset = persistence.assetId
                    ? list(entities.assets)
                        .find(record => String(record.id) === String(persistence.assetId))
                    : null;
                return repository.executeRpc('register_invoice_document_attempt', {
                    p_invoice: invoice,
                    p_expected_invoice_version: persistence.expectedInvoiceVersion,
                    p_asset: asset,
                    p_expected_asset_version: persistence.expectedAssetVersion,
                    p_pendency: pendency,
                    p_expected_pendency_version: persistence.expectedPendencyVersion,
                    p_attempt: attempt,
                    p_verification_patch: verification,
                    p_expected_verification_version: persistence.expectedVerificationVersion,
                    p_administrative_log: administrativeLog
                }, 'registerInvoiceDocumentAttempt');
            }
            if (persistence.operation === 'reanalyze') {
                return repository.executeRpc('reanalyze_invoice_document_pendency', {
                    p_invoice: invoice,
                    p_expected_invoice_version: persistence.expectedInvoiceVersion,
                    p_pendency: pendency,
                    p_attempt: attempt,
                    p_verification_patch: verification,
                    p_expected_pendency_version: persistence.expectedPendencyVersion,
                    p_expected_verification_version: persistence.expectedVerificationVersion,
                    p_administrative_log: administrativeLog
                }, 'reanalyzeInvoiceDocumentPendency');
            }
            return defaultPersist();
        }

        async openInvoiceDocumentPendency(input = {}) {
            const registeredInvoiceId = text(input.registeredInvoiceId || input.registered_invoice_id);
            const persistence = {
                operation: 'open',
                invoiceId: registeredInvoiceId
            };

            return this.dataService.execute({
                name: 'invoice:open-document-pendency',
                changedEntities: ['registeredInvoices', 'pendencies', 'verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const state = this.getState();
                    const context = {
                        escolaId: text(input.schoolId || input.escolaId),
                        competencia: text(input.competence || input.competencia),
                        programaId: text(input.programId || input.programaId),
                        documentoKey: 'notaFiscal',
                        registeredInvoiceId,
                        item: text(input.item)
                    };
                    if (!context.escolaId || !context.competencia || !context.programaId || !registeredInvoiceId) {
                        fail(
                            'INCOMPLETE_CONTEXT',
                            'Escola, competência, programa e despesa são obrigatórios para a pendência individual.',
                            'openInvoiceDocumentPendency'
                        );
                    }
                    const invoice = this.findLinkedInvoice(
                        state,
                        registeredInvoiceId,
                        'openInvoiceDocumentPendency'
                    );
                    this.assertLinkedInvoiceContext(invoice, context, 'openInvoiceDocumentPendency');

                    const existing = this.domain.findActivePendency(state.pendencies, context);
                    if (existing) {
                        fail(
                            'DUPLICATE_PENDENCY',
                            'Já existe uma pendência ativa para este documento.',
                            'openInvoiceDocumentPendency',
                            { existingPendencyId: existing.id, registeredInvoiceId }
                        );
                    }

                    const compKey = `${context.competencia}_${context.programaId}`;
                    const verification = state.verifications?.[context.escolaId]?.[compKey] || null;
                    if (!verification) {
                        fail('NOT_FOUND', 'Verificação documental não localizada.', 'openInvoiceDocumentPendency');
                    }
                    verification.analise = verification.analise || {};
                    verification.bonificacao = verification.bonificacao || {};
                    if (!text(verification.bonificacao.notaFiscal)) {
                        fail(
                            'DELIVERY_REQUIRED',
                            'Preencha a bonificação de Notas Fiscais antes de registrar a análise técnica.',
                            'openInvoiceDocumentPendency'
                        );
                    }

                    const expectedAnalysis = text(input.technicalAnalysisValue || input.analysis || 'Incorreto');
                    if (expectedAnalysis !== 'Incorreto') {
                        fail(
                            'VALIDATION_FAILED',
                            'A abertura da pendência individual exige análise “Incorreto”.',
                            'openInvoiceDocumentPendency'
                        );
                    }

                    persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    persistence.schoolId = context.escolaId;
                    persistence.competence = context.competencia;
                    persistence.programId = context.programaId;

                    const bonificationBefore = cloneValue(verification.bonificacao);
                    const resultBefore = cloneValue(verification.resultadoBonif);
                    const legacyFallback = verification.analise.notaFiscal || 'Não analisado';
                    invoice.analiseDocumentoFiscal = 'Incorreto';
                    const aggregate = this.syncInvoiceDocumentAggregate(
                        state,
                        invoice,
                        verification,
                        legacyFallback
                    );

                    const openingDate = text(input.openingDate || input.dataAbertura)
                        || this.now().slice(0, 10);
                    const opened = this.domain.createDocumentPendency({
                        id: text(input.id) || this.createId('pend'),
                        escolaId: context.escolaId,
                        competencia: context.competencia,
                        programaId: context.programaId,
                        documentoKey: 'notaFiscal',
                        registeredInvoiceId,
                        item: context.item || (text(invoice.numero)
                            ? `Notas Fiscais — ${text(invoice.numero)}`
                            : 'Despesa a identificar'),
                        erros: input.errors || input.erros,
                        observacao: text(input.observation || input.observacao),
                        dataAbertura: openingDate
                    }, this.audit('evento-pendencia'));
                    opened.documentSnapshot = this.documentSnapshot(invoice);
                    state.pendencies.push(opened);

                    if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                        || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                        fail(
                            'BONIFICATION_INVARIANT',
                            'A abertura da pendência individual não pode alterar a bonificação.',
                            'openInvoiceDocumentPendency'
                        );
                    }

                    const log = this.appendSchoolLog(
                        context.escolaId,
                        'Análise incorreta e pendência individual aberta',
                        `Documento ${opened.item} marcado como “Incorreto”; pendência ${opened.id} vinculada à despesa ${registeredInvoiceId}. Resumo técnico de Notas Fiscais: “${aggregate}”.`
                    );
                    persistence.pendencyId = opened.id;
                    persistence.logId = text(log?.id);
                    return {
                        invoice: cloneValue(invoice),
                        pendency: cloneValue(opened),
                        verification: cloneValue(verification),
                        aggregate
                    };
                },
                persist: context => this.persistInvoiceDocumentCommand(context, persistence)
            });
        }

        validateInvoiceIdentification(input, invoice, pendency, operation) {
            const identification = input?.identification;
            if (!identification || typeof identification !== 'object' || Array.isArray(identification)) {
                fail(
                    'DOCUMENT_IDENTIFICATION_REQUIRED',
                    'Informe os dados do documento apresentado para identificar a despesa.',
                    operation,
                    { registeredInvoiceId: invoice.id }
                );
            }

            const expenseType = text(
                identification.expenseType
                || identification.tipo
            ).toLocaleLowerCase('pt-BR');
            const description = text(
                identification.description
                || identification.descricao
            );
            const invoiceNumber = text(
                identification.invoiceNumber
                || identification.numero
                || identification.reference
            );
            const amount = Number(
                identification.amount
                ?? identification.valor
            );

            if (!IDENTIFIED_EXPENSE_TYPES.has(expenseType)
                || !description
                || !invoiceNumber
                || !Number.isFinite(amount)
                || amount < 0) {
                fail(
                    'VALIDATION_FAILED',
                    'Tipo, número ou referência, descrição e valor válido são obrigatórios para identificar a despesa.',
                    operation,
                    { registeredInvoiceId: invoice.id }
                );
            }
            if (expenseType === 'boleto_internet'
                && text(pendency.programaId) !== 'CONECTADA') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Boleto de pagamento de Internet só pode identificar despesa de Educação Conectada.',
                    operation,
                    { registeredInvoiceId: invoice.id }
                );
            }

            return {
                expenseType,
                description,
                invoiceNumber,
                amount
            };
        }

        applyInvoiceIdentification(state, invoice, pendency, verification, input, persistence) {
            const operation = 'registerInvoiceDocumentAttempt';
            const identification = this.validateInvoiceIdentification(
                input,
                invoice,
                pendency,
                operation
            );
            const competence = text(pendency.competenciaOrigem || pendency.competencia);
            const programId = text(pendency.programaId);
            const compKey = `${competence}_${programId}`;
            if (text(invoice.compKey) !== compKey) {
                fail(
                    'INVOICE_CONTEXT_MISMATCH',
                    'A despesa a identificar não pertence à competência e ao programa da Pendência.',
                    operation,
                    { registeredInvoiceId: invoice.id, compKey }
                );
            }

            const contextInvoices = list(state.registeredInvoices).filter(item => (
                item.escolaId === invoice.escolaId
                && item.compKey === invoice.compKey
            ));
            const currentAsset = invoice.bemId
                ? list(state.assets).find(asset => asset.id === invoice.bemId) || null
                : null;
            const school = list(state.schools).find(item => item.id === invoice.escolaId) || null;
            const program = list(state.programs).find(item => item.id === programId) || null;
            const plan = planInvoiceEffects({
                existingInvoice: invoice,
                request: {
                    schoolId: invoice.escolaId,
                    compKey: invoice.compKey,
                    competence,
                    programId,
                    description: identification.description,
                    expenseType: identification.expenseType,
                    invoiceNumber: identification.invoiceNumber,
                    amount: identification.amount
                },
                contextInvoices,
                currentAsset,
                verification,
                school,
                program,
                profile: this.getCurrentProfile(),
                invoiceId: invoice.id,
                assetId: identification.expenseType === 'permanente'
                    ? (currentAsset?.id || invoice.bemId || this.createId('bem'))
                    : null,
                timestamp: invoice.dataRegistro || this.now()
            });

            if (plan.unchanged || plan.operation !== 'update') {
                fail(
                    'INVALID_INVOICE_PLAN',
                    'Não foi possível transformar a despesa a identificar no documento apresentado.',
                    operation,
                    { registeredInvoiceId: invoice.id }
                );
            }

            persistence.expectedAssetVersion = rowVersionOf(currentAsset);
            persistence.assetId = plan.asset?.id || null;

            Object.assign(invoice, cloneValue(plan.invoice));
            invoice.analiseDocumentoFiscal = 'Não analisado';

            if (!Array.isArray(state.assets)) state.assets = [];
            if (plan.removedAsset?.id) {
                state.assets.splice(
                    0,
                    state.assets.length,
                    ...state.assets.filter(asset => asset.id !== plan.removedAsset.id)
                );
            }
            if (plan.asset?.id) {
                const existingAsset = state.assets.find(asset => asset.id === plan.asset.id);
                if (existingAsset) Object.assign(existingAsset, cloneValue(plan.asset));
                else state.assets.push(cloneValue(plan.asset));
            }

            const nextVerification = plan.verification
                ? cloneValue(plan.verification)
                : cloneValue(verification);
            nextVerification.analise = nextVerification.analise || {};
            nextVerification.bonificacao = nextVerification.bonificacao || {};
            // A correção documental não muda a bonificação de Notas Fiscais nem
            // o resultado consolidado. Efeitos derivados de Assessoria/Inventário
            // permanecem autorizados pelo planner canônico.
            nextVerification.bonificacao.notaFiscal = verification.bonificacao?.notaFiscal;
            nextVerification.resultadoBonif = verification.resultadoBonif;
            nextVerification.analise.notaFiscal = deriveInvoiceDocumentAnalysis(
                list(state.registeredInvoices).filter(item => (
                    item.escolaId === invoice.escolaId
                    && item.compKey === invoice.compKey
                )),
                verification.analise?.notaFiscal || 'Não analisado'
            );
            Object.assign(verification, nextVerification);

            return {
                identification,
                warnings: [...(plan.warnings || [])]
            };
        }

        async registerInvoiceDocumentAttempt(input = {}, targetPendency) {
            const persistence = {
                operation: 'register_attempt',
                pendencyId: String(targetPendency.id),
                invoiceId: text(targetPendency.registeredInvoiceId || targetPendency.registered_invoice_id)
            };
            return this.dataService.execute({
                name: 'invoice:register-document-attempt',
                changedEntities: ['registeredInvoices', 'pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, targetPendency.id, 'registerInvoiceDocumentAttempt');
                    const invoice = this.findLinkedInvoice(
                        state,
                        persistence.invoiceId,
                        'registerInvoiceDocumentAttempt'
                    );
                    const { verification } = this.verificationFor(
                        state,
                        pendency,
                        'registerInvoiceDocumentAttempt'
                    );
                    persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    persistence.schoolId = pendency.escolaId;
                    persistence.competence = pendency.competenciaOrigem || pendency.competencia;
                    persistence.programId = pendency.programaId;

                    const bonificationBefore = cloneValue(verification.bonificacao);
                    const resultBefore = cloneValue(verification.resultadoBonif);
                    const identifying = isUnidentifiedExpense(invoice);
                    const identificationResult = identifying
                        ? this.applyInvoiceIdentification(
                            state,
                            invoice,
                            pendency,
                            verification,
                            input,
                            persistence
                        )
                        : { warnings: [] };
                    const next = this.domain.registerCorrectiveSubmission(pendency, {
                        id: text(input.attemptId) || this.createId('tentativa'),
                        dataDisponibilizacao: text(input.availabilityDate || input.dataDisponibilizacao),
                        observacao: text(input.observation || input.observacao),
                        link: text(input.link) || null
                    }, this.audit('evento-envio'));

                    invoice.analiseDocumentoFiscal = 'Não analisado';
                    const aggregate = this.syncInvoiceDocumentAggregate(state, invoice, verification);
                    if (identifying) {
                        next.documentSnapshot = this.documentSnapshot(invoice);
                        next.item = text(invoice.numero)
                            ? `Notas Fiscais — ${text(invoice.numero)}`
                            : next.item;
                    }
                    state.pendencies[index] = next;

                    const fiscalBonificationChanged = JSON.stringify(
                        verification.bonificacao?.notaFiscal
                    ) !== JSON.stringify(bonificationBefore?.notaFiscal);
                    const resultChanged = JSON.stringify(
                        verification.resultadoBonif
                    ) !== JSON.stringify(resultBefore);
                    const unrelatedBonificationChanged = !identifying
                        && JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore);
                    if (fiscalBonificationChanged || resultChanged || unrelatedBonificationChanged) {
                        fail(
                            'BONIFICATION_INVARIANT',
                            'O novo envio individual não pode alterar a bonificação de Notas Fiscais nem o resultado consolidado.',
                            'registerInvoiceDocumentAttempt'
                        );
                    }

                    const log = this.appendSchoolLog(
                        pendency.escolaId,
                        identifying
                            ? 'Despesa identificada em novo envio'
                            : 'Novo envio de documento fiscal registrado',
                        identifying
                            ? `Despesa ${invoice.id} identificada como ${invoice.tipo}, documento ${invoice.numero}; o mesmo registro foi preservado e enviado para reanálise. Resumo técnico: “${aggregate}”.`
                            : `Novo envio vinculado à despesa ${invoice.id}; análise individual voltou para “Não analisado”. Resumo técnico: “${aggregate}”.`
                    );
                    persistence.attemptId = list(next.tentativas).at(-1)?.id || null;
                    persistence.logId = text(log?.id);
                    return {
                        invoice: cloneValue(invoice),
                        pendency: cloneValue(next),
                        verification: cloneValue(verification),
                        aggregate,
                        identified: identifying,
                        warnings: identificationResult.warnings
                    };
                },
                persist: context => this.persistInvoiceDocumentCommand(context, persistence)
            });
        }

        async reanalyzeInvoiceDocumentPendency(input = {}, targetPendency) {
            const persistence = {
                operation: 'reanalyze',
                pendencyId: String(targetPendency.id),
                invoiceId: text(targetPendency.registeredInvoiceId || targetPendency.registered_invoice_id)
            };
            return this.dataService.execute({
                name: 'invoice:reanalyze-document-pendency',
                changedEntities: ['registeredInvoices', 'pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, targetPendency.id, 'reanalyzeInvoiceDocumentPendency');
                    const invoice = this.findLinkedInvoice(
                        state,
                        persistence.invoiceId,
                        'reanalyzeInvoiceDocumentPendency'
                    );
                    if (isUnidentifiedExpense(invoice)) {
                        fail(
                            'DOCUMENT_IDENTIFICATION_REQUIRED',
                            'A despesa ainda precisa ser identificada antes da reanálise documental.',
                            'reanalyzeInvoiceDocumentPendency',
                            { registeredInvoiceId: invoice.id }
                        );
                    }
                    const { verification } = this.verificationFor(
                        state,
                        pendency,
                        'reanalyzeInvoiceDocumentPendency'
                    );
                    const awaitingAttempt = [...list(pendency.tentativas)]
                        .reverse()
                        .find(attempt => attempt && attempt.status === 'aguardando');
                    persistence.attemptId = text(awaitingAttempt?.id) || null;
                    persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    persistence.schoolId = pendency.escolaId;
                    persistence.competence = pendency.competenciaOrigem || pendency.competencia;
                    persistence.programId = pendency.programaId;

                    const bonificationBefore = cloneValue(verification.bonificacao);
                    const resultBefore = cloneValue(verification.resultadoBonif);
                    const next = this.domain.recordReanalysis(pendency, {
                        resultado: text(input.result || input.resultado),
                        erros: input.errors || input.erros,
                        observacao: text(input.observation || input.observacao) || 'Regularização confirmada.'
                    }, this.audit('evento-reanalise'));

                    const result = text(input.result || input.resultado);
                    invoice.analiseDocumentoFiscal = normalizeInvoiceDocumentAnalysis(
                        result === 'correto'
                            ? this.getCorrectAnalysisLabel(
                                pendency.competenciaOrigem || pendency.competencia,
                                awaitingAttempt?.dataDisponibilizacao
                            )
                            : 'Incorreto'
                    );
                    const aggregate = this.syncInvoiceDocumentAggregate(state, invoice, verification);
                    state.pendencies[index] = next;

                    if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                        || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                        fail(
                            'BONIFICATION_INVARIANT',
                            'A reanálise individual não pode alterar a bonificação.',
                            'reanalyzeInvoiceDocumentPendency'
                        );
                    }

                    const log = this.appendSchoolLog(
                        pendency.escolaId,
                        'Reanálise de documento fiscal registrada',
                        `Despesa ${invoice.id} reanalisada como “${invoice.analiseDocumentoFiscal}”. Resumo técnico de Notas Fiscais: “${aggregate}”.`
                    );
                    persistence.logId = text(log?.id);
                    return {
                        invoice: cloneValue(invoice),
                        pendency: cloneValue(next),
                        verification: cloneValue(verification),
                        aggregate
                    };
                },
                persist: context => this.persistInvoiceDocumentCommand(context, persistence)
            });
        }

        async open(input = {}) {
            this.assertCapability(accessPolicy.CAPABILITIES.OPEN_PENDENCY, 'open');
            const requestedDocumentKey = text(input.documentKey || input.documentoKey);
            const registeredInvoiceId = text(input.registeredInvoiceId || input.registered_invoice_id);
            if (requestedDocumentKey === 'notaFiscal' && registeredInvoiceId) {
                return this.openInvoiceDocumentPendency(input);
            }
            if (requestedDocumentKey === 'consAssessoria') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Pendência de Consulta à Assessoria deve ser aberta a partir da Nota Fiscal de serviço correspondente.',
                    'open',
                    { documentKey: requestedDocumentKey }
                );
            }
            if (requestedDocumentKey === 'boletoInternet') {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Boleto de pagamento de Internet usa a Pendência de Notas Fiscais e não possui Pendência documental independente.',
                    'open',
                    { documentKey: requestedDocumentKey }
                );
            }
            const technicalAnalysisValue = text(input.technicalAnalysisValue);
            const changesVerification = Boolean(technicalAnalysisValue);
            const persistence = { operation: 'open', expectedPendencyVersion: null };
            return this.dataService.execute({
                name: changesVerification ? 'pendency:open-with-analysis' : 'pendency:open',
                changedEntities: changesVerification
                    ? ['pendencies', 'verifications', 'administrativeLogs']
                    : ['pendencies', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const context = {
                        escolaId: text(input.schoolId || input.escolaId),
                        competencia: text(input.competence || input.competencia),
                        competenciaOrigem: text(input.competence || input.competencia),
                        programaId: text(input.programId || input.programaId),
                        documentoKey: text(input.documentKey || input.documentoKey),
                        registeredInvoiceId: text(input.registeredInvoiceId || input.registered_invoice_id) || null,
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

                    let verification = null;
                    let bonificationBefore = null;
                    let resultBefore = null;
                    if (changesVerification) {
                        if (technicalAnalysisValue !== 'Incorreto' || !documentary) {
                            fail(
                                'VALIDATION_FAILED',
                                'A abertura atômica só aceita análise “Incorreto” em pendência documental.',
                                'open'
                            );
                        }
                        const compKey = `${context.competencia}_${context.programaId}`;
                        verification = state.verifications?.[context.escolaId]?.[compKey] || null;
                        if (!verification) {
                            fail('NOT_FOUND', 'Verificação documental não localizada.', 'open');
                        }
                        verification.analise = verification.analise || {};
                        verification.bonificacao = verification.bonificacao || {};
                        if (!text(verification.bonificacao[context.documentoKey])) {
                            fail(
                                'DELIVERY_REQUIRED',
                                'Você não pode registrar análise incorreta sem antes preencher o status de entrega no Drive.',
                                'open'
                            );
                        }
                        persistence.expectedVerificationVersion = rowVersionOf(verification);
                        persistence.verificationContext = {
                            schoolId: context.escolaId,
                            competence: context.competencia,
                            programId: context.programaId
                        };
                        bonificationBefore = cloneValue(verification.bonificacao);
                        resultBefore = cloneValue(verification.resultadoBonif);
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
                                registeredInvoiceId: context.registeredInvoiceId || null,
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

                        if (verification) {
                            verification.analise[context.documentoKey] = technicalAnalysisValue;
                            if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                                || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                                fail(
                                    'BONIFICATION_INVARIANT',
                                    'A abertura da pendência não pode alterar a bonificação consolidada.',
                                    'open'
                                );
                            }
                        }

                        const log = this.appendSchoolLog(
                            opened.escolaId,
                            verification ? 'Análise incorreta e pendência aberta' : 'Pendência Aberta',
                            verification
                                ? `Análise técnica de ${context.item || context.documentoKey} marcada como “Incorreto” e pendência ${opened.id} aberta atomicamente para ${opened.item}.`
                                : `Pendência ${opened.id} aberta para ${opened.item}.`
                        );
                        persistence.pendencyId = opened.id;
                        persistence.logId = text(log?.id);
                        return {
                            pendency: cloneValue(opened),
                            verification: verification ? cloneValue(verification) : null
                        };
                    } catch (error) {
                        throw asRepositoryError(error, 'open');
                    }
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        }

        async registerAttempt(input = {}) {
            this.assertCapability(
                accessPolicy.CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
                'registerAttempt'
            );
            const currentState = this.getState();
            const target = currentState.pendencies.find(item => String(item.id) === text(input.pendencyId));
            if (target && this.isLinkedInvoiceDocumentPendency(target)) {
                return this.registerInvoiceDocumentAttempt(input, target);
            }
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
            this.assertCapability(accessPolicy.CAPABILITIES.REANALYZE_PENDENCY, 'reanalyze');
            const currentState = this.getState();
            const target = currentState.pendencies.find(item => String(item.id) === text(input.pendencyId));
            if (target && this.isLinkedInvoiceDocumentPendency(target)) {
                return this.reanalyzeInvoiceDocumentPendency(input, target);
            }
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
                    const administrativeLogRecord = list(snapshot?.entities?.administrativeLogs)
                        .find(record => String(record.id) === String(persistence.logId));
                    const administrativeLog = this.decorateAdministrativeLog(administrativeLogRecord);
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

        async updateDetails(input = {}) {
            this.assertCapability(accessPolicy.CAPABILITIES.OPEN_PENDENCY, 'updateDetails');
            const persistence = { operation: 'update_status' };
            return this.dataService.execute({
                name: 'pendency:update-details',
                changedEntities: ['pendencies', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const { index, pendency } = this.find(state, input.pendencyId, 'updateDetails');
                    if (!this.domain.isDocumentaryPendency(pendency)) {
                        fail(
                            'INCOMPLETE_CONTEXT',
                            'Somente Pendências documentais podem ser editadas por esta visualização.',
                            'updateDetails'
                        );
                    }
                    const reason = text(input.reason || input.motivo);
                    const observation = text(input.observation || input.observacao);
                    if (!reason || !observation) {
                        fail(
                            'VALIDATION_FAILED',
                            'Motivo e observação são obrigatórios.',
                            'updateDetails'
                        );
                    }
                    if (!this.domain.DOCUMENT_ERROR_TYPES.includes(reason)) {
                        fail(
                            'VALIDATION_FAILED',
                            'O motivo informado não pertence ao catálogo documental.',
                            'updateDetails',
                            { reason }
                        );
                    }
                    persistence.pendencyId = pendency.id;
                    persistence.expectedPendencyVersion = rowVersionOf(pendency);

                    const currentErrors = Array.isArray(pendency.errosAtuais)
                        ? [...pendency.errosAtuais]
                        : [];
                    const nextErrors = reason === 'Documento ausente'
                        ? ['Documento ausente']
                        : this.domain.validateDocumentErrors([
                            reason,
                            ...currentErrors.filter(error => error !== 'Documento ausente' && error !== reason)
                        ]);
                    const next = this.domain.normalizePendencyRecord({
                        ...cloneValue(pendency),
                        motivo: reason,
                        errosAtuais: nextErrors,
                        observacao: observation
                    });
                    state.pendencies[index] = next;
                    const log = this.appendSchoolLog(
                        next.escolaId,
                        'Pendência Editada',
                        `Motivo e observação da pendência ${next.id} foram atualizados sem alterar seu status.`
                    );
                    persistence.logId = text(log?.id);
                    return { pendency: cloneValue(next) };
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        }

        async cancel(input = {}) {
            this.assertCapability(accessPolicy.CAPABILITIES.CANCEL_PENDENCY, 'cancel');
            return this.updateStatus('cancel', input, (pendency) => this.domain.cancelPendency(
                pendency,
                { justificativa: text(input.justification || input.justificativa) },
                this.audit('evento-cancelamento')
            ), 'Pendência Cancelada');
        }

        async reopen(input = {}) {
            this.assertCapability(accessPolicy.CAPABILITIES.REOPEN_PENDENCY, 'reopen');
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
            const capability = {
                cancel: accessPolicy.CAPABILITIES.CANCEL_PENDENCY,
                reopen: accessPolicy.CAPABILITIES.REOPEN_PENDENCY
            }[operation];
            if (!capability) {
                fail(
                    'VALIDATION_FAILED',
                    'Operação de status de pendência não suportada.',
                    operation
                );
            }
            this.assertCapability(capability, operation);
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
            this.assertCapability(
                accessPolicy.CAPABILITIES.REGISTER_PENDENCY_CONTACT,
                'registerContact'
            );
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
                    const log = this.appendSchoolLog(
                        schoolId,
                        'Contato Registrado',
                        pendencyId
                            ? `Contato via ${channel} associado à pendência ${pendencyId}.`
                            : `Contato via ${channel} registrado para a escola ${schoolId}.`
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
                    const administrativeLogRecord = (snapshot.entities.administrativeLogs || [])
                        .find(record => String(record.id) === String(persistence.logId));
                    const administrativeLog = this.decorateAdministrativeLog(administrativeLogRecord);
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