(function installRadarInvoiceService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInvoiceService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceServiceApi(contract) {
    'use strict';

    if (!contract) throw new Error('Contrato de dados obrigatório para notas fiscais.');
    const { RepositoryError, cloneValue } = contract;
    const UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar';
    const EXPENSE_TYPES = new Set(['consumo', 'permanente', 'servico', UNIDENTIFIED_EXPENSE_TYPE]);
    const SERVICE_ADVISORY_ANALYSES = Object.freeze([
        'Não analisado',
        'Correto',
        'Correto (Atrasado)',
        'Incorreto'
    ]);
    const SERVICE_ADVISORY_ANALYSIS_SET = new Set(SERVICE_ADVISORY_ANALYSES);

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

    function normalizeServiceAdvisoryAnalysis(value, fallback = 'Não analisado') {
        const normalized = text(value);
        if (normalized === 'Correto após o prazo') return 'Correto (Atrasado)';
        return SERVICE_ADVISORY_ANALYSIS_SET.has(normalized) ? normalized : fallback;
    }

    function getServiceAdvisoryState(invoice = {}, fallback = {}) {
        const sent = typeof invoice.consultaAssessoriaEnviada === 'boolean'
            ? invoice.consultaAssessoriaEnviada
            : Boolean(fallback.sent);
        const analysis = normalizeServiceAdvisoryAnalysis(
            invoice.analiseConsultaAssessoria,
            normalizeServiceAdvisoryAnalysis(fallback.analysis)
        );
        return Object.freeze({ sent, analysis });
    }

    function aggregateServiceAdvisories(invoices = []) {
        const serviceInvoices = (Array.isArray(invoices) ? invoices : [])
            .filter(invoice => invoice?.tipo === 'servico');
        if (serviceInvoices.length === 0) {
            return Object.freeze({
                delivery: 'Não se aplica',
                sent: false,
                analysis: 'Correto',
                invoiceCount: 0
            });
        }

        const states = serviceInvoices.map(invoice => getServiceAdvisoryState(invoice));
        const sent = states.every(state => state.sent);
        let analysis = 'Correto';
        if (states.some(state => state.analysis === 'Incorreto')) {
            analysis = 'Incorreto';
        } else if (states.some(state => state.analysis === 'Não analisado')) {
            analysis = 'Não analisado';
        } else if (states.some(state => state.analysis === 'Correto (Atrasado)')) {
            analysis = 'Correto (Atrasado)';
        }

        return Object.freeze({
            delivery: sent ? 'Sim' : 'Não',
            sent,
            analysis,
            invoiceCount: serviceInvoices.length
        });
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
            const aggregate = aggregateServiceAdvisories(serviceInvoices);
            const verification = state.verifications?.[schoolId]?.[compKey];
            if (!verification) return aggregate;
            verification.bonificacao = verification.bonificacao || {};
            verification.analise = verification.analise || {};
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;
            return aggregate;
        }

        buildAsset(context, invoiceData, assetId) {
            const hasProcess = Boolean(text(context.school.processoInventario));
            const programName = context.program?.name || context.context.programId;
            return {
                id: assetId,
                escolaId: context.schoolId,
                competencia: context.context.competence,
                item: `${programName} - ${invoiceData.description}`,
                descricao: `${programName} - ${invoiceData.description}`,
                tipo: 'permanente',
                valor: invoiceData.amount,
                notaFiscal: invoiceData.invoiceNumber,
                processoInventario: text(context.school.processoInventario),
                status: invoiceData.invoiceNumber && hasProcess ? 'Encaminhada' : 'Não encaminhada'
            };
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
                            : null,
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
            return this.dataService.execute({
                name: 'invoice:save',
                changedEntities: [
                    'registeredInvoices',
                    'assets',
                    'verifications',
                    'administrativeLogs'
                ],
                persist: this.createPersistence('save'),
                mutate: () => {
                    const state = this.getState();
                    const context = this.getContext(state, input, 'invoice:save');
                    this.assertVerificationEditable(context.verification, profile, 'invoice:save');
                    const existing = input.id
                        ? state.registeredInvoices.find(invoice => invoice.id === text(input.id))
                        : null;
                    if (input.id && !existing) {
                        fail('INVOICE_NOT_FOUND', 'Despesa ou Nota Fiscal não localizada.', 'invoice:save', { id: input.id });
                    }
                    if (context.verification) {
                        this.reopenConsolidation(
                            context.schoolId,
                            context.compKey,
                            context.verification,
                            true,
                            profile
                        );
                    }

                    const warnings = [];
                    const previousType = existing?.tipo || '';
                    const previousAssetId = existing?.bemId || null;
                    let asset = previousAssetId
                        ? state.assets.find(item => item.id === previousAssetId) || null
                        : null;

                    if (invoiceData.expenseType === 'permanente') {
                        if (!asset) {
                            asset = this.buildAsset(context, invoiceData, this.createId('bem'));
                            state.assets.push(asset);
                        } else {
                            Object.assign(asset, this.buildAsset(context, invoiceData, asset.id));
                        }
                        if (!text(context.school.processoInventario)) {
                            warnings.push('MISSING_INVENTORY_PROCESS');
                        }
                    } else if (previousAssetId) {
                        state.assets.splice(
                            0,
                            state.assets.length,
                            ...state.assets.filter(item => item.id !== previousAssetId)
                        );
                        asset = null;
                    }

                    if (invoiceData.expenseType === 'servico' && previousType !== 'servico') {
                        warnings.push('SERVICE_ADVISORY_REQUIRED');
                    }

                    const invoice = existing || {
                        id: this.createId('nota'),
                        escolaId: context.schoolId,
                        compKey: context.compKey,
                        dataRegistro: this.now()
                    };
                    invoice.escolaId = context.schoolId;
                    invoice.compKey = context.compKey;
                    invoice.competencia = context.context.competence;
                    invoice.programaId = context.context.programId;
                    invoice.desc = invoiceData.description;
                    invoice.descricao = invoiceData.description;
                    invoice.tipo = invoiceData.expenseType;
                    invoice.numero = invoiceData.invoiceNumber;
                    invoice.valor = invoiceData.amount;
                    invoice.bemId = asset?.id || null;
                    if (invoiceData.expenseType === 'servico') {
                        const existingServiceInvoices = state.registeredInvoices.filter(item => (
                            item.escolaId === context.schoolId
                            && item.compKey === context.compKey
                            && item.tipo === 'servico'
                        ));
                        const legacyFallback = previousType === 'servico'
                            && existingServiceInvoices.length === 1
                            ? {
                                sent: context.verification?.bonificacao?.consEnviada === true
                                    || context.verification?.bonificacao?.consAssessoria === 'Sim',
                                analysis: context.verification?.analise?.consAssessoria
                            }
                            : {};
                        const advisory = previousType === 'servico'
                            ? getServiceAdvisoryState(invoice, legacyFallback)
                            : { sent: false, analysis: 'Não analisado' };
                        invoice.consultaAssessoriaEnviada = advisory.sent;
                        invoice.analiseConsultaAssessoria = advisory.analysis;
                    } else {
                        delete invoice.consultaAssessoriaEnviada;
                        delete invoice.analiseConsultaAssessoria;
                    }
                    if (!existing) state.registeredInvoices.push(invoice);
                    this.syncServiceRequirement(state, context.schoolId, context.compKey);

                    let auditLog;
                    if (existing && invoiceData.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
                        auditLog = this.appendLog(
                            'Despesa a Identificar Editada',
                            `Despesa a identificar editada para ${context.school.denominação || ''} no valor de R$ ${invoiceData.amount}; documentação fiscal ainda pendente.`
                        );
                    } else if (existing && previousType === UNIDENTIFIED_EXPENSE_TYPE) {
                        auditLog = this.appendLog(
                            'Despesa Identificada',
                            `Despesa anteriormente não identificada foi classificada como ${invoiceData.expenseType} para ${context.school.denominação || ''}, NF ${invoiceData.invoiceNumber}, no valor de R$ ${invoiceData.amount}.`
                        );
                    } else if (existing) {
                        auditLog = this.appendLog(
                            'Nota Editada',
                            `Nota Fiscal ${invoiceData.invoiceNumber} editada para ${context.school.denominação || ''} no valor de R$ ${invoiceData.amount}.`
                        );
                    } else if (invoiceData.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
                        auditLog = this.appendLog(
                            'Despesa a Identificar Cadastrada',
                            `Despesa a identificar registrada para ${context.school.denominação || ''}: ${invoiceData.description}, R$ ${invoiceData.amount}; documentação fiscal pendente.`
                        );
                    } else if (invoiceData.expenseType === 'permanente') {
                        auditLog = this.appendLog(
                            'Bem Cadastrado',
                            `Gasto de capital (permanente) de R$ ${invoiceData.amount} registrado via análise mensal para ${context.school.denominação || ''} com NF ${invoiceData.invoiceNumber}.`
                        );
                    } else if (invoiceData.expenseType === 'servico') {
                        auditLog = this.appendLog(
                            'Gasto Serviço Cadastrado',
                            `Gasto com Prestação de Serviços registrado para ${context.school.denominação || ''}: ${invoiceData.description} com NF ${invoiceData.invoiceNumber} no valor de R$ ${invoiceData.amount}.`
                        );
                    } else {
                        auditLog = this.appendLog(
                            'Gasto Consumo Cadastrado',
                            `Gasto com Material de Consumo registrado para ${context.school.denominação || ''}: ${invoiceData.description} com NF ${invoiceData.invoiceNumber} no valor de R$ ${invoiceData.amount}.`
                        );
                    }

                    return {
                        operation: existing ? 'update' : 'create',
                        invoice: cloneValue(invoice),
                        asset: asset ? cloneValue(asset) : null,
                        verification: context.verification ? cloneValue(context.verification) : null,
                        verificationId: `${context.schoolId}::${context.context.competence}::${context.context.programId}`,
                        auditLog: cloneValue(auditLog),
                        warnings
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
        aggregateServiceAdvisories,
        getServiceAdvisoryState,
        isIdentifiedInvoice,
        isUnidentifiedExpense
    });
}));
