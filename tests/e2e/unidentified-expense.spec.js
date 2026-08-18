const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

function fiscalNoteRow(page) {
  return page.locator('#prontuario-verif-rows tr').filter({ hasText: 'Notas Fiscais' }).first();
}

test.describe('Prontuário — despesa a identificar', () => {
  test('registra saída sem NF por fluxo próprio e permite identificação posterior', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      const programaId = escola.programasIds[0];
      const compKey = `${competencia}_${programaId}`;

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compKey] = {
        bonificacao: {
          extCC: '',
          extINV: '',
          notaFiscal: 'Não',
          consAssessoria: 'Não se aplica',
          declBBAgil: '',
          encampInventario: 'Não se aplica'
        },
        analise: {
          extCC: 'Não analisado',
          extINV: 'Não analisado',
          notaFiscal: 'Não analisado',
          consAssessoria: 'Correto',
          declBBAgil: 'Não analisado',
          encampInventario: 'Correto'
        },
        resultadoBonif: ''
      };

      for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
        if (notasRegistradas[index].escolaId === escola.id && notasRegistradas[index].compKey === compKey) {
          notasRegistradas.splice(index, 1);
        }
      }

      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
      return { escolaId: escola.id, compKey };
    });

    const row = fiscalNoteRow(page);
    await expect(row.getByRole('button', { name: 'Adicionar Nota' })).toHaveCount(0);

    const provisionalButton = row.getByRole('button', { name: 'Registrar despesa a identificar' });
    await expect(provisionalButton).toBeVisible();
    await expect(provisionalButton).toBeEnabled();
    await provisionalButton.click();

    await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
    await expect(page.locator('#nota-tipo option').first()).toHaveAttribute('value', 'consumo');
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(page.locator('#nota-numero')).not.toHaveAttribute('required');
    await expect(page.getByText('Número da Nota Fiscal (opcional neste estágio)')).toBeVisible();
    await expect(page.locator('#modal-dados-nota h3')).toHaveText('Registrar despesa a identificar');
    await expect(page.locator('#nota-desc')).toHaveAttribute('placeholder', /Saída de R\$ 850,00/);

    await page.locator('#nota-desc').fill('Saída de R$ 850,00 observada no extrato; documentação pendente');
    await page.locator('#nota-valor').fill('850');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    const refreshedRow = fiscalNoteRow(page);
    await expect(refreshedRow.getByText(/Despesa a identificar/)).toBeVisible();

    const stateAfterCreate = await page.evaluate(({ escolaId, compKey }) => {
      const invoice = notasRegistradas.find(note => note.escolaId === escolaId && note.compKey === compKey);
      const verification = verificacoes[escolaId][compKey];
      return {
        id: invoice?.id,
        tipo: invoice?.tipo,
        numero: invoice?.numero,
        bemId: invoice?.bemId,
        consAssessoria: verification?.bonificacao?.consAssessoria
      };
    }, context);
    expect(stateAfterCreate.tipo).toBe('a_identificar');
    expect(stateAfterCreate.numero || '').toBe('');
    expect(stateAfterCreate.bemId).toBeNull();
    expect(stateAfterCreate.consAssessoria).toBe('Não se aplica');

    await refreshedRow.getByTitle('Editar despesa').click();
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await page.locator('#nota-tipo').selectOption('consumo');
    await expect(page.locator('#nota-numero')).toHaveAttribute('required');
    await expect(page.locator('#nota-numero')).toHaveAttribute('placeholder', 'Ex: NF-12345');
    await expect(page.locator('#nota-desc')).toHaveAttribute('placeholder', 'Ex: Ar Condicionado Split, Pintura de Sala, Papelaria...');
    await expect(page.locator('#modal-dados-nota h3')).toHaveText('Editar Dados da Nota Fiscal');
    await page.locator('#nota-numero').fill('NF-IDENT-850');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    const stateAfterIdentification = await page.evaluate(({ escolaId, compKey }) => {
      const invoice = notasRegistradas.find(note => note.escolaId === escolaId && note.compKey === compKey);
      return { tipo: invoice?.tipo, numero: invoice?.numero };
    }, context);
    expect(stateAfterIdentification).toEqual({ tipo: 'consumo', numero: 'NF-IDENT-850' });
    await expect(fiscalNoteRow(page).getByText(/NF: NF-IDENT-850/)).toBeVisible();
  });
});
