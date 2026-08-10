(function installRadarProductExtensions(root) {
    'use strict';

    if (!root?.document) return;
    if (root.RadarProductExtensionsReady) return;

    const document = root.document;
    const styles = Object.freeze([
        '/src/styles/school-timeline.css',
        '/src/styles/controller-guide.css'
    ]);
    const scripts = Object.freeze([
        '/src/domain/school-timeline.js',
        '/src/integration/school-timeline.js',
        '/src/integration/navigation-context-bootstrap.js',
        '/src/integration/controller-guide.js',
        '/src/integration/controller-guide-ready.js'
    ]);

    function loadStyleOnce(href) {
        const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => (
            link.getAttribute('href') === href
            || link.dataset?.radarProductStyle === href
        ));
        if (existing) return existing;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.radarProductStyle = href;
        document.head.appendChild(link);
        return link;
    }

    function loadScriptOnce(src) {
        const existing = Array.from(document.scripts || []).find(script => (
            script.getAttribute('src') === src
            || script.dataset?.radarProductScript === src
        ));
        if (existing?.dataset?.radarLoaded === 'true') return Promise.resolve(existing);
        if (existing) {
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => resolve(existing), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            });
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarProductScript = src;
            script.addEventListener('load', () => {
                script.dataset.radarLoaded = 'true';
                resolve(script);
            }, { once: true });
            script.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            document.head.appendChild(script);
        });
    }

    styles.forEach(loadStyleOnce);
    root.RadarProductExtensionsReady = scripts.reduce(
        (promise, src) => promise.then(() => loadScriptOnce(src)),
        Promise.resolve()
    ).then(() => true).catch(error => {
        root.RADAR_LAST_PRODUCT_EXTENSION_ERROR = error;
        console.error('Não foi possível inicializar as extensões de produto do RADAR.', error);
        return false;
    });
}(typeof window !== 'undefined' ? window : globalThis));