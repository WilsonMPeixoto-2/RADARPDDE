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
        return buildProjection(escolas).schools.find(item => item.schoolId === schoolId) || null;
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
            buildProjection(base).schools.map(item => [item.schoolId, item])
        );
        return base.filter(school => {
            const projection = projectionBySchool.get(school.id) || getSchoolProjection(school.id);
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

    function renderActions(school, projection) {
        const pendingTab = projection.awaitingCount > 0 && projection.openCount === 0
            ? 'aguardando'
            : 'aberta';
        return `
            <div class="school-actions-stack cycle-b-wallet-actions">
                <button type="button" class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(school.id)}')">Ver Unidade</button>
                ${projection.activeCount > 0 ? `
                    <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        data-school-id="${escapeHtml(school.id)}"
                        data-pendency-tab="${pendingTab}"
                        onclick="openCycleBWalletPendencies(this)"
                    >Abrir Pendências</button>
                ` : ''}
            </div>
        `;
    }

    function renderDesktopRow(school, projection) {
        const bonus = BONUS_META[projection.bonificationStatus] || BONUS_META['nao-lancada'];
        const technical = TECHNICAL_META[projection.technicalStatus] || TECHNICAL_META['nao-analisado'];
        return `
            <tr data-school-id="${escapeHtml(school.id)}">
                <td>
                    <strong>${escapeHtml(projection.schoolName)}</strong>
                    <small>${escapeHtml(projection.schoolDesignation)} · ${escapeHtml(projection.ra || 'R.A. não informada')}</small>
                </td>
                <td>
                    <strong>INEP:</strong> ${escapeHtml(projection.inep || 'Não informado')}<br>
                    <small><strong>CNPJ:</strong> ${escapeHtml(school.cnpj || 'Não informado')}</small>
                </td>
                <td>${escapeHtml(projection.controllerName)}</td>
                <td>${badge(bonus)}</td>
                <td>${badge(technical)}</td>
                <td><span class="badge ${projection.activeCount ? 'badge-warning' : 'badge-gray'}">${escapeHtml(projection.documentaryStatus)}</span></td>
                <td class="cycle-b-count-cell">${projection.openCount}</td>
                <td class="cycle-b-count-cell">${projection.awaitingCount}</td>
                <td>${escapeHtml(formatDateTime(projection.latestMovement && projection.latestMovement.at))}</td>
                <td>
                    <strong>${escapeHtml(projection.nextAction && projection.nextAction.label || 'Sem ação pendente')}</strong>
                    ${projection.nextAction && projection.nextAction.actor ? `<small>Próximo ator: ${escapeHtml(projection.nextAction.actor)}</small>` : ''}
                </td>
                <td>${renderActions(school, projection)}</td>
            </tr>
        `;
    }

    function renderMobileCard(school, projection) {
        const bonus = BONUS_META[projection.bonificationStatus] || BONUS_META['nao-lancada'];
        const technical = TECHNICAL_META[projection.technicalStatus] || TECHNICAL_META['nao-analisado'];
        return `
            <article class="cycle-b-wallet-mobile-card" data-school-id="${escapeHtml(school.id)}">
                <header>
                    <div>
                        <strong>${escapeHtml(projection.schoolName)}</strong>
                        <small>${escapeHtml(projection.schoolDesignation)} · INEP ${escapeHtml(projection.inep || 'não informado')}</small>
                    </div>
                    ${badge(bonus)}
                </header>
                <dl>
                    <div><dt>Análise técnica</dt><dd>${badge(technical)}</dd></div>
                    <div><dt>Situação documental</dt><dd>${escapeHtml(projection.documentaryStatus)}</dd></div>
                    <div><dt>Pendências abertas</dt><dd>${projection.openCount}</dd></div>
                    <div><dt>Para reanalisar</dt><dd>${projection.awaitingCount}</dd></div>
                    <div><dt>Última movimentação</dt><dd>${escapeHtml(formatDateTime(projection.latestMovement && projection.latestMovement.at))}</dd></div>
                    <div><dt>Próxima ação</dt><dd>${escapeHtml(projection.nextAction && projection.nextAction.label || 'Sem ação pendente')}${projection.nextAction && projection.nextAction.actor ? `<small>Próximo ator: ${escapeHtml(projection.nextAction.actor)}</small>` : ''}</dd></div>
                </dl>
                ${renderActions(school, projection)}
            </article>
        `;
    }

    function renderOperationalTable(targetSchools) {
        const projection = buildProjection(targetSchools);
        const schoolById = new Map(targetSchools.map(school => [school.id, school]));
        if (!targetSchools.length) {
            return `
                <div class="empty-state compact" role="status" aria-live="polite">
                    <strong>Nenhuma escola encontrada</strong>
                    <span>Ajuste a busca ou limpe os filtros para ampliar o resultado.</span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="clearEscolaFilters()">Limpar filtros</button>
                </div>
            `;
        }
        if (isMobileViewport()) {
            return `
                <div class="table-responsive cycle-b-wallet-mobile">
                    ${projection.schools.map(item => renderMobileCard(schoolById.get(item.schoolId), item)).join('')}
                </div>
            `;
        }
        return `
            <div class="cycle-b-wallet-desktop">
                <table class="data-table cycle-b-wallet-table">
                    <thead>
                        <tr>
                            <th>Unidade Escolar</th>
                            <th>Identificação</th>
                            <th>Controlador</th>
                            <th>Bonificação</th>
                            <th>Análise técnica</th>
                            <th>Situação documental</th>
                            <th>Abertas</th>
                            <th>Para reanalisar</th>
                            <th>Última movimentação</th>
                            <th>Próxima ação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projection.schools.map(item => renderDesktopRow(schoolById.get(item.schoolId), item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
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

    function enhanceWallet() {
        injectFilterControls();
        const panel = Array.from(document.querySelectorAll('.panel-card')).find(candidate => (
            candidate.querySelector('.panel-header h2')?.textContent.trim() === 'Resultado da carteira'
        ));
        if (!panel) return false;
        const oldWrapper = panel.querySelector('.table-responsive');
        if (!oldWrapper) return false;
        const targetSchools = getFilteredEscolasEnhanced();
        const replacement = document.createElement('div');
        replacement.className = 'cycle-b-wallet-results';
        replacement.innerHTML = renderOperationalTable(targetSchools);
        oldWrapper.replaceWith(replacement);

        const summary = document.querySelector('.school-filter-summary');
        if (summary && documentaryFilter !== 'all') {
            const chip = document.createElement('span');
            chip.className = 'cycle-b-documentary-chip';
            chip.textContent = `Situação documental: ${document.getElementById('filter-escola-documental')?.selectedOptions[0]?.textContent || documentaryFilter}`;
            summary.appendChild(chip);
        }
        return true;
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
            VERSION: '1.1.0',
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
            enhanceWallet();
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
