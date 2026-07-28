(function installProductExtensions(root) {
    'use strict';

    if (!root || !root.document || root.__radarProductExtensionsLoading) return;
    root.__radarProductExtensionsLoading = true;

    function loadStyleOnce(href) {
        const existing = root.document.querySelector(`link[data-radar-product-extension="${href}"]`);
        if (existing) return existing;
        const link = root.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.radarProductExtension = href;
        root.document.head.appendChild(link);
        return link;
    }

    function loadScriptOnce(src) {
        const existing = root.document.querySelector(`script[data-radar-product-extension="${src}"]`);
        if (existing?.dataset.radarLoaded === 'true') return Promise.resolve(existing);
        if (existing) {
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => resolve(existing), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            });
        }
        return new Promise((resolve, reject) => {
            const script = root.document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarProductExtension = src;
            script.addEventListener('load', () => {
                script.dataset.radarLoaded = 'true';
                resolve(script);
            }, { once: true });
            script.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            root.document.head.appendChild(script);
        });
    }

    async function install() {
        loadStyleOnce('/src/styles/school-timeline.css');
        await loadScriptOnce('/src/domain/school-timeline.js');
        await loadScriptOnce('/src/integration/school-timeline.js');
        root.RadarSchoolTimelineIntegration?.install?.(root);
        root.__radarProductExtensionsReady = true;
        root.dispatchEvent?.(new CustomEvent('radar:product-extensions-ready'));
        return true;
    }

    root.RadarProductExtensionsReady = install().catch(error => {
        root.RADAR_LAST_PRODUCT_EXTENSION_ERROR = error;
        console.error('[RADAR PDDE] Não foi possível carregar as extensões de produto.', error);
        return false;
    });
}(typeof window !== 'undefined' ? window : globalThis));
