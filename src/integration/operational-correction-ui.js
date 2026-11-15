/* global RadarApplicationServices, RadarOperationalCorrectionService */
(function installRadarOperationalCorrectionUi(root) {
    'use strict';

    if (!root || root.RadarOperationalCorrectionUi) return;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function buildConfirmationSummary(plan) {
        if (!plan || typeof plan !== 'object') return '';
        const counts = plan.counts || {};
        const parts = [];
        if (counts.registeredInvoices > 0) {
            parts.push(`${counts.registeredInvoices} Nota(s) Fiscal(is)`);
        }
        if (counts.pendencies > 0) {
            parts.push(`${counts.pendencies} Pendência(s)`);
        }
        if (counts.pendencyAttempts > 0) {
            parts.push(`${counts.pendencyAttempts} tentativa(s)/envio(s)`);
        }
        if (counts.pendencyContacts > 0) {
            parts.push(`${counts.pendencyContacts} contato(s) vinculado(s)`);
        }
        if (counts.assets > 0) {
            parts.push(`${counts.assets} bem(ns) patrimonial(is) exclusivo(s)`);
        }
        if (counts.reopenedMovements > 0) {
            parts.push(`${counts.reopenedMovements} saída(s) provisória(s) reaberta(s) no PDDE Qualidade`);
        }
        return parts.length > 0
            ? `Alcance confirmado: ${parts.join(', ')}.`
            : 'Nenhum dependente adicional será afetado.';
    }

    function ensureServiceInstalled() {
        const factory = root.RadarOperationalCorrectionService?.createOperationalCorrectionService;
        if (typeof factory !== 'function') return null;

        const existing = root.RadarApplicationServices?.operationalCorrection;
        if (existing) return existing;

        const service = factory({
            getState() {
                return {
                    verifications: root.verificacoes || {},
                    registeredInvoices: Array.isArray(root.notasRegistradas) ? root.notasRegistradas : [],
                    pendencies: Array.isArray(root.pendencias) ? root.pendencias : [],
                    pendencyAttempts: [],
                    pendencyContacts: [],
                    assets: Array.isArray(root.bens) ? root.bens : [],
                    qualityProvisionalMovements: []
                };
            }
        });

        if (root.RadarApplicationServices && typeof root.RadarApplicationServices === 'object') {
            try {
                root.RadarApplicationServices.operationalCorrection = service;
            } catch (_error) {
                // Objeto congelado em alguns ambientes de teste; mantemos a referência em RadarOperationalCorrectionUi.
            }
        }
        return service;
    }

    const api = Object.freeze({
        ensureServiceInstalled,
        buildConfirmationSummary,
        normalizeOptionalNote(note) {
            return text(note) || null;
        }
    });

    root.RadarOperationalCorrectionUi = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    ensureServiceInstalled();
}(typeof window !== 'undefined' ? window : globalThis));
