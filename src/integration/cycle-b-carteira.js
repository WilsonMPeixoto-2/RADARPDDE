(function installCycleBWallet(root) {
    'use strict';

    let installed = false;
    let originalRenderEscolas = null;
    let originalGetFilteredEscolas = null;
    let originalSchoolMatchesSearch = null;
    let originalClearEscolaFilters = null;
    let documentaryFilter = 'all';

    const BONUS_META = Object.freeze({
        apta: { label: 'APTA', className: 'badge-success' },
        inapta: { label: 'INAPTA', className: 'badge-danger' },
        'em-apuracao': { label: 'Em apuração', className: 'badge-warning' },
        'nao-lancada': { label: 'Não lançada', className: 'badge-gray' }
    });

    const TECHNICAL_META = Object.freeze({
        correto: { label: 'Correto', className: 'badge-success' },
        'correto-atrasado': { label: 'Correto após o prazo', className: 'badge-info' },
        incorreto: { label: 'Incorreto', className: 'badge-danger' },
        'em-analise': { label: 'Em análise', className: 'badge-warning' },
        'nao-analisado': { label: 'Não analisado', className: 'badge-gray' }
    });

    function dependenciesReady() {
        return Boolean(
            root.RadarOperationalProjection
            && typeof root.renderEscolas === 'function'
            && typeof root.getFilteredEscolas === 'function'
            && typeof root.schoolMatchesSearch === 'function'
            && typeof root.switchView === 'function'
        );
    }

    function isMobileViewport() {
        return Boolean(root.matchMedia && root.matchMedia('(max-width: 900px)').matches);
    }

    function normalize(value) {
        return String(value == null ? '' : value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function buildProjection(schools = escolas) {
        return root.RadarOperationalProjection.buildOperationalProjection({
            escolas: schools,
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

    function getSchoolProjection(schoolId) {
        return buildProjection(escolas).schools.find(item => String(item.schoolId) === String(schoolId)) || null;
    }

    function schoolMatchesSearchEnhanced(school, query) {
        if (originalSchoolMatchesSearch(school, query)) return true;
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return true;
        return normalize(school && school.inep).includes(normalizedQuery);
    }

    function matchesPendencyFilter(projection, filter) {
        if (filter === 'aberta') return projection.openCount > 0;
        if (filter === 'aguardando') return projection.awaitingCount > 0;
        if (filter === 'com') return projection.activeCount > 0;
        if (filter === 'sem') return projection.activeCount === 0;
        return true;
    }

    function matchesDocumentaryFilter(projection) {
        if (documentaryFilter === 'aberta') return projection.openCount > 0;
        if (documentaryFilter === 'aguardando') return projection.awaitingCount > 0;
        if (documentaryFilter === 'sem-ativa') return projection.activeCount === 0;
        if (documentaryFilter === 'incorreto-sem-pendencia') {
            return projection.technicalStatus === 'incorreto' && projection.activeCount === 0;
        }
        return true;
    }

    function getFilteredEscolasEnhanced() {
        const pendingFilter = activeEscolaFilters && activeEscolaFilters.pendencias
            ? activeEscolaFilters.pendencias
            : 'all';
        let base;
        if (['aberta', 'aguardando'].includes(pendingFilter)) {
            activeEscolaFilters.pendencias = 'all';
            try {
                base = originalGetFilteredEscolas();
            } finally {
                activeEscolaFilters.pendencias = pendingFilter;
            }
        } else {
            base = originalGetFilteredEscolas();
        }
        const projectionBySchool = new Map(
            buildProjection(base).schools.map(item => [String(item.schoolId), item])
        );
        return base.filter(school => {
            const projection = projectionBySchool.get(String(school.id)) || getSchoolProjection(school.id);
            return projection
                && matchesPendencyFilter(projection, pendingFilter)
                && matchesDocumentaryFilter(projection);
        });
    }

    function formatDateTime(value) {
        if (!value) return 'Sem movimentação registrada';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Data não informada';
        return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function badge(meta, fallback) {
        const value = meta || { label: fallback, className: 'badge-gray' };
        return `<span class="badge ${value.className}">${escapeHtml(value.label)}</span>`;
    }

    function getPrograms(school) {
        return (school.programasIds || []).map(programId => {
            const program = programas.find(item => item.id === programId);
            return program ? program.name : programId;
        }).filter(Boolean);
    }

    function getPendingTab(projection) {
        return projection.awaitingCount > 0 && projection.openCount === 0
            ? 'aguardando'
            : 'aberta';
    }

    function renderPendencyAction(school, projection) {
        if (!projection.activeCount) return '';
        return `
            <button
                type="button"
                class="btn btn-secondary btn-sm cycle-b-open-pendencies"
                data-school-id="${escapeHtml(school.id)}"
                data-pendency-tab="${getPendingTab(projection)}"
                onclick="openCycleBWalletPendencies(this)"
            >Abrir Pendências</button>
        `;
    }

    function renderMobileActions(school, projection) {
        const canEdit = currentProfile === 'assistente' || currentProfile === 'controlador';
        return `
            <div class="school-actions-stack cycle-b-wallet-actions">
                <button type="button" class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(school.id)}')">Ver Unidade</button>
                ${renderPendencyAction(school, projection)}
                ${canEdit ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openEscolaEditModal('${escapeHtml(school.id)}')">Editar</button>` : ''}
            </div>
        `;
    }

    function renderMobileCard(school, projection) {
        const bonus = BONUS_META[projection.bonificationStatus] || BONUS_META['nao-lancada'];
        const technical = TECHNICAL_META[projection.technicalStatus] || TECHNICAL_META['nao-analisado'];
        const programNames = getPrograms(school);
        return `
            <article class="cycle-b-wallet-mobile-card" data-school-id="${escapeHtml(school.id)}">
                <header>
                    <div>
                        <strong>${escapeHtml(projection.schoolName)}</strong>
                        <small>${escapeHtml(projection.schoolDesignation)} · INEP ${escapeHtml(projection.inep || 'não informado')}</small>
                    </div>
                    ${badge(bonus)}
                </header>
                <div class="cycle-b-wallet-mobile-programs" aria-label="Programas da unidade">
                    ${programNames.map(name => `<span>${escapeHtml(name)}</span>`).join('')}
                </div>
                <dl>
                    <div><dt>Diretor(a) Geral</dt><dd>${escapeHtml(school.diretor || 'Não informado')}</dd></div>
                    <div><dt>Controlador</dt><dd>${escapeHtml(projection.controllerName || 'Não designado')}</dd></div>
                    <div><dt>Análise técnica</dt><dd>${badge(technical)}</dd></div>
                    <div><dt>Situação documental</dt><dd>${escapeHtml(projection.documentaryStatus)}</dd></div>
                    <div><dt>Pendências abertas</dt><dd>${projection.openCount}</dd></div>
                    <div><dt>Para reanalisar</dt><dd>${projection.awaitingCount}</dd></div>
                    <div><dt>Última movimentação</dt><dd>${escapeHtml(formatDateTime(projection.latestMovement && projection.latestMovement.at))}</dd></div>
                    <div><dt>Próxima ação</dt><dd><strong>${escapeHtml(projection.nextAction && projection.nextAction.label || 'Sem ação pendente')}</strong>${projection.nextAction && projection.nextAction.actor ? `<small>Próximo ator: ${escapeHtml(projection.nextAction.actor)}</small>` : ''}</dd></div>
                </dl>
                ${renderMobileActions(school, projection)}
            </article>
        `;
    }

    function findResultPanel() {
        return Array.from(document.querySelectorAll('.panel-card')).find(candidate => (
            candidate.querySelector('.panel-header h2')?.textContent.trim() === 'Resultado da carteira'
        )) || null;
    }

    function getSchoolIdFromRow(row) {
        const action = row.querySelector('[onclick*="switchView(\'prontuario\'"]');
        const handler = action && action.getAttribute('onclick');
        if (!handler) return '';
        const match = handler.match(/switchView\(\s*['"]prontuario['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
        return match ? match[1] : '';
    }

    function enhanceDesktopRows(panel, targetSchools, projection) {
        const table = panel.querySelector('table.data-table');
        if (!table) return false;
        const schoolById = new Map(targetSchools.map(school => [String(school.id), school]));
        const projectionById = new Map(projection.schools.map(item => [String(item.schoolId), item]));
        table.querySelectorAll('tbody tr').forEach(row => {
            const schoolId = getSchoolIdFromRow(row);
            const school = schoolById.get(String(schoolId));
            const item = projectionById.get(String(schoolId));
            if (!school || !item) return;
            row.dataset.schoolId = school.id;

            const pendencyCell = row.children[6];
            if (pendencyCell && !pendencyCell.querySelector('.cycle-b-wallet-operational-meta')) {
                pendencyCell.insertAdjacentHTML('beforeend', `
                    <div class="cycle-b-wallet-operational-meta">
                        <small><strong>Última movimentação:</strong> ${escapeHtml(formatDateTime(item.latestMovement && item.latestMovement.at))}</small>
                        <strong>${escapeHtml(item.nextAction && item.nextAction.label || 'Sem ação pendente')}</strong>
                    </div>
                `);
            }

            const actions = row.querySelector('.school-actions-stack');
            if (actions && item.activeCount > 0 && !actions.querySelector('.cycle-b-open-pendencies')) {
                actions.insertAdjacentHTML('beforeend', renderPendencyAction(school, item));
            }
        });
        return true;
    }

    function renderMobileResults(panel, targetSchools, projection) {
        const wrapper = panel.querySelector('.table-responsive');
        if (!wrapper) return false;
        const schoolById = new Map(targetSchools.map(school => [String(school.id), school]));
        wrapper.className = 'cycle-b-wallet-mobile';
        wrapper.innerHTML = targetSchools.length
            ? projection.schools.map(item => renderMobileCard(
                schoolById.get(String(item.schoolId)),
                item
            )).join('')
            : `
                <div class="empty-state compact" role="status" aria-live="polite">
                    <strong>Nenhuma escola encontrada</strong>
                    <span>Ajuste a busca ou limpe os filtros para ampliar o resultado.</span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="clearEscolaFilters()">Limpar filtros</button>
                </div>
            `;
        return true;
    }

    function injectFilterControls() {
        const pendingSelect = document.getElementById('filter-escola-pendencias');
        if (pendingSelect) {
            const current = activeEscolaFilters.pendencias || 'all';
            pendingSelect.innerHTML = `
                <option value="all">Todas</option>
                <option value="aberta">Pendência aberta</option>
                <option value="aguardando">Aguardando reanálise</option>
                <option value="com">Com pendência ativa</option>
                <option value="sem">Sem pendência ativa</option>
            `;
            pendingSelect.value = current;
        }

        const grid = document.querySelector('.school-filter-grid');
        if (!grid || document.getElementById('filter-escola-documental')) return;
        const field = document.createElement('div');
        field.className = 'filter-field';
        field.innerHTML = `
            <label for="filter-escola-documental">Situação documental</label>
            <select id="filter-escola-documental" class="form-control" onchange="changeCycleBDocumentaryFilter(this.value)">
                <option value="all">Todas</option>
                <option value="aberta">Com providência da escola</option>
                <option value="aguardando">Aguardando conferência</option>
                <option value="sem-ativa">Sem pendência ativa</option>
                <option value="incorreto-sem-pendencia">Incorreto sem pendência ativa</option>
            </select>
        `;
        grid.appendChild(field);
        field.querySelector('select').value = documentaryFilter;
    }

    function syncFilterFeedback() {
        const summary = document.querySelector('.school-filter-summary');
        if (summary && documentaryFilter !== 'all') {
            const chip = document.createElement('span');
            chip.className = 'cycle-b-documentary-chip';
            chip.textContent = `Situação documental: ${document.getElementById('filter-escola-documental')?.selectedOptions[0]?.textContent || documentaryFilter}`;
            summary.appendChild(chip);
        }
        if (documentaryFilter === 'all') return;
        const clearButton = document.querySelector('.school-filter-header button[onclick*="clearEscolaFilters"]');
        if (clearButton) clearButton.disabled = false;
        const panel = findResultPanel();
        const description = panel && panel.querySelector('.panel-header p');
        if (description) description.textContent = 'Lista filtrada conforme os critérios selecionados.';
    }

    function enhanceWallet() {
        injectFilterControls();
        syncFilterFeedback();
        const panel = findResultPanel();
        if (!panel) return false;
        const targetSchools = getFilteredEscolasEnhanced();
        const projection = buildProjection(targetSchools);
        if (isMobileViewport()) return renderMobileResults(panel, targetSchools, projection);
        return enhanceDesktopRows(panel, targetSchools, projection);
    }

    function renderEscolasEnhanced() {
        const result = originalRenderEscolas();
        enhanceWallet();
        return result;
    }

    function changeCycleBDocumentaryFilter(value) {
        documentaryFilter = value || 'all';
        root.renderEscolas();
        return true;
    }

    function clearEscolaFiltersEnhanced() {
        documentaryFilter = 'all';
        return originalClearEscolaFilters ? originalClearEscolaFilters() : false;
    }

    function openCycleBWalletPendencies(source) {
        const schoolId = source?.dataset?.schoolId;
        const tab = source?.dataset?.pendencyTab || 'aberta';
        if (!schoolId) return false;
        root.switchView('pendencias');
        if (typeof root.changePendencyFilter === 'function') {
            root.changePendencyFilter('schoolId', schoolId);
            root.changePendencyFilter('competence', activeCompetenciaKey);
        }
        if (typeof root.activatePendencyTab === 'function') root.activatePendencyTab(tab);
        return true;
    }

    function openWithPendingFilter(filter) {
        activeEscolaFilters = {
            ...activeEscolaFilters,
            pendencias: filter || 'all'
        };
        root.switchView('escolas');
        return true;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalRenderEscolas = root.renderEscolas.bind(root);
        originalGetFilteredEscolas = root.getFilteredEscolas.bind(root);
        originalSchoolMatchesSearch = root.schoolMatchesSearch.bind(root);
        originalClearEscolaFilters = typeof root.clearEscolaFilters === 'function'
            ? root.clearEscolaFilters.bind(root)
            : null;

        root.schoolMatchesSearch = schoolMatchesSearchEnhanced;
        root.getFilteredEscolas = getFilteredEscolasEnhanced;
        root.renderEscolas = renderEscolasEnhanced;
        root.clearEscolaFilters = clearEscolaFiltersEnhanced;
        root.changeCycleBDocumentaryFilter = changeCycleBDocumentaryFilter;
        root.openCycleBWalletPendencies = openCycleBWalletPendencies;
        root.RadarCycleBCarteira = Object.freeze({
            VERSION: '1.2.0',
            enhance: enhanceWallet,
            openWithPendingFilter,
            getDocumentaryFilter: () => documentaryFilter
        });
        installed = true;
        const viewport = root.matchMedia && root.matchMedia('(max-width: 900px)');
        if (viewport && typeof viewport.addEventListener === 'function') {
            viewport.addEventListener('change', () => {
                if (typeof currentView !== 'undefined' && currentView === 'escolas') root.renderEscolas();
            });
        }
        if (typeof currentView !== 'undefined' && currentView === 'escolas') {
            root.renderEscolas();
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
