(function installRadarInvoiceService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('../domain/service-advisory.js')
        : root.RadarServiceAdvisory;
    const invoiceEffects = typeof module !== 'undefined' && module.exports
        ? require('../domain/invoice-effects.js')
        : root.RadarInvoiceEffects;
    const invoiceDocumentAnalysis = typeof module !== 'undefined' && module.exports
        ? require('../domain/invoice-document-analysis.js')
        : root.RadarInvoiceDocumentAnalysis;
    const pendencyDomain = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const api = factory(contract, serviceAdvisory, invoiceEffects, invoiceDocumentAnalysis, pendencyDomain);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInvoiceService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceServiceApi(
    contract,
    serviceAdvisory,
    invoiceEffects,
    invoiceDocumentAnalysis,
    pendencyDomain
) {
    'use strict';

    if (!contract || !serviceAdvisory || !invoiceEffects || !invoiceDocumentAnalysis || !pendencyDomain) {
        throw new Error('Contrato de dados, regras canônicas de Assessoria/análise documental/Pendências e planner de efeitos são obrigatórios para notas fiscais.');
    }
    const { RepositoryError, cloneValue } = contract;
    const {
        SERVICE_ADVISORY_ANALYSES,
        deriveServiceAdvisory,
        getServiceAdvisoryState
    } = serviceAdvisory;
    const { planInvoiceEffects } = invoiceEffects;
    const {
        INVOICE_DOCUMENT_ANALYSES,
        deriveInvoiceDocumentAnalysis,
        getInvoiceDocumentAnalysis,
        hasExplicitInvoiceDocumentAnalysis,
        normalizeInvoiceDocumentAnalysis
    } = invoiceDocumentAnalysis;
    const SERVICE_ADVISORY_ANALYSIS_SET = new Set(SERVICE_ADVISORY_ANALYSES);
    const INVOICE_DOCUMENT_ANALYSIS_SET = new Set(INVOICE_DOCUMENT_ANALYSES);
    const UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar';
    const INTERNET_BILL_EXPENSE_TYPE = 'boleto_internet';
    const INTERNET_BILL_PROGRAM_ID = 'CONECTADA';
    const EXPENSE_TYPES = new Set([
        'consumo',
        'permanente',
        'servico',
        UNIDENTIFIED_EXPENSE_TYPE,
        INTERNET_BILL_EXPENSE_TYPE
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeProfile(value) {
        const profile = text(value).toLocaleLowerCase('pt-BR');
        if (profile === 'assistente cre' || profile === 'assistente de verbas federais') return 'assistente';
        return profile;
    }

    function splitContext(compKey) {
        const value = text(compKey);
        const match = value.match(/^(\d{4}-(?:0[1-9]|1[0-2]))_(.+)$/);
        if (!match) return { competence: '', programId: '' };
        return { competence: match[1], programId: match[2] };
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function isUnidentifiedExpense(invoice = {}) {
        return text(invoice.tipo || invoice.expenseType || invoice.expense_type).toLocaleLowerCase('pt-BR')
            === UNIDENTIFIED_EXPENSE_TYPE;
    }

    function isIdentifiedInvoice(invoice = {}) {
        return !isUnidentifiedExpense(invoice)
            && Boolean(text(invoice.numero || invoice.invoiceNumber || invoice.invoice_number || invoice.notaFiscal));
    }

    function invoiceLabel(invoice = {}) {
        const number = text(invoice.numero || invoice.invoiceNumber || invoice.invoice_number);
        return isUnidentifiedExpense(invoice)
            ? (number ? `Despesa a identificar (referência ${number})` : 'Despesa a identificar')
            : `Nota Fiscal ${number}`;
    }



    class InvoiceService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            this.getCurrentProfile = options.getCurrentProfile || (() => '');
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date().toISOString());
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_INVOICE_SERVICE', 'Dependências do serviço de notas fiscais inválidas.', 'construct');
            }
        }

        assertEditable(profile, operation) {
            const normalized = normalizeProfile(this.getCurrentProfile() || profile);
            if (!['controlador', 'assistente'].includes(normalized)) {
                fail('FORBIDDEN', 'O perfil atual não pode alterar notas fiscais.', operation);
            }
            return normalized;
        }

        getContext(state, input, operation) {
            const schoolId = text(input.schoolId);
            const compKey = text(input.compKey);
            const school = state.schools.find(item => item.id === schoolId);
            if (!school) fail('SCHOOL_NOT_FOUND', 'Unidade escolar não localizada.', operation, { schoolId });
            const context = splitContext(compKey);
            if (!context.competence || !context.programId) {
                fail('VALIDATION_FAILED', 'Competência e programa da despesa são obrigatórios.', operation, { compKey });
            }
            const program = state.programs.find(item => item.id === context.programId);
            const verification = state.verifications?.[schoolId]?.[compKey] || null;
            return { schoolId, compKey, school, context, program, verification };
        }

        assertExpenseTypeApplicable(expenseType, context, operation) {
            if (expenseType !== INTERNET_BILL_EXPENSE_TYPE) return;

            const hasConnectedProgram = Array.isArray(context.school?.programasIds)
                && context.school.programasIds.includes(INTERNET_BILL_PROGRAM_ID);
            if (context.context.programId !== INTERNET_BILL_PROGRAM_ID || !hasConnectedProgram) {
                fail(
                    'DOCUMENT_NOT_APPLICABLE',
                    'Boleto de pagamento de Internet é um tipo de gasto exclusivo de escolas com Educação Conectada ativa.',
                    operation,
                    {
                        schoolId: context.schoolId,
                        programId: context.context.programId,
                        expenseType
                    }
                );
            }
        }

        assertVerificationEditable(verification, profile, operation) {
            if (verification?.resultadoBonif && profile !== 'assistente') {
                fail(
                    'CONSOLIDATED_VERIFICATION',
                    'Esta competência está consolidada. Apenas o(a) Assistente de Verbas Federais pode incluir, editar ou excluir despesas e Notas Fiscais.',
                    operation
                );
            }
            if (verification?.bonificacao?.notaFiscal === 'Não se aplica') {
                fail(
                    'FISCAL_NOTES_NOT_APPLICABLE',
                    'Não é possível adicionar despesas ou notas fiscais para competências marcadas como "Não se aplica".',
                    operation
                );
            }
        }

        validateInvoice(input, operation) {
            const description = text(input.description);
            const expenseType = text(input.expenseType).toLocaleLowerCase('pt-BR');
            const invoiceNumber = text(input.invoiceNumber);
            const amount = Number(input.amount);
            const isUnidentified = expenseType === UNIDENTIFIED_EXPENSE_TYPE;
            if (!description || !EXPENSE_TYPES.has(expenseType)
                || (!isUnidentified && !invoiceNumber)
                || !Number.isFinite(amount) || amount < 0) {
                fail(
                    'VALIDATION_FAILED',
                    'Descrição, tipo e valor válido são obrigatórios. O número da Nota Fiscal é obrigatório quando a natureza da despesa já foi identificada.',
                    operation
                );
            }
            return { description, expenseType, invoiceNumber, amount };
        }

        syncServiceRequirement(state, schoolId, compKey) {
            const serviceInvoices = state.registeredInvoices.filter(invoice => (
                invoice.escolaId === schoolId
                && invoice.compKey === compKey
                && invoice.tipo === 'servico'
            ));
            const aggregate = deriveServiceAdvisory(serviceInvoices);
            const verification = state.verifications?.[schoolId]?.[compKey];
            if (!verification) return aggregate;
            verification.bonificacao = verification.bonificacao || {};
            verification.analise = verification.analise || {};
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;
            return aggregate;
        }

        syncInvoiceDocumentAnalysis(state, schoolId, compKey, legacyFallback = null) {
            const invoices = state.registeredInvoices.filter(invoice => (
                invoice.escolaId === schoolId
                && invoice.compKey === compKey
            ));
            const verification = state.verifications?.[schoolId]?.[compKey];
            const fallback = legacyFallback
                || verification?.analise?.notaFiscal
                || 'Não analisado';
            const aggregate = deriveInvoiceDocumentAnalysis(invoices, fallback);
            if (!verification) return aggregate;
            verification.analise = verification.analise || {};
            verification.analise.notaFiscal = aggregate;
            return aggregate;
        }

        createPersistence(operation) {
            return async ({ repository, snapshot, value, defaultPersist }) => {
                const capabilities = repository.capabilities();
                if (capabilities.atomicInvoiceEffects !== true) {
                    return defaultPersist();
                }
                const entities = snapshot.entities || {};
                const verificationPatch = value.verificationId
                    ? (entities.verifications || []).find(item => item.id === value.verificationId) || null
                    : null;
                const administrativeLog = value.auditLog?.id
                    ? (entities.administrativeLogs || []).find(item => item.id === value.auditLog.id) || null
                    : null;

                if (operation === 'save') {
                    const invoice = (entities.registeredInvoices || [])
                        .find(item => item.id === value.invoice.id);
                    const asset = value.asset?.id
                        ? (entities.assets || []).find(item => item.id === value.asset.id) || null
                        : null;
                    return repository.saveInvoiceWithEffects({
                        invoice,
                        asset,
                        verificationPatch,
                        administrativeLog,
                        expectedInvoiceVersion: value.operation === 'update'
                            ? (value.invoice.rowVersion || value.invoice.row_version || null)
                            : null,
                        expectedAssetVersion: value.asset
                            ? (value.asset.rowVersion || value.asset.row_version || null)
                            : (value.removedAsset?.rowVersion || value.removedAsset?.row_version || null),
                        expectedVerificationVersion: value.verification
                            ? (value.verification.rowVersion || value.verification.row_version || null)
                            : null
                    });
                }

                return repository.deleteInvoiceWithEffects({
                    invoiceId: value.removedInvoice.id,
                    expectedInvoiceVersion: value.removedInvoice.rowVersion
                        || value.removedInvoice.row_version
                        || null,
                    deleteLinkedAsset: Boolean(value.removedAssetId),
                    expectedAssetVersion: value.removedAsset?.rowVersion
                        || value.removedAsset?.row_version
                        || null,
                    verificationPatch,
                    expectedVerificationVersion: value.verification
                        ? (value.verification.rowVersion || value.verification.row_version || null)
                        : null,
                    administrativeLog
                });
            };
        }

        persistUnidentifiedExpenseWithPendency(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            const capabilities = repository.capabilities?.() || {};
            if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') {
                return defaultPersist();
            }
            const entities = snapshot.entities || {};
            const invoice = (entities.registeredInvoices || [])
                .find(record => String(record.id) === String(persistence.invoiceId));
            const pendency = (entities.pendencies || [])
                .find(record => String(record.id) === String(persistence.pendencyId));
            const verification = (entities.verifications || []).find(record => (
                String(record.school_id) === String(persistence.schoolId)
                && String(record.competence_id) === String(persistence.competence)
                && String(record.program_id || '') === String(persistence.programId)
            ));
            const administrativeLog = (entities.administrativeLogs || [])
                .find(record => String(record.id) === String(persistence.logId));
            if (!invoice || !pendency || !verification || !administrativeLog) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'A despesa a identificar e sua Pendência não foram produzidas integralmente para persistência.',
                    'invoice:save-unidentified-with-pendency',
                    cloneValue(persistence)
                );
            }
            return repository.executeRpc('save_unidentified_expense_with_pendency', {
                p_invoice: invoice,
                p_verification_patch: verification,
                p_expected_verification_version: persistence.expectedVerificationVersion,
                p_pendency: pendency,
                p_administrative_log: administrativeLog
            }, 'saveUnidentifiedExpenseWithPendency');
        }

        async saveUnidentifiedExpenseWithPendency(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:save-unidentified-with-pendency');
            if (text(input.id)) {
                fail(
                    'VALIDATION_FAILED',
                    'A operação atômica de despesa a identificar é exclusiva para novos registros.',
                    'invoice:save-unidentified-with-pendency'
                );
            }
            const invoiceData = this.validateInvoice(input, 'invoice:save-unidentified-with-pendency');
            if (invoiceData.expenseType !== UNIDENTIFIED_EXPENSE_TYPE) {
                fail(
                    'VALIDATION_FAILED',
                    'Esta operação exige o tipo “A identificar”.',
                    'invoice:save-unidentified-with-pendency'
                );
            }

            const initialState = this.getState();
            const initialContext = this.getContext(
                initialState,
                input,
                'invoice:save-unidentified-with-pendency'
            );
            this.assertVerificationEditable(
                initialContext.verification,
                profile,
                'invoice:save-unidentified-with-pendency'
            );
            if (!initialContext.verification
                || !text(initialContext.verification.bonificacao?.notaFiscal)
                || initialContext.verification.bonificacao?.notaFiscal === 'Não se aplica') {
                fail(
                    'DELIVERY_REQUIRED',
                    'Preencha a bonificação de Notas Fiscais antes de registrar uma despesa sem documentação.',
                    'invoice:save-unidentified-with-pendency'
                );
            }

            const contextInvoices = initialState.registeredInvoices.filter(invoice => (
                invoice.escolaId === initialContext.schoolId
                && invoice.compKey === initialContext.compKey
            ));
            const invoiceId = this.createId('nota');
            const timestamp = this.now();
            const request = {
                schoolId: initialContext.schoolId,
                compKey: initialContext.compKey,
                competence: initialContext.context.competence,
                programId: initialContext.context.programId,
                description: invoiceData.description,
                expenseType: UNIDENTIFIED_EXPENSE_TYPE,
                invoiceNumber: invoiceData.invoiceNumber,
                amount: invoiceData.amount
            };
            const plan = planInvoiceEffects({
                request,
                contextInvoices,
                verification: initialContext.verification,
                school: initialContext.school,
                program: initialContext.program,
                profile,
                invoiceId,
                assetId: null,
                timestamp
            });
            if (plan.unchanged || plan.operation !== 'create') {
                fail(
                    'INVALID_INVOICE_PLAN',
                    'Não foi possível planejar a nova despesa a identificar.',
                    'invoice:save-unidentified-with-pendency'
                );
            }

            const pendencyId = this.createId('pend');
            const verificationId = `${initialContext.schoolId}::${initialContext.context.competence}::${initialContext.context.programId}`;
            const persistence = {
                invoiceId,
                pendencyId,
                schoolId: initialContext.schoolId,
                competence: initialContext.context.competence,
                programId: initialContext.context.programId,
                expectedVerificationVersion: initialContext.verification.rowVersion
                    || initialContext.verification.row_version
                    || null
            };

            return this.dataService.execute({
                name: 'invoice:save-unidentified-with-pendency',
                changedEntities: ['registeredInvoices', 'pendencies', 'verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                persist: context => this.persistUnidentifiedExpenseWithPendency(context, persistence),
                mutate: () => {
                    const state = this.getState();
                    const context = this.getContext(
                        state,
                        input,
                        'invoice:save-unidentified-with-pendency'
                    );
                    const appliedInvoice = cloneValue(plan.invoice);
                    appliedInvoice.analiseDocumentoFiscal = 'Incorreto';
                    state.registeredInvoices.push(appliedInvoice);

                    if (context.verification && plan.verification) {
                        Object.assign(context.verification, cloneValue(plan.verification));
                    }
                    context.verification.analise = context.verification.analise || {};
                    context.verification.analise.notaFiscal = deriveInvoiceDocumentAnalysis(
                        state.registeredInvoices.filter(invoice => (
                            invoice.escolaId === initialContext.schoolId
                            && invoice.compKey === initialContext.compKey
                        )),
                        context.verification.analise.notaFiscal || 'Não analisado'
                    );

                    const openingDate = this.now().slice(0, 10);
                    const opened = pendencyDomain.createDocumentPendency({
                        id: pendencyId,
                        escolaId: initialContext.schoolId,
                        competencia: initialContext.context.competence,
                        programaId: initialContext.context.programId,
                        documentoKey: 'notaFiscal',
                        registeredInvoiceId: invoiceId,
                        item: 'Despesa a identificar',
                        erros: ['Documento ausente'],
                        observacao: text(input.pendencyObservation || input.observation)
                            || invoiceData.description,
                        dataAbertura: openingDate
                    }, {
                        eventId: this.createId('evento-pendencia'),
                        at: this.now(),
                        usuario: 'Sistema',
                        perfil: profile
                    });
                    opened.documentSnapshot = {
                        registeredInvoiceId: invoiceId,
                        tipo: UNIDENTIFIED_EXPENSE_TYPE,
                        numero: invoiceData.invoiceNumber || null,
                        descricao: invoiceData.description,
                        valor: invoiceData.amount
                    };
                    state.pendencies.push(opened);

                    const auditLog = this.appendLog(
                        'Despesa a identificar e Pendência abertas',
                        `Despesa sem documentação de R$ ${invoiceData.amount} registrada e vinculada à pendência ${pendencyId}.`,
                        { escolaId: initialContext.schoolId, schoolId: initialContext.schoolId }
                    );
                    persistence.logId = text(auditLog?.id);

                    return {
                        operation: 'create',
                        invoice: cloneValue(appliedInvoice),
                        pendency: cloneValue(opened),
                        verification: cloneValue(context.verification),
                        verificationId,
                        auditLog: auditLog ? cloneValue(auditLog) : null,
                        warnings: [],
                        unchanged: false
                    };
                }
            });
        }

        invoicePendencyHistory(state, invoiceId) {
            const target = text(invoiceId);
            if (!target) return [];
            return (state.pendencies || []).filter(pendency => (
                text(pendency.registeredInvoiceId || pendency.registered_invoice_id) === target
            ));
        }

        activeInvoiceDocumentPendency(state, invoiceId) {
            return this.invoicePendencyHistory(state, invoiceId).find(pendency => (
                text(pendency.documentoKey || pendency.document_key) === 'notaFiscal'
                && pendencyDomain.isActivePendency(pendency)
            )) || null;
        }

        assertNoActiveInvoiceDocumentPendency(state, invoiceId, operation) {
            const active = this.activeInvoiceDocumentPendency(state, invoiceId);
            if (!active) return true;
            fail(
                'ACTIVE_INVOICE_PENDENCY',
                'Este documento possui Pendência ativa. Novo envio e reanálise devem ser registrados pela tela de Pendências.',
                operation,
                {
                    invoiceId: text(invoiceId),
                    pendencyId: text(active.id),
                    status: text(active.status)
                }
            );
        }

        assertHistorySafeMutation(state, existing, input = {}, operation = 'invoice:save') {
            if (!existing) return true;
            const history = this.invoicePendencyHistory(state, existing.id);
            if (history.length === 0) return true;

            const currentSchoolId = text(existing.escolaId);
            const currentCompKey = text(existing.compKey);
            const targetSchoolId = text(input.schoolId || currentSchoolId);
            const targetCompKey = text(input.compKey || currentCompKey);
            if (targetSchoolId !== currentSchoolId || targetCompKey !== currentCompKey) {
                fail(
                    'INVOICE_HISTORY_LOCKED',
                    'Este documento possui histórico de Pendência e não pode ser transferido para outra escola, competência ou programa.',
                    operation,
                    { invoiceId: existing.id }
                );
            }

            const hasServiceAdvisoryHistory = history.some(pendency => (
                text(pendency.documentoKey || pendency.document_key) === 'consAssessoria'
            ));
            const currentType = text(existing.tipo).toLocaleLowerCase('pt-BR');
            const targetType = text(input.expenseType || currentType).toLocaleLowerCase('pt-BR');
            if (hasServiceAdvisoryHistory && targetType !== currentType) {
                fail(
                    'INVOICE_HISTORY_LOCKED',
                    'A natureza de uma Nota Fiscal com histórico de Assessoria não pode ser alterada.',
                    operation,
                    { invoiceId: existing.id }
                );
            }
            return true;
        }

        assertDeletionHistorySafe(state, invoiceId) {
            const history = this.invoicePendencyHistory(state, invoiceId);
            if (history.length === 0) return true;
            fail(
                'INVOICE_HISTORY_LOCKED',
                'Este documento possui histórico de Pendência e não pode ser excluído.',
                'invoice:remove',
                { invoiceId: text(invoiceId) }
            );
        }

        async save(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:save');
            const invoiceData = this.validateInvoice(input, 'invoice:save');
            const initialState = this.getState();
            const initialContext = this.getContext(initialState, input, 'invoice:save');
            this.assertExpenseTypeApplicable(
                invoiceData.expenseType,
                initialContext,
                'invoice:save'
            );
            this.assertVerificationEditable(
                initialContext.verification,
                profile,
                'invoice:save'
            );

            const existing = input.id
                ? initialState.registeredInvoices.find(invoice => invoice.id === text(input.id))
                : null;
            if (input.id && !existing) {
                fail(
                    'INVOICE_NOT_FOUND',
                    'Despesa ou Nota Fiscal não localizada.',
                    'invoice:save',
                    { id: input.id }
                );
            }
            if (!existing && invoiceData.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
                fail(
                    'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY',
                    'Nova despesa a identificar deve ser registrada pelo comando atômico que também cria a Pendência.',
                    'invoice:save'
                );
            }
            if (existing
                && invoiceData.expenseType === UNIDENTIFIED_EXPENSE_TYPE
                && existing.tipo !== UNIDENTIFIED_EXPENSE_TYPE) {
                fail(
                    'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY',
                    'Uma despesa identificada não pode ser transformada em “Despesa a identificar” pelo editor comum.',
                    'invoice:save',
                    { id: existing.id }
                );
            }
            if (existing) {
                this.assertNoActiveInvoiceDocumentPendency(
                    initialState,
                    existing.id,
                    'invoice:save'
                );
            }
            this.assertHistorySafeMutation(initialState, existing, input, 'invoice:save');

            const contextInvoices = initialState.registeredInvoices.filter(invoice => (
                invoice.escolaId === initialContext.schoolId
                && invoice.compKey === initialContext.compKey
            ));
            const currentAsset = existing?.bemId
                ? initialState.assets.find(asset => asset.id === existing.bemId) || null
                : null;
            const request = {
                schoolId: initialContext.schoolId,
                compKey: initialContext.compKey,
                competence: initialContext.context.competence,
                programId: initialContext.context.programId,
                description: invoiceData.description,
                expenseType: invoiceData.expenseType,
                invoiceNumber: invoiceData.invoiceNumber,
                amount: invoiceData.amount
            };
            const basePlanInput = {
                existingInvoice: existing,
                request,
                contextInvoices,
                currentAsset,
                verification: initialContext.verification,
                school: initialContext.school,
                program: initialContext.program,
                profile
            };

            const preliminaryPlan = planInvoiceEffects(basePlanInput);
            const verificationId = `${initialContext.schoolId}::${initialContext.context.competence}::${initialContext.context.programId}`;
            if (preliminaryPlan.unchanged) {
                return {
                    ok: true,
                    value: {
                        ...cloneValue(preliminaryPlan),
                        verificationId,
                        auditLog: null,
                        unchanged: true
                    }
                };
            }

            const invoiceId = existing?.id || this.createId('nota');
            const assetId = invoiceData.expenseType === 'permanente'
                ? (
                    currentAsset?.id
                    || existing?.bemId
                    || this.createId('bem')
                )
                : null;
            const timestamp = existing?.dataRegistro || this.now();
            const plan = planInvoiceEffects({
                ...basePlanInput,
                invoiceId,
                assetId,
                timestamp
            });

            return this.dataService.execute({
                name: 'invoice:save',
                remoteRefreshExemptEntities: ['administrativeLogs'],
                changedEntities: [...plan.changedEntities],
                persist: this.createPersistence('save'),
                mutate: () => {
                    const state = this.getState();
                    const context = this.getContext(state, input, 'invoice:save');
                    const invoice = plan.operation === 'update'
                        ? state.registeredInvoices.find(item => item.id === plan.invoice.id)
                        : null;
                    let appliedInvoice;

                    if (plan.operation === 'update') {
                        if (!invoice) {
                            fail(
                                'INVOICE_NOT_FOUND',
                                'Despesa ou Nota Fiscal não localizada durante a aplicação do plano.',
                                'invoice:save',
                                { id: plan.invoice.id }
                            );
                        }
                        Object.assign(invoice, cloneValue(plan.invoice));
                        appliedInvoice = invoice;
                    } else {
                        appliedInvoice = cloneValue(plan.invoice);
                        state.registeredInvoices.push(appliedInvoice);
                    }

                    if (plan.removedAsset?.id) {
                        state.assets.splice(
                            0,
                            state.assets.length,
                            ...state.assets.filter(asset => asset.id !== plan.removedAsset.id)
                        );
                    }

                    let appliedAsset = null;
                    if (plan.asset?.id) {
                        appliedAsset = state.assets.find(asset => asset.id === plan.asset.id) || null;
                        if (appliedAsset) {
                            Object.assign(appliedAsset, cloneValue(plan.asset));
                        } else {
                            appliedAsset = cloneValue(plan.asset);
                            state.assets.push(appliedAsset);
                        }
                    }

                    if (context.verification && plan.verification) {
                        Object.assign(
                            context.verification,
                            cloneValue(plan.verification)
                        );
                    }

                    const auditLog = plan.auditDescriptor
                        ? this.appendLog(
                            plan.auditDescriptor.action,
                            plan.auditDescriptor.details
                        )
                        : null;

                    return {
                        operation: plan.operation,
                        invoice: cloneValue(appliedInvoice),
                        asset: appliedAsset ? cloneValue(appliedAsset) : null,
                        removedAsset: plan.removedAsset
                            ? cloneValue(plan.removedAsset)
                            : null,
                        verification: context.verification
                            ? cloneValue(context.verification)
                            : null,
                        verificationId,
                        auditLog: auditLog ? cloneValue(auditLog) : null,
                        warnings: [...plan.warnings],
                        unchanged: false
                    };
                }
            });
        }

        async updateDocumentAnalysis(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:update-document-analysis');
            const analysis = text(input.analysis);
            if (!INVOICE_DOCUMENT_ANALYSIS_SET.has(analysis)) {
                fail(
                    'VALIDATION_FAILED',
                    'A análise individual do documento fiscal é inválida.',
                    'invoice:update-document-analysis',
                    { analysis }
                );
            }
            if (analysis === 'Incorreto') {
                fail(
                    'PENDENCY_REQUIRED',
                    'A análise “Incorreto” deve ser confirmada junto com a Pendência deste documento.',
                    'invoice:update-document-analysis'
                );
            }

            const initialState = this.getState();
            const invoiceId = text(input.id);
            const initialInvoice = initialState.registeredInvoices.find(item => item.id === invoiceId);
            if (!initialInvoice) {
                fail(
                    'INVOICE_NOT_FOUND',
                    'Despesa ou Nota Fiscal não localizada.',
                    'invoice:update-document-analysis',
                    { id: invoiceId }
                );
            }
            this.assertNoActiveInvoiceDocumentPendency(
                initialState,
                invoiceId,
                'invoice:update-document-analysis'
            );
            if (isUnidentifiedExpense(initialInvoice)) {
                fail(
                    'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY',
                    'Despesa a identificar permanece Incorreto enquanto a documentação não permitir sua identificação.',
                    'invoice:update-document-analysis',
                    { id: invoiceId }
                );
            }

            const schoolId = text(input.schoolId || initialInvoice.escolaId);
            if (schoolId !== initialInvoice.escolaId) {
                fail(
                    'INVOICE_CONTEXT_MISMATCH',
                    'O documento fiscal não pertence à unidade informada.',
                    'invoice:update-document-analysis',
                    { id: invoiceId, schoolId }
                );
            }
            const initialContext = this.getContext(initialState, {
                schoolId,
                compKey: initialInvoice.compKey
            }, 'invoice:update-document-analysis');
            if (!initialContext.verification) {
                fail(
                    'VERIFICATION_NOT_FOUND',
                    'A verificação mensal do documento fiscal não foi localizada.',
                    'invoice:update-document-analysis',
                    { id: invoiceId }
                );
            }
            this.assertVerificationEditable(
                initialContext.verification,
                profile,
                'invoice:update-document-analysis'
            );

            const contextInvoices = initialState.registeredInvoices
                .filter(item => item.escolaId === schoolId && item.compKey === initialInvoice.compKey);
            const individualizationStarted = contextInvoices.some(item => (
                hasExplicitInvoiceDocumentAnalysis(item)
                || isUnidentifiedExpense(item)
            ));
            const previousFallback = !individualizationStarted && contextInvoices.length === 1
                ? (initialContext.verification.analise?.notaFiscal || 'Não analisado')
                : 'Não analisado';
            const previous = getInvoiceDocumentAnalysis(initialInvoice, previousFallback);
            const projected = contextInvoices.map(item => {
                    const copy = cloneValue(item);
                    if (copy.id === invoiceId) copy.analiseDocumentoFiscal = analysis;
                    return copy;
                });
            const targetAggregate = deriveInvoiceDocumentAnalysis(
                projected,
                initialContext.verification.analise?.notaFiscal || 'Não analisado'
            );
            const individualCanonical = text(initialInvoice.analiseDocumentoFiscal) === analysis;
            const aggregateCanonical = text(initialContext.verification.analise?.notaFiscal)
                === targetAggregate;

            if (individualCanonical && aggregateCanonical) {
                return {
                    ok: true,
                    value: {
                        operation: 'update',
                        invoice: cloneValue(initialInvoice),
                        asset: null,
                        verification: cloneValue(initialContext.verification),
                        verificationId: `${schoolId}::${initialContext.context.competence}::${initialContext.context.programId}`,
                        auditLog: null,
                        aggregate: targetAggregate,
                        previous,
                        unchanged: true
                    }
                };
            }

            const shouldReopen = Boolean(
                profile === 'assistente'
                && initialContext.verification.resultadoBonif
            );

            return this.dataService.execute({
                name: 'invoice:update-document-analysis',
                changedEntities: ['registeredInvoices', 'verifications', 'administrativeLogs'],
                persist: this.createPersistence('save'),
                mutate: () => {
                    const state = this.getState();
                    const invoice = state.registeredInvoices.find(item => item.id === invoiceId);
                    if (!invoice) {
                        fail(
                            'INVOICE_NOT_FOUND',
                            'Documento fiscal não localizado durante a aplicação da análise.',
                            'invoice:update-document-analysis',
                            { id: invoiceId }
                        );
                    }
                    const context = this.getContext(state, {
                        schoolId,
                        compKey: invoice.compKey
                    }, 'invoice:update-document-analysis');
                    if (!context.verification) {
                        fail(
                            'VERIFICATION_NOT_FOUND',
                            'A verificação mensal do documento fiscal não foi localizada.',
                            'invoice:update-document-analysis',
                            { id: invoiceId }
                        );
                    }

                    invoice.analiseDocumentoFiscal = normalizeInvoiceDocumentAnalysis(analysis);
                    const aggregate = this.syncInvoiceDocumentAnalysis(
                        state,
                        schoolId,
                        invoice.compKey
                    );
                    if (shouldReopen) context.verification.resultadoBonif = '';

                    const label = invoiceLabel(invoice);
                    const reopenSuffix = shouldReopen
                        ? ' A consolidação anterior foi reaberta pela alteração.'
                        : '';
                    const auditLog = this.appendLog(
                        'Análise Técnica de Documento Fiscal Atualizada',
                        `${label} atualizado de “${previous}” para “${analysis}”. Resumo técnico de Notas Fiscais: “${aggregate}”.${reopenSuffix}`
                    );

                    return {
                        operation: 'update',
                        invoice: cloneValue(invoice),
                        asset: null,
                        verification: cloneValue(context.verification),
                        verificationId: `${schoolId}::${context.context.competence}::${context.context.programId}`,
                        auditLog: cloneValue(auditLog),
                        aggregate,
                        previous,
                        unchanged: false
                    };
                }
            });
        }

        async updateServiceAdvisory(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:update-service-advisory');
            const hasSent = Object.prototype.hasOwnProperty.call(input, 'sent');
            const hasAnalysis = Object.prototype.hasOwnProperty.call(input, 'analysis');
            if (!hasSent && !hasAnalysis) {
                fail(
                    'VALIDATION_FAILED',
                    'Informe o envio ou a análise da consulta à Assessoria.',
                    'invoice:update-service-advisory'
                );
            }
            if (hasSent && typeof input.sent !== 'boolean') {
                fail(
                    'VALIDATION_FAILED',
                    'O status de envio da consulta deve ser verdadeiro ou falso.',
                    'invoice:update-service-advisory'
                );
            }
            if (hasAnalysis && !SERVICE_ADVISORY_ANALYSIS_SET.has(text(input.analysis))) {
                fail(
                    'VALIDATION_FAILED',
                    'A análise individual da consulta à Assessoria é inválida.',
                    'invoice:update-service-advisory'
                );
            }

            const initialState = this.getState();
            const invoiceId = text(input.id);
            const initialInvoice = initialState.registeredInvoices.find(item => item.id === invoiceId);
            if (!initialInvoice) {
                fail(
                    'INVOICE_NOT_FOUND',
                    'Nota fiscal não localizada.',
                    'invoice:update-service-advisory',
                    { id: invoiceId }
                );
            }
            if (initialInvoice.tipo !== 'servico') {
                fail(
                    'SERVICE_INVOICE_REQUIRED',
                    'A consulta à Assessoria somente se aplica a notas fiscais de serviço.',
                    'invoice:update-service-advisory',
                    { id: invoiceId }
                );
            }
            const schoolId = text(input.schoolId || initialInvoice.escolaId);
            if (schoolId !== initialInvoice.escolaId) {
                fail(
                    'INVOICE_CONTEXT_MISMATCH',
                    'A nota fiscal não pertence à unidade informada.',
                    'invoice:update-service-advisory',
                    { id: invoiceId, schoolId }
                );
            }
            const initialContext = this.getContext(initialState, {
                schoolId,
                compKey: initialInvoice.compKey
            }, 'invoice:update-service-advisory');
            if (!initialContext.verification) {
                fail(
                    'VERIFICATION_NOT_FOUND',
                    'A verificação mensal da nota fiscal não foi localizada.',
                    'invoice:update-service-advisory',
                    { id: invoiceId }
                );
            }
            this.assertVerificationEditable(
                initialContext.verification,
                profile,
                'invoice:update-service-advisory'
            );

            const serviceInvoices = initialState.registeredInvoices.filter(item => (
                item.escolaId === initialContext.schoolId
                && item.compKey === initialContext.compKey
                && item.tipo === 'servico'
            ));
            const legacyFallback = serviceInvoices.length === 1
                ? {
                    sent: initialContext.verification.bonificacao?.consEnviada === true
                        || initialContext.verification.bonificacao?.consAssessoria === 'Sim',
                    analysis: initialContext.verification.analise?.consAssessoria
                }
                : {};
            const previous = getServiceAdvisoryState(initialInvoice, legacyFallback);
            const targetSent = hasSent ? input.sent : previous.sent;
            const targetAnalysis = hasAnalysis ? text(input.analysis) : previous.analysis;
            const projected = serviceInvoices.map(item => {
                const copy = cloneValue(item);
                if (copy.id === invoiceId) {
                    copy.consultaAssessoriaEnviada = targetSent;
                    copy.analiseConsultaAssessoria = targetAnalysis;
                }
                return copy;
            });
            const targetAggregate = deriveServiceAdvisory(projected);
            const individualCanonical = (
                typeof initialInvoice.consultaAssessoriaEnviada === 'boolean'
                && initialInvoice.consultaAssessoriaEnviada === targetSent
                && text(initialInvoice.analiseConsultaAssessoria) === targetAnalysis
            );
            const aggregateCanonical = (
                text(initialContext.verification.bonificacao?.consAssessoria) === targetAggregate.delivery
                && (initialContext.verification.bonificacao?.consEnviada === true) === targetAggregate.sent
                && text(initialContext.verification.analise?.consAssessoria) === targetAggregate.analysis
            );

            if (individualCanonical && aggregateCanonical) {
                return {
                    ok: true,
                    value: {
                        operation: 'update',
                        invoice: cloneValue(initialInvoice),
                        asset: null,
                        verification: cloneValue(initialContext.verification),
                        verificationId: `${initialContext.schoolId}::${initialContext.context.competence}::${initialContext.context.programId}`,
                        auditLog: null,
                        aggregate: cloneValue(targetAggregate),
                        shouldOpenPendency: targetAnalysis === 'Incorreto',
                        unchanged: true
                    }
                };
            }

            const shouldReopen = Boolean(
                profile === 'assistente'
                && initialContext.verification.resultadoBonif
            );

            return this.dataService.execute({
                name: 'invoice:update-service-advisory',
                changedEntities: [
                    'registeredInvoices',
                    'verifications',
                    'administrativeLogs'
                ],
                persist: this.createPersistence('save'),
                mutate: () => {
                    const state = this.getState();
                    const invoice = state.registeredInvoices.find(item => item.id === invoiceId);
                    if (!invoice) {
                        fail(
                            'INVOICE_NOT_FOUND',
                            'Nota fiscal não localizada durante a aplicação da alteração da Assessoria.',
                            'invoice:update-service-advisory',
                            { id: invoiceId }
                        );
                    }
                    const context = this.getContext(state, {
                        schoolId,
                        compKey: invoice.compKey
                    }, 'invoice:update-service-advisory');
                    if (!context.verification) {
                        fail(
                            'VERIFICATION_NOT_FOUND',
                            'A verificação mensal da nota fiscal não foi localizada.',
                            'invoice:update-service-advisory',
                            { id: invoiceId }
                        );
                    }

                    invoice.consultaAssessoriaEnviada = targetSent;
                    invoice.analiseConsultaAssessoria = targetAnalysis;
                    const aggregate = this.syncServiceRequirement(
                        state,
                        context.schoolId,
                        context.compKey
                    );
                    if (shouldReopen) {
                        context.verification.resultadoBonif = '';
                    }

                    const reopenSuffix = shouldReopen
                        ? ' A consolidação anterior foi reaberta pela alteração.'
                        : '';
                    const auditLog = this.appendLog(
                        'Consulta à Assessoria Atualizada',
                        `Consulta à Assessoria da NF ${invoice.numero} atualizada: envio "${invoice.consultaAssessoriaEnviada ? 'Sim' : 'Não'}"; análise "${invoice.analiseConsultaAssessoria}".${reopenSuffix}`
                    );

                    return {
                        operation: 'update',
                        invoice: cloneValue(invoice),
                        asset: null,
                        verification: cloneValue(context.verification),
                        verificationId: `${context.schoolId}::${context.context.competence}::${context.context.programId}`,
                        auditLog: cloneValue(auditLog),
                        aggregate: cloneValue(aggregate),
                        shouldOpenPendency: invoice.analiseConsultaAssessoria === 'Incorreto',
                        unchanged: false
                    };
                }
            });
        }

        async remove(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:remove');
            const initialState = this.getState();
            const invoiceId = text(input.id);
            const initialIndex = initialState.registeredInvoices.findIndex(invoice => invoice.id === invoiceId);
            if (initialIndex < 0) {
                fail(
                    'INVOICE_NOT_FOUND',
                    'Despesa ou Nota Fiscal não localizada.',
                    'invoice:remove',
                    { id: invoiceId }
                );
            }
            const initialInvoice = initialState.registeredInvoices[initialIndex];
            this.assertDeletionHistorySafe(initialState, invoiceId);
            const initialContext = this.getContext(initialState, {
                schoolId: input.schoolId || initialInvoice.escolaId,
                compKey: initialInvoice.compKey
            }, 'invoice:remove');
            this.assertVerificationEditable(
                initialContext.verification,
                profile,
                'invoice:remove'
            );

            const contextInvoices = initialState.registeredInvoices.filter(invoice => (
                invoice.escolaId === initialContext.schoolId
                && invoice.compKey === initialContext.compKey
            ));
            const currentAsset = initialInvoice.bemId
                ? initialState.assets.find(asset => asset.id === initialInvoice.bemId) || null
                : null;
            const plan = planInvoiceEffects({
                operation: 'remove',
                existingInvoice: initialInvoice,
                contextInvoices,
                currentAsset,
                verification: initialContext.verification,
                school: initialContext.school,
                program: initialContext.program,
                profile,
                request: {
                    schoolId: initialContext.schoolId,
                    compKey: initialContext.compKey,
                    competence: initialContext.context.competence,
                    programId: initialContext.context.programId
                }
            });
            const verificationId = `${initialContext.schoolId}::${initialContext.context.competence}::${initialContext.context.programId}`;

            return this.dataService.execute({
                name: 'invoice:remove',
                remoteRefreshExemptEntities: ['administrativeLogs'],
                changedEntities: [...plan.changedEntities],
                persist: this.createPersistence('remove'),
                mutate: () => {
                    const state = this.getState();
                    const index = state.registeredInvoices.findIndex(invoice => invoice.id === invoiceId);
                    if (index < 0) {
                        fail(
                            'INVOICE_NOT_FOUND',
                            'Despesa ou Nota Fiscal não localizada durante a aplicação do plano.',
                            'invoice:remove',
                            { id: invoiceId }
                        );
                    }
                    const invoice = state.registeredInvoices[index];
                    const context = this.getContext(state, {
                        schoolId: input.schoolId || invoice.escolaId,
                        compKey: invoice.compKey
                    }, 'invoice:remove');

                    if (invoice.bemId) {
                        state.assets.splice(
                            0,
                            state.assets.length,
                            ...state.assets.filter(asset => asset.id !== invoice.bemId)
                        );
                    }
                    state.registeredInvoices.splice(index, 1);

                    if (context.verification && plan.verification) {
                        Object.assign(
                            context.verification,
                            cloneValue(plan.verification)
                        );
                    }

                    const auditLog = this.appendLog(
                        plan.auditDescriptor.action,
                        plan.auditDescriptor.details
                    );
                    return {
                        operation: 'remove',
                        removedInvoice: cloneValue(plan.invoice),
                        removedAssetId: plan.invoice?.bemId || null,
                        removedAsset: plan.removedAsset
                            ? cloneValue(plan.removedAsset)
                            : null,
                        verification: context.verification
                            ? cloneValue(context.verification)
                            : null,
                        verificationId,
                        auditLog: cloneValue(auditLog),
                        resetFiscalAnalysis: Boolean(plan.resetFiscalAnalysis),
                        unchanged: false
                    };
                }
            });
        }
    }

    return Object.freeze({
        EXPENSE_TYPES: Object.freeze([...EXPENSE_TYPES]),
        InvoiceService,
        UNIDENTIFIED_EXPENSE_TYPE,
        isIdentifiedInvoice,
        isUnidentifiedExpense
    });
}));
