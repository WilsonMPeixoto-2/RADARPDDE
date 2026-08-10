(function finalizeRadarControllerGuide(root) {
    'use strict';

    if (!root?.RadarControllerGuide || !root.document) return;

    function isGuideNavigationTarget(target) {
        return Boolean(target?.closest?.('#nav-guia-controlador'));
    }

    function openGuide(event) {
        if (!isGuideNavigationTarget(event.target)) return;
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        root.RadarControllerGuide?.render?.();
    }

    function bindDirectEntry() {
        if (root.__radarControllerGuideDirectEntryInstalled) return;
        root.document.addEventListener('click', openGuide, true);
        root.document.addEventListener('keydown', openGuide, true);
        root.__radarControllerGuideDirectEntryInstalled = true;
    }

    // A ajuda não é uma rota operacional. A entrada direta precisa existir assim
    // que o item do Guia estiver disponível, sem depender da inicialização tardia
    // da navegação contextual. A reinstalação posterior continua idempotente.
    bindDirectEntry();

    Promise.resolve(root.RadarNavigationContextReady)
        .catch(() => false)
        .then(() => {
            root.RadarControllerGuide?.install?.();
        });
}(typeof window !== 'undefined' ? window : globalThis));
