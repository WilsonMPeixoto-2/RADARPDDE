(function installCycleBDashboard(root) {
    'use strict';

    let installed = false;
    let originalRenderDashboardControlador = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarOperationalProjection
            && typeof root.renderDashboardControlador === 'function'
            && typeof root.switchView === 'function'
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

    function formatWaiting(days) {
        if (days == null) return 'Antiguidade não informada';
        return `${days} dia${days === 1 ? '' : 's'} aguardando`;
    }

    function renderCard({ label, value, detail, className, filter }) {
        return `
            <button
                type="button"
                class="card-stat cycle-b-dashboard-card ${className || ''}"
                aria-label="${escapeHtml(label)}: ${value} escolas"
                onclick="openCycleBCarteira('${filter}')"
            >
                <div class="stat-label">${escapeHtml(label)}</div>
                <div class="stat-value">${value} ${value === 1 ? 'Escola' : 'Escolas'}</div>
                <div class="cycle-b-card-detail">${escapeHtml(detail)}</div>
            </button>
        `;
    }

    function renderAction(action) {
        const context = [
            action.schoolDesignation,
            action.documentLabel,
            action.competence ? formatCompetenciaText(action.competence) : ''
        ].filter(Boolean).join(' · ');
        const hasPendency = action.pendencyId != null;
        return `
            <article
                class="cycle-b-action-item"
                ${hasPendency ? `data-pendency-id="${escapeHtml(String(action.pendencyId))}"` : ''}
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
                    data-pendency-id="${hasPendency ? escapeHtml(String(action.pendencyId)) : ''}"
                    data-school-id="${escapeHtml(action.schoolId || '')}"
                    data-competence="${escapeHtml(action.competence || activeCompetenciaKey)}"
                    onclick="openCycleBOperationalAction(this)"
                >${hasPendency ? 'Abrir pendência' : 'Abrir Prontuário'}</button>
            </article>
        `;
    }

    function enhanceDashboard() {
        const stats = document.querySelector('#main-container .grid-stats');
        const layout = document.querySelector('#main-container .dash-layout');
        if (!stats || !layout) return false;

        const targetSchools = getTargetSchools();
        const projection = buildProjection(targetSchools);
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
                value: projection.totals.schools,
                detail: 'Recorte atual da carteira',
                filter: 'all'
            }),
            renderCard({
                label: 'Bonificação não lançada',
                value: projection.totals.bonificationNotLaunched,
                detail: formatCompetenciaText(activeCompetenciaKey),
                className: 'is-neutral',
                filter: 'all'
            }),
            renderCard({
                label: 'Pendências abertas',
                value: projection.totals.schoolsWithOpen,
                detail: 'Pendências ativas sob providência da escola',
                className: 'is-open',
                filter: 'aberta'
            }),
            renderCard({
                label: 'Aguardando reanálise',
                value: projection.totals.schoolsAwaitingReview,
                detail: 'Conferência do Controlador',
                className: 'is-awaiting',
                filter: 'aguardando'
            }),
            renderCard({
                label: 'Bens não encaminhados',
                value: schoolsWithPendingAssets,
                detail: 'Inventário ainda pendente',
                className: 'is-assets',
                filter: 'all'
            })
        ].join('');

        let note = document.getElementById('cycle-b-overlap-note');
        if (!note) {
            note = document.createElement('p');
            note.id = 'cycle-b-overlap-note';
            note.className = 'cycle-b-overlap-note';
            stats.insertAdjacentElement('afterend', note);
        }
        note.textContent = 'Os indicadores representam dimensões operacionais diferentes; as contagens podem se sobrepor e não devem ser somadas.';

        document.getElementById('cycle-b-action-queue')?.remove();
        const queue = document.createElement('section');
        queue.id = 'cycle-b-action-queue';
        queue.className = 'panel-card cycle-b-action-queue';
        queue.setAttribute('role', 'region');
        queue.setAttribute('aria-label', 'Próximas ações operacionais');
        queue.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2>Próximas ações operacionais</h2>
                    <p>Fila priorizada por tempo de espera, situação e contexto documental.</p>
                </div>
                <span class="badge badge-info">${projection.actions.length}</span>
            </div>
            <div class="cycle-b-action-list">
                ${projection.actions.length
                    ? projection.actions.slice(0, 15).map(renderAction).join('')
                    : '<div class="empty-state compact"><strong>Nenhuma ação operacional pendente.</strong></div>'}
            </div>
        `;
        layout.insertAdjacentElement('beforebegin', queue);
        return true;
    }

    function renderDashboardControladorEnhanced(container) {
        const result = originalRenderDashboardControlador(container);
        enhanceDashboard();
        return result;
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
        const pendencyId = source?.dataset?.pendencyId;
        const schoolId = source?.dataset?.schoolId;
        const competence = source?.dataset?.competence || activeCompetenciaKey;
        if (pendencyId) {
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
        root.renderDashboardControlador = renderDashboardControladorEnhanced;
        root.openCycleBCarteira = openCycleBCarteira;
        root.openCycleBOperationalAction = openCycleBOperationalAction;
        root.RadarCycleBDashboard = Object.freeze({
            VERSION: '1.1.0',
            enhance: enhanceDashboard
        });
        installed = true;
        if (typeof currentView !== 'undefined' && currentView === 'dashboard' && currentProfile === 'controlador') {
            enhanceDashboard();
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
