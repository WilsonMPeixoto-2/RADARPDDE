(function installRadarGlobalSearch(root, factory) {
    'use strict';

    let indexApi = root?.RadarGlobalSearchIndex || null;
    if (!indexApi && typeof module !== 'undefined' && module.exports) {
        indexApi = require('../domain/global-search-index.js');
    }

    const api = factory(indexApi);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarGlobalSearch = Object.freeze(api);
        if (root.document) {
            const install = () => api.install(root);
            if (!install() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', install, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createGlobalSearchApi(indexApi) {
    'use strict';

    const RESULT_LIMIT = 8;
    const FUSE_VENDOR_URL = 'vendor/fuse.js';

    function shouldOpenForQuery(query) {
        return String(query || '').trim().length >= 2;
    }

    function keyActionFor(key, activeIndex, resultCount, modifiers = {}) {
        if (modifiers.ctrlKey || modifiers.metaKey || modifiers.altKey) return null;
        const count = Number.isInteger(resultCount) && resultCount > 0 ? resultCount : 0;
        if (key === 'Escape') return { type: 'close', index: -1 };
        if (key === 'ArrowDown' && count > 0) {
            return { type: 'move', index: (activeIndex + 1 + count) % count };
        }
        if (key === 'ArrowUp' && count > 0) {
            return { type: 'move', index: (activeIndex - 1 + count) % count };
        }
        if (key === 'Enter' && activeIndex >= 0 && activeIndex < count) {
            return { type: 'activate', index: activeIndex };
        }
        return null;
    }

    function destinationForResult(result) {
        if (!result || result.mutation === true || result.type === 'action') return null;
        const route = result.route;
        if (!route || !route.view) return null;
        return {
            view: String(route.view),
            param: route.param === undefined || route.param === null || route.param === ''
                ? null
                : String(route.param),
            filters: route.filters && typeof route.filters === 'object'
                ? { ...route.filters }
                : {}
        };
    }

    function loadScriptOnce(root, source, globalName) {
        if (!root || !root.document) {
            return Promise.reject(new Error(`Documento indisponível para carregar ${source}.`));
        }
        if (root[globalName]) return Promise.resolve(root[globalName]);

        const registry = root.__radarLazyScriptPromises
            || (root.__radarLazyScriptPromises = Object.create(null));
        if (registry[source]) return registry[source];

        registry[source] = new Promise((resolve, reject) => {
            const document = root.document;
            const selector = `script[data-radar-lazy-source="${source}"]`;
            let script = document.querySelector?.(selector);

            const finish = () => {
                if (root[globalName]) {
                    resolve(root[globalName]);
                } else {
                    delete registry[source];
                    reject(new Error(`${source} carregado sem expor ${globalName}.`));
                }
            };
            const fail = () => {
                delete registry[source];
                reject(new Error(`Não foi possível carregar ${source}.`));
            };

            if (script) {
                script.addEventListener('load', finish, { once: true });
                script.addEventListener('error', fail, { once: true });
                return;
            }

            script = document.createElement('script');
            script.src = source;
            script.async = true;
            script.dataset.radarLazySource = source;
            script.addEventListener('load', finish, { once: true });
            script.addEventListener('error', fail, { once: true });
            (document.head || document.documentElement).appendChild(script);
        });

        return registry[source];
    }

    function readGlobalCollection(name) {
        try {
            if (name === 'schools') {
                return typeof escolas !== 'undefined' && Array.isArray(escolas) ? escolas : [];
            }
            if (name === 'programs') {
                return typeof programas !== 'undefined' && Array.isArray(programas) ? programas : [];
            }
            if (name === 'pendencies') {
                return typeof pendencias !== 'undefined' && Array.isArray(pendencias) ? pendencias : [];
            }
            if (name === 'competencies') {
                if (typeof competencias !== 'undefined' && Array.isArray(competencias)) return competencias;
                if (typeof config !== 'undefined' && Array.isArray(config?.competencias)) return config.competencias;
            }
        } catch (_error) {
            return [];
        }
        return [];
    }

    function isElementVisible(root, element) {
        if (!element || element.hidden || element.getAttribute?.('aria-hidden') === 'true') return false;
        if (element.style?.display === 'none') return false;
        const style = root.getComputedStyle?.(element);
        return !style || (style.display !== 'none' && style.visibility !== 'hidden');
    }

    function collectVisibleModules(root, document) {
        return [...document.querySelectorAll('.nav-item[id^="nav-"]')]
            .filter(element => isElementVisible(root, element))
            .map(element => {
                const id = String(element.id || '').replace(/^nav-/, '');
                return {
                    id,
                    view: id,
                    title: element.querySelector('span')?.textContent?.trim() || id,
                    visible: true
                };
            });
    }

    function collectCompetencies(document) {
        const fromState = readGlobalCollection('competencies');
        if (fromState.length > 0) return fromState;
        const selectors = [
            '#global-competence-select option',
            '#competencia-global-select option',
            '[data-radar-competence-option]'
        ];
        const items = selectors.flatMap(selector => [...document.querySelectorAll(selector)]);
        return items.map(option => ({
            id: option.value || option.dataset?.competence || option.textContent,
            label: option.textContent?.trim() || option.value
        })).filter(item => item.id);
    }

    function createSearchContext(root, document) {
        const schools = readGlobalCollection('schools');
        return {
            schools,
            programs: readGlobalCollection('programs'),
            pendencies: readGlobalCollection('pendencies'),
            competencies: collectCompetencies(document),
            modules: collectVisibleModules(root, document),
            allowedSchoolIds: schools.map(school => String(
                school?.id || school?.designação || school?.designacao || ''
            )).filter(Boolean)
        };
    }

    function resultTypeLabel(type) {
        const labels = {
            school: 'Unidade escolar',
            module: 'Área do sistema',
            program: 'Programa',
            competence: 'Competência',
            pendency: 'Pendência'
        };
        return labels[type] || 'Resultado';
    }

    function createFallbackEngine(items) {
        return {
            search(query, options = {}) {
                const normalized = indexApi.normalizeSearchText(query);
                const limit = Number.isInteger(options.limit) ? options.limit : RESULT_LIMIT;
                return items
                    .filter(item => indexApi.normalizeSearchText([
                        item.title,
                        item.subtitle,
                        ...(item.keywords || [])
                    ].join(' ')).includes(normalized))
                    .slice(0, limit)
                    .map(item => ({ item, score: 0 }));
            }
        };
    }

    function install(root) {
        if (!root || root.__radarGlobalSearchInstalled) return false;
        const document = root.document;
        const input = document?.getElementById?.('global-search');
        if (!document || !input || !indexApi) return false;

        const container = input.closest('.search-bar-container') || input.parentElement;
        if (!container) return false;

        const panel = document.createElement('div');
        panel.id = 'global-search-results';
        panel.className = 'global-search-results';
        panel.setAttribute('role', 'listbox');
        panel.setAttribute('aria-label', 'Resultados da busca global');
        panel.hidden = true;
        container.appendChild(panel);

        input.type = 'search';
        input.placeholder = 'Buscar escola, programa, competência ou área...';
        input.removeAttribute('title');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-controls', panel.id);
        input.setAttribute('aria-expanded', 'false');

        const state = {
            results: [],
            activeIndex: -1,
            engine: null,
            catalog: [],
            requestId: 0,
            vendorLoaded: Boolean(root.Fuse)
        };

        async function rebuildEngine() {
            state.catalog = indexApi.createSearchCatalog(createSearchContext(root, document));
            let FuseCtor = root.Fuse;
            if (typeof FuseCtor !== 'function') {
                try {
                    FuseCtor = await loadScriptOnce(root, FUSE_VENDOR_URL, 'Fuse');
                    state.vendorLoaded = true;
                } catch (_error) {
                    state.vendorLoaded = false;
                    state.engine = createFallbackEngine(state.catalog);
                    return state.engine;
                }
            }
            state.engine = indexApi.createSearchEngine(FuseCtor, state.catalog);
            return state.engine;
        }

        function close({ clearActive = true, restoreFocus = false } = {}) {
            panel.hidden = true;
            panel.classList.remove('show');
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            if (clearActive) state.activeIndex = -1;
            root.dispatchEvent?.(new root.CustomEvent('radar:search-close'));
            if (restoreFocus) input.focus();
        }

        function setActiveIndex(index) {
            const buttons = [...panel.querySelectorAll('[role="option"]')];
            state.activeIndex = index;
            buttons.forEach((button, buttonIndex) => {
                const selected = buttonIndex === index;
                button.setAttribute('aria-selected', selected ? 'true' : 'false');
                button.classList.toggle('active', selected);
                if (selected) {
                    input.setAttribute('aria-activedescendant', button.id);
                    button.scrollIntoView?.({ block: 'nearest' });
                }
            });
            if (index < 0) input.removeAttribute('aria-activedescendant');
        }

        function navigateToResult(result) {
            const destination = destinationForResult(result);
            if (!destination) return false;
            close();
            input.value = '';
            try {
                escolaSearchQuery = '';
                searchResultFiltered = null;
            } catch (_error) {
                // O módulo permanece funcional mesmo sem os estados legados.
            }
            if (root.RadarNavigationHistory?.navigate) {
                root.RadarNavigationHistory.navigate(root, destination);
                return true;
            }
            root.switchView?.(destination.view, destination.param);
            return true;
        }

        function createResultButton(result, index) {
            const button = document.createElement('button');
            button.type = 'button';
            button.id = `global-search-result-${index}`;
            button.className = 'global-search-result';
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', 'false');
            button.dataset.resultIndex = String(index);

            const marker = document.createElement('span');
            marker.className = 'global-search-result-type';
            marker.textContent = resultTypeLabel(result.type);

            const content = document.createElement('span');
            content.className = 'global-search-result-content';
            const title = document.createElement('strong');
            title.textContent = result.title;
            const subtitle = document.createElement('small');
            subtitle.textContent = result.subtitle || '';
            content.append(title, subtitle);
            button.append(marker, content);
            button.addEventListener('click', () => navigateToResult(result));
            button.addEventListener('pointermove', () => setActiveIndex(index));
            return button;
        }

        function renderResults(results, query) {
            panel.replaceChildren();
            state.results = results;
            state.activeIndex = -1;

            if (results.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'global-search-empty';
                empty.setAttribute('role', 'status');
                empty.textContent = `Nenhum resultado encontrado para “${String(query).trim()}”.`;
                panel.appendChild(empty);
            } else {
                results.forEach((result, index) => panel.appendChild(createResultButton(result, index)));
            }

            panel.hidden = false;
            panel.classList.add('show');
            input.setAttribute('aria-expanded', 'true');
            root.dispatchEvent?.(new root.CustomEvent('radar:search-open'));
        }

        async function search(query) {
            const currentRequest = ++state.requestId;
            if (!shouldOpenForQuery(query)) {
                close();
                return [];
            }
            const engine = await rebuildEngine();
            if (currentRequest !== state.requestId || input.value !== query) return [];
            const results = indexApi.searchCatalog(engine, query, RESULT_LIMIT);
            renderResults(results, query);
            return results;
        }

        function handleInput(event) {
            const query = event?.target?.value || '';
            try {
                escolaSearchQuery = query;
                searchResultFiltered = null;
            } catch (_error) {
                // Compatibilidade com execução isolada e testes.
            }
            return search(query);
        }

        function handleKeydown(event) {
            const action = keyActionFor(event.key, state.activeIndex, state.results.length, event);
            if (!action) return;
            event.preventDefault();
            if (action.type === 'move') {
                setActiveIndex(action.index);
            } else if (action.type === 'activate') {
                navigateToResult(state.results[action.index]);
            } else if (action.type === 'close') {
                state.requestId += 1;
                close({ restoreFocus: true });
            }
        }

        input.removeAttribute('oninput');
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
        input.addEventListener('focus', () => {
            if (shouldOpenForQuery(input.value)) search(input.value);
        });
        document.addEventListener('pointerdown', event => {
            if (!container.contains(event.target)) {
                state.requestId += 1;
                close();
            }
        });

        root.handleGlobalSearch = handleInput;
        try { handleGlobalSearch = root.handleGlobalSearch; } catch (_error) { /* global lexical fallback */ }
        root.__radarGlobalSearchController = Object.freeze({
            search,
            close,
            refresh: rebuildEngine,
            navigateToResult,
            getState: () => ({
                activeIndex: state.activeIndex,
                resultCount: state.results.length,
                catalogSize: state.catalog.length,
                vendorLoaded: state.vendorLoaded
            })
        });
        root.__radarGlobalSearchInstalled = true;
        return true;
    }

    return Object.freeze({
        RESULT_LIMIT,
        FUSE_VENDOR_URL,
        shouldOpenForQuery,
        keyActionFor,
        destinationForResult,
        loadScriptOnce,
        install
    });
}));
