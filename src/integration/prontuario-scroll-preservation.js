(function installRadarProntuarioScrollPreservation(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarProntuarioScrollPreservation = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createProntuarioScrollPreservationApi() {
    'use strict';

    function contentArea(root) {
        return root?.document?.querySelector?.('main.content-area') || null;
    }

    function capture(root) {
        const area = contentArea(root);
        if (!area) return null;
        return Object.freeze({
            top: Number(area.scrollTop || 0),
            left: Number(area.scrollLeft || 0)
        });
    }

    function restore(root, snapshot) {
        if (!snapshot) return false;
        const area = contentArea(root);
        if (!area) return false;

        const apply = () => {
            const current = contentArea(root);
            if (!current) return;
            if (typeof current.scrollTo === 'function') {
                current.scrollTo({
                    top: snapshot.top,
                    left: snapshot.left,
                    behavior: 'auto'
                });
            } else {
                current.scrollTop = snapshot.top;
                current.scrollLeft = snapshot.left;
            }
        };

        apply();
        if (typeof root.requestAnimationFrame === 'function') {
            root.requestAnimationFrame(() => {
                apply();
                root.requestAnimationFrame(apply);
            });
        }
        return true;
    }

    function install(root) {
        if (!root || root.__radarProntuarioScrollPreservationInstalled) return false;
        if (!root.document || typeof root.toggleBonif !== 'function') return false;

        const originalToggleBonif = root.toggleBonif.bind(root);
        const wrappedToggleBonif = async function toggleBonifPreservingScroll(...args) {
            const snapshot = capture(root);
            try {
                return await originalToggleBonif(...args);
            } finally {
                restore(root, snapshot);
            }
        };

        root.toggleBonif = wrappedToggleBonif;
        try { toggleBonif = wrappedToggleBonif; } catch (_error) { /* global lexical fallback */ }
        root.__radarProntuarioScrollPreservationInstalled = true;
        return true;
    }

    return Object.freeze({
        capture,
        restore,
        install
    });
}));
