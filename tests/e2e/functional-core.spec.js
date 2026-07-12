const { test, expect } = require('@playwright/test');

async function openOperationalProgram(page, options = {}) {
  return page.evaluate(({ initialized, note }) => {
    switchProfile('controlador');

    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    const programaId = escola.programasIds[0];
    const compProgKey = `${competencia}_${programaId}`;

    if (verificacoes[escola.id]) {
      delete verificacoes[escola.id][compProgKey];
    }

    for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
      const registeredNote = notasRegistradas[index];
      if (registeredNote.escolaId === escola.id && registeredNote.compKey === compProgKey) {
        notasRegistradas.splice(index, 1);
      }
    }

    if (initialized) {
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = {
        bonificacao: {
          extCC: '',
          extINV: '',
          notaFiscal: 'Sim',
          consAssessoria: '',
          declBBAgil: '',
          encampInventario: ''
        },
        analise: {
          extCC: 'Não analisado',
          extINV: 'Não analisado',
          notaFiscal: 'Correto',
          consAssessoria: 'Não analisado',
          declBBAgil: 'Não analisado',
          encampInventario: 'Não analisado'
        },
        resultadoBonif: ''
      };
    }

    if (note) {
      const bemId = note.tipo === 'permanente' ? 'bem-e2e-preservado' : null;
      if (bemId) {
        const existingBemIndex = bens.findIndex(bem => bem.id === bemId);
        if (existingBemIndex !== -1) {
          bens.splice(existingBemIndex, 1);
        }
        bens.push({
          id: bemId,
          escolaId: escola.id,
          competencia,
          item: note.desc,
          valor: note.valor,
          notaFiscal: note.numero,
          status: 'Não encaminhada'
        });
      }
      notasRegistradas.push({
        id: `nota-e2e-${note.tipo}`,
        escolaId: escola.id,
        compKey: compProgKey,
        desc: note.desc,
        tipo: note.tipo,
        numero: note.numero,
        valor: note.valor,
        bemId,
        dataRegistro: new Date().toISOString()
      });
    }

    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    return {
      escolaId: escola.id,
      compProgKey,
      verificationExistsAfterOpen: Boolean(verificacoes[escola.id]?.[compProgKey])
    };
  }, options);
}

function fiscalNoteRow(page) {
  return page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Notas Fiscais' }).first();
}

async function setConsolidatedProgram(page, context, options = {}) {
  await page.evaluate(({ context: target, profile, bonificacao }) => {
    const verification = verificacoes[target.escolaId][target.compProgKey];
    Object.assign(verification.bonificacao, bonificacao || {});
    verification.resultadoBonif = 'apta';
    switchProfile(profile || 'controlador');
    activeProntuarioCompetencia = target.compProgKey.slice(0, 7);
    switchView('prontuario', target.escolaId);
  }, { context, ...options });
}

test.describe('núcleo funcional do RADAR PDDE no desktop', () => {
  test('painel SME conta cada escola uma única vez nos indicadores', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const statsGrid = page.locator('#main-container .grid-stats').first();
    const cards = statsGrid.locator(':scope > .card-stat');
    const naoAnalisadasCard = cards.filter({ hasText: 'Bonificação não lançada' });

    await expect(cards).toHaveCount(4);
    await expect(naoAnalisadasCard).toHaveCount(1);
    await expect(naoAnalisadasCard.locator('.stat-value')).toHaveText('163 Unidades');

    const creRow = page.locator('#main-container .dash-layout table.data-table tbody tr').first();
    await expect(creRow.locator('td').nth(1)).toHaveText('163 unidades');
    await creRow.click();
    await expect(page.locator('#sme-detail-table .sme-detail-row')).toHaveCount(430);
  });

  test('abre prontuário sem persistir e permite cadastrar a primeira nota antes da análise correta', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    const context = await openOperationalProgram(page);

    expect(context.verificationExistsAfterOpen).toBe(false);

    const noteRow = fiscalNoteRow(page);
    await noteRow.getByRole('button', { name: 'Sim', exact: true }).click();
    await expect(noteRow.getByRole('button', { name: 'Adicionar Nota' })).toBeVisible();
    expect(await page.evaluate(({ escolaId, compProgKey }) => (
      verificacoes[escolaId][compProgKey]
    ), context)).toEqual({
      bonificacao: {
        extCC: '',
        extINV: '',
        notaFiscal: 'Sim',
        consAssessoria: '',
        declBBAgil: '',
        encampInventario: ''
      },
      analise: {
        extCC: 'Não analisado',
        extINV: 'Não analisado',
        notaFiscal: 'Não analisado',
        consAssessoria: 'Não analisado',
        declBBAgil: 'Não analisado',
        encampInventario: 'Não analisado'
      },
      resultadoBonif: ''
    });

    const analysis = noteRow.locator('select.select-analise');
    await analysis.selectOption('Correto');

    await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
    await expect(analysis).toHaveValue('Não analisado');
    expect(dialogs.some(message => message.includes('cadastre pelo menos uma Nota Fiscal'))).toBe(true);

    await page.locator('#nota-desc').fill('Material pedagógico');
    await page.locator('#nota-numero').fill('NF-E2E-001');
    await page.locator('#nota-valor').fill('150.50');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    await fiscalNoteRow(page).locator('select.select-analise').selectOption('Correto');
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    await expect(fiscalNoteRow(page).locator('select.select-analise')).toHaveValue('Correto');
  });

  test('renderiza nota de serviço e controle da assessoria sem pageerror', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await openOperationalProgram(page, { initialized: true });

    await fiscalNoteRow(page).getByRole('button', { name: 'Adicionar Nota' }).click();
    await page.locator('#nota-desc').fill('Manutenção elétrica');
    await page.locator('#nota-tipo').selectOption('servico');
    await page.locator('#nota-numero').fill('NF-SERV-E2E');
    await page.locator('#nota-valor').fill('850');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    const assessoriaRow = page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Consulta Assessoria' }).first();
    await expect(assessoriaRow.getByText('Ref. Serviço NF: NF-SERV-E2E')).toBeVisible();
    await expect(assessoriaRow.getByLabel('Consultoria realmente enviada para Assessoria')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('recusa N/A com nota existente sem excluir nota ou bem implicitamente', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    const context = await openOperationalProgram(page, {
      initialized: true,
      note: {
        desc: 'Bem permanente',
        tipo: 'permanente',
        numero: 'NF-PRESERVADA-E2E',
        valor: 99.9
      }
    });

    await expect(fiscalNoteRow(page).getByText('NF: NF-PRESERVADA-E2E')).toBeVisible();
    await fiscalNoteRow(page).getByRole('button', { name: 'N/A', exact: true }).click();

    expect(dialogs.some(message => (
      message.includes('exclusão individual')
      && message.includes('NF-PRESERVADA-E2E')
    ))).toBe(true);
    expect(await page.evaluate(({ escolaId, compProgKey }) => ({
      noteCount: notasRegistradas.filter(note => (
        note.escolaId === escolaId && note.compKey === compProgKey
      )).length,
      bemExists: bens.some(bem => bem.id === 'bem-e2e-preservado')
    }), context)).toEqual({ noteCount: 1, bemExists: true });
    await expect(fiscalNoteRow(page).getByText('NF: NF-PRESERVADA-E2E')).toBeVisible();
  });

  test('bloqueia criação edição e remoção de nota consolidada para Controlador', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    const context = await openOperationalProgram(page, {
      initialized: true,
      note: {
        desc: 'Material consolidado',
        tipo: 'consumo',
        numero: 'NF-CONSOLIDADA-E2E',
        valor: 120
      }
    });
    await setConsolidatedProgram(page, context, { profile: 'controlador' });

    const noteRow = fiscalNoteRow(page);
    await expect(noteRow.getByRole('button', { name: 'Adicionar Nota' })).toHaveCount(0);
    await expect(noteRow.locator('[title="Editar Nota"]')).toHaveCount(0);
    await expect(noteRow.locator('[title="Excluir Nota"]')).toHaveCount(0);

    await page.evaluate(({ escolaId, compProgKey }) => {
      openModalDadosNota(escolaId, compProgKey);
      abrirEditarNota('nota-e2e-consumo', escolaId);
      removerNotaRegistrada('nota-e2e-consumo', escolaId);
    }, context);

    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    expect(await page.evaluate(({ escolaId, compProgKey }) => ({
      noteCount: notasRegistradas.filter(note => (
        note.escolaId === escolaId && note.compKey === compProgKey
      )).length,
      result: verificacoes[escolaId][compProgKey].resultadoBonif
    }), context)).toEqual({ noteCount: 1, result: 'apta' });
    expect(dialogs.filter(message => message.includes('consolidada')).length).toBeGreaterThanOrEqual(3);
  });

  test('Assistente reabre consolidação ao incluir serviço editar e remover nota', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    const context = await openOperationalProgram(page, { initialized: true });
    await setConsolidatedProgram(page, context, { profile: 'assistente' });

    await fiscalNoteRow(page).getByRole('button', { name: 'Adicionar Nota' }).click();
    await page.locator('#nota-desc').fill('Consultoria especializada');
    await page.locator('#nota-tipo').selectOption('servico');
    await page.locator('#nota-numero').fill('NF-SERV-CONSOLIDADA');
    await page.locator('#nota-valor').fill('780');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    expect(await page.evaluate(({ escolaId, compProgKey }) => {
      const verification = verificacoes[escolaId][compProgKey];
      const persistedVerification = JSON.parse(
        localStorage.getItem('radar_pdde_verificacoes')
      )[escolaId][compProgKey];
      return {
        result: verification.resultadoBonif,
        persistedResult: persistedVerification.resultadoBonif,
        assessoria: verification.bonificacao.consAssessoria,
        assessoriaAnalysis: verification.analise.consAssessoria,
        reopenLogs: logs.filter(log => log.acao === 'Consolidação Reaberta').length
      };
    }, context)).toEqual({
      result: '',
      persistedResult: '',
      assessoria: 'Não',
      assessoriaAnalysis: 'Não analisado',
      reopenLogs: 1
    });

    await page.evaluate(({ escolaId, compProgKey }) => {
      verificacoes[escolaId][compProgKey].resultadoBonif = 'apta';
      renderProntuario(escolaId);
    }, context);
    await fiscalNoteRow(page).locator('[title="Editar Nota"]').click();
    await page.locator('#nota-numero').fill('NF-SERV-EDITADA');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    expect(await page.evaluate(({ escolaId, compProgKey }) => ({
      result: verificacoes[escolaId][compProgKey].resultadoBonif,
      numero: notasRegistradas.find(note => (
        note.escolaId === escolaId && note.compKey === compProgKey
      )).numero,
      reopenLogs: logs.filter(log => log.acao === 'Consolidação Reaberta').length
    }), context)).toEqual({ result: '', numero: 'NF-SERV-EDITADA', reopenLogs: 2 });

    await page.evaluate(({ escolaId, compProgKey }) => {
      verificacoes[escolaId][compProgKey].resultadoBonif = 'apta';
      renderProntuario(escolaId);
    }, context);
    await fiscalNoteRow(page).locator('[title="Excluir Nota"]').click();

    expect(await page.evaluate(({ escolaId, compProgKey }) => ({
      result: verificacoes[escolaId][compProgKey].resultadoBonif,
      noteCount: notasRegistradas.filter(note => (
        note.escolaId === escolaId && note.compKey === compProgKey
      )).length,
      assessoria: verificacoes[escolaId][compProgKey].bonificacao.consAssessoria,
      reopenLogs: logs.filter(log => log.acao === 'Consolidação Reaberta').length
    }), context)).toEqual({ result: '', noteCount: 0, assessoria: 'Não se aplica', reopenLogs: 3 });
  });

  test('reabre consolidação quando valor repetido de NF altera campos derivados', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await openOperationalProgram(page, { initialized: true });
    await setConsolidatedProgram(page, context, {
      profile: 'assistente',
      bonificacao: {
        notaFiscal: 'Sim',
        consAssessoria: 'Não se aplica',
        encampInventario: 'Não se aplica'
      }
    });

    await fiscalNoteRow(page).getByRole('button', { name: 'Sim', exact: true }).click();

    expect(await page.evaluate(({ escolaId, compProgKey }) => ({
      result: verificacoes[escolaId][compProgKey].resultadoBonif,
      assessoria: verificacoes[escolaId][compProgKey].bonificacao.consAssessoria,
      inventario: verificacoes[escolaId][compProgKey].bonificacao.encampInventario,
      reopenLogs: logs.filter(log => log.acao === 'Consolidação Reaberta').length
    }), context)).toEqual({ result: '', assessoria: '', inventario: '', reopenLogs: 1 });
  });

  test('vincula e conclui por reanálise a pendência na linha exata de programa com sublinhado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(() => {
      switchProfile('controlador');

      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        candidate.programasIds.includes('ED_FAMILIA')
        && candidate.programasIds.includes('BASIC')
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      const compProgKey = `${competencia}_ED_FAMILIA`;
      const otherCompProgKey = `${competencia}_BASIC`;

      pendencias = pendencias.filter(pendency => !(
        pendency.escolaId === escola.id && pendency.competencia === competencia
      ));
      rebuildOperationalIndexes();

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      verificacoes[escola.id][compProgKey].bonificacao.extCC = 'Sim';
      verificacoes[escola.id][compProgKey].bonificacao.extINV = 'Sim';
      verificacoes[escola.id][compProgKey].analise.extINV = 'Correto';
      verificacoes[escola.id][otherCompProgKey] = RadarFluxoOperacional.createEmptyVerification();
      verificacoes[escola.id][otherCompProgKey].bonificacao.extCC = 'Sim';
      verificacoes[escola.id][otherCompProgKey].analise.extCC = 'Incorreto';

      persist();
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);

      return {
        escolaId: escola.id,
        competencia,
        compProgKey,
        otherCompProgKey,
        bonificacaoAntes: JSON.parse(JSON.stringify(
          verificacoes[escola.id][compProgKey].bonificacao
        )),
        resultadoAntes: verificacoes[escola.id][compProgKey].resultadoBonif
      };
    });

    const targetRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Educação e Família' })
      .filter({ hasText: 'Extrato Conta Corrente' });
    await expect(targetRow).toHaveCount(1);
    await targetRow.locator('select.select-analise').selectOption('Incorreto');
    const pendencyModal = page.locator('#modal-nova-pendencia');
    await expect(pendencyModal).toHaveClass(/show/);
    await pendencyModal.getByLabel('Documento ilegível', { exact: true }).check();
    await page.locator('#form-nova-pendencia button[type="submit"]').click();

    const createdPendency = await page.evaluate(({ escolaId, competencia }) => {
      const pendency = pendencias.find(item => (
        item.escolaId === escolaId
        && item.competencia === competencia
        && item.status === 'Aberta'
      ));
      return pendency && {
        id: pendency.id,
        programaId: pendency.programaId,
        documentoKey: pendency.documentoKey,
        item: pendency.item
      };
    }, context);
    expect(createdPendency).toEqual({
      id: expect.anything(),
      programaId: 'ED_FAMILIA',
      documentoKey: 'extCC',
      item: 'Educação e Família - Extrato Conta Corrente'
    });

    const linkedRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Educação e Família' })
      .filter({ hasText: 'Extrato Conta Corrente' });
    await expect(linkedRow.locator('select.select-analise')).toBeDisabled();
    await linkedRow.getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
    const submissionModal = page.locator('#modal-registrar-envio');
    await submissionModal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-06-10');
    await submissionModal.getByLabel('Observação', { exact: true })
      .fill('Documento corrigido no Drive para nova conferência.');
    await submissionModal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();

    const awaitingRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Educação e Família' })
      .filter({ hasText: 'Extrato Conta Corrente' });
    await expect(awaitingRow.locator('select.select-analise')).toBeDisabled();
    await awaitingRow.getByRole('button', { name: 'Reanalisar', exact: true }).click();
    const reanalysisModal = page.locator('#modal-reanalisar-pendencia');
    await reanalysisModal.getByLabel('Resultado da reanálise', { exact: true })
      .selectOption('correto');
    await reanalysisModal.getByLabel('Observação da análise', { exact: true })
      .fill('Documento correto confirmado no ciclo completo.');
    await reanalysisModal.getByRole('button', {
      name: 'Confirmar reanálise',
      exact: true
    }).click();

    const resolvedRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Educação e Família' })
      .filter({ hasText: 'Extrato Conta Corrente' });
    await expect(resolvedRow.locator('select.select-analise')).toBeEnabled();
    await expect(resolvedRow.locator('select.select-analise')).toHaveValue('Correto');
    await expect(resolvedRow.getByRole('button', { name: 'Reanalisar', exact: true }))
      .toHaveCount(0);

    expect(await page.evaluate(({
      escolaId,
      competencia,
      compProgKey,
      otherCompProgKey,
      pendencyId
    }) => ({
      target: verificacoes[escolaId][compProgKey].analise.extCC,
      siblingDocument: verificacoes[escolaId][compProgKey].analise.extINV,
      otherProgram: verificacoes[escolaId][otherCompProgKey].analise.extCC,
      bonusStatus: getProgramBonificationStatus(escolaId, competencia, 'ED_FAMILIA'),
      technicalStatus: getProgramTechnicalStatus(escolaId, competencia, 'ED_FAMILIA'),
      bonificacao: JSON.parse(JSON.stringify(
        verificacoes[escolaId][compProgKey].bonificacao
      )),
      resultado: verificacoes[escolaId][compProgKey].resultadoBonif,
      pendency: pendencias.find(item => item.id === pendencyId)
    }), { ...context, pendencyId: createdPendency.id })).toEqual({
      target: 'Correto',
      siblingDocument: 'Correto',
      otherProgram: 'Incorreto',
      bonusStatus: 'em-apuracao',
      technicalStatus: 'em-analise',
      bonificacao: context.bonificacaoAntes,
      resultado: context.resultadoAntes,
      pendency: expect.objectContaining({
        status: 'Resolvida',
        responsavel: null,
        errosAtuais: []
      })
    });
  });

  test('reconhece pendência textual antiga pela competência de origem', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(() => {
      switchProfile('controlador');

      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        candidate.programasIds.includes('ED_FAMILIA')
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      const compProgKey = `${competencia}_ED_FAMILIA`;

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      verificacoes[escola.id][compProgKey].bonificacao.extCC = 'Sim';
      verificacoes[escola.id][compProgKey].analise.extCC = 'Incorreto';
      pendencias = pendencias.filter(item => item.id !== 'pend-e2e-legada');
      pendencias.push(RadarPendencias.normalizePendencyRecord({
        id: 'pend-e2e-legada',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        item: 'Extrato Conta Corrente',
        motivo: 'Documento ausente',
        responsavel: 'Escola',
        status: 'Aberta',
        dataAbertura: '2026-07-10',
        observacao: 'Registro legado sem campos estruturados.'
      }));
      rebuildOperationalIndexes();
      switchView('pendencias');
      return {
        escolaId: escola.id,
        competencia,
        competenciaLabel: formatCompetenciaText(competencia),
        compProgKey
      };
    });

    const legacyRow = page.locator(
      '#p-abertas tr[data-pendency-ref*="pend-e2e-legada"]'
    );
    await expect(legacyRow).toHaveCount(1);
    await expect(legacyRow).toContainText('Extrato Conta Corrente');
    await expect(legacyRow).toContainText(context.competenciaLabel);
    await expect(legacyRow.getByRole('button', { name: 'Registrar novo envio' }))
      .toHaveCount(0);
    await expect(legacyRow.getByRole('button', { name: 'Reanalisar' })).toHaveCount(0);

    expect(await page.evaluate(() => {
      const legacy = pendencias.find(item => item.id === 'pend-e2e-legada');
      return {
        item: legacy.item,
        status: legacy.status,
        competenciaOrigem: legacy.competenciaOrigem,
        tipo: legacy.tipo,
        contextoIncompleto: legacy.contextoIncompleto,
        hasProgramaId: Object.prototype.hasOwnProperty.call(legacy, 'programaId'),
        hasDocumentoKey: Object.prototype.hasOwnProperty.call(legacy, 'documentoKey'),
        documentary: RadarPendencias.isDocumentaryPendency(legacy)
      };
    })).toEqual({
      item: 'Extrato Conta Corrente',
      status: 'Aberta',
      competenciaOrigem: context.competencia,
      tipo: 'legada',
      contextoIncompleto: true,
      hasProgramaId: false,
      hasDocumentoKey: false,
      documentary: false
    });

    await legacyRow.getByRole('button', { name: 'Abrir no Prontuário', exact: true }).click();
    const matchingTechnicalRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Educação e Família' })
      .filter({ hasText: 'Extrato Conta Corrente' });
    await expect(matchingTechnicalRow.getByRole('button', { name: 'Registrar novo envio' }))
      .toHaveCount(0);
    await expect(matchingTechnicalRow.getByRole('button', { name: 'Reanalisar' }))
      .toHaveCount(0);
  });
});
