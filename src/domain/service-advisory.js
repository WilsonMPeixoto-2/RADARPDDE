(function installRadarServiceAdvisory(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarServiceAdvisory = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createServiceAdvisoryApi() {
    'use strict';

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

    function invoiceType(invoice = {}) {
        return text(invoice.tipo || invoice.expenseType || invoice.expense_type)
            .toLocaleLowerCase('pt-BR');
    }

    function normalizeServiceAdvisoryAnalysis(value, fallback = 'Não analisado') {
        const normalized = text(value);
        if (normalized === 'Correto após o prazo') return 'Correto (Atrasado)';
        return SERVICE_ADVISORY_ANALYSIS_SET.has(normalized)
            ? normalized
            : (SERVICE_ADVISORY_ANALYSIS_SET.has(text(fallback)) ? text(fallback) : 'Não analisado');
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

    function deriveServiceAdvisory(invoices = []) {
        const serviceInvoices = (Array.isArray(invoices) ? invoices : [])
            .filter(invoice => invoiceType(invoice) === 'servico');

        if (serviceInvoices.length === 0) {
            return Object.freeze({
                delivery: 'Não se aplica',
                sent: false,
                analysis: 'Correto',
                invoiceCount: 0
            });
        }

        const states = serviceInvoices.map(invoice => getServiceAdvisoryState(invoice));
        const sent = states.some(state => state.sent);

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

    return Object.freeze({
        SERVICE_ADVISORY_ANALYSES,
        deriveServiceAdvisory,
        getServiceAdvisoryState,
        normalizeServiceAdvisoryAnalysis
    });
}));
