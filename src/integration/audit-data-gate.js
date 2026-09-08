(function installRadarAuditDataGate(root) {
    'use strict';

    if (!root?.document || root.RadarAuditDataGate) return;

    const readiness = root.RadarApplicationReadiness || null;
    const capability = 'audit-data';
    let hydrationPromise = null;
    let rendererWrapped = false;
    let originalRenderAuditoria = null;

    readiness?.define?.(capability, {
        criticality: 'restricted',
        dependencies: ['data']
    });

    function isRemote() {
        return root.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true;
    }

    function isAuditView() {
        try {
            return typeof currentView !== 'undefined' && currentView === 'auditoria';
        } catch (_error) {
            return false;
        }
    }

    function auditState() {
        return readiness?.snapshot?.()?.[capability] || {
            status: isRemote() ? 'pending' : 'ready'
        };
    }

    function createElement(tagName, className, textContent) {
        const element = root.document.createElement(tagName);
        if (className) element.className = className;
        if (textContent != null) element.textContent = textContent;
        return element;
    }

    function renderUnavailableState(status) {
        const container = root.document.getElementById('main-container');
        if (!container) return false;
        const failed = status === 'failed' || status === 'restricted';

        const pageHeader = createElement('div', 'page-header');
        const pageTitle = createElement('div', 'page-title');
        pageTitle.append(
            createElement('h1', '', 'Registros Internos'),
            createElement('p', '', 'Histórico administrativo das operações registradas no sistema.')
        );
        pageHeader.appendChild(pageTitle);

        const panel = createElement('div', 'panel-card');
        const state = createElement('div', 'empty-state compact');
        state.setAttribute('role', failed ? 'alert' : 'status');
        state.setAttribute('aria-live', 'polite');
        state.appendChild(createElement(
            'p',
            '',
            failed
                ? 'Não foi possível carregar os registros internos com segurança.'
                : 'Carregando registros internos…'
        ));
        if (failed) {
            const retry = createElement('button', 'btn btn-secondary btn-sm', 'Tentar novamente');
            retry.type = 'button';
            retry.addEventListener('click', () => retryAuditData());
            state.appendChild(retry);
        }
        panel.appendChild(state);
        container.replaceChildren(pageHeader, panel);
        return true;
    }

    function refreshAuditView() {
        if (!isAuditView() || typeof root.renderAuditoria !== 'function') return;
        root.renderAuditoria();
    }

    function startHydration({ retry = false } = {}) {
        if (!isRemote()) {
            readiness?.markReady?.(capability);
            hydrationPromise = Promise.resolve({ ok: true, entities: ['administrativeLogs'], skipped: true });
            root.RadarAuditDataReady = hydrationPromise;
            return hydrationPromise;
        }
        if (hydrationPromise && !retry) return hydrationPromise;

        const dataService = root.RadarApplicationServices?.data;
        if (!dataService || typeof dataService.hydrateRemoteEntities !== 'function') {
            const error = new Error('Serviço de hidratação dos registros internos indisponível.');
            error.code = 'AUDIT_DATA_SERVICE_UNAVAILABLE';
            readiness?.markRestricted?.(capability, error.code);
            hydrationPromise = Promise.reject(error);
            hydrationPromise.catch(() => undefined);
            root.RadarAuditDataReady = hydrationPromise;
            return hydrationPromise;
        }

        readiness?.markPending?.(capability);
        hydrationPromise = dataService.hydrateRemoteEntities(['administrativeLogs'])
            .then(result => {
                readiness?.markReady?.(capability);
                return result;
            })
            .catch(error => {
                const code = String(error?.code || 'AUDIT_DATA_HYDRATION_FAILED');
                readiness?.markRestricted?.(capability, code);
                throw error;
            });
        hydrationPromise.catch(() => undefined);
        root.RadarAuditDataReady = hydrationPromise;
        return hydrationPromise;
    }

    function retryAuditData() {
        hydrationPromise = null;
        return startHydration({ retry: true }).finally(refreshAuditView);
    }

    function wrapRenderer() {
        if (rendererWrapped) return true;
        if (typeof root.renderAuditoria !== 'function') return false;
        originalRenderAuditoria = root.renderAuditoria.bind(root);
        root.renderAuditoria = function renderAuditoriaWithAuditDataGate(...args) {
            const state = auditState();
            if (state.status === 'ready') return originalRenderAuditoria(...args);
            return renderUnavailableState(state.status);
        };
        rendererWrapped = true;
        return true;
    }

    root.retryRadarAuditData = retryAuditData;
    root.addEventListener('radar:application-services-ready', () => {
        startHydration().catch(() => undefined);
    });
    root.addEventListener('radar:readiness-change', event => {
        if (event?.detail?.capability === capability) refreshAuditView();
    });

    if (!wrapRenderer()) {
        root.document.addEventListener('DOMContentLoaded', wrapRenderer, { once: true });
    }
    if (root.RadarApplicationServices) {
        startHydration().catch(() => undefined);
    }

    root.RadarAuditDataGate = Object.freeze({
        VERSION: '1.0.1',
        capability,
        startHydration,
        retry: retryAuditData,
        state: auditState
    });
}(typeof window !== 'undefined' ? window : globalThis));
