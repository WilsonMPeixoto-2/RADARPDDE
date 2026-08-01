(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeRuntimeLoader = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '1.0.0';
    const EXCELJS_URL = '/vendor/exceljs.min.js';
    const TEMPLATE_URL = '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';

    function createRuntimeLoader(environment = {}) {
        const runtimeRoot = environment.root || root;
        const runtimeDocument = environment.document || runtimeRoot?.document || null;
        const runtimeFetch = environment.fetch
            || (typeof runtimeRoot?.fetch === 'function' ? runtimeRoot.fetch.bind(runtimeRoot) : null);
        const customScriptLoader = environment.loadScript || null;
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

        async function loadTemplate() {
            if (cachedTemplate) return new Uint8Array(cachedTemplate);
            if (typeof runtimeFetch !== 'function') {
                throw new Error('O navegador não disponibilizou o carregamento do template Excel SME.');
            }
            const response = await runtimeFetch(TEMPLATE_URL, {
                method: 'GET',
                cache: 'force-cache',
                credentials: 'same-origin'
            });
            if (!response || response.ok !== true || typeof response.arrayBuffer !== 'function') {
                const status = response?.status ? ` (${response.status})` : '';
                throw new Error(`Não foi possível carregar o template Excel SME${status}.`);
            }
            const buffer = await response.arrayBuffer();
            cachedTemplate = new Uint8Array(buffer);
            if (!cachedTemplate.length) throw new Error('O template Excel SME está vazio.');
            return new Uint8Array(cachedTemplate);
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
        TEMPLATE_URL,
        VERSION,
        createRuntimeLoader,
        loadExcelSmeRuntime: defaultLoader.loadExcelSmeRuntime
    });
}));
