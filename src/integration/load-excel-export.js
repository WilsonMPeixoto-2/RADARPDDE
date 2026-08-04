(function (root, factory) {
    if (root?.RadarExcelExportBootstrap) {
        if (typeof module === 'object' && module.exports) {
            module.exports = root.RadarExcelExportBootstrap;
        }
        return;
    }

    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) {
        root.RadarExcelExportBootstrap = api;
        if (root.document) api.install();
    }
}(typeof window !== 'undefined' ? window : globalThis, function (root) {
    'use strict';

    const VERSION = '2.0.0';
    const DEFAULT_TIMEOUT_MS = 15000;
    const DEFAULT_SCRIPTS = Object.freeze([
        Object.freeze({
            src: '/src/domain/excel-export-model.js',
            isReady: target => typeof target.RadarExcelExportModel?.buildExportModel === 'function'
        }),
        Object.freeze({
            src: '/src/domain/excel-workbook-plan.js',
            isReady: target => typeof target.RadarExcelWorkbookPlan?.createWorkbookPlan === 'function'
        }),
        Object.freeze({
            src: '/src/domain/excel-xlsx-renderer.js',
            isReady: target => typeof target.RadarExcelXlsxRenderer?.downloadWorkbook === 'function'
        }),
        Object.freeze({
            src: '/src/domain/excel-sme-export-model.js',
            isReady: target => typeof target.RadarExcelSmeExportModel?.buildSmeMonthlyModel === 'function'
        }),
        Object.freeze({
            src: '/src/domain/excel-sme-template-renderer.js',
            isReady: target => typeof target.RadarExcelSmeTemplateRenderer?.renderWorkbook === 'function'
        }),
        Object.freeze({
            src: '/src/domain/excel-sme-monthly-renderer.js',
            isReady: target => typeof target.RadarExcelSmeMonthlyRenderer?.downloadWorkbook === 'function'
        }),
        Object.freeze({
            src: '/src/integration/excel-sme-runtime-loader.js',
            isReady: target => typeof target.RadarExcelSmeRuntimeLoader?.loadExcelSmeRuntime === 'function'
        }),
        Object.freeze({
            src: '/src/integration/excel-export-integration.js',
            isReady: target => typeof target.RadarExcelExportIntegration?.exportSmeXlsx === 'function'
        })
    ]);

    function createBootstrapError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) error.details = details;
        return error;
    }

    function removeScript(script) {
        if (!script) return;
        if (typeof script.remove === 'function') {
            script.remove();
            return;
        }
        if (script.parentNode && typeof script.parentNode.removeChild === 'function') {
            script.parentNode.removeChild(script);
        }
    }

    function createBootstrap(environment = {}) {
        const runtimeRoot = environment.root || root;
        const runtimeDocument = environment.document || runtimeRoot?.document || null;
        const scripts = Array.isArray(environment.scripts)
            ? environment.scripts.map(definition => ({ ...definition }))
            : DEFAULT_SCRIPTS.map(definition => ({ ...definition }));
        const timeoutMs = Number.isFinite(environment.timeoutMs) && environment.timeoutMs > 0
            ? environment.timeoutMs
            : DEFAULT_TIMEOUT_MS;
        const scheduleTimeout = environment.setTimeout
            || runtimeRoot?.setTimeout?.bind(runtimeRoot)
            || setTimeout;
        const cancelTimeout = environment.clearTimeout
            || runtimeRoot?.clearTimeout?.bind(runtimeRoot)
            || clearTimeout;
        let state = 'idle';
        let inFlight = null;

        function updateState(nextState) {
            state = nextState;
            if (runtimeRoot) runtimeRoot.__RADAR_EXCEL_EXPORT_LOADER__ = nextState;
        }

        function getState() {
            return state;
        }

        function waitForScript(script, definition) {
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
                    if (typeof definition.isReady === 'function' && !definition.isReady(runtimeRoot)) {
                        fail(createBootstrapError(
                            'EXCEL_BOOTSTRAP_CONTRACT_INVALID',
                            `O módulo ${definition.src} foi carregado sem disponibilizar o contrato esperado.`,
                            { src: definition.src }
                        ));
                        return;
                    }
                    settled = true;
                    cleanup();
                    script.dataset.radarState = 'ready';
                    script.dataset.radarLoaded = 'true';
                    resolve(true);
                };
                const onError = () => fail(createBootstrapError(
                    'EXCEL_BOOTSTRAP_SCRIPT_FAILED',
                    `Falha ao carregar ${definition.src}.`,
                    { src: definition.src }
                ));

                script.addEventListener?.('load', onLoad, { once: true });
                script.addEventListener?.('error', onError, { once: true });
                timer = scheduleTimeout(() => fail(createBootstrapError(
                    'EXCEL_BOOTSTRAP_SCRIPT_TIMEOUT',
                    `O carregamento de ${definition.src} excedeu o tempo esperado.`,
                    { src: definition.src, timeoutMs }
                )), timeoutMs);
            });
        }

        async function loadScript(definition) {
            if (!definition || !definition.src) {
                throw createBootstrapError(
                    'EXCEL_BOOTSTRAP_DEFINITION_INVALID',
                    'A definição de um módulo Excel é inválida.'
                );
            }
            if (typeof definition.isReady === 'function' && definition.isReady(runtimeRoot)) {
                return true;
            }
            if (!runtimeDocument?.head || typeof runtimeDocument.createElement !== 'function') {
                throw createBootstrapError(
                    'EXCEL_BOOTSTRAP_DOCUMENT_UNAVAILABLE',
                    'O navegador não disponibilizou o carregador dos módulos Excel.'
                );
            }

            const selector = `script[data-radar-extension="${definition.src}"]`;
            let script = runtimeDocument.querySelector?.(selector) || null;
            const scriptState = script?.dataset?.radarState;

            if (script && scriptState === 'ready') {
                if (typeof definition.isReady !== 'function' || definition.isReady(runtimeRoot)) {
                    return true;
                }
                removeScript(script);
                script = null;
            } else if (script && scriptState !== 'loading') {
                removeScript(script);
                script = null;
            }

            if (!script) {
                script = runtimeDocument.createElement('script');
                script.src = definition.src;
                script.async = false;
                script.dataset.radarExtension = definition.src;
                script.dataset.radarState = 'loading';
                const pending = waitForScript(script, definition);
                runtimeDocument.head.appendChild(script);
                return pending;
            }

            return waitForScript(script, definition);
        }

        async function performStart() {
            for (const definition of scripts) {
                await loadScript(definition);
            }
            return true;
        }

        async function start() {
            if (state === 'ready') return true;
            if (inFlight) return inFlight;

            updateState('loading');
            inFlight = performStart()
                .then(result => {
                    updateState('ready');
                    return result;
                })
                .catch(error => {
                    updateState('failed');
                    inFlight = null;
                    throw error;
                });
            return inFlight;
        }

        function reset() {
            inFlight = null;
            updateState('idle');
            return true;
        }

        return Object.freeze({
            getState,
            loadScript,
            reset,
            start
        });
    }

    const defaultBootstrap = createBootstrap();
    let installed = false;

    function reportFailure(error) {
        console.error('[RADAR PDDE] Não foi possível ativar a exportação XLSX.', error);
    }

    function install() {
        if (installed || !root?.document) return installed;
        installed = true;
        root.retryRadarExcelExportBootstrap = () => defaultBootstrap.start();
        const start = () => defaultBootstrap.start().catch(reportFailure);
        if (root.document.readyState === 'complete') {
            (root.setTimeout || setTimeout)(start, 0);
        } else {
            root.addEventListener?.('load', start, { once: true });
        }
        return true;
    }

    return Object.freeze({
        DEFAULT_SCRIPTS,
        DEFAULT_TIMEOUT_MS,
        VERSION,
        createBootstrap,
        createBootstrapError,
        getState: defaultBootstrap.getState,
        install,
        reset: defaultBootstrap.reset,
        start: defaultBootstrap.start
    });
}));
