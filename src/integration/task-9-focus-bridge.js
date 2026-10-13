(function installTask9FocusBridge(root) {
    'use strict';

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

        function navigateSchoolFilter(schoolId) {
            if (typeof root.RadarNavigationHistory?.navigate !== 'function') return false;
            return root.RadarNavigationHistory.navigate(root, {
                view: 'pendencias',
                filters: schoolId ? { escola: String(schoolId) } : {}
            }) !== false;
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
            if (navigateSchoolFilter('')) return true;
            const result = task9ChangePendencyFilter('schoolId', '');
            ensureSchoolFilterBanner();
            return result;
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
            // Navigation bootstrap has already applied the authorized target filter.
            // Reading the previously committed route here would undo it on popstate.
            const result = task9RenderPendencias(options);
            ensureSchoolFilterBanner();
            return result;
        }

        function changePendencyFilterContextStable(name, value) {
            if (name === 'schoolId' && navigateSchoolFilter(value)) return true;
            const result = task9ChangePendencyFilter(name, value);
            ensureSchoolFilterBanner();
            return result;
        }

        function clearPendencyFiltersContextStable() {
            if (!task9ClearPendencyFilters) return false;
            // Clear local filters without an intermediate render; navigation owns school.
            const result = task9ClearPendencyFilters({ render: false });
            if (!navigateSchoolFilter('')) task9RenderPendencias();
            ensureSchoolFilterBanner();
            return result;
        }

        function removePendencyFilterContextStable(name) {
            if (name === 'schoolId' && navigateSchoolFilter('')) return true;
            if (!task9RemovePendencyFilter) return false;
            const result = task9RemovePendencyFilter(name);
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
            VERSION: '1.3.0',
            ensureSchoolFilterBanner
        });
        return true;
    }

    function installWhenReady() {
        if (!install()) return false;
        root.removeEventListener?.('radar:application-services-ready', installWhenReady);
        root.removeEventListener?.('radar:pendency-page-ready', installWhenReady);
        document.removeEventListener?.('DOMContentLoaded', installWhenReady);
        return true;
    }

    // Dynamic extensions may arrive before the deferred app, including while
    // readyState is interactive. Installation follows readiness, not a deadline.
    if (!installWhenReady()) {
        root.addEventListener?.('radar:application-services-ready', installWhenReady);
        root.addEventListener?.('radar:pendency-page-ready', installWhenReady);
        if (document.readyState !== 'complete') {
            document.addEventListener('DOMContentLoaded', installWhenReady, { once: true });
        }
    }
}(window));
