(function bootstrapRadarNavigationContext(root) {
    'use strict';

    if (!root?.document || root.RadarNavigationContextReady) return;

    const SCRIPT_SRC = '/src/integration/navigation-context.js';

    function loadScriptOnce() {
        if (root.RadarNavigationContext) return Promise.resolve(root.RadarNavigationContext);
        const existing = Array.from(root.document.scripts || []).find(script => (
            script.getAttribute?.('src') === SCRIPT_SRC
            || script.dataset?.radarNavigationContext === 'true'
        ));
        if (existing?.dataset?.radarLoaded === 'true') {
            return Promise.resolve(root.RadarNavigationContext);
        }
        if (existing) {
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => resolve(root.RadarNavigationContext), { once: true });
                existing.addEventListener('error', () => reject(new Error('Falha ao carregar a navegação contextual.')), { once: true });
            });
        }
        return new Promise((resolve, reject) => {
            const script = root.document.createElement('script');
            script.src = SCRIPT_SRC;
            script.async = false;
            script.dataset.radarNavigationContext = 'true';
            script.addEventListener('load', () => {
                script.dataset.radarLoaded = 'true';
                resolve(root.RadarNavigationContext);
            }, { once: true });
            script.addEventListener('error', () => reject(new Error('Falha ao carregar a navegação contextual.')), { once: true });
            root.document.head.appendChild(script);
        });
    }

    function waitForNavigationHistory() {
        return new Promise(resolve => {
            const startedAt = Date.now();
            const check = () => {
                if (root.RadarNavigationHistory && root.__radarNavigationHistoryInstalled) {
                    resolve(true);
                    return true;
                }
                if (Date.now() - startedAt >= 10000) {
                    resolve(false);
                    return true;
                }
                return false;
            };
            if (check()) return;
            const interval = root.setInterval(() => {
                if (check()) root.clearInterval(interval);
            }, 20);
        });
    }

    root.RadarNavigationContextReady = waitForNavigationHistory()
        .then(ready => {
            if (!ready) return false;
            return loadScriptOnce();
        })
        .then(api => Boolean(api?.install?.(root) || root.__radarNavigationContextInstalled))
        .catch(error => {
            root.RADAR_LAST_CONTEXTUAL_NAVIGATION_ERROR = error;
            console.error('Não foi possível inicializar a navegação contextual.', error);
            return false;
        });
}(typeof window !== 'undefined' ? window : globalThis));
