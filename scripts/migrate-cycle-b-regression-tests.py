from pathlib import Path

path = Path('tests/e2e/pendency-cycle.spec.js')
text = path.read_text(encoding='utf-8')

old_queue = """    const controllerPendencyCards = page.locator(
      '#controlador-gargalos [data-pendency-ref]'
    );
    await expect(controllerPendencyCards).toHaveCount(3);
    await expect(controllerPendencyCards.filter({ hasText: context.documents[2] }))
      .toHaveAttribute('onclick', 'handleAlertClick(this)');
"""
new_queue = """    const controllerPendencyActions = page.locator(
      '#cycle-b-action-queue .cycle-b-action-item > button[data-pendency-ref]'
    );
    await expect(controllerPendencyActions).toHaveCount(3);
    const hostileDashboardAction = page.locator(
      '#cycle-b-action-queue .cycle-b-action-item'
    ).filter({ hasText: context.documents[2] }).getByRole('button', {
      name: 'Abrir pendência',
      exact: true
    });
    await expect(hostileDashboardAction).toHaveAttribute(
      'onclick',
      'openCycleBOperationalAction(this)'
    );
    expect(JSON.parse(await hostileDashboardAction.getAttribute('data-pendency-ref'))).toEqual({
      type: 'string',
      value: context.hostileId
    });
"""
if text.count(old_queue) != 1:
    raise SystemExit(f'Bloco antigo da fila encontrado {text.count(old_queue)} vezes.')
text = text.replace(old_queue, new_queue, 1)

old_click = "    await controllerPendencyCards.filter({ hasText: context.documents[2] }).click();"
if text.count(old_click) != 1:
    raise SystemExit(f'Clique antigo encontrado {text.count(old_click)} vezes.')
text = text.replace(old_click, "    await hostileDashboardAction.click();", 1)

old_dashboard = """    const activePendenciesCard = page.locator('.card-stat').filter({
      hasText: 'Pendências ativas'
    });
    await expect(activePendenciesCard).toHaveCount(1);
    await expect(activePendenciesCard.locator('.stat-value')).toHaveText('1 Escolas');

    const awaitingAlert = page.locator('#alerts-list .alert-item')
      .filter({ hasText: context.documentoNome })
      .filter({ hasText: 'Estado: Aguardando reanálise' });
    await expect(awaitingAlert).toHaveCount(1);
    await expect(awaitingAlert).toContainText('Próximo ator: Controlador');

    await activePendenciesCard.click();
    await expect(page.locator('.dashboard-list-heading'))
      .toContainText('Com pendências ativas');
    const dashboardRows = page.locator('.dash-layout tbody tr');
    await expect(dashboardRows).toHaveCount(1);
    await expect(dashboardRows.first()).toContainText(context.escolaNome);

    await page.evaluate(() => switchView('escolas'));
    const pendenciesFilter = page.locator('#filter-escola-pendencias');
    await expect(pendenciesFilter.locator('option[value="com"]'))
      .toHaveText('Com pendências ativas');
    await expect(pendenciesFilter.locator('option[value="sem"]'))
      .toHaveText('Sem pendências ativas');
    await pendenciesFilter.selectOption('com');
    await expect(page.locator('.school-filter-summary'))
      .toContainText('1 com pendências ativas');
    const schoolsResult = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: 'Resultado da carteira', exact: true })
    });
    await expect(schoolsResult.locator('tbody tr')).toHaveCount(1);
    await expect(schoolsResult.locator('tbody tr').first()).toContainText(context.escolaNome);
"""
new_dashboard = """    const awaitingCard = page.getByRole('button', { name: /Aguardando reanálise/ });
    await expect(awaitingCard).toHaveCount(1);
    await expect(awaitingCard.locator('.stat-value')).toHaveText('1 Escola');

    const awaitingAlert = page.locator('#alerts-list .alert-item')
      .filter({ hasText: context.documentoNome })
      .filter({ hasText: `Reanalisar ${context.documentoNome}` });
    await expect(awaitingAlert).toHaveCount(1);
    await expect(awaitingAlert).toHaveClass(/alert-info/);
    await expect(awaitingAlert).toContainText('Controlador');

    await awaitingCard.click();
    await expect(page.getByRole('heading', { name: 'Escolas e Carteiras' })).toBeVisible();
    const pendenciesFilter = page.locator('#filter-escola-pendencias');
    await expect(pendenciesFilter.locator('option[value="aberta"]'))
      .toHaveText('Pendência aberta');
    await expect(pendenciesFilter.locator('option[value="aguardando"]'))
      .toHaveText('Aguardando reanálise');
    await expect(pendenciesFilter.locator('option[value="com"]'))
      .toHaveText('Com pendência ativa');
    await expect(pendenciesFilter.locator('option[value="sem"]'))
      .toHaveText('Sem pendência ativa');
    await expect(pendenciesFilter).toHaveValue('aguardando');
    const schoolsResult = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: 'Resultado da carteira', exact: true })
    });
    await expect(schoolsResult.locator('tbody tr')).toHaveCount(1);
    await expect(schoolsResult.locator('tbody tr').first()).toContainText(context.escolaNome);
"""
if text.count(old_dashboard) != 1:
    raise SystemExit(f'Bloco antigo do Dashboard encontrado {text.count(old_dashboard)} vezes.')
text = text.replace(old_dashboard, new_dashboard, 1)

path.write_text(text, encoding='utf-8')
print('Migração das regressões do Ciclo B aplicada com sucesso.')
