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
  test('registra múltiplos erros e preserva o registro original diante de duplicidade', async ({ page }, testInfo) => {
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

    await modal.getByLabel('Documento incompleto', { exact: true }).check();
    await modal.locator('#pend-obs').fill('Tentativa duplicada para o mesmo documento.');
    await modal.locator('button[type="submit"]').click();

    await expect(modal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toHaveText(
      'Já existe uma pendência ativa para este documento.'
    );
    await expect(page.locator('#pendency-notice')).toBeVisible();

    const selectedRow = page.locator(`[data-pendency-id="${originalId}"]`);
    await expect(selectedRow).toHaveCount(1);
    await expect(selectedRow).toHaveClass(/pendency-row-selected/);
    await expect(selectedRow).toContainText('Pendência selecionada');
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
        detailId: activePendencyDetailId,
        expectedId,
        bonificacaoDepois: verification.bonificacao[target.documentoKey],
        resultadoDepois: verification.resultadoBonif
      };
    }, { seeded: context, target: DOCUMENT_CONTEXT, originalId });

    expect(afterDuplicate).toEqual({
      count: 1,
      id: originalId,
      detailId: originalId,
      expectedId: originalId,
      bonificacaoDepois: context.bonificacaoAntes,
      resultadoDepois: context.resultadoAntes
    });
    expect(dialogs).toEqual([]);
  });
});
