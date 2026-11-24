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


    // A single delegated tooltip, also for dynamically replaced table rows.
    // Top layer avoids clipping by scroll containers; manual visibility lets
    // pointer and keyboard follow the same dismiss/hover/persistence contract.
    function installActionHelp(root) {
        const doc = root.document;
        const selector = '.radar-action-help[data-tooltip]';
        const id = 'radar-action-help-tooltip';
        let active = null;
        let tooltip = null;
        let timer = null;
        let keyboard = false;
        let focused = false;
        let hovered = false;

        const triggerFor = node => node?.closest?.(selector);
        const cancelTimer = () => { if (timer !== null) root.clearTimeout(timer); timer = null; };
        const isOpen = () => Boolean(active && tooltip && !tooltip.hidden);

        function position() {
            if (!isOpen() || !active.isConnected) return;
            const anchor = active.getBoundingClientRect();
            const rect = tooltip.getBoundingClientRect();
            const width = root.innerWidth || doc.documentElement.clientWidth;
            const height = root.innerHeight || doc.documentElement.clientHeight;
            const x = Math.max(8, Math.min(anchor.left + (anchor.width - rect.width) / 2, width - rect.width - 8));
            const above = anchor.top - rect.height - 6;
            const below = anchor.bottom + 6;
            const y = above >= 8 ? above : Math.max(8, Math.min(below, height - rect.height - 8));
            tooltip.style.left = Math.round(x) + 'px';
            tooltip.style.top = Math.round(y) + 'px';
        }

        function hide() {
            cancelTimer();
            if (!active) return false;
            const tokens = (active.getAttribute('aria-describedby') || '').split(/\s+/).filter(token => token && token !== id);
            if (tokens.length) active.setAttribute('aria-describedby', tokens.join(' '));
            else active.removeAttribute('aria-describedby');
            if (tooltip?.matches?.(':popover-open')) tooltip.hidePopover();
            if (tooltip) tooltip.hidden = true;
            active = null;
            focused = hovered = false;
            return true;
        }

        function show(trigger, fromKeyboard) {
            if (!trigger?.isConnected || trigger.disabled || !trigger.dataset.tooltip) return;
            cancelTimer();
            if (active === trigger && isOpen()) {
                if (fromKeyboard) focused = true;
                else hovered = true;
                position();
                return;
            }
            hide();
            if (!tooltip) {
                tooltip = doc.createElement('div');
                tooltip.id = id;
                tooltip.className = 'radar-floating-tooltip';
                tooltip.setAttribute('role', 'tooltip');
                if (typeof tooltip.showPopover === 'function') tooltip.setAttribute('popover', 'manual');
                tooltip.hidden = true;
            }
            const host = trigger.closest('[role="dialog"]') || doc.body;
            host.appendChild(tooltip);
            tooltip.inert = false;
            tooltip.textContent = trigger.dataset.tooltip;
            active = trigger;
            focused = fromKeyboard;
            hovered = !fromKeyboard;
            const tokens = new Set((trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
            tokens.add(id);
            trigger.setAttribute('aria-describedby', [...tokens].join(' '));
            tooltip.hidden = false;
            if (typeof tooltip.showPopover === 'function') tooltip.showPopover();
            position();
        }

        function deferHide() {
            cancelTimer();
            if (!focused && !hovered) timer = root.setTimeout(() => { if (!focused && !hovered) hide(); }, 180);
        }

        doc.addEventListener('pointerover', event => {
            if (event.pointerType === 'touch') return;
            if (tooltip?.contains(event.target) && isOpen()) {
                hovered = true;
                cancelTimer();
                return;
            }
            const trigger = triggerFor(event.target);
            if (trigger && !trigger.contains(event.relatedTarget)) show(trigger, false);
        });
        doc.addEventListener('pointerout', event => {
            if (!isOpen()) return;
            if (!active.contains(event.target) && !tooltip.contains(event.target)) return;
            if (active.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget)) return;
            hovered = false;
            deferHide();
        });
        doc.addEventListener('focusin', event => {
            const trigger = triggerFor(event.target);
            if (keyboard && trigger && trigger.matches(':focus-visible')) show(trigger, true);
        });
        doc.addEventListener('focusout', event => {
            if (!active?.contains(event.target)) return;
            focused = false;
            deferHide();
        });
        doc.addEventListener('pointerdown', () => { keyboard = false; hide(); }, true);
        doc.addEventListener('keydown', event => {
            if (event.key === 'Tab') keyboard = true;
            if (event.key === 'Escape' && isOpen()) {
                hide();
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, true);
        doc.addEventListener('scroll', position, true);
        root.addEventListener('resize', position);
        if (typeof root.MutationObserver === 'function') {
            new root.MutationObserver(() => {
                if (active && !active.isConnected) hide();
            }).observe(doc.body, { childList: true, subtree: true });
        }
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
            const selectorConfig = selectors[normalized];
            if (!selectorConfig) return null;
            return {
                ...selectorConfig,
                reference: document.querySelector(selectorConfig.reference),
                floating: document.querySelector(selectorConfig.floating)
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
        installActionHelp(root);
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
