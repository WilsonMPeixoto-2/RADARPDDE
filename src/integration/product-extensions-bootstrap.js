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
        '/src/styles/evaluation-retification-ui.css',
        '/src/styles/sidebar-prontuario-polish.css',
        '/src/styles/global-visual-polish.css'
    ]);
    const scripts = Object.freeze([
        // Regra cr√≠tica: "Incorreto" nunca pode cair no handler-base sem a pend√™ncia at√¥mica.
        // Carregar primeiro impede que falhas em extens√µes opcionais anteriores desativem essa prote√ß√£o.
        '/src/integration/atomic-analysis-pendency.js',
        // Registros administrativos permanecem no Supabase e s√≥ entram em∂ªßq´^