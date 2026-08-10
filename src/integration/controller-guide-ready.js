(function finalizeRadarControllerGuide(root) {
    'use strict';

    if (!root?.RadarControllerGuide) return;

    Promise.resolve(root.RadarNavigationContextReady)
        .catch(() => false)
        .then(() => {
            root.RadarControllerGuide?.install?.();
        });
}(typeof window !== 'undefined' ? window : globalThis));
