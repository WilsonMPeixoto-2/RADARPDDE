(function finalizeRadarControllerGuide(root) {
    'use strict';

    if (!root?.RadarControllerGuide || !root.document) return;

    function markAuxiliaryNavigation() {
        const item = root.document.querySelector('#nav-guia-controlador');
        if (!item) return false;
        item.dataset.radarAuxiliaryNavigation = 'true';
        return true;
    }

    // O Guia é uma superfície de ajuda, não uma rota operacional. A marca impede
    // que a camada global de transições converta o clique em navegação de rota.
    markAuxiliaryNavigation();

    Promise.resolve(root.RadarNavigationContextReady)
        .catch(() => false)
        .then(() => {
            root.RadarControllerGuide?.install?.();
            markAuxiliaryNavigation();
        });

    root.addEventListener?.('radar:auth-ready', () => {
        root.setTimeout?.(markAuxiliaryNavigation, 0);
    });
}(typeof window !== 'undefined' ? window : globalThis));
