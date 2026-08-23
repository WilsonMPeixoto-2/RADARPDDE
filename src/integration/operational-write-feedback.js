(function installRadarOperationalWriteFeedback(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarOperationalWriteFeedback = Object.freeze(api);
        if (root.document) {
            const install = () => api.install(root);
            if (!install() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', install, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalWriteFeedbackApi() {
    'use strict';

    const ACTIVE_CLASSES = Object.freeze([
        'active-sim',
        'active-nao',
        'active-naoseaplica'
    ]);
    const INLINE_HANDLER_NAMES = Object.freeze([
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function bonificationActiveClass(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'sim') return 'active-sim';
        if (normalized === 'não' || normalized === 'nao') return 'active-nao';
        if (normalized === 'não se aplica'
            || normalized === 'nao se aplica'
            || normalized === 'n/a') return 'active-naoseaplica';
        return '';
    }

    function analysisStateClass(value) {
        return `analise-${text(value || 'Não analisado')
            .toLocaleLowerCase('pt-BR')
            .replace(/\s+/g, '-')
            .replace(/[()]/g, '')}`;
    }

    function inlineHandlerName(handler) {
        const source = text(handler);
        if (!source) return '';
        const match = source.match(new RegExp(`\\b(${INLINE_HANDLER_NAMES.join('|')})\\s*\\(`));
        return match ? match[1] : '';
    }

    function inlineOperationFromHandler(handler) {
        const name = inlineHandlerName(handler);
        if (name === 'toggleBonif') return 'bonification';
        if (name) return 'write';
        return '';
    }

    function bonificationValueFromHandler(handler) {
        const source = text(handler);
        const match = source.match(/,\s*'([^']+)'\s*\)\s*;?\s*$/);
        return match ? match[1] : '';
    }

    function settlePending(control) {
        if (!control) return false;
        control.classList?.remove('radar-write-pending');
        control.removeAttribute?.('aria-busy');
        if (control.dataset) delete control.dataset.radarWritePending;
        return true;
    }

    function markPending(control, operation, handler) {
        if (!control) return false;
        const group = operation === 'bonification'
            ? control.closest?.('.btn-group-toggle') || control
            : control;

        if (operation === 'bonification') {
            const value = bonificationValueFromHandler(handler) || text(control.textContent);
            const activeClass = bonificationActiveClass(value);
            const buttons = Array.from(group.querySelectorAll?.('button') || []);
            buttons.forEach(button => {
                ACTIVE_CLASSES.forEach(className => button.classList?.remove(className));
            });
            if (activeClass) control.classList?.add(activeClass);
        }

        group.classList?.add('radar-write-pending');
        group.setAttribute?.('aria-busy', 'true');
        group.dataset.radarWritePending = 'true';
        return true;
    }

    function findInlineControl(target, eventType) {
        if (!target?.closest) return null;
        const attribute = eventType === 'change' ? 'onchange' : 'onclick';
        const control = target.closest(`[${attribute}]`);
        if (!control) return null;
        const handler = control.getAttribute(attribute) || '';
        const operation = inlineOperationFromHandler(handler);
        return operation ? { control, handler, operation } : null;
    }

    function beginTrace(root, handler) {
        try {
            const diagnostics = root?.RadarOperationalWriteDiagnostics;
            const label = inlineHandlerName(handler);
            if (!diagnostics || !label) return null;
            const id = diagnostics.begin(root, label);
            if (id != null) diagnostics.enqueue(root, label, id);
            return id;
        } catch (_error) {
            return null;
        }
    }

    function markTrace(root, id, phase) {
        if (id == null) return false;
        try {
            return root?.RadarOperationalWriteDiagnostics?.mark?.(root, id, phase) === true;
        } catch (_error) {
            return false;
        }
    }

    function install(root) {
        const document = root?.document;
        if (!document || document.__radarOperationalWriteFeedbackInstalled === true) return Boolean(document);

        const handle = event => {
            if (event?.defaultPrevented) return;
            const found = findInlineControl(event?.target, event?.type);
            if (!found) return;
            const traceId = beginTrace(root, found.handler);
            markPending(found.control, found.operation, found.handler);
            markTrace(root, traceId, 'feedback');
        };

        document.addEventListener('click', handle, true);
        document.addEventListener('change', handle, true);
        Object.defineProperty(document, '__radarOperationalWriteFeedbackInstalled', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    return Object.freeze({
        ACTIVE_CLASSES,
        INLINE_HANDLER_NAMES,
        bonificationActiveClass,
        analysisStateClass,
        inlineHandlerName,
        inlineOperationFromHandler,
        bonificationValueFromHandler,
        settlePending,
        markPending,
        findInlineControl,
        beginTrace,
        markTrace,
        install
    });
}));
