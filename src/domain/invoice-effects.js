(function installRadarInvoiceEffects(root, factory) {
    'use strict';

    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('./service-advisory.js')
        : root.RadarServiceAdvisory;
    const api = factory(serviceAdvisory);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInvoiceEffects = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceEffectsApi(
    serviceAdvisory
) {
    'use strict';

    if (!serviceAdvisory) {
        throw new Error('Regra canônica de Assessoria é obrigatória para planejar efeitos de Nota Fiscal.');
    }

    const { deriveServiceAdvisory, getServiceAdvisoryState } = serviceAdvisory;
    const UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar';

    function cloneValue(value) {
        if (value === undefined) return undefined;
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(value);
            } catch (error) {
                if (String(error?.name || '') !== 'DataCloneError') throw error;
            }
        }
        return JSON.parse(JSON.stringify(value));
    }

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'assistente cre' || normalized === 'assistente de verbas federais') {
            return 'assistente';
        }
        return normalized;
    }

    function invoiceType(invoice = {}) {
        return text(invoice.tipo || invoice.expenseType || invoice.expense_type)
            .toLocaleLowerCase('pt-BR');
    }

    function sameNumber(left, right) {
        const a = Number(left);
        const b = Number(right);
        return Number.isFinite(a) && Number.isFinite(b) && Object.is(a, b);
    }

    function invoiceCoreEquals(current = {}, desired = {}) {
        return text(current.escolaId) === text(desired.escolaId)
            && text(current.compKey) === text(desired.compKey)
            && text(current.competencia) === text(desired.competencia)
            && text(current.programaId) === text(desired.programaId)
            && text(current.desc || current.descricao) === text(desired.desc || desired.descricao)
            && invoiceType(current) === invoiceType(desired)
            && text(current.numero) === text(desired.numero)
            && sameNumber(current.valor, desired.valor)
            && (text(current.bemId) || null) === (text(desired.bemId) || null);
    }

    function assetCoreEquals(current = {}, desired = {}) {
        return text(current.id) === text(desired.id)
            && text(current.escolaId) === text(desired.escolaId)
            && text(current.competencia) === text(desired.competencia)
            && text(current.item || current.descricao) === text(desired.item || desired.descricao)
            && text(current.tipo) === text(desired.tipo)
            && sameNumber(current.valor, desired.valor)
            && text(current.notaFiscal) === text(desired.notaFiscal)
            && text(current.processoInventario) === text(desired.processoInventario)
            && text(current.status) === text(desired.status);
    }

    function serviceStateEquals(current = {}, desired = {}, fallback = {}) {
        const currentState = getServiceAdvisoryState(current, fallback);
        const desiredState = getServiceAdvisoryState(desired);
        return currentState.sent === desiredState.sent
            && currentState.analysis === desiredState.analysis;
    }

    function projectContextInvoices(contextInvoices, existingInvoice, desiredInvoice) {
        const projected = (Array.isArray(contextInvoices) ? contextInvoices : [])
            .map(cloneValue);
        if (!existingInvoice) {
            projected.push(cloneValue(desiredInvoice));
            return projected;
        }

        const existingId = text(existingInvoice.id);
        const index = projected.findIndex(invoice => text(invoice.id) === existingId);
        if (index >= 0) projected[index] = cloneValue(desiredInvoice);
        else projected.push(cloneValue(desiredInvoice));
        return projected;
    }

    function buildDesiredAsset(input, request, desiredInvoice) {
        const currentAsset = input.currentAsset ? cloneValue(input.currentAsset) : null;
        if (request.expenseType !== 'permanente') {
            desiredInvoice.bemId = null;
            return {
                asset: null,
                removedAsset: currentAsset,
                assetChanged: Boolean(currentAsset || text(input.existingInvoice?.bemId))
            };
        }

        const process = text(input.school?.processoInventario);
        const programName = text(input.program?.name) || request.programId;
        const assetId = text(
            currentAsset?.id
            || input.existingInvoice?.bemId
            || input.assetId
        );
        const desiredAsset = currentAsset ? cloneValue(currentAsset) : {};
        desiredAsset.id = assetId;
        desiredAsset.escolaId = request.schoolId;
        desiredAsset.competencia = request.competence;
        desiredAsset.item = `${programName} - ${request.description}`;
        desiredAsset.descricao = desiredAsset.item;
        desiredAsset.tipo = 'permanente';
        desiredAsset.valor = request.amount;
        desiredAsset.notaFiscal = request.invoiceNumber;
        desiredAsset.processoInventario = process;
        desiredAsset.status = request.invoiceNumber && process
            ? 'Encaminhada'
            : 'Não encaminhada';
        desiredInvoice.bemId = assetId || null;

        return {
            asset: desiredAsset,
            removedAsset: null,
            assetChanged: !currentAsset || !assetCoreEquals(currentAsset, desiredAsset)
        };
    }

    function advisoryFallback(existingInvoice, contextInvoices, verification) {
        if (!existingInvoice || invoiceType(existingInvoice) !== 'servico') return {};
        const services = (Array.isArray(contextInvoices) ? contextInvoices : [])
            .filter(invoice => invoiceType(invoice) === 'servico');
        if (services.length !== 1) return {};
        return {
            sent: verification?.bonificacao?.consEnviada === true
                || verification?.bonificacao?.consAssessoria === 'Sim',
            analysis: verification?.analise?.consAssessoria
        };
    }

    function auditDescriptorFor(input, operation, previousType, invoiceChanged, assetChanged, verificationChanged, reopened) {
        if (operation === 'update' && !invoiceChanged && (assetChanged || verificationChanged)) {
            const suffix = reopened
                ? ' A consolidação anterior foi reaberta pela correção.'
                : '';
            return {
                action: 'Efeitos de Nota Fiscal Reconciliados',
                details: `Efeitos derivados da Nota Fiscal ${input.request.invoiceNumber || input.existingInvoice?.numero || input.existingInvoice?.id || ''} foram reconciliados para ${input.school?.denominação || input.request.schoolId}.${suffix}`
            };
        }

        const request = input.request;
        const schoolName = input.school?.denominação || request.schoolId;
        let action;
        let details;

        if (operation === 'update' && request.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
            action = 'Despesa a Identificar Editada';
            details = `Despesa a identificar editada para ${schoolName} no valor de R$ ${request.amount}; documentação fiscal ainda pendente.`;
        } else if (operation === 'update' && previousType === UNIDENTIFIED_EXPENSE_TYPE) {
            action = 'Despesa Identificada';
            details = `Despesa anteriormente não identificada foi classificada como ${request.expenseType} para ${schoolName}, NF ${request.invoiceNumber}, no valor de R$ ${request.amount}.`;
        } else if (operation === 'update') {
            action = 'Nota Editada';
            details = `Nota Fiscal ${request.invoiceNumber} editada para ${schoolName} no valor de R$ ${request.amount}.`;
        } else if (request.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
            action = 'Despesa a Identificar Cadastrada';
            details = `Despesa a identificar registrada para ${schoolName}: ${request.description}, R$ ${request.amount}; documentação fiscal pendente.`;
        } else if (request.expenseType === 'permanente') {
            action = 'Bem Cadastrado';
            details = `Gasto de capital (permanente) de R$ ${request.amount} registrado via análise mensal para ${schoolName} com NF ${request.invoiceNumber}.`;
        } else if (request.expenseType === 'servico') {
            action = 'Gasto Serviço Cadastrado';
            details = `Gasto com Prestação de Serviços registrado para ${schoolName}: ${request.description} com NF ${request.invoiceNumber} no valor de R$ ${request.amount}.`;
        } else {
            action = 'Gasto Consumo Cadastrado';
            details = `Gasto com Material de Consumo registrado para ${schoolName}: ${request.description} com NF ${request.invoiceNumber} no valor de R$ ${request.amount}.`;
        }

        if (reopened) {
            details += ' A consolidação anterior foi reaberta pela alteração.';
        }
        return { action, details };
    }

    function isIdentifiedInvoice(invoice = {}) {
        return invoiceType(invoice) !== UNIDENTIFIED_EXPENSE_TYPE
            && Boolean(text(invoice.numero || invoice.invoiceNumber || invoice.invoice_number));
    }

    function removalAuditDescriptor(input, invoice, reopened) {
        const unidentified = invoiceType(invoice) === UNIDENTIFIED_EXPENSE_TYPE;
        const number = text(invoice.numero || invoice.invoiceNumber || invoice.invoice_number);
        const label = unidentified
            ? (number ? `Despesa a identificar (referência ${number})` : 'Despesa a identificar')
            : `Nota Fiscal ${number}`;
        let details = `${label} de R$ ${invoice.valor} foi excluída da escola ${input.school?.denominação || input.request?.schoolId || invoice.escolaId || ''}.`;
        if (reopened) {
            details += ' A consolidação anterior foi reaberta pela alteração.';
        }
        return Object.freeze({
            action: unidentified ? 'Despesa a Identificar Removida' : 'Nota Fiscal Removida',
            details
        });
    }

    function planInvoiceRemoval(input = {}) {
        const existingInvoice = input.existingInvoice
            ? cloneValue(input.existingInvoice)
            : null;
        if (!existingInvoice) {
            return Object.freeze({
                unchanged: true,
                operation: 'remove',
                invoice: null,
                asset: null,
                removedAsset: null,
                verification: input.verification ? cloneValue(input.verification) : null,
                warnings: Object.freeze([]),
                changedEntities: Object.freeze([]),
                auditDescriptor: null,
                resetFiscalAnalysis: false
            });
        }

        const existingId = text(existingInvoice.id);
        const remainingInvoices = (Array.isArray(input.contextInvoices) ? input.contextInvoices : [])
            .filter(invoice => text(invoice?.id) !== existingId)
            .map(cloneValue);
        const aggregate = deriveServiceAdvisory(remainingInvoices);
        const verification = input.verification ? cloneValue(input.verification) : null;
        let resetFiscalAnalysis = false;

        if (verification) {
            verification.bonificacao = verification.bonificacao || {};
            verification.analise = verification.analise || {};
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;

            const remainingIdentified = remainingInvoices.filter(isIdentifiedInvoice);
            if (remainingIdentified.length === 0
                && verification.bonificacao.notaFiscal === 'Sim'
                && ['Correto', 'Correto (Atrasado)', 'Correto após o prazo']
                    .includes(verification.analise.notaFiscal)) {
                verification.analise.notaFiscal = 'Não analisado';
                resetFiscalAnalysis = true;
            }
        }

        const reopened = Boolean(
            verification
            && normalizeProfile(input.profile) === 'assistente'
            && text(verification.resultadoBonif)
        );
        if (reopened) verification.resultadoBonif = '';

        return Object.freeze({
            unchanged: false,
            operation: 'remove',
            invoice: cloneValue(existingInvoice),
            asset: null,
            removedAsset: input.currentAsset ? cloneValue(input.currentAsset) : null,
            verification: verification ? cloneValue(verification) : null,
            warnings: Object.freeze([]),
            changedEntities: Object.freeze([
                'registeredInvoices',
                'assets',
                'verifications',
                'administrativeLogs'
            ]),
            auditDescriptor: removalAuditDescriptor(input, existingInvoice, reopened),
            resetFiscalAnalysis
        });
    }

    function planInvoiceEffects(input = {}) {
        if (text(input.operation).toLocaleLowerCase('pt-BR') === 'remove') {
            return planInvoiceRemoval(input);
        }

        const request = {
            schoolId: text(input.request?.schoolId),
            compKey: text(input.request?.compKey),
            competence: text(input.request?.competence),
            programId: text(input.request?.programId),
            description: text(input.request?.description),
            expenseType: text(input.request?.expenseType).toLocaleLowerCase('pt-BR'),
            invoiceNumber: text(input.request?.invoiceNumber),
            amount: Number(input.request?.amount)
        };
        const existingInvoice = input.existingInvoice ? cloneValue(input.existingInvoice) : null;
        const operation = existingInvoice ? 'update' : 'create';
        const previousType = invoiceType(existingInvoice || {});
        const verificationBefore = input.verification ? cloneValue(input.verification) : null;
        const desiredInvoice = existingInvoice
            ? cloneValue(existingInvoice)
            : {
                id: text(input.invoiceId),
                escolaId: request.schoolId,
                compKey: request.compKey,
                dataRegistro: input.timestamp || null
            };

        desiredInvoice.id = text(existingInvoice?.id || input.invoiceId);
        desiredInvoice.escolaId = request.schoolId;
        desiredInvoice.compKey = request.compKey;
        desiredInvoice.competencia = request.competence;
        desiredInvoice.programaId = request.programId;
        desiredInvoice.desc = request.description;
        desiredInvoice.descricao = request.description;
        desiredInvoice.tipo = request.expenseType;
        desiredInvoice.numero = request.invoiceNumber;
        desiredInvoice.valor = request.amount;
        if (!existingInvoice && input.timestamp) desiredInvoice.dataRegistro = input.timestamp;

        const assetPlan = buildDesiredAsset(input, request, desiredInvoice);
        const legacyFallback = advisoryFallback(
            existingInvoice,
            input.contextInvoices,
            verificationBefore
        );

        if (request.expenseType === 'servico') {
            const advisory = previousType === 'servico'
                ? getServiceAdvisoryState(existingInvoice || {}, legacyFallback)
                : { sent: false, analysis: 'Não analisado' };
            desiredInvoice.consultaAssessoriaEnviada = advisory.sent;
            desiredInvoice.analiseConsultaAssessoria = advisory.analysis;
        } else {
            delete desiredInvoice.consultaAssessoriaEnviada;
            delete desiredInvoice.analiseConsultaAssessoria;
        }

        let invoiceChanged = operation === 'create'
            || !invoiceCoreEquals(existingInvoice, desiredInvoice);
        if (!invoiceChanged && request.expenseType === 'servico') {
            invoiceChanged = !serviceStateEquals(
                existingInvoice,
                desiredInvoice,
                legacyFallback
            );
        }

        const projectedInvoices = projectContextInvoices(
            input.contextInvoices,
            existingInvoice,
            desiredInvoice
        );
        const aggregate = deriveServiceAdvisory(projectedInvoices);
        const verification = verificationBefore ? cloneValue(verificationBefore) : null;
        let verificationChanged = false;

        if (verification) {
            verification.bonificacao = verification.bonificacao || {};
            verification.analise = verification.analise || {};
            const currentDelivery = text(verification.bonificacao.consAssessoria);
            const currentSent = verification.bonificacao.consEnviada === true;
            const currentAnalysis = text(verification.analise.consAssessoria);
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;
            verificationChanged = currentDelivery !== aggregate.delivery
                || currentSent !== aggregate.sent
                || currentAnalysis !== aggregate.analysis;
        }

        const assetChanged = assetPlan.assetChanged;
        const coreChanged = operation === 'create'
            || invoiceChanged
            || assetChanged
            || verificationChanged;
        const reopen = Boolean(
            coreChanged
            && verification
            && normalizeProfile(input.profile) === 'assistente'
            && text(verificationBefore?.resultadoBonif)
        );
        if (reopen) {
            verification.resultadoBonif = '';
            verificationChanged = true;
        }

        const unchanged = !coreChanged;
        if (unchanged) {
            return Object.freeze({
                unchanged: true,
                operation,
                invoice: cloneValue(existingInvoice),
                asset: input.currentAsset ? cloneValue(input.currentAsset) : null,
                removedAsset: null,
                verification: cloneValue(verificationBefore),
                warnings: [],
                changedEntities: [],
                auditDescriptor: null
            });
        }

        const warnings = [];
        if (request.expenseType === 'permanente' && !text(input.school?.processoInventario)) {
            warnings.push('MISSING_INVENTORY_PROCESS');
        }
        if (request.expenseType === 'servico' && previousType !== 'servico') {
            warnings.push('SERVICE_ADVISORY_REQUIRED');
        }

        const changedEntities = [
            'registeredInvoices',
            'assets',
            'verifications',
            'administrativeLogs'
        ];
        return Object.freeze({
            unchanged: false,
            operation,
            invoice: cloneValue(desiredInvoice),
            asset: assetPlan.asset ? cloneValue(assetPlan.asset) : null,
            removedAsset: assetPlan.removedAsset ? cloneValue(assetPlan.removedAsset) : null,
            verification: verification ? cloneValue(verification) : null,
            warnings: Object.freeze(warnings),
            changedEntities: Object.freeze(changedEntities),
            auditDescriptor: Object.freeze(
                auditDescriptorFor(
                    { ...input, request },
                    operation,
                    previousType,
                    invoiceChanged,
                    assetChanged,
                    verificationChanged,
                    reopen
                )
            )
        });
    }

    return Object.freeze({
        planInvoiceEffects
    });
}));
