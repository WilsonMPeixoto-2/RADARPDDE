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

  test('cartões do Dashboard têm nome acessível coerente com o texto visível e preservam filtros', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('#main-container .cycle-b-dashboard-card');
    await expect(cards).toHaveCount(5);
    await expect(page.locator('body')).toHaveClass(/radar-expressiva-institucional/);

    for (const filter of ['all', 'bonus', 'aberta', 'aguardando', 'assets']) {
      // Validar pelo elemento estável; título, quantidade e detalhe compõem
      // o nome nativo do botão, sem sobreposição por aria-label resumido.
      const target = page.locator(`#main-container .cycle-b-dashboard-card[data-cycle-b-filter="${filter}"]`);
      await expect(target).toHaveCount(1);
      const parts = await target.locator('.stat-label, .stat-value, .cycle-b-card-detail').allTextContents();
      expect(parts).toHaveLength(3);
      const visibleName = parts.map(part => part.trim()).join(' ').replace(/\s+/g, ' ').trim();
      await expect(target).toHaveAccessibleName(visibleName);
      await expect(target).not.toHaveAttribute('aria-label');
    }

    const bonus = page.locator('#main-container .cycle-b-dashboard-card[data-cycle-b-filter="bonus"]');
    await bonus.click();
    await expect(bonus).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('body')).toHaveClass(/radar-expressiva-institucional/);
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

    await page.waitForFunction(() => {
      const active = document.activeElement;
      return Boolean(
        active
        && active.isConnected
        && !active.closest('#modal-contato')
        && !active.closest('[hidden], [inert], [aria-hidden="true"]')
      );
    });

    // O fallback pode ser um landmark ou outro controle interativo válido da página.
    const focusState = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        connected: Boolean(active && active.isConnected),
        removedTriggerFocused: active?.id === 'e2e-trigger-destruido',
        insideClosedModal: Boolean(active?.closest('#modal-contato')),
        hidden: Boolean(active?.closest('[hidden], [inert], [aria-hidden="true"]')),
        tag: active?.tagName?.toLowerCase() || ''
      };
    });

    expect(focusState.connected).toBe(true);
    expect(focusState.removedTriggerFocused).toBe(false);
    expect(focusState.insideClosedModal).toBe(false);
    expect(focusState.hidden).toBe(false);
    expect(['body', 'h1', 'h2', 'div', 'main', 'button', 'a', 'input', 'select']).toContain(focusState.tag);
  });
});
