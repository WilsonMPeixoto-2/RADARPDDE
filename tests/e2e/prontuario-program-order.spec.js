const { test, expect } = require('@playwright/test');

const schoolOrder = [
  'BASIC', 'CONECTADA', 'ADOLESCENCIAS', 'PROEC',
  'ED_FAMILIA', 'LEITURA', 'TEMPO_APRENDER', 'RECURSOS'
];

async function openSchoolWithPrograms(page) {
  await page.goto('/');
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && typeof window.RadarProntuarioOperationalUx?.enhance === 'function'
    && typeof switchView === 'function'
  ));
  const schoolId = await page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => Array.isArray(item.programasIds) && item.programasIds.length);
    if (!school) throw new Error('Fixture precisa de escola com programas.');
    // Apenas a projeção em memória do navegador de teste. Nenhuma gravação.
    school.programasIds = [
      'RECURSOS', 'ADOLESCENCIAS', 'PROEC', 'CONECTADA',
      'BASIC', 'ED_FAMILIA', 'LEITURA', 'TEMPO_APRENDER'
    ];
    school.competenciaInicial = '2026-01';
    const competence = window.RadarCompetenceContext.getState().activeKey;
    activeProntuarioCompetencia = competence;
    switchView('prontuario', school.id);
    return school.id;
  });
  await expect(page.locator('#prontuario-verif-rows tr[data-program-id]')).not.toHaveCount(0);
  return schoolId;
}

async function orderOf(page) {
  return page.locator('#prontuario-verif-rows tr[data-document-key="extCC"]')
    .evaluateAll(rows => rows.map(row => row.dataset.programId));
}

test.describe('ordem visual da avaliação no Prontuário', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Alteração delimitada ao desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('reordena as mesmas linhas de Bonificação e Análise Técnica e mantém o resultado após mudar competência', async ({ page }) => {
    await openSchoolWithPrograms(page);
    await expect.poll(() => orderOf(page)).toEqual(schoolOrder);

    const controls = await page.evaluate(() => (
      Array.from(document.querySelectorAll('#prontuario-verif-rows tr[data-document-key="extCC"]'))
        .map(row => ({
          id: row.dataset.programId,
          rowCount: document.querySelectorAll(
            '#prontuario-verif-rows tr[data-program-id="' + row.dataset.programId + '"]'
          ).length,
          hasBonification: Boolean(row.querySelector('[onclick*="toggleBonif"], .btn-toggle, [data-bonification-value]')),
          hasTechnical: Boolean(row.querySelector('select.select-analise, [data-status-dimension="analise"]'))
        }))
    ));
    expect(controls).toHaveLength(8);
    expect(controls.every(item => item.rowCount >= 2)).toBe(true);

    const anotherMonth = page.locator('.comp-sub-tab:not(.disabled):not(.active)').first();
    await expect(anotherMonth).toBeEnabled();
    const key = await anotherMonth.getAttribute('data-competence');
    await anotherMonth.click();
    await expect(page.locator('.comp-sub-tab[data-competence="' + key + '"]'))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => orderOf(page)).toEqual(schoolOrder);
  });

  test('enhance repetido não move blocos já ordenados', async ({ page }) => {
    await openSchoolWithPrograms(page);
    await expect.poll(() => orderOf(page)).toEqual(schoolOrder);
    const changes = await page.evaluate(() => {
      const body = document.getElementById('prontuario-verif-rows');
      const observer = new MutationObserver(() => {});
      observer.observe(body, { childList: true });
      window.RadarProntuarioOperationalUx.enhance(new Date(), activeSchoolId);
      window.RadarProntuarioOperationalUx.enhance(new Date(), activeSchoolId);
      const moved = observer.takeRecords().filter(record => record.target === body).length;
      observer.disconnect();
      return moved;
    });
    expect(changes).toBe(0);
  });
});
