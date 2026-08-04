(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelExportIntegration = api;
    if (root && root.document) api.install();
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '0.5.0';
    const SME_COMPETENCE_SELECTOR = 'select[data-radar-sme-competence="true"], select[onchange*="changeSMEMonth"]';
    const ASSISTANT_DASHBOARD_TITLE = 'Painel do Assistente de Verbas Federais';
    const ASSISTANT_EXPORT_GROUP_SELECTOR = '[data-radar-assistant-export-actions="true"]';
    let installed = false;
    let legacyExport = null;
    let observer = null;
    let installedRoot = null;
    let documentChangeHandler = null;

    function formatActiveCompetence(value) {
        const text = String(value || 'TODAS');
        const match = /^(\d{4})-(\d{2})$/.exec(text);
        return match ? `${match[2]}-${match[1]}` : text.replace(/[^0-9A-Za-z_-]+/g, '_');
    }

    function isMonthlyCompetence(value) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '').trim());
    }

    function createSmeError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) error.details = details;
        return error;
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
            pendencias: typeof pendencias !== 'undefined' && Array.isArray(pendencias) ? pendencias : [],
            activeCompetenciaKey: typeof activeCompetenciaKey !== 'undefined' ? activeCompetenciaKey : 'TODAS'
        };
    }

    function normalizeProfile(value) {
        const normalized = String(value || '')
            .trim()
            .toLocaleLowerCase('pt-BR')
            .replace(/\s+/g, ' ');
        const aliases = {
            federal_assistant: 'assistente',
            'assistente cre': 'assistente',
            'assistente de verbas federais': 'assistente'
        };
        return aliases[normalized] || normalized;
    }

    function resolveEffectiveProfile(options = {}) {
        let profile = options.profile || '';
        if (!profile && root && typeof root.getRadarAccessProfile === 'function') {
            try {
                profile = root.getRadarAccessProfile();
            } catch (error) {
                profile = '';
            }
        }
        if (!profile && typeof getRadarAccessProfile === 'function') {
            try {
                profile = getRadarAccessProfile();
            } catch (error) {
                profile = '';
            }
        }
        if (!profile && root?.currentProfile) profile = root.currentProfile;
        const policy = root?.RadarAccessPolicy;
        if (policy && typeof policy.normalizeProfile === 'function') {
            return policy.normalizeProfile(profile);
        }
        return normalizeProfile(profile);
    }

    function getAssistantDashboardHeader(documentRef = root?.document || null) {
        if (!documentRef || typeof documentRef.querySelector !== 'function') return null;
        const header = documentRef.querySelector('#main-container .page-header');
        if (!header) return null;
        const title = typeof header.querySelector === 'function'
            ? header.querySelector('.page-title h1')
            : documentRef.querySelector('#main-container .page-header .page-title h1');
        if (String(title?.textContent || '').trim() !== ASSISTANT_DASHBOARD_TITLE) return null;
        return header;
    }

    function isAssistantDashboard(documentRef = root?.document || null, profile = '') {
        return normalizeProfile(profile) === 'assistente'
            && Boolean(getAssistantDashboardHeader(documentRef));
    }

    function isElementVisible(element, documentRef = root?.document || null) {
        if (!element || element.hidden === true) return false;
        if (element.getAttribute?.('aria-hidden') === 'true') return false;
        if (element.style?.display === 'none' || element.style?.visibility === 'hidden') return false;
        const view = documentRef?.defaultView || root;
        if (typeof view?.getComputedStyle === 'function') {
            const style = view.getComputedStyle(element);
            if (style?.display === 'none' || style?.visibility === 'hidden') return false;
        }
        return true;
    }

    function findVisibleSmeCompetenceSelects(documentRef = root?.document || null) {
        if (!documentRef || typeof documentRef.querySelectorAll !== 'function') return [];
        const candidates = [...documentRef.querySelectorAll(SME_COMPETENCE_SELECTOR)];
        const unique = [...new Set(candidates)];
        return unique.filter(element => isElementVisible(element, documentRef));
    }

    function competenceResolution(ok, competenceKey, code = null, message = '') {
        return Object.freeze({ ok, competenceKey, code, message });
    }

    function resolveSmeCompetence(state = {}, documentRef = root?.document || null) {
        const stateKey = isMonthlyCompetence(state.activeCompetenciaKey)
            ? String(state.activeCompetenciaKey).trim()
            : null;
        const selects = findVisibleSmeCompetenceSelects(documentRef);

        if (selects.length > 1) {
            return competenceResolution(
                false,
                null,
                'SME_COMPETENCE_AMBIGUOUS',
                'Há mais de um seletor mensal SME visível. Atualize a tela e selecione novamente o mês.'
            );
        }

        const select = selects[0] || null;
        if (select?.dataset) select.dataset.radarSmeCompetence = 'true';
        const selectedKey = isMonthlyCompetence(select?.value)
            ? String(select.value).trim()
            : null;

        if (stateKey && selectedKey && stateKey !== selectedKey) {
            return competenceResolution(
                false,
                null,
                'SME_COMPETENCE_MISMATCH',
                'A competência exibida não corresponde ao estado atual. Selecione novamente o mês antes de gerar o Excel SME.'
            );
        }

        const competenceKey = stateKey || selectedKey;
        if (!competenceKey) {
            return competenceResolution(
                false,
                null,
                'SME_INVALID_COMPETENCE',
                'Selecione uma competência mensal para gerar o Excel SME.'
            );
        }

        return competenceResolution(true, competenceKey, null, '');
    }

    function normalizeSmeState(state = getBrowserState(), documentRef = root?.document || null) {
        const resolution = resolveSmeCompetence(state, documentRef);
        if (!resolution.ok || resolution.competenceKey === state.activeCompetenciaKey) return state;
        return {
            ...state,
            activeCompetenciaKey: resolution.competenceKey
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

    function resolveSmeDependencies(overrides = {}) {
        const modelApi = overrides.modelApi || root.RadarExcelSmeExportModel;
        const rendererApi = overrides.rendererApi || root.RadarExcelSmeMonthlyRenderer;
        const runtimeLoader = overrides.runtimeLoader || root.RadarExcelSmeRuntimeLoader || null;
        if (!modelApi || typeof modelApi.buildSmeMonthlyModel !== 'function') {
            throw new Error('Modelo mensal do Excel SME não foi carregado.');
        }
        if (!rendererApi || typeof rendererApi.downloadWorkbook !== 'function') {
            throw new Error('Renderizador mensal do Excel SME não foi carregado.');
        }
        if (runtimeLoader && typeof runtimeLoader.loadExcelSmeRuntime !== 'function') {
            throw new Error('Carregador sob demanda do Excel SME é inválido.');
        }
        return { modelApi, rendererApi, runtimeLoader };
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

    function createSmeExportArtifacts(state, options = {}, dependencyOverrides = {}) {
        const dependencies = resolveSmeDependencies(dependencyOverrides);
        const model = dependencies.modelApi.buildSmeMonthlyModel({
            escolas: state.escolas,
            programas: state.programas,
            verificacoes: state.verificacoes,
            pendencias: state.pendencias,
            activeCompetenciaKey: state.activeCompetenciaKey
        });
        const fileName = options.fileName || model.fileName;
        return { model, fileName, dependencies };
    }

    function notify(message) {
        if (root && typeof root.alert === 'function') root.alert(message);
    }

    function ask(message) {
        return root && typeof root.confirm === 'function' ? root.confirm(message) : false;
    }

    function logExport(action, details) {
        if (typeof registerLog === 'function') {
            registerLog(action, details);
            if (typeof persist === 'function') persist('logs');
        }
    }

    function exportXlsx(options = {}) {
        try {
            const state = options.state || getBrowserState();
            const artifacts = createExportArtifacts(state, options, options.dependencies || {});
            const result = artifacts.dependencies.rendererApi.downloadWorkbook(artifacts.plan);
            logExport('Relatório Excel Exportado', `Arquivo ${artifacts.fileName} gerado com ${artifacts.model.base.rows.length} registros consolidados e quatro abas.`);
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

    async function exportSmeXlsx(options = {}) {
        try {
            const rawState = options.state || getBrowserState();
            const resolution = resolveSmeCompetence(rawState, options.document || root?.document || null);
            if (!resolution.ok) {
                throw createSmeError(resolution.code, resolution.message);
            }
            const state = Object.freeze({
                ...rawState,
                activeCompetenciaKey: resolution.competenceKey
            });
            const artifacts = createSmeExportArtifacts(state, options, options.dependencies || {});
            if (artifacts.model.competenceKey !== resolution.competenceKey) {
                throw createSmeError(
                    'SME_COMPETENCE_MISMATCH',
                    'A competência do modelo não corresponde à competência selecionada.'
                );
            }
            const runtime = options.runtime || (artifacts.dependencies.runtimeLoader
                ? await artifacts.dependencies.runtimeLoader.loadExcelSmeRuntime()
                : {});
            const result = await artifacts.dependencies.rendererApi.downloadWorkbook(artifacts.model, {
                ...options,
                ...runtime,
                fileName: artifacts.fileName
            });
            logExport(
                'Relatório Excel SME Exportado',
                `Arquivo ${artifacts.fileName} gerado para ${artifacts.model.sheetName} com ${artifacts.model.rows.length} unidades escolares.`
            );
            return { ok: true, competenceResolution: resolution, ...artifacts, download: result };
        } catch (error) {
            console.error('[RADAR PDDE] Falha ao gerar o Excel SME mensal.', error);
            notify(error && error.message ? error.message : 'Não foi possível gerar o Excel SME.');
            return { ok: false, error };
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

    function updateSmeButtonState(button, competenceKey, unavailableMessage = '') {
        if (!button) return false;
        const enabled = isMonthlyCompetence(competenceKey);
        button.disabled = !enabled;
        button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
        button.dataset.radarCompetenceKey = String(competenceKey || 'TODAS');
        button.title = enabled
            ? `Gerar relatório no modelo Excel da SME para ${formatActiveCompetence(competenceKey)}`
            : (unavailableMessage || 'Selecione uma competência mensal para gerar o Excel SME');
        return enabled;
    }

    function createSmeButton(primaryButton, options = {}) {
        const documentRef = options.document || root?.document || null;
        const getState = typeof options.getState === 'function' ? options.getState : getBrowserState;
        const exportAction = typeof options.exportAction === 'function' ? options.exportAction : exportSmeXlsx;
        const button = primaryButton.cloneNode(false);
        button.removeAttribute('onclick');
        button.type = 'button';
        delete button.dataset.radarXlsxEnhanced;
        button.dataset.radarSmeExport = 'true';
        button.dataset.radarExportFormat = 'xlsx-sme';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
        button.textContent = 'Excel SME';
        button.setAttribute('aria-label', 'Gerar relatório no modelo Excel da SME');
        const initialResolution = resolveSmeCompetence(getState(), documentRef);
        updateSmeButtonState(
            button,
            initialResolution.competenceKey,
            initialResolution.message
        );
        button.addEventListener('click', async () => {
            if (button.dataset.radarBusy === 'true') return;
            const rawState = getState();
            const resolution = resolveSmeCompetence(rawState, documentRef);
            if (!updateSmeButtonState(button, resolution.competenceKey, resolution.message)) {
                notify(resolution.message || 'Selecione uma competência mensal para gerar o Excel SME.');
                return;
            }
            const state = Object.freeze({
                ...rawState,
                activeCompetenciaKey: resolution.competenceKey
            });
            const originalText = button.textContent;
            button.dataset.radarBusy = 'true';
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.textContent = 'Gerando Excel SME…';
            try {
                await exportAction({ state, document: documentRef });
            } finally {
                button.dataset.radarBusy = 'false';
                button.removeAttribute('aria-busy');
                button.textContent = originalText;
                const refreshedResolution = resolveSmeCompetence(getState(), documentRef);
                updateSmeButtonState(
                    button,
                    refreshedResolution.competenceKey,
                    refreshedResolution.message
                );
            }
        });
        return button;
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

    function createAssistantInstitutionalButton(documentRef, options = {}) {
        if (!documentRef || typeof documentRef.createElement !== 'function') return null;
        const getState = typeof options.getState === 'function' ? options.getState : getBrowserState;
        const exportAction = typeof options.exportAction === 'function' ? options.exportAction : exportXlsx;
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.dataset.radarAssistantExport = 'institutional';
        button.dataset.radarExportFormat = 'xlsx';
        button.textContent = 'Relatório RADAR PDDE';
        button.title = 'Gerar o relatório institucional RADAR PDDE em formato Excel';
        button.setAttribute('aria-label', 'Gerar relatório RADAR PDDE em formato Excel');
        button.addEventListener('click', async () => {
            if (button.dataset.radarBusy === 'true') return;
            const originalText = button.textContent;
            button.dataset.radarBusy = 'true';
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.textContent = 'Gerando relatório…';
            try {
                await Promise.resolve(exportAction({ state: getState() }));
            } finally {
                button.dataset.radarBusy = 'false';
                button.disabled = false;
                button.removeAttribute('aria-busy');
                button.textContent = originalText;
            }
        });
        return button;
    }

    function createAssistantExportActions(documentRef, options = {}) {
        if (!documentRef || typeof documentRef.createElement !== 'function') return null;
        const getState = typeof options.getState === 'function' ? options.getState : getBrowserState;
        const group = documentRef.createElement('div');
        group.dataset.radarAssistantExportActions = 'true';
        group.className = 'radar-assistant-export-actions';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Exportações em Excel');
        group.style.display = 'flex';
        group.style.gap = '8px';
        group.style.flexWrap = 'wrap';
        group.style.justifyContent = 'flex-end';
        group.style.alignItems = 'center';

        const institutionalButton = createAssistantInstitutionalButton(documentRef, {
            getState,
            exportAction: options.exportInstitutional
        });
        const smeButton = createSmeButton(institutionalButton, {
            document: documentRef,
            getState,
            exportAction: options.exportSme
        });
        smeButton.dataset.radarAssistantExport = 'sme';
        group.append(institutionalButton, smeButton);
        return group;
    }

    function removeAssistantExportActions(documentRef = root?.document || null) {
        if (!documentRef || typeof documentRef.querySelector !== 'function') return false;
        const group = documentRef.querySelector(ASSISTANT_EXPORT_GROUP_SELECTOR);
        if (!group) return false;
        group.remove();
        return true;
    }

    function ensureAssistantExportActions(options = {}) {
        const documentRef = options.document || root?.document || null;
        const profile = resolveEffectiveProfile(options);
        if (!isAssistantDashboard(documentRef, profile)) {
            removeAssistantExportActions(documentRef);
            return null;
        }

        const header = getAssistantDashboardHeader(documentRef);
        let group = typeof header.querySelector === 'function'
            ? header.querySelector(ASSISTANT_EXPORT_GROUP_SELECTOR)
            : null;
        if (!group) {
            group = createAssistantExportActions(documentRef, options);
            header.appendChild(group);
        }

        const getState = typeof options.getState === 'function' ? options.getState : getBrowserState;
        const resolution = resolveSmeCompetence(getState(), documentRef);
        const smeButton = group.querySelector('[data-radar-assistant-export="sme"]');
        updateSmeButtonState(smeButton, resolution.competenceKey, resolution.message);
        return group;
    }

    function enhanceExportButtons() {
        if (!root.document) return;
        const resolution = resolveSmeCompetence(getBrowserState(), root.document);
        const buttons = root.document.querySelectorAll('[onclick*="exportDataExcel"]');
        buttons.forEach(button => {
            if (button.dataset.radarXlsxEnhanced !== 'true') configurePrimaryButton(button);
            let smeButton = button.nextElementSibling;
            if (!smeButton || smeButton.dataset.radarSmeExport !== 'true') {
                smeButton = createSmeButton(button);
                button.insertAdjacentElement('afterend', smeButton);
            }
            updateSmeButtonState(smeButton, resolution.competenceKey, resolution.message);
            const csvCandidate = smeButton.nextElementSibling;
            if (!csvCandidate || csvCandidate.dataset.radarCsvFallback !== 'true') {
                smeButton.insertAdjacentElement('afterend', createCsvButton(button));
            }
        });
        ensureAssistantExportActions();
    }

    function install(options = {}) {
        if (installed) return true;
        const target = options.root || root;
        if (!target) return false;
        legacyExport = options.legacyExport || (typeof target.exportDataExcel === 'function' ? target.exportDataExcel.bind(target) : null);
        installedRoot = target;
        target.exportDataCsvLegacy = exportCsvLegacy;
        target.exportDataExcelSme = () => exportSmeXlsx();
        target.exportDataExcel = () => exportXlsx();
        installed = true;

        if (target.document) {
            enhanceExportButtons();
            const Observer = target.MutationObserver;
            if (typeof Observer === 'function') {
                observer = new Observer(enhanceExportButtons);
                observer.observe(target.document.body || target.document.documentElement, { childList: true, subtree: true });
            }
            documentChangeHandler = () => target.setTimeout(enhanceExportButtons, 0);
            target.document.addEventListener('change', documentChangeHandler, true);
            target.addEventListener?.('radar:competence-change', documentChangeHandler);
        }
        return true;
    }

    function uninstall() {
        if (!installed) return false;
        if (installedRoot && legacyExport) installedRoot.exportDataExcel = legacyExport;
        if (installedRoot) {
            delete installedRoot.exportDataExcelSme;
            delete installedRoot.exportDataCsvLegacy;
            if (documentChangeHandler && installedRoot.document) {
                installedRoot.document.removeEventListener('change', documentChangeHandler, true);
                installedRoot.removeEventListener?.('radar:competence-change', documentChangeHandler);
            }
            removeAssistantExportActions(installedRoot.document);
        }
        if (observer) observer.disconnect();
        observer = null;
        documentChangeHandler = null;
        installed = false;
        installedRoot = null;
        return true;
    }

    return Object.freeze({
        ASSISTANT_DASHBOARD_TITLE,
        ASSISTANT_EXPORT_GROUP_SELECTOR,
        SME_COMPETENCE_SELECTOR,
        VERSION,
        buildFileName,
        configurePrimaryButton,
        createAssistantExportActions,
        createAssistantInstitutionalButton,
        createExportArtifacts,
        createSmeButton,
        createSmeError,
        createSmeExportArtifacts,
        enhanceExportButtons,
        ensureAssistantExportActions,
        exportCsvLegacy,
        exportSmeXlsx,
        exportXlsx,
        findVisibleSmeCompetenceSelects,
        formatActiveCompetence,
        getAssistantDashboardHeader,
        install,
        isAssistantDashboard,
        isElementVisible,
        isMonthlyCompetence,
        normalizeProfile,
        normalizeSmeState,
        removeAssistantExportActions,
        resolveEffectiveProfile,
        resolveSmeCompetence,
        uninstall,
        updateSmeButtonState
    });
}));