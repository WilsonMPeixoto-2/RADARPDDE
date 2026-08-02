(function installRadarFloatingUI(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarFloatingUI = Object.freeze(api);
        if (root.document) {
            if (!api.install(root)) {
                const interval = root.setInterval?.(() => {
                    if (api.install(root)) root.clearInterval?.(interval);
                }, 25);
                root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createFloatingUIApi() {
    'use strict';

    const FLOATING_NAMES = Object.freeze(['alerts', 'profile', 'search']);

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

    function install(root) {
        if (!root || root.__radarFloatingUIInstalled) return false;
        const document = root.document;
        const floatingApi = root.FloatingUIDOM;
        if (!document || !floatingApi?.computePosition || !floatingApi?.autoUpdate) return false;

        const definitions = {
            alerts: {
                reference: document.querySelector('#alerts-bell-container .bell-button'),
                floating: document.getElementById('alerts-dropdown'),
                placement: 'bottom-end',
                role: 'menu'
            },
            profile: {
                reference: document.querySelector('.profile-switcher .profile-button'),
                floating: document.getElementById('profile-dropdown'),
                placement: 'bottom-end',
                role: 'menu'
            },
            search: {
                reference: document.getElementById('global-search'),
                floating: document.getElementById('global-search-results'),
                placement: 'bottom-start',
                role: 'listbox'
            }
        };

        if (!definitions.alerts.reference || !definitions.alerts.floating
            || !definitions.profile.reference || !definitions.profile.floating) {
            return false;
        }

        const cleanups = new Map();
        let activeName = null;

        Object.entries(definitions).forEach(([name, definition]) => {
            if (!definition.reference || !definition.floating) return;
            definition.reference.setAttribute('aria-haspopup', definition.role);
            definition.reference.setAttribute('aria-controls', definition.floating.id);
            definition.reference.setAttribute('aria-expanded', 'false');
            definition.floating.setAttribute('role', definition.role);
            definition.floating.dataset.radarFloating = name;
        });

        function updatePosition(name) {
            const normalized = normalizeFloatingName(name);
            const definition = definitions[normalized];
            if (!definition?.reference || !definition?.floating || definition.floating.hidden) {
                return Promise.resolve(false);
            }
            return floatingApi.computePosition(
                definition.reference,
                definition.floating,
                createPositionOptions(floatingApi, definition.placement)
            ).then(({ x, y }) => {
                Object.assign(definition.floating.style, {
                    position: 'fixed',
                    left: `${Math.round(x)}px`,
                    top: `${Math.round(y)}px`,
                    right: 'auto'
                });
                return true;
            });
        }

        function stopAutoUpdate(name) {
            const cleanup = cleanups.get(name);
            if (typeof cleanup === 'function') cleanup();
            cleanups.delete(name);
        }

        function closeFloating(name, { restoreFocus = false } = {}) {
            const normalized = normalizeFloatingName(name);
            const definition = definitions[normalized];
            if (!definition?.floating) return false;
            stopAutoUpdate(normalized);
            definition.floating.classList.remove('show');
            definition.floating.hidden = true;
            definition.reference?.setAttribute('aria-expanded', 'false');
            if (activeName === normalized) activeName = null;
            if (restoreFocus) definition.reference?.focus?.();
            return true;
        }

        function closeAll(options = {}) {
            FLOATING_NAMES.forEach(name => closeFloating(name, {
                restoreFocus: options.restoreFocus === true && activeName === name
            }));
        }

        function openFloating(name) {
            const normalized = normalizeFloatingName(name);
            const definition = definitions[normalized];
            if (!definition?.reference || !definition?.floating) return false;

            FLOATING_NAMES.filter(other => other !== normalized)
                .forEach(other => closeFloating(other));
            stopAutoUpdate(normalized);
            definition.floating.hidden = false;
            definition.floating.classList.add('show');
            definition.reference.setAttribute('aria-expanded', 'true');
            activeName = normalized;

            const update = () => updatePosition(normalized);
            cleanups.set(normalized, floatingApi.autoUpdate(
                definition.reference,
                definition.floating,
                update
            ));
            update();
            return true;
        }

        function toggleFloating(name) {
            const normalized = normalizeFloatingName(name);
            const definition = definitions[normalized];
            if (!definition?.floating) return false;
            return definition.floating.classList.contains('show')
                ? closeFloating(normalized)
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
            const definition = definitions[activeName];
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
            getAutoUpdateCount: () => cleanups.size
        });
        root.__radarFloatingUIInstalled = true;
        return true;
    }

    return Object.freeze({
        FLOATING_NAMES,
        normalizeFloatingName,
        nextExpandedState,
        createPositionOptions,
        install
    });
}));
