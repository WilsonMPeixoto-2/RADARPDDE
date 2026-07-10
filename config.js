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
    loadScript('src/integration/mobile-navigation.js', false);
    loadScript('src/integration/load-excel-export.js', true);
}());
