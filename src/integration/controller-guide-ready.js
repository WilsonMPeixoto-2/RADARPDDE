(function finalizeRadarControllerGuide(root) {
    'use strict';

    if (!root?.RadarControllerGuide || !root.document) return;

    const GUIDE_ROOT_SELECTOR = '#controller-guide-root';
    const GUIDE_INTERNAL_LINK_SELECTOR = `${GUIDE_ROOT_SELECTOR} a[href^="#guia-"], ${GUIDE_ROOT_SELECTOR} [data-guide-target]`;

    function markAuxiliaryNavigation() {
        const item = root.document.querySelector('#nav-guia-controlador');
        if (!item) return false;
        item.dataset.radarAuxiliaryNavigation = 'true';
        return true;
    }

    function scrollToGuideTarget(link) {
        const targetId = String(link?.dataset?.guideTarget || '').trim();
        if (!targetId) return false;
        const target = root.document.getElementById(targetId);
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    }

    function normalizeGuideInternalLink(link) {
        if (!link) return false;

        const href = String(link.getAttribute('href') || '').trim();
        if (href.startsWith('#guia-')) {
            link.setAttribute('data-guide-target', href.slice(1));
            link.removeAttribute('href');
            link.setAttribute('role', 'button');
            if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
        }

        if (!link.dataset?.guideTarget || link.dataset.guideNavigationBound === 'true') return false;
        link.dataset.guideNavigationBound = 'true';

        link.addEventListener('click', event => {
            event.preventDefault();
            scrollToGuideTarget(link);
        });
        link.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            scrollToGuideTarget(link);
        });
        return true;
    }

    function prepareGuideInternalNavigation() {
        root.document.querySelectorAll(GUIDE_INTERNAL_LINK_SELECTOR).forEach(normalizeGuideInternalLink);
    }

    // O Guia é uma superfície de ajuda, não uma rota operacional. A marca impede
    // que a camada global de transições converta o clique em navegação de rota.
    markAuxiliaryNavigation();
    prepareGuideInternalNavigation();

    const main = root.document.querySelector('#main-container');
    if (main && typeof MutationObserver === 'function') {
        new MutationObserver(() => {
            markAuxiliaryNavigation();
            prepareGuideInternalNavigation();
        }).observe(main, { childList: true, subtree: true });
    }

    Promise.resolve(root.RadarNavigationContextReady)
        .catch(() => false)
        .then(() => {
            root.RadarControllerGuide?.install?.();
            markAuxiliaryNavigation();
            prepareGuideInternalNavigation();
        });

    root.addEventListener?.('radar:auth-ready', () => {
        root.setTimeout?.(() => {
            markAuxiliaryNavigation();
            prepareGuideInternalNavigation();
        }, 0);
    });
}(typeof window !== 'undefined' ? window : globalThis));
