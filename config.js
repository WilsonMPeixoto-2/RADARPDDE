window.RADAR_PDDE_CONFIG = {
    supabase: {
        url: "",
        publishableKey: ""
    }
};

// Carrega extensões isoladas sem modificar o arquivo principal da aplicação.
(function loadRadarExtensions() {
    const script = document.createElement('script');
    script.src = 'src/integration/load-excel-export.js';
    script.async = true;
    document.head.appendChild(script);
}());
