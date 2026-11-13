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

test.describe('Pendências: nome acessível e operação por teclado', () => {
  test('Mais filtros usa seu rótulo visível e mantém a expansão nativa', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await page.evaluate(async () => {
      if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
      switchProfile('controlador');
      switchView('pendencias');
    });

    const summary = page.locator('#main-container .pendency-more-filters > summary');
    const details = page.locator('#main-container .pendency-more-filters');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText('Mais filtros');

    // RED anterior: aria-label antigo sobrepunha "Mais filtros".
    await expect(summary).toHaveAccessibleName('Mais filtros');
    const results = await new AxeBuilder({ page })
      .include('#main-container .pendency-more-filters')
      .withRules(['label-content-name-mismatch'])
      .analyze();
    expect(results.violations).toEqual([]);

    await summary.focus();
    await expect(summary).toBeFocused();
    await summary.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
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


test.describe('F06 — Pendências, reflow e teclado em largura desktop equivalente a zoom 200%', () => {
  test('filtros avançados permanecem operáveis sem corte horizontal nem perda de foco', async ({ page }, testInfo) => {
    // Largura CSS equivalente a um desktop de 1366 px a 200% de zoom.
    // Não é a mesma coisa que acionar o zoom nativo do Chromium: este ensaio
    // é uma contraprova dirigida de reflow, foco e controles visíveis.
    await page.setViewportSize({ width: 683, height: 768 });
    await page.goto('/');
    await page.waitForFunction(() => window.RadarDataContext?.ready === true);
    await page.evaluate(async () => {
      if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
      switchProfile('controlador');
      switchView('pendencias');
    });

    const filters = page.locator('#main-container .pendency-more-filters');
    const summary = filters.locator('summary');
    const program = page.locator('#main-container #pendency-filter-program');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAccessibleName('Mais filtros');

    await summary.focus();
    await expect(summary).toBeFocused();
    await summary.press('Enter');
    await expect(filters).toHaveAttribute('open', '');
    await expect(program).toBeVisible();
    await expect(program).toHaveAccessibleName('Programa');

    // Percurso real de teclado; evita limitar a prova a um atributo ARIA.
    await page.keyboard.press('Tab');
    await expect(program).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(summary).toBeFocused();

    const reflow = await page.evaluate(() => {
      const visibleControls = Array.from(document.querySelectorAll(
        '#main-container .pendency-more-filters-grid select'
      )).filter(control => control.getClientRects().length > 0)
        .map(control => {
          const rect = control.getBoundingClientRect();
          return {
            id: control.id,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            accessibleLabel: document.querySelector('label[for="' + control.id + '"]')
              ?.textContent?.trim() || ''
          };
        });
      return {
        viewportWidth: window.innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        activeElement: document.activeElement?.tagName?.toLowerCase(),
        focusedText: document.activeElement?.textContent?.trim(),
        expanded: document.querySelector('#main-container .pendency-more-filters')?.open === true,
        controls: visibleControls
      };
    });

    const axe = await new AxeBuilder({ page })
      .include('#main-container .pendency-filter-panel')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();
    const serious = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact));

    // Artefatos antes da expectativa permitem diagnosticar eventual falha
    // sem corrigir uma asserção às cegas e sem inventar conformidade total.
    await testInfo.attach('f06-pendencias-reflow-teclado.json', {
      body: Buffer.from(JSON.stringify({
        reflow,
        axe: {
          passes: axe.passes.length,
          incomplete: axe.incomplete.map(x => ({ id: x.id, impact: x.impact })),
          violations: axe.violations.map(x => ({
            id: x.id, impact: x.impact,
            nodes: x.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary }))
          }))
        }
      }, null, 2), 'utf8'),
      contentType: 'application/json'
    });
    await testInfo.attach('f06-pendencias-reflow-683px.png', {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png'
    });

    expect(reflow.controls).toHaveLength(6);
    expect(reflow.overflowPx, 'Reflow: a página não deve exigir rolagem horizontal').toBeLessThanOrEqual(2);
    for (const control of reflow.controls) {
      expect(control.left, control.id + ': controle cortado à esquerda').toBeGreaterThanOrEqual(-1);
      expect(control.right, control.id + ': controle cortado à direita')
        .toBeLessThanOrEqual(reflow.viewportWidth + 1);
    }
    expect(serious, 'Axe sério/crítico no painel de filtros em reflow').toEqual([]);

    await summary.press('Space');
    await expect(filters).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
  });
});
