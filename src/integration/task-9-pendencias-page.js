(function installTask9PendencyPage(root) {
    const TAB_DEFINITIONS = Object.freeze([
        { key: 'aberta', status: 'Aberta', label: 'Abertas', panelId: 'p-abertas' },
        { key: 'aguardando', status: 'Aguardando reanálise', label: 'Aguardando reanálise', panelId: 'p-aguardando' },
        { key: 'resolvida', status: 'Resolvida', label: 'Resolvidas', panelId: 'p-resolvidas' },
        { key: 'cancelada', status: 'Cancelada', label: 'Canceladas', panelId: 'p-canceladas' }
    ]);

    const pageState = {
        activeTab: 'aberta'
    };
    let installed = false;

    function dependenciesReady() {
        return Boolean(
            root.RadarPendenciasViewModel
            && typeof root.renderPendencias === 'function'
            && typeof root.switchView === 'function'
            && typeof root.encodePendencyIdReference === 'function'
        );
    }

    function getPageModel() {
        return root.RadarPendenciasViewModel.createPendencyPageModel({
            pendencias,
            escolas,
            programas,
            controladores,
            contatos,
            filters: {}
        });
    }

    function getActiveTabForSelectedPendency(model) {
        if (activePendencyDetailId == null) return pageState.activeTab;
        const selected = model.records.find(record => record.id === activePendencyDetailId);
        return selected ? selected.statusKey : pageState.activeTab;
    }

    function formatDate(value) {
        if (!value) return 'Data não informada';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Data não informada';
        return parsed.toLocaleDateString('pt-BR');
    }

    function getStatusBadgeClass(status) {
        if (status === 'Aberta') return 'badge-warning';
        if (status === 'Aguardando reanálise') return 'badge-info';
        if (status === 'Resolvida') return 'badge-success';
        return 'badge-gray';
    }

    function renderErrors(record) {
        if (!record.errors.length) return '<span class="pendency-muted">Nenhum erro ativo</span>';
        const visible = record.errors.slice(0, 2);
        const remaining = record.errors.length - visible.length;
        return `
            <ul class="pendency-error-summary" aria-label="Erros atuais">
                ${visible.map(error => `<li>${escapeHtml(error)}</li>`).join('')}
            </ul>
            ${remaining > 0 ? `<span class="pendency-more-errors">+${remaining} erro${remaining === 1 ? '' : 's'}</span>` : ''}
        `;
    }

    function renderActionButtons(record) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        const buttons = [
            `<button class="btn btn-secondary btn-sm" data-action="open-pendency-detail" data-pendency-ref="${reference}" onclick="openPendencyDetail(resolvePendencyIdReference(this))">Ver detalhes</button>`
        ];

        if (record.status === 'Aberta' && currentProfile !== 'inventario') {
            buttons.push(`
                <button class="btn btn-primary btn-sm" data-action="register-corrective-submission" data-pendency-ref="${reference}" onclick="abrirModalRegistrarNovoEnvio(this)">Registrar novo envio</button>
            `);
        }
        if (record.status === 'Aguardando reanálise' && canReanalysePendency(record.pendency)) {
            buttons.push(`
                <button class="btn btn-primary btn-sm" data-action="reanalyse-pendency" data-pendency-ref="${reference}" onclick="abrirModalReanalisarPendencia(this)">Reanalisar</button>
            `);
        }
        if (record.status === 'Aguardando reanálise' && currentProfile !== 'inventario') {
            buttons.push(`
                <button class="btn btn-secondary btn-sm" data-action="register-corrective-submission" data-pendency-ref="${reference}" onclick="abrirModalRegistrarNovoEnvio(this)">Registrar substituição mais recente</button>
            `);
        }
        buttons.push(`<button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(record.schoolId)}')">Abrir prontuário</button>`);
        return `<div class="pendency-row-actions">${buttons.join('')}</div>`;
    }

    function renderDesktopRow(record) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        const isSelected = record.id === activePendencyDetailId;
        return `
            <tr
                data-pendency-id="${escapeHtml(String(record.id))}"
                data-pendency-ref="${reference}"
                data-pendency-status="${escapeHtml(record.status)}"
                class="${isSelected ? 'pendency-row-selected' : ''}"
                aria-current="${isSelected ? 'true' : 'false'}"
            >
                <td>
                    <strong>${escapeHtml(record.schoolName)}</strong>
                    <small>${escapeHtml(record.schoolDesignation)} · ${escapeHtml(record.controllerName)}</small>
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
                <td>${escapeHtml(formatDate(record.latestMovement && record.latestMovement.at))}</td>
                <td class="pendency-count-cell">${record.attemptCount}</td>
                <td>${renderActionButtons(record)}</td>
            </tr>
        `;
    }

    function renderMobileCard(record) {
        const reference = escapeHtml(encodePendencyIdReference(record.id));
        return `
            <article
                class="pendency-mobile-card ${record.id === activePendencyDetailId ? 'pendency-row-selected' : ''}"
                data-pendency-id="${escapeHtml(String(record.id))}"
                data-pendency-ref="${reference}"
                data-pendency-status="${escapeHtml(record.status)}"
                aria-current="${record.id === activePendencyDetailId ? 'true' : 'false'}"
            >
                <header>
                    <div>
                        <strong>${escapeHtml(record.schoolName)}</strong>
                        <small>${escapeHtml(record.schoolDesignation)}</small>
                    </div>
                    <span class="badge ${getStatusBadgeClass(record.status)}">${escapeHtml(record.status)}</span>
                </header>
                <dl>
                    <div><dt>Competência</dt><dd>${escapeHtml(formatCompetenciaText(record.competence))}</dd></div>
                    <div><dt>Programa</dt><dd>${escapeHtml(record.programName)}</dd></div>
                    <div><dt>Documento</dt><dd>${escapeHtml(record.documentName)}</dd></div>
                    <div><dt>Próxima ação</dt><dd>${escapeHtml(record.nextAction)}</dd></div>
                    <div><dt>Tentativas</dt><dd>${record.attemptCount}</dd></div>
                </dl>
                <div class="pendency-mobile-errors">${renderErrors(record)}</div>
                ${renderActionButtons(record)}
            </article>
        `;
    }

    function getEmptyMessage(tabKey) {
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
        return `
            <section
                class="pendency-tab-panel ${active ? 'active' : ''}"
                id="${definition.panelId}"
                role="tabpanel"
                aria-labelledby="${tabId}"
                ${active ? '' : 'hidden'}
            >
                ${rows.length === 0 ? `
                    <div class="empty-state compact"><p>${escapeHtml(getEmptyMessage(definition.key))}</p></div>
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

    function renderPendenciasTask9() {
        const container = document.getElementById('main-container');
        if (!container) return;
        const model = getPageModel();
        pageState.activeTab = getActiveTabForSelectedPendency(model);
        if (!model.groups[pageState.activeTab]) pageState.activeTab = 'aberta';

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
                        >${definition.label} <span aria-label="${group.counts.total} registro${group.counts.total === 1 ? '' : 's'}">${group.counts.total}</span></button>
                    `;
                }).join('')}
            </div>

            <div class="pendency-page-content">
                ${TAB_DEFINITIONS.map(definition => renderPanel(
                    definition,
                    model.groups[definition.key]
                )).join('')}
            </div>
        `;
    }

    function activatePendencyTab(key, trigger) {
        if (!TAB_DEFINITIONS.some(definition => definition.key === key)) return false;
        pageState.activeTab = key;
        activePendencyDetailId = null;
        renderPendenciasTask9();
        if (trigger && typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                const next = document.getElementById(`pendency-tab-${key}`);
                if (next) next.focus();
            });
        }
        return true;
    }

    function switchPendenciasTabTask9(event, tabId) {
        const definition = TAB_DEFINITIONS.find(item => item.panelId === tabId || item.key === tabId);
        return definition ? activatePendencyTab(definition.key, event && event.currentTarget) : false;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        root.renderPendencias = renderPendenciasTask9;
        root.activatePendencyTab = activatePendencyTab;
        root.switchPendenciasTab = switchPendenciasTabTask9;
        root.RadarTask9PendencyPage = Object.freeze({
            VERSION: '1.0.0',
            getState: () => ({ ...pageState }),
            render: renderPendenciasTask9
        });
        installed = true;
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 10);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
