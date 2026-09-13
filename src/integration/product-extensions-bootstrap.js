(function installRadarProductExtensions(root) {
    'use strict';

    if (!root?.document) return;
    if (root.RadarProductExtensionsReady) {
        if (root.RadarProductExtensionsLoading === true) return;
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
        '/src/styles/operational-write-feedback.css',
        '/src/styles/layout-responsive-2026.css',
        '/src/styles/inventory-icon-refinement.css',
        '/src/styles/evaluation-retification-ui.css'
    ]);
    const scripts = Object.freeze([
        // Regra crítica: "Incorreto" nunca pode cair no handler-base sem a pendência atômica.
        // Carregar primeiro impede que falhas em extensões opcionais anteriores desativem essa proteção.
        '/src/integration/atomic-analysis-pendency.js',
        // Registros administrativos permanecem no Supabase e só entram em memória quando uma
        // superfície de histórico realmente é aberta. A timeline depende desta leitura contextual.
        '/src/integration/administrative-log-read-model.js',
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
        '/src/integration/operational-write-feedback.js',
        // Retificação é o wrapper funcional externo final: reutiliza os serviços canônicos
        // já protegidos por idempotência, histórico, diagnóstico e feedback operacional.
        '/src/integration/auditable-retification.js',
        // Retificação explícita de avaliações: desfazer bonificação e corrigir erro do operador
        // sem transformar a correção em atalho para novo envio ou reanálise.
        '/src/integration/evaluation-retification.js',
        // A UX vem por último para expor, com confirmação e feedback, apenas os comandos
        // que já foram instalados e protegidos pelas camadas de domínio/aplicação.
        '/src/integration/evaluation-retification-ui.js'
    ]);
    const criticalScripts = new Set([
        '/src/integration/atomic-analysis-pendency.js',
        '/src/integration/administrative-log-read-model.js',
        '/src/integration/service-advisory-pendency.js',
        '/src/integration/service-advisory-corrective-submission.js',
        '/src/integration/critical-action-guard.js',
        '/src/integration/auditable-retification.js',
        '/src/integration/evaluation-retification.js',
        '/src/integration/evaluation-retification-ui.js'
    ]);
    const failedScripts = new Map();

    function administrativeLogReadRequired() {
        const repositoryFactory = root.RadarRepositoryFactory;
        if (typeof repositoryFactory?.isSupabaseExplicitlyEnabled === 'function') {
            return repositoryFactory.isSupabaseExplicitlyEnabled(root.RADAR_PDDE_CONFIG || {}) === true;
        }
        try {
            const repository = root.RadarDataContext?.dataService?.repository
                || root.RadarDataContext?.repository
                || null;
            return repository?.capabilities?.().remote === true;
        } catch (_error) {
            return false;
        }
    }

    function installCriticalExtensions() {
        const administrativeLogReadInstalled = !administrativeLogReadRequired()
            || root.RadarAdministrativeLogReadModel?.install?.(root) === true;
        const advisoryInstalled = root.RadarServiceAdvisoryPendency?.install?.(root) === true;
        const correctiveInstalled = root.RadarServiceAdvisoryCorrectiveSubmission?.install?.(root) === true;
        const retificationInstalled = root.RadarAuditableRetification?.install?.(root) === true;
        const evaluationRetificationInstalled = root.RadarEvaluationRetification?.install?.(root) === true;
        const evaluationRetificationUiInstalled = root.RadarEvaluationRetificationUi?.install?.(root) === true;
        return administrativeLogReadInstalled
            && advisoryInstalled
            && correctiveInstalled
            && retificationInstalled
            && evaluationRetificationInstalled
            && evaluationRetificationUiInstalled;
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

        const failedCritical = [...failedScripts.keys()].find(src => criticalScripts.has(src));
        if (failedCritical) {
            throw failedScripts.get(failedCritical)
                || new Error(`Falha ao carregar extensão crítica ${failedCritical}.`);
        }
        return true;
    }

    function completeLoad(targets) {
        return loadScripts(targets)
            .then(() => waitForCriticalExtensions())
            .then(() => failedScripts.size === 0)
            .catch(error => {
                root.RADAR_LAST_PRODUCT_EXTENSION_ERROR = error;
                root.console?.error?.('Não foi possível inicializar as extensões críticas do RADAR.', error);
                return false;
            });
    }

    function startLoad(targets) {
        if (root.RadarProductExtensionsLoading === true && root.RadarProductExtensionsReady) {
            return root.RadarProductExtensionsReady;
        }
        root.RadarProductExtensionsLoading = true;
        let run = null;
        run = completeLoad(targets).finally(() => {
            if (root.RadarProductExtensionsReady === run) {
                root.RadarProductExtensionsLoading = false;
            }
        });
        root.RadarProductExtensionsReady = run;
        return run;
    }

    root.RadarProductExtensionsRetry = function retryProductExtensions() {
        if (root.RadarProductExtensionsLoading === true) {
            return root.RadarProductExtensionsReady;
        }
        const retryTargets = scripts.filter(src => failedScripts.has(src));
        if (retryTargets.length === 0) return root.RadarProductExtensionsReady;
        return startLoad(retryTargets);
    };

    styles.forEach(loadStyleOnce);
    startLoad(scripts);
}(typeof window !== 'undefined' ? window : globalThis));
