(function installRadarViewTransitions(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarViewTransitions = Object.freeze(api);
        if (root.document) {
            const install = () => api.install(root);
            if (!install() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', install, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createViewTransitionsApi() {
    'use strict';

    const NAVIGATION_TARGET_SELECTOR = '.nav-item, .global-search-result';

    function prefersReducedMotion(root) {
        try {
            return root?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
        } catch (_error) {
            return false;
        }
    }

    function shouldAnimateNavigation(root, activationReady = true) {
        return Boolean(
            activationReady
            && root?.document
            && typeof root.document.startViewTransition === 'function'
            && !prefersReducedMotion(root)
        );
    }

    function createNavigationActivation(root, onActivated = () => {}) {
        let active = false;
        let loadReady = root?.document?.readyState === 'complete';
        let navigationSeen = false;
        let generation = 0;

        const requestFrame = typeof root?.requestAnimationFrame === 'function'
            ? root.requestAnimationFrame.bind(root)
            : callback => {
                if (typeof root?.setTimeout === 'function') return root.setTimeout(callback, 0);
                callback();
                return 0;
            };

        function scheduleActivation() {
            if (active || !loadReady || !navigationSeen) return;
            const scheduledGeneration = ++generation;
            requestFrame(() => {
                requestFrame(() => {
                    if (scheduledGeneration !== generation || !loadReady || !navigationSeen) return;
                    active = true;
                    onActivated();
                });
            });
        }

        function noteNavigation() {
            active = false;
            navigationSeen = true;
            scheduleActivation();
        }

        function handleLoad() {
            loadReady = true;
            scheduleActivation();
        }

        if (!loadReady && typeof root?.addEventListener === 'function') {
            root.addEventListener('load', handleLoad, { once: true });
        }

        return Object.freeze({
            isActive: () => active,
            noteNavigation,
            markLoaded: handleLoad
        });
    }

    function createNavigationIntent(root) {
        let eligible = false;
        let generation = 0;
        const document = root?.document;

        function isEligibleTarget(target, event) {
            if (!target || event?.isTrusted !== true) return false;
            if (event.type === 'click') {
                return Boolean(target.closest?.(NAVIGATION_TARGET_SELECTOR));
            }
            if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
                return Boolean(
                    target.closest?.(NAVIGATION_TARGET_SELECTOR)
                    || target.matches?.('#global-search')
                );
            }
            return false;
        }

        function mark(event) {
            if (!isEligibleTarget(event?.target, event)) return;
            eligible = true;
            const markedGeneration = ++generation;
            const clear = () => {
                if (generation === markedGeneration) eligible = false;
            };
            if (typeof root?.queueMicrotask === 'function') {
                root.queueMicrotask(clear);
            } else if (typeof root?.setTimeout === 'function') {
                root.setTimeout(clear, 0);
            }
        }

        document?.addEventListener?.('click', mark, true);
        document?.addEventListener?.('keydown', mark, true);

        return Object.freeze({
            consume() {
                const result = eligible;
                eligible = false;
                generation += 1;
                return result;
            },
            isEligibleTarget
        });
    }

    function isExpectedTransitionCancellation(error) {
        const message = String(error?.message || error || '');
        return error?.name === 'AbortError'
            || /transition was (?:skipped|aborted)/i.test(message)
            || /timeout in dom update/i.test(message);
    }

    function observeTransition(root, transition, onSettled = () => {}) {
        const promises = [
            transition?.ready,
            transition?.updateCallbackDone,
            transition?.finished
        ].filter(Boolean);

        promises.forEach(promise => {
            Promise.resolve(promise).catch(error => {
                if (!isExpectedTransitionCancellation(error)) {
                    root?.console?.error?.('Falha inesperada na transição de navegação.', error);
                }
            });
        });

        const finalPromise = transition?.finished
            || transition?.updateCallbackDone
            || transition?.ready;
        if (finalPromise) {
            Promise.resolve(finalPromise)
                .catch(() => undefined)
                .finally(onSettled);
        } else {
            onSettled();
        }
    }

    async function runViewTransition(root, update, activationReady = true) {
        if (typeof update !== 'function') {
            throw new TypeError('A atualização da navegação deve ser uma função.');
        }
        if (!shouldAnimateNavigation(root, activationReady)) {
            return update();
        }

        let result;
        const transition = root.document.startViewTransition(() => {
            result = update();
            return result;
        });
        if (transition?.updateCallbackDone) {
            await transition.updateCallbackDone;
        }
        return result;
    }

    function install(root) {
        if (!root || root.__radarViewTransitionsInstalled) return false;
        if (!root.document || typeof root.switchView !== 'function') return false;

        const document = root.document;
        const intent = createNavigationIntent(root);
        let activation;
        let currentWrapper = null;
        let transitionInFlight = false;
        let wrapCount = 0;

        function startTransition(update) {
            if (transitionInFlight || !shouldAnimateNavigation(root, activation?.isActive())) {
                return update();
            }

            let updateStarted = false;
            let result;
            try {
                transitionInFlight = true;
                const transition = root.document.startViewTransition(() => {
                    updateStarted = true;
                    result = update();
                    return result;
                });
                observeTransition(root, transition, () => {
                    transitionInFlight = false;
                });
                return result;
            } catch (error) {
                transitionInFlight = false;
                if (updateStarted) throw error;
                return update();
            }
        }

        function wrapCurrentSwitchView() {
            const candidate = root.switchView;
            if (typeof candidate !== 'function' || candidate === currentWrapper) return false;

            const originalSwitchView = candidate.bind(root);
            const wrapper = function switchViewWithTransition(...args) {
                if (!activation?.isActive()) {
                    const result = originalSwitchView(...args);
                    activation?.noteNavigation();
                    return result;
                }

                const userInitiated = intent.consume();
                if (!userInitiated) {
                    return originalSwitchView(...args);
                }
                return startTransition(() => originalSwitchView(...args));
            };

            currentWrapper = wrapper;
            root.switchView = wrapper;
            try { switchView = wrapper; } catch (_error) { /* global lexical fallback */ }
            wrapCount += 1;
            return true;
        }

        function viewFromNavigationTarget(target) {
            const item = target?.closest?.('.nav-item[id^="nav-"]');
            if (!item?.id) return null;
            return item.id.replace(/^nav-/, '') || null;
        }

        function shouldInterceptNavigationEvent(event) {
            if (!activation?.isActive() || !shouldAnimateNavigation(root, true)) return false;
            if (!event || event.defaultPrevented || event.isTrusted !== true) return false;
            if (event.type === 'click') {
                return Number(event.button || 0) === 0
                    && !event.metaKey
                    && !event.ctrlKey
                    && !event.shiftKey
                    && !event.altKey;
            }
            return event.type === 'keydown'
                && (event.key === 'Enter' || event.key === ' ')
                && !event.metaKey
                && !event.ctrlKey
                && !event.altKey;
        }

        function closeMobileNavigationIfOpen() {
            const sidebar = document.querySelector?.('aside.sidebar.mobile-open');
            if (!sidebar) return false;

            const overlay = document.querySelector?.('.mobile-sidebar-overlay');
            const menuButton = document.getElementById?.('mobile-menu-button');
            sidebar.classList.remove('mobile-open');
            sidebar.setAttribute('aria-hidden', 'true');
            overlay?.classList.remove('is-visible');
            overlay?.setAttribute('aria-hidden', 'true');
            document.body?.classList.remove('mobile-nav-open');
            menuButton?.setAttribute('aria-expanded', 'false');
            menuButton?.setAttribute('aria-label', 'Abrir menu de navegação');
            return true;
        }

        function navigateFromSidebarEvent(event) {
            const view = viewFromNavigationTarget(event?.target);
            if (!view || !shouldInterceptNavigationEvent(event) || transitionInFlight) return;

            event.preventDefault?.();
            event.stopImmediatePropagation?.();
            intent.consume();

            startTransition(() => {
                closeMobileNavigationIfOpen();
                if (root.RadarNavigationHistory?.navigate) {
                    return root.RadarNavigationHistory.navigate(root, { view });
                }
                return root.switchView(view);
            });
        }

        activation = createNavigationActivation(root, wrapCurrentSwitchView);
        wrapCurrentSwitchView();
        document.addEventListener('click', navigateFromSidebarEvent, true);
        document.addEventListener('keydown', navigateFromSidebarEvent, true);

        root.__radarViewTransitionsController = Object.freeze({
            shouldAnimate: () => shouldAnimateNavigation(root, activation.isActive()),
            isActive: activation.isActive,
            isTransitionInFlight: () => transitionInFlight,
            getWrapCount: () => wrapCount,
            refreshNavigationBinding: wrapCurrentSwitchView,
            run: update => runViewTransition(root, update, activation.isActive())
        });
        root.__radarViewTransitionsInstalled = true;
        return true;
    }

    return Object.freeze({
        NAVIGATION_TARGET_SELECTOR,
        prefersReducedMotion,
        shouldAnimateNavigation,
        createNavigationActivation,
        createNavigationIntent,
        isExpectedTransitionCancellation,
        observeTransition,
        runViewTransition,
        install
    });
}));
