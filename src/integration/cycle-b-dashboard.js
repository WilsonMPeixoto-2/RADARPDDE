(function installCycleBDashboard(root) {
    'use strict';

    let installed = false;
    let originalRenderDashboardControlador = null;
    let originalChangeControladorRAFilter = null;
    let activeDashboardFilter = 'all';

    const CARD_ICONS = Object.freeze({
        schools: '<path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>',
        bonus: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        open: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
        review: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5M8 12h8M12 8v8"/>',
        assets: '<path d="m3 7 9-5 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>'
    });

    const FILTER_META = Object.freeze({
        all: { label: 'Todas as escolas do escopo' },
        bonus: { label: 'Bonificação não lançada' },
        aberta: { label: 'Pendências abertas' },
        aguardando: { label: 'Aguardando reanálise' },
        assets: { label: 'Bens não encaminhados' }
    });

    function dependenciesReady() {
        return Boolean(
            root.RadarOperationalProjection
            && typeof root.renderDashboardControlador === 'function'
            && typeof root.switchView === 'function'
            && typeof root.encodePendencyIdReference === 'function'
            && typeof root.resolvePendencyIdReference === 'function'
        );
    }

    function getTargetSchools() {
        const filter = typeof activeControladorRAFilter !== 'undefined'
            ? activeControladorRAFilter
            : 'carteira';
        const controllerId = typeof getDefaultControladorId === 'function'
            ? getDefaultControladorId()
            : '';
        if (filter === 'carteira') {
            return escolas.filter(school => school.controladorId === controllerId);
        }
        if (filter === 'todas') return [...escolas];
        return escolas.filter(school => {
            const designation = school.designação || school.designacao || '';
            const parts = designation.split('.');
            return parts.length >= 2 && parts[1] === filter;
        });
    }

    function buildProjection(targetSchools) {
        return root.RadarOperationalProjection.buildOperationalProjection({
            escolas: targetSchools,
            pendencias,
            contatos,
            programas,
            controladores,
            competencia: activeCompetenciaKey,
            now: new Date().toISOString(),
            getProgramBonificationStatus: typeof getProgramBonificationStatus === 'function'
                ? getProgramBonificationStatus
                : undefined,
            getProgramTechnicalStatus: typeof getProgramTechnicalStatus === 'function'
                ? getProgramTechnicalStatus
                : undefined
        });
    }

    function filterSchools(targetSchools, projection) {
        if (activeDashboardFilter === 'all') return [...targetSchools];

        const projectionBySchool = new Map(
            projection.schools.map(item => [String(item.schoolId), item])
        );

        if (activeDashboardFilter === 'bonus') {
            return targetSchools.filter(school => (
                Array.isArray(school.programasIds)
                && school.programasIds.some(programId => (
                    typeof getProgramBonificationStatus === 'function'
                    && getProgramBonificationStatus(
                        school.id,
                        activeCompetenciaKey,
                        programId
                    ) === 'nao-lancada'
                ))
            ));
        }

        if (activeDashboardFilter === 'assets') {
            const schoolIds = new Set(
                bens
                    .filter(item => item.status === 'Não encaminhada')
                    .map(item => String(item.escolaId))
            );
            return targetSchools.filter(school => schoolIds.has(String(school.id)));
        }

        return targetSchools.filter(school => {
            const item = projectionBySchool.get(String(school.id));
            if (!item) return false;
            if (activeDashboardFilter === 'aberta') return item.openCount > 0;
            if (activeDashboardFilter === 'aguardando') return item.awaitingCount > 0;
            return true;
        });
    }

    function formatWaiting(days) {
        if (days == null) return 'Antiguidade não informada';
        return `${days} dia${days === 1 ? '' : 's'} aguardando`;
    }

    function renderCard({ label, value, detail, className, filter, icon }) {
        const selected = activeDashboardFilter === filter;
        return `
            <button
                type="button"
                class="card-stat cycle-b-dashboard-card ${className || ''} ${selected ? 'is-selected' : ''}"
                aria-label="${escapeHtml(label)}: ${value} escolas"
                aria-pressed="${selected ? 'true' : 'false'}"
                onclick="changeCycleBDashboardFilter('${filter}')"
            >
                <div class="stat-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CARD_ICONS[icon] || CARD_ICONS.schools}</svg>
                </div>
                <div>
                    <div class="stat-label">${escapeHtml(label)}</div>
                    <div class="stat-value">${value} ${value === 1 ? 'Escola' : 'Escolas'}</div>
                    <div class="cycle-b-card-detail">${escapeHtml(detail)}</div>
                </div>
            </button>
        `;
    }

    function renderBonificationSummary(count) {
        if (!count || activeDashboardFilter === 'bonus') return '';
        return `
            <div class="cycle-b-action-summary">
                <div>
                    <strong>${count} ${count === 1 ? 'escola aguarda' : 'escolas aguardam'} lançamento de bonificação</strong>
                    <span>${escapeHtml(formatCompetenciaText(activeCompetenciaKey))} · tarefa regular consolidada</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="changeCycleBDashboardFilter('bonus')">Filtrar Dashboard</button>
            </div>
        `;
    }

    function renderAction(action) {
        const context = [
            action.schoolDesignation,
            action.documentLabel,
            action.competence ? formatCompetenciaText(action.competence) : ''
        ].filter(Boolean).join(' · ');
        const hasPendency = action.pendencyId != null;
        const pendencyReference = hasPendency
            ? escapeHtml(root.encodePendencyIdReference(action.pendencyId))
            : '';
        return `
            <article
                class="cycle-b-action-item"
                ${hasPendency ? `data-pendency-ref="${pendencyReference}"` : ''}
                data-school-id="${escapeHtml(action.schoolId || '')}"
            >
                <div class="cycle-b-action-priority" aria-hidden="true"></div>
                <div class="cycle-b-action-content">
                    <header>
                        <strong>${escapeHtml(action.schoolName || 'Unidade não identificada')}</strong>
                        <span class="badge ${action.actor === 'Controlador' ? 'badge-info' : 'badge-warning'}">${escapeHtml(action.actor || 'Sem responsável')}</span>
                    </header>
                    <h3>${escapeHtml(action.label)}</h3>
                    <p>${escapeHtml(context)}</p>
                    <small>${escapeHtml(formatWaiting(action.waitingDays))}</small>
                </div>
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    ${hasPendency ? `data-pendency-ref="${pendencyReference}"` : ''}
                    data-school-id="${escapeHtml(action.schoolId || '')}"
                    data-competence="${escapeHtml(action.competence || activeCompetenciaKey)}"
                    onclick="openCycleBOperationalAction(this)"
                >${hasPendency ? 'Abrir pendência' : 'Abrir Prontuário'}</button>
            </article>
        `;
    }

    function getSchoolIdFromRow(row) {
        const action = row && row.querySelector('[onclick*="switchView"]');
        const handler = action && action.getAttribute('onclick');
        if (!handler) return '';
        const match = handler.match(
            /switchView\(\s*['"]prontuario['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
        );
        return match ? match[1] : '';
    }

    function getPendencyStatus(id) {
        const item = pendencias.find(pendency => String(pendency.id) === String(id));
        return item ? item.status : '';
    }

    function findPrimaryActionForSchool(projection, schoolId) {
        const actions = projection.actions.filter(action => (
            String(action.schoolId) === String(schoolId)
            && action.pendencyId != null
        ));
        if (!actions.length) return null;
        if (activeDashboardFilter === 'aberta') {
            return actions.find(action => getPendencyStatus(action.pendencyId) === 'Aberta') || actions[0];
        }
        if (activeDashboardFilter === 'aguardando') {
            return actions.find(action => getPendencyStatus(action.pendencyId) === 'Aguardando reanálise') || actions[0];
        }
        return null;
    }

    function renderRowContextAction(action) {
        if (!action) return '';
        const label = activeDashboardFilter === 'aguardando'
            ? 'Reanalisar documento'
            : 'Abrir pendência';
        return `
            <button
                type="button"
                class="btn btn-primary btn-sm cycle-b-row-context-action"
                data-pendency-ref="${escapeHtml(root.encodePendencyIdReference(action.pendencyId))}"
                data-school-id="${escapeHtml(action.schoolId || '')}"
                data-competence="${escapeHtml(action.competence || activeCompetenciaKey)}"
                onclick="openCycleBOperationalAction(this)"
            >${label}</button>
        `;
    }

    function applySchoolListFilter(filteredSchools, projection) {
        const table = document.querySelector('.dash-layout > div:first-child table.data-table');
        if (!table) return false;
        const tbody = table.querySelector('tbody');
        if (!tbody) return false;

        const allowedIds = new Set(filteredSchools.map(school => String(school.id)));
        const rows = Array.from(tbody.querySelectorAll('tr'));
        let visibleRows = 0;

        rows.forEach(row => {
            const schoolId = getSchoolIdFromRow(row);
            if (!schoolId) return;
            row.dataset.schoolId = schoolId;
            if (!allowedIds.has(String(schoolId))) {
                row.remove();
                return;
            }

            visibleRows += 1;
            const actionCell = row.lastElementChild;
            const contextualAction = findPrimaryActionForSchool(projection, schoolId);
            if (actionCell && contextualAction) {
                actionCell.classList.add('cycle-b-dashboard-row-actions');
                actionCell.insertAdjacentHTML('beforeend', renderRowContextAction(contextualAction));
            }
        });

        if (visibleRows === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="cycle-b-dashboard-empty">Nenhuma escola encontrada neste filtro.</td>
                </tr>
            `;
        }

        const title = document.querySelector('.dashboard-list-heading > span:first-child');
        if (title) {
            const scopeText = title.textContent.split(' · Filtro:')[0].trim();
            const filterLabel = FILTER_META[activeDashboardFilter]?.label || FILTER_META.all.label;
            title.textContent = activeDashboardFilter === 'all'
                ? `${scopeText} · ${filteredSchools.length} escolas`
                : `${scopeText} · Filtro: ${filterLabel} (${filteredSchools.length})`;
        }
        return true;
    }

    function enhanceDashboard() {
        const stats = document.querySelector('#main-container .grid-stats');
        const layout = document.querySelector('#main-container .dash-layout');
        if (!stats || !layout) return false;

        const targetSchools = getTargetSchools();
        const fullProjection = buildProjection(targetSchools);
        const filteredSchools = filterSchools(targetSchools, fullProjection);
        const filteredProjection = buildProjection(filteredSchools);
        const targetIds = new Set(targetSchools.map(school => school.id));
        const schoolsWithPendingAssets = new Set(
            bens
                .filter(item => targetIds.has(item.escolaId) && item.status === 'Não encaminhada')
                .map(item => item.escolaId)
        ).size;

        stats.classList.add('cycle-b-dashboard-stats');
        stats.innerHTML = [
            renderCard({
                label: 'Escolas no escopo',
                value: fullProjection.totals.schools,
                detail: 'Recorte atual da carteira',
                filter: 'all',
                icon: 'schools'
            }),
            renderCard({
                label: 'Bonificação não lançada',
                value: fullProjection.totals.bonificationNotLaunched,
                detail: formatCompetenciaText(activeCompetenciaKey),
                className: 'is-neutral',
                filter: 'bonus',
                icon: 'bonus'
            }),
            renderCard({
                label: 'Pendências abertas',
                value: fullProjection.totals.schoolsWithOpen,
                detail: 'Pendências ativas sob providência da escola',
                className: 'is-open',
                filter: 'aberta',
                icon: 'open'
            }),
            renderCard({
                label: 'Aguardando reanálise',
                value: fullProjection.totals.schoolsAwaitingReview,
                detail: 'Conferência do Controlador',
                className: 'is-awaiting',
                filter: 'aguardando',
                icon: 'review'
            }),
            renderCard({
                label: 'Bens não encaminhados',
                value: schoolsWithPendingAssets,
                detail: 'Inventário ainda pendente',
                className: 'is-assets',
                filter: 'assets',
                icon: 'assets'
            })
        ].join('');

        let note = document.getElementById('cycle-b-overlap-note');
        if (!note) {
            note = document.createElement('p');
            note.id = 'cycle-b-overlap-note';
            note.className = 'cycle-b-overlap-note';
            stats.insertAdjacentElement('afterend', note);
        }
        note.textContent = 'Selecione um cartão para filtrar a lista e as próximas ações. As dimensões podem se sobrepor e não devem ser somadas.';

        applySchoolListFilter(filteredSchools, filteredProjection);

        const pendencyActions = filteredProjection.actions.filter(action => action.pendencyId != null);
        const sideColumn = layout.lastElementChild;
        let queue = document.getElementById('cycle-b-action-queue');
        if (!queue) queue = document.createElement('section');
        queue.id = 'cycle-b-action-queue';
        queue.className = 'panel-card cycle-b-action-queue cycle-b-action-queue-compact';
        queue.setAttribute('role', 'region');
        queue.setAttribute('aria-label', 'Próximas ações operacionais');
        queue.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2>Próximas ações operacionais</h2>
                    <p>${escapeHtml(FILTER_META[activeDashboardFilter]?.label || FILTER_META.all.label)} · priorizadas por tempo de espera.</p>
                </div>
                <span class="badge badge-info">${pendencyActions.length}</span>
            </div>
            <div class="cycle-b-action-list">
                ${pendencyActions.length
                    ? pendencyActions.slice(0, 8).map(renderAction).join('')
                    : '<div class="cycle-b-action-empty"><strong>Nenhuma pendência documental ativa.</strong><span>Não há providência da escola ou reanálise aguardando neste recorte.</span></div>'}
            </div>
            ${pendencyActions.length > 8 ? '<button type="button" class="btn btn-secondary btn-sm cycle-b-action-view-all" onclick="switchView(\'pendencias\')">Ver todas as pendências</button>' : ''}
            ${renderBonificationSummary(filteredProjection.totals.bonificationNotLaunched)}
        `;
        const currentSidePanel = sideColumn && sideColumn.querySelector('.panel-card');
        if (currentSidePanel !== queue) {
            if (currentSidePanel) currentSidePanel.replaceWith(queue);
            else if (sideColumn) sideColumn.appendChild(queue);
        }
        return true;
    }

    function renderDashboardControladorEnhanced(container) {
        if (typeof activeControladorSubFilter !== 'undefined') activeControladorSubFilter = 'all';
        const result = originalRenderDashboardControlador(container);
        enhanceDashboard();
        return result;
    }

    function changeCycleBDashboardFilter(filter) {
        const normalized = Object.prototype.hasOwnProperty.call(FILTER_META, filter) ? filter : 'all';
        activeDashboardFilter = activeDashboardFilter === normalized ? 'all' : normalized;
        if (typeof activeControladorSubFilter !== 'undefined') activeControladorSubFilter = 'all';
        if (typeof renderDashboard === 'function') renderDashboard();
        return true;
    }

    function changeControladorRAFilterEnhanced(filter) {
        activeDashboardFilter = 'all';
        return originalChangeControladorRAFilter(filter);
    }

    function openCycleBCarteira(filter) {
        if (root.RadarCycleBCarteira && typeof root.RadarCycleBCarteira.openWithPendingFilter === 'function') {
            return root.RadarCycleBCarteira.openWithPendingFilter(filter);
        }
        activeEscolaFilters = { ...activeEscolaFilters, pendencias: filter || 'all' };
        root.switchView('escolas');
        return true;
    }

    function openCycleBOperationalAction(source) {
        let pendencyId = null;
        if (source?.dataset?.pendencyRef) {
            try {
                pendencyId = root.resolvePendencyIdReference(source);
            } catch (error) {
                console.error('Não foi possível interpretar a referência da pendência.', error);
                return false;
            }
        }
        const schoolId = source?.dataset?.schoolId;
        const competence = source?.dataset?.competence || activeCompetenciaKey;
        if (pendencyId != null) {
            root.switchView('pendencias');
            if (typeof root.clearPendencyFilters === 'function') root.clearPendencyFilters();
            root.requestAnimationFrame(() => {
                if (typeof root.openPendencyDetail === 'function') root.openPendencyDetail(pendencyId);
            });
            return true;
        }
        if (!schoolId) return false;
        activeProntuarioCompetencia = competence;
        root.switchView('prontuario', schoolId);
        return true;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalRenderDashboardControlador = root.renderDashboardControlador.bind(root);
        originalChangeControladorRAFilter = typeof root.changeControladorRAFilter === 'function'
            ? root.changeControladorRAFilter.bind(root)
            : null;
        root.renderDashboardControlador = renderDashboardControladorEnhanced;
        if (originalChangeControladorRAFilter) {
            root.changeControladorRAFilter = changeControladorRAFilterEnhanced;
        }
        root.changeCycleBDashboardFilter = changeCycleBDashboardFilter;
        root.openCycleBCarteira = openCycleBCarteira;
        root.openCycleBOperationalAction = openCycleBOperationalAction;
        root.RadarCycleBDashboard = Object.freeze({
            VERSION: '1.3.0',
            enhance: enhanceDashboard,
            getActiveFilter: () => activeDashboardFilter
        });
        installed = true;
        if (typeof currentView !== 'undefined' && currentView === 'dashboard' && currentProfile === 'controlador') {
            root.renderDashboardControlador(document.getElementById('main-container'));
        }
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
