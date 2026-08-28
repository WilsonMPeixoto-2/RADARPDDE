(function installRadarInvoiceDocumentAnalysis(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInvoiceDocumentAnalysis = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceDocumentAnalysisApi() {
    'use strict';

    const INVOICE_DOCUMENT_ANALYSES = Object.freeze([
        'Não analisado',
        'Correto',
        'Correto (Atrasado)',
        'Incorreto'
    ]);

    const INVOICE_DOCUMENT_ANALYSIS_SET = new Set(INVOICE_DOCUMENT_ANALYSES);
    const INVOICE_DOCUMENT_TYPES = new Set([
        'consumo',
        'permanente',
        'servico',
        'boleto_internet',
        'a_identificar'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function invoiceType(invoice = {}) {
        return text(invoice.tipo || invoice.expenseType || invoice.expense_type)
            .toLocaleLowerCase('pt-BR');
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(object || {}, key);
    }

    function normalizeInvoiceDocumentAnalysis(value, fallback = 'Não analisado') {
        const normalized = text(value);
        if (normalized === 'Correto após o prazo') return 'Correto (Atrasado)';
        if (INVOICE_DOCUMENT_ANALYSIS_SET.has(normalized)) return normalized;

        const normalizedFallback = text(fallback);
        if (normalizedFallback === 'Correto após o prazo') return 'Correto (Atrasado)';
        return INVOICE_DOCUMENT_ANALYSIS_SET.has(normalizedFallback)
            ? normalizedFallback
            : 'Não analisado';
    }

    function isInvoiceDocument(invoice = {}) {
        return INVOICE_DOCUMENT_TYPES.has(invoiceType(invoice));
    }

    function isUnidentifiedExpense(invoice = {}) {
        return invoiceType(invoice) === 'a_identificar';
    }

    function hasExplicitInvoiceDocumentAnalysis(invoice = {}) {
        return hasOwn(invoice, 'analiseDocumentoFiscal')
            || hasOwn(invoice, 'documentAnalysis')
            || hasOwn(invoice, 'document_analysis');
    }

    function getInvoiceDocumentAnalysis(invoice = {}, fallback = 'Não analisado') {
        if (isUnidentifiedExpense(invoice)) {
            return 'Incorreto';
        }

        const value = hasOwn(invoice, 'analiseDocumentoFiscal')
            ? invoice.analiseDocumentoFiscal
            : hasOwn(invoice, 'documentAnalysis')
                ? invoice.documentAnalysis
                : invoice.document_analysis;

        return normalizeInvoiceDocumentAnalysis(value, fallback);
    }

    function deriveInvoiceDocumentAnalysis(invoices, legacyFallback = 'Não analisado') {
        const documents = Array.isArray(invoices)
            ? invoices.filter(isInvoiceDocument)
            : [];

        if (documents.length === 0) {
            return normalizeInvoiceDocumentAnalysis(legacyFallback);
        }

        const hasUnidentified = documents.some(isUnidentifiedExpense);
        const hasExplicit = documents.some(hasExplicitInvoiceDocumentAnalysis);

        if (!hasUnidentified && !hasExplicit) {
            return normalizeInvoiceDocumentAnalysis(legacyFallback);
        }

        const states = documents.map(invoice => (
            isUnidentifiedExpense(invoice)
                ? 'Incorreto'
                : getInvoiceDocumentAnalysis(
                    invoice,
                    hasExplicit ? 'Não analisado' : legacyFallback
                )
        ));

        if (states.includes('Incorreto')) return 'Incorreto';
        if (states.includes('Não analisado')) return 'Não analisado';
        if (states.includes('Correto (Atrasado)')) return 'Correto (Atrasado)';
        return 'Correto';
    }

    function withInvoiceDocumentAnalysis(invoice = {}, analysis) {
        if (!isInvoiceDocument(invoice)) {
            throw new TypeError('Tipo de despesa não participa da análise documental de Notas Fiscais.');
        }

        if (isUnidentifiedExpense(invoice) && analysis !== 'Incorreto') {
            throw new TypeError('Despesa a identificar deve permanecer Incorreto até ser documentalmente identificada.');
        }

        return {
            ...invoice,
            analiseDocumentoFiscal: normalizeInvoiceDocumentAnalysis(analysis)
        };
    }

    return Object.freeze({
        INVOICE_DOCUMENT_ANALYSES,
        deriveInvoiceDocumentAnalysis,
        getInvoiceDocumentAnalysis,
        hasExplicitInvoiceDocumentAnalysis,
        isInvoiceDocument,
        isUnidentifiedExpense,
        normalizeInvoiceDocumentAnalysis,
        withInvoiceDocumentAnalysis
    });
}));
