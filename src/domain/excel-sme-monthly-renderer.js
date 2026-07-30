(function (root, factory) {
    const renderer = typeof module === 'object' && module.exports
        ? require('./excel-sme-template-renderer.js')
        : root && root.RadarExcelSmeTemplateRenderer;
    const api = factory(renderer);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeMonthlyRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (renderer) {
    'use strict';

    if (!renderer || typeof renderer.renderWorkbook !== 'function') {
        throw new Error('Renderer ExcelJS do template SME não foi carregado.');
    }

    return renderer;
}));
