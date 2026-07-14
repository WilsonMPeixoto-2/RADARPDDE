const { test, expect } = require('@playwright/test');

test.describe('gestão de exercícios e competências', () => {
  test('cria exercício completo, persiste calendário e alterna o recorte anual', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário administrativo exclusivo do desktop.');

    const pageErrors = [];
    const dialogs = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarExerciseManagement));
    await page.evaluate(() => {
      switchProfile('sme');
      switchView('sme-config');
    });

    await expect(page.locator('#new-exercise-competencia option')).toHaveCount(12);
    await page.locator('#new-exercise-input').fill('2027');
    await page.locator('#new-exercise-competencia').selectOption('04');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();

    await expect(page.locator('#exercise-select')).toHaveValue('2027');
    await expect(page.locator('#exercise-select option')).toHaveCount(2);

    const createdState = await page.evaluate(() => {
      const storedConfig = JSON.parse(localStorage.getItem('radar_pdde_config'));
      return {
        exercises: [...config.exercicios],
        currentExercise,
        activeCompetence: activeCompetenciaKey,
        competenceKeys: COMPETENCIAS
          .filter(item => item.key.startsWith('2027-'))
          .map(item => item.key),
        storedConfig
      };
    });

    expect(createdState.exercises).toEqual(['2026', '2027']);
    expect(createdState.currentExercise).toBe('2027');
    expect(createdState.activeCompetence).toBe('2027-04');
    expect(createdState.competenceKeys).toHaveLength(12);
    expect(createdState.competenceKeys[0]).toBe('2027-01');
    expect(createdState.competenceKeys[11]).toBe('2027-12');
    expect(createdState.storedConfig.competenciaFechamento).toBe('2027-04');
    expect(createdState.storedConfig.competencias).toHaveLength(24);
    expect(dialogs).toContain('Exercício 2027 criado com sucesso.');

    await page.locator('#exercise-select').selectOption('2026');
    expect(await page.evaluate(() => ({ currentExercise, activeCompetenciaKey }))).toEqual({
      currentExercise: '2026',
      activeCompetenciaKey: '2026-01'
    });

    await page.locator('#exercise-select').selectOption('2027');
    expect(await page.evaluate(() => ({ currentExercise, activeCompetenciaKey }))).toEqual({
      currentExercise: '2027',
      activeCompetenciaKey: '2027-04'
    });

    await page.reload();
    await page.waitForFunction(() => Boolean(window.RadarExerciseManagement));
    await expect(page.locator('#exercise-select option')).toHaveCount(2);
    expect(await page.evaluate(() => ({
      exercises: [...config.exercicios],
      competenceCount: COMPETENCIAS.filter(item => item.key.startsWith('2027-')).length,
      storedClosing: config.competenciaFechamento
    }))).toEqual({
      exercises: ['2026', '2027'],
      competenceCount: 12,
      storedClosing: '2027-04'
    });

    expect(pageErrors).toEqual([]);
  });

  test('recusa exercício duplicado sem alterar o estado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário administrativo exclusivo do desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarExerciseManagement));
    await page.evaluate(() => {
      switchProfile('sme');
      switchView('sme-config');
    });

    await page.locator('#new-exercise-input').fill('2026');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();

    expect(dialogs).toContain('O exercício 2026 já está cadastrado.');
    expect(await page.evaluate(() => ({
      exercises: [...config.exercicios],
      count: COMPETENCIAS.filter(item => item.key.startsWith('2026-')).length
    }))).toEqual({ exercises: ['2026'], count: 12 });
  });
});
