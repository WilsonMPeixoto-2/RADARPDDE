(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeRuntimeLoader = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '2.0.0';
    const EXCELJS_URL = '/vendor/exceljs.min.js';
    const TEMPLATE_BASE_URL = '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';
    const TEMPLATE_VERSION = '2026-08-04.1';
    const TEMPLATE_URL = `${TEMPLATE_BASE_URL}?v=${TEMPLATE_VERSION}`;
    const DEFAULT_TIMEOUT_MS = 15000;

    function createRuntimeError(code, message, cause = null, details = null) {
        const error = new Error(message);
        error.code = code;
        if (cause) error.cause = cause;
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

    function createRuntimeLoader(environment = {}) {
        const runtimeRoot = environment.root || root;
        const runtimeDocument = environment.document || runtimeRoot?.document || null;
        const runtimeFetch = environment.fetch
            || (typeof runtimeRoot?.fetch === 'function' ? runtimeRoot.fetch.bind(runtimeRoot) : null);
        const customScriptLoader = environment.loadScript || null;
        const now = typeof environment.now === 'function' ? environment.now : Date.now;
        const timeoutMs = Number.isFinite(environment.timeoutMs) && environment.timeoutMs > 0
            ? environment.timeoutMs
            : DEFAULT_TIMEOUT_MS;
        const AbortControllerCtor = environment.AbortController
            || runtimeRoot?.AbortController
            || (typeof AbortController === 'function' ? AbortController : null);
        const scheduleTimeout = environment.setTimeout
            || runtimeRoot?.setTimeout?.bind(runtimeRoot)
            || setTimeout;
        const cancelTimeout = environment.clearTimeout
            || runtimeRoot?.clearTimeout?.bind(runtimeRoot)
            || clearTimeout;
        let inFlight = null;
        let cachedTemplate = null;
        let excelJsInFlight = null;

        function assertExcelJs() {
            const ExcelJS = runtimeRoot?.ExcelJS;
            if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
                throw createRuntimeError(
                    'SME_EXCELJS_CONTRACT_INVALID',
                    'O ExcelJS foi carregado, mas o contrato Workbook não está disponível.'
                );
            }
            return ExcelJS;
        }

        function waitForScript(script, src) {
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
                        const ExcelJS = assertExcelJs();
                        settled = true;
                        cleanup();
                        script.dataset.radarState = 'ready';
                        script.dataset.radarLoaded = 'true';
                        resolve(ExcelJS);
                    } catch (error) {
                        fail(error);
                    }
                };
                const onError = () => fail(createRuntimeError(
                    'SME_EXCELJS_LOAD_FAILED',
                    'Não foi possível carregar o motor ExcelJS.',
                    null,
                    { src }
                ));

                script.addEventListener?.('load', onLoad, { once: true });
                script.addEventListener?.('error', onError, { once: true });
                timer = scheduleTimeout(() => fail(createRuntimeError(
                    'SME_EXCELJS_LOAD_TIMEOUT',
                    'O carregamento do motor ExcelJS excedeu o tempo esperado.',
                    null,
                    { src, timeoutMs }
                )), timeoutMs);
            });
        }

        function loadScriptFromDocument(src) {
            if (runtimeRoot?.ExcelJS?.Workbook) return Promise.resolve(runtimeRoot.ExcelJS);
            if (!runtimeDocument?.head || typeof runtimeDocument.createElement !== 'function') {
                return Promise.reject(createRuntimeError(
                    'SME_EXCELJS_LOAD_UNAVAILABLE',
                    'O navegador não disponibilizou o carregador de scripts do Excel SME.'
                ));
            }

            const selector = `script[data-radar-excel-runtime="${src}"]`;
            let script = runtimeDocument.querySelector?.(selector) || null;
            const state = script?.dataset?.radarState;

            if (script && state === 'ready') {
                try {
                    return Promise.resolve(assertExcelJs());
                } catch (error) {
                    removeScript(script);
                    script = null;
                }
            } else if (script && state !== 'loading') {
                removeScript(script);
                script = null;
            }

            if (!script) {
                script = runtimeDocument.createElement('script');
                script.src = src;
                script.async = true;
                script.dataset.radarExcelRuntime = src;
                script.dataset.radarState = 'loading';
                const pending = waitForScript(script, src);
                runtimeDocument.head.appendChild(script);
                return pending;
            }

            return waitForScript(script, src);
        }

        function withTimeout(promise, timeoutCode, timeoutMessage, details = null) {
            let timer = null;
            const timeout = new Promise((_, reject) => {
                timer = scheduleTimeout(() => reject(createRuntimeError(
                    timeoutCode,
                    timeoutMessage,
                    null,
                    { ...details, timeoutMs }
                )), timeoutMs);
            });
            return Promise.race([promise, timeout]).finally(() => {
                if (timer !== null) cancelTimeout(timer);
            });
        }

        async function loadExcelJs() {
            if (runtimeRoot?.ExcelJS?.Workbook) return runtimeRoot.ExcelJS;
            if (excelJsInFlight) return excelJsInFlight;

            excelJsInFlight = (async () => {
                if (customScriptLoader) {
                    try {
                        await withTimeout(
                            Promise.resolve(customScriptLoader(EXCELJS_URL, runtimeRoot)),
                            'SME_EXCELJS_LOAD_TIMEOUT',
                            'O carregamento do motor ExcelJS excedeu o tempo esperado.',
                            { src: EXCELJS_URL }
                        );
                        return assertExcelJs();
                    } catch (error) {
                        if (error?.code) throw error;
                        throw createRuntimeError(
                            'SME_EXCELJS_LOAD_FAILED',
                            'Não foi possível carregar o motor ExcelJS.',
                            error,
                            { src: EXCELJS_URL }
                        );
                    }
                }
                return loadScriptFromDocument(EXCELJS_URL);
            })().catch(error => {
                excelJsInFlight = null;
                throw error;
            });

            return excelJsInFlight;
        }

        function isValidXlsx(bytes) {
            return bytes.length >= 4
                && bytes[0] === 0x50
                && bytes[1] === 0x4B
                && bytes[2] === 0x03
                && bytes[3] === 0x04;
        }

        async function fetchTemplate(url) {
            const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
            let timedOut = false;
            let timer = null;

            const operation = (async () => {
                const response = await runtimeFetch(url, {
                    method: 'GET',
                    cache: 'no-store',
                    credentials: 'same-origin',
                    ...(controller ? { signal: controller.signal } : {})
                });
                if (!response || response.ok !== true || typeof response.arrayBuffer !== 'function') {
                    const status = response?.status || null;
                    throw createRuntimeError(
                        'SME_TEMPLATE_HTTP_FAILED',
                        `Não foi possível carregar o template Excel SME${status ? ` (${status})` : ''}.`,
                        null,
                        { url, status }
                    );
                }
                return new Uint8Array(await response.arrayBuffer());
            })();

            const timeout = new Promise((_, reject) => {
                timer = scheduleTimeout(() => {
                    timedOut = true;
                    controller?.abort();
                    reject(createRuntimeError(
                        'SME_TEMPLATE_TIMEOUT',
                        'O carregamento do template Excel SME excedeu o tempo esperado.',
                        null,
                        { url, timeoutMs }
                    ));
                }, timeoutMs);
            });

            let bytes;
            try {
                bytes = await Promise.race([operation, timeout]);
            } catch (error) {
                if (timedOut || error?.name === 'AbortError') {
                    throw createRuntimeError(
                        'SME_TEMPLATE_TIMEOUT',
                        'O carregamento do template Excel SME excedeu o tempo esperado.',
                        error,
                        { url, timeoutMs }
                    );
                }
                if (error?.code) throw error;
                throw createRuntimeError(
                    'SME_TEMPLATE_HTTP_FAILED',
                    'Não foi possível carregar o template Excel SME.',
                    error,
                    { url }
                );
            } finally {
                if (timer !== null) cancelTimeout(timer);
            }

            if (!bytes.length) {
                throw createRuntimeError(
                    'SME_TEMPLATE_EMPTY',
                    'O template Excel SME está vazio.',
                    null,
                    { url }
                );
            }
            if (!isValidXlsx(bytes)) {
                throw createRuntimeError(
                    'SME_TEMPLATE_INVALID',
                    'O template Excel SME retornado não é um arquivo XLSX válido.',
                    null,
                    { url, bytes: bytes.length }
                );
            }
            return bytes;
        }

        async function loadTemplate() {
            if (cachedTemplate) return new Uint8Array(cachedTemplate);
            if (typeof runtimeFetch !== 'function') {
                throw createRuntimeError(
                    'SME_TEMPLATE_FETCH_UNAVAILABLE',
                    'O navegador não disponibilizou o carregamento do template Excel SME.'
                );
            }

            const urls = [
                TEMPLATE_URL,
                `${TEMPLATE_BASE_URL}?v=${TEMPLATE_VERSION}&retry=${now()}`
            ];
            let lastError = null;

            for (const url of urls) {
                try {
                    const bytes = await fetchTemplate(url);
                    cachedTemplate = new Uint8Array(bytes);
                    return new Uint8Array(cachedTemplate);
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || createRuntimeError(
                'SME_TEMPLATE_HTTP_FAILED',
                'Não foi possível carregar o template Excel SME.'
            );
        }

        async function performLoad() {
            const [ExcelJS, templateBytes] = await Promise.all([
                loadExcelJs(),
                loadTemplate()
            ]);
            return Object.freeze({
                ExcelJS,
                templateBytes,
                excelJsUrl: EXCELJS_URL,
                templateUrl: TEMPLATE_URL
            });
        }

        async function loadExcelSmeRuntime() {
            if (!inFlight) {
                inFlight = performLoad().catch(error => {
                    inFlight = null;
                    throw error;
                });
            }
            const runtime = await inFlight;
            return Object.freeze({
                ...runtime,
                templateBytes: new Uint8Array(runtime.templateBytes)
            });
        }

        function clearCache() {
            inFlight = null;
            cachedTemplate = null;
            if (!runtimeRoot?.ExcelJS?.Workbook) excelJsInFlight = null;
        }

        return Object.freeze({
            clearCache,
            loadExcelSmeRuntime
        });
    }

    const defaultLoader = createRuntimeLoader();

    return Object.freeze({
        DEFAULT_TIMEOUT_MS,
        EXCELJS_URL,
        TEMPLATE_BASE_URL,
        TEMPLATE_URL,
        TEMPLATE_VERSION,
        VERSION,
        createRuntimeError,
        createRuntimeLoader,
        loadExcelSmeRuntime: defaultLoader.loadExcelSmeRuntime
    });
}));
