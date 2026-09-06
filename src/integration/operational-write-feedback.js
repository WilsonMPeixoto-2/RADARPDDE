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
    const SAVE_SUCCESS_MESSAGES = Object.freeze({
        'invoice:save': 'Nota fiscal salva com sucesso.',
        'invoice:save-unidentified-with-pendency': 'Despesa e pendência salvas com sucesso.',
        'inventory:update-asset': 'Alterações do bem salvas com sucesso.',
        'inventory:forward': 'Encaminhamento para inventariação salvo com sucesso.',
        'inventory:complete': 'Inventariação salva com sucesso.'
    });
    const SYNC_WARNING_MESSAGE = 'A alteração foi salva, mas a tela não conseguiu atualizar os dados. Atualize a página antes de continuar.';
    const DATA_SERVICE_FEEDBACK_MARKER = '__radarOperationalSaveFeedbackWrapped';

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

    function feedbackForResult(operation, result = {}) {
        const successMessage = SAVE_SUCCESS_MESSAGES[text(operation)];
        if (!successMessage || result?.ok !== true) return null;
        const sync = result.stateSync || {};
        if (sync.remoteCommitConfirmed === true
            && (sync.status !== 'applied'
                || sync.localStateApplied === false
                || sync.refreshRequired === true
                || result.refreshPending === true
                || Boolean(result.stateApplyErrorCode))) {
            return { kind: 'warning', message: SYNC_WARNING_MESSAGE, persistent: true };
        }
        return { kind: 'success', message: successMessage, persistent: false };
    }

    function ensureSaveNotice(root) {
        return root?.document?.getElementById?.('pendency-notice') || null;
    }

    function showSaveNotice(root, feedback) {
        const notice = ensureSaveNotice(root);
        if (!notice || !feedback?.message) return false;
        notice.textContent = feedback.message;
        notice.dataset.radarSaveFeedback = feedback.kind;
        if (feedback.kind === 'warning') notice.dataset.variant = 'duplicate';
        else delete notice.dataset.variant;
        notice.hidden = false;
        if (notice.__radarSaveNoticeTimer) root.clearTimeout?.(notice.__radarSaveNoticeTimer);
        notice.__radarSaveNoticeTimer = null;
        if (!feedback.persistent && typeof root.setTimeout === 'function') {
            notice.__radarSaveNoticeTimer = root.setTimeout(() => {
                notice.hidden = true;
                delete notice.dataset.radarSaveFeedback;
                notice.__radarSaveNoticeTimer = null;
            }, 4500);
        }
        return true;
    }

    function installDataServiceFeedback(root, notify) {
        const prototype = root?.RadarDataService?.DataService?.prototype;
        if (!prototype || typeof prototype.execute !== 'function') return false;
        if (prototype[DATA_SERVICE_FEEDBACK_MARKER] === true) return true;
        const originalExecute = prototype.execute;
        const notifier = typeof notify === 'function' ? notify : feedback => showSaveNotice(root, feedback);
        prototype.execute = async function executeWithOperationalSaveFeedback(command = {}) {
            const result = await originalExecute.call(this, command);
            const feedback = feedbackForResult(command?.name, result);
            if (feedback) notifier(feedback);
            return result;
        };
        Object.defineProperty(prototype, DATA_SERVICE_FEEDBACK_MARKER, { value: true });
        return true;
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
        installDataServiceFeedback(root);
        root.addEventListener?.('radar:application-services-ready', () => installDataServiceFeedback(root));
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
        SAVE_SUCCESS_MESSAGES,
        SYNC_WARNING_MESSAGE,
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
        feedbackForResult,
        ensureSaveNotice,
        showSaveNotice,
        installDataServiceFeedback,
        install
    });
}));
