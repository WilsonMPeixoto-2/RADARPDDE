(function installRadarOperationalReadinessBridge(root) {
    'use strict';

    if (!root?.document || root.RadarOperationalReadinessBridge) return;

    let installed = false;
    let originalSwitchView = null;
    let originalClearPendencyFilters = null;
    let originalOpenPendencyDetail = null;
    let originalOpenPendencyInProntuario = null;
    let originalGetEscolaOperationalData = null;
    let originalInventariarBem = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function currentCompetence() {
        if (!root.RadarCompetenceContext?.isInitialized?.()) return '';
        return text(root.RadarCompetenceContext.getState()?.activeKey);
    }

    function pendencyCompetence(pendency) {
        return text(
            pendency?.competenciaOrigem
            || pendency?.competencia
            || pendency?.competence_origin
            || pendency?.competence_id
        );
    }

    function activePendency(pendency) {
        if (root.RadarPendencias?.isActivePendency) {
            return root.RadarPendencias.isActivePendency(pendency);
        }
        return ['Aberta', 'Aguardando reanálise'].includes(text(pendency?.status));
    }

    function resolvePendencyId(source) {
        if (typeof source === 'string') {
            const direct = source.trim();
            try {
                const records = typeof pendencias !== 'undefined' && Array.isArray(pendencias) ? pendencias : [];
                if (records.some(item => text(item?.id) === direct)) return direct;
            } catch (_error) {
                // Continua para o resolvedor canônico.
            }
        }
        try {
            return text(root.resolvePendencyIdReference?.(source));
        } catch (_error) {
            return '';
        }
    }

    function findPendency(source) {
        const id = resolvePendencyId(source);
        if (!id) return null;
        try {
            const records = typeof pendencias !== 'undefined' && Array.isArray(pendencias) ? pendencias : [];
            return records.find(item => text(item?.id) === id) || null;
        } catch (_error) {
            return null;
        }
    }

    function selectCompetence(competence, source) {
        const key = text(competence);
        if (!key || !root.RadarCompetenceContext?.isInitialized?.()) return false;
        if (currentCompetence() === key) return true;
        try {
            root.RadarCompetenceContext.select(key, { source: source || 'operational-context' });
            return true;
        } catch (_error) {
            return false;
        }
    }

    function syncPendencyFilterToGlobal() {
        if (typeof root.changePendencyFilter !== 'function') return false;
        const key = currentCompetence();
        if (!key) return false;
        const state = root.RadarTask9PendencyPage?.getState?.();
        if (text(state?.filters?.competence) === key) return true;
        root.changePendencyFilter('competence', key);
        return true;
    }

    function wrapNavigation() {
        if (typeof root.switchView !== 'function') return false;
        originalSwitchView = root.switchView.bind(root);
        root.switchView = function switchViewWithOperationalContext(view, ...args) {
            const result = originalSwitchView(view, ...args);
            if (view === 'pendencias') syncPendencyFilterToGlobal();
            return result;
        };

        if (typeof root.clearPendencyFilters === 'function') {
            originalClearPendencyFilters = root.clearPendencyFilters.bind(root);
            root.clearPendencyFilters = function clearPendencyFiltersWithCompetence() {
                const result = originalClearPendencyFilters();
                syncPendencyFilterToGlobal();
                return result;
            };
        }

        if (typeof root.openPendencyDetail === 'function') {
            originalOpenPendencyDetail = root.openPendencyDetail.bind(root);
            root.openPendencyDetail = function openPendencyDetailWithContext(source) {
                const pendency = findPendency(source);
                const competence = pendencyCompetence(pendency);
                if (competence) selectCompetence(competence, 'pendency-detail');
                if (typeof currentView !== 'undefined' && currentView !== 'pendencias') {
                    root.switchView('pendencias');
                } else if (competence && typeof root.changePendencyFilter === 'function') {
                    root.changePendencyFilter('competence', competence);
                }
                return originalOpenPendencyDetail(resolvePendencyId(source) || source);
            };
        }

        if (typeof root.openPendencyInProntuario === 'function') {
            originalOpenPendencyInProntuario = root.openPendencyInProntuario.bind(root);
            root.openPendencyInProntuario = function openPendencyInProntuarioWithContext(source) {
                const pendency = findPendency(source);
                const competence = pendencyCompetence(pendency);
                if (competence) selectCompetence(competence, 'pendency-prontuario');
                return originalOpenPendencyInProntuario(source);
            };
        }

        root.addEventListener('radar:competence-change', event => {
            const key = text(event?.detail?.activeKey);
            if (!key || typeof currentView === 'undefined' || currentView !== 'pendencias') return;
            const state = root.RadarTask9PendencyPage?.getState?.();
            if (text(state?.filters?.competence) !== key) {
                root.changePendencyFilter?.('competence', key);
            }
        });
        return true;
    }

    function wrapSchoolOperationalProjection() {
        if (typeof root.getEscolaOperationalData !== 'function') return false;
        originalGetEscolaOperationalData = root.getEscolaOperationalData.bind(root);
        root.getEscolaOperationalData = function getMonthlyEscolaOperationalData(school, competenceKey) {
            const base = originalGetEscolaOperationalData(school, competenceKey) || {};
            const key = text(competenceKey);
            if (!key) return base;
            const monthlyPendencies = (Array.isArray(base.pendenciasAbertas) ? base.pendenciasAbertas : [])
                .filter(pendency => activePendency(pendency) && pendencyCompetence(pendency) === key);
            const nextActors = [...new Set(monthlyPendencies.map(pendency => (
                text(pendency?.responsavel)
                || text(root.RadarPendencias?.getNextActor?.(pendency))
                || 'Não definido'
            )))];
            return {
                ...base,
                pendenciasAbertas: monthlyPendencies,
                hasPendencias: monthlyPendencies.length > 0,
                proximaAcao: monthlyPendencies.length === 0
                    ? 'Sem pendência ativa na competência'
                    : nextActors.join(' / ')
            };
        };
        return true;
    }

    function wrapInventoryDefault() {
        if (typeof root.inventariarBem !== 'function') return false;
        originalInventariarBem = root.inventariarBem.bind(root);
        root.inventariarBem = function inventariarBemWithActiveDefault(...args) {
            const result = originalInventariarBem(...args);
            const select = root.document.getElementById('inventario-responsavel');
            if (select && !select.value && select.options.length > 0) {
                select.value = select.options[0].value;
            }
            return result;
        };
        return true;
    }

    function dependenciesReady() {
        return Boolean(
            root.RadarCompetenceContext?.isInitialized?.()
            && root.RadarTask9PendencyPage
            && typeof root.switchView === 'function'
            && typeof root.changePendencyFilter === 'function'
            && typeof root.getEscolaOperationalData === 'function'
            && typeof root.inventariarBem === 'function'
        );
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        wrapNavigation();
        wrapSchoolOperationalProjection();
        wrapInventoryDefault();
        if (typeof currentView !== 'undefined' && currentView === 'pendencias') {
            syncPendencyFilterToGlobal();
        }
        root.RadarOperationalReadinessBridge = Object.freeze({
            VERSION: '1.0.0',
            currentCompetence,
            pendencyCompetence,
            syncPendencyFilterToGlobal
        });
        installed = true;
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(typeof window !== 'undefined' ? window : globalThis));
