(function installRadarProductExtensions(root) {
    'use strict';

    if (!root?.document) return;
    if (root.RadarProductExtensionsReady) {
        if (typeof root.RadarProductExtensionsRetry === 'function') {
            root.RadarProductExtensionsReady = root.RadarProductExtensionsRetry();
        }
        return;
    }

    const document = root.document;
    const styles = Object.freeze([
        '/src/styles/school-timeline.css',
        '/src/styles/controller-guide.css',
        '/src/styles/controller-guide-theme.css',
        '/src/styles/unidentified-expense-ux.css',
        '/src/styles/prontuario-operational-ux.css',
        '/src/styles/desktop-basic-monitors.css',
        '/src/styles/pendency-passive-queue.css',
        '/src/styles/operational-write-feedback.css'
    ]);
    const scripts = Object.freeze([
        // Regra crítica: "Incorreto" nunca pode cair no handler-base sem a pendência atômica.
        // Carregar primeiro impede que falhas em extensões opcionais anteriores desativem essa proteção.
        '/src/integration/atomic-analysis-pendency.js',
        '/src/domain/school-timeline.js',
        '/src/integration/school-timeline.js',
        '/src/integration/navigation-context-bootstrap.js',
        '/src/integration/controller-guide.js',
        '/src/integration/controller-guide-ready.js',
        '/src/integration/unidentified-expense-ux.js',
        '/src/integration/prontuario-operational-ux.js',
        '/src/integration/operational-readiness-bridge.js',
        '/src/integration/pendency-passive-queue-ux.js',
        '/src/integration/invoice-history-lock.js',
        '/src/integration/service-advisory-pendency.js',
        '/src/integration/service-advisory-corrective-submission.js',
        '/src/integration/critical-action-guard.js',
        '/src/integration/operational-write-diagnostics.js',
        '/src/integration/operational-write-performance.js',
        '/src/integration/prontuario-conditional-reconciler.js',
        '/src/integration/operational-write-feedback.js'
    ]);
    const criticalScripts = new Set([
        '/src/integration/atomic-analysis-pendency.js',
        '/src/integration/service-advisory-pendency.js',
        '/src/integration/service-advisory-corrective-submission.js',
        '/src/integration/critical-action-guard.js'
    ]);
    const failedScripts = new Map();

    function installCriticalExtensions() {
        const advisoryInstalled = root.RadarServiceAdvisoryPendency?.install?.(root) === true;
        const correctiveInstalled = root.RadarServiceAdvisoryCorrectiveSubmission?.install?.(root) === true;
        return advisoryInstalled && correctiveInstalled;
    }

    function waitForCriticalExtensions() {
        if (installCriticalExtensions()) return Promise.resolve(true);
        return new Promise(resolve => {
            const handleServicesReady = () => {
                if (!installCriticalExtensions()) return;
                root.removeEventListener?.('radar:application-services-ready', handleServicesReady);
                resolve(true);
            };
            root.addEventListener?.('radar:application-services-ready', handleServicesReady);
            handleServicesReady();
        });
    }

    function publishFailures() {
        const failures = [...failedScripts.entries()].map(([src, error]) => Object.freeze({
            src,
            message: String(error?.message || error || `Falha ao carregar ${src}.`)
        }));
        root.RADAR_PRODUCT_EXTENSION_FAILURES = Object.freeze(failures);
        root.RADAR_LAST_PRODUCT_EXTENSION_ERROR = failures.length > 0
            ? failedScripts.get(failures[failures.length - 1].src)
            : null;
    }

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
        let existing = Array.from(document.scripts || []).find(script => (
            script.getAttribute('src') === src
            || script.dataset?.radarProductScript === src
        ));
        if (existing?.dataset?.radarLoaded === 'true') return Promise.resolve(existing);
        if (existing?.dataset?.radarLoadFailed === 'true') {
            existing.remove?.();
            existing = null;
        }
        if (existing) {
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => {
                    existing.dataset.radarLoaded = 'true';
                    delete existing.dataset.radarLoadFailed;
                    resolve(existing);
                }, { once: true });
                existing.addEventListener('error', () => {
                    existing.dataset.radarLoadFailed = 'true';
                    reject(new Error(`Falha ao carregar ${src}.`));
                }, { once: true });
            });
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarProductScript = src;
            script.addEventListener('load', () => {
                script.dataset.radarLoaded = 'true';
                delete script.dataset.radarLoadFailed;
                resolve(script);
            }, { once: true });
            script.addEventListener('error', () => {
                script.dataset.radarLoadFailed = 'true';
                reject(new Error(`Falha ao carregar ${src}.`));
            }, { once: true });
            document.head.appendChild(script);
        });
    }

    async function loadScripts(targets) {
        for (const src of targets) {
            try {
                await loadScriptOnce(src);
                failedScripts.delete(src);
            } catch (error) {
                failedScripts.set(src, error);
                root.console?.error?.(`Não foi possível carregar a extensão ${src}.`, error);
            }
        }
        publishFailures();

        const criticalFailure = [...failedScripts.keys()].some(src => criticalScripts.has(src));
        if (criticalFailure) return false;
        return waitForCriticalExtensions();
    }

    root.RadarProductExtensionsRetry = function retryProductExtensions() {
        const retryTargets = scripts.filter(src => failedScripts.has(src));
        const retry = retryTargets.length > 0
            ? loadScripts(retryTargets)
            : waitForCriticalExtensions();
        root.RadarProductExtensionsReady = retry;
        return retry;
    };

    styles.forEach(loadStyleOnce);
    root.RadarProductExtensionsReady = loadScripts(scripts);
}(typeof window !== 'undefined' ? window : globalThis));
