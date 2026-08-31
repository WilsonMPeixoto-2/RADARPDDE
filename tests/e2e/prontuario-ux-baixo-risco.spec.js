const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

async function openOperationalProgram(page, options = {}) {
  await selectFixtureCompetence(page);
  return page.evaluate(({ initialized }) => {
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

    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    return { escolaId: escola.id, compProgKey };
  }, options);
}

function fiscalNoteRow(page) {
  return page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Notas Fiscais' }).first();
}

async function addServiceInvoice(page, { description, number, amount }) {
  await fiscalNoteRow(page).getByRole('button', { name: 'Adicionar Nota' }).click();
  await page.locator('#nota-desc').fill(description);
  await page.locator('#nota-tipo').selectOption('servico');
  await page.locator('#nota-numero').fill(number);
  await page.locator('#nota-valor').fill(String(amount));
  await page.locator('#form-dados-nota button[type="submit"]').click();
  await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
}

test.describe('Prontuário — refinamentos UX de baixo risco', () => {
  test('individualiza envio, análise e Pendência da Assessoria por Nota Fiscal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await waitForProductExtensions(page);
    await openOperationalProgram(page, { initialized: true });

    await addServiceInvoice(page, {
      description: 'Manutenção elétrica',
      number: 'NF-UX-SERV-1',
      amount: 850
    });
    await addServiceInvoice(page, {
      description: 'Manutenção hidráulica',
      number: 'NF-UX-SERV-2',
      amount: 650
    });
    await addServiceInvoice(page, {
      description: 'Limpeza de caixa d’água',
      number: 'NF-UX-SERV-3',
      amount: 555
    });

    const assessoriaRow = page.locator('#prontuario-verif-rows tr')
      .filter({ hasText: 'Consulta Assessoria' })
      .first();
    const firstInvoiceCard = assessoriaRow.locator('[data-service-advisory-invoice]')
      .filter({ hasText: 'NF-UX-SERV-1' });
    const secondInvoiceCard = assessoriaRow.locator('[data-service-advisory-invoice]')
      .filter({ hasText: 'NF-UX-SERV-2' });
    const thirdInvoiceCard = assessoriaRow.locator('[data-service-advisory-invoice]')
      .filter({ hasText: 'NF-UX-SERV-3' });

    const firstSent = firstInvoiceCard
      .getByLabel('Consulta enviada à Assessoria para a NF NF-UX-SERV-1');
    const secondSent = secondInvoiceCard
      .getByLabel('Consulta enviada à Assessoria para a NF NF-UX-SERV-2');
    const thirdSent = thirdInvoiceCard
      .getByLabel('Consulta enviada à Assessoria para a NF NF-UX-SERV-3');
    const firstAnalysis = firstInvoiceCard
      .getByLabel('Análise da consulta à Assessoria para a NF NF-UX-SERV-1');
    const secondAnalysis = secondInvoiceCard
      .getByLabel('Análise da consulta à Assessoria para a NF NF-UX-SERV-2');
    const thirdAnalysis = thirdInvoiceCard
      .getByLabel('Análise da consulta à Assessoria para a NF NF-UX-SERV-3');

    await expect(firstInvoiceCard).toHaveCount(1);
    await expect(secondInvoiceCard).toHaveCount(1);
    await expect(thirdInvoiceCard).toHaveCount(1);
    await expect(firstSent).not.toBeChecked();
    await expect(secondSent).not.toBeChecked();
    await expect(thirdSent).not.toBeChecked();
    await expect(firstAnalysis).toHaveValue('Não analisado');
    await expect(secondAnalysis).toHaveValue('Não analisado');
    await expect(thirdAnalysis).toHaveValue('Não analisado');
    await expect(assessoriaRow.getByText('Não', { exact: true })).toBeVisible();

    const everySentControlIsInsideItsInvoiceCard = await assessoriaRow.locator(
      'input[type="checkbox"][aria-label^="Consulta enviada à Assessoria para a NF "]'
    ).evaluateAll(checkboxes => checkboxes.every(checkbox => (
      Boolean(checkbox.closest('[data-service-advisory-invoice]'))
    )));
    expect(everySentControlIsInsideItsInvoiceCard).toBe(true);

    await firstSent.check();
    await firstAnalysis.selectOption('Correto');

    await expect(firstSent).toBeChecked();
    await expect(secondSent).not.toBeChecked();
    await expect(thirdSent).not.toBeChecked();
    await expect(firstAnalysis).toHaveValue('Correto');
    await expect(secondAnalysis).toHaveValue('Não analisado');
    await expect(thirdAnalysis).toHaveValue('Não analisado');
    await expect(assessoriaRow.getByText('Sim', { exact: true })).toBeVisible();

    const pendencyModal = page.locator('#modal-nova-pendencia');
    const drawer = page.locator('#pendency-preview-drawer');

    await secondAnalysis.selectOption('Incorreto');
    await expect(pendencyModal).toHaveClass(/show/);
    await pendencyModal.getByLabel('Documento ilegível', { exact: true }).check();
    await pendencyModal.locator('#pend-obs')
      .fill('Problema individual na Consulta Assessoria da segunda Nota Fiscal.');
    await page.locator('#form-nova-pendencia button[type="submit"]').click();
    await expect(pendencyModal).not.toHaveClass(/show/);
    if (await drawer.isVisible()) {
      await drawer.locator('.pendency-preview-close').click();
    }

    await expect(secondInvoiceCard.getByText('Incorreto', { exact: true })).toBeVisible();
    await expect(secondInvoiceCard.getByRole('button', { name: 'Visualizar pendência' })).toBeVisible();

    await thirdAnalysis.selectOption('Incorreto');
    await expect(pendencyModal).toHaveClass(/show/);
    await pendencyModal.getByLabel('Documento ilegível', { exact: true }).check();
    await pendencyModal.locator('#pend-obs')
      .fill('Problema individual na Consulta Assessoria da terceira Nota Fiscal.');
    await page.locator('#form-nova-pendencia button[type="submit"]').click();
    await expect(pendencyModal).not.toHaveClass(/show/);
    if (await drawer.isVisible()) {
      await drawer.locator('.pendency-preview-close').click();
    }

    await expect(thirdInvoiceCard.getByText('Incorreto', { exact: true })).toBeVisible();
    await expect(thirdInvoiceCard.getByRole('button', { name: 'Visualizar pendência' })).toBeVisible();
    await expect(firstInvoiceCard.getByRole('button', { name: 'Visualizar pendência' })).toHaveCount(0);
    await expect(assessoriaRow.getByText('2 pendências', { exact: true })).toBeVisible();
    await expect(assessoriaRow.getByRole('button', { name: 'Abrir Pendência' })).toHaveCount(0);
    await expect(assessoriaRow.getByRole('button', { name: 'Registrar novo envio' })).toHaveCount(0);
    await expect(assessoriaRow.getByText('Sim', { exact: true })).toBeVisible();
  });

  test('separa visualmente os programas sem duplicar a estrutura da avaliação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await waitForProductExtensions(page);
    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length >= 2
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));

      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
      return {
        programCount: escola.programasIds.length,
        programNames: escola.programasIds.map(programId => (
          programas.find(program => program.id === programId)?.name || programId
        ))
      };
    });

    const starts = page.locator('#prontuario-verif-rows tr.program-block-start');
    await expect(starts).toHaveCount(context.programCount);

    for (let index = 0; index < context.programCount; index += 1) {
      const start = starts.nth(index);
      await expect(start.locator('.program-context-cell')).toHaveCount(1);
      await expect(start.locator('.program-context-competence')).not.toHaveText('');
      await expect(start.locator('.program-context-name')).toHaveText(context.programNames[index]);
    }

    const firstBorderWidth = await starts.first().locator('td').first().evaluate(element => (
      getComputedStyle(element).borderTopWidth
    ));
    expect(firstBorderWidth).toBe('2px');
  });
});
