(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeRuntimeLoader = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '1.1.0';
    const EXCELJS_URL = '/vendor/exceljs.min.js';
    const TEMPLATE_BASE_URL = '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';
    const TEMPLATE_VERSION = '2026-08-03.2';
    const TEMPLATE_URL = `${TEMPLATE_BASE_URL}?v=${TEMPLATE_VERSION}`;

    function createRuntimeLoader(environment = {}) {
        const runtimeRoot = environment.root || root;
        const runtimeDocument = environment.document || runtimeRoot?.document || null;
        const runtimeFetch = environment.fetch
            || (typeof runtimeRoot?.fetch === 'function' ? runtimeRoot.fetch.bind(runtimeRoot) : null);
        const customScriptLoader = environment.loadScript || null;
        const now = typeof environment.now === 'function' ? environment.now : Date.now;
        let inFlight = null;
        let cachedTemplate = null;

        function assertExcelJs() {
            const ExcelJS = runtimeRoot?.ExcelJS;
            if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
                throw new Error('O ExcelJS foi carregado, mas o contrato Workbook não está disponível.');
            }
            return ExcelJS;
        }

        function loadScriptFromDocument(src) {
            if (runtimeRoot?.ExcelJS?.Workbook) return Promise.resolve(runtimeRoot.ExcelJS);
            if (!runtimeDocument?.head || typeof runtimeDocument.createElement !== 'function') {
                return Promise.reject(new Error('O navegador não disponibilizou o carregador de scripts do Excel SME.'));
            }
            const selector = `script[data-radar-excel-runtime="${src}"]`;
            const existing = runtimeDocument.querySelector?.(selector);
            if (existing?.dataset?.radarLoaded === 'true') {
                return Promise.resolve(assertExcelJs());
            }
            return new Promise((resolve, reject) => {
                const script = existing || runtimeDocument.createElement('script');
                const onLoad = () => {
                    script.dataset.radarLoaded = 'true';
                    try {
                        resolve(assertExcelJs());
                    } catch (error) {
                        reject(error);
                    }
                };
                const onError = () => reject(new Error('Não foi possível carregar o motor ExcelJS.'));
                script.addEventListener?.('load', onLoad, { once: true });
                script.addEventListener?.('error', onError, { once: true });
                if (!existing) {
                    script.src = src;
                    script.async = true;
                    script.dataset.radarExcelRuntime = src;
                    runtimeDocument.head.appendChild(script);
                }
            });
        }

        async function loadExcelJs() {
            if (runtimeRoot?.ExcelJS?.Workbook) return runtimeRoot.ExcelJS;
            if (customScriptLoader) {
                await customScriptLoader(EXCELJS_URL, runtimeRoot);
                return assertExcelJs();
            }
            return loadScriptFromDocument(EXCELJS_URL);
        }

        function isValidXlsx(bytes) {
            return bytes.length >= 4
                && bytes[0] === 0x50
                && bytes[1] === 0x4B
                && bytes[2] === 0x03
                && bytes[3] === 0x04;
        }

        async function fetchTemplate(url) {
            const response = await runtimeFetch(url, {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (!response || response.ok !== true || typeof response.arrayBuffer !== 'function') {
                const status = response?.status ? ` (${response.status})` : '';
                throw new Error(`Não foi possível carregar o template Excel SME${status}.`);
            }
            const bytes = new Uint8Array(await response.arrayBuffer());
            if (!bytes.length) throw new Error('O template Excel SME está vazio.');
            if (!isValidXlsx(bytes)) {
                throw new Error('O template Excel SME retornado não é um arquivo XLSX válido.');
            }
            return bytes;
        }

        async function loadTemplate() {
            if (cachedTemplate) return new Uint8Array(cachedTemplate);
            if (typeof runtimeFetch !== 'function') {
                throw new Error('O navegador não disponibilizou o carregamento do template Excel SME.');
            }

            const urls = [
                TEMPLATE_URL,
                `${TEMPLATE_BASE_URL}?v=${TEMPLATE_VERSION}&retry=${now()}`
            ];
            let lastError = null;

            for (const url of urls) {
                try {
                    cachedTemplate = await fetchTemplate(url);
                    return new Uint8Array(cachedTemplate);
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('Não foi possível carregar o template Excel SME.');
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
        }

        return Object.freeze({
            clearCache,
            loadExcelSmeRuntime
        });
    }

    const defaultLoader = createRuntimeLoader();

    return Object.freeze({
        EXCELJS_URL,
        TEMPLATE_BASE_URL,
        TEMPLATE_URL,
        TEMPLATE_VERSION,
        VERSION,
        createRuntimeLoader,
        loadExcelSmeRuntime: defaultLoader.loadExcelSmeRuntime
    });
}));
