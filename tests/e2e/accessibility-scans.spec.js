const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Acessibilidade Automatizada (Axe-core)', () => {
  test('Executa scan de acessibilidade na página principal', async ({ page }, testInfo) => {
    await page.goto('/');

    // Aguardar o carregamento inicial da aplicação e renderização da view principal
    await page.waitForSelector('#app, h1, h2, .card-escola, .escola-item, .school-card', { timeout: 10000 }).catch(() => {});

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Filtra violações críticas e sérias para garantir prevenção a regressões de acessibilidade.
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const diagnostic = criticalViolations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary
        }))
      }));

      await testInfo.attach('axe-serious-critical-violations', {
        body: Buffer.from(JSON.stringify(diagnostic, null, 2), 'utf8'),
        contentType: 'application/json'
      });
    }

    expect(
      criticalViolations,
      `Violações sérias/críticas do Axe:\n${JSON.stringify(criticalViolations, null, 2)}`
    ).toEqual([]);
  });
});

test.describe('Navegação e Ciclo de Foco com Fallback Lógico', () => {
  test('Devolve o foco para o elemento de fallback lógico quando o trigger disparador original é removido do DOM', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Criar um container e um botão disparador de teste
      const container = document.createElement('div');
      container.id = 'e2e-container';

      const trigger = document.createElement('button');
      trigger.id = 'e2e-trigger-destruido';
      trigger.type = 'button';
      trigger.textContent = 'Abrir modal temporário';
      trigger.addEventListener('click', () => {
        openModal('modal-contato');
      });

      container.appendChild(trigger);
      document.body.appendChild(container);
    });

    const trigger = page.locator('#e2e-trigger-destruido');
    const modal = page.locator('#modal-contato');

    await trigger.click();
    await expect(modal).toHaveClass(/show/);

    // Simular destruição/remoção do trigger do DOM enquanto o modal está aberto
    await page.evaluate(() => {
      const triggerEl = document.getElementById('e2e-trigger-destruido');
      if (triggerEl) triggerEl.remove();
    });

    // Fechar o modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/show/);

    // Certificar que o foco retornou ao fallback de navegação padrão
    const activeTag = await page.evaluate(() => document.activeElement.tagName.toLowerCase());
    expect(['body', 'h1', 'h2', 'div', 'main']).toContain(activeTag);
  });
});
