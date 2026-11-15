(function installOperationalCorrectionDialog(root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarOperationalCorrectionDialog = api;
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalCorrectionDialog() {
    'use strict';

    const ANALYSES = ['Correto', 'Correto (Atrasado)', 'Incorreto'];
    const text = value => value == null ? '' : String(value).trim();
    const el = (doc, tag, className, value) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    };
    function repositoryOf(root) {
        // O app.js publica o DataService em RadarApplicationServices.data.
        // RadarDataContext Ã© apenas metadados de bootstrap (Object.freeze).
        // Usar a MESMA instÃ¢ncia jÃ¡ autenticada, sem criar um segundo cliente.
        return root?.RadarApplicationServices?.data?.repository
            || root?.RadarDataContext?.dataService?.repository
            || root?.RadarDataContext?.repository || null;
    }
    function canUse(root) {
        if (root?.RADAR_OPERATIONAL_CORRECTION_PREVIEW !== true) return false;
        try {
            const repository = repositoryOf(root);
            return typeof repository?.executeRpc === 'function'
                && repository?.capabilities?.().remote === true
     ¶»§q«^