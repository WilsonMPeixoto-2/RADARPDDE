(function installRadarInvoiceHistoryLock(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarInvoiceHistoryLock = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            if (!attemptInstall() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
            const interval = root.setInterval?.(() => {
                if (attemptInstall()) root.clearInterval?.(interval);
            }, 25);
            root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createInvoiceHistoryLockApi(contract) {
    'use strict';

    if (!contract) throw new Error('Contrato de dados obrigatório para proteger o histórico da Nota Fiscal.');
    const { RepositoryError } = contract;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function invoiceIdOfPendency(pendency = {}) {
        return text(pendency.registeredInvoiceId || pendency.registered_invoice_id);
    }

    function hasServiceAdvisoryHistory(state = {}, invoiceId) {
        const targetId = text(invoiceId);
        if (!targetId) return false;
        return (Array.isArray(state.pendencies) ? state.pendencies : []).some(pendency => (
            text(pendency.documentoKey || pendency.document_key) === 'consAssessoria'
            && invoiceIdOfPendency(pendency) === targetId
        ));
    }

    function fail(message, operation, invoiceId) {
        throw new RepositoryError('INVOICE_HISTORY_LOCKED', message, {
            operation,
            details: { invoiceId: text(invoiceId) }
        });
    }

    function assertStructuralIdentity(state, input = {}) {
        const invoiceId = text(input.id);
        if (!invoiceId || !hasServiceAdvisoryHistory(state, invoiceId)) return true;
        const existing = (state.registeredInvoices || []).find(invoice => text(invoice.id) === invoiceId);
        if (!existing) return true;

        const currentSchoolId = text(existing.escolaId || existing.school_id);
        const currentCompKey = text(
            existing.compKey
            || existing.source_context_key
            || (text(existing.competencia || existing.competence_id) && text(existing.programaId || existing.program_id)
                ? `${text(existing.competencia || existing.competence_id)}_${text(existing.programaId || existing.program_id)}`
                : '')
        );
        const currentType = text(existing.tipo || existing.expenseType || existing.expense_type).toLocaleLowerCase('pt-BR');
        const targetSchoolId = text(input.schoolId || currentSchoolId);
        const targetCompKey = text(input.compKey || currentCompKey);
        const targetType = text(input.expenseType || currentType).toLocaleLowerCase('pt-BR');

        if (targetSchoolId !== currentSchoolId
            || targetCompKey !== currentCompKey
            || targetType !== currentType) {
            fail(
                'Esta Nota Fiscal possui histórico de pendência da Assessoria. Escola, competência, programa e natureza da despesa não podem ser alterados; os demais dados da NF podem ser corrigidos normalmente.',
                'invoice:save',
                invoiceId
            );
        }
        return true;
    }

    function assertDeletionAllowed(state, invoiceId) {
        if (!hasServiceAdvisoryHistory(state, invoiceId)) return true;
        fail(
            'Esta Nota Fiscal possui histórico de pendência da Assessoria e não pode ser excluída. Os dados permitidos da NF podem ser corrigidos normalmente.',
            'invoice:remove',
            invoiceId
        );
    }

    function protectService(service) {
        if (!service || typeof service.save !== 'function' || typeof service.remove !== 'function'
            || typeof service.getState !== 'function') return false;
        if (service.__radarInvoiceHistoryLock === true) return true;

        const originalSave = service.save.bind(service);
        const originalRemove = service.remove.bind(service);

        service.save = async function saveWithHistoryLock(input = {}) {
            assertStructuralIdentity(service.getState() || {}, input);
            return originalSave(input);
        };
        service.remove = async function removeWithHistoryLock(input = {}) {
            assertDeletionAllowed(service.getState() || {}, input.id);
            return originalRemove(input);
        };

        Object.defineProperty(service, '__radarInvoiceHistoryLock', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function install(root) {
        return protectService(root?.RadarApplicationServices?.invoices);
    }

    return Object.freeze({
        invoiceIdOfPendency,
        hasServiceAdvisoryHistory,
        assertStructuralIdentity,
        assertDeletionAllowed,
        protectService,
        install
    });
}));
