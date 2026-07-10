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

test.describe('núcleo funcional do RADAR PDDE no desktop', () => {
  test('painel SME conta cada escola uma única vez nos indicadores', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const statsGrid = page.locator('#main-container .grid-stats').first();
    const cards = statsGrid.locator(':scope > .card-stat');
    const naoAnalisadasCard = cards.filter({ hasText: 'Não Analisadas' });

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
});
