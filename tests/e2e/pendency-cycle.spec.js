const { test, expect } = require('@playwright/test');

const DOCUMENT_CONTEXT = {
  programaId: 'ED_FAMILIA',
  documentoKey: 'extCC',
  documentoNome: 'Extrato Conta Corrente'
};

const PERSISTED_LOCAL_STORAGE_KEYS = [
  'radar_pdde_escolas',
  'radar_pdde_pendencias',
  'radar_pdde_contatos',
  'radar_pdde_logs',
  'radar_pdde_bens',
  'radar_pdde_verificacoes',
  'radar_pdde_config',
  'radar_pdde_programas',
  'radar_pdde_controladores',
  'radar_pdde_equipe_inventario',
  'radar_pdde_notas_registradas',
  'radar_pdde_data_version'
];

function targetDocumentRow(page) {
  return page.locator(
    `[data-program-id="${DOCUMENT_CONTEXT.programaId}"]`
      + `[data-document-key="${DOCUMENT_CONTEXT.documentoKey}"]`
  );
}

async function seedAwaitingReanalysis(page, options = {}) {
  return page.evaluate(({ target, seedOptions }) => {
    switchProfile('controlador');

    const competencia = seedOptions.competencia || activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes(target.programaId)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) {
      throw new Error('Escola determinística para reanálise não encontrada.');
    }

    const programa = programas.find(candidate => candidate.id === target.programaId);
    const programaNome = programa ? programa.name : target.programaId;
    const compProgKey = competencia + '_' + target.programaId;
    const unrelatedCompProgKey = competencia + '_BASIC';
    const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
      compProgKey,
      programaNome,
      documentoKey: target.documentoKey,
      documentoNome: target.documentoNome
    });

    pendencias = [];
    verificacoes[escola.id] = verificacoes[escola.id] || {};

    const verification = RadarFluxoOperacional.createEmptyVerification();
    verification.bonificacao = {
      extCC: 'Sim',
      extINV: 'Não',
      notaFiscal: 'Não se aplica',
      consAssessoria: 'Sim',
      declBBAgil: 'Sim',
      encampInventario: 'Não se aplica'
    };
    verification.analise[target.documentoKey] = 'Não analisado';
    verification.analise.extINV = 'Correto';
    verification.resultadoBonif = 'inapta';
    verificacoes[escola.id][compProgKey] = verification;

    const unrelatedVerification = RadarFluxoOperacional.createEmptyVerification();
    unrelatedVerification.bonificacao.extCC = 'Sim';
    unrelatedVerification.analise.extCC = 'Correto';
    unrelatedVerification.resultadoBonif = 'apta';
    verificacoes[escola.id][unrelatedCompProgKey] = unrelatedVerification;

    const opened = RadarPendencias.createDocumentPendency({
      id: seedOptions.pendencyId || 'pend-e2e-reanalise',
      escolaId: escola.id,
      competenciaOrigem: competencia,
      programaId: target.programaId,
      documentoKey: target.documentoKey,
      item: pendencyContext.item,
      errosAtuais: ['Documento ilegível', 'Competência incorreta'],
      observacao: 'Erros originais preservados no histórico.',
      dataAbertura: '2026-06-01'
    }, {
      eventId: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-abertura',
      at: '2026-06-01T12:00:00.000Z',
      usuario: 'Controladora E2E',
      perfil: 'Controlador'
    });
    const awaiting = RadarPendencias.registerCorrectiveSubmission(opened, {
      id: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-tentativa',
      dataDisponibilizacao: seedOptions.availabilityDate || '2026-06-10',
      observacao: seedOptions.submissionObservation
        || 'Arquivo corrigido disponibilizado para conferência.',
      link: Object.prototype.hasOwnProperty.call(seedOptions, 'link')
        ? seedOptions.link
        : 'https://drive.google.com/file/d/reanalise-e2e/view'
    }, {
      eventId: (seedOptions.pendencyId || 'pend-e2e-reanalise') + '-envio',
      at: '2026-06-10T12:00:00.000Z',
      usuario: 'Escola E2E',
      perfil: 'Escola'
    });

    pendencias.push(awaiting);
    rebuildOperationalIndexes();
    persist();
    if (seedOptions.view === 'prontuario') {
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
    } else {
      switchView('pendencias');
    }

    return {
      pendencyId: awaiting.id,
      escolaId: escola.id,
      escolaNome: escola.denominação,
      competencia,
      compProgKey,
      unrelatedCompProgKey,
      programaId: target.programaId,
      programaNome,
      documentoKey: target.documentoKey,
      documentoNome: target.documentoNome,
      availabilityDate: awaiting.tentativas.at(-1).dataDisponibilizacao,
      submissionObservation: awaiting.tentativas.at(-1).observacao,
      submissionLink: awaiting.tentativas.at(-1).link,
      user: getCurrentUser(),
      oldHistory: JSON.parse(JSON.stringify(awaiting.historico)),
      verificationBefore: JSON.parse(JSON.stringify(verification)),
      unrelatedBefore: JSON.parse(JSON.stringify(unrelatedVerification)),
      reanalysisLogsBefore: logs.filter(log => log.acao === 'Reanálise registrada').length
    };
  }, { target: DOCUMENT_CONTEXT, seedOptions: options });
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

    const selectedRow = page.locator('tr[data-pendency-ref].pendency-row-selected');
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

    const row = page.locator('#p-abertas tr[data-pendency-ref]');
    await expect(row).toHaveCount(1);
    const initialSubmissionTrigger = row.getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await expect(initialSubmissionTrigger).toBeVisible();
    await expect(row.getByRole('button', { name: /^(Resolver|Resolver Pendência)$/ })).toHaveCount(0);

    const modal = page.locator('#modal-registrar-envio');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-registrar-envio-title');
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');

    await initialSubmissionTrigger.click();
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
    const close = modal.getByRole('button', {
      name: 'Fechar registro de novo envio',
      exact: true
    });

    await expect(modal).toHaveClass(/show/);
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(modal).not.toHaveAttribute('inert', '');
    await expect(modal.getByRole('heading', {
      name: 'Registrar novo envio para conferência',
      exact: true
    })).toBeVisible();
    await expect(contextSummary).toContainText(context.escolaNome);
    await expect(contextSummary).toContainText(context.competencia);
    await expect(contextSummary).toContainText(context.programaNome);
    await expect(contextSummary).toContainText(context.documentoNome);
    await expect(availabilityDate).toBeFocused();

    await submit.focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(submit).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/show/);
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');
    await expect(initialSubmissionTrigger).toBeFocused();

    await initialSubmissionTrigger.click();
    await expect(availabilityDate).toBeFocused();

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
    const awaitingRow = page.locator('#p-abertas tr[data-pendency-ref]');
    await expect(awaitingRow).toContainText('Aguardando reanálise');
    const replacementTrigger = awaitingRow.getByRole('button', {
      name: 'Registrar substituição mais recente',
      exact: true
    });
    await expect(replacementTrigger).toBeVisible();
    await expect(replacementTrigger).toBeFocused();

    await replacementTrigger.click();
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
    await expect(page.getByRole('button', {
      name: 'Registrar substituição mais recente',
      exact: true
    })).toBeFocused();
  });

  test('restaura memória, índices e localStorage após falha intermediária de persistência', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(({ target, storageKeys }) => {
      switchProfile('controlador');

      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) {
        throw new Error('Escola determinística para rollback não encontrada.');
      }

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const compProgKey = `${competencia}_${target.programaId}`;
      const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome: programa ? programa.name : target.programaId,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });

      pendencias = pendencias.filter(pendency => !RadarPendencias.isActivePendency(pendency));
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];
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

      const pendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-rollback-persistencia',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: target.documentoKey,
        item: pendencyContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Estado original que deve sobreviver à falha de persistência.',
        dataAbertura: '2026-07-09'
      }, {
        eventId: 'evento-e2e-abertura-rollback',
        at: '2026-07-09T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      pendencias.push(pendency);
      rebuildOperationalIndexes();
      persist();
      switchView('pendencias');

      const captureIndexes = () => ({
        pendencias: Array.from(_pendenciasByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ]),
        bens: Array.from(_bensByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ])
      });

      return {
        pendencyId: pendency.id,
        escolaId: escola.id,
        compProgKey,
        documentoKey: target.documentoKey,
        snapshot: {
          pendencias: JSON.parse(JSON.stringify(pendencias)),
          verification: JSON.parse(JSON.stringify(verification)),
          logs: JSON.parse(JSON.stringify(logs)),
          indexes: captureIndexes(),
          localStorage: Object.fromEntries(
            storageKeys.map(key => [key, localStorage.getItem(key)])
          )
        }
      };
    }, { target: DOCUMENT_CONTEXT, storageKeys: PERSISTED_LOCAL_STORAGE_KEYS });

    const modal = page.locator('#modal-registrar-envio');
    await page.getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
    await modal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-07-10');
    await modal.getByLabel('Observação', { exact: true })
      .fill('Envio que deve sofrer rollback integral.');

    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;
      window.__restoreRollbackSetItem = () => {
        Storage.prototype.setItem = originalSetItem;
        delete window.__restoreRollbackSetItem;
      };
      Storage.prototype.setItem = function setItemWithSingleFailure(key, value) {
        if (!failed && key === 'radar_pdde_logs') {
          failed = true;
          Storage.prototype.setItem = originalSetItem;
          throw new Error('Falha E2E intermediária ao persistir logs.');
        }
        return originalSetItem.call(this, key, value);
      };
    });

    try {
      await modal.getByRole('button', {
        name: 'Registrar e enviar para reanálise',
        exact: true
      }).click();
      await expect(modal).toHaveClass(/show/);
      await expect(modal.getByRole('alert')).toContainText(
        'Falha E2E intermediária ao persistir logs.'
      );
    } finally {
      await page.evaluate(() => {
        if (window.__restoreRollbackSetItem) window.__restoreRollbackSetItem();
      });
    }

    const afterFailure = await page.evaluate(({ seeded, storageKeys }) => {
      const captureIndexes = () => ({
        pendencias: Array.from(_pendenciasByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ]),
        bens: Array.from(_bensByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ])
      });
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);

      return {
        snapshot: {
          pendencias: JSON.parse(JSON.stringify(pendencias)),
          verification: JSON.parse(JSON.stringify(
            verificacoes[seeded.escolaId][seeded.compProgKey]
          )),
          logs: JSON.parse(JSON.stringify(logs)),
          indexes: captureIndexes(),
          localStorage: Object.fromEntries(
            storageKeys.map(key => [key, localStorage.getItem(key)])
          )
        },
        affected: {
          status: pendency.status,
          attempts: pendency.tentativas.length,
          history: pendency.historico.length,
          analysis: verificacoes[seeded.escolaId][seeded.compProgKey]
            .analise[seeded.documentoKey],
          matchingLogs: logs.filter(log => log.acao === 'Novo envio registrado').length
        }
      };
    }, { seeded: context, storageKeys: PERSISTED_LOCAL_STORAGE_KEYS });

    expect(afterFailure.snapshot).toEqual(context.snapshot);
    expect(afterFailure.affected).toEqual({
      status: 'Aberta',
      attempts: 0,
      history: 1,
      analysis: 'Incorreto',
      matchingLogs: context.snapshot.logs
        .filter(log => log.acao === 'Novo envio registrado').length
    });
  });

  test('preserva tipo de IDs legados e mantém ações seguras para aspas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const pageErrors = [];
    const dialogs = [];
    page.on('pageerror', error => pageErrors.push(error.message));
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
      if (!escola) throw new Error('Escola determinística para IDs legados não encontrada.');

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const programaNome = programa ? programa.name : target.programaId;
      const compProgKey = `${competencia}_${target.programaId}`;
      const definitions = [
        {
          id: 123,
          documentoKey: 'extCC',
          documentoNome: 'Extrato Conta Corrente'
        },
        {
          id: '123',
          documentoKey: 'extINV',
          documentoNome: 'Extrato Investimento'
        },
        {
          id: `pend-"dupla'-legado`,
          documentoKey: 'notaFiscal',
          documentoNome: 'Notas Fiscais'
        }
      ];

      pendencias = pendencias.filter(pendency => !RadarPendencias.isActivePendency(pendency));
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];

      definitions.forEach((definition, index) => {
        verification.bonificacao[definition.documentoKey] = 'Sim';
        verification.analise[definition.documentoKey] = 'Incorreto';
        const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
          compProgKey,
          programaNome,
          documentoKey: definition.documentoKey,
          documentoNome: definition.documentoNome
        });
        const pendency = RadarPendencias.createDocumentPendency({
          id: `pend-e2e-id-legado-seed-${index + 1}`,
          escolaId: escola.id,
          competenciaOrigem: competencia,
          programaId: target.programaId,
          documentoKey: definition.documentoKey,
          item: pendencyContext.item,
          errosAtuais: ['Documento ilegível'],
          observacao: `Pendência legada ${index + 1}.`,
          dataAbertura: '2026-07-09'
        }, {
          eventId: `evento-e2e-id-legado-${index + 1}`,
          at: `2026-07-09T12:0${index}:00.000Z`,
          usuario: 'Controladora E2E',
          perfil: 'Controlador'
        });
        pendency.id = definition.id;
        pendencias.push(pendency);
      });
      verification.resultadoBonif = 'inapta';

      rebuildOperationalIndexes();
      persist();
      switchView('pendencias');

      return {
        numericId: definitions[0].id,
        stringNumericId: definitions[1].id,
        quotedId: definitions[2].id,
        documents: definitions.map(definition => definition.documentoNome)
      };
    }, DOCUMENT_CONTEXT);

    const rows = page.locator('#p-abertas tr[data-pendency-ref]');
    const actions = page.getByRole('button', { name: 'Registrar novo envio', exact: true });
    const modal = page.locator('#modal-registrar-envio');
    const hiddenReference = modal.locator('#envio-pendencia-id');
    const cancel = modal.getByRole('button', { name: 'Cancelar', exact: true });
    const rowFor = documentName => rows.filter({ hasText: documentName });

    await expect(rows).toHaveCount(3);
    await expect(actions).toHaveCount(3);
    await expect(modal).toHaveCount(1);

    const numericTrigger = rowFor(context.documents[0]).getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await numericTrigger.click();
    await expect(modal.locator('#envio-contexto')).toContainText(context.documents[0]);
    expect(JSON.parse(await hiddenReference.inputValue())).toEqual({
      type: 'number',
      value: context.numericId
    });
    await cancel.click();
    await expect(numericTrigger).toBeFocused();

    const stringNumericTrigger = rowFor(context.documents[1]).getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await stringNumericTrigger.click();
    await expect(modal.locator('#envio-contexto')).toContainText(context.documents[1]);
    expect(JSON.parse(await hiddenReference.inputValue())).toEqual({
      type: 'string',
      value: context.stringNumericId
    });
    await cancel.click();
    await expect(stringNumericTrigger).toBeFocused();

    const quotedTrigger = rowFor(context.documents[2]).getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await quotedTrigger.click();
    await expect(modal.locator('#envio-contexto')).toContainText(context.documents[2]);
    expect(JSON.parse(await hiddenReference.inputValue())).toEqual({
      type: 'string',
      value: context.quotedId
    });
    await cancel.click();
    await expect(quotedTrigger).toBeFocused();

    expect(await page.evaluate(id => abrirModalRegistrarNovoEnvio(id), context.numericId)).toBe(true);
    expect(JSON.parse(await hiddenReference.inputValue())).toEqual({
      type: 'number',
      value: context.numericId
    });
    await cancel.click();

    expect(await page.evaluate(id => openPendencyDetail(id), context.quotedId)).toBe(true);
    await expect.poll(() => page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused || !focused.dataset.pendencyRef) return null;
      return {
        reference: JSON.parse(focused.dataset.pendencyRef),
        selected: focused.classList.contains('pendency-row-selected')
      };
    })).toEqual({
      reference: { type: 'string', value: context.quotedId },
      selected: true
    });

    const selectedQuotedRow = page.locator('tr[data-pendency-ref].pendency-row-selected');
    await expect(selectedQuotedRow).toContainText(context.documents[2]);
    await selectedQuotedRow.getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    }).click();
    await expect(modal.locator('#envio-contexto')).toContainText(context.documents[2]);
    await cancel.click();

    await expect(rows).toHaveCount(3);
    await expect(actions).toHaveCount(3);
    expect(pageErrors).toEqual([]);
    expect(dialogs).toEqual([]);
  });

  test('preserva aba Pendências, competência de origem e foco após novo envio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(target => {
      switchProfile('controlador');

      const competenciaOrigem = '2026-04';
      const competenciaAnterior = '2026-05';
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competenciaOrigem)
      ));
      if (!escola) throw new Error('Escola determinística para foco em Pendências não encontrada.');

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const compProgKey = `${competenciaOrigem}_${target.programaId}`;
      const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome: programa ? programa.name : target.programaId,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });

      pendencias = pendencias.filter(pendency => !RadarPendencias.isActivePendency(pendency));
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];
      verification.bonificacao[target.documentoKey] = 'Sim';
      verification.analise[target.documentoKey] = 'Incorreto';
      verification.resultadoBonif = 'inapta';

      const pendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-foco-aba-pendencias',
        escolaId: escola.id,
        competenciaOrigem,
        programaId: target.programaId,
        documentoKey: target.documentoKey,
        item: pendencyContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Pendência de competência diferente da seleção anterior.',
        dataAbertura: '2026-07-09'
      }, {
        eventId: 'evento-e2e-foco-aba-pendencias',
        at: '2026-07-09T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      pendencias.push(pendency);
      rebuildOperationalIndexes();
      persist();

      activeProntuarioCompetencia = competenciaAnterior;
      switchView('prontuario', escola.id);
      return {
        pendencyId: pendency.id,
        escolaId: escola.id,
        competenciaOrigem,
        competenciaAnterior
      };
    }, DOCUMENT_CONTEXT);

    expect(context.competenciaOrigem).not.toBe(context.competenciaAnterior);
    const pendenciasTab = page.locator('[data-tab="pendencias"]');
    await pendenciasTab.click();
    await expect(pendenciasTab).toHaveClass(/active/);

    const trigger = page.locator('#tab-pendencias').getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await trigger.click();

    const modal = page.locator('#modal-registrar-envio');
    await modal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-07-10');
    await modal.getByLabel('Observação', { exact: true })
      .fill('Novo envio iniciado na aba de pendências da unidade.');
    await modal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();
    await expect(modal).not.toHaveClass(/show/);

    await expect(page.locator('[data-tab="pendencias"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-pendencias')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => activeProntuarioCompetencia))
      .toBe(context.competenciaOrigem);
    await expect.poll(() => page.evaluate(pendencyId => {
      const focused = document.activeElement;
      return {
        body: focused === document.body,
        samePendency: elementMatchesPendencyIdReference(focused, pendencyId),
        inSourceTab: Boolean(focused && focused.closest('#tab-pendencias'))
      };
    }, context.pendencyId)).toEqual({
      body: false,
      samePendency: true,
      inSourceTab: true
    });
  });

  test('reativa Pendências Ativas e destaca o registro enviado após detalhe resolvido', async ({ page }, testInfo) => {
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
      if (!escola) throw new Error('Escola determinística para foco global não encontrada.');

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const programaNome = programa ? programa.name : target.programaId;
      const compProgKey = `${competencia}_${target.programaId}`;
      const activeContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });
      const resolvedContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome,
        documentoKey: 'extINV',
        documentoNome: 'Extrato Investimento'
      });

      pendencias = [];
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];
      verification.bonificacao[target.documentoKey] = 'Sim';
      verification.analise[target.documentoKey] = 'Incorreto';
      verification.resultadoBonif = 'inapta';

      const activePendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-foco-global-ativa',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: target.documentoKey,
        item: activeContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Registro ativo que receberá o novo envio.',
        dataAbertura: '2026-07-09'
      }, {
        eventId: 'evento-e2e-foco-global-ativa',
        at: '2026-07-09T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      const resolvedPendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-foco-global-resolvida',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: 'extINV',
        item: resolvedContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Registro resolvido previamente selecionado.',
        dataAbertura: '2026-07-08'
      }, {
        eventId: 'evento-e2e-foco-global-resolvida',
        at: '2026-07-08T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      resolvedPendency.status = 'Resolvida';
      resolvedPendency.responsavel = null;
      resolvedPendency.dataResolucao = '2026-07-09';
      resolvedPendency.justificativaResolucao = 'Análise concluída anteriormente.';

      pendencias.push(activePendency, resolvedPendency);
      activePendencyDetailId = resolvedPendency.id;
      rebuildOperationalIndexes();
      persist();
      switchView('pendencias');
      return {
        activePendencyId: activePendency.id,
        resolvedPendencyId: resolvedPendency.id
      };
    }, DOCUMENT_CONTEXT);

    await expect(page.getByRole('button', {
      name: 'Histórico Resolvidas (1)',
      exact: true
    })).toHaveClass(/active/);
    await page.getByRole('button', { name: 'Ativas (1)', exact: true }).click();

    const trigger = page.locator('#p-abertas').getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    });
    await trigger.click();
    const modal = page.locator('#modal-registrar-envio');
    await modal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-07-10');
    await modal.getByLabel('Observação', { exact: true })
      .fill('Novo envio do registro ativo aberto antes da mudança de estado.');
    await modal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();
    await expect(modal).not.toHaveClass(/show/);

    await expect(page.getByRole('button', { name: 'Ativas (1)', exact: true }))
      .toHaveClass(/active/);
    await expect(page.locator('#p-abertas')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => activePendencyDetailId))
      .toBe(context.activePendencyId);
    await expect.poll(() => page.evaluate(pendencyId => {
      const focused = document.activeElement;
      return {
        body: focused === document.body,
        samePendency: elementMatchesPendencyIdReference(focused, pendencyId),
        inActiveTab: Boolean(focused && focused.closest('#p-abertas'))
      };
    }, context.activePendencyId)).toEqual({
      body: false,
      samePendency: true,
      inActiveTab: true
    });
  });

  test('restaura competência e foco documental após abertura programática na grade', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await page.evaluate(target => {
      switchProfile('controlador');

      const competenciaOrigem = '2026-04';
      const competenciaAnterior = '2026-05';
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competenciaOrigem)
      ));
      if (!escola) throw new Error('Escola determinística para foco documental não encontrada.');

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const compProgKey = `${competenciaOrigem}_${target.programaId}`;
      const pendencyContext = RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome: programa ? programa.name : target.programaId,
        documentoKey: target.documentoKey,
        documentoNome: target.documentoNome
      });

      pendencias = pendencias.filter(pendency => !RadarPendencias.isActivePendency(pendency));
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      const verification = verificacoes[escola.id][compProgKey];
      verification.bonificacao[target.documentoKey] = 'Sim';
      verification.analise[target.documentoKey] = 'Incorreto';
      verification.resultadoBonif = 'inapta';

      const pendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-foco-grade-documental',
        escolaId: escola.id,
        competenciaOrigem,
        programaId: target.programaId,
        documentoKey: target.documentoKey,
        item: pendencyContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Pendência aberta programaticamente a partir da grade ativa.',
        dataAbertura: '2026-07-09'
      }, {
        eventId: 'evento-e2e-foco-grade-documental',
        at: '2026-07-09T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      pendencias.push(pendency);
      rebuildOperationalIndexes();
      persist();

      activeProntuarioCompetencia = competenciaAnterior;
      switchView('prontuario', escola.id);
      return {
        pendencyId: pendency.id,
        competenciaOrigem,
        competenciaAnterior,
        programaId: target.programaId,
        documentoKey: target.documentoKey
      };
    }, DOCUMENT_CONTEXT);

    expect(context.competenciaOrigem).not.toBe(context.competenciaAnterior);
    await expect(page.locator('[data-tab="verificacoes"]')).toHaveClass(/active/);
    expect(await page.evaluate(pendencyId => abrirModalRegistrarNovoEnvio(pendencyId), context.pendencyId))
      .toBe(true);

    const modal = page.locator('#modal-registrar-envio');
    await modal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-07-10');
    await modal.getByLabel('Observação', { exact: true })
      .fill('Novo envio programático preservando a origem na grade documental.');
    await modal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();
    await expect(modal).not.toHaveClass(/show/);

    await expect(page.locator('[data-tab="verificacoes"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-verificacoes')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => activeProntuarioCompetencia))
      .toBe(context.competenciaOrigem);
    await expect.poll(() => page.evaluate(seeded => {
      const focused = document.activeElement;
      const row = focused && focused.closest('tr');
      return {
        body: focused === document.body,
        samePendency: elementMatchesPendencyIdReference(focused, seeded.pendencyId),
        inSourceTab: Boolean(focused && focused.closest('#tab-verificacoes')),
        programaId: row && row.dataset.programId,
        documentoKey: row && row.dataset.documentKey
      };
    }, context)).toEqual({
      body: false,
      samePendency: true,
      inSourceTab: true,
      programaId: context.programaId,
      documentoKey: context.documentoKey
    });
  });
});

test.describe('reanálise atômica da pendência documental no desktop', () => {
  test('reanálise incorreta substitui erros atuais e preserva histórico e bonificação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await seedAwaitingReanalysis(page, {
      pendencyId: 'pend-e2e-reanalise-incorreta',
      availabilityDate: '2026-06-10',
      submissionObservation: 'Arquivo legível, mas com conteúdo que precisa de nova conferência.',
      link: 'https://drive.google.com/file/d/reanalise-incorreta/view'
    });

    const trigger = page.getByRole('button', { name: 'Reanalisar', exact: true });
    await expect(trigger).toBeVisible();

    const modal = page.locator('#modal-reanalisar-pendencia');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-reanalisar-pendencia-title');
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');

    await trigger.click();
    const resultSelect = modal.getByLabel('Resultado da reanálise', { exact: true });
    const analysisObservation = modal.getByLabel('Observação da análise', { exact: true });
    const submit = modal.getByRole('button', { name: 'Confirmar reanálise', exact: true });
    const close = modal.getByRole('button', { name: 'Fechar reanálise', exact: true });
    const attemptSummary = modal.locator('#reanalisar-tentativa-atual');
    const driveLink = modal.getByRole('link', { name: 'Abrir arquivo no Drive', exact: true });

    await expect(modal).toHaveClass(/show/);
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(modal).not.toHaveAttribute('inert', '');
    await expect(resultSelect).toBeFocused();
    await expect(attemptSummary).toContainText(context.availabilityDate);
    await expect(attemptSummary).toContainText(context.submissionObservation);
    await expect(driveLink).toHaveAttribute('href', context.submissionLink);
    await expect(driveLink).toHaveAttribute('target', '_blank');
    await expect(driveLink).toHaveAttribute('rel', 'noopener noreferrer');

    await submit.focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(submit).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/show/);
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await submit.click();
    expect(await resultSelect.evaluate(input => input.validity.valueMissing)).toBe(true);
    await resultSelect.selectOption('incorreto');
    await submit.click();
    expect(await analysisObservation.evaluate(input => input.validity.valueMissing)).toBe(true);

    const errorGroup = modal.locator('#reanalisar-erros-group');
    const absentError = modal.getByLabel('Documento ausente', { exact: true });
    const divergentError = modal.getByLabel('Dados divergentes', { exact: true });
    const incompleteError = modal.getByLabel('Documento incompleto', { exact: true });
    await expect(errorGroup).toBeVisible();
    await expect(modal.locator('input[name="reanalisar-erros"]')).toHaveCount(10);
    await analysisObservation.fill('Validação sem erro documental selecionado.');
    await submit.click();
    await expect(modal.getByRole('alert')).toContainText(
      'Informe ao menos um erro documental.'
    );
    await absentError.check();
    await expect(divergentError).toBeDisabled();
    await absentError.uncheck();
    await expect(divergentError).toBeEnabled();
    await divergentError.check();
    await incompleteError.check();
    await analysisObservation.fill('Persistem divergências e partes ausentes no arquivo corrigido.');
    await submit.click();
    await expect(modal).not.toHaveClass(/show/);

    const result = await page.evaluate(seeded => {
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      const attempt = pendency.tentativas.at(-1);
      const event = pendency.historico.at(-1);
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      return {
        pendency,
        attempt,
        event,
        oldHistory: pendency.historico.slice(0, -1),
        analysis: verification.analise[seeded.documentoKey],
        bonification: JSON.parse(JSON.stringify(verification.bonificacao)),
        programResult: verification.resultadoBonif,
        unrelated: JSON.parse(JSON.stringify(
          verificacoes[seeded.escolaId][seeded.unrelatedCompProgKey]
        )),
        matchingLogs: logs.filter(log => log.acao === 'Reanálise registrada')
      };
    }, context);

    expect(result.pendency).toMatchObject({
      status: 'Aberta',
      responsavel: 'Escola',
      dataResolucao: null,
      errosAtuais: ['Dados divergentes', 'Documento incompleto'],
      motivo: 'Dados divergentes'
    });
    expect(result.oldHistory).toEqual(context.oldHistory);
    expect(result.oldHistory[0].erros).toEqual(['Documento ilegível', 'Competência incorreta']);
    expect(result.attempt).toMatchObject({
      status: 'analisada',
      analisadoPor: context.user.name,
      resultado: 'incorreto',
      errosEncontrados: ['Dados divergentes', 'Documento incompleto'],
      observacaoAnalise: 'Persistem divergências e partes ausentes no arquivo corrigido.'
    });
    expect(result.attempt.dataAnalise).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.event).toMatchObject({
      tipo: 'reanalise_incorreta',
      tentativaId: result.attempt.id,
      erros: ['Dados divergentes', 'Documento incompleto']
    });
    expect(result.analysis).toBe('Incorreto');
    expect(result.bonification).toEqual(context.verificationBefore.bonificacao);
    expect(result.programResult).toBe(context.verificationBefore.resultadoBonif);
    expect(result.unrelated).toEqual(context.unrelatedBefore);
    expect(result.matchingLogs).toHaveLength(context.reanalysisLogsBefore + 1);
    expect(result.matchingLogs[0].detalhes).toContain(context.escolaNome);
    expect(result.matchingLogs[0].detalhes).toContain(context.competencia);
    expect(result.matchingLogs[0].detalhes).toContain(context.programaNome);
    expect(result.matchingLogs[0].detalhes).toContain(context.documentoNome);
    expect(result.matchingLogs[0].detalhes).toContain(result.attempt.id);
    expect(result.matchingLogs[0].detalhes).toContain('incorreto');
  });

  test('reanálise correta tardia resolve na confirmação sem reescrever bonificação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await seedAwaitingReanalysis(page, {
      pendencyId: 'pend-e2e-reanalise-correta-tardia',
      availabilityDate: '2026-07-01',
      link: null
    });
    const deadline = await page.evaluate(competencia => (
      COMPETENCIAS.find(item => item.key === competencia).bonifPrazo
    ), context.competencia);
    expect(context.availabilityDate > deadline).toBe(true);

    await page.getByRole('button', { name: 'Reanalisar', exact: true }).click();
    const modal = page.locator('#modal-reanalisar-pendencia');
    await expect(modal.getByRole('link', { name: 'Abrir arquivo no Drive' })).toHaveCount(0);
    await modal.getByLabel('Resultado da reanálise', { exact: true }).selectOption('correto');
    await modal.getByLabel('Observação da análise', { exact: true })
      .fill('Documento correto confirmado pela Controladora.');

    const confirmationDateBefore = await page.evaluate(() => new Date().toISOString().slice(0, 10));
    await modal.getByRole('button', { name: 'Confirmar reanálise', exact: true }).click();
    const confirmationDateAfter = await page.evaluate(() => new Date().toISOString().slice(0, 10));
    await expect(modal).not.toHaveClass(/show/);

    const result = await page.evaluate(seeded => {
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      const attempt = pendency.tentativas.at(-1);
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      return {
        pendency,
        attempt,
        event: pendency.historico.at(-1),
        analysis: verification.analise[seeded.documentoKey],
        bonification: JSON.parse(JSON.stringify(verification.bonificacao)),
        programResult: verification.resultadoBonif
      };
    }, context);

    expect(result.pendency).toMatchObject({
      status: 'Resolvida',
      responsavel: null,
      errosAtuais: [],
      motivo: null
    });
    expect([confirmationDateBefore, confirmationDateAfter]).toContain(result.pendency.dataResolucao);
    expect(result.pendency.dataResolucao).not.toBe(context.availabilityDate);
    expect(result.attempt).toMatchObject({
      status: 'analisada',
      resultado: 'correto',
      errosEncontrados: [],
      observacaoAnalise: 'Documento correto confirmado pela Controladora.'
    });
    expect(result.event).toMatchObject({
      tipo: 'reanalise_correta',
      tentativaId: result.attempt.id,
      erros: []
    });
    expect(result.analysis).toBe('Correto (Atrasado)');
    expect(result.bonification).toEqual(context.verificationBefore.bonificacao);
    expect(result.programResult).toBe(context.verificationBefore.resultadoBonif);

    await expect(page.getByRole('button', {
      name: 'Histórico Resolvidas (1)',
      exact: true
    })).toHaveClass(/active/);
    const resolvedRow = page.locator('#p-resolvidas tr[data-pendency-ref]');
    await expect(resolvedRow).toHaveCount(1);
    await expect(resolvedRow).toContainText(context.documentoNome);
    await expect(resolvedRow).toHaveClass(/pendency-row-selected/);
    await expect(resolvedRow).toBeFocused();
  });
});

test.describe('resultados alternativos, bloqueio e rollback da reanálise', () => {
  test('arquivo indisponível reabre com erro canônico sem alterar bonificação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await seedAwaitingReanalysis(page, {
      pendencyId: 'pend-e2e-arquivo-indisponivel',
      availabilityDate: '2026-06-11'
    });

    await page.getByRole('button', { name: 'Reanalisar', exact: true }).click();
    const modal = page.locator('#modal-reanalisar-pendencia');
    await modal.getByLabel('Resultado da reanálise', { exact: true })
      .selectOption('arquivo_indisponivel');
    await expect(modal.locator('#reanalisar-erros-group')).toBeHidden();
    expect(await modal.locator('input[name="reanalisar-erros"]')
      .evaluateAll(inputs => inputs.every(input => input.disabled))).toBe(true);
    await modal.getByLabel('Observação da análise', { exact: true })
      .fill('O arquivo informado não foi localizado no Drive.');
    await modal.getByRole('button', { name: 'Confirmar reanálise', exact: true }).click();

    const result = await page.evaluate(seeded => {
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      const verification = verificacoes[seeded.escolaId][seeded.compProgKey];
      return {
        status: pendency.status,
        actor: pendency.responsavel,
        resolutionDate: pendency.dataResolucao,
        errors: pendency.errosAtuais,
        reason: pendency.motivo,
        attempt: pendency.tentativas.at(-1),
        event: pendency.historico.at(-1),
        analysis: verification.analise[seeded.documentoKey],
        bonification: JSON.parse(JSON.stringify(verification.bonificacao)),
        programResult: verification.resultadoBonif
      };
    }, context);

    expect(result).toMatchObject({
      status: 'Aberta',
      actor: 'Escola',
      resolutionDate: null,
      errors: ['Arquivo não localizado ou inacessível'],
      reason: 'Arquivo não localizado ou inacessível',
      analysis: 'Incorreto'
    });
    expect(result.attempt).toMatchObject({
      status: 'analisada',
      resultado: 'arquivo_indisponivel',
      errosEncontrados: ['Arquivo não localizado ou inacessível'],
      observacaoAnalise: 'O arquivo informado não foi localizado no Drive.'
    });
    expect(result.event).toMatchObject({
      tipo: 'arquivo_indisponivel',
      tentativaId: result.attempt.id,
      erros: ['Arquivo não localizado ou inacessível']
    });
    expect(result.bonification).toEqual(context.verificationBefore.bonificacao);
    expect(result.programResult).toBe(context.verificationBefore.resultadoBonif);
  });

  test('bloqueia somente o controle técnico do documento com pendência ativa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    const context = await page.evaluate(target => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && candidate.programasIds.includes('BASIC')
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola determinística para bloqueio não encontrada.');

      const programa = programas.find(candidate => candidate.id === target.programaId);
      const programaNome = programa ? programa.name : target.programaId;
      const compProgKey = competencia + '_' + target.programaId;
      const otherCompProgKey = competencia + '_BASIC';
      const verification = RadarFluxoOperacional.createEmptyVerification();
      verification.bonificacao.extCC = 'Sim';
      verification.bonificacao.extINV = 'Sim';
      verification.bonificacao.declBBAgil = 'Sim';
      verification.analise.extCC = 'Incorreto';
      verification.analise.extINV = 'Não analisado';
      verification.analise.declBBAgil = 'Não analisado';
      const otherVerification = RadarFluxoOperacional.createEmptyVerification();
      otherVerification.bonificacao.extCC = 'Sim';
      otherVerification.analise.extCC = 'Não analisado';
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = verification;
      verificacoes[escola.id][otherCompProgKey] = otherVerification;

      const buildContext = (documentoKey, documentoNome) => (
        RadarFluxoOperacional.buildPendencyContext({
          compProgKey,
          programaNome,
          documentoKey,
          documentoNome
        })
      );
      const openContext = buildContext('extCC', 'Extrato Conta Corrente');
      const awaitingContext = buildContext('extINV', 'Extrato Investimento');
      const openPendency = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-gate-aberta',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: 'extCC',
        item: openContext.item,
        errosAtuais: ['Documento ilegível'],
        observacao: 'Documento aberto aguardando a escola.',
        dataAbertura: '2026-06-01'
      }, {
        eventId: 'evento-e2e-gate-aberta',
        at: '2026-06-01T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      const awaitingOpened = RadarPendencias.createDocumentPendency({
        id: 'pend-e2e-gate-aguardando',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId: target.programaId,
        documentoKey: 'extINV',
        item: awaitingContext.item,
        errosAtuais: ['Documento incompleto'],
        observacao: 'Segundo documento aberto no mesmo programa.',
        dataAbertura: '2026-06-02'
      }, {
        eventId: 'evento-e2e-gate-aguardando-abertura',
        at: '2026-06-02T12:00:00.000Z',
        usuario: 'Controladora E2E',
        perfil: 'Controlador'
      });
      const awaitingPendency = RadarPendencias.registerCorrectiveSubmission(
        awaitingOpened,
        {
          id: 'tentativa-e2e-gate-aguardando',
          dataDisponibilizacao: '2026-06-10',
          observacao: 'Arquivo substituto pronto para reanálise.'
        },
        {
          eventId: 'evento-e2e-gate-aguardando-envio',
          at: '2026-06-10T12:00:00.000Z',
          usuario: 'Escola E2E',
          perfil: 'Escola'
        }
      );

      pendencias = [openPendency, awaitingPendency];
      rebuildOperationalIndexes();
      persist();
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
      return {
        escolaId: escola.id,
        competencia,
        compProgKey,
        otherCompProgKey,
        programaId: target.programaId,
        pendenciesBefore: JSON.parse(JSON.stringify(pendencias)),
        targetAnalysisBefore: verification.analise.extCC,
        siblingAnalysisBefore: verification.analise.extINV,
        unrelatedDocumentBefore: verification.analise.declBBAgil,
        otherProgramBefore: otherVerification.analise.extCC
      };
    }, DOCUMENT_CONTEXT);

    const openRow = page.locator(
      '[data-program-id="ED_FAMILIA"][data-document-key="extCC"]'
    );
    const awaitingRow = page.locator(
      '[data-program-id="ED_FAMILIA"][data-document-key="extINV"]'
    );
    const unrelatedDocumentRow = page.locator(
      '[data-program-id="ED_FAMILIA"][data-document-key="declBBAgil"]'
    );
    const otherProgramRow = page.locator(
      '[data-program-id="BASIC"][data-document-key="extCC"]'
    );

    await expect(openRow.locator('select.select-analise')).toBeDisabled();
    await expect(openRow).toContainText('Registre um novo envio para prosseguir.');
    await expect(openRow.getByRole('button', { name: 'Registrar novo envio', exact: true }))
      .toBeVisible();
    await expect(awaitingRow.locator('select.select-analise')).toBeDisabled();
    await expect(awaitingRow).toContainText('Use Reanalisar para registrar o resultado.');
    await expect(awaitingRow.getByRole('button', { name: 'Reanalisar', exact: true }))
      .toBeVisible();
    await expect(awaitingRow.getByRole('button', {
      name: 'Registrar substituição mais recente',
      exact: true
    })).toBeVisible();
    await expect(unrelatedDocumentRow.locator('select.select-analise')).toBeEnabled();
    await expect(otherProgramRow.locator('select.select-analise')).toBeEnabled();

    expect(await page.evaluate(seeded => changeAnaliseTecnica(
      seeded.escolaId,
      seeded.compProgKey,
      'extCC',
      'Correto'
    ), context)).toBe(false);
    expect(dialogs.some(message => message.includes('Registrar novo envio'))).toBe(true);
    await otherProgramRow.locator('select.select-analise').selectOption('Correto');

    const after = await page.evaluate(seeded => ({
      pendencies: JSON.parse(JSON.stringify(pendencias)),
      targetAnalysis: verificacoes[seeded.escolaId][seeded.compProgKey].analise.extCC,
      siblingAnalysis: verificacoes[seeded.escolaId][seeded.compProgKey].analise.extINV,
      unrelatedDocument: verificacoes[seeded.escolaId][seeded.compProgKey]
        .analise.declBBAgil,
      otherProgram: verificacoes[seeded.escolaId][seeded.otherCompProgKey].analise.extCC
    }), context);
    expect(after).toEqual({
      pendencies: context.pendenciesBefore,
      targetAnalysis: context.targetAnalysisBefore,
      siblingAnalysis: context.siblingAnalysisBefore,
      unrelatedDocument: context.unrelatedDocumentBefore,
      otherProgram: 'Correto'
    });
  });

  test('restaura estado integral após falha intermediária ao persistir reanálise', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const context = await seedAwaitingReanalysis(page, {
      pendencyId: 'pend-e2e-reanalise-rollback',
      availabilityDate: '2026-07-01'
    });
    context.snapshot = await page.evaluate(({ seeded, storageKeys }) => {
      const captureIndexes = () => ({
        pendencias: Array.from(_pendenciasByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ]),
        bens: Array.from(_bensByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ])
      });
      return {
        pendencias: JSON.parse(JSON.stringify(pendencias)),
        verification: JSON.parse(JSON.stringify(
          verificacoes[seeded.escolaId][seeded.compProgKey]
        )),
        logs: JSON.parse(JSON.stringify(logs)),
        indexes: captureIndexes(),
        localStorage: Object.fromEntries(
          storageKeys.map(key => [key, localStorage.getItem(key)])
        )
      };
    }, { seeded: context, storageKeys: PERSISTED_LOCAL_STORAGE_KEYS });

    await page.getByRole('button', { name: 'Reanalisar', exact: true }).click();
    const modal = page.locator('#modal-reanalisar-pendencia');
    await modal.getByLabel('Resultado da reanálise', { exact: true }).selectOption('correto');
    await modal.getByLabel('Observação da análise', { exact: true })
      .fill('Resultado que deve sofrer rollback integral.');

    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;
      window.__restoreReanalysisRollbackSetItem = () => {
        Storage.prototype.setItem = originalSetItem;
        delete window.__restoreReanalysisRollbackSetItem;
      };
      Storage.prototype.setItem = function setItemWithSingleFailure(key, value) {
        if (!failed && key === 'radar_pdde_logs') {
          failed = true;
          Storage.prototype.setItem = originalSetItem;
          throw new Error('Falha E2E intermediária ao persistir reanálise.');
        }
        return originalSetItem.call(this, key, value);
      };
    });

    try {
      await modal.getByRole('button', { name: 'Confirmar reanálise', exact: true }).click();
      await expect(modal).toHaveClass(/show/);
      await expect(modal.getByRole('alert')).toContainText(
        'Falha E2E intermediária ao persistir reanálise.'
      );
    } finally {
      await page.evaluate(() => {
        if (window.__restoreReanalysisRollbackSetItem) {
          window.__restoreReanalysisRollbackSetItem();
        }
      });
    }

    const afterFailure = await page.evaluate(({ seeded, storageKeys }) => {
      const captureIndexes = () => ({
        pendencias: Array.from(_pendenciasByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ]),
        bens: Array.from(_bensByEscolaId.entries()).map(([key, values]) => [
          key,
          values.map(item => ({ idType: typeof item.id, id: item.id, status: item.status }))
        ])
      });
      const pendency = pendencias.find(item => item.id === seeded.pendencyId);
      return {
        snapshot: {
          pendencias: JSON.parse(JSON.stringify(pendencias)),
          verification: JSON.parse(JSON.stringify(
            verificacoes[seeded.escolaId][seeded.compProgKey]
          )),
          logs: JSON.parse(JSON.stringify(logs)),
          indexes: captureIndexes(),
          localStorage: Object.fromEntries(
            storageKeys.map(key => [key, localStorage.getItem(key)])
          )
        },
        affected: {
          status: pendency.status,
          attemptStatus: pendency.tentativas.at(-1).status,
          attemptResult: pendency.tentativas.at(-1).resultado,
          historyLength: pendency.historico.length,
          resolutionDate: pendency.dataResolucao,
          analysis: verificacoes[seeded.escolaId][seeded.compProgKey]
            .analise[seeded.documentoKey],
          reanalysisLogs: logs.filter(log => log.acao === 'Reanálise registrada').length
        }
      };
    }, { seeded: context, storageKeys: PERSISTED_LOCAL_STORAGE_KEYS });

    expect(afterFailure.snapshot).toEqual(context.snapshot);
    expect(afterFailure.affected).toEqual({
      status: 'Aguardando reanálise',
      attemptStatus: 'aguardando',
      attemptResult: null,
      historyLength: 2,
      resolutionDate: null,
      analysis: 'Não analisado',
      reanalysisLogs: context.reanalysisLogsBefore
    });
  });
});
