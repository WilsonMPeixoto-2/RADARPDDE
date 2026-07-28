(function initializeExerciseDataBeforeFirstRender(root) {
    'use strict';

    if (!root || typeof document === 'undefined') return;

    let initialized = false;

    function tryInitialize() {
        if (initialized || !root.RadarExerciseManagement) return initialized;
        try {
            const runtimeReady = typeof config !== 'undefined'
                && typeof COMPETENCIAS !== 'undefined'
                && Array.isArray(COMPETENCIAS);
            if (!runtimeReady) return false;

            root.RadarExerciseManagement.initialize();
            initialized = true;
            return true;
        } catch (error) {
            return false;
        }
    }

    function loadProductExtensions() {
        if (root.__radarProductExtensionsLoading) return;
        const src = '/src/integration/product-extensions.js';
        const existing = document.querySelector(`script[data-radar-product-extension-loader="${src}"]`);
        if (existing) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.dataset.radarProductExtensionLoader = src;
        script.addEventListener('error', () => {
            root.RADAR_LAST_PRODUCT_EXTENSION_ERROR = new Error(`Falha ao carregar ${src}.`);
        }, { once: true });
        document.head.appendChild(script);
    }

    if (!tryInitialize()) {
        document.addEventListener('DOMContentLoaded', tryInitialize, { once: true });
    }
    root.addEventListener('load', () => {
        tryInitialize();
        loadProductExtensions();
    }, { once: true });
}(typeof window !== 'undefined' ? window : globalThis));
