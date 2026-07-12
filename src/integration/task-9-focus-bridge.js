(function installTask9FocusBridge(root) {
    'use strict';

    function install() {
        if (typeof root.getPendencyActionFocusScope !== 'function') return false;
        if (root.getPendencyActionFocusScope.__task9Enhanced) return true;

        const legacyResolver = root.getPendencyActionFocusScope.bind(root);
        function resolveTask9FocusScope(sourceContext = {}) {
            if (sourceContext.currentView === 'prontuario') {
                return legacyResolver(sourceContext);
            }

            return ['p-abertas', 'p-aguardando', 'p-resolvidas', 'p-canceladas']
                .map(panelId => document.getElementById(panelId))
                .find(panel => panel && panel.classList.contains('active')) || null;
        }
        resolveTask9FocusScope.__task9Enhanced = true;
        root.getPendencyActionFocusScope = resolveTask9FocusScope;
        root.RadarTask9FocusBridge = Object.freeze({ VERSION: '1.0.0' });
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 10);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
