(function installRadarNavigationBootstrap(root, factory) {
    'use strict';

    let routesApi = root?.RadarNavigationRoutes || null;
    let policyApi = root?.RadarNavigationPolicy || null;
    if (typeof module !== 'undefined' && module.exports) {
        routesApi = routesApi || require('./navigation-routes.js');
        policyApi = policyApi || require('./navigation-policy.js');
    }

    const api = factory(routesApi, policyApi);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarNavigationBootstrap = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationBootstrapApi(routesApi, policyApi) {
    'use strict';

    function filterPendenciesBySchool(collection, schoolId) {
        if (!schoolId) return collection;
        return (collection || []).filter(item => String(item?.escolaId || '') === String(schoolId));
    }

    function buildSchoolHref(schoolId, section = null) {
        if (!routesApi) return '/dashboard';
        return routesApi.buildRoute({
            view: 'prontuario',
            param: schoolId,
            section: section === 'pendencias' ? 'pendencias' : null
        });
    }

    function extractSchoolIdFromOnclick(value) {
        const match = String(value || '').match(
            /switchView\(\s*['"]prontuario['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
        );
        return match ? match[1] : null;
    }

    function shouldHandleInternalClick(event) {
        return Boolean(
            event
            && !event.defaultPrevented
            && Number(event.button || 0) === 0
            && !event.metaKey
            && !event.ctrlKey
            && !event.shiftKey
            && !event.altKey
        );
    }

    function routeForProntuarioTab(schoolId, tabId) {
        return {
            view: 'prontuario',
            param: String(schoolId || ''),
            section: tabId === 'tab-pendencias' ? 'pendencias' : null
        };
    }

    function copyButtonToAnchor(document, button, schoolId) {
        const anchor = document.createElement('a');
        Array.from(button.attributes || []).forEach(attribute => {
            if (['onclick', 'type'].includes(attribute.name)) return;
            anchor.setAttribute(attribute.name, attribute.value);
        });
        anchor.href = buildSchoolHref(schoolId);
        anchor.dataset.radarRoute = 'true';
        while (button.firstChild) anchor.appendChild(button.firstChild);
        button.replaceWith(anchor);
        return anchor;
    }

    function decorateSchoolLinks(document) {
        if (!document?.querySelectorAll) return 0;
        let converted = 0;
        document.querySelectorAll('button[onclick]').forEach(button => {
            const schoolId = extractSchoolIdFromOnclick(button.getAttribute('onclick'));
            if (!schoolId) return;
            copyButtonToAnchor(document, button, schoolId);
            converted += 1;
        });
        return converted;
    }

    function install(root) {
        if (!root || root.__radarNavigationBootstrapInstalled) return false;
        if (!root.document || !routesApi || !policyApi || typeof root.switchView !== 'function') {
            return false;
        }

        const document = root.document;
        const originalSwitchView = root.switchView.bind(root);
        const originalRenderPendencias = typeof root.renderPendencias === 'function'
            ? root.renderPendencias.bind(root)
            : null;
        const originalRenderProntuario = typeof root.renderProntuario === 'function'
            ? root.renderProntuario.bind(root)
            : null;
        const originalActivateProntuarioTab = typeof root.activateProntuarioTab === 'function'
            ? root.activateProntuarioTab.bind(root)
            : null;
        const simpleRenderNames = ['renderEscolas', 'renderCompetencias'];
        let activePendencySchoolFilter = null;
        let navigationApplying = false;

        function getProfile() {
            try {
                if (typeof root.getRadarAccessProfile === 'function') {
                    return root.getRadarAccessProfile();
                }
                return typeof currentProfile !== 'undefined' ? currentProfile : 'controlador';
            } catch (_error) {
                return 'controlador';
            }
        }

        function getSchools() {
            try {
                return typeof escolas !== 'undefined' && Array.isArray(escolas) ? escolas : [];
            } catch (_error) {
                return [];
            }
        }

        function getPendencies() {
            try {
                return typeof pendencias !== 'undefined' && Array.isArray(pendencias) ? pendencias : [];
            } catch (_error) {
                return [];
            }
        }

        function setPendencies(value) {
            try {
                pendencias = value;
                return true;
            } catch (_error) {
                return false;
            }
        }

        function currentSchoolId() {
            try {
                return typeof activeSchoolId !== 'undefined' ? activeSchoolId : null;
            } catch (_error) {
                return null;
            }
        }

        function currentViewName() {
            try {
                return typeof currentView !== 'undefined' ? currentView : null;
            } catch (_error) {
                return null;
            }
        }

        function renderPendencyFilterBanner() {
            if (!activePendencySchoolFilter) return;
            const container = document.getElementById('main-container');
            if (!container || container.querySelector('[data-radar-pendency-school-filter]')) return;
            const school = getSchools().find(item => item.id === activePendencySchoolFilter);
            const banner = document.createElement('section');
            banner.className = 'panel-card';
            banner.dataset.radarPendencySchoolFilter = 'true';
            banner.style.marginBottom = '18px';

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
            text.append(strong, document.createTextNode(
                school
                    ? `${school.denominação || school.denominacao || school.id} (${school.designação || school.designacao || school.id})`
                    : activePendencySchoolFilter
            ));

            const clearLink = document.createElement('a');
            clearLink.className = 'btn btn-secondary btn-sm';
            clearLink.href = '/pendencias';
            clearLink.dataset.radarRoute = 'true';
            clearLink.textContent = 'Limpar filtro';

            row.append(text, clearLink);
            banner.appendChild(row);
            container.prepend(banner);
        }

        function addProntuarioPendencyLink(schoolId) {
            const panel = document.getElementById('tab-pendencias');
            if (!panel || panel.querySelector('[data-radar-school-pendencies-link]')) return;
            const actionBar = document.createElement('div');
            actionBar.style.display = 'flex';
            actionBar.style.justifyContent = 'flex-end';
            actionBar.style.marginBottom = '14px';

            const link = document.createElement('a');
            link.className = 'btn btn-secondary btn-sm';
            link.href = `/pendencias?${new URLSearchParams({ escola: schoolId }).toString()}`;
            link.dataset.radarRoute = 'true';
            link.dataset.radarSchoolPendenciesLink = 'true';
            link.textContent = 'Ver todas as pendências desta escola';

            actionBar.appendChild(link);
            panel.prepend(actionBar);
        }

        function applyAuthorizedNavigationRoute(route) {
            const resolved = policyApi.resolveAuthorizedRoute(route, {
                profile: getProfile(),
                schools: getSchools()
            });
            navigationApplying = true;
            try {
                activePendencySchoolFilter = resolved.view === 'pendencias'
                    ? (resolved.filters?.escola || null)
                    : null;
                originalSwitchView(resolved.view, resolved.param);
                if (resolved.view === 'prontuario' && resolved.section === 'pendencias') {
                    originalActivateProntuarioTab?.('tab-pendencias');
                }
                decorateSchoolLinks(document);
                return resolved;
            } finally {
                navigationApplying = false;
            }
        }

        root.applyAuthorizedNavigationRoute = applyAuthorizedNavigationRoute;

        root.switchView = function navigationAwareSwitchView(view, param = null) {
            if (!navigationApplying) {
                activePendencySchoolFilter = null;
            }
            const result = originalSwitchView(view, param);
            decorateSchoolLinks(document);
            return result;
        };

        if (originalRenderPendencias) {
            root.renderPendencias = function renderFilteredPendencias() {
                const fullCollection = getPendencies();
                const filteredCollection = filterPendenciesBySchool(
                    fullCollection,
                    activePendencySchoolFilter
                );
                const replaced = filteredCollection !== fullCollection && setPendencies(filteredCollection);
                try {
                    return originalRenderPendencias();
                } finally {
                    if (replaced) setPendencies(fullCollection);
                    renderPendencyFilterBanner();
                    decorateSchoolLinks(document);
                }
            };
            try { renderPendencias = root.renderPendencias; } catch (_error) { /* browser global fallback */ }
        }

        if (originalRenderProntuario) {
            root.renderProntuario = function renderRoutedProntuario(schoolId) {
                const result = originalRenderProntuario(schoolId);
                addProntuarioPendencyLink(schoolId);
                decorateSchoolLinks(document);
                return result;
            };
            try { renderProntuario = root.renderProntuario; } catch (_error) { /* browser global fallback */ }
        }

        simpleRenderNames.forEach(name => {
            const original = typeof root[name] === 'function' ? root[name].bind(root) : null;
            if (!original) return;
            root[name] = function renderWithCanonicalLinks(...args) {
                const result = original(...args);
                decorateSchoolLinks(document);
                return result;
            };
            try {
                if (name === 'renderEscolas') renderEscolas = root[name];
                if (name === 'renderCompetencias') renderCompetencias = root[name];
            } catch (_error) {
                // O vínculo global já pode ter sido atualizado pela propriedade de window.
            }
        });

        if (originalActivateProntuarioTab) {
            root.activateProntuarioTab = function activateRoutedProntuarioTab(tabId) {
                const activated = originalActivateProntuarioTab(tabId);
                if (!activated || navigationApplying || currentViewName() !== 'prontuario') {
                    return activated;
                }
                const schoolId = currentSchoolId();
                if (!schoolId || !root.RadarNavigationHistory) return activated;
                root.RadarNavigationHistory.navigate(
                    root,
                    routeForProntuarioTab(schoolId, tabId),
                    { apply: false }
                );
                return activated;
            };
            try { activateProntuarioTab = root.activateProntuarioTab; } catch (_error) { /* browser global fallback */ }
        }

        document.addEventListener('click', event => {
            const anchor = event.target?.closest?.('a[data-radar-route="true"]');
            if (!anchor || !shouldHandleInternalClick(event)) return;
            if (anchor.target && anchor.target !== '_self') return;
            const url = new URL(anchor.href, root.location?.href || undefined);
            if (url.origin !== root.location?.origin) return;
            const route = routesApi.parseRoute(url.pathname, url.search);
            if (!route.valid || !root.RadarNavigationHistory) return;
            event.preventDefault();
            root.RadarNavigationHistory.navigate(root, route);
        });

        root.__radarNavigationBootstrapInstalled = true;
        decorateSchoolLinks(document);
        return true;
    }

    return Object.freeze({
        filterPendenciesBySchool,
        buildSchoolHref,
        extractSchoolIdFromOnclick,
        shouldHandleInternalClick,
        routeForProntuarioTab,
        decorateSchoolLinks,
        install
    });
}));
