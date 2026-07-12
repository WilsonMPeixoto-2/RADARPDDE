const { test, expect } = require('@playwright/test');

test.describe('Task 9 — associação robusta na tabela de Competências', () => {
  test('identifica a escola pelo conteúdo da linha após reordenação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    const result = await page.evaluate(() => {
      switchProfile('controlador');
      switchView('competencias');

      const panel = Array.from(document.querySelectorAll('.panel-card')).find(candidate => (
        candidate.querySelector('.panel-header h2')?.textContent.includes('Lista de Entrega e Bonificação')
      ));
      const tbody = panel?.querySelector('tbody');
      if (!tbody) throw new Error('Tabela de Competências não encontrada.');

      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.reverse().forEach(row => {
        delete row.dataset.schoolId;
        tbody.appendChild(row);
      });

      RadarTask9CrossView.enhanceCompetenceTable();

      return Array.from(tbody.querySelectorAll('tr')).map(row => ({
        schoolId: row.dataset.schoolId || '',
        text: row.textContent || ''
      }));
    });

    expect(result.length).toBeGreaterThan(1);
    for (const row of result) {
      expect(row.schoolId).not.toBe('');
      const designation = await page.evaluate(schoolId => (
        escolas.find(school => school.id === schoolId)?.designação || ''
      ), row.schoolId);
      expect(designation).not.toBe('');
      expect(row.text).toContain(designation);
    }
  });
});
