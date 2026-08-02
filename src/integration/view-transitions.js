(function installRadarViewTransitions(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarViewTransitions = Object.freeze(api);
        if (root.document) {
            if (!api.install(root)) {
                const interval = root.setInterval?.(() => {
                    if (api.install(root)) root.clearInterval?.(interval);
                }, 20);
                root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
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

    function shouldAnimateNavigation(root) {
        return Boolean(
            root?.document
            && typeof root.document.startViewTransition === 'function'
            && !prefersReducedMotion(root)
        );
    }

    async function runViewTransition(root, update) {
        if (typeof update !== 'function') {
            throw new TypeError('A atualização da navegação deve ser uma função.');
        }
        if (!shouldAnimateNavigation(root)) {
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

    function runViewTransitionPreservingSync(root, update) {
        if (!shouldAnimateNavigation(root)) return update();
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

        const container = root.document.getElementById('main-container');
        if (container) container.style.viewTransitionName = 'radar-main-content';
        const originalSwitchView = root.switchView.bind(root);

        root.switchView = function switchViewWithTransition(...args) {
            return runViewTransitionPreservingSync(root, () => originalSwitchView(...args));
        };
        try { switchView = root.switchView; } catch (_error) { /* global lexical fallback */ }

        root.__radarViewTransitionsController = Object.freeze({
            shouldAnimate: () => shouldAnimateNavigation(root),
            run: update => runViewTransition(root, update)
        });
        root.__radarViewTransitionsInstalled = true;
        return true;
    }

    return Object.freeze({
        prefersReducedMotion,
        shouldAnimateNavigation,
        runViewTransition,
        install
    });
}));
