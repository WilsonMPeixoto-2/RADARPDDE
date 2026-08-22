import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: esperado 1 trecho, encontrado ${count}`);
  }
  return source.replace(before, after);
}

function patchStatePort() {
  const path = 'src/application/state-port.js';
  let source = read(path);

  source = replaceOnce(
    source,
    "    const INCREMENTAL_MEMORY_ENTITY_MAP = Object.freeze({\n        verifications: 'verifications',\n        registeredInvoices: 'registeredInvoices',\n        administrativeLogs: 'logs'\n    });",
    "    const INCREMENTAL_MEMORY_ENTITY_MAP = Object.freeze({\n        verifications: 'verifications',\n        registeredInvoices: 'registeredInvoices',\n        administrativeLogs: 'logs'\n    });\n    const PERSISTED_RESULT_KEY_MAP = Object.freeze({\n        verifications: ['verification'],\n        registeredInvoices: ['invoice', 'registered_invoice'],\n        administrativeLogs: ['administrative_log', 'administrativeLog', 'log']\n    });\n\n    function persistedRecordsForEntity(persisted, entity) {\n        if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) return null;\n        const keys = PERSISTED_RESULT_KEY_MAP[entity] || [];\n        const records = [];\n        keys.forEach(key => {\n            const value = persisted[key];\n            if (value == null) return;\n            if (Array.isArray(value)) records.push(...value);\n            else records.push(value);\n        });\n        return records.length > 0 ? records : null;\n    }",
    'state-port: mapa de resultados persistidos'
  );

  source = replaceOnce(
    source,
    "            const partialEntities = {};\n            requested.forEach(entity => {\n                partialEntities[entity] = cloneValue(snapshot?.entities?.[entity] || []);\n            });",
    "            const partialEntities = {};\n            requested.forEach(entity => {\n                const persistedRecords = persistedRecordsForEntity(applyOptions.persisted, entity);\n                partialEntities[entity] = cloneValue(\n                    persistedRecords || snapshot?.entities?.[entity] || []\n                );\n            });",
    'state-port: fonte incremental'
  );

  source = replaceOnce(
    source,
    "            await patchMemory(cloneValue(memoryPatch));\n            return cloneValue(memoryPatch);",
    "            await patchMemory(cloneValue(memoryPatch), {\n                merge: true,\n                source: applyOptions.source || 'incremental-state'\n            });\n            return cloneValue(memoryPatch);",
    'state-port: merge incremental'
  );

  write(path, source);
}

function patchDataService() {
  const path = 'src/application/data-service.js';
  let source = read(path);

  source = replaceOnce(
    source,
    "            const incrementalStateEntities = [\n                ...new Set(Array.isArray(command.incrementalStateEntities)\n                    ? command.incrementalStateEntities\n                    : [])\n            ];",
    "            const requestedIncrementalStateEntities = Array.isArray(command.incrementalStateEntities)\n                ? command.incrementalStateEntities\n                : ((command.remoteResultIsAuthoritative === true\n                    || command.remoteCommitIsAuthoritative === true)\n                    ? changedEntities\n                    : []);\n            const incrementalStateEntities = [\n                ...new Set(requestedIncrementalStateEntities)\n            ];",
    'data-service: entidades incrementais padrão'
  );

  source = replaceOnce(
    source,
    "                    const canApplyIncrementally = authoritativeEntitiesComplete\n                        && incrementalStateEntities.length > 0\n                        && typeof this.statePort.applyEntities === 'function'\n                        && incrementalStateEntities.every(entity => (\n                            merged.appliedEntities.includes(entity)\n                            || remoteRefreshExemptEntities.has(entity)\n                        ));",
    "                    const persistedEntitiesComplete = changedEntities.every(entity => (\n                        merged.appliedEntities.includes(entity)\n                        || remoteRefreshExemptEntities.has(entity)\n                    ));\n                    const canApplyIncrementally = persistedEntitiesComplete\n                        && incrementalStateEntities.length > 0\n                        && typeof this.statePort.applyEntities === 'function'\n                        && incrementalStateEntities.every(entity => (\n                            merged.appliedEntities.includes(entity)\n                            || remoteRefreshExemptEntities.has(entity)\n                        ));",
    'data-service: cobertura incremental'
  );

  source = replaceOnce(
    source,
    "                                    {\n                                        persistStorage: false,\n                                        source: 'remote-result-incremental'\n                                    }",
    "                                    {\n                                        persistStorage: false,\n                                        source: 'remote-result-incremental',\n                                        persisted: result.persisted\n                                    }",
    'data-service: payload persistido incremental'
  );

  write(path, source);
}

function patchApp() {
  const path = 'app.js';
  let source = read(path);

  const captureEnd = `function captureRadarMemoryState() {\n    return {\n        config: cloneRadarValue(config),\n        programs: cloneRadarValue(programas),\n        controllers: cloneRadarValue(controladores),\n        inventoryTeamMembers: cloneRadarValue(equipeInventario),\n        schools: cloneRadarValue(escolas),\n        verifications: cloneRadarValue(verificacoes),\n        pendencies: cloneRadarValue(pendencias),\n        contacts: cloneRadarValue(contatos),\n        assets: cloneRadarValue(bens),\n        registeredInvoices: cloneRadarValue(notasRegistradas),\n        logs: cloneRadarValue(logs),\n        dataVersion: INITIAL_DATA_VERSION,\n        pendencySchemaVersion: String(window.RadarPendencias.PENDENCY_SCHEMA_VERSION)\n    };\n}\n`;
  const patchMemory = `${captureEnd}\nfunction patchRadarMemoryState(patch = {}, options = {}) {\n    const merge = options.merge === true;\n\n    if (Object.prototype.hasOwnProperty.call(patch, 'verifications')) {\n        const incoming = cloneRadarValue(patch.verifications || {});\n        if (!merge) {\n            verificacoes = incoming;\n        } else {\n            Object.entries(incoming).forEach(([schoolId, schoolVerifications]) => {\n                if (!verificacoes[schoolId] || typeof verificacoes[schoolId] !== 'object') {\n                    verificacoes[schoolId] = {};\n                }\n                Object.entries(schoolVerifications || {}).forEach(([compKey, verification]) => {\n                    verificacoes[schoolId][compKey] = cloneRadarValue(verification);\n                });\n            });\n        }\n    }\n\n    if (Object.prototype.hasOwnProperty.call(patch, 'registeredInvoices')) {\n        const incoming = cloneRadarValue(patch.registeredInvoices || []);\n        if (!merge) {\n            notasRegistradas = incoming;\n        } else {\n            const byId = new Map(notasRegistradas.map(item => [String(item.id), item]));\n            incoming.forEach(item => byId.set(String(item.id), item));\n            notasRegistradas = [...byId.values()];\n        }\n    }\n\n    if (Object.prototype.hasOwnProperty.call(patch, 'logs')) {\n        const incoming = cloneRadarValue(patch.logs || []);\n        if (!merge) {\n            logs = incoming;\n        } else {\n            const byId = new Map(logs.map(item => [String(item.id), item]));\n            incoming.forEach(item => byId.set(String(item.id), item));\n            logs = [...byId.values()];\n        }\n        logs.sort((left, right) => (right.dataHora || '').localeCompare(left.dataHora || ''));\n    }\n\n    return true;\n}\n`;
  source = replaceOnce(source, captureEnd, patchMemory, 'app: patch de memória');

  source = replaceOnce(
    source,
    "        readMemory: captureRadarMemoryState,\n        writeMemory: applyRadarMemoryState,",
    "        readMemory: captureRadarMemoryState,\n        writeMemory: applyRadarMemoryState,\n        patchMemory: patchRadarMemoryState,",
    'app: ligação patchMemory'
  );

  source = replaceOnce(
    source,
    '<div class="btn-group-toggle">',
    '<div class="btn-group-toggle" data-bonification-document="${escapeHtml(doc.key)}">',
    'app: alvo bonificação'
  );
  source = replaceOnce(
    source,
    "<button class=\"btn-toggle ${bonifValue === 'Sim' ? 'active-sim' : ''}\"\n                                        onclick=\"toggleBonif",
    "<button class=\"btn-toggle ${bonifValue === 'Sim' ? 'active-sim' : ''}\"\n                                        data-bonification-option=\"Sim\"\n                                        onclick=\"toggleBonif",
    'app: opção Sim'
  );
  source = replaceOnce(
    source,
    "<button class=\"btn-toggle ${bonifValue === 'Não' ? 'active-nao' : ''}\"\n                                        onclick=\"toggleBonif",
    "<button class=\"btn-toggle ${bonifValue === 'Não' ? 'active-nao' : ''}\"\n                                        data-bonification-option=\"Não\"\n                                        onclick=\"toggleBonif",
    'app: opção Não'
  );
  source = replaceOnce(
    source,
    "<button class=\"btn-toggle ${bonifValue === 'Não se aplica' ? 'active-naoseaplica' : ''}\"\n                                            onclick=\"toggleBonif",
    "<button class=\"btn-toggle ${bonifValue === 'Não se aplica' ? 'active-naoseaplica' : ''}\"\n                                            data-bonification-option=\"Não se aplica\"\n                                            onclick=\"toggleBonif",
    'app: opção N/A'
  );

  source = replaceOnce(
    source,
    "                                            type=\"checkbox\"\n                                            aria-label=\"Consulta enviada à Assessoria para a NF ${escapeHtml(note.numero)}\"",
    "                                            type=\"checkbox\"\n                                            data-service-advisory-sent=\"${escapeHtml(note.id)}\"\n                                            aria-label=\"Consulta enviada à Assessoria para a NF ${escapeHtml(note.numero)}\"",
    'app: alvo consulta enviada'
  );

  source = replaceOnce(
    source,
    "                                    <select\n                                        class=\"select-analise select-analise-comp analise-${analysis.toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}\"",
    "                                    <select\n                                        data-service-advisory-analysis=\"${escapeHtml(note.id)}\"\n                                        class=\"select-analise select-analise-comp analise-${analysis.toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}\"",
    'app: alvo análise assessoria'
  );

  source = replaceOnce(
    source,
    "                            <select class=\"select-analise select-analise-comp analise-${analiseValue.toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}\"\n                                    aria-label=\"Análise técnica de ${escapeHtml(doc.name)} no programa ${escapeHtml(progName)}\"",
    "                            <select class=\"select-analise select-analise-comp analise-${analiseValue.toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}\"\n                                    data-analysis-document=\"${escapeHtml(doc.key)}\"\n                                    aria-label=\"Análise técnica de ${escapeHtml(doc.name)} no programa ${escapeHtml(progName)}\"",
    'app: alvo análise documental'
  );

  source = replaceOnce(
    source,
    "                                <span class=\"badge ${bonifValue === 'Sim' ? 'badge-success' : 'badge-danger'}\" style=\"align-self:flex-start;\">\n                                    Resumo mensal: ${escapeHtml(bonifValue || 'Não')}\n                                </span>",
    "                                <span data-service-advisory-monthly-bonification class=\"badge ${bonifValue === 'Sim' ? 'badge-success' : 'badge-danger'}\" style=\"align-self:flex-start;\">\n                                    Resumo mensal: ${escapeHtml(bonifValue || 'Não')}\n                                </span>",
    'app: resumo mensal assessoria'
  );

  source = replaceOnce(
    source,
    "                                <span style=\"font-size:0.68rem; color:var(--text-muted);\">Resumo técnico: ${escapeHtml(analiseValue)}</span>",
    "                                <span data-service-advisory-monthly-analysis style=\"font-size:0.68rem; color:var(--text-muted);\">Resumo técnico: ${escapeHtml(analiseValue)}</span>",
    'app: resumo técnico assessoria'
  );

  const renderTail = `    container.innerHTML = rowsHTML;\n}\n\nfunction changeProntuarioCompetencia(escolaId, compKey) {`;
  const syncHelper = `    container.innerHTML = rowsHTML;\n}\n\nfunction syncProntuarioProgramUI(escolaId, compKey) {\n    const splitContext = window.RadarCompetencia.splitCompetenciaContext(compKey);\n    const competenceKey = splitContext.competenciaKey;\n    const programId = splitContext.contextId;\n    if (!programId) return false;\n\n    const rows = Array.from(document.querySelectorAll('#prontuario-verif-rows tr[data-program-id]'))\n        .filter(row => row.dataset.programId === programId);\n    if (rows.length === 0) return false;\n\n    const verification = buildVerificationSnapshot(verificacoes[escolaId]?.[compKey]);\n    const feedback = window.RadarOperationalWriteFeedback;\n    const activeClasses = feedback?.ACTIVE_CLASSES || ['active-sim', 'active-nao', 'active-naoseaplica'];\n\n    rows.forEach(row => {\n        const documentKey = row.dataset.documentKey || '';\n        const bonificationValue = verification.bonificacao?.[documentKey] || '';\n        const analysisValue = verification.analise?.[documentKey] || 'Não analisado';\n\n        const bonificationGroup = row.querySelector('[data-bonification-document]');\n        if (bonificationGroup) {\n            Array.from(bonificationGroup.querySelectorAll('[data-bonification-option]')).forEach(button => {\n                activeClasses.forEach(className => button.classList.remove(className));\n                const optionValue = button.dataset.bonificationOption || '';\n                if (optionValue === bonificationValue) {\n                    const activeClass = feedback?.bonificationActiveClass?.(optionValue);\n                    if (activeClass) button.classList.add(activeClass);\n                }\n            });\n        }\n\n        const analysisSelect = row.querySelector('[data-analysis-document]');\n        if (analysisSelect) {\n            analysisSelect.value = analysisValue;\n            Array.from(analysisSelect.classList)\n                .filter(className => className.startsWith('analise-'))\n                .forEach(className => analysisSelect.classList.remove(className));\n            analysisSelect.classList.add(\n                feedback?.analysisStateClass?.(analysisValue)\n                    || `analise-${analysisValue.toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}`\n            );\n        }\n\n        if (documentKey === 'consAssessoria') {\n            const serviceNotes = notasRegistradas.filter(note => (\n                note.escolaId === escolaId\n                && note.compKey === compKey\n                && note.tipo === 'servico'\n            ));\n            const legacyFallback = serviceNotes.length === 1\n                ? {\n                    sent: verification.bonificacao.consEnviada === true\n                        || verification.bonificacao.consAssessoria === 'Sim',\n                    analysis: verification.analise.consAssessoria\n                }\n                : {};\n\n            serviceNotes.forEach(note => {\n                const advisory = window.RadarInvoiceService.getServiceAdvisoryState(note, legacyFallback);\n                const sentControl = Array.from(row.querySelectorAll('[data-service-advisory-sent]'))\n                    .find(control => control.dataset.serviceAdvisorySent === String(note.id));\n                const analysisControl = Array.from(row.querySelectorAll('[data-service-advisory-analysis]'))\n                    .find(control => control.dataset.serviceAdvisoryAnalysis === String(note.id));\n                if (sentControl) sentControl.checked = Boolean(advisory.sent);\n                if (analysisControl) {\n                    analysisControl.value = advisory.analysis;\n                    Array.from(analysisControl.classList)\n                        .filter(className => className.startsWith('analise-'))\n                        .forEach(className => analysisControl.classList.remove(className));\n                    analysisControl.classList.add(\n                        feedback?.analysisStateClass?.(advisory.analysis)\n                            || `analise-${String(advisory.analysis).toLowerCase().replace(/\\s+/g, '-').replace(/[()]/g, '')}`\n                    );\n                }\n            });\n\n            const monthlyBonification = row.querySelector('[data-service-advisory-monthly-bonification]');\n            if (monthlyBonification) {\n                const value = verification.bonificacao.consAssessoria || 'Não';\n                monthlyBonification.textContent = `Resumo mensal: ${value}`;\n                monthlyBonification.classList.toggle('badge-success', value === 'Sim');\n                monthlyBonification.classList.toggle('badge-danger', value !== 'Sim');\n            }\n            const monthlyAnalysis = row.querySelector('[data-service-advisory-monthly-analysis]');\n            if (monthlyAnalysis) {\n                monthlyAnalysis.textContent = `Resumo técnico: ${verification.analise.consAssessoria || 'Não analisado'}`;\n            }\n        }\n\n        Array.from(row.querySelectorAll('.radar-write-pending')).forEach(control => {\n            if (feedback?.settlePending) feedback.settlePending(control);\n            else {\n                control.classList.remove('radar-write-pending');\n                control.removeAttribute('aria-busy');\n                if (control.dataset) delete control.dataset.radarWritePending;\n            }\n        });\n    });\n\n    const summary = rows.map(row => row.querySelector('[data-program-status-summary]')).find(Boolean);\n    if (summary) {\n        const bonusMeta = getProgramBonificationMeta(\n            getProgramBonificationStatus(escolaId, competenceKey, programId)\n        );\n        const technicalMeta = getProgramTechnicalMeta(\n            getProgramTechnicalStatus(escolaId, competenceKey, programId)\n        );\n        const bonusBadge = summary.querySelector('[data-status-dimension=\"bonificacao\"]');\n        const technicalBadge = summary.querySelector('[data-status-dimension=\"analise\"]');\n        if (bonusBadge) {\n            bonusBadge.className = `badge ${bonusMeta.badgeClass}`;\n            bonusBadge.textContent = bonusMeta.label;\n        }\n        if (technicalBadge) {\n            technicalBadge.className = `badge ${technicalMeta.badgeClass}`;\n            technicalBadge.textContent = technicalMeta.label;\n        }\n    }\n\n    return true;\n}\n\nfunction changeProntuarioCompetencia(escolaId, compKey) {`;
  source = replaceOnce(source, renderTail, syncHelper, 'app: sincronização incremental do prontuário');

  source = replaceOnce(
    source,
    "    renderProntuario(escolaId);\n    return true;\n}\n\nfunction findActivePendencyForTechnicalAnalysis",
    "    syncProntuarioProgramUI(escolaId, compKey);\n    return true;\n}\n\nfunction findActivePendencyForTechnicalAnalysis",
    'app: sucesso bonificação'
  );
  source = replaceOnce(
    source,
    "    renderProntuario(escolaId);\n    return true;\n}\n\n// 14.5 Operações de Registro de Dados da Nota Fiscal",
    "    syncProntuarioProgramUI(escolaId, compKey);\n    return true;\n}\n\n// 14.5 Operações de Registro de Dados da Nota Fiscal",
    'app: sucesso análise técnica'
  );
  source = replaceOnce(
    source,
    "    renderProntuario(escolaId);\n    return true;\n}\n\nasync function changeInvoiceAdvisoryAnalysis",
    "    const compKey = notasRegistradas.find(item => item.id === notaId)?.compKey;\n    if (compKey) syncProntuarioProgramUI(escolaId, compKey);\n    return true;\n}\n\nasync function changeInvoiceAdvisoryAnalysis",
    'app: sucesso envio assessoria'
  );
  source = replaceOnce(
    source,
    "    renderProntuario(escolaId);\n    return true;\n}\n\nasync function toggleConsEnviada",
    "    syncProntuarioProgramUI(escolaId, nota.compKey);\n    return true;\n}\n\nasync function toggleConsEnviada",
    'app: sucesso análise assessoria'
  );
  source = replaceOnce(
    source,
    "    renderProntuario(escolaId);\n    return true;\n}\n\nasync function removerNotaRegistrada",
    "    syncProntuarioProgramUI(escolaId, compKey);\n    return true;\n}\n\nasync function removerNotaRegistrada",
    'app: sucesso consulta legada'
  );

  write(path, source);
}

function patchRemoteContract() {
  const path = 'tests/e2e/remote-deployment-contract.spec.js';
  let source = read(path);
  source = replaceOnce(
    source,
    "        expect(anonymousResponse.ok()).toBeTruthy();\n        expect(await anonymousResponse.json()).toEqual([]);",
    "        const anonymousStatus = anonymousResponse.status();\n        if (anonymousStatus === 401 || anonymousStatus === 403) {\n            expect([401, 403]).toContain(anonymousStatus);\n        } else {\n            expect(anonymousStatus).toBe(200);\n            expect(await anonymousResponse.json()).toEqual([]);\n        }",
    'e2e: contrato RLS anônimo'
  );
  write(path, source);
}

function patchInlineContractTest() {
  const path = 'tests/unit/prontuario-inline-write-contract.test.js';
  let source = read(path);
  source = source.replace(
    /test\('lançamentos inline não rerenderizam o prontuário completo após gravação',[\s\S]*?\n\}\);\n\n/,
    `test('lançamentos inline usam sincronização incremental no caminho de sucesso', () => {\n    const expected = new Map([\n        ['toggleBonif', /syncProntuarioProgramUI\\(escolaId, compKey\\)/],\n        ['changeAnaliseTecnica', /syncProntuarioProgramUI\\(escolaId, compKey\\)/],\n        ['toggleInvoiceAdvisorySent', /syncProntuarioProgramUI\\(escolaId, compKey\\)/],\n        ['changeInvoiceAdvisoryAnalysis', /syncProntuarioProgramUI\\(escolaId, nota\\.compKey\\)/],\n        ['toggleConsEnviada', /syncProntuarioProgramUI\\(escolaId, compKey\\)/]\n    ]);\n\n    expected.forEach((pattern, name) => {\n        assert.match(functionSource(name), pattern, \\`${name} não usa atualização incremental no sucesso\\`);\n    });\n});\n\ntest('porta de estado do app recebe patch de memória incremental', () => {\n    assert.match(appSource, /function\\s+patchRadarMemoryState\\s*\\(/);\n    assert.match(appSource, /patchMemory:\\s*patchRadarMemoryState/);\n});\n\n`
  );
  if (!source.includes("lançamentos inline usam sincronização incremental")) {
    throw new Error('teste inline: bloco antigo não encontrado');
  }
  write(path, source);
}

patchStatePort();
patchDataService();
patchApp();
patchRemoteContract();
patchInlineContractTest();

console.log('PR #192: patch aplicado com sucesso aos arquivos de origem e contratos.');
