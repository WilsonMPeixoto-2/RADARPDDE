(function installRadarAccessPolicy(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarAccessPolicy = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createRadarAccessPolicy() {
    'use strict';

    const CAPABILITIES = Object.freeze({
        VIEW_TECHNICAL_ANALYSIS: 'viewTechnicalAnalysis',
        VIEW_COMPETENCE_PENDENCIES: 'viewCompetencePendencies',
        OPEN_PENDENCY: 'openPendency',
        REGISTER_CORRECTIVE_SUBMISSION: 'registerCorrectiveSubmission',
        REANALYZE_PENDENCY: 'reanalyzePendency',
        REGISTER_PENDENCY_CONTACT: 'registerPendencyContact',
        CANCEL_PENDENCY: 'cancelPendency',
        REOPEN_PENDENCY: 'reopenPendency',
        VIEW_ALL_ADMINISTRATIVE_LOGS: 'viewAllAdministrativeLogs',
        VIEW_OWN_ADMINISTRATIVE_LOGS: 'viewOwnAdministrativeLogs'
    });

    const PROFILE_ALIASES = Object.freeze({
        controller: 'controlador',
        technical_admin: 'technical_admin',
        federal_assistant: 'assistente',
        'assistente cre': 'assistente',
        'assistente de verbas federais': 'assistente',
        sme_management: 'sme',
        inventory: 'inventario'
    });

    const PROFILE_CAPABILITIES = Object.freeze({
        technical_admin: Object.freeze(Object.values(CAPABILITIES)),
        controlador: Object.freeze([
            CAPABILITIES.VIEW_TECHNICAL_ANALYSIS,
            CAPABILITIES.VIEW_COMPETENCE_PENDENCIES,
            CAPABILITIES.OPEN_PENDENCY,
            CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
            CAPABILITIES.REANALYZE_PENDENCY,
            CAPABILITIES.REGISTER_PENDENCY_CONTACT,
            CAPABILITIES.CANCEL_PENDENCY,
            CAPABILITIES.REOPEN_PENDENCY,
            CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS
        ]),
        assistente: Object.freeze([
            CAPABILITIES.VIEW_TECHNICAL_ANALYSIS,
            CAPABILITIES.VIEW_COMPETENCE_PENDENCIES,
            CAPABILITIES.OPEN_PENDENCY,
            CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
            CAPABILITIES.REANALYZE_PENDENCY,
            CAPABILITIES.REGISTER_PENDENCY_CONTACT,
            CAPABILITIES.CANCEL_PENDENCY,
            CAPABILITIES.REOPEN_PENDENCY,
            CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS
        ]),
        sme: Object.freeze([
            CAPABILITIES.VIEW_OWN_ADMINISTRATIVE_LOGS
        ]),
        inventario: Object.freeze([
            CAPABILITIES.VIEW_TECHNICAL_ANALYSIS,
            CAPABILITIES.VIEW_COMPETENCE_PENDENCIES
        ])
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeProfile(profile) {
        const normalized = text(profile).toLocaleLowerCase('pt-BR');
        return PROFILE_ALIASES[normalized] || normalized;
    }

    function runtimeAuthenticatedRole() {
        try {
            return globalThis?.RadarAuthContext?.authorization?.role || '';
        } catch (_error) {
            return '';
        }
    }

    function resolveEffectiveProfile(visualProfile, authenticatedRole) {
        const role = text(authenticatedRole).toLocaleLowerCase('pt-BR');
        // O administrador técnico mantém o perfil visual simulado. A autoridade real
        // é tratada por hasCapability(), sem contaminar navegação e apresentação.
        if (!role || role === 'technical_admin') return normalizeProfile(visualProfile);
        return PROFILE_ALIASES[role] || normalizeProfile(visualProfile);
    }

    function hasCapability(profile, capability, authenticatedRole) {
        const role = normalizeProfile(authenticatedRole || runtimeAuthenticatedRole());
        if (role === 'technical_admin') return true;
        const normalized = normalizeProfile(profile);
        return (PROFILE_CAPABILITIES[normalized] || []).includes(text(capability));
    }

    function filterAdministrativeLogs(records, profile, authenticatedUserId, authenticatedRole) {
        const source = Array.isArray(records) ? records : [];
        if (hasCapability(profile, CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS, authenticatedRole)) {
            return source.slice();
        }
        if (!hasCapability(profile, CAPABILITIES.VIEW_OWN_ADMINISTRATIVE_LOGS, authenticatedRole)) {
            return [];
        }
        const userId = text(authenticatedUserId);
        if (!userId) return [];
        return source.filter(record => (
            text(record?.actorUserId || record?.actor_user_id) === userId
        ));
    }

    return Object.freeze({
        CAPABILITIES,
        PROFILE_CAPABILITIES,
        normalizeProfile,
        resolveEffectiveProfile,
        hasCapability,
        filterAdministrativeLogs
    });
}));
