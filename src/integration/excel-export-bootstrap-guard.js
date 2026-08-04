(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) {
        root.RadarExcelExportBootstrapGuard = api;
        if (root.document) api.install();
    }
}(typeof window !== 'undefined' ? window : globalThis, function (root) {
    'use strict';

    const VERSION = '1.0.0';
    const BOOTSTRAP_URL = '/src/integration/load-excel-export.js';
    const DEFAULT_TIMEOUT_MS = 15000;
    const DEFAULT_ATTEMPTS = 2;

    function createGuardError(code, message, details = null, cause = null) {
        const error = new Error(message);
        error.code = code;
        if (details) error.details = details;
        if (cause) error.cause = cause;
        return error;
    }

    function removeScript(script) {
        if (!script) return;
        if (typeof script.remove === 'function') script.remove();
        else if (script.parentNode?.removeChild) script.parentNode.removeChild(script);
    }

    function createGuard(environment = {}) {
        const runtimeRoot = environment.root || root;
        const runtimeDocument = environment.document || runtimeRoot?.document || null;
        const customLoader = environment.loadScript || null;
        const attempts = Number.isSafeInteger(environment.attempts) && environment.attempts > 0
            ? environment.attempts
            : DEFAULT_ATTEMPTS;
        const timeoutMs = Number.isFinite(environment.timeoutMs) && environment.timeoutMs > 0
            ? environment.timeoutMs
            : DEFAULT_TIMEOUT_MS;
        const now = typeof environment.now === 'function' ? environment.now : Date.now;
        const scheduleTimeout = environment.setTimeout
            || runtimeRoot?.setTimeout?.bind(runtimeRoot)
            || setTimeout;
        const cancelTimeout = environment.clearTimeout
            || runtimeRoot?.clearTimeout?.bind(runtimeRoot)
            || clearTimeout;
        let state = 'idle';
        let inFlight = null;

        function getState() {
            return state;
        }

        function resolveBootstrap() {
            const bootstrap = runtimeRoot?.RadarExcelExportBootstrap;
            if (!bootstrap || typeof bootstrap.start !== 'function') {
                throw createGuardError(
                    'EXCEL_BOOTSTRAP_GUARD_CONTRACT_INVALID',
                    'O carregador inicial não disponibilizou o contrato da exportação Excel.'
                );
            }
            return bootstrap;
        }

        function loadFromDocument(src) {
            if (!runtimeDocument?.head || typeof runtimeDocument.createElement !== 'function') {
                return Promise.reject(createGuardError(
                    'EXCEL_BOOTSTRAP_GUARD_DOCUMENT_UNAVAILABLE',
                    'O navegador não disponibilizou o carregador inicial da exportação Excel.'
                ));
            }

            const existing = runtimeDocument.querySelector?.(
                'script[data-radar-bootstrap-guard], '
                + 'script[data-radar-extension="src/integration/load-excel-export.js"], '
                + 'script[src$="/src/integration/load-excel-export.js"]'
            ) || null;
            if (existing) removeScript(existing);

            const script = runtimeDocument.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarBootstrapGuard = 'true';
            script.dataset.radarState = 'loading';

            return new Promise((resolve, reject) => {
                let settled = false;
                let timer = null;
                const cleanup = () => {
                    if (timer !== null) cancelTimeout(timer);
                    script.removeEventListener?.('load', onLoad);
                    script.removeEventListener?.('error', onError);
                };
                const fail = error => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    script.dataset.radarState = 'failed';
                    removeScript(script);
                    reject(error);
                };
                const onLoad = () => {
                    if (settled) return;
                    try {
                        resolveBootstrap();
                        settled = true;
                        cleanup();
                        script.dataset.radarState = 'ready';
                        resolve(true);
                    } catch (error) {
                        fail(error);
                    }
                };
                const onError = () => fail(createGuardError(
                    'EXCEL_BOOTSTRAP_GUARD_LOAD_FAILED',
                    'Não foi possível carregar o bootstrap da exportação Excel.',
                    { src }
                ));

                script.addEventListener?.('load', onLoad, { once: true });
                script.addEventListener?.('error', onError, { once: true });
                timer = scheduleTimeout(() => fail(createGuardError(
                    'EXCEL_BOOTSTRAP_GUARD_TIMEOUT',
                    'O carregamento inicial da exportação Excel excedeu o tempo esperado.',
                    { src, timeoutMs }
                )), timeoutMs);
                runtimeDocument.head.appendChild(script);
            });
        }

        async function loadBootstrap(src) {
            if (customLoader) {
                try {
                    await customLoader(src, runtimeRoot);
                } catch (error) {
                    throw createGuardError(
                        'EXCEL_BOOTSTRAP_GUARD_LOAD_FAILED',
                        'Não foi possível carregar o bootstrap da exportação Excel.',
                        { src },
                        error
                    );
                }
                resolveBootstrap();
                return true;
            }
            return loadFromDocument(src);
        }

        async function performStart() {
            let bootstrap = runtimeRoot?.RadarExcelExportBootstrap;
            if (!bootstrap || typeof bootstrap.start !== 'function') {
                let lastError = null;
                for (let attempt = 1; attempt <= attempts; attempt += 1) {
                    const src = attempt === 1
                        ? BOOTSTRAP_URL
                        : `${BOOTSTRAP_URL}?retry=${now()}-${attempt}`;
                    try {
                        await loadBootstrap(src);
                        lastError = null;
                        break;
                    } catch (error) {
                        lastError = error;
                    }
                }
                if (lastError) throw lastError;
                bootstrap = resolveBootstrap();
            }
            await bootstrap.start();
            return true;
        }

        async function start() {
            if (state === 'ready') return true;
            if (inFlight) return inFlight;
            state = 'loading';
            inFlight = performStart()
                .then(result => {
                    state = 'ready';
                    return result;
                })
                .catch(error => {
                    state = 'failed';
                    inFlight = null;
                    throw error;
                });
            return inFlight;
        }

        function reset() {
            state = 'idle';
            inFlight = null;
        }

        return Object.freeze({ getState, reset, start });
    }

    const defaultGuard = createGuard();
    let installed = false;

    function install() {
        if (installed || !root?.document) return installed;
        installed = true;
        root.retryRadarExcelExportBootstrapGuard = () => defaultGuard.start();
        const start = () => defaultGuard.start().catch(error => {
            console.error('[RADAR PDDE] Não foi possível recuperar o bootstrap Excel.', {
                code: error?.code || 'EXCEL_BOOTSTRAP_GUARD_UNKNOWN',
                message: error?.message || 'Falha desconhecida.'
            });
        });
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
        return true;
    }

    return Object.freeze({
        BOOTSTRAP_URL,
        DEFAULT_ATTEMPTS,
        DEFAULT_TIMEOUT_MS,
        VERSION,
        createGuard,
        createGuardError,
        getState: defaultGuard.getState,
        install,
        reset: defaultGuard.reset,
        start: defaultGuard.start
    });
}));
