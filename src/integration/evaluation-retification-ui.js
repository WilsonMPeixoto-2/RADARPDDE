(function installRadarEvaluationRetificationUi(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarEvaluationRetificationUi = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            attemptInstall();
            root.addEventListener?.('radar:application-services-ready', attemptInstall);
            if (root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createEvaluationRetificationUiApi() {
    'use strict';

    const VERSION = '1.1.0';
    const DERIVED_TECHNICAL_DOCUMENTS = new Set(['notaFiscal', 'boletoInternet', 'consAssessoria']);
    const DERIVED_BONIFICATION_DOCUMENTS = new Set(['boletoInternet', 'consAssessoria', 'consEnviada']);
    const EDITABLE_PROFILES = new Set(['controlador', 'assistente']);
    const ACTIVE_CLASSES = ['active-sim', 'active-nao', 'active-naoseaplica'];
    const ANALYSIS_VALUES = ['NÃ£o analisado', 'Correto', 'Correto (Atrasado)'];
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        boletoInternet: 'Boleto de pagamento de Internet',
        consAssessoria: 'Co¶»§q«^