const { test, expect } = require('@playwright/test');

async function seedConsolidatedProgram(page, profile = 'assistente') {
  return page.evaluate(({ profile }) => {
    switchProfile(profile);
    const school = escolas.find(item => item.programasIds?.includes('BASIC'));
    if (!school) throw new Error('Escola com PDDE Básico não encontrada.');

    const compKey = '2026-05_BASIC';
    verificacoes[school.id] = verificacoes[school.id] || {};
    verificacoes[school.id][compKey] = {
      bonificacao: {
        extCC: 'Sim',
        extINV: 'Não',
        notaFiscal: 'Não se aplica',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
      },
      analise: {
        extCC: 'Correto',
        extINV: 'Incorreto',
        notaFiscal: 'Correto',
        consAssessoria: 'Correto',
        declBBAgil: 'Correto',
        encampInventario: 'Correto'
      },
      resultadoBonif: 'inapta',
      retificacoes: []
    };
    pendencias = [
      RadarPendencias.createDocumentPendency({
        id: 'retification-independent-pendency',
        escolaId: school.id,
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'extINV',
        item: 'PDDE Básico - Extrato Investimento',
        errosAtuais: ['Documento incompleto'],
        observacao: 'Pendência que não pode ser alterada pela retificação.',
        dataAbertura: '2026-06-01'
      }, {
        eventId: 'retification-pendency-open',
        at: '2026-06-01T12:00:00.000Z',
        usuario: 'Controladora de teste',
        perfil: 'controlador'
      })
    ];
    activeProntuarioCompetencia = '2026-05';
    rebuildOperationalIndexes();
    persist();
    switchView('prontuario', school.id);

    return {
      schoolId: school.id,
      schoolName: school.denominação,
      compKey,
      analysisBefore: { ...verificacoes[school.id][compKey].analise },
      pendencyBefore: JSON.parse(JSON.stringify(pendencias[0]))
    };
  }, { profile });
}

test.describe('Tasks 12–13 — retificação administrativa auditável', () => {
  test('Assistente retifica consolidação com antes/depois e histórico sem alterar pendência', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedConsolidatedProgram(page, 'assistente');

    const trigger = page.getByRole('button', { name: 'Retificar consolidação' }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Retificar consolidação' });
    await expect(dialog).toContainText(seeded.schoolName);
    await expect(dialog).toContainText('Resultado atual');
    await dialog.getByLabel('Extrato Investimento').selectOption('Sim');
    await dialog.getByLabel('Justificativa da retificação').fill(
      'Correção do lançamento após conferência administrativa do documento apresentado.'
    );

    await expect(dialog.getByTestId('retification-preview')).toContainText('Extrato Investimento');
    await expect(dialog.getByTestId('retification-preview')).toContainText('Não → Sim');
    await dialog.getByRole('button', { name: 'Confirmar retificação' }).click();

    const history = page.locator('.retification-history-panel').first();
    await expect(history.getByRole('heading', { name: 'Histórico de retificações' })).toBeVisible();
    await expect(history.getByText(
      'Correção do lançamento após conferência administrativa do documento apresentado.',
      { exact: true }
    )).toBeVisible();

    const result = await page.evaluate(({ schoolId, compKey }) => {
      const verification = verificacoes[schoolId][compKey];
      const pendency = pendencias.find(item => item.id === 'retification-independent-pendency');
      return {
        bonus: verification.bonificacao.extINV,
        result: verification.resultadoBonif,
        analysis: verification.analise,
        retifications: verification.retificacoes,
        pendency
      };
    }, seeded);

    expect(result.bonus).toBe('Sim');
    expect(result.analysis).toEqual(seeded.analysisBefore);
    expect(result.pendency).toEqual(seeded.pendencyBefore);
    expect(result.retifications).toHaveLength(1);
    expect(result.retifications[0].before.bonificacao.extINV).toBe('Não');
    expect(result.retifications[0].after.bonificacao.extINV).toBe('Sim');
  });

  test('Controlador não recebe ação de retificação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    await seedConsolidatedProgram(page, 'controlador');

    await expect(page.getByRole('button', { name: 'Retificar consolidação' })).toHaveCount(0);
  });

  test('tentativa de alteração direta consolidada pela Assistente abre o fluxo auditável', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário desktop.');
    await page.goto('/');
    const seeded = await seedConsolidatedProgram(page, 'assistente');

    const row = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extINV"]');
    await row.getByRole('button', { name: 'Sim', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Retificar consolidação' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Extrato Investimento')).toHaveValue('Sim');

    const stored = await page.evaluate(({ schoolId, compKey }) => (
      verificacoes[schoolId][compKey].bonificacao.extINV
    ), seeded);
    expect(stored).toBe('Não');
  });
});
