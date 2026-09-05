(function installRadarExcelExportAudit(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarExcelExportAudit = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createExcelExportAuditApi() {
    'use strict';

    const EXPORT_ACTIONS = new Set([
        'Relatório Excel Exportado',
        'Relatório Excel SME Exportado'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function isMonthlyCompetence(value) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(text(value));
    }

    function resolveAuditService(root) {
        try {
            if (typeof radarAuditService !== 'undefined' && radarAuditService) return radarAuditService;
        } catch (_error) {
            // Global lexical ainda indisponível.
        }
        return root?.radarAuditService || null;
    }

    function resolveCanonicalCompetence(root, fallback = '') {
        try {
            const key = root?.RadarCompetenceContext?.isInitialized?.()
                ? root.RadarCompetenceContext.getState()?.activeKey
                : null;
            if (isMonthlyCompetence(key)) return text(key);
        } catch (_error) {
            // Mantém fallback do estado do navegador.
        }
        return isMonthlyCompetence(fallback) ? text(fallback) : '';
    }

    function resolveState(root) {
        const value = name => {
            try {
                if (name === 'escolas' && typeof escolas !== 'undefined') return escolas;
                if (name === 'COMPETENCIAS' && typeof COMPETENCIAS !== 'undefined') return COMPETENCIAS;
                if (name === 'programas' && typeof programas !== 'undefined') return programas;
                if (name === 'verificacoes' && typeof verificacoes !== 'undefined') return verificacoes;
                if (name === 'pendencias' && typeof pendencias !== 'undefined') return pendencias;
                if (name === 'activeCompetenciaKey' && typeof activeCompetenciaKey !== 'undefined') return activeCompetenciaKey;
            } catch (_error) {
                return undefined;
            }
            return root?.[name];
        };
        const activeKey = resolveCanonicalCompetence(root, value('activeCompetenciaKey'));
        return {
            escolas: Array.isArray(value('escolas')) ? value('escolas') : [],
            competencias: Array.isArray(value('COMPETENCIAS')) ? value('COMPETENCIAS') : [],
            programas: Array.isArray(value('programas')) ? value('programas') : [],
            verificacoes: value('verificacoes') || {},
            pendencias: Array.isArray(value('pendencias')) ? value('pendencias') : [],
            activeCompetenciaKey: activeKey || 'TODAS'
        };
    }

    function scopeStateToActiveCompetence(root, state) {
        const activeKey = resolveCanonicalCompetence(root, state?.activeCompetenciaKey);
        if (!activeKey) {
            const error = new Error('Selecione uma competência mensal antes de gerar o relatório Excel.');
            error.code = 'EXPORT_INVALID_COMPETENCE';
            throw error;
        }
        const competencias = Array.isArray(state?.competencias)
            ? state.competencias.filter(item => text(item?.key) === activeKey)
            : [];
        if (!competencias.length) {
            const error = new Error(`A competência ${activeKey} não está disponível para exportação.`);
            error.code = 'EXPORT_COMPETENCE_NOT_FOUND';
            throw error;
        }
        return Object.freeze({
            ...state,
            competencias,
            activeCompetenciaKey: activeKey
        });
    }

    function notify(root, message) {
        if (typeof root?.alert === 'function') root.alert(message);
    }

    async function record(root, action, details) {
        const service = resolveAuditService(root);
        if (!service || typeof service.record !== 'function') {
            const error = new Error('Serviço de auditoria indisponível. A exportação foi bloqueada.');
            error.code = 'EXPORT_AUDIT_UNAVAILABLE';
            throw error;
        }
        const result = await service.record({ action, details });
        if (result?.ok === false) {
            const error = result.error || new Error('O histórico da exportação não foi confirmado.');
            error.code = error.code || 'EXPORT_AUDIT_FAILED';
            throw error;
        }
        return result;
    }

    function auditDetails(kind, phase, state) {
        const scope = `competência ${state.activeCompetenciaKey}`;
        return phase === 'started'
            ? `Exportação ${kind === 'sme' ? 'Excel SME' : 'Excel institucional'} iniciada para ${scope}.`
            : `Exportação ${kind === 'sme' ? 'Excel SME' : 'Excel institucional'} concluída para ${scope}.`;
    }

    function installLegacyFilter(root, controller) {
        if (root.__radarExcelLegacyAuditFilterInstalled === true) return true;
        if (typeof root.registerLog !== 'function') return false;
        const original = root.registerLog.bind(root);
        root.registerLog = function filteredRegisterLog(action, ...args) {
            if (controller.depth > 0 && EXPORT_ACTIONS.has(text(action))) return null;
            return original(action, ...args);
        };
        try { registerLog = root.registerLog; } catch (_error) { /* global lexical fallback */ }
        root.__radarExcelLegacyAuditFilterInstalled = true;
        return true;
    }

    function createAuditedExport(root, kind, controller) {
        return async function auditedExcelExport(options = {}) {
            const integration = root.RadarExcelExportIntegration;
            const action = kind === 'sme'
                ? 'Relatório Excel SME Exportado'
                : 'Relatório Excel Exportado';
            let state = options.state || resolveState(root);
            try {
                state = scopeStateToActiveCompetence(root, state);
            } catch (error) {
                notify(root, error.message || 'Não foi possível determinar a competência da exportação.');
                return { ok: false, error };
            }

            try {
                await record(root, 'Exportação Excel Iniciada', auditDetails(kind, 'started', state));
            } catch (error) {
                notify(root, error.message || 'Não foi possível registrar o início da exportação.');
                return { ok: false, auditFailed: true, error };
            }

            controller.depth += 1;
            let result;
            try {
                const scopedOptions = {
                    ...options,
                    state,
                    temporalScope: `Competência ${state.activeCompetenciaKey}`
                };
                result = kind === 'sme'
                    ? await integration.exportSmeXlsx(scopedOptions)
                    : await Promise.resolve(integration.exportXlsx(scopedOptions));
            } finally {
                controller.depth = Math.max(0, controller.depth - 1);
            }

            if (!result?.ok) return result;

            try {
                await record(root, action, auditDetails(kind, 'completed', state));
                return { ...result, auditConfirmed: true };
            } catch (error) {
                notify(
                    root,
                    'O arquivo foi gerado, mas a confirmação final no histórico falhou. Atualize a tela e comunique o suporte.'
                );
                return {
                    ...result,
                    ok: false,
                    exportCompleted: true,
                    auditFailed: true,
                    error
                };
            }
        };
    }

    function install(root) {
        if (!root?.RadarExcelExportIntegration) return false;
        if (root.__radarExcelExportAuditInstalled === true) return true;
        const controller = { depth: 0 };
        installLegacyFilter(root, controller);

        const institutional = createAuditedExport(root, 'institutional', controller);
        const sme = createAuditedExport(root, 'sme', controller);
        root.exportDataExcel = institutional;
        root.exportDataExcelSme = sme;
        try { exportDataExcel = institutional; } catch (_error) { /* global lexical fallback */ }
        try { exportDataExcelSme = sme; } catch (_error) { /* global lexical fallback */ }

        root.document?.addEventListener?.('click', event => {
            const button = event.target?.closest?.('[data-radar-assistant-export], [data-radar-sme-export="true"]');
            if (!button) return;
            const kind = button.dataset?.radarAssistantExport
                || (button.dataset?.radarSmeExport === 'true' ? 'sme' : '');
            if (!['institutional', 'sme'].includes(kind)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const operation = kind === 'sme' ? sme() : institutional();
            Promise.resolve(operation).catch(error => {
                console.error('[RADAR PDDE] Falha não tratada na exportação auditada.', error);
            });
        }, true);

        root.__radarExcelExportAuditInstalled = true;
        return true;
    }

    return Object.freeze({
        EXPORT_ACTIONS,
        createAuditedExport,
        install,
        record,
        resolveCanonicalCompetence,
        resolveState,
        scopeStateToActiveCompetence
    });
}));