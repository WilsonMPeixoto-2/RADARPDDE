(function installRadarProntuarioScrollPreservation(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarProntuarioScrollPreservation = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createProntuarioScrollPreservationApi() {
    'use strict';

    const EVALUATION_HANDLER_NAMES = Object.freeze([
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ]);
    const OPTIONAL_HANDLER_NAMES = Object.freeze([
        'confirmRetification'
    ]);
    const WRAPPED_MARKER = '__radarScrollPreservingEvaluationHandler';

    function contentArea(root) {
        return root?.document?.querySelector?.('main.content-area') || null;
    }

    function capture(root) {
        const area = contentArea(root);
        if (!area) return null;
        return Object.freeze({
            top: Number(area.scrollTop || 0),
            left: Number(area.scrollLeft || 0)
        });
    }

    function restore(root, snapshot) {
        if (!snapshot) return false;
        const area = contentArea(root);
        if (!area) return false;

        const apply = () => {
            const current = contentArea(root);
            if (!current) return;
            if (typeof current.scrollTo === 'function') {
                current.scrollTo({
                    top: snapshot.top,
                    left: snapshot.left,
                    behavior: 'auto'
                });
            } else {
                current.scrollTop = snapshot.top;
                current.scrollLeft = snapshot.left;
            }
        };

        apply();
        if (typeof root.requestAnimationFrame === 'function') {
            root.requestAnimationFrame(() => {
                apply();
                root.requestAnimationFrame(apply);
            });
        }
        return true;
    }

    async function preserve(root, operation) {
        const snapshot = capture(root);
        try {
            return await operation();
        } finally {
            restore(root, snapshot);
        }
    }

    function assignGlobalLexical(name, wrapped) {
        try {
            if (name === 'toggleBonif') toggleBonif = wrapped;
            else if (name === 'changeAnaliseTecnica') changeAnaliseTecnica = wrapped;
            else if (name === 'toggleInvoiceAdvisorySent') toggleInvoiceAdvisorySent = wrapped;
            else if (name === 'changeInvoiceAdvisoryAnalysis') changeInvoiceAdvisoryAnalysis = wrapped;
            else if (name === 'toggleConsEnviada') toggleConsEnviada = wrapped;
            else if (name === 'confirmRetification') confirmRetification = wrapped;
        } catch (_error) {
            // Alguns ambientes expõem somente a propriedade de window; o wrapper em root continua válido.
        }
    }

    function wrapHandler(root, name, required = true) {
        const original = root?.[name];
        if (typeof original !== 'function') return !required;
        if (original[WRAPPED_MARKER] === true) return true;

        const wrapped = async function evaluationHandlerPreservingScroll(...args) {
            return preserve(root, () => original.apply(this, args));
        };
        Object.defineProperty(wrapped, WRAPPED_MARKER, {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        root[name] = wrapped;
        assignGlobalLexical(name, wrapped);
        return true;
    }

    function install(root) {
        if (!root?.document) return false;
        if (root.__radarProntuarioScrollPreservationInstalled === true) return true;

        const requiredReady = EVALUATION_HANDLER_NAMES.every(name => wrapHandler(root, name, true));
        if (!requiredReady) return false;
        OPTIONAL_HANDLER_NAMES.forEach(name => wrapHandler(root, name, false));

        root.__radarProntuarioScrollPreservationInstalled = true;
        return true;
    }

    return Object.freeze({
        EVALUATION_HANDLER_NAMES,
        OPTIONAL_HANDLER_NAMES,
        capture,
        restore,
        preserve,
        wrapHandler,
        install
    });
}));
