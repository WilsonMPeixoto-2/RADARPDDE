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

    function createNavigationActivation(root) {
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

    function runViewTransitionPreservingSync(root, update, activationReady = true) {
        if (!shouldAnimateNavigation(root, activationReady)) return update();
        let result;
        let updateStarted = false;
        try {
            root.document.startViewTransition(() => {
                updateStarted = true;
                result = update();
                return result;
            });
            return result;
        } catch (error) {
            if (!updateStarted) return update();
            throw error;
        }
    }

    function install(root) {
        if (!root || root.__radarViewTransitionsInstalled) return false;
        if (!root.document || typeof root.switchView !== 'function') return false;

        const activation = createNavigationActivation(root);
        const originalSwitchView = root.switchView.bind(root);
        root.switchView = function switchViewWithTransition(...args) {
            if (!activation.isActive()) {
                const result = originalSwitchView(...args);
                activation.noteNavigation();
                return result;
            }
            return runViewTransitionPreservingSync(root, () => originalSwitchView(...args), true);
        };
        try { switchView = root.switchView; } catch (_error) { /* global lexical fallback */ }

        root.__radarViewTransitionsController = Object.freeze({
            shouldAnimate: () => shouldAnimateNavigation(root, activation.isActive()),
            isActive: activation.isActive,
            run: update => runViewTransition(root, update, activation.isActive())
        });
        root.__radarViewTransitionsInstalled = true;
        return true;
    }

    return Object.freeze({
        prefersReducedMotion,
        shouldAnimateNavigation,
        createNavigationActivation,
        runViewTransition,
        install
    });
}));
