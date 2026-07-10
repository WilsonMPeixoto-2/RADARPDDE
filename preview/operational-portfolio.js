(function () {
  'use strict';

  const P = window.RadarOperationalPreview;
  if (!P) throw new Error('RadarOperationalPreview não foi carregado.');

  const originalRenderDashboard = renderDashboard;
  const originalRenderEscolas = renderEscolas;
  const originalHandleGlobalSearch = handleGlobalSearch;

  function renderTable(summaries) {
    if (summaries.length === 0) {
      return `<div class="operational-empty-state portfolio-empty"><strong>Nenhuma escola encontrada</strong><span>Remova ou altere os filtros para ampliar os resultados.</span></div>`;
    }

    return `
      <div class="operational-table-wrap">
        <table class="operational-table">
          <thead>
            <tr>
              <th>Escola</th><th>Responsável</th><th>Situação</th><th>Pendências</th>
              <th>Última movimentação</th><th>Próxima ação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${summaries.map(summary => {
              const movement = summary.latestMovement;
              return `
                <tr>
                  <td>
                    <div class="operational-school-cell">
                      <strong>${P.safe(summary.escola.designação)}</strong>
                      <span>${P.safe(summary.escola.denominação)}</span>
                      <div class="operational-program-chips">${P.programChips(summary.escola)}</div>
                    </div>
                  </td>
                  <td>${P.safe(summary.controllerName)}</td>
                  <td>${P.stateBadge(summary.state, summary.stateMeta)}</td>
                  <td>
                    <div class="operational-pendency-counts">
                      ${summary.openPendencies > 0 ? `<span class="danger-count">${summary.openPendencies} aberta${summary.openPendencies === 1 ? '' : 's'}</span>` : ''}
                      ${summary.awaitingReanalysis > 0 ? `<span class="info-count">${summary.awaitingReanalysis} para reanalisar</span>` : ''}
                      ${summary.openPendencies === 0 && summary.awaitingReanalysis === 0 ? '<span class="muted-count">Sem pendência</span>' : ''}
                    </div>
                  </td>
                  <td>
                    <div class="operational-movement">
                      <strong>${P.safe(movement?.label || 'Sem movimentação registrada')}</strong>
                      ${movement?.dateLabel ? `<span>${P.safe(movement.dateLabel)}</span>` : ''}
                    </div>
                  </td>
                  <td><div class="operational-next-action">${P.nextAction(summary)}</div></td>
                  <td><button type="button" class="btn btn-primary btn-sm" data-preview-open-school="${P.safe(summary.escola.id)}">Abrir prontuário</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderMobileCards(summaries) {
    return `
      <div class="operational-mobile-list">
        ${summaries.map(summary => `
          <article class="operational-mobile-school-card">
            <div class="operational-mobile-card-top">
              <div>
                <strong>${P.safe(summary.escola.designação)}</strong>
                <span>${P.safe(summary.escola.denominação)}</span>
              </div>
              ${P.stateBadge(summary.state, summary.stateMeta)}
            </div>
            <div class="operational-program-chips">${P.programChips(summary.escola)}</div>
            <dl>
              <div><dt>Responsável</dt><dd>${P.safe(summary.controllerName)}</dd></div>
              <div><dt>Pendências</dt><dd>${summary.openPendencies} abertas · ${summary.awaitingReanalysis} para reanalisar</dd></div>
              <div><dt>Próxima ação</dt><dd>${P.safe(summary.nextAction?.label || 'Nenhuma ação pendente')}</dd></div>
            </dl>
            <button type="button" class="btn btn-primary" data-preview-open-school="${P.safe(summary.escola.id)}">Abrir prontuário</button>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPortfolio() {
    const container = document.getElementById('main-container');
    if (!container) return;

    P.ensureProfileDefaults();
    const summaries = P.filteredSummaries();
    const chips = P.activeChips();

    container.innerHTML = `
      <section id="operational-portfolio" class="operational-preview-page">
        <div class="operational-preview-ribbon"><span></span>Prévia do bloco 1 · Carteira operacional</div>

        <div class="operational-page-heading">
          <div>
            <h1>Carteira de Escolas</h1>
            <p>Consulte as unidades da competência selecionada, acompanhe a situação e acesse as ações necessárias.</p>
          </div>
          <div class="operational-heading-meta">
            <div class="operational-competence-chip">${P.safe(P.competenceLabel())}</div>
            <strong>${summaries.length} escola${summaries.length === 1 ? '' : 's'} encontrada${summaries.length === 1 ? '' : 's'}</strong>
          </div>
        </div>

        <section class="operational-filter-panel ${P.state.filtersOpen ? 'is-open' : ''}">
          <button type="button" class="operational-filter-toggle" data-preview-toggle-filters>
            Filtros${chips.length ? ` · ${chips.length}` : ''}<span aria-hidden="true">${P.state.filtersOpen ? '▴' : '▾'}</span>
          </button>

          <div class="operational-filter-grid">
            <label class="operational-search-field">
              <span>Escola ou designação</span>
              <input id="preview-search" class="form-control" type="search" value="${P.safe(P.state.search)}" placeholder="Digite o nome ou a designação da unidade">
            </label>
            <label>
              <span>Situação</span>
              <select id="preview-status-filter" class="form-control">
                <option value="all">Todas</option>
                <option value="nao-iniciado" ${P.state.status === 'nao-iniciado' ? 'selected' : ''}>Não iniciado</option>
                <option value="em-analise" ${P.state.status === 'em-analise' ? 'selected' : ''}>Em análise</option>
                <option value="com-pendencia" ${P.state.status === 'com-pendencia' ? 'selected' : ''}>Com pendência</option>
                <option value="aguardando-reanalise" ${P.state.status === 'aguardando-reanalise' ? 'selected' : ''}>Aguardando reanálise</option>
                <option value="inapto" ${P.state.status === 'inapto' ? 'selected' : ''}>Inapto</option>
                <option value="apto" ${P.state.status === 'apto' ? 'selected' : ''}>Apto</option>
                <option value="fora-escopo" ${P.state.status === 'fora-escopo' ? 'selected' : ''}>Fora do escopo</option>
                <option value="concluido" ${P.state.status === 'concluido' ? 'selected' : ''}>Concluídas</option>
              </select>
            </label>
            <label>
              <span>Programa</span>
              <select id="preview-program-filter" class="form-control">
                <option value="all">Todos</option>
                ${programas.map(program => `<option value="${P.safe(program.id)}" ${P.state.program === program.id ? 'selected' : ''}>${P.safe(program.name)}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>Controlador</span>
              <select id="preview-controller-filter" class="form-control" ${currentProfile === 'controlador' ? 'disabled' : ''}>
                <option value="all">Todos</option>
                ${controladores.map(controller => `<option value="${P.safe(controller.id)}" ${P.state.controller === controller.id ? 'selected' : ''}>${P.safe(controller.name)}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>Pendências</span>
              <select id="preview-pendency-filter" class="form-control">
                <option value="all">Todas</option>
                <option value="open" ${P.state.pendency === 'open' ? 'selected' : ''}>Com pendência aberta</option>
                <option value="reanalysis" ${P.state.pendency === 'reanalysis' ? 'selected' : ''}>Aguardando reanálise</option>
                <option value="none" ${P.state.pendency === 'none' ? 'selected' : ''}>Sem pendência</option>
              </select>
            </label>
          </div>

          ${chips.length ? `
            <div class="operational-active-filters">
              <div>${chips.map(chip => `<button type="button" data-preview-remove-filter="${chip.key}">${P.safe(chip.label)} <span aria-hidden="true">×</span></button>`).join('')}</div>
              <button type="button" class="operational-clear-filters" data-preview-clear-filters>Limpar filtros</button>
            </div>
          ` : ''}
        </section>

        <section class="operational-portfolio-results">
          ${renderTable(summaries)}
          ${renderMobileCards(summaries)}
        </section>
      </section>
    `;
  }

  function openPortfolio(queue) {
    P.applyQueue(queue || 'all');
    switchView('escolas');
  }

  function openSchool(escolaId) {
    activeProntuarioCompetencia = activeCompetenciaKey;
    switchView('prontuario', escolaId);
  }

  function installOverrides() {
    renderDashboard = function () {
      if (currentProfile === 'inventario') return originalRenderDashboard();
      return P.renderDashboard(document.getElementById('main-container'));
    };
    renderEscolas = renderPortfolio;
    handleGlobalSearch = function (event) {
      P.state.search = event?.target?.value || '';
      if (currentView !== 'escolas') switchView('escolas');
      else renderPortfolio();
    };
    window.__radarOriginalRenderEscolas = originalRenderEscolas;
    window.__radarOriginalHandleGlobalSearch = originalHandleGlobalSearch;
  }

  document.addEventListener('click', event => {
    const queue = event.target.closest('[data-preview-queue]');
    if (queue) return openPortfolio(queue.dataset.previewQueue);
    if (event.target.closest('[data-preview-open-portfolio]')) return openPortfolio('all');

    const school = event.target.closest('[data-preview-open-school]');
    if (school) return openSchool(school.dataset.previewOpenSchool);

    const remove = event.target.closest('[data-preview-remove-filter]');
    if (remove) {
      P.clearFilter(remove.dataset.previewRemoveFilter);
      return renderPortfolio();
    }

    if (event.target.closest('[data-preview-clear-filters]')) {
      P.resetFilters();
      return renderPortfolio();
    }

    if (event.target.closest('[data-preview-toggle-filters]')) {
      P.state.filtersOpen = !P.state.filtersOpen;
      return renderPortfolio();
    }
  });

  document.addEventListener('change', event => {
    const map = {
      'preview-status-filter': 'status',
      'preview-program-filter': 'program',
      'preview-controller-filter': 'controller',
      'preview-pendency-filter': 'pendency'
    };
    const key = map[event.target.id];
    if (!key) return;
    P.state[key] = event.target.value;
    renderPortfolio();
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'preview-search') return;
    P.state.search = event.target.value || '';
    renderPortfolio();
    requestAnimationFrame(() => {
      const input = document.getElementById('preview-search');
      if (!input) return;
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  function activate() {
    document.body.classList.add('operational-preview-active');
    installOverrides();
    if (currentView === 'escolas') renderPortfolio();
    else if (currentView === 'dashboard' || !currentView) renderDashboard();
  }

  installOverrides();
  P.renderPortfolio = renderPortfolio;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(activate, 0), { once: true });
  } else {
    setTimeout(activate, 0);
  }
}());