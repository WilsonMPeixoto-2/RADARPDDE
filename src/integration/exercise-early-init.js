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

    if (!tryInitialize()) {
        document.addEventListener('DOMContentLoaded', tryInitialize, { once: true });
        root.addEventListener('load', tryInitialize, { once: true });
    }
}(typeof window !== 'undefined' ? window : globalThis));
