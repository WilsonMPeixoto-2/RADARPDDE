const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function seedIncorrectEvaluationWithPendency(page) {
  await selectFixtureCompetence(page);
  return page.evaluate(() => {
    switchProfile('controlador');
    const competence = '2026-05';
    const school = escolas.find(item => item.programasIds?.includes('BASIC'));
    if (!school) throw new Error('Escola com PDDE Básico não encontrada.');
    const compKey = `${competence}_BASIC`;

    verificacoes[school.id] = verificacoes[school.id] || {};
    verificacoes[school.id][compKey] = {
      bonificacao: {
        extCC: 'Sim',
        extINV: '',
        notaFiscal: '',
        consAssessoria: '',
        consEnviada: false,
        declBBAgil: '',
        encampInventario: ''
      },
      analise: {
        extCC: 'Incorreto',
        extINV: 'Não analisado',
        notaFiscal: 'Não analisado',
        consAssessoria: 'Não analisado',
        declBBAgil: 'Não analisado',
        encampInventario: 'Não analisado'
      },
      resultadoBonif: ''
    };

    pendencias = pendencias.filter(item => item.id !== 'pendency-evaluation-retification-e2e');
    pendencias.push(RadarPendencias.createDocumentPendency({
      id: 'pendency-evaluation-retification-e2e',
      escolaId: school.id,
      competenciaOrigem: competence,
      programaId: 'BASIC',
      documentoKey: 'extCC',
      item: 'Extrato Conta Corrente',
      errosAtuais: ['Documento marcado incorretamente'],
      observacao: 'Pendência criada a partir de avaliação lançada por engano.',
      dataAbertura: '2026-09-09'
    }, {
      eventId: 'event-evaluation-retification-open',
      at: '2026-09-09T12:00:00.000Z',
      usuario: 'Controlador E2E',
      perfil: 'controlador'
    }));

    activeProntuarioCompetencia = competence;
    rebuildOperationalIndexes();
    persist();
    switchView('prontuario', school.id);

    return { schoolId: school.id, compKey, competence };
  });
}

test.describe('retificação formal de avaliação com Pendência ativa', () => {
  test('Controlador confirma, justifica e a Pendência fica identificada como anulada por edição da avaliação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop de homologação em Preview.');

    await page.goto('/');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    const context = await seedIncorrectEvaluationWithPendency(page);

    const row = page.locator(
      '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
    );
    await expect(row.locator('select.select-analise')).toHaveValue('Incorreto');
    await expect(row.getByRole('button', { name: 'Editar análise' })).toBeVisible();

    await row.getByRole('button', { name: 'Editar análise' }).click();

    const dialog = page.getByRole('dialog', { name: 'Editar análise técnica' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('evaluation-current-value')).toHaveText('Incorreto');
    await dialog.getByLabel('Nova análise técnica').selectOption('Correto');

    const confirmation = dialog.getByTestId('evaluation-retification-confirmation');
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText('A Pendência vinculada será anulada por esta retificação');

    const confirmCheck = dialog.getByLabel(/Confirmo que estou corrigindo um lançamento de avaliação/i);
    const justification = dialog.getByLabel('Justificativa da retificação');
    const submit = dialog.getByRole('button', { name: 'Confirmar retificação e anular Pendência' });

    await expect(confirmCheck).not.toBeChecked();
    await expect(submit).toBeDisabled();
    await confirmCheck.check();
    await expect(submit).toBeDisabled();
    await justification.fill('A avaliação foi marcada como Incorreto por engano após nova conferência do documento já correto.');
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(dialog).toBeHidden();
    await expect(page.locator('#pendency-notice')).toContainText(
      'Avaliação retificada e Pendência anulada com sucesso.'
    );
    await expect(row.locator('select.select-analise')).toHaveValue('Correto');

    const state = await page.evaluate(({ schoolId, compKey }) => {
      const verification = verificacoes[schoolId][compKey];
      const pendency = pendencias.find(item => item.id === 'pendency-evaluation-retification-e2e');
      return {
        analysis: verification.analise.extCC,
        status: pendency?.status,
        cancellation: pendency?.cancelamento,
        lastHistory: pendency?.historico?.at(-1),
        attempts: pendency?.tentativas || []
      };
    }, context);

    expect(state.analysis).toBe('Correto');
    expect(state.status).toBe('Cancelada');
    expect(state.cancellation).toMatchObject({
      tipo: 'retificacao_avaliacao',
      origem: 'avaliacao_tecnica',
      avaliacaoAnterior: 'Incorreto',
      avaliacaoNova: 'Correto',
      confirmacaoExpressa: true,
      justificativa: 'A avaliação foi marcada como Incorreto por engano após nova conferência do documento já correto.'
    });
    expect(state.lastHistory.tipo).toBe('retificacao_avaliacao');
    expect(state.attempts).toHaveLength(0);

    await page.evaluate(() => switchView('pendencias'));
    await page.getByRole('tab', { name: /Canceladas/ }).click();

    const cancelledRow = page.locator(
      '[data-pendency-id="pendency-evaluation-retification-e2e"]'
    ).first();
    await expect(cancelledRow).toBeVisible();
    await expect(cancelledRow).toHaveClass(/is-evaluation-retification/);
    await expect(cancelledRow.getByText('Anulada por edição da avaliação', { exact: true })).toBeVisible();

    await cancelledRow.getByRole('button', { name: 'Ver detalhes' }).click();
    const drawer = page.locator('#pendency-detail-drawer');
    await expect(drawer).toContainText('Retificação da avaliação técnica');
    await expect(drawer).toContainText('Incorreto → Correto');
    await expect(drawer).toContainText('A avaliação foi marcada como Incorreto por engano após nova conferência do documento já correto.');
  });
});
