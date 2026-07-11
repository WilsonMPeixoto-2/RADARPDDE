const { test, expect } = require('@playwright/test');

const DOCUMENT_CONTEXT = {
  programaId: 'ED_FAMILIA',
  documentoKey: 'extCC',
  documentoNome: 'Extrato Conta Corrente'
};

function targetDocumentRow(page) {
  return page.locator(
    `[data-program-id="${DOCUMENT_CONTEXT.programaId}"]`
      + `[data-document-key="${DOCUMENT_CONTEXT.documentoKey}"]`
  );
}

test.describe('ciclo de criação da pendência documental no desktop', () => {
  test('registra múltiplos erros e localiza a duplicata em reanálise', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await page.goto('/');
    const context = await page.evaluate(target => {
      switchProfile('controlador');

      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) {
        throw new Error('Escola determinística de Educação e Família não encontrada.');
      }

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const compProgKey = `${competencia}_${target.programaId}`;
      const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome: programa ? programa.name : target.programaId,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });

      pendencias = pendencias.filter(pendency => !(
        RadarPendencias.isActivePendency(pendency)
        && pendency.escolaId === escola.id
        && RadarFluxoOperacional.pendencyMatchesContext(pendency, pendencyContext)
      ));
      rebuildOperationalIndexes();

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];
      verification.bonificacao[target.documentoKey] = 'Sim';
      verification.analise[target.documentoKey] = 'Incorreto';
      verification.resultadoBonif = 'inapta';

      persist();
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);

      return {
        escolaId: escola.id,
        competencia,
        compProgKey,
        programaNome: programa ? programa.name : target.programaId,
        item: pendencyContext.item,
        bonificacaoAntes: verification.bonificacao[target.documentoKey],
        resultadoAntes: verification.resultadoBonif
      };
    }, DOCUMENT_CONTEXT);

    const documentRow = targetDocumentRow(page);
    await expect(documentRow).toHaveCount(1);
    await documentRow.locator('[data-action="open-document-pendency"]').click();

    const modal = page.locator('#modal-nova-pendencia');
    const errorInputs = modal.locator('input[name="pend-erros"]');
    const absentError = modal.getByLabel('Documento ausente', { exact: true });
    const illegibleError = modal.getByLabel('Documento ilegível', { exact: true });
    const wrongCompetenceError = modal.getByLabel('Competência incorreta', { exact: true });
    const otherErrors = modal.locator(
      'input[name="pend-erros"]:not([value="Documento ausente"])'
    );

    await expect(modal).toHaveClass(/show/);
    await expect(errorInputs).toHaveCount(10);

    await absentError.check();
    await expect(illegibleError).not.toBeChecked();
    expect(await errorInputs.evaluateAll(inputs => inputs
      .filter(input => input.value !== 'Documento ausente')
      .every(input => input.disabled))).toBe(true);

    await absentError.uncheck();
    expect(await otherErrors.evaluateAll(inputs => inputs.every(input => !input.disabled))).toBe(true);

    await illegibleError.check();
    await expect(absentError).not.toBeChecked();
    await absentError.check();
    await illegibleError.evaluate(input => {
      input.disabled = false;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(absentError).not.toBeChecked();
    expect(await otherErrors.evaluateAll(inputs => inputs.every(input => !input.disabled))).toBe(true);
    await expect(wrongCompetenceError).toBeEnabled();
    await wrongCompetenceError.check();
    await modal.locator('#pend-obs').fill('Dois erros identificados na conferência documental.');
    await modal.locator('button[type="submit"]').click();

    await expect(modal).not.toHaveClass(/show/);
    const notice = page.locator('#pendency-notice');
    await expect(notice).toBeHidden();
    const created = await page.evaluate(({ context: seeded, target }) => {
      const key = RadarPendencias.buildDocumentContextKey({
        escolaId: seeded.escolaId,
        competenciaOrigem: seeded.competencia,
        programaId: target.programaId,
        documentoKey: target.documentoKey
      });
      const active = pendencias.filter(pendency => (
        RadarPendencias.isActivePendency(pendency)
        && RadarPendencias.buildDocumentContextKey(pendency) === key
      ));
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];

      return {
        active,
        bonificacaoDepois: verification.bonificacao[target.documentoKey],
        resultadoDepois: verification.resultadoBonif
      };
    }, { context, target: DOCUMENT_CONTEXT });

    expect(created.active).toHaveLength(1);
    expect(created.active[0]).toMatchObject({
      schemaVersion: 2,
      tipo: 'documental',
      escolaId: context.escolaId,
      competencia: context.competencia,
      competenciaOrigem: context.competencia,
      programaId: DOCUMENT_CONTEXT.programaId,
      documentoKey: DOCUMENT_CONTEXT.documentoKey,
      item: context.item,
      status: 'Aberta',
      errosAtuais: ['Documento ilegível', 'Competência incorreta'],
      motivo: 'Documento ilegível',
      observacao: 'Dois erros identificados na conferência documental.'
    });
    expect(created.active[0].historico).toHaveLength(1);
    expect(created.active[0].historico[0]).toMatchObject({
      tipo: 'abertura',
      erros: ['Documento ilegível', 'Competência incorreta']
    });
    expect(created.bonificacaoDepois).toBe(context.bonificacaoAntes);
    expect(created.resultadoDepois).toBe(context.resultadoAntes);

    const originalId = created.active[0].id;

    await page.evaluate(({ seeded, target }) => {
      openNovaPendenciaModalWithDefaults(
        seeded.escolaId,
        seeded.compProgKey,
        seeded.programaNome,
        target.documentoKey,
        target.documentoNome
      );
    }, { seeded: context, target: DOCUMENT_CONTEXT });
    await modal.locator('#pend-obs').fill('Validação temporária antes do cancelamento.');
    await modal.locator('button[type="submit"]').click();
    await expect(notice).toHaveText('Informe ao menos um erro documental.');
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(modal).not.toHaveClass(/show/);
    await expect(notice).toBeHidden();

    const awaiting = await page.evaluate(({ seeded, target, originalId: pendencyId }) => {
      const pendencyIndex = pendencias.findIndex(pendency => pendency.id === pendencyId);
      if (pendencyIndex === -1) {
        throw new Error('Pendência documental criada não encontrada para o seeding de reanálise.');
      }

      pendencias[pendencyIndex] = RadarPendencias.registerCorrectiveSubmission(
        pendencias[pendencyIndex],
        {
          id: 'tentativa-e2e-aguardando-reanalise',
          dataDisponibilizacao: '2026-07-11',
          observacao: 'Documento corrigido e disponibilizado deterministicamente no E2E.'
        },
        {
          eventId: 'evento-e2e-aguardando-reanalise',
          at: '2026-07-11T12:00:00.000Z',
          usuario: 'Escola E2E',
          perfil: 'Escola'
        }
      );
      rebuildOperationalIndexes();
      persist();
      activeProntuarioCompetencia = seeded.competencia;
      switchView('prontuario', seeded.escolaId);

      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      return {
        id: pendencias[pendencyIndex].id,
        status: pendencias[pendencyIndex].status,
        bonificacaoDepois: verification.bonificacao[target.documentoKey],
        resultadoDepois: verification.resultadoBonif
      };
    }, { seeded: context, target: DOCUMENT_CONTEXT, originalId });

    expect(awaiting).toEqual({
      id: originalId,
      status: 'Aguardando reanálise',
      bonificacaoDepois: context.bonificacaoAntes,
      resultadoDepois: context.resultadoAntes
    });

    await page.evaluate(({ seeded, target }) => {
      openNovaPendenciaModalWithDefaults(
        seeded.escolaId,
        seeded.compProgKey,
        seeded.programaNome,
        target.documentoKey,
        target.documentoNome
      );
    }, { seeded: context, target: DOCUMENT_CONTEXT });

    await modal.getByLabel('Documento incompleto', { exact: true }).check();
    await modal.locator('#pend-obs').fill('Tentativa duplicada para o mesmo documento.');
    await modal.locator('button[type="submit"]').click();

    await expect(modal).not.toHaveClass(/show/);
    await expect(notice).toHaveText(
      'Já existe uma pendência ativa para este documento.'
    );
    await expect(notice).toBeVisible();

    const selectedRow = page.locator(`[data-pendency-id="${originalId}"]`);
    await expect(selectedRow).toHaveCount(1);
    await expect(selectedRow).toHaveClass(/pendency-row-selected/);
    await expect(selectedRow).toContainText('Pendência selecionada');
    await expect(selectedRow.getByText('Aguardando reanálise', { exact: true })).toBeVisible();
    await expect(selectedRow).toBeFocused();

    const afterDuplicate = await page.evaluate(({ seeded, target, originalId: expectedId }) => {
      const key = RadarPendencias.buildDocumentContextKey({
        escolaId: seeded.escolaId,
        competenciaOrigem: seeded.competencia,
        programaId: target.programaId,
        documentoKey: target.documentoKey
      });
      const active = pendencias.filter(pendency => (
        RadarPendencias.isActivePendency(pendency)
        && RadarPendencias.buildDocumentContextKey(pendency) === key
      ));
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];

      return {
        count: active.length,
        id: active[0] && active[0].id,
        status: active[0] && active[0].status,
        detailId: activePendencyDetailId,
        expectedId,
        bonificacaoDepois: verification.bonificacao[target.documentoKey],
        resultadoDepois: verification.resultadoBonif
      };
    }, { seeded: context, target: DOCUMENT_CONTEXT, originalId });

    expect(afterDuplicate).toEqual({
      count: 1,
      id: originalId,
      status: 'Aguardando reanálise',
      detailId: originalId,
      expectedId: originalId,
      bonificacaoDepois: context.bonificacaoAntes,
      resultadoDepois: context.resultadoAntes
    });
    expect(dialogs).toEqual([]);
  });

  test('registra novo envio e substituição sem encerrar nem recalcular a bonificação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(target => {
      switchProfile('controlador');

      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) {
        throw new Error('Escola determinística de Educação e Família não encontrada.');
      }

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const programaNome = programa ? programa.name : target.programaId;
      const compProgKey = `${competencia}_${target.programaId}`;
      const unrelatedCompProgKey = `${competencia}_BASIC`;
      const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });

      pendencias = pendencias.filter(pendency => !RadarPendencias.isActivePendency(pendency));
      const verification = RadarFluxoOperacional.createEmptyVerification();
      verification.bonificacao = {
        extCC: 'Sim',
        extINV: 'Não',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Sim',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
      };
      verification.analise[target.documentoKey] = 'Incorreto';
      verification.analise.extINV = 'Correto';
      verification.resultadoBonif = 'inapta';

      const unrelatedVerification = RadarFluxoOperacional.createEmptyVerification();
      unrelatedVerification.bonificacao.extCC = 'Sim';
      unrelatedVerification.analise.extCC = 'Correto';
      unrelatedVerification.resultadoBonif = 'apta';

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = verification;
      verificacoes[escola.id][unrelatedCompProgKey] = unrelatedVerification;

      const pendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-novo-envio',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: target.documentoKey,
        item: pendencyContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Documento original ilegível para conferência.',
        dataAbertura: '2026-07-09'
      }, {
        eventId: 'evento-e2e-abertura-novo-envio',
        at: '2026-07-09T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      pendencias.push(pendency);
      rebuildOperationalIndexes();
      persist();
      switchView('pendencias');

      const user = getCurrentUser();
      return {
        pendencyId: pendency.id,
        escolaId: escola.id,
        escolaNome: escola.denominação,
        competencia,
        compProgKey,
        unrelatedCompProgKey,
        programaNome,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome,
        user,
        bonificacaoDocumentoAntes: verification.bonificacao[target.documentoKey],
        bonificacaoAntes: { ...verification.bonificacao },
        analiseAntes: { ...verification.analise },
        resultadoAntes: verification.resultadoBonif,
        unrelatedVerificationAntes: JSON.parse(JSON.stringify(unrelatedVerification)),
        novoEnvioLogsAntes: logs.filter(log => log.acao === 'Novo envio registrado').length
      };
    }, DOCUMENT_CONTEXT);

    const row = page.locator(`[data-pendency-id="${context.pendencyId}"]`);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('button', { name: 'Registrar novo envio', exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: /^(Resolver|Resolver Pendência)$/ })).toHaveCount(0);

    await row.getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
    const modal = page.locator('#modal-registrar-envio');
    const contextSummary = modal.locator('#envio-contexto');
    const availabilityDate = modal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    );
    const observation = modal.getByLabel('Observação', { exact: true });
    const link = modal.getByLabel('Link direto do arquivo no Drive (opcional)', { exact: true });
    const submit = modal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    });

    await expect(modal).toHaveClass(/show/);
    await expect(modal.getByRole('heading', {
      name: 'Registrar novo envio para conferência',
      exact: true
    })).toBeVisible();
    await expect(contextSummary).toContainText(context.escolaNome);
    await expect(contextSummary).toContainText(context.competencia);
    await expect(contextSummary).toContainText(context.programaNome);
    await expect(contextSummary).toContainText(context.documentoNome);

    await observation.fill('Arquivo corrigido, mas a data ainda não foi informada.');
    await submit.click();
    expect(await availabilityDate.evaluate(input => input.validity.valueMissing)).toBe(true);

    const afterMissingDate = await page.evaluate(({ pendencyId, logCount }) => {
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        status: pendency.status,
        attempts: pendency.tentativas.length,
        history: pendency.historico.length,
        logCount: logs.filter(log => log.acao === 'Novo envio registrado').length,
        expectedLogCount: logCount
      };
    }, { pendencyId: context.pendencyId, logCount: context.novoEnvioLogsAntes });
    expect(afterMissingDate).toEqual({
      status: 'Aberta',
      attempts: 0,
      history: 1,
      logCount: context.novoEnvioLogsAntes,
      expectedLogCount: context.novoEnvioLogsAntes
    });

    await availabilityDate.fill('2026-07-10');
    await observation.fill('');
    await submit.click();
    expect(await observation.evaluate(input => input.validity.valueMissing)).toBe(true);

    const afterMissingObservation = await page.evaluate(({ pendencyId, logCount }) => {
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        status: pendency.status,
        attempts: pendency.tentativas.length,
        history: pendency.historico.length,
        logCount: logs.filter(log => log.acao === 'Novo envio registrado').length,
        expectedLogCount: logCount
      };
    }, { pendencyId: context.pendencyId, logCount: context.novoEnvioLogsAntes });
    expect(afterMissingObservation).toEqual({
      status: 'Aberta',
      attempts: 0,
      history: 1,
      logCount: context.novoEnvioLogsAntes,
      expectedLogCount: context.novoEnvioLogsAntes
    });

    await observation.fill('Extrato corrigido disponibilizado para nova conferência.');
    await expect(link).toHaveValue('');
    await submit.click();
    await expect(modal).not.toHaveClass(/show/);

    const firstSubmission = await page.evaluate(seeded => {
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      const active = pendencias.filter(item => RadarPendencias.isActivePendency(item));
      const matchingLogs = logs.filter(log => log.acao === 'Novo envio registrado');
      return {
        pendency,
        isActive: RadarPendencias.isActivePendency(pendency),
        activeIds: active.map(item => item.id),
        bonificacaoDocumento: verification.bonificacao[seeded.documentoKey],
        bonificacao: { ...verification.bonificacao },
        analise: { ...verification.analise },
        resultadoBonif: verification.resultadoBonif,
        unrelatedVerification: JSON.parse(JSON.stringify(
          verificacoes[seeded.escolaId][seeded.unrelatedCompProgKey]
        )),
        matchingLogs
      };
    }, context);

    expect(firstSubmission.pendency).toMatchObject({
      id: context.pendencyId,
      status: 'Aguardando reanálise',
      responsavel: 'Controlador',
      dataResolucao: null
    });
    expect(firstSubmission.pendency.tentativas).toHaveLength(1);
    expect(firstSubmission.pendency.tentativas[0]).toMatchObject({
      numero: 1,
      dataDisponibilizacao: '2026-07-10',
      observacao: 'Extrato corrigido disponibilizado para nova conferência.',
      link: null,
      registradoPor: context.user.name,
      status: 'aguardando',
      dataAnalise: null,
      analisadoPor: null,
      resultado: null,
      errosEncontrados: [],
      observacaoAnalise: null
    });
    expect(firstSubmission.pendency.tentativas[0].dataRegistro).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(firstSubmission.pendency.historico).toHaveLength(2);
    expect(firstSubmission.pendency.historico.at(-1)).toMatchObject({
      tipo: 'novo_envio',
      tentativaId: firstSubmission.pendency.tentativas[0].id
    });
    expect(firstSubmission.pendency.historico.at(-1).dataHora)
      .toBe(firstSubmission.pendency.tentativas[0].dataRegistro);
    expect(firstSubmission.isActive).toBe(true);
    expect(firstSubmission.activeIds).toEqual([context.pendencyId]);
    expect(firstSubmission.analise).toEqual({
      ...context.analiseAntes,
      [DOCUMENT_CONTEXT.documentoKey]: 'Não analisado'
    });
    expect(firstSubmission.unrelatedVerification).toEqual(context.unrelatedVerificationAntes);
    expect(firstSubmission.bonificacaoDocumento).toBe(context.bonificacaoDocumentoAntes);
    expect(firstSubmission.bonificacao).toEqual(context.bonificacaoAntes);
    expect(firstSubmission.resultadoBonif).toBe(context.resultadoAntes);
    expect(firstSubmission.matchingLogs).toHaveLength(context.novoEnvioLogsAntes + 1);
    expect(firstSubmission.matchingLogs[0].acao).toBe('Novo envio registrado');
    expect(firstSubmission.matchingLogs[0].detalhes).toContain(context.escolaNome);
    expect(firstSubmission.matchingLogs[0].detalhes).toContain(context.competencia);
    expect(firstSubmission.matchingLogs[0].detalhes).toContain(context.programaNome);
    expect(firstSubmission.matchingLogs[0].detalhes).toContain(context.documentoNome);
    expect(firstSubmission.matchingLogs[0].detalhes).toContain('2026-07-10');

    await expect(page.getByRole('button', { name: 'Ativas (1)', exact: true })).toBeVisible();
    const awaitingRow = page.locator(`[data-pendency-id="${context.pendencyId}"]`);
    await expect(awaitingRow).toContainText('Aguardando reanálise');
    await expect(awaitingRow.getByRole('button', {
      name: 'Registrar substituição mais recente',
      exact: true
    })).toBeVisible();

    await awaitingRow.getByRole('button', {
      name: 'Registrar substituição mais recente',
      exact: true
    }).click();
    await expect(availabilityDate).toHaveValue('');
    await expect(observation).toHaveValue('');
    await expect(link).toHaveValue('');
    await availabilityDate.fill('2026-07-11');
    await observation.fill('Versão mais recente do extrato substitui o envio anterior.');
    await link.fill('https://drive.google.com/file/d/e2e-extrato-corrigido/view');
    await submit.click();
    await expect(modal).not.toHaveClass(/show/);

    const secondSubmission = await page.evaluate(seeded => {
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      return {
        pendency,
        isActive: RadarPendencias.isActivePendency(pendency),
        activeIds: pendencias
          .filter(item => RadarPendencias.isActivePendency(item))
          .map(item => item.id),
        bonificacaoDocumento: verification.bonificacao[seeded.documentoKey],
        bonificacao: { ...verification.bonificacao },
        analise: { ...verification.analise },
        resultadoBonif: verification.resultadoBonif,
        unrelatedVerification: JSON.parse(JSON.stringify(
          verificacoes[seeded.escolaId][seeded.unrelatedCompProgKey]
        )),
        matchingLogs: logs.filter(log => log.acao === 'Novo envio registrado')
      };
    }, context);

    expect(secondSubmission.pendency).toMatchObject({
      status: 'Aguardando reanálise',
      responsavel: 'Controlador',
      dataResolucao: null
    });
    expect(secondSubmission.pendency.tentativas).toHaveLength(2);
    expect(secondSubmission.pendency.tentativas[0]).toEqual({
      ...firstSubmission.pendency.tentativas[0],
      status: 'substituida_antes_da_analise'
    });
    expect(secondSubmission.pendency.tentativas[1]).toMatchObject({
      numero: 2,
      dataDisponibilizacao: '2026-07-11',
      observacao: 'Versão mais recente do extrato substitui o envio anterior.',
      link: 'https://drive.google.com/file/d/e2e-extrato-corrigido/view',
      registradoPor: context.user.name,
      status: 'aguardando',
      dataAnalise: null,
      analisadoPor: null,
      resultado: null,
      errosEncontrados: [],
      observacaoAnalise: null
    });
    expect(secondSubmission.pendency.tentativas[1].id)
      .not.toBe(firstSubmission.pendency.tentativas[0].id);
    expect(secondSubmission.pendency.tentativas[1].dataRegistro).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(secondSubmission.pendency.historico).toHaveLength(3);
    expect(secondSubmission.pendency.historico.at(-1)).toMatchObject({
      tipo: 'novo_envio',
      tentativaId: secondSubmission.pendency.tentativas[1].id
    });
    expect(secondSubmission.pendency.historico.at(-1).dataHora)
      .toBe(secondSubmission.pendency.tentativas[1].dataRegistro);
    expect(secondSubmission.isActive).toBe(true);
    expect(secondSubmission.activeIds).toEqual([context.pendencyId]);
    expect(secondSubmission.analise).toEqual({
      ...context.analiseAntes,
      [DOCUMENT_CONTEXT.documentoKey]: 'Não analisado'
    });
    expect(secondSubmission.unrelatedVerification).toEqual(context.unrelatedVerificationAntes);
    expect(secondSubmission.bonificacaoDocumento).toBe(context.bonificacaoDocumentoAntes);
    expect(secondSubmission.bonificacao).toEqual(context.bonificacaoAntes);
    expect(secondSubmission.resultadoBonif).toBe(context.resultadoAntes);
    expect(secondSubmission.matchingLogs).toHaveLength(context.novoEnvioLogsAntes + 2);
    expect(secondSubmission.matchingLogs.slice(0, 2)
      .every(log => log.acao === 'Novo envio registrado')).toBe(true);
    expect(secondSubmission.matchingLogs[0].detalhes).toContain('2026-07-11');
  });
});
