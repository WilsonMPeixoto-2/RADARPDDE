(function () {
  'use strict';

  const Journey = window.RadarJornadaOperacional;
  if (!Journey) throw new Error('RadarJornadaOperacional não foi carregado.');

  const DOCUMENTS = Object.freeze([
    { key: 'extCC', label: 'Extrato Conta Corrente' },
    { key: 'extINV', label: 'Extrato Investimento' },
    { key: 'notaFiscal', label: 'Notas Fiscais' },
    { key: 'consAssessoria', label: 'Consulta Assessoria' },
    { key: 'declBBAgil', label: 'Declaração BB Ágil' },
    { key: 'encampInventario', label: 'Encaminhado para Inventariação' }
  ]);

  const QUEUES = Object.freeze([
    { key: 'nao-iniciado', title: 'Para iniciar', helper: 'Nenhuma análise registrada', action: 'Ver escolas', tone: 'neutral', icon: '○' },
    { key: 'em-analise', title: 'Em análise', helper: 'Trabalho iniciado e ainda incompleto', action: 'Continuar análises', tone: 'warning', icon: '◔' },
    { key: 'com-pendencia', title: 'Com pendência', helper: 'Aguardando providências', action: 'Ver pendências', tone: 'danger', icon: '!' },
    { key: 'aguardando-reanalise', title: 'Aguardando reanálise', helper: 'Pendências já regularizadas', action: 'Reanalisar', tone: 'info', icon: '↻' },
    { key: 'concluido', title: 'Concluídas', helper: 'Análises consolidadas', action: 'Ver concluídas', tone: 'success', icon: '✓' }
  ]);

  const state = {
    status: 'all',
    program: 'all',
    controller: 'all',
    pendency: 'all',
    search: '',
    filtersOpen: false,
    lastProfile: null
  };

  function safe(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(value) {
    if (typeof normalizeSearchText === 'function') return normalizeSearchText(value);
    return String(value || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').trim();
  }

  function competenceLabel() {
    if (typeof formatCompetenciaText === 'function') return formatCompetenciaText(activeCompetenciaKey);
    return COMPETENCIAS.find(item => item.key === activeCompetenciaKey)?.label || activeCompetenciaKey;
  }

  function programName(programId) {
    return programas.find(item => item.id === programId)?.name || programId;
  }

  function controllerName(controllerId) {
    return controladores.find(item => item.id === controllerId)?.name || 'Não designado';
  }

  function ensureProfileDefaults() {
    if (state.lastProfile === currentProfile) return;
    state.lastProfile = currentProfile;
    state.controller = currentProfile === 'controlador' ? getDefaultControladorId() : 'all';
    state.status = 'all';
    state.program = 'all';
    state.pendency = 'all';
  }

  function profileSchools() {
    ensureProfileDefaults();
    if (currentProfile === 'controlador') {
      const controllerId = getDefaultControladorId();
      return escolas.filter(escola => escola.controladorId === controllerId);
    }
    return escolas.slice();
  }

  function contextPendencies(escolaId, programId) {
    return pendencias.filter(pendency => (
      pendency.escolaId === escolaId
      && (pendency.competenciaOrigem || pendency.competencia) === activeCompetenciaKey
      && (!programId || !pendency.programaId || pendency.programaId === programId)
    ));
  }

  function programHasContext(escola, programId) {
    const key = `${activeCompetenciaKey}_${programId}`;
    return Boolean(verificacoes[escola.id]?.[key]) || contextPendencies(escola.id, programId).length > 0;
  }

  function buildProgramSummary(escola, programId) {
    const key = `${activeCompetenciaKey}_${programId}`;
    const name = programName(programId);
    const inScope = isCompetenceInScope(escola.competenciaInicial, activeCompetenciaKey)
      || programHasContext(escola, programId);
    const summary = Journey.getProgramOperationalSummary({
      escolaId: escola.id,
      competenciaKey: activeCompetenciaKey,
      programa: { id: programId, name },
      verificacao: verificacoes[escola.id]?.[key],
      pendencias: contextPendencies(escola.id, programId),
      documentos: DOCUMENTS,
      inScope
    });

    return {
      ...summary,
      stateMeta: Journey.STATE_META[summary.state],
      programaNome: name,
      nextAction: { ...summary.nextAction, programaNome: name }
    };
  }

  function buildSchoolSummary(escola) {
    const programSummaries = (escola.programasIds || []).map(id => buildProgramSummary(escola, id));
    const schoolPendencies = contextPendencies(escola.id);
    const aggregate = Journey.aggregateSchoolOperationalSummary({
      escola,
      programSummaries,
      pendencias: schoolPendencies
    });
    const movement = Journey.getLatestMovement(schoolPendencies);

    return {
      ...aggregate,
      escola,
      controllerName: controllerName(escola.controladorId),
      programSummaries,
      pendencies: schoolPendencies,
      stateMeta: Journey.STATE_META[aggregate.state],
      latestMovement: movement ? {
        label: movement.type,
        dateLabel: new Date(movement.date).toLocaleDateString('pt-BR')
      } : null
    };
  }

  function allSummaries() {
    return profileSchools().map(buildSchoolSummary);
  }

  function presentationSummary(summary) {
    if (state.program === 'all') return summary;
    const selected = summary.programSummaries.find(item => item.programaId === state.program);
    if (!selected) return null;
    return {
      ...summary,
      state: selected.state,
      stateMeta: selected.stateMeta,
      nextAction: selected.nextAction,
      openPendencies: selected.openPendencies,
      awaitingReanalysis: selected.awaitingReanalysis,
      selectedProgramSummary: selected
    };
  }

  function matchesStatus(summary) {
    if (state.status === 'all') return true;
    if (state.status === 'concluido') return summary.state === 'apto' || summary.state === 'inapto';
    return summary.state === state.status;
  }

  function filteredSummaries() {
    const query = normalize(state.search);
    return allSummaries().map(presentationSummary).filter(Boolean)
      .filter(matchesStatus)
      .filter(summary => state.controller === 'all' || summary.escola.controladorId === state.controller)
      .filter(summary => {
        if (state.pendency === 'all') return true;
        if (state.pendency === 'open') return summary.openPendencies > 0;
        if (state.pendency === 'reanalysis') return summary.awaitingReanalysis > 0;
        return summary.openPendencies === 0 && summary.awaitingReanalysis === 0;
      })
      .filter(summary => {
        if (!query) return true;
        const corpus = normalize([
          summary.escola.designação,
          summary.escola.denominação,
          summary.controllerName,
          ...(summary.escola.programasIds || []).map(programName)
        ].join(' '));
        return corpus.includes(query);
      })
      .sort((a, b) => {
        const priority = (a.nextAction?.priority || 99) - (b.nextAction?.priority || 99);
        return priority || String(a.escola.designação).localeCompare(String(b.escola.designação), 'pt-BR');
      });
  }

  function stateBadge(status, meta) {
    const statusMeta = meta || Journey.STATE_META[status] || Journey.STATE_META['nao-iniciado'];
    const icons = {
      'nao-iniciado': '○', 'em-analise': '◔', 'com-pendencia': '!',
      'aguardando-reanalise': '↻', inapto: '×', apto: '✓', 'fora-escopo': '—'
    };
    return `<span class="operational-state-badge state-${safe(status)}"><span aria-hidden="true">${icons[status] || '○'}</span>${safe(statusMeta.label)}</span>`;
  }

  function programChips(escola) {
    return (escola.programasIds || []).map(id => (
      `<span class="operational-program-chip">${safe(programName(id))}</span>`
    )).join('');
  }

  function nextAction(summary) {
    const action = summary.nextAction || {};
    return `<strong>${safe(action.label || 'Nenhuma ação pendente')}</strong>${action.programaNome ? `<small>${safe(action.programaNome)}</small>` : ''}`;
  }

  function activeChips() {
    const chips = [];
    if (state.status !== 'all') {
      const label = state.status === 'concluido' ? 'Concluídas' : Journey.STATE_META[state.status]?.label;
      chips.push({ key: 'status', label: `Situação: ${label || state.status}` });
    }
    if (state.program !== 'all') chips.push({ key: 'program', label: `Programa: ${programName(state.program)}` });
    if (state.controller !== 'all') chips.push({ key: 'controller', label: `Controlador: ${controllerName(state.controller)}` });
    if (state.pendency !== 'all') {
      const labels = { open: 'Com pendência aberta', reanalysis: 'Aguardando reanálise', none: 'Sem pendência' };
      chips.push({ key: 'pendency', label: `Pendências: ${labels[state.pendency]}` });
    }
    if (state.search) chips.push({ key: 'search', label: `Busca: ${state.search}` });
    return chips;
  }

  function applyQueue(queue) {
    state.status = queue || 'all';
    state.program = 'all';
    state.pendency = queue === 'com-pendencia' ? 'open'
      : queue === 'aguardando-reanalise' ? 'reanalysis' : 'all';
  }

  function resetFilters() {
    state.status = 'all';
    state.program = 'all';
    state.controller = currentProfile === 'controlador' ? getDefaultControladorId() : 'all';
    state.pendency = 'all';
    state.search = '';
  }

  function clearFilter(key) {
    if (key === 'status') state.status = 'all';
    if (key === 'program') state.program = 'all';
    if (key === 'controller') state.controller = currentProfile === 'controlador' ? getDefaultControladorId() : 'all';
    if (key === 'pendency') state.pendency = 'all';
    if (key === 'search') state.search = '';
  }

  window.RadarOperationalPreview = {
    Journey, DOCUMENTS, QUEUES, state, safe, competenceLabel, programName,
    controllerName, ensureProfileDefaults, allSummaries, filteredSummaries,
    stateBadge, programChips, nextAction, activeChips, applyQueue,
    resetFilters, clearFilter
  };
}());