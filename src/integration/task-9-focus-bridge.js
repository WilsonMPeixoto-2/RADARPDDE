(function installTask9FocusBridge(root) {
    'use strict';

    let lastRouteSchoolId = '';

    function install() {
        if (typeof root.getPendencyActionFocusScope !== 'function') return false;
        if (!root.RadarTask9PendencyPage
            || typeof root.renderPendencias !== 'function'
            || typeof root.changePendencyFilter !== 'function') return false;
        if (root.getPendencyActionFocusScope.__task9Enhanced) return true;

        const legacyResolver = root.getPendencyActionFocusScope.bind(root);
        const task9RenderPendencias = root.renderPendencias.bind(root);
        const task9ChangePendencyFilter = root.changePendencyFilter.bind(root);
        const task9ClearPendencyFilters = typeof root.clearPendencyFilters === 'function'
            ? root.clearPendencyFilters.bind(root)
            : null;
        const task9RemovePendencyFilter = typeof root.removePendencyFilter === 'function'
            ? root.removePendencyFilter.bind(root)
            : null;

        function resolveTask9FocusScope(sourceContext = {}) {
            if (sourceContext.currentView === 'prontuario') {
                return legacyResolver(sourceContext);
            }

            return ['p-abertas', 'p-aguardando', 'p-resolvidas', 'p-canceladas']
                .map(panelId => document.getElementById(panelId))
                .find(panel => panel && panel.classList.contains('active')) || null;
        }

        function getTask9State() {
            return root.RadarTask9PendencyPage?.getState?.() || null;
        }

        function getActiveCompetenceKey() {
            if (root.RadarCompetenceContext?.isInitialized?.()) {
                return String(root.RadarCompetenceContext.getState()?.activeKey || '').trim();
            }
            try {
                return typeof activeCompetenciaKey !== 'undefined'
                    ? String(activeCompetenciaKey || '').trim()
                    : '';
            } catch (_error) {
                return '';
            }
        }

        function getCurrentRoute() {
            try {
                return root.RadarNavigationHistory?.currentRoute?.(root) || null;
            } catch (_error) {
                return null;
            }
        }

        function getRouteSchoolId() {
            const route = getCurrentRoute();
            if (route?.view === 'pendencias') {
                return String(route.filters?.escola || '').trim();
            }
            try {
                if (root.location?.pathname !== '/pendencias') return '';
                return String(new URLSearchParams(root.location.search || '').get('escola') || '').trim();
            } catch (_error) {
                return '';
            }
        }

        function setFilterIfNeeded(name, value) {
            const state = getTask9State();
            if (!state?.filters || String(state.filters[name] || '') === String(value || '')) {
                return false;
            }
            task9ChangePendencyFilter(name, value || '');
            return true;
        }

        function synchronizeContextBeforeRender() {
            const activeCompetence = getActiveCompetenceKey();
            if (activeCompetence) {
                setFilterIfNeeded('competence', activeCompetence);
            }

            const route = getCurrentRoute();
            const routeSchoolId = getRouteSchoolId();
            if (route?.view === 'pendencias' || root.location?.pathname === '/pendencias') {
                if (routeSchoolId) {
                    setFilterIfNeeded('schoolId', routeSchoolId);
                    lastRouteSchoolId = routeSchoolId;
                } else if (lastRouteSchoolId) {
                    const state = getTask9State();
                    if (String(state?.filters?.schoolId || '') === lastRouteSchoolId) {
                        task9ChangePendencyFilter('schoolId', '');
                    }
                    lastRouteSchoolId = '';
                }
            }
        }

        function schoolLabel(schoolId) {
            let school = null;
            try {
                school = Array.isArray(escolas)
                    ? escolas.find(item => String(item?.id || '') === String(schoolId))
                    : null;
            } catch (_error) {
                school = null;
            }
            if (!school) return schoolId;
            const name = school.denominação || school.denominacao || school.name || schoolId;
            const designation = school.designação || school.designacao || '';
            return designation ? `${name} (${designation})` : String(name);
        }

        function clearSchoolRouteContext() {
            lastRouteSchoolId = '';
            task9ChangePendencyFilter('schoolId', '');
            const route = getCurrentRoute();
            if (route?.view === 'pendencias' && route.filters?.escola
                && root.RadarNavigationHistory?.navigate) {
                root.RadarNavigationHistory.navigate(root, { view: 'pendencias' });
                return true;
            }
            try {
                if (root.location?.pathname === '/pendencias' && root.location?.search) {
                    root.history?.replaceState?.(root.history.state, '', '/pendencias');
                }
            } catch (_error) {
                // A limpeza visual continua válida mesmo sem History API.
            }
            ensureSchoolFilterBanner();
            return true;
        }

        function ensureSchoolFilterBanner() {
            const container = document.getElementById('main-container');
            if (!container) return false;
            const existing = container.querySelector('[data-radar-pendency-school-filter="true"]');
            const header = container.querySelector('.pendency-page-header');
            const schoolId = String(getTask9State()?.filters?.schoolId || '').trim();

            if (!header || !schoolId) {
                existing?.remove();
                return false;
            }
            if (existing?.dataset?.schoolId === schoolId) return true;
            existing?.remove();

            const banner = document.createElement('section');
            banner.className = 'panel-card pendency-context-filter-banner';
            banner.dataset.radarPendencySchoolFilter = 'true';
            banner.dataset.schoolId = schoolId;
            banner.setAttribute('aria-label', 'Filtro ativo por unidade escolar');

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '16px';
            row.style.flexWrap = 'wrap';

            const text = document.createElement('p');
            text.style.margin = '0';
            const strong = document.createElement('strong');
            strong.textContent = 'Filtro por unidade: ';
            text.append(strong, document.createTextNode(schoolLabel(schoolId)));

            const clear = document.createElement('button');
            clear.type = 'button';
            clear.className = 'btn btn-secondary btn-sm';
            clear.textContent = 'Limpar filtro de unidade';
            clear.addEventListener('click', clearSchoolRouteContext);

            row.append(text, clear);
            banner.appendChild(row);
            header.insertAdjacentElement('afterend', banner);
            return true;
        }

        function renderPendenciasContextStable(options) {
            synchronizeContextBeforeRender();
            const result = task9RenderPendencias(options);
            ensureSchoolFilterBanner();
            return result;
        }

        function changePendencyFilterContextStable(name, value) {
            const activeCompetence = getActiveCompetenceKey();
            const effectiveValue = name === 'competence' && activeCompetence
                ? activeCompetence
                : value;
            const result = task9ChangePendencyFilter(name, effectiveValue);
            ensureSchoolFilterBanner();
            return result;
        }

        function clearPendencyFiltersContextStable() {
            if (!task9ClearPendencyFilters) return false;
            const result = task9ClearPendencyFilters();
            const activeCompetence = getActiveCompetenceKey();
            if (activeCompetence) setFilterIfNeeded('competence', activeCompetence);
            lastRouteSchoolId = '';
            try {
                if (root.location?.pathname === '/pendencias' && root.location?.search) {
                    root.history?.replaceState?.(root.history.state, '', '/pendencias');
                }
            } catch (_error) {
                // Sem efeito sobre a limpeza dos filtros.
            }
            ensureSchoolFilterBanner();
            return result;
        }

        function removePendencyFilterContextStable(name) {
            if (!task9RemovePendencyFilter) return false;
            if (name === 'competence') {
                const activeCompetence = getActiveCompetenceKey();
                if (activeCompetence) {
                    const result = task9ChangePendencyFilter('competence', activeCompetence);
                    ensureSchoolFilterBanner();
                    return result;
                }
            }
            const result = task9RemovePendencyFilter(name);
            if (name === 'schoolId') lastRouteSchoolId = '';
            ensureSchoolFilterBanner();
            return result;
        }

        resolveTask9FocusScope.__task9Enhanced = true;
        renderPendenciasContextStable.__task9ContextStable = true;
        root.getPendencyActionFocusScope = resolveTask9FocusScope;
        root.renderPendencias = renderPendenciasContextStable;
        root.changePendencyFilter = changePendencyFilterContextStable;
        if (task9ClearPendencyFilters) root.clearPendencyFilters = clearPendencyFiltersContextStable;
        if (task9RemovePendencyFilter) root.removePendencyFilter = removePendencyFilterContextStable;
        root.RadarTask9FocusBridge = Object.freeze({
            VERSION: '1.1.0',
            ensureSchoolFilterBanner,
            synchronizeContextBeforeRender
        });
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 10);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
