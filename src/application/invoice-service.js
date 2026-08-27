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
    const api = factory(contract, serviceAdvisory, invoiceEffects);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInvoiceService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceServiceApi(
    contract,
    serviceAdvisory,
    invoiceEffects
) {
    'use strict';

    if (!contract || !serviceAdvisory || !invoiceEffects) {
        throw new Error('Contrato de dados, regra canônica de Assessoria e planner de efeitos são obrigatórios para notas fiscais.');
    }
    const { RepositoryError, cloneValue } = contract;
    const {
        SERVICE_ADVISORY_ANALYSES,
        deriveServiceAdvisory,
        getServiceAdvisoryState,
        normalizeServiceAdvisoryAnalysis
    } = serviceAdvisory;
    const { planInvoiceEffects } = invoiceEffects;
    const SERVICE_ADVISORY_ANALYSIS_SET = new Set(SERVICE_ADVISORY_ANALYSES);
    const UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar';
    const EXPENSE_TYPES = new Set(['consumo', 'permanente', 'servico', UNIDENTIFIED_EXPENSE_TYPE]);

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
            this.reopenConsolidation = options.reopenConsolidation || (() => {});
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

        async save(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:save');
            const invoiceData = this.validateInvoice(input, 'invoice:save');
            const initialState = this.getState();
            const initialContext = this.getContext(initialState, input, 'invoice:save');
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
                    const invoiceId = text(input.id);
                    const invoice = state.registeredInvoices.find(item => item.id === invoiceId);
                    if (!invoice) {
                        fail(
                            'INVOICE_NOT_FOUND',
                            'Nota fiscal não localizada.',
                            'invoice:update-service-advisory',
                            { id: invoiceId }
                        );
                    }
                    if (invoice.tipo !== 'servico') {
                        fail(
                            'SERVICE_INVOICE_REQUIRED',
                            'A consulta à Assessoria somente se aplica a notas fiscais de serviço.',
                            'invoice:update-service-advisory',
                            { id: invoiceId }
                        );
                    }
                    const schoolId = text(input.schoolId || invoice.escolaId);
                    if (schoolId !== invoice.escolaId) {
                        fail(
                            'INVOICE_CONTEXT_MISMATCH',
                            'A nota fiscal não pertence à unidade informada.',
                            'invoice:update-service-advisory',
                            { id: invoiceId, schoolId }
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
                    this.assertVerificationEditable(
                        context.verification,
                        profile,
                        'invoice:update-service-advisory'
                    );
                    this.reopenConsolidation(
                        context.schoolId,
                        context.compKey,
                        context.verification,
                        true,
                        profile
                    );

                    const serviceInvoices = state.registeredInvoices.filter(item => (
                        item.escolaId === context.schoolId
                        && item.compKey === context.compKey
                        && item.tipo === 'servico'
                    ));
                    const legacyFallback = serviceInvoices.length === 1
                        ? {
                            sent: context.verification.bonificacao?.consEnviada === true
                                || context.verification.bonificacao?.consAssessoria === 'Sim',
                            analysis: context.verification.analise?.consAssessoria
                        }
                        : {};
                    const previous = getServiceAdvisoryState(invoice, legacyFallback);
                    invoice.consultaAssessoriaEnviada = hasSent ? input.sent : previous.sent;
                    invoice.analiseConsultaAssessoria = hasAnalysis
                        ? text(input.analysis)
                        : previous.analysis;
                    const aggregate = this.syncServiceRequirement(
                        state,
                        context.schoolId,
                        context.compKey
                    );
                    const auditLog = this.appendLog(
                        'Consulta à Assessoria Atualizada',
                        `Consulta à Assessoria da NF ${invoice.numero} atualizada: envio "${invoice.consultaAssessoriaEnviada ? 'Sim' : 'Não'}"; análise "${invoice.analiseConsultaAssessoria}".`
                    );

                    return {
                        operation: 'update',
                        invoice: cloneValue(invoice),
                        asset: null,
                        verification: cloneValue(context.verification),
                        verificationId: `${context.schoolId}::${context.context.competence}::${context.context.programId}`,
                        auditLog: cloneValue(auditLog),
                        aggregate: cloneValue(aggregate),
                        shouldOpenPendency: invoice.analiseConsultaAssessoria === 'Incorreto'
                    };
                }
            });
        }

        async remove(input = {}) {
            const profile = this.assertEditable(input.profile, 'invoice:remove');
            return this.dataService.execute({
                name: 'invoice:remove',
                remoteRefreshExemptEntities: ['administrativeLogs'],
                changedEntities: [
                    'registeredInvoices',
                    'assets',
                    'verifications',
                    'administrativeLogs'
                ],
                persist: this.createPersistence('remove'),
                mutate: () => {
                    const state = this.getState();
                    const invoiceId = text(input.id);
                    const index = state.registeredInvoices.findIndex(invoice => invoice.id === invoiceId);
                    if (index < 0) {
                        fail('INVOICE_NOT_FOUND', 'Despesa ou Nota Fiscal não localizada.', 'invoice:remove', { id: invoiceId });
                    }
                    const invoice = state.registeredInvoices[index];
                    const context = this.getContext(state, {
                        schoolId: input.schoolId || invoice.escolaId,
                        compKey: invoice.compKey
                    }, 'invoice:remove');
                    this.assertVerificationEditable(context.verification, profile, 'invoice:remove');
                    if (context.verification) {
                        this.reopenConsolidation(
                            context.schoolId,
                            context.compKey,
                            context.verification,
                            true,
                            profile
                        );
                    }

                    const removedAsset = invoice.bemId
                        ? state.assets.find(asset => asset.id === invoice.bemId) || null
                        : null;
                    if (invoice.bemId) {
                        state.assets.splice(
                            0,
                            state.assets.length,
                            ...state.assets.filter(asset => asset.id !== invoice.bemId)
                        );
                    }
                    state.registeredInvoices.splice(index, 1);
                    this.syncServiceRequirement(state, context.schoolId, context.compKey);

                    let resetFiscalAnalysis = false;
                    const remainingIdentifiedNotes = state.registeredInvoices.filter(item => (
                        item.escolaId === context.schoolId
                        && item.compKey === context.compKey
                        && isIdentifiedInvoice(item)
                    ));
                    const analysis = context.verification?.analise || {};
                    const bonification = context.verification?.bonificacao || {};
                    if (remainingIdentifiedNotes.length === 0
                        && bonification.notaFiscal === 'Sim'
                        && ['Correto', 'Correto (Atrasado)', 'Correto após o prazo'].includes(analysis.notaFiscal)) {
                        analysis.notaFiscal = 'Não analisado';
                        resetFiscalAnalysis = true;
                    }

                    const unidentified = isUnidentifiedExpense(invoice);
                    const auditLog = this.appendLog(
                        unidentified ? 'Despesa a Identificar Removida' : 'Nota Fiscal Removida',
                        `${invoiceLabel(invoice)} de R$ ${invoice.valor} foi excluída da escola ${context.school.denominação || ''}.`
                    );
                    return {
                        operation: 'remove',
                        removedInvoice: cloneValue(invoice),
                        removedAssetId: invoice.bemId || null,
                        removedAsset: removedAsset ? cloneValue(removedAsset) : null,
                        verification: context.verification ? cloneValue(context.verification) : null,
                        verificationId: `${context.schoolId}::${context.context.competence}::${context.context.programId}`,
                        auditLog: cloneValue(auditLog),
                        resetFiscalAnalysis
                    };
                }
            });
        }
    }

    return Object.freeze({
        EXPENSE_TYPES: Object.freeze([...EXPENSE_TYPES]),
        InvoiceService,
        SERVICE_ADVISORY_ANALYSES,
        UNIDENTIFIED_EXPENSE_TYPE,
        aggregateServiceAdvisories: deriveServiceAdvisory,
        deriveServiceAdvisory,
        getServiceAdvisoryState,
        normalizeServiceAdvisoryAnalysis,
        isIdentifiedInvoice,
        isUnidentifiedExpense
    });
}));
