(function installTask9PendencyPage(root) {
    'use strict';

    const TAB_DEFINITIONS = Object.freeze([
        { key: 'aberta', status: 'Aberta', label: 'Abertas', panelId: 'p-abertas' },
        { key: 'aguardando', status: 'Aguardando reanálise', label: 'Aguardando reanálise', panelId: 'p-aguardando' },
        { key: 'resolvida', status: 'Resolvida', label: 'Resolvidas', panelId: 'p-resolvidas' },
        { key: 'cancelada', status: 'Cancelada', label: 'Canceladas', panelId: 'p-canceladas' }
    ]);
    const DEFAULT_FILTERS = Object.freeze({
        query: '',
        schoolId: '',
        competence: '',
        programId: '',
        documentKey: '',
        error: '',
        nextActor: '',
        controllerId: '',
        age: ''
    });
    const FILTER_LABELS = Object.freeze({
        schoolId: 'Unidade',
        competence: 'Competência',
        programId: 'Programa',
        documentKey: 'Documento',
        error: 'Erro',
        nextActor: 'Responsável',
        controllerId: 'Controlador',
        age: 'Antiguidade'
    });
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const pageState = {
        activeTab: 'aberta',
        filters: { ...DEFAULT_FILTERS },
        initialized: false,
        returnContext: null
    };
    let installed = false;
    let originalSwitchView = null;
    let drawerTriggerId = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarPendenciasViewModel
            && root.RadarPendencias
            && typeof root.renderPendencias === 'function'
            && typeof root.switchView === 'function'
            && typeof root.encodePendencyIdReference === 'function'
            && typeof root.resolvePendencyIdReference === 'function'
        );
    }

    function isMobileViewport() {
        return Boolean(root.matchMedia && root.matchMedia('(max-width: 700px)').matches);
    }

    function normalize(value) {
        return root.RadarPendenciasViewModel.normalizeSearchText(value);
    }

    function uniqueSorted(values, labelSelector) {
        const seen = new Map();
        (Array.isArray(values) ? values : []).forEach(value => {
            const item = labelSelector ? labelSelector(value) : value;
            if (!item || !item.value) return;
            if (!seen.has(item.value)) seen.set(item.value, item);
        });
        return Array.from(seen.values()).sort((left, right) => (
            String(left.label).localeCompare(String(right.label), 'pt-BR', {
                sensitivity: 'base',
                numeric: true
            })
        ));
    }

    function getPageModel() {
        return root.RadarPendenciasViewModel.createPendencyPageModel({
            pendencias,
            escolas,
            programas,
            controladores,
            contatos,
            filters: pageState.filters
        });
    }

    function getSelectedRecord(model) {
        if (activePendencyDetailId == null) return null;
        return model.records.find(record => record.id === activePendencyDetailId) || null;
    }

    function resolveInitialTab(model) {
        const selected = getSelectedRecord(model);
        if (selected) return selected.statusKey;
        if (pageState.initialized) return pageState.activeTab;

        pageState.initialized = true;
        if (model.groups.aberta.counts.total > 0) return 'aberta';
        if (model.groups.aguardando.counts.total > 0) return 'aguardando';
        if (model.groups.resolvida.counts.total > 0) return 'resolvida';
        if (model.groups.cancelada.counts.total > 0) return 'cancelada';
        return 'aberta';
    }

    function ensureUsefulActiveTab(model) {
        const selected = getSelectedRecord(model);
        if (selected) return selected.statusKey;
        const current = model.groups[pageState.activeTab];
        if (!current) return 'aberta';

        const hasFilters = getActiveFilterCount() > 0;
        if (hasFilters || current.counts.total > 0) return pageState.activeTab;
        if (pageState.activeTab === 'aberta' && model.groups.aguardando.counts.total > 0) {
            return 'aguardando';
        }
        if (pageState.activeTab === 'aguardando' && model.groups.aberta.counts.total > 0) {
            return 'aberta';
        }
        return pageState.activeTab;
    }

    function formatDate(value) {
        if (!value) return 'Data não informada';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Data não informada';
        return parsed.toLocaleDateString('pt-BR');
    }

    function formatDateTime(value) {
        if (!value) return 'Data não informada';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Data não informada';
        const hasTime = /T\d{2}:\d{2}/.test(String(value));
        return hasTime
            ? parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : parsed.toLocaleDateString('pt-BR');
    }

    function getStatusBadgeClass(status) {
        if (status === 'Aberta') return 'badge-warning';
        if (status === 'Aguardando reanálise') return 'badge-info';
        if (status === 'Resolvida') return 'badge-success';
        return 'badge-gray';
    }

    function getStatusKey(status) {
        return root.RadarPendenciasViewModel.STATUS_KEYS[status] || 'aberta';
    }

    function getActiveFilterCount() {
        return Object.keys(pageState.filters).filter(key => (
            String(pageState.filters[key] || '').trim() !== ''
        )).length;
    }

    function isDocumentaryRecord(record) {
        return Boolean(
            record
            && !record.contextIncomplete
            && root.RadarPendencias.isDocumentaryPendency(record.pendency)
        );
    }

    function renderErrors(record, { full = false } = {}) {
        if (!record.errors.length) return '<span class="pendency-muted">Nenhum erro ativo</span>';
        const visible = full ? record.errors : record.errors.slice(0, 2);
        const remaining = record.errors.length - visible.length;
        return `
            <ul class="pendency-error-summary" aria-label="Erros atuais">
                ${visible.map(error => `<li>${escapeHtml(error)}</li>`).join('')}
            </ul>
            ${remaining > 0 ? `<span class="pendency-more-errors">+${remaining} erro${remaining === 1 ? '' : 's'}</span>` : ''}
        `;
    }

    function sanitizeExternalUrl(value) {
        try {
            const url = new URL(String(value || ''));
            return url.protocol === 'https:' ? url.href : null;
        } catch (error) {
            return null;
        }
    }

    function renderActionButtons(record, { drawer = false } = {}) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        const documentary = isDocumentaryRecord(record);
        const buttons = [];

        if (!drawer) {
            buttons.push(`<button class="btn btn-secondary btn-sm" data-action="open-pendency-detail" data-pendency-ref="${reference}" onclick="openPendencyDetail(this)">Ver detalhes</button>`);
        }
        if (record.status === 'Aberta' && documentary && currentProfile !== 'inventario') {
            buttons.push(`
                <button class="btn btn-primary btn-sm" data-action="register-corrective-submission" data-pendency-ref="${reference}" onclick="abrirModalRegistrarNovoEnvio(this)">Registrar novo envio</button>
            `);
        }
        if (record.status === 'Aguardando reanálise' && documentary && canReanalysePendency(record.pendency)) {
            buttons.push(`
                <button class="btn btn-primary btn-sm" data-action="reanalyse-pendency" data-pendency-ref="${reference}" onclick="abrirModalReanalisarPendencia(this)">Reanalisar</button>
            `);
        }
        if (record.status === 'Aguardando reanálise' && documentary && currentProfile !== 'inventario') {
            buttons.push(`
                <button class="btn btn-secondary btn-sm" data-action="register-corrective-submission" data-pendency-ref="${reference}" onclick="abrirModalRegistrarNovoEnvio(this)">Registrar substituição mais recente</button>
            `);
        }
        buttons.push(`<button class="btn btn-secondary btn-sm" data-action="open-pendency-prontuario" data-pendency-ref="${reference}" onclick="openPendencyInProntuario(this)">Abrir no Prontuário</button>`);
        return `<div class="pendency-row-actions">${buttons.join('')}</div>`;
    }

    function renderSelectionMarker(isSelected) {
        return isSelected
            ? '<span class="pendency-detail-marker">Pendência selecionada</span>'
            : '';
    }

    function renderDesktopRow(record) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        const isSelected = record.id === activePendencyDetailId;
        return `
            <tr
                data-pendency-id="${escapeHtml(String(record.id))}"
                data-pendency-ref="${reference}"
                data-pendency-status="${escapeHtml(record.status)}"
                data-program-id="${escapeHtml(record.programId)}"
                data-document-key="${escapeHtml(record.documentKey)}"
                class="${isSelected ? 'pendency-row-selected' : ''}"
                aria-current="${isSelected ? 'true' : 'false'}"
                tabindex="-1"
            >
                <td>
                    <strong>${escapeHtml(record.schoolName)}</strong>
                    <small>${escapeHtml(record.schoolDesignation)} · ${escapeHtml(record.controllerName)}</small>
                    ${renderSelectionMarker(isSelected)}
                </td>
                <td>${escapeHtml(formatCompetenciaText(record.competence))}</td>
                <td>
                    <strong>${escapeHtml(record.programName)}</strong>
                    <small>${escapeHtml(record.documentName)}</small>
                </td>
                <td>${renderErrors(record)}</td>
                <td><span class="badge ${getStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span></td>
                <td>
                    <strong>${escapeHtml(record.nextAction)}</strong>
                    ${record.nextActor ? `<small>Responsável: ${escapeHtml(record.nextActor)}</small>` : ''}
                </td>
                <td>
                    ${escapeHtml(formatDate(record.latestMovement && record.latestMovement.at))}
                    ${record.ageDays != null && ['Aberta', 'Aguardando reanálise'].includes(record.status)
                        ? `<small>${record.ageDays} dia${record.ageDays === 1 ? '' : 's'} aguardando</small>`
                        : ''}
                </td>
                <td class="pendency-count-cell">${record.attemptCount}</td>
                <td>${renderActionButtons(record)}</td>
            </tr>
        `;
    }

    function renderMobileCard(record) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        const selected = record.id === activePendencyDetailId;
        return `
            <article
                class="pendency-mobile-card ${selected ? 'pendency-row-selected' : ''}"
                data-pendency-id="${escapeHtml(String(record.id))}"
                data-pendency-ref="${reference}"
                data-pendency-status="${escapeHtml(record.status)}"
                data-program-id="${escapeHtml(record.programId)}"
                data-document-key="${escapeHtml(record.documentKey)}"
                aria-current="${selected ? 'true' : 'false'}"
                tabindex="-1"
            >
                <header>
                    <div>
                        <strong>${escapeHtml(record.schoolName)}</strong>
                        <small>${escapeHtml(record.schoolDesignation)}</small>
                        ${renderSelectionMarker(selected)}
                    </div>
                    <span class="badge ${getStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span>
                </header>
                <dl>
                    <div><dt>Competência</dt><dd>${escapeHtml(formatCompetenciaText(record.competence))}</dd></div>
                    <div><dt>Programa</dt><dd>${escapeHtml(record.programName)}</dd></div>
                    <div><dt>Documento</dt><dd>${escapeHtml(record.documentName)}</dd></div>
                    <div><dt>Próxima ação</dt><dd>${escapeHtml(record.nextAction)}</dd></div>
                    <div><dt>Tempo aguardando</dt><dd>${record.ageDays == null ? 'Não informado' : `${record.ageDays} dia${record.ageDays === 1 ? '' : 's'}`}</dd></div>
                    <div><dt>Tentativas</dt><dd>${record.attemptCount}</dd></div>
                </dl>
                <div class="pendency-mobile-errors">${renderErrors(record)}</div>
                ${renderActionButtons(record)}
            </article>
        `;
    }

    function getEmptyMessage(tabKey, filtered) {
        if (filtered) return 'Nenhuma pendência corresponde à busca e aos filtros aplicados.';
        const messages = {
            aberta: 'Nenhuma pendência depende de providência da escola.',
            aguardando: 'Nenhum novo envio aguarda conferência.',
            resolvida: 'Nenhuma pendência resolvida foi encontrada.',
            cancelada: 'Nenhum lançamento cancelado foi encontrado.'
        };
        return messages[tabKey] || 'Nenhuma pendência encontrada.';
    }

    function renderPanel(definition, group) {
        const active = pageState.activeTab === definition.key;
        const tabId = `pendency-tab-${definition.key}`;
        const rows = group.records;
        const filteredEmpty = group.counts.filtered === 0 && group.counts.total > 0;
        return `
            <section
                class="pendency-tab-panel ${active ? 'active' : ''}"
                id="${definition.panelId}"
                role="tabpanel"
                aria-labelledby="${tabId}"
                ${active ? '' : 'hidden'}
            >
                ${rows.length === 0 ? `
                    <div class="empty-state compact">
                        <p>${escapeHtml(getEmptyMessage(definition.key, filteredEmpty))}</p>
                        ${filteredEmpty ? '<button class="btn btn-secondary btn-sm" onclick="clearPendencyFilters()">Limpar filtros</button>' : ''}
                    </div>
                ` : `
                    <div class="pendency-desktop-list table-responsive">
                        <table class="data-table pendency-operations-table">
                            <thead>
                                <tr>
                                    <th>Unidade escolar</th>
                                    <th>Competência</th>
                                    <th>Programa e documento</th>
                                    <th>Erros atuais</th>
                                    <th>Situação</th>
                                    <th>Próxima ação</th>
                                    <th>Última movimentação</th>
                                    <th>Tentativas</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>${rows.map(renderDesktopRow).join('')}</tbody>
                        </table>
                    </div>
                    <div class="pendency-mobile-list">${rows.map(renderMobileCard).join('')}</div>
                `}
            </section>
        `;
    }

    function renderOption(value, label, activeValue) {
        return `<option value="${escapeHtml(value)}" ${String(activeValue) === String(value) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }

    function getFilterOptions(model) {
        return {
            schools: uniqueSorted(model.records, record => ({
                value: record.schoolId,
                label: `${record.schoolName} · ${record.schoolDesignation}`
            })),
            competences: uniqueSorted(model.records, record => ({
                value: record.competence,
                label: formatCompetenciaText(record.competence)
            })),
            programs: uniqueSorted(model.records, record => ({
                value: record.programId,
                label: record.programName
            })),
            documents: uniqueSorted(model.records, record => ({
                value: record.documentKey,
                label: record.documentName
            })),
            errors: uniqueSorted(model.records.flatMap(record => record.errors).map(error => ({
                value: error,
                label: error
            }))),
            controllers: uniqueSorted(model.records, record => ({
                value: record.controllerId,
                label: record.controllerName
            })).filter(option => option.value),
            actors: [
                { value: 'Escola', label: 'Escola' },
                { value: 'Controlador', label: 'Controlador' }
            ]
        };
    }

    function renderFilterChips(options) {
        const chips = [];
        Object.keys(pageState.filters).forEach(key => {
            const value = String(pageState.filters[key] || '').trim();
            if (!value) return;
            let label = value;
            if (key === 'query') {
                label = `Busca: ${value}`;
            } else {
                const optionGroup = {
                    schoolId: options.schools,
                    competence: options.competences,
                    programId: options.programs,
                    documentKey: options.documents,
                    error: options.errors,
                    nextActor: options.actors,
                    controllerId: options.controllers,
                    age: [
                        { value: '0-7', label: 'Até 7 dias' },
                        { value: '8-15', label: '8 a 15 dias' },
                        { value: '16-30', label: '16 a 30 dias' },
                        { value: '30-plus', label: '30 dias ou mais' }
                    ]
                }[key] || [];
                label = optionGroup.find(option => option.value === value)?.label || value;
                label = `${FILTER_LABELS[key] || key}: ${label}`;
            }
            chips.push(`
                <button type="button" class="pendency-filter-chip" onclick="removePendencyFilter('${key}')" aria-label="Remover filtro ${escapeHtml(label)}">
                    <span>${escapeHtml(label)}</span><span aria-hidden="true">×</span>
                </button>
            `);
        });
        return chips.length ? `<div class="pendency-filter-chips" aria-label="Filtros aplicados">${chips.join('')}</div>` : '';
    }

    function renderFilters(model) {
        const options = getFilterOptions(model);
        const activeCount = getActiveFilterCount();
        return `
            <section class="panel-card pendency-filter-panel" aria-labelledby="pendency-filter-title">
                <div class="pendency-filter-header">
                    <div>
                        <h2 id="pendency-filter-title">Busca e filtros</h2>
                        <p>A busca percorre escola, designação, programa, competência, documento, erro, observações e responsáveis.</p>
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" onclick="clearPendencyFilters()" ${activeCount === 0 ? 'disabled' : ''}>Limpar filtros</button>
                </div>
                <div class="pendency-filter-grid" role="search" aria-label="Pesquisar e filtrar pendências">
                    <div class="filter-field filter-field-wide">
                        <label for="pendency-search-input">Busca global</label>
                        <input
                            type="search"
                            id="pendency-search-input"
                            class="form-control"
                            aria-label="Buscar pendências"
                            placeholder="Escola, designação, documento, erro ou responsável"
                            value="${escapeHtml(pageState.filters.query)}"
                            oninput="updatePendencySearch(this)"
                        >
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-school">Unidade escolar</label>
                        <select id="pendency-filter-school" class="form-control" onchange="changePendencyFilter('schoolId', this.value)">
                            ${renderOption('', 'Todas', pageState.filters.schoolId)}
                            ${options.schools.map(option => renderOption(option.value, option.label, pageState.filters.schoolId)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-competence">Competência</label>
                        <select id="pendency-filter-competence" class="form-control" onchange="changePendencyFilter('competence', this.value)">
                            ${renderOption('', 'Todas', pageState.filters.competence)}
                            ${options.competences.map(option => renderOption(option.value, option.label, pageState.filters.competence)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-program">Programa</label>
                        <select id="pendency-filter-program" class="form-control" onchange="changePendencyFilter('programId', this.value)">
                            ${renderOption('', 'Todos', pageState.filters.programId)}
                            ${options.programs.map(option => renderOption(option.value, option.label, pageState.filters.programId)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-document">Documento</label>
                        <select id="pendency-filter-document" class="form-control" onchange="changePendencyFilter('documentKey', this.value)">
                            ${renderOption('', 'Todos', pageState.filters.documentKey)}
                            ${options.documents.map(option => renderOption(option.value, option.label, pageState.filters.documentKey)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-error">Erro atual</label>
                        <select id="pendency-filter-error" class="form-control" onchange="changePendencyFilter('error', this.value)">
                            ${renderOption('', 'Todos', pageState.filters.error)}
                            ${options.errors.map(option => renderOption(option.value, option.label, pageState.filters.error)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-actor">Responsável pela providência</label>
                        <select id="pendency-filter-actor" class="form-control" onchange="changePendencyFilter('nextActor', this.value)">
                            ${renderOption('', 'Todos', pageState.filters.nextActor)}
                            ${options.actors.map(option => renderOption(option.value, option.label, pageState.filters.nextActor)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-controller">Controlador</label>
                        <select id="pendency-filter-controller" class="form-control" onchange="changePendencyFilter('controllerId', this.value)">
                            ${renderOption('', 'Todos', pageState.filters.controllerId)}
                            ${options.controllers.map(option => renderOption(option.value, option.label, pageState.filters.controllerId)).join('')}
                        </select>
                    </div>
                    <div class="filter-field">
                        <label for="pendency-filter-age">Antiguidade</label>
                        <select id="pendency-filter-age" class="form-control" onchange="changePendencyFilter('age', this.value)">
                            ${renderOption('', 'Todas', pageState.filters.age)}
                            ${renderOption('0-7', 'Até 7 dias', pageState.filters.age)}
                            ${renderOption('8-15', '8 a 15 dias', pageState.filters.age)}
                            ${renderOption('16-30', '16 a 30 dias', pageState.filters.age)}
                            ${renderOption('30-plus', '30 dias ou mais', pageState.filters.age)}
                        </select>
                    </div>
                </div>
                ${renderFilterChips(options)}
                <p class="pendency-filter-result" role="status" aria-live="polite">
                    ${model.filteredTotal} de ${model.total} registro${model.total === 1 ? '' : 's'} encontrado${model.filteredTotal === 1 ? '' : 's'}.
                </p>
            </section>
        `;
    }

    function renderTabCount(group) {
        const filtered = getActiveFilterCount() > 0;
        const text = filtered
            ? `${group.counts.filtered} de ${group.counts.total}`
            : String(group.counts.total);
        const accessible = filtered
            ? `${group.counts.filtered} de ${group.counts.total} registros`
            : `${group.counts.total} registro${group.counts.total === 1 ? '' : 's'}`;
        return `<span aria-label="${accessible}">${text}</span>`;
    }

    function getTimelineTypeLabel(item) {
        const labels = {
            abertura: 'Abertura',
            novo_envio: 'Novo envio',
            reanalise_correta: 'Reanálise correta',
            reanalise_incorreta: 'Reanálise com apontamentos',
            arquivo_indisponivel: 'Arquivo indisponível',
            cancelamento: 'Cancelamento',
            reabertura: 'Reabertura',
            contact: item.contactType ? `Contato · ${item.contactType}` : 'Contato'
        };
        return labels[item.type] || String(item.type || 'Movimentação').replaceAll('_', ' ');
    }

    function renderAttempts(record) {
        if (!record.attempts.length) return '<p class="pendency-muted">Nenhum envio corretivo registrado.</p>';
        return `
            <ol class="pendency-attempt-list">
                ${[...record.attempts].reverse().map(attempt => {
                    const link = sanitizeExternalUrl(attempt.link);
                    const statusLabels = {
                        aguardando: 'Aguardando reanálise',
                        analisada: 'Analisada',
                        substituida_antes_da_analise: 'Substituída antes da análise'
                    };
                    return `
                        <li>
                            <div class="pendency-attempt-heading">
                                <strong>Tentativa ${Number.isInteger(attempt.numero) ? attempt.numero : '—'}</strong>
                                <span class="badge badge-gray">${escapeHtml(statusLabels[attempt.status] || attempt.status || 'Sem status')}</span>
                            </div>
                            <dl class="pendency-compact-dl">
                                <div><dt>Disponibilização</dt><dd>${escapeHtml(formatDate(attempt.dataDisponibilizacao))}</dd></div>
                                <div><dt>Registro</dt><dd>${escapeHtml(formatDateTime(attempt.dataRegistro))}</dd></div>
                                ${attempt.resultado ? `<div><dt>Resultado</dt><dd>${escapeHtml(attempt.resultado)}</dd></div>` : ''}
                            </dl>
                            ${attempt.observacao ? `<p>${escapeHtml(attempt.observacao)}</p>` : ''}
                            ${Array.isArray(attempt.errosEncontrados) && attempt.errosEncontrados.length
                                ? `<div>${renderErrors({ errors: attempt.errosEncontrados }, { full: true })}</div>`
                                : ''}
                            ${link ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir arquivo</a>` : ''}
                        </li>
                    `;
                }).join('')}
            </ol>
        `;
    }

    function renderContacts(record) {
        if (!record.contacts.length) return '<p class="pendency-muted">Nenhum contato vinculado a esta pendência.</p>';
        return `
            <ul class="pendency-contact-list">
                ${[...record.contacts].sort((a, b) => String(b.dataHora || b.data || '').localeCompare(String(a.dataHora || a.data || ''))).map(contact => `
                    <li>
                        <strong>${escapeHtml(contact.tipo || 'Contato')}</strong>
                        <time>${escapeHtml(formatDateTime(contact.dataHora || contact.data))}</time>
                        <p>${escapeHtml(contact.descricao || contact.observacao || 'Sem descrição.')}</p>
                        ${contact.responsavel ? `<small>Registrado por ${escapeHtml(contact.responsavel)}</small>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function renderTimeline(record) {
        const items = root.RadarPendenciasViewModel.buildPendencyTimeline(record);
        if (!items.length) return '<p class="pendency-muted">Nenhuma movimentação registrada.</p>';
        return `
            <ol class="pendency-timeline">
                ${items.map(item => `
                    <li>
                        <div class="pendency-timeline-marker" aria-hidden="true"></div>
                        <div>
                            <div class="pendency-timeline-heading">
                                <strong>${escapeHtml(getTimelineTypeLabel(item))}</strong>
                                <time>${escapeHtml(formatDateTime(item.at))}</time>
                            </div>
                            ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}
                            ${item.user ? `<small>${escapeHtml(item.user)}${item.profile ? ` · ${escapeHtml(item.profile)}` : ''}</small>` : ''}
                            ${item.errors.length ? renderErrors({ errors: item.errors }, { full: true }) : ''}
                        </div>
                    </li>
                `).join('')}
            </ol>
        `;
    }

    function renderDrawer(record) {
        if (!record) return '';
        const mobile = isMobileViewport();
        const role = mobile ? 'dialog' : 'complementary';
        const ariaModal = mobile ? ' aria-modal="true"' : '';
        return `
            <div class="pendency-drawer-layer ${mobile ? 'is-mobile' : 'is-desktop'}">
                <button class="pendency-drawer-backdrop" type="button" aria-label="Fechar detalhes" onclick="closePendencyDetail()"></button>
                <aside
                    id="pendency-detail-drawer"
                    class="pendency-detail-drawer"
                    role="${role}"
                    aria-label="Detalhes da pendência"
                    ${ariaModal}
                    data-pendency-ref="${escapeHtml(encodePendencyIdReference(record.id))}"
                >
                    <header class="pendency-drawer-header">
                        <div>
                            <span class="badge ${getStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span>
                            <h2>${escapeHtml(record.documentName)}</h2>
                            <p>${escapeHtml(record.schoolName)} · ${escapeHtml(record.schoolDesignation)}</p>
                        </div>
                        <button class="btn-close" type="button" aria-label="Fechar detalhes" onclick="closePendencyDetail()">×</button>
                    </header>
                    <div class="pendency-drawer-body">
                        <section aria-labelledby="pendency-detail-context-title">
                            <h3 id="pendency-detail-context-title">Contexto</h3>
                            <dl class="pendency-detail-grid">
                                <div><dt>Competência</dt><dd>${escapeHtml(formatCompetenciaText(record.competence))}</dd></div>
                                <div><dt>Programa</dt><dd>${escapeHtml(record.programName)}</dd></div>
                                <div><dt>Documento</dt><dd>${escapeHtml(record.documentName)}</dd></div>
                                <div><dt>Controlador</dt><dd>${escapeHtml(record.controllerName)}</dd></div>
                                <div><dt>Próxima ação</dt><dd>${escapeHtml(record.nextAction)}</dd></div>
                                <div><dt>Responsável atual</dt><dd>${escapeHtml(record.nextActor || 'Nenhum')}</dd></div>
                                <div><dt>Abertura</dt><dd>${escapeHtml(formatDate(record.openedAt))}</dd></div>
                                <div><dt>Última movimentação</dt><dd>${escapeHtml(formatDateTime(record.latestMovement && record.latestMovement.at))}</dd></div>
                            </dl>
                        </section>
                        <section aria-labelledby="pendency-detail-errors-title">
                            <h3 id="pendency-detail-errors-title">Erros atuais</h3>
                            ${renderErrors(record, { full: true })}
                        </section>
                        <section aria-labelledby="pendency-detail-observation-title">
                            <h3 id="pendency-detail-observation-title">Observação de abertura</h3>
                            <p>${escapeHtml(record.observation || 'Nenhuma observação informada.')}</p>
                        </section>
                        ${record.status === 'Cancelada' ? `
                            <section aria-labelledby="pendency-detail-cancel-title">
                                <h3 id="pendency-detail-cancel-title">Cancelamento</h3>
                                <p>${escapeHtml(record.cancelJustification || 'Justificativa não informada.')}</p>
                                <small>${escapeHtml(formatDateTime(record.cancelledAt))}</small>
                            </section>
                        ` : ''}
                        <section aria-labelledby="pendency-detail-attempt-title">
                            <h3 id="pendency-detail-attempt-title">Tentativas de envio</h3>
                            ${renderAttempts(record)}
                        </section>
                        <section aria-labelledby="pendency-detail-contact-title">
                            <h3 id="pendency-detail-contact-title">Contatos vinculados</h3>
                            ${renderContacts(record)}
                        </section>
                        <section aria-labelledby="pendency-detail-timeline-title">
                            <h3 id="pendency-detail-timeline-title">Linha do tempo</h3>
                            ${renderTimeline(record)}
                        </section>
                    </div>
                    <footer class="pendency-drawer-footer">
                        ${renderActionButtons(record, { drawer: true })}
                    </footer>
                </aside>
            </div>
        `;
    }

    function renderPendenciasTask9(options = {}) {
        const container = document.getElementById('main-container');
        if (!container) return false;
        const model = getPageModel();
        pageState.activeTab = resolveInitialTab(model);
        pageState.activeTab = ensureUsefulActiveTab(model);
        if (!model.groups[pageState.activeTab]) pageState.activeTab = 'aberta';
        const selectedRecord = getSelectedRecord(model);

        container.innerHTML = `
            <div class="page-header pendency-page-header">
                <div class="page-title">
                    <h1>Pendências operacionais</h1>
                    <p>Localize, acompanhe e trate pendências por unidade, competência, programa e documento.</p>
                </div>
                <div class="pendency-active-summary" aria-label="Resumo de pendências ativas">
                    <strong>${model.activeTotal}</strong>
                    <span>pendência${model.activeTotal === 1 ? '' : 's'} ativa${model.activeTotal === 1 ? '' : 's'}</span>
                </div>
            </div>

            ${renderFilters(model)}

            <div class="pendency-tabs" role="tablist" aria-label="Situações das pendências">
                ${TAB_DEFINITIONS.map(definition => {
                    const group = model.groups[definition.key];
                    const active = pageState.activeTab === definition.key;
                    return `
                        <button
                            type="button"
                            class="tab-button ${active ? 'active' : ''}"
                            id="pendency-tab-${definition.key}"
                            role="tab"
                            aria-selected="${active ? 'true' : 'false'}"
                            aria-controls="${definition.panelId}"
                            tabindex="${active ? '0' : '-1'}"
                            onclick="activatePendencyTab('${definition.key}', this)"
                            onkeydown="handlePendencyTabKeydown(event, '${definition.key}')"
                        >${definition.label} ${renderTabCount(group)}</button>
                    `;
                }).join('')}
            </div>

            <div class="pendency-page-content">
                ${TAB_DEFINITIONS.map(definition => renderPanel(
                    definition,
                    model.groups[definition.key]
                )).join('')}
            </div>
            ${renderDrawer(selectedRecord)}
        `;

        if (selectedRecord) syncDrawerSemantics();
        if (options.restoreSearchFocus) restoreSearchFocus(options.selectionStart, options.selectionEnd);
        return true;
    }

    function restoreSearchFocus(selectionStart, selectionEnd) {
        root.requestAnimationFrame(() => {
            const input = document.getElementById('pendency-search-input');
            if (!input) return;
            input.focus({ preventScroll: true });
            const length = input.value.length;
            const start = Number.isInteger(selectionStart) ? Math.min(selectionStart, length) : length;
            const end = Number.isInteger(selectionEnd) ? Math.min(selectionEnd, length) : start;
            input.setSelectionRange(start, end);
        });
    }

    function updatePendencySearch(input) {
        const element = input && input.target ? input.target : input;
        const value = element && typeof element.value === 'string' ? element.value : '';
        const selectionStart = element && Number.isInteger(element.selectionStart)
            ? element.selectionStart
            : value.length;
        const selectionEnd = element && Number.isInteger(element.selectionEnd)
            ? element.selectionEnd
            : selectionStart;
        pageState.filters.query = value;
        renderPendenciasTask9({ restoreSearchFocus: true, selectionStart, selectionEnd });
    }

    function changePendencyFilter(name, value) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_FILTERS, name)) return false;
        pageState.filters[name] = value || '';
        renderPendenciasTask9();
        return true;
    }

    function clearPendencyFilters() {
        pageState.filters = { ...DEFAULT_FILTERS };
        renderPendenciasTask9();
        root.requestAnimationFrame(() => {
            const input = document.getElementById('pendency-search-input');
            if (input) input.focus({ preventScroll: true });
        });
        return true;
    }

    function removePendencyFilter(name) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_FILTERS, name)) return false;
        pageState.filters[name] = '';
        renderPendenciasTask9();
        return true;
    }

    function activatePendencyTab(key, trigger) {
        if (!TAB_DEFINITIONS.some(definition => definition.key === key)) return false;
        const model = getPageModel();
        const selected = getSelectedRecord(model);
        if (selected && selected.statusKey !== key) activePendencyDetailId = null;
        pageState.activeTab = key;
        renderPendenciasTask9();
        if (trigger && typeof root.requestAnimationFrame === 'function') {
            root.requestAnimationFrame(() => {
                const next = document.getElementById(`pendency-tab-${key}`);
                if (next) next.focus({ preventScroll: true });
            });
        }
        return true;
    }

    function handlePendencyTabKeydown(event, key) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return false;
        event.preventDefault();
        const currentIndex = TAB_DEFINITIONS.findIndex(definition => definition.key === key);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TAB_DEFINITIONS.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TAB_DEFINITIONS.length) % TAB_DEFINITIONS.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = TAB_DEFINITIONS.length - 1;
        const next = TAB_DEFINITIONS[nextIndex];
        return activatePendencyTab(next.key, event.currentTarget);
    }

    function switchPendenciasTabTask9(event, tabId) {
        const definition = TAB_DEFINITIONS.find(item => item.panelId === tabId || item.key === tabId);
        return definition ? activatePendencyTab(definition.key, event && event.currentTarget) : false;
    }

    function findVisiblePendencyElement(pendencyId) {
        const candidates = Array.from(document.querySelectorAll('[data-pendency-ref]'));
        return candidates.find(element => (
            typeof root.elementMatchesPendencyIdReference === 'function'
            && root.elementMatchesPendencyIdReference(element, pendencyId)
            && element.getClientRects().length > 0
            && !element.closest('.pendency-detail-drawer')
        )) || null;
    }

    function focusPendencyRecord(pendencyId) {
        root.requestAnimationFrame(() => {
            const target = findVisiblePendencyElement(pendencyId);
            if (!target) return;
            target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            target.focus({ preventScroll: true });
        });
    }

    function focusPendencyDetailTrigger(pendencyId) {
        root.requestAnimationFrame(() => {
            const record = findVisiblePendencyElement(pendencyId);
            const button = record && record.querySelector('[data-action="open-pendency-detail"]');
            if (button) button.focus({ preventScroll: true });
            else if (record) record.focus({ preventScroll: true });
        });
    }

    function openPendencyDetailTask9(source) {
        let pendencyId;
        try {
            pendencyId = root.resolvePendencyIdReference(source);
        } catch (error) {
            console.error('Não foi possível abrir os detalhes da pendência.', error);
            return false;
        }
        const model = getPageModel();
        const record = model.records.find(item => item.id === pendencyId);
        if (!record) return false;

        drawerTriggerId = pendencyId;
        activePendencyDetailId = pendencyId;
        pageState.activeTab = record.statusKey;
        renderPendenciasTask9();

        const sourceIsElement = source && typeof source === 'object' && (
            source.nodeType === 1 || source.currentTarget
        );
        if (sourceIsElement) {
            root.requestAnimationFrame(() => {
                const drawer = document.getElementById('pendency-detail-drawer');
                const close = drawer && drawer.querySelector('.btn-close');
                if (close) close.focus({ preventScroll: true });
            });
        } else {
            focusPendencyRecord(pendencyId);
        }
        return true;
    }

    function closePendencyDetail() {
        if (activePendencyDetailId == null) return false;
        const previousId = drawerTriggerId != null ? drawerTriggerId : activePendencyDetailId;
        activePendencyDetailId = null;
        drawerTriggerId = null;
        renderPendenciasTask9();
        focusPendencyDetailTrigger(previousId);
        return true;
    }

    function syncDrawerSemantics() {
        const drawer = document.getElementById('pendency-detail-drawer');
        const layer = drawer && drawer.closest('.pendency-drawer-layer');
        if (!drawer || !layer) return;
        const mobile = isMobileViewport();
        drawer.setAttribute('role', mobile ? 'dialog' : 'complementary');
        if (mobile) drawer.setAttribute('aria-modal', 'true');
        else drawer.removeAttribute('aria-modal');
        layer.classList.toggle('is-mobile', mobile);
        layer.classList.toggle('is-desktop', !mobile);
    }

    function handleGlobalDrawerKeydown(event) {
        const drawer = document.getElementById('pendency-detail-drawer');
        if (!drawer || activePendencyDetailId == null) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closePendencyDetail();
            return;
        }
        if (!isMobileViewport() || event.key !== 'Tab') return;
        const focusable = Array.from(drawer.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(element => element.getClientRects().length > 0);
        if (!focusable.length) {
            event.preventDefault();
            drawer.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function captureReturnContext(record) {
        return {
            activeTab: pageState.activeTab,
            filters: { ...pageState.filters },
            selectedPendencyId: record.id,
            scrollY: root.scrollY || document.documentElement.scrollTop || 0
        };
    }

    function cssEscape(value) {
        if (root.CSS && typeof root.CSS.escape === 'function') return root.CSS.escape(String(value));
        return String(value).replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`);
    }

    function installProntuarioReturnBanner(record) {
        const container = document.getElementById('main-container');
        if (!container) return;
        const existing = document.getElementById('pendency-context-banner');
        if (existing) existing.remove();
        const banner = document.createElement('div');
        banner.id = 'pendency-context-banner';
        banner.className = 'pendency-context-banner';
        banner.setAttribute('role', 'status');
        banner.innerHTML = `
            <div>
                <strong>Contexto da pendência</strong>
                <span>${escapeHtml(record.programName)} · ${escapeHtml(record.documentName)} · ${escapeHtml(formatCompetenciaText(record.competence))}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="returnToPendencias()">Voltar às Pendências</button>
        `;
        container.prepend(banner);
    }

    function focusProntuarioDocument(record) {
        root.requestAnimationFrame(() => root.requestAnimationFrame(() => {
            installProntuarioReturnBanner(record);
            const selector = `[data-program-id="${cssEscape(record.programId)}"][data-document-key="${cssEscape(record.documentKey)}"]`;
            const candidates = Array.from(document.querySelectorAll(selector));
            const target = candidates.find(element => element.getClientRects().length > 0) || candidates[0];
            if (!target) return;
            target.classList.add('pendency-context-target');
            target.setAttribute('tabindex', '-1');
            target.scrollIntoView({ block: 'center', behavior: 'auto' });
            target.focus({ preventScroll: true });
        }));
    }

    function openPendencyInProntuario(source) {
        let pendencyId;
        try {
            pendencyId = root.resolvePendencyIdReference(source);
        } catch (error) {
            console.error('Não foi possível abrir a pendência no Prontuário.', error);
            return false;
        }
        const model = getPageModel();
        const record = model.records.find(item => item.id === pendencyId);
        if (!record) return false;

        pageState.returnContext = captureReturnContext(record);
        activeProntuarioCompetencia = record.competence;
        originalSwitchView('prontuario', record.schoolId);
        focusProntuarioDocument(record);
        return true;
    }

    function returnToPendencias() {
        const context = pageState.returnContext;
        if (!context) {
            originalSwitchView('pendencias');
            return true;
        }
        pageState.activeTab = context.activeTab;
        pageState.filters = { ...DEFAULT_FILTERS, ...context.filters };
        activePendencyDetailId = context.selectedPendencyId;
        originalSwitchView('pendencias');
        root.requestAnimationFrame(() => {
            root.scrollTo({ top: context.scrollY, behavior: 'auto' });
            const drawer = document.getElementById('pendency-detail-drawer');
            const close = drawer && drawer.querySelector('.btn-close');
            if (close) close.focus({ preventScroll: true });
        });
        return true;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalSwitchView = root.switchView.bind(root);
        root.renderPendencias = renderPendenciasTask9;
        root.activatePendencyTab = activatePendencyTab;
        root.handlePendencyTabKeydown = handlePendencyTabKeydown;
        root.switchPendenciasTab = switchPendenciasTabTask9;
        root.updatePendencySearch = updatePendencySearch;
        root.changePendencyFilter = changePendencyFilter;
        root.clearPendencyFilters = clearPendencyFilters;
        root.removePendencyFilter = removePendencyFilter;
        root.openPendencyDetail = openPendencyDetailTask9;
        root.closePendencyDetail = closePendencyDetail;
        root.openPendencyInProntuario = openPendencyInProntuario;
        root.returnToPendencias = returnToPendencias;
        root.RadarTask9PendencyPage = Object.freeze({
            VERSION: '1.1.0',
            getState: () => ({
                activeTab: pageState.activeTab,
                filters: { ...pageState.filters },
                returnContext: pageState.returnContext ? { ...pageState.returnContext } : null
            }),
            render: renderPendenciasTask9
        });
        document.addEventListener('keydown', handleGlobalDrawerKeydown);
        root.addEventListener('resize', syncDrawerSemantics);
        installed = true;

        if (typeof currentView !== 'undefined' && currentView === 'pendencias') {
            renderPendenciasTask9();
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
