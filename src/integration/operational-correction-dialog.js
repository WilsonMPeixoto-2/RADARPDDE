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
        return root?.RadarDataContext?.dataService?.repository
            || root?.RadarDataContext?.repository || null;
    }
    function canUse(root) {
        if (root?.RADAR_OPERATIONAL_CORRECTION_PREVIEW !== true) return false;
        try {
            const repository = repositoryOf(root);
            return typeof repository?.executeRpc === 'function'
                && repository?.capabilities?.().remote === true
                && typeof root.RadarOperationalCorrectionClient?.createOperationalCorrectionClient === 'function';
        } catch (_error) {
            return false;
        }
    }
    function open(root, input = {}) {
        const context = input.context || {};
        if (!canUse(root) || !context.¶»§q«^