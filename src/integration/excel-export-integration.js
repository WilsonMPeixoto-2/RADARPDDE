(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelExportIntegration = api;
    if (root && root.document) api.install();
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '0.1.0';
    let installed = false;
    let legacyExport = null;
    let observer = null;
    let installedRoot = null;

    function formatActiveCompetence(value) {
        const text = String(value || 'TODAS');
        const match = /^(\d{4})-(\d{2})$/.exec(text);
        return match ? `${match[2]}-${match[1]}` : text.replace(/[^0-9A-Za-z_-]+/g, '_');
    }

    function buildFileName(activeCompetence) {
        return `RADAR_PDDE_BONIFICACOES_${formatActiveCompetence(activeCompetence)}.xlsx`;
    }

    function getBrowserState() {
        return {
            escolas: typeof escolas !== 'undefined' && Array.isArray(escolas) ? escolas : [],
            competencias: typeof COMPETENCIAS !== 'undefined' && Array.isArray(COMPETENCIAS) ? COMPETENCIAS : [],
            programas: typeof programas !== 'undefined' && Array.isArray(programas) ? programas : [],
            verificacoes: typeof verificacoes !== 'undefined' && verificacoes ? verificacoes : {},
            activeCompetenciaKey: typeof activeCompetenciaKey !== 'undefined' ? activeCompetenciaKey : 'TODAS'
        };
    }

    function resolveDependencies(overrides = {}) {
        const modelApi = overrides.modelApi || root.RadarExcelExportModel;
        const planApi = overrides.planApi || root.RadarExcelWorkbookPlan;
        const rendererApi = overrides.rendererApi || root.RadarExcelXlsxRenderer;
        if (!modelApi || typeof modelApi.buildExportModel !== 'function') throw new Error('Modelo de exportação Excel não foi carregado.');
        if (!planApi || typeof planApi.createWorkbookPlan !== 'function') throw new Error('Plano do workbook Excel não foi carregado.');
        if (!rendererApi || typeof rendererApi.downloadWorkbook !== 'function') throw new Error('Renderizador XLSX não foi carregado.');
        return { modelApi, planApi, rendererApi };
    }

    function createExportArtifacts(state, options = {}, dependencyOverrides = {}) {
        const dependencies = resolveDependencies(dependencyOverrides);
        const model = dependencies.modelApi.buildExportModel({
            escolas: state.escolas,
            competencias: state.competencias,
            programas: state.programas,
            verificacoes: state.verificacoes
        });
        if (!model.equivalence || model.equivalence.equivalent !== true) {
            throw new Error('A exportação foi bloqueada: o novo Excel diverge do relatório CSV original.');
        }
        if (!model.base.rows.length) {
            const error = new Error('Não há bonificações consolidadas para exportar.');
            error.code = 'NO_CONSOLIDATED_ROWS';
            throw error;
        }
        const fileName = options.fileName || buildFileName(state.activeCompetenciaKey);
        const plan = dependencies.planApi.createWorkbookPlan(model, {
            generatedAt: options.generatedAt || new Date(),
            source: options.source || 'Dados ativos no RADAR PDDE',
            temporalScope: options.temporalScope || 'Todas as competências consolidadas',
            fileName
        });
        return { model, plan, fileName, dependencies };
    }

    function notify(message) {
        if (root && typeof root.alert === 'function') root.alert(message);
    }

    function ask(message) {
        return root && typeof root.confirm === 'function' ? root.confirm(message) : false;
    }

    function logExport(details) {
        if (typeof registerLog === 'function') {
            registerLog('Relatório Excel Exportado', details);
            if (typeof persist === 'function') persist('logs');
        }
    }

    function exportXlsx(options = {}) {
        try {
            const state = options.state || getBrowserState();
            const artifacts = createExportArtifacts(state, options, options.dependencies || {});
            const result = artifacts.dependencies.rendererApi.downloadWorkbook(artifacts.plan);
            logExport(`Arquivo ${artifacts.fileName} gerado com ${artifacts.model.base.rows.length} registros consolidados e quatro abas.`);
            return { ok: true, ...artifacts, download: result };
        } catch (error) {
            console.error('[RADAR PDDE] Falha ao gerar o arquivo XLSX.', error);
            if (error && error.code === 'NO_CONSOLIDATED_ROWS') {
                notify(error.message);
                return { ok: false, error };
            }
            const fallback = legacyExport && ask('Não foi possível gerar o novo arquivo Excel. Deseja baixar o CSV legado como alternativa de segurança?');
            if (fallback) legacyExport();
            else notify(`Não foi possível gerar o arquivo Excel. ${error && error.message ? error.message : ''}`.trim());
            return { ok: false, error, fallbackUsed: Boolean(fallback) };
        }
    }

    function exportCsvLegacy() {
        if (typeof legacyExport !== 'function') {
            notify('A exportação CSV legada não está disponível.');
            return false;
        }
        legacyExport();
        return true;
    }

    const PRIMARY_BUTTON_HTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Gerar relatório Excel (.xlsx)</span>
    `;

    function configurePrimaryButton(button) {
        if (!button) return false;
        button.dataset.radarXlsxEnhanced = 'true';
        button.dataset.radarExportFormat = 'xlsx';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
        button.innerHTML = PRIMARY_BUTTON_HTML;
        button.title = 'Gerar relatório institucional Excel com as abas BONIFICACOES, SINTESE, QUALIDADE_DADOS e METADADOS';
        button.setAttribute('aria-label', 'Gerar relatório Excel completo em formato XLSX');
        return true;
    }

    function createCsvButton(primaryButton) {
        const button = primaryButton.cloneNode(false);
        button.removeAttribute('onclick');
        button.type = 'button';
        delete button.dataset.radarXlsxEnhanced;
        button.dataset.radarCsvFallback = 'true';
        button.dataset.radarExportFormat = 'csv';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
        button.textContent = 'CSV';
        button.title = 'Baixar o relatório no formato CSV legado';
        button.setAttribute('aria-label', 'Baixar CSV legado');
        button.addEventListener('click', exportCsvLegacy);
        return button;
    }

    function enhanceExportButtons() {
        if (!root.document) return;
        const buttons = root.document.querySelectorAll('[onclick*="exportDataExcel"]');
        buttons.forEach(button => {
            if (button.dataset.radarXlsxEnhanced === 'true') return;
            configurePrimaryButton(button);
            const next = button.nextElementSibling;
            if (!next || next.dataset.radarCsvFallback !== 'true') {
                button.insertAdjacentElement('afterend', createCsvButton(button));
            }
        });
    }

    function install(options = {}) {
        if (installed) return true;
        const target = options.root || root;
        if (!target) return false;
        legacyExport = options.legacyExport || (typeof target.exportDataExcel === 'function' ? target.exportDataExcel.bind(target) : null);
        installedRoot = target;
        target.exportDataCsvLegacy = exportCsvLegacy;
        target.exportDataExcel = () => exportXlsx();
        installed = true;

        if (target.document) {
            enhanceExportButtons();
            const Observer = target.MutationObserver;
            if (typeof Observer === 'function') {
                observer = new Observer(enhanceExportButtons);
                observer.observe(target.document.body || target.document.documentElement, { childList: true, subtree: true });
            }
        }
        return true;
    }

    function uninstall() {
        if (!installed) return false;
        if (installedRoot && legacyExport) installedRoot.exportDataExcel = legacyExport;
        if (observer) observer.disconnect();
        observer = null;
        installed = false;
        installedRoot = null;
        return true;
    }

    return Object.freeze({
        VERSION,
        buildFileName,
        configurePrimaryButton,
        createExportArtifacts,
        enhanceExportButtons,
        exportCsvLegacy,
        exportXlsx,
        formatActiveCompetence,
        install,
        uninstall
    });
}));
