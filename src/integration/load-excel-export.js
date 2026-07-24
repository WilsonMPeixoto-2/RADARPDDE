(function (root) {
    'use strict';

    if (!root || root.__RADAR_EXCEL_EXPORT_LOADER__) return;
    root.__RADAR_EXCEL_EXPORT_LOADER__ = true;

    const coreScripts = [
        '/src/domain/excel-export-model.js',
        '/src/domain/excel-workbook-plan.js',
        '/src/domain/excel-xlsx-renderer.js'
    ];
    const smeScripts = [
        '/src/domain/excel-sme-export-model.js',
        '/src/domain/excel-sme-monthly-renderer.js'
    ];
    const integrationScript = '/src/integration/excel-export-integration.js';

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[data-radar-extension="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarExtension = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
            document.head.appendChild(script);
        });
    }

    async function loadExcelJs() {
        if (root.ExcelJS && typeof root.ExcelJS.Workbook === 'function') return;
        try {
            await loadScript('/vendor/exceljs.min.js');
        } catch (productionError) {
            await loadScript('/node_modules/exceljs/dist/exceljs.min.js');
        }
        if (!root.ExcelJS || typeof root.ExcelJS.Workbook !== 'function') {
            throw new Error('ExcelJS foi carregado, mas a API de workbook não está disponível.');
        }
    }

    async function start() {
        try {
            for (const src of coreScripts) await loadScript(src);
            await loadExcelJs();
            for (const src of smeScripts) await loadScript(src);
            await loadScript(integrationScript);
        } catch (error) {
            console.error('[RADAR PDDE] Não foi possível ativar a exportação XLSX.', error);
        }
    }

    if (document.readyState === 'complete') setTimeout(start, 0);
    else root.addEventListener('load', start, { once: true });
}(typeof window !== 'undefined' ? window : globalThis));
