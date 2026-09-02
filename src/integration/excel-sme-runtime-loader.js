(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeRuntimeLoader = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '2.1.0';
    const EXCELJS_URL = '/vendor/exceljs.min.js';
    const TEMPLATE_BASE_URL = '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';
    const ASSET_MANIFEST_URL = '/excel-sme-assets.json';
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

    function isLocalLocation(location = null) {
        const href = String(location?.href || '');
        if (!href) return false;
        try {
            const url = new URL(href);
            return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        } catch (_error) {
            return false;
        }
    }

    function validateAssetDescriptor(value, expectedPath, name) {
        const descriptor = value && typeof value === 'object' ? value : null;
        const sha256 = String(descriptor?.sha256 || '').trim().toLowerCase();
        const assetPath = String(descriptor?.path || '').trim();
        const bytes = Number(descriptor?.bytes);
        if (assetPath !== expectedPath
            || !/^[0-9a-f]{64}$/.test(sha256)
            || !Number.isSafeInteger(bytes)
            || bytes <= 0) {
            throw createRuntimeError(
                'SME_ASSET_MANIFEST_INVALID',
                `O manifesto do Excel SME contém uma descrição inválida para ${name}.`,
                null,
                { name, expectedPath }
            );
        }
        return Object.freeze({ path: assetPath, sha256, bytes });
    }

    function validateAssetManifest(value) {
        if (!value || value.schemaVersion !== 1) {
            throw createRuntimeError(
                'SME_ASSET_MANIFEST_INVALID',
                'O manifesto dos assets do Excel SME possui versão inválida.'
            );
        }
        return Object.freeze({
            schemaVersion: 1,
            template: validateAssetDescriptor(value.template, TEMPLATE_BASE_URL, 'template'),
            exceljs: validateAssetDescriptor(value.exceljs, EXCELJS_URL, 'ExcelJS')
        });
    }

    function versionedAssetUrl(descriptor, fallbackUrl) {
        if (!descriptor) return fallbackUrl;
        return `${descriptor.path}?v=${descriptor.sha256.slice(0, 16)}`;
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
        const useAssetManifest = environment.useAssetManifest !== undefined
            ? environment.useAssetManifest === true
            : Boolean(runtimeRoot?.location && runtimeDocument);
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
        let cachedManifest;
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

        async function loadExcelJs(src = EXCELJS_URL) {
            if (runtimeRoot?.ExcelJS?.Workbook) return runtimeRoot.ExcelJS;
            if (excelJsInFlight) return excelJsInFlight;

            excelJsInFlight = (async () => {
                if (customScriptLoader) {
                    try {
                        await withTimeout(
                            Promise.resolve(customScriptLoader(src, runtimeRoot)),
                            'SME_EXCELJS_LOAD_TIMEOUT',
                            'O carregamento do motor ExcelJS excedeu o tempo esperado.',
                            { src }
                        );
                        return assertExcelJs();
                    } catch (error) {
                        if (error?.code) throw error;
                        throw createRuntimeError(
                            'SME_EXCELJS_LOAD_FAILED',
                            'Não foi possível carregar o motor ExcelJS.',
                            error,
                            { src }
                        );
                    }
                }
                return loadScriptFromDocument(src);
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

        async function requestWithTimeout(url, options, timeoutCode, timeoutMessage) {
            const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
            let timedOut = false;
            let timer = null;
            const operation = runtimeFetch(url, {
                ...options,
                ...(controller ? { signal: controller.signal } : {})
            });
            const timeout = new Promise((_, reject) => {
                timer = scheduleTimeout(() => {
                    timedOut = true;
                    controller?.abort();
                    reject(createRuntimeError(
                        timeoutCode,
                        timeoutMessage,
                        null,
                        { url, timeoutMs }
                    ));
                }, timeoutMs);
            });

            try {
                return await Promise.race([operation, timeout]);
            } catch (error) {
                if (timedOut || error?.name === 'AbortError') {
                    throw createRuntimeError(
                        timeoutCode,
                        timeoutMessage,
                        error,
                        { url, timeoutMs }
                    );
                }
                throw error;
            } finally {
                if (timer !== null) cancelTimeout(timer);
            }
        }

        async function loadAssetManifest() {
            if (!useAssetManifest) return null;
            if (cachedManifest !== undefined) return cachedManifest;
            if (typeof runtimeFetch !== 'function') {
                throw createRuntimeError(
                    'SME_ASSET_MANIFEST_UNAVAILABLE',
                    'O navegador não disponibilizou o manifesto dos assets do Excel SME.'
                );
            }

            let response;
            try {
                response = await requestWithTimeout(
                    ASSET_MANIFEST_URL,
                    { method: 'GET', cache: 'no-store', credentials: 'same-origin' },
                    'SME_ASSET_MANIFEST_TIMEOUT',
                    'O carregamento do manifesto do Excel SME excedeu o tempo esperado.'
                );
            } catch (error) {
                if (error?.code) throw error;
                throw createRuntimeError(
                    'SME_ASSET_MANIFEST_HTTP_FAILED',
                    'Não foi possível carregar o manifesto dos assets do Excel SME.',
                    error
                );
            }

            if (!response || response.ok !== true) {
                if (response?.status === 404 && isLocalLocation(runtimeRoot?.location)) {
                    cachedManifest = null;
                    return null;
                }
                throw createRuntimeError(
                    'SME_ASSET_MANIFEST_HTTP_FAILED',
                    `Não foi possível carregar o manifesto dos assets do Excel SME${response?.status ? ` (${response.status})` : ''}.`,
                    null,
                    { status: response?.status || null }
                );
            }
            if (typeof response.json !== 'function') {
                throw createRuntimeError(
                    'SME_ASSET_MANIFEST_INVALID',
                    'O manifesto dos assets do Excel SME não está em formato JSON válido.'
                );
            }

            let rawManifest;
            try {
                rawManifest = await response.json();
            } catch (error) {
                throw createRuntimeError(
                    'SME_ASSET_MANIFEST_INVALID',
                    'O manifesto dos assets do Excel SME não pôde ser interpretado.',
                    error
                );
            }
            cachedManifest = validateAssetManifest(rawManifest);
            return cachedManifest;
        }

        async function fetchTemplate(url) {
            let response;
            try {
                response = await requestWithTimeout(
                    url,
                    { method: 'GET', cache: 'no-store', credentials: 'same-origin' },
                    'SME_TEMPLATE_TIMEOUT',
                    'O carregamento do template Excel SME excedeu o tempo esperado.'
                );
            } catch (error) {
                if (error?.code) throw error;
                throw createRuntimeError(
                    'SME_TEMPLATE_HTTP_FAILED',
                    'Não foi possível carregar o template Excel SME.',
                    error,
                    { url }
                );
            }

            if (!response || response.ok !== true || typeof response.arrayBuffer !== 'function') {
                const status = response?.status || null;
                throw createRuntimeError(
                    'SME_TEMPLATE_HTTP_FAILED',
                    `Não foi possível carregar o template Excel SME${status ? ` (${status})` : ''}.`,
                    null,
                    { url, status }
                );
            }

            const bytes = new Uint8Array(await response.arrayBuffer());
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

        async function loadTemplate(primaryUrl = TEMPLATE_URL) {
            if (cachedTemplate) return new Uint8Array(cachedTemplate);
            if (typeof runtimeFetch !== 'function') {
                throw createRuntimeError(
                    'SME_TEMPLATE_FETCH_UNAVAILABLE',
                    'O navegador não disponibilizou o carregamento do template Excel SME.'
                );
            }

            const separator = primaryUrl.includes('?') ? '&' : '?';
            const urls = [
                primaryUrl,
                `${primaryUrl}${separator}retry=${now()}`
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
            const assetManifest = await loadAssetManifest();
            const excelJsUrl = versionedAssetUrl(assetManifest?.exceljs, EXCELJS_URL);
            const templateUrl = versionedAssetUrl(assetManifest?.template, TEMPLATE_URL);
            const [ExcelJS, templateBytes] = await Promise.all([
                loadExcelJs(excelJsUrl),
                loadTemplate(templateUrl)
            ]);
            return Object.freeze({
                ExcelJS,
                templateBytes,
                excelJsUrl,
                templateUrl,
                assetManifest
            });
        }

        async function loadExcelJsRuntime() {
            const assetManifest = await loadAssetManifest();
            const excelJsUrl = versionedAssetUrl(assetManifest?.exceljs, EXCELJS_URL);
            const ExcelJS = await loadExcelJs(excelJsUrl);
            return Object.freeze({
                ExcelJS,
                excelJsUrl,
                assetManifest
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
            cachedManifest = undefined;
            if (!runtimeRoot?.ExcelJS?.Workbook) excelJsInFlight = null;
        }

        return Object.freeze({
            clearCache,
            loadAssetManifest,
            loadExcelJsRuntime,
            loadExcelSmeRuntime
        });
    }

    const defaultLoader = createRuntimeLoader();

    return Object.freeze({
        ASSET_MANIFEST_URL,
        DEFAULT_TIMEOUT_MS,
        EXCELJS_URL,
        TEMPLATE_BASE_URL,
        TEMPLATE_URL,
        TEMPLATE_VERSION,
        VERSION,
        createRuntimeError,
        createRuntimeLoader,
        isLocalLocation,
        loadExcelJsRuntime: defaultLoader.loadExcelJsRuntime,
        loadExcelSmeRuntime: defaultLoader.loadExcelSmeRuntime,
        validateAssetManifest,
        versionedAssetUrl
    });
}));
