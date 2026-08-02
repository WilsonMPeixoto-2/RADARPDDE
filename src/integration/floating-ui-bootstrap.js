(function installRadarFloatingUI(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarFloatingUI = Object.freeze(api);
        if (root.document) {
            const install = () => api.install(root);
            if (!install() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', install, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createFloatingUIApi() {
    'use strict';

    const FLOATING_NAMES = Object.freeze(['alerts', 'profile', 'search']);
    const FLOATING_VENDOR_URL = 'vendor/floating-ui.js';

    function normalizeFloatingName(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return FLOATING_NAMES.includes(normalized) ? normalized : null;
    }

    function nextExpandedState(_currentName, nextName) {
        const normalizedNext = normalizeFloatingName(nextName);
        return {
            alerts: normalizedNext === 'alerts',
            profile: normalizedNext === 'profile',
            search: normalizedNext === 'search'
        };
    }

    function createPositionOptions(api, placement = 'bottom-end') {
        if (!api) throw new TypeError('Floating UI indisponível.');
        return {
            placement,
            strategy: 'fixed',
            middleware: [
                api.offset(8),
                api.flip({ padding: 8 }),
                api.shift({ padding: 8 }),
                api.size({
                    padding: 8,
                    apply({ availableWidth, availableHeight, elements }) {
                        const width = Math.max(220, Math.floor(availableWidth));
                        const height = Math.max(120, Math.floor(availableHeight));
                        Object.assign(elements.floating.style, {
                            maxWidth: `${width}px`,
                            maxHeight: `${height}px`
                        });
                    }
                })
            ]
        };
    }

    function loadScriptOnce(root, source, globalName) {
        if (root?.RadarGlobalSearch?.loadScriptOnce) {
            return root.RadarGlobalSearch.loadScriptOnce(root, source, globalName);
        }
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

    function install(root) {
        if (!root || root.__radarFloatingUIInstalled) return false;
        const document = root.document;
        if (!document) return false;

        const selectors = {
            alerts: {
                reference: '#alerts-bell-container .bell-button',
                floating: '#alerts-dropdown',
                placement: 'bottom-end',
                role: 'menu'
            },
            profile: {
                reference: '.profile-switcher .profile-button',
                floating: '#profile-dropdown',
                placement: 'bottom-end',
                role: 'menu'
            },
            search: {
                reference: '#global-search',
                floating: '#global-search-results',
                placement: 'bottom-start',
                role: 'listbox'
            }
        };

        function resolveDefinition(name) {
            const normalized = normalizeFloatingName(name);
            const config = selectors[normalized];
            if (!config) return null;
            return {
                ...config,
                reference: document.querySelector(config.reference),
                floating: document.querySelector(config.floating)
            };
        }

        const initialAlerts = resolveDefinition('alerts');
        const initialProfile = resolveDefinition('profile');
        if (!initialAlerts?.reference || !initialAlerts?.floating
            || !initialProfile?.reference || !initialProfile?.floating) {
            return false;
        }

        const cleanups = new Map();
        let activeName = null;
        let openRequest = 0;

        function configureDefinition(name) {
            const definition = resolveDefinition(name);
            if (!definition?.reference || !definition?.floating) return null;
            definition.reference.setAttribute('aria-haspopup', definition.role);
            definition.reference.setAttribute('aria-controls', definition.floating.id);
            if (!definition.reference.hasAttribute('aria-expanded')) {
                definition.reference.setAttribute('aria-expanded', 'false');
            }
            definition.floating.setAttribute('role', definition.role);
            definition.floating.dataset.radarFloating = name;
            return definition;
        }

        FLOATING_NAMES.forEach(configureDefinition);

        function positionFallback(definition) {
            const referenceRect = definition.reference.getBoundingClientRect();
            const floatingRect = definition.floating.getBoundingClientRect();
            const viewportWidth = root.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = root.innerHeight || document.documentElement.clientHeight;
            const padding = 8;
            const alignEnd = definition.placement.endsWith('-end');
            const preferredLeft = alignEnd
                ? referenceRect.right - floatingRect.width
                : referenceRect.left;
            const left = Math.min(
                Math.max(padding, preferredLeft),
                Math.max(padding, viewportWidth - floatingRect.width - padding)
            );
            const preferredTop = referenceRect.bottom + 8;
            const top = preferredTop + floatingRect.height <= viewportHeight - padding
                ? preferredTop
                : Math.max(padding, referenceRect.top - floatingRect.height - 8);
            Object.assign(definition.floating.style, {
                position: 'fixed',
                left: `${Math.round(left)}px`,
                top: `${Math.round(top)}px`,
                right: 'auto',
                maxWidth: `${Math.max(220, viewportWidth - padding * 2)}px`,
                maxHeight: `${Math.max(120, viewportHeight - padding * 2)}px`
            });
            return true;
        }

        async function ensureFloatingApi() {
            if (root.FloatingUIDOM?.computePosition && root.FloatingUIDOM?.autoUpdate) {
                return root.FloatingUIDOM;
            }
            return loadScriptOnce(root, FLOATING_VENDOR_URL, 'FloatingUIDOM');
        }

        async function updatePosition(name) {
            const normalized = normalizeFloatingName(name);
            const definition = resolveDefinition(normalized);
            if (!definition?.reference || !definition?.floating || definition.floating.hidden) {
                return false;
            }
            try {
                const floatingApi = await ensureFloatingApi();
                const { x, y } = await floatingApi.computePosition(
                    definition.reference,
                    definition.floating,
                    createPositionOptions(floatingApi, definition.placement)
                );
                Object.assign(definition.floating.style, {
                    position: 'fixed',
                    left: `${Math.round(x)}px`,
                    top: `${Math.round(y)}px`,
                    right: 'auto'
                });
                return true;
            } catch (_error) {
                return positionFallback(definition);
            }
        }

        function stopAutoUpdate(name) {
            const cleanup = cleanups.get(name);
            if (typeof cleanup === 'function') cleanup();
            cleanups.delete(name);
        }

        function closeFloating(name, { restoreFocus = false } = {}) {
            const normalized = normalizeFloatingName(name);
            const definition = resolveDefinition(normalized);
            if (!definition?.floating) return false;
            openRequest += 1;
            stopAutoUpdate(normalized);
            definition.floating.classList.remove('show');
            definition.floating.hidden = true;
            definition.reference?.setAttribute('aria-expanded', 'false');
            if (activeName === normalized) activeName = null;
            if (restoreFocus) definition.reference?.focus?.();
            return true;
        }

        function closeAll(options = {}) {
            const focusedName = activeName;
            FLOATING_NAMES.forEach(name => closeFloating(name, {
                restoreFocus: options.restoreFocus === true && focusedName === name
            }));
        }

        async function openFloating(name) {
            const normalized = normalizeFloatingName(name);
            const definition = configureDefinition(normalized);
            if (!definition?.reference || !definition?.floating) return false;
            const request = ++openRequest;

            FLOATING_NAMES.filter(other => other !== normalized)
                .forEach(other => {
                    const otherDefinition = resolveDefinition(other);
                    if (!otherDefinition?.floating) return;
                    stopAutoUpdate(other);
                    otherDefinition.floating.classList.remove('show');
                    otherDefinition.floating.hidden = true;
                    otherDefinition.reference?.setAttribute('aria-expanded', 'false');
                });
            stopAutoUpdate(normalized);
            definition.floating.hidden = false;
            definition.floating.classList.add('show');
            definition.reference.setAttribute('aria-expanded', 'true');
            activeName = normalized;
            positionFallback(definition);

            try {
                const floatingApi = await ensureFloatingApi();
                if (request !== openRequest || activeName !== normalized) return false;
                const update = () => updatePosition(normalized);
                cleanups.set(normalized, floatingApi.autoUpdate(
                    definition.reference,
                    definition.floating,
                    update
                ));
                await update();
            } catch (_error) {
                if (request === openRequest && activeName === normalized) {
                    positionFallback(definition);
                }
            }
            return true;
        }

        function toggleFloating(name) {
            const normalized = normalizeFloatingName(name);
            const definition = resolveDefinition(normalized);
            if (!definition?.floating) return Promise.resolve(false);
            return definition.floating.classList.contains('show')
                ? Promise.resolve(closeFloating(normalized))
                : openFloating(normalized);
        }

        root.toggleAlertsDropdown = function toggleAlertsWithFloating(event) {
            event?.stopPropagation?.();
            return toggleFloating('alerts');
        };
        root.toggleProfileDropdown = function toggleProfileWithFloating(event) {
            event?.stopPropagation?.();
            return toggleFloating('profile');
        };
        try { toggleAlertsDropdown = root.toggleAlertsDropdown; } catch (_error) { /* global fallback */ }
        try { toggleProfileDropdown = root.toggleProfileDropdown; } catch (_error) { /* global fallback */ }

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !activeName) return;
            event.preventDefault();
            closeFloating(activeName, { restoreFocus: true });
        });
        document.addEventListener('pointerdown', event => {
            if (!activeName) return;
            const definition = resolveDefinition(activeName);
            if (definition?.reference?.contains(event.target) || definition?.floating?.contains(event.target)) {
                return;
            }
            closeFloating(activeName);
        });
        root.addEventListener?.('radar:search-open', () => openFloating('search'));
        root.addEventListener?.('radar:search-close', () => closeFloating('search'));

        root.__radarFloatingUIController = Object.freeze({
            openFloating,
            closeFloating,
            closeAll,
            toggleFloating,
            updatePosition,
            getActiveName: () => activeName,
            getAutoUpdateCount: () => cleanups.size,
            isVendorLoaded: () => Boolean(root.FloatingUIDOM)
        });
        root.__radarFloatingUIInstalled = true;
        return true;
    }

    return Object.freeze({
        FLOATING_NAMES,
        FLOATING_VENDOR_URL,
        normalizeFloatingName,
        nextExpandedState,
        createPositionOptions,
        loadScriptOnce,
        install
    });
}));
