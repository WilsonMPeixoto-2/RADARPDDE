(function installTask9CrossView(root) {
    'use strict';

    let installed = false;
    let originalRenderCompetencias = null;
    let observer = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarPendenciasViewModel
            && root.RadarPendencias
            && root.RadarTask9PendencyPage
            && typeof root.renderCompetencias === 'function'
            && typeof root.switchView === 'function'
            && typeof root.changePendencyFilter === 'function'
            && typeof root.activatePendencyTab === 'function'
            && typeof root.encodePendencyIdReference === 'function'
        );
    }

    function isDesktopDrawer() {
        return Boolean(
            document.getElementById('pendency-detail-drawer')
            && root.matchMedia
            && root.matchMedia('(min-width: 1181px)').matches
        );
    }

    function syncDrawerDockState() {
        document.body.classList.toggle('pendency-drawer-open-desktop', isDesktopDrawer());
    }

    function getCompetencePendencyCounts(schoolId, competence) {
        return pendencias.reduce((counts, pendency) => {
            const pendencyCompetence = pendency.competenciaOrigem || pendency.competencia;
            if (pendency.escolaId !== schoolId || pendencyCompetence !== competence) return counts;
            if (pendency.status === 'Aberta') counts.open += 1;
            if (pendency.status === 'Aguardando reanálise') counts.awaiting += 1;
            return counts;
        }, { open: 0, awaiting: 0 });
    }

    function pluralize(count, singular, plural) {
        return `${count} ${count === 1 ? singular : plural}`;
    }

    function renderCompetencePendencySummary(school, competence) {
        const counts = getCompetencePendencyCounts(school.id, competence);
        if (counts.open === 0 && counts.awaiting === 0) {
            return '<span class="badge badge-gray">Nenhuma</span>';
        }

        const buttons = [];
        if (counts.open > 0) {
            buttons.push(`
                <button
                    type="button"
                    class="btn btn-secondary btn-sm competence-pendency-link"
                    onclick="openPendencyQueueForSchool('${escapeHtml(school.id)}', '${escapeHtml(competence)}', 'aberta')"
                >${pluralize(counts.open, 'aberta', 'abertas')}</button>
            `);
        }
        if (counts.awaiting > 0) {
            buttons.push(`
                <button
                    type="button"
                    class="btn btn-secondary btn-sm competence-pendency-link competence-pendency-awaiting"
                    onclick="openPendencyQueueForSchool('${escapeHtml(school.id)}', '${escapeHtml(competence)}', 'aguardando')"
                >${pluralize(counts.awaiting, 'para reanalisar', 'para reanalisar')}</button>
            `);
        }
        return `<div class="competence-pendency-summary">${buttons.join('')}</div>`;
    }

    function getSchoolDesignation(school) {
        return String(school && (school.designação || school.designacao) || '').trim();
    }

    function getSchoolName(school) {
        return String(school && (
            school.denominação || school.denominacao || school.denominaçao || school.name
        ) || '').trim();
    }

    function getSchoolIdFromProntuarioAction(row) {
        const action = row && row.querySelector('[onclick*="switchView"]');
        const handler = action && action.getAttribute('onclick');
        if (!handler) return '';
        const match = handler.match(
            /switchView\(\s*['"]prontuario['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
        );
        return match ? match[1] : '';
    }

    function resolveSchoolForCompetenceRow(row) {
        if (!row) return null;

        const actionSchoolId = getSchoolIdFromProntuarioAction(row);
        if (actionSchoolId) {
            const actionSchool = escolas.find(school => String(school.id) === actionSchoolId);
            if (actionSchool) return actionSchool;
        }

        const rowText = String(row.textContent || '');
        const byDesignation = [...escolas]
            .filter(school => getSchoolDesignation(school))
            .sort((left, right) => (
                getSchoolDesignation(right).length - getSchoolDesignation(left).length
            ))
            .find(school => rowText.includes(getSchoolDesignation(school)));
        if (byDesignation) return byDesignation;

        return [...escolas]
            .filter(school => getSchoolName(school))
            .sort((left, right) => getSchoolName(right).length - getSchoolName(left).length)
            .find(school => rowText.includes(getSchoolName(school))) || null;
    }

    function enhanceCompetenceTable() {
        const panel = Array.from(document.querySelectorAll('.panel-card')).find(candidate => (
            candidate.querySelector('.panel-header h2')?.textContent.includes('Lista de Entrega e Bonificação')
        ));
        const table = panel && panel.querySelector('table');
        if (!table) return false;

        const headers = table.querySelectorAll('thead th');
        if (headers[4]) headers[4].textContent = 'Pendências ativas';

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        rows.forEach(row => {
            const school = resolveSchoolForCompetenceRow(row);
            const cells = row.querySelectorAll('td');
            if (!school || cells.length < 6) return;
            row.dataset.schoolId = school.id;
            cells[4].innerHTML = renderCompetencePendencySummary(school, activeCompetenciaKey);
        });
        return true;
    }

    function getPassivoRecords() {
        const records = root.RadarPendenciasViewModel.buildPendencyRecords({
            pendencias,
            escolas,
            programas,
            controladores,
            contatos,
            now: new Date().toISOString()
        });
        return records
            .filter(record => (
                ['Aberta', 'Aguardando reanálise'].includes(record.status)
                && record.competence
                && record.competence < activeCompetenciaKey
            ))
            .sort((left, right) => {
                const leftTime = new Date(left.waitingSince || left.openedAt || 0).getTime();
                const rightTime = new Date(right.waitingSince || right.openedAt || 0).getTime();
                if (leftTime !== rightTime) return leftTime - rightTime;
                const schoolOrder = left.schoolName.localeCompare(right.schoolName, 'pt-BR', {
                    sensitivity: 'base',
                    numeric: true
                });
                if (schoolOrder !== 0) return schoolOrder;
                return left.documentName.localeCompare(right.documentName, 'pt-BR', {
                    sensitivity: 'base',
                    numeric: true
                });
            });
    }

    function getStatusBadgeClass(status) {
        return status === 'Aguardando reanálise' ? 'badge-info' : 'badge-warning';
    }

    function renderPassivoAnteriorTask9() {
        const list = document.getElementById('passivo-competencias-list');
        if (!list) return false;
        const records = getPassivoRecords();

        if (records.length === 0) {
            list.innerHTML = `
                <div class="empty-state compact">
                    <p>Não há pendências ativas de competências anteriores a ${escapeHtml(formatCompetenciaText(activeCompetenciaKey))}.</p>
                </div>
            `;
            return true;
        }

        list.innerHTML = `
            <div class="table-responsive">
                <table class="data-table competence-passivo-table">
                    <thead>
                        <tr>
                            <th>Unidade escolar</th>
                            <th>Competência</th>
                            <th>Programa e documento</th>
                            <th>Erros atuais</th>
                            <th>Situação</th>
                            <th>Próxima ação</th>
                            <th>Tempo aguardando</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr
                                data-pendency-ref="${escapeHtml(encodePendencyIdReference(record.id))}"
                                data-pendency-status="${escapeHtml(record.status)}"
                            >
                                <td>
                                    <strong>${escapeHtml(record.schoolName)}</strong>
                                    <small>${escapeHtml(record.schoolDesignation)}</small>
                                </td>
                                <td>${escapeHtml(formatCompetenciaText(record.competence))}</td>
                                <td>
                                    <strong>${escapeHtml(record.programName)}</strong>
                                    <small>${escapeHtml(record.documentName)}</small>
                                </td>
                                <td>${record.errors.length
                                    ? `<ul class="pendency-error-summary">${record.errors.slice(0, 2).map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`
                                    : '<span class="pendency-muted">Nenhum erro ativo</span>'}
                                </td>
                                <td><span class="badge ${getStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span></td>
                                <td>
                                    <strong>${escapeHtml(record.nextAction)}</strong>
                                    ${record.nextActor ? `<small>Responsável: ${escapeHtml(record.nextActor)}</small>` : ''}
                                </td>
                                <td>${record.ageDays == null ? 'Não informado' : `${record.ageDays} dia${record.ageDays === 1 ? '' : 's'}`}</td>
                                <td>
                                    <button
                                        type="button"
                                        class="btn btn-secondary btn-sm"
                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(record.id))}"
                                        onclick="openPendencyFromCrossView(this)"
                                    >Ver detalhes</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return true;
    }

    function renderCompetenciasTask9() {
        originalRenderCompetencias();
        enhanceCompetenceTable();
        renderPassivoAnteriorTask9();
        return true;
    }

    function openPendencyQueueForSchool(schoolId, competence, tabKey) {
        if (typeof activePendencyDetailId !== 'undefined') activePendencyDetailId = null;
        root.switchView('pendencias');
        root.changePendencyFilter('schoolId', schoolId);
        root.changePendencyFilter('competence', competence);
        root.activatePendencyTab(tabKey);
        return true;
    }

    function openPendencyFromCrossView(source) {
        const id = root.resolvePendencyIdReference(source);
        root.switchView('pendencias');
        return root.openPendencyDetail(id);
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalRenderCompetencias = root.renderCompetencias.bind(root);
        root.renderCompetencias = renderCompetenciasTask9;
        root.renderPassivoAnterior = renderPassivoAnteriorTask9;
        root.openPendencyQueueForSchool = openPendencyQueueForSchool;
        root.openPendencyFromCrossView = openPendencyFromCrossView;
        root.RadarTask9CrossView = Object.freeze({
            VERSION: '1.1.0',
            enhanceCompetenceTable,
            renderPassivoAnterior: renderPassivoAnteriorTask9,
            resolveSchoolForCompetenceRow,
            syncDrawerDockState
        });

        observer = new MutationObserver(syncDrawerDockState);
        observer.observe(document.getElementById('main-container') || document.body, {
            childList: true,
            subtree: true
        });
        root.addEventListener('resize', syncDrawerDockState);
        syncDrawerDockState();
        installed = true;

        if (typeof currentView !== 'undefined' && currentView === 'competencias') {
            renderCompetenciasTask9();
        }
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 10);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
