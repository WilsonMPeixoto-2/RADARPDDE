(function () {
  'use strict';

  const P = window.RadarOperationalPreview;
  if (!P) throw new Error('RadarOperationalPreview não foi carregado.');

  function renderDashboardOperational(container) {
    if (!container) return;
    P.ensureProfileDefaults();

    const summaries = P.allSummaries();
    const queues = P.Journey.buildWorkQueues(summaries);
    const nextActions = summaries
      .filter(summary => summary.nextAction && summary.nextAction.priority < 99)
      .sort((a, b) => a.nextAction.priority - b.nextAction.priority)
      .slice(0, 6);
    const openPendencies = summaries.reduce((sum, summary) => sum + summary.openPendencies, 0);
    const awaiting = summaries.filter(summary => summary.state === 'aguardando-reanalise').length;
    const inScope = summaries.filter(summary => summary.state !== 'fora-escopo').length;

    container.innerHTML = `
      <section id="operational-dashboard" class="operational-preview-page">
        <div class="operational-preview-ribbon"><span></span>Prévia do bloco 1 · Dashboard e Carteira</div>

        <div class="operational-page-heading">
          <div>
            <h1>Visão geral da competência</h1>
            <p>Acompanhe a situação das unidades e acesse diretamente os trabalhos que exigem providência.</p>
          </div>
          <div class="operational-competence-chip">Competência: <strong>${P.safe(P.competenceLabel())}</strong></div>
        </div>

        <div class="operational-queue-grid" aria-label="Fila de trabalho">
          ${P.QUEUES.map(config => `
            <button type="button" class="operational-queue-card tone-${config.tone}" data-preview-queue="${config.key}">
              <span class="operational-queue-icon" aria-hidden="true">${config.icon}</span>
              <span class="operational-queue-content">
                <span class="operational-queue-title">${P.safe(config.title)}</span>
                <span class="operational-queue-value">${queues[config.key] || 0}</span>
                <span class="operational-queue-helper">${P.safe(config.helper)}</span>
                <span class="operational-queue-action">${P.safe(config.action)} →</span>
              </span>
            </button>
          `).join('')}
        </div>

        <div class="operational-dashboard-grid">
          <section class="operational-panel">
            <div class="operational-panel-heading">
              <div>
                <h2>Próximas ações</h2>
                <p>Itens organizados pela prioridade operacional.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-preview-open-portfolio>Ver carteira completa</button>
            </div>

            <div class="operational-action-list">
              ${nextActions.length === 0 ? `
                <div class="operational-empty-state">
                  <strong>Nenhuma ação pendente</strong>
                  <span>A competência não possui tarefas operacionais para este perfil.</span>
                </div>
              ` : nextActions.map(summary => `
                <article class="operational-action-row">
                  <div>${P.stateBadge(summary.state, summary.stateMeta)}</div>
                  <div class="operational-action-school">
                    <strong>${P.safe(summary.escola.designação)} — ${P.safe(summary.escola.denominação)}</strong>
                    <span>${P.safe(summary.nextAction.programaNome || 'Visão geral da unidade')}</span>
                  </div>
                  <div class="operational-action-description">
                    <span>Próxima ação</span>
                    <strong>${P.safe(summary.nextAction.label)}</strong>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm" data-preview-open-school="${P.safe(summary.escola.id)}">Abrir prontuário</button>
                </article>
              `).join('')}
            </div>
          </section>

          <aside class="operational-panel operational-summary-panel">
            <div class="operational-panel-heading">
              <div>
                <h2>Resumo da competência</h2>
                <p>Indicadores com unidade de medida explícita.</p>
              </div>
            </div>
            <dl class="operational-summary-list">
              <div><dt>Unidades no escopo</dt><dd>${inScope} escolas</dd></div>
              <div><dt>Pendências abertas</dt><dd>${openPendencies} registros</dd></div>
              <div><dt>Aguardando reanálise</dt><dd>${awaiting} escolas</dd></div>
              <div><dt>Concluídas</dt><dd>${queues.concluido} escolas</dd></div>
            </dl>
            <div class="operational-summary-note">
              <strong>Como ler este painel</strong>
              <span>Clique em uma fila para abrir a Carteira já filtrada. A produção continua intacta nesta prévia.</span>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  P.renderDashboard = renderDashboardOperational;
}());