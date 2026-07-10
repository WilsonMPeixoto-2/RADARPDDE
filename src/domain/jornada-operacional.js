(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.RadarJornadaOperacional = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CORRECT_ANALYSES = new Set(['Correto', 'Correto (Atrasado)']);
  const STARTED_VALUES = new Set(['Sim', 'Não', 'Não se aplica']);

  const STATE_META = Object.freeze({
    'nao-iniciado': Object.freeze({ label: 'Não iniciado', icon: 'circle', tone: 'neutral' }),
    'em-analise': Object.freeze({ label: 'Em análise', icon: 'clock', tone: 'warning' }),
    'com-pendencia': Object.freeze({ label: 'Com pendência', icon: 'alert', tone: 'danger' }),
    'aguardando-reanalise': Object.freeze({ label: 'Aguardando reanálise', icon: 'refresh', tone: 'info' }),
    inapto: Object.freeze({ label: 'Inapto', icon: 'x', tone: 'danger-strong' }),
    apto: Object.freeze({ label: 'Apto', icon: 'check', tone: 'success' }),
    'fora-escopo': Object.freeze({ label: 'Fora do escopo', icon: 'minus', tone: 'muted' })
  });

  function normalize(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function getPendencyCompetence(pendency) {
    return normalize(pendency && (pendency.competenciaOrigem || pendency.competencia));
  }

  function pendencyMatchesProgramDocument(pendency, context) {
    if (!pendency || pendency.escolaId !== context.escolaId) return false;

    const competence = getPendencyCompetence(pendency);
    if (competence && competence !== context.competenciaKey) return false;

    const programaId = normalize(pendency.programaId);
    const documentoKey = normalize(pendency.documentoKey);

    if (programaId || documentoKey) {
      return programaId === context.programaId && documentoKey === context.documentoKey;
    }

    const item = normalize(pendency.item);
    return item === context.documentoLabel
      || item === `${context.programaName} - ${context.documentoLabel}`;
  }

  function dateValue(value) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function getLatestMovement(pendencies) {
    const movements = [];

    for (const pendency of pendencies || []) {
      if (pendency.dataResolucao) {
        movements.push({
          type: 'Pendência resolvida',
          date: pendency.dataResolucao,
          timestamp: dateValue(pendency.dataResolucao)
        });
      }
      if (pendency.dataAbertura) {
        movements.push({
          type: 'Pendência aberta',
          date: pendency.dataAbertura,
          timestamp: dateValue(pendency.dataAbertura)
        });
      }
    }

    movements.sort((a, b) => b.timestamp - a.timestamp);
    return movements[0] || null;
  }

  function createNextAction(priority, label, extra) {
    return Object.freeze({ priority, label, ...(extra || {}) });
  }

  function getProgramOperationalSummary(input) {
    const {
      escolaId,
      competenciaKey,
      programa,
      verificacao,
      pendencias = [],
      documentos = [],
      inScope = true
    } = input || {};

    const programaId = programa && programa.id ? programa.id : '';
    const programaName = programa && programa.name ? programa.name : programaId || 'Programa';

    if (!inScope) {
      return Object.freeze({
        escolaId,
        programaId,
        programaName,
        state: 'fora-escopo',
        completedDocuments: 0,
        applicableDocuments: documentos.length,
        remainingDocuments: 0,
        openPendencies: 0,
        awaitingReanalysis: 0,
        readyToConsolidate: false,
        nextAction: createNextAction(100, 'Nenhuma ação pendente')
      });
    }

    const analysis = (verificacao && verificacao.analise) || {};
    const bonification = (verificacao && verificacao.bonificacao) || {};
    const relevantPendencies = (pendencias || []).filter(pendency => (
      pendency.escolaId === escolaId
      && (!getPendencyCompetence(pendency) || getPendencyCompetence(pendency) === competenciaKey)
    ));

    const documentSummaries = documentos.map(documento => {
      const context = {
        escolaId,
        competenciaKey,
        programaId,
        programaName,
        documentoKey: documento.key,
        documentoLabel: documento.label
      };
      const linked = relevantPendencies.filter(pendency => pendencyMatchesProgramDocument(pendency, context));
      const open = linked.filter(pendency => pendency.status === 'Aberta');
      const resolved = linked.filter(pendency => pendency.status === 'Resolvida');
      const analysisValue = normalize(analysis[documento.key]) || 'Não analisado';
      const awaiting = resolved.length > 0 && analysisValue === 'Não analisado';

      return Object.freeze({
        key: documento.key,
        label: documento.label,
        analysisValue,
        bonificationValue: normalize(bonification[documento.key]),
        openPendencies: open,
        resolvedPendencies: resolved,
        awaitingReanalysis: awaiting,
        isCorrect: CORRECT_ANALYSES.has(analysisValue),
        isIncorrect: analysisValue === 'Incorreto'
      });
    });

    const openDocuments = documentSummaries.filter(document => document.openPendencies.length > 0);
    const awaitingDocuments = documentSummaries.filter(document => document.awaitingReanalysis);
    const incorrectWithoutPendency = documentSummaries.filter(document => (
      document.isIncorrect && document.openPendencies.length === 0
    ));
    const completedDocuments = documentSummaries.filter(document => document.isCorrect).length;
    const applicableDocuments = documentos.length;
    const remainingDocuments = Math.max(0, applicableDocuments - completedDocuments);
    const allCorrect = applicableDocuments > 0 && completedDocuments === applicableDocuments;
    const result = normalize(verificacao && verificacao.resultadoBonif);
    const started = Boolean(verificacao) && (
      Boolean(result)
      || documentSummaries.some(document => (
        STARTED_VALUES.has(document.bonificationValue)
        || document.analysisValue !== 'Não analisado'
      ))
    );

    let state = 'nao-iniciado';
    if (openDocuments.length > 0) {
      state = 'com-pendencia';
    } else if (awaitingDocuments.length > 0) {
      state = 'aguardando-reanalise';
    } else if (result === 'apta' && allCorrect) {
      state = 'apto';
    } else if (result === 'inapta' || incorrectWithoutPendency.length > 0) {
      state = 'inapto';
    } else if (started) {
      state = 'em-analise';
    }

    const readyToConsolidate = allCorrect && !result
      && openDocuments.length === 0
      && awaitingDocuments.length === 0;

    let nextAction;
    if (awaitingDocuments.length > 0) {
      const document = awaitingDocuments[0];
      nextAction = createNextAction(1, `Reanalisar ${document.label}`, {
        type: 'reanalisar', programaId, documentoKey: document.key
      });
    } else if (incorrectWithoutPendency.length > 0) {
      const document = incorrectWithoutPendency[0];
      nextAction = createNextAction(2, `Abrir pendência para ${document.label}`, {
        type: 'abrir-pendencia', programaId, documentoKey: document.key
      });
    } else if (openDocuments.length > 0) {
      const document = openDocuments[0];
      nextAction = createNextAction(3, `Aguardar regularização de ${document.label}`, {
        type: 'acompanhar-pendencia', programaId, documentoKey: document.key
      });
    } else if (readyToConsolidate) {
      nextAction = createNextAction(6, `Consolidar ${programaName}`, {
        type: 'consolidar', programaId
      });
    } else if (state === 'em-analise') {
      const count = Math.max(1, remainingDocuments);
      nextAction = createNextAction(4, `Concluir ${count} ${count === 1 ? 'documento' : 'documentos'} do ${programaName}`, {
        type: 'continuar', programaId
      });
    } else if (state === 'nao-iniciado') {
      nextAction = createNextAction(5, `Iniciar análise do ${programaName}`, {
        type: 'iniciar', programaId
      });
    } else {
      nextAction = createNextAction(99, 'Nenhuma ação pendente', {
        type: 'concluido', programaId
      });
    }

    return Object.freeze({
      escolaId,
      programaId,
      programaName,
      state,
      completedDocuments,
      applicableDocuments,
      remainingDocuments,
      openPendencies: openDocuments.reduce((total, document) => total + document.openPendencies.length, 0),
      awaitingReanalysis: awaitingDocuments.length,
      readyToConsolidate,
      documentSummaries: Object.freeze(documentSummaries),
      nextAction
    });
  }

  function chooseAggregateState(programSummaries) {
    const states = new Set((programSummaries || []).map(summary => summary.state));
    if (states.has('com-pendencia')) return 'com-pendencia';
    if (states.has('aguardando-reanalise')) return 'aguardando-reanalise';
    if (states.has('inapto')) return 'inapto';
    if (states.has('em-analise')) return 'em-analise';
    if (states.has('nao-iniciado')) return 'nao-iniciado';
    if (states.has('apto')) return 'apto';
    return 'fora-escopo';
  }

  function aggregateSchoolOperationalSummary(input) {
    const escola = (input && input.escola) || {};
    const programSummaries = (input && input.programSummaries) || [];
    const pendencies = (input && input.pendencias) || [];
    const relevant = programSummaries.filter(summary => summary.state !== 'fora-escopo');
    const openSchoolPendencies = pendencies.filter(pendency => pendency.status === 'Aberta');
    const linkedOpenCount = programSummaries.reduce(
      (total, summary) => total + (summary.openPendencies || 0), 0
    );
    const actions = relevant.map(summary => summary.nextAction).filter(Boolean);

    if (openSchoolPendencies.length > linkedOpenCount) {
      const firstUnlinked = openSchoolPendencies[0];
      const item = normalize(firstUnlinked && firstUnlinked.item) || 'pendência registrada';
      actions.push(createNextAction(3, `Aguardar regularização de ${item}`, {
        type: 'acompanhar-pendencia',
        pendenciaId: firstUnlinked && firstUnlinked.id
      }));
    }

    const orderedActions = actions.sort((a, b) => a.priority - b.priority);
    const hasOpenPendency = openSchoolPendencies.length > 0 || linkedOpenCount > 0;

    return Object.freeze({
      escola,
      escolaId: escola.id,
      state: hasOpenPendency ? 'com-pendencia' : chooseAggregateState(programSummaries),
      programSummaries: Object.freeze(programSummaries.slice()),
      openPendencies: pendencies.length > 0 ? openSchoolPendencies.length : linkedOpenCount,
      awaitingReanalysis: programSummaries.reduce((total, summary) => total + (summary.awaitingReanalysis || 0), 0),
      completedPrograms: programSummaries.filter(summary => summary.state === 'apto' || summary.state === 'inapto').length,
      totalPrograms: relevant.length,
      nextAction: orderedActions[0] || createNextAction(99, 'Nenhuma ação pendente'),
      lastMovement: getLatestMovement(pendencies)
    });
  }

  function buildWorkQueues(schools) {
    const queues = {
      'nao-iniciado': 0,
      'em-analise': 0,
      'com-pendencia': 0,
      'aguardando-reanalise': 0,
      concluido: 0
    };

    for (const school of schools || []) {
      if (school.state === 'apto' || school.state === 'inapto') {
        queues.concluido += 1;
      } else if (Object.prototype.hasOwnProperty.call(queues, school.state)) {
        queues[school.state] += 1;
      }
    }

    return queues;
  }

  return Object.freeze({
    STATE_META,
    aggregateSchoolOperationalSummary,
    buildWorkQueues,
    getLatestMovement,
    getProgramOperationalSummary,
    pendencyMatchesProgramDocument
  });
}));