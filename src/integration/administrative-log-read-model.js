(function installRadarAdministrativeLogReadModel(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (!root) return;

    root.RadarAdministrativeLogReadModel = Object.freeze(api);

    const tryInstall = () => api.install(root);
    if (!tryInstall() && typeof root.addEventListener === 'function') {
        const onServicesReady = () => {
            if (!tryInstall()) return;
            root.removeEventListener('radar:application-services-ready', onServicesReady);
        };
        root.addEventListener('radar:application-services-ready', onServicesReady);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createAdministrativeLogReadModelApi() {
    'use strict';

    const DEFAULT_PAGE_SIZE = 100;
    const MAX_PAGE_SIZE = 200;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function pageSize(value) {
        const requested = Number.isInteger(value) && value > 0 ? value : DEFAULT_PAGE_SIZE;
        return Math.min(requested, MAX_PAGE_SIZE);
    }

    function clone(value) {
        if (typeof structuredClone === 'function') return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }

    function createCollectionState() {
        return {
            records: [],
            cursor: null,
            hasMore: false,
            loaded: false,
            loadingPromise: null
        };
    }

    function mergeRecords(current, incoming) {
        const byId = new Map();
        [...current, ...incoming].forEach(record => {
            const id = text(record?.id);
            if (!id || byId.has(id)) return;
            byId.set(id, clone(record));
        });
        return [...byId.values()];
    }

    function publicState(state) {
        return Object.freeze({
            records: clone(state.records),
            cursor: state.cursor ? clone(state.cursor) : null,
            hasMore: state.hasMore === true,
            loaded: state.loaded === true,
            loading: Boolean(state.loadingPromise)
        });
    }

    function createAdministrativeLogReadModel(options = {}) {
        const dataService = options.dataService;
        const repository = dataService?.repository;
        const statePort = dataService?.statePort;
        if (!repository || typeof repository.queryAdministrativeLogs !== 'function') {
            throw new Error('O repositório remoto não oferece leitura contextual de registros internos.');
        }
        if (!statePort || typeof statePort.applyEntities !== 'function') {
            throw new Error('A porta de estado incremental é obrigatória para registros internos.');
        }

        const limit = pageSize(options.pageSize);
        const getAuditActorUserId = typeof options.getAuditActorUserId === 'function'
            ? options.getAuditActorUserId
            : () => '';
        const audit = createCollectionState();
        const schools = new Map();

        async function applyRecords(records, source) {
            const snapshot = {
                entities: {
                    administrativeLogs: clone(records)
                }
            };
            await statePort.applyEntities(snapshot, ['administrativeLogs'], {
                persistStorage: false,
                source
            });
        }

        async function loadCollection(state, queryOptions, optionsForLoad = {}) {
            const append = optionsForLoad.append === true;
            const source = text(optionsForLoad.source) || 'administrative-log-read';

            if (state.loadingPromise) return state.loadingPromise;
            if (state.loaded && !append) {
                await applyRecords(state.records, `${source}:cache`);
                return publicState(state);
            }
            if (append && state.loaded && state.hasMore !== true) {
                await applyRecords(state.records, `${source}:cache-complete`);
                return publicState(state);
            }

            const request = {
                limit,
                ...queryOptions
            };
            if (append && state.cursor) request.cursor = clone(state.cursor);

            let run = null;
            run = Promise.resolve()
                .then(() => repository.queryAdministrativeLogs(request))
                .then(async result => {
                    const incoming = Array.isArray(result?.records) ? result.records : [];
                    state.records = append
                        ? mergeRecords(state.records, incoming)
                        : mergeRecords([], incoming);
                    state.cursor = result?.cursor ? clone(result.cursor) : null;
                    state.hasMore = result?.hasMore === true;
                    state.loaded = true;
                    await applyRecords(state.records, source);
                    return publicState(state);
                })
                .finally(() => {
                    if (state.loadingPromise === run) state.loadingPromise = null;
                });
            state.loadingPromise = run;
            return run;
        }

        function auditQueryOptions() {
            const actorUserId = text(getAuditActorUserId());
            return actorUserId ? { actorUserId } : {};
        }

        function schoolState(schoolId) {
            const normalized = text(schoolId);
            if (!normalized) throw new Error('A escola é obrigatória para consultar o histórico interno.');
            if (!schools.has(normalized)) schools.set(normalized, createCollectionState());
            return { id: normalized, state: schools.get(normalized) };
        }

        async function loadAudit(loadOptions = {}) {
            return loadCollection(audit, auditQueryOptions(), {
                ...loadOptions,
                source: 'administrative-log-read:audit'
            });
        }

        async function loadSchool(schoolId, loadOptions = {}) {
            const target = schoolState(schoolId);
            return loadCollection(target.state, { schoolId: target.id }, {
                ...loadOptions,
                source: `administrative-log-read:school:${target.id}`
            });
        }

        return Object.freeze({
            loadAudit,
            loadSchool,
            peekAudit: () => publicState(audit),
            peekSchool: schoolId => publicState(schoolState(schoolId).state)
        });
    }

    function currentLegacyLogs() {
        try {
            return typeof logs !== 'undefined' && Array.isArray(logs) ? logs : [];
        } catch (_error) {
            return [];
        }
    }

    function renderStatusRow(root, target, message, error = false) {
        if (!target) return;
        const tbody = target.querySelector?.('tbody');
        if (!tbody) return;
        const row = root.document.createElement('tr');
        const cell = root.document.createElement('td');
        cell.colSpan = 5;
        cell.style.textAlign = 'center';
        cell.style.padding = '28px';
        cell.style.color = error ? 'var(--danger)' : 'var(--text-muted)';
        cell.textContent = message;
        row.appendChild(cell);
        tbody.replaceChildren(row);
    }

    function renderSchoolAuditRows(root, schoolId, state, model) {
        const panel = root.document.querySelector('#tab-auditoria');
        const tbody = panel?.querySelector('tbody');
        if (!panel || !tbody) return;

        const visible = currentLegacyLogs().filter(log => (
            text(log?.escolaId || log?.schoolId) === text(schoolId)
        ));
        tbody.replaceChildren();

        if (visible.length === 0) {
            const row = root.document.createElement('tr');
            const cell = root.document.createElement('td');
            cell.colSpan = 4;
            cell.style.textAlign = 'center';
            cell.style.padding = '24px';
            cell.style.color = 'var(--text-muted)';
            cell.textContent = 'Nenhum registro interno para esta unidade.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            visible.forEach(log => {
                const row = root.document.createElement('tr');
                const values = [
                    Number.isNaN(new Date(log.dataHora).getTime())
                        ? text(log.dataHora)
                        : new Date(log.dataHora).toLocaleString('pt-BR'),
                    `${text(log.usuario)}${text(log.perfil) ? ` (${text(log.perfil)})` : ''}`,
                    text(log.acao),
                    text(log.detalhes)
                ];
                values.forEach((value, index) => {
                    const cell = root.document.createElement('td');
                    if (index === 2) {
                        const strong = root.document.createElement('strong');
                        strong.textContent = value;
                        cell.appendChild(strong);
                    } else {
                        cell.textContent = value;
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }

        panel.querySelector('[data-radar-school-log-pagination]')?.remove();
        if (state.hasMore !== true) return;

        const controls = root.document.createElement('div');
        controls.dataset.radarSchoolLogPagination = 'true';
        controls.style.display = 'flex';
        controls.style.justifyContent = 'center';
        controls.style.paddingTop = '16px';
        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm';
        button.textContent = 'Carregar registros anteriores';
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = 'Carregando...';
            try {
                const next = await model.loadSchool(schoolId, { append: true });
                renderSchoolAuditRows(root, schoolId, next, model);
            } catch (error) {
                button.disabled = false;
                button.textContent = 'Tentar carregar novamente';
                root.console?.error?.('Falha ao carregar histórico interno da unidade.', error);
            }
        });
        controls.appendChild(button);
        panel.querySelector('.panel-card')?.appendChild(controls);
    }

    function install(root = globalThis) {
        if (!root?.document) return false;
        if (root.__radarAdministrativeLogReadModelInstalled) return true;
        const dataService = root.RadarApplicationServices?.data;
        if (!dataService?.repository || !dataService?.statePort) return false;
        if (typeof dataService.repository.queryAdministrativeLogs !== 'function') return false;

        const accessPolicy = root.RadarAccessPolicy;
        const getAuditActorUserId = () => {
            try {
                const own = root.hasRadarCapability?.(
                    accessPolicy?.CAPABILITIES?.VIEW_OWN_ADMINISTRATIVE_LOGS
                ) === true;
                const all = root.hasRadarCapability?.(
                    accessPolicy?.CAPABILITIES?.VIEW_ALL_ADMINISTRATIVE_LOGS
                ) === true;
                return own && !all ? text(root.getAuthenticatedUserId?.()) : '';
            } catch (_error) {
                return '';
            }
        };
        const model = createAdministrativeLogReadModel({
            dataService,
            pageSize: DEFAULT_PAGE_SIZE,
            getAuditActorUserId
        });

        function auditVisible() {
            return root.document.getElementById('nav-auditoria')?.classList?.contains('active') === true;
        }

        function addAuditPagination(state) {
            const main = root.document.getElementById('main-container');
            main?.querySelector('[data-radar-audit-pagination]')?.remove();
            if (state.hasMore !== true) return;
            const card = main?.querySelector('.panel-card');
            if (!card) return;
            const controls = root.document.createElement('div');
            controls.dataset.radarAuditPagination = 'true';
            controls.style.display = 'flex';
            controls.style.justifyContent = 'center';
            controls.style.padding = '16px 0 4px';
            const button = root.document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-secondary';
            button.textContent = 'Carregar registros anteriores';
            button.addEventListener('click', async () => {
                button.disabled = true;
                button.textContent = 'Carregando...';
                try {
                    const next = await model.loadAudit({ append: true });
                    if (!auditVisible()) return;
                    originalRenderAuditoria();
                    addAuditPagination(next);
                } catch (error) {
                    button.disabled = false;
                    button.textContent = 'Tentar carregar novamente';
                    root.console?.error?.('Falha ao carregar registros internos.', error);
                }
            });
            controls.appendChild(button);
            card.appendChild(controls);
        }

        const originalRenderAuditoria = root.renderAuditoria;
        if (typeof originalRenderAuditoria === 'function') {
            const wrappedAudit = function renderAuditoriaOnDemand() {
                originalRenderAuditoria.apply(this, arguments);
                const main = root.document.getElementById('main-container');
                const state = model.peekAudit();
                if (!state.loaded) {
                    renderStatusRow(root, main, 'Carregando registros internos...');
                }
                model.loadAudit()
                    .then(next => {
                        if (!auditVisible()) return;
                        originalRenderAuditoria();
                        addAuditPagination(next);
                    })
                    .catch(error => {
                        if (!auditVisible()) return;
                        renderStatusRow(
                            root,
                            root.document.getElementById('main-container'),
                            'Não foi possível carregar os registros internos. Tente novamente.',
                            true
                        );
                        root.console?.error?.('Falha ao carregar registros internos.', error);
                    });
            };
            wrappedAudit.__radarAdministrativeLogReadWrapped = true;
            wrappedAudit.__radarOriginal = originalRenderAuditoria;
            root.renderAuditoria = wrappedAudit;
            try { renderAuditoria = wrappedAudit; } catch (_error) { /* vínculo global indisponível */ }
        }

        const originalRenderProntuario = root.renderProntuario;
        if (typeof originalRenderProntuario === 'function') {
            const wrappedProntuario = function renderProntuarioWithRemoteLogContext(schoolId) {
                root.RadarCurrentProntuarioSchoolId = text(schoolId);
                return originalRenderProntuario.apply(this, arguments);
            };
            wrappedProntuario.__radarAdministrativeLogReadWrapped = true;
            wrappedProntuario.__radarOriginal = originalRenderProntuario;
            root.renderProntuario = wrappedProntuario;
            try { renderProntuario = wrappedProntuario; } catch (_error) { /* vínculo global indisponível */ }
        }

        const originalSwitchSchoolTab = root.switchSchoolTab;
        if (typeof originalSwitchSchoolTab === 'function') {
            const wrappedSchoolTab = function switchSchoolTabWithRemoteLogs(event, tabId) {
                const result = originalSwitchSchoolTab.apply(this, arguments);
                if (tabId !== 'tab-auditoria') return result;
                const schoolId = text(root.RadarCurrentProntuarioSchoolId);
                if (!schoolId) return result;
                const panel = root.document.querySelector('#tab-auditoria');
                const state = model.peekSchool(schoolId);
                if (!state.loaded) {
                    renderStatusRow(root, panel, 'Carregando histórico interno da unidade...');
                }
                model.loadSchool(schoolId)
                    .then(next => {
                        if (text(root.RadarCurrentProntuarioSchoolId) !== schoolId) return;
                        if (root.document.querySelector('#tab-auditoria.active') === null) return;
                        renderSchoolAuditRows(root, schoolId, next, model);
                    })
                    .catch(error => {
                        renderStatusRow(
                            root,
                            root.document.querySelector('#tab-auditoria'),
                            'Não foi possível carregar o histórico interno da unidade.',
                            true
                        );
                        root.console?.error?.('Falha ao carregar histórico interno da unidade.', error);
                    });
                return result;
            };
            wrappedSchoolTab.__radarAdministrativeLogReadWrapped = true;
            wrappedSchoolTab.__radarOriginal = originalSwitchSchoolTab;
            root.switchSchoolTab = wrappedSchoolTab;
            try { switchSchoolTab = wrappedSchoolTab; } catch (_error) { /* vínculo global indisponível */ }
        }

        root.RadarAdministrativeLogReadContext = Object.freeze({ model });
        root.__radarAdministrativeLogReadModelInstalled = true;
        return true;
    }

    return Object.freeze({
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE,
        createAdministrativeLogReadModel,
        install
    });
}));
