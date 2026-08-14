const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

async function openProgramWithTwoServiceInvoices(page) {
  return page.evaluate(() => {
    switchProfile('controlador');

    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    const programaId = escola.programasIds[0];
    const compProgKey = `${competencia}_${programaId}`;

    verificacoes[escola.id] = verificacoes[escola.id] || {};
    verificacoes[escola.id][compProgKey] = {
      bonificacao: {
        extCC: '',
        extINV: '',
        notaFiscal: 'Sim',
        consAssessoria: 'Não',
        consEnviada: false,
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
    };

    for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
      const note = notasRegistradas[index];
      if (note.escolaId === escola.id && note.compKey === compProgKey) {
        notasRegistradas.splice(index, 1);
      }
    }

    notasRegistradas.push(
      {
        id: 'nota-ux-servico-1',
        escolaId: escola.id,
        compKey: compProgKey,
        competencia,
        programaId,
        desc: 'Manutenção elétrica',
        descricao: 'Manutenção elétrica',
        tipo: 'servico',
        numero: 'NF-UX-SERV-1',
        valor: 850,
        consultaAssessoriaEnviada: false,
        analiseConsultaAssessoria: 'Não analisado',
        dataRegistro: new Date().toISOString()
      },
      {
        id: 'nota-ux-servico-2',
        escolaId: escola.id,
        compKey: compProgKey,
        competencia,
        programaId,
        desc: 'Manutenção hidráulica',
        descricao: 'Manutenção hidráulica',
        tipo: 'servico',
        numero: 'NF-UX-SERV-2',
        valor: 650,
        consultaAssessoriaEnviada: false,
        analiseConsultaAssessoria: 'Não analisado',
        dataRegistro: new Date().toISOString()
      }
    );

    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    return { escolaId: escola.id, compProgKey };
  });
}

test.describe('Prontuário — refinamentos UX de baixo risco', () => {
  test('mantém o controle de envio à Assessoria dentro da caixa da respectiva NF', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await waitForProductExtensions(page);
    await openProgramWithTwoServiceInvoices(page);

    const noteRow = page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Notas Fiscais' }).first();
    const assessoriaRow = page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Consulta Assessoria' }).first();
    const firstInvoiceCard = noteRow.locator('[data-service-advisory-invoice]').filter({ hasText: 'NF-UX-SERV-1' });
    const secondInvoiceCard = noteRow.locator('[data-service-advisory-invoice]').filter({ hasText: 'NF-UX-SERV-2' });

    const firstSent = firstInvoiceCard.getByLabel('Consulta enviada à Assessoria para a NF NF-UX-SERV-1');
    const secondSent = secondInvoiceCard.getByLabel('Consulta enviada à Assessoria para a NF NF-UX-SERV-2');

    await expect(firstInvoiceCard).toHaveCount(1);
    await expect(secondInvoiceCard).toHaveCount(1);
    await expect(firstSent).toHaveCount(1);
    await expect(secondSent).toHaveCount(1);
    await expect(firstSent).not.toBeChecked();
    await expect(secondSent).not.toBeChecked();

    await expect(assessoriaRow.getByRole('checkbox')).toHaveCount(0);
    await expect(assessoriaRow.getByLabel('Análise da consulta à Assessoria para a NF NF-UX-SERV-1')).toHaveCount(1);
    await expect(assessoriaRow.getByLabel('Análise da consulta à Assessoria para a NF NF-UX-SERV-2')).toHaveCount(1);

    await firstSent.check();
    await secondSent.check();

    await expect(firstSent).toBeChecked();
    await expect(secondSent).toBeChecked();
    await expect(assessoriaRow.getByText('Resumo mensal: Sim')).toBeVisible();
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
