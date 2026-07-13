window.RADAR_PDDE_CONFIG = {
    supabase: {
        url: "",
        publishableKey: ""
    }
};

// Carrega extensões isoladas sem modificar o arquivo principal da aplicação.
(function loadRadarExtensions() {
    function loadStylesheet(href) {
        if (document.querySelector(`link[data-radar-extension="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.radarExtension = href;
        document.head.appendChild(link);
    }

    function loadScript(src, async) {
        if (document.querySelector(`script[data-radar-extension="${src}"]`)) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = async;
        script.dataset.radarExtension = src;
        document.head.appendChild(script);
    }

    loadStylesheet('src/styles/mobile-responsive.css');
    loadStylesheet('src/styles/mobile-rendering-hotfix.css');
    loadStylesheet('src/styles/task-9-pendencias.css');
    loadStylesheet('src/styles/task-9-cross-view.css');
    loadStylesheet('src/styles/task-10-11-pendency-actions.css');
    loadStylesheet('src/styles/task-12-13-retificacoes.css');
    loadStylesheet('src/styles/cycle-b-carteira.css');
    loadStylesheet('src/styles/cycle-b-dashboard.css');
    loadStylesheet('src/styles/cycle-b-dashboard-final.css');
    loadScript('src/domain/pendencias-view-model.js', false);
    loadScript('src/domain/operational-projection.js', false);
    loadScript('src/domain/retificacoes.js', false);
    loadScript('src/integration/mobile-navigation.js', false);
    loadScript('src/integration/modal-accessibility.js', false);
    loadScript('src/integration/task-9-pendencias-page.js', false);
    loadScript('src/integration/task-9-focus-bridge.js', false);
    loadScript('src/integration/task-9-cross-view.js', false);
    loadScript('src/integration/task-10-11-pendency-actions.js', false);
    loadScript('src/integration/task-12-13-retificacoes.js', false);
    loadScript('src/integration/cycle-b-carteira.js', false);
    loadScript('src/integration/cycle-b-dashboard.js', false);
    loadScript('src/integration/task-10-alerts-competence.js', false);
    loadScript('src/integration/load-excel-export.js', true);
}());
