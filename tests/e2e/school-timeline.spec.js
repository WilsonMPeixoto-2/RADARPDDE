const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function openTimeline(page, profile = 'controlador') {
  const competence = '2026-08';
  await selectFixtureCompetence(page, competence);
  await page.evaluate(({ nextProfile, competenceKey }) => {
    switchProfile(nextProfile);
    activeProntuarioCompetencia = competenceKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competenceKey)
    ));
    const compKey = `${competenceKey}_BASIC`;
    const pendencyId = 'TIMELINE-E2E-PENDENCY';

    verificacoes[school.id] = verificacoes[school.id] || {};
    verificacoes[school.id][compKey] = {
      bonificacao: {
        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Sim',
        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: 'Sim'
      },
      analise: {
        extCC: 'Correto', extINV: 'Correto', notaFiscal: 'Correto',
        consAssessoria: 'Correto', declBBAgil: 'Correto', encampInventario: 'Correto'
      },
      resultadoBonif: 'apta',
      consolidatedAt: '2026-08-31T17:00:00.000Z',
      updatedByName: 'Controlador E2E'
    };

    pendencias = pendencias.filter(item => item.id !== pendencyId);
    pendencias.push({
      id: pendencyId,
      escolaId: school.id,
      competenciaOrigem: competenceKey,
      programaId: 'BASIC',
      documentoKey: 'extCC',
      item: 'Extrato Conta Corrente',
      status: 'Resolvida',
      dataAbertura: '2026-08-10T10:00:00.000Z',
      dataResolucao: '2026-08-20T15:00:00.000Z',
      justificativaResolucao: 'Documento correto.',
      historico: [{
        id: 'TIMELINE-HISTORY-OPEN',
        tipo: 'abertura',
        dataHora: '2026-08-10T10:00:00.000Z',
        detalhe: 'Pendência aberta.',
        usuario: 'Controlador E2E'
      }],
      tentativas: [{
        id: 'TIMELINE-ATTEMPT',
        status: 'analisada',
        resultado: 'correto',
        dataRegistro: '2026-08-19T11:00:00.000Z',
        dataAnalise: '2026-08-20T14:30:00.000Z',
        observacao: 'Novo documento enviado pela escola.',
        registradoPor: 'Direção E2E',
        observacaoAnalise: 'Assinatura validada na reanálise.',
        analisadoPorNome: 'Controlador Reanálise'
      }]
    });

    contatos = contatos.filter(item => item.id !== 'TIMELINE-CONTACT');
    contatos.push({
      id: 'TIMELINE-CONTACT',
      escolaId: school.id,
      pendenciaId: pendencyId,
      tipo: 'Telefone',
      dataHora: '2026-08-15T12:00:00.000Z',
      descricao: 'Orientação prestada à direção.',
      responsavel: 'Controlador E2E'
    });

    notasRegistradas = notasRegistradas.filter(item => item.id !== 'TIMELINE-INVOICE');
    notasRegistradas.push({
      id: 'TIMELINE-INVOICE',
      escolaId: school.id,
      compKey,
      numero: 'NF-100',
      desc: 'Material pedagógico permanente',
      tipo: 'Capital',
      valor: 1250,
      dataRegistro: '2026-08-12T09:00:00.000Z'
    });

    bens = bens.filter(item => item.id !== 'TIMELINE-ASSET');
    bens.push({
      id: 'TIMELINE-ASSET',
      escolaId: school.id,
      competencia: competenceKey,
      item: 'Projetor',
      valor: 1250,
      notaFiscal: 'NF-100',
      status: 'Inventariada',
      dataRegistro: '2026-08-13T09:00:00.000Z',
      dataInventariacao: '2026-08-25T16:00:00.000Z',
      responsavelInventario: 'Inventariador E2E',
      inventariadoPor: 'Inventariador E2E',
      inventariadoEm: '25/08/2026'
    });

    logs = logs.filter(item => !['TIMELINE-LOG', 'TIMELINE-TECHNICAL'].includes(item.id));
    logs.push({
      id: 'TIMELINE-LOG',
      escolaId: school.id,
      acao: 'Bonificação Consolidada',
      detalhes: `Consolidação registrada em ${competenceKey}.`,
      dataHora: '2026-08-31T17:00:00.000Z',
      usuario: 'Controlador E2E'
    });
    logs.push({
      id: 'TIMELINE-TECHNICAL',
      escolaId: school.id,
      acao: 'Análise Técnica Alterada',
      detalhes: `Documento marcado como incorreto em ${competenceKey}.`,
      dataHora: '2026-08-18T13:00:00.000Z',
      usuario: 'Controlador E2E'
    });

    rebuildOperationalIndexes();
    switchView('prontuario', school.id);
    return school.id;
  }, { nextProfile: profile, competenceKey: competence });

  const tab = page.getByRole('tab', { name: 'Histórico cronológico', exact: true });
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#tab-historico')).toHaveClass(/active/);
  await expect(page.locator('#tab-historico')).not.toHaveAttribute('hidden', '');
}

test('prontuário apresenta eventos unificados em ordem cronológica e sem duplicar abertura', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Timeline integral validada no desktop.');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  expect(await page.evaluate(() => window.RadarProductExtensionsReady)).toBe(true);
  await openTimeline(page, 'controlador');

  const items = page.locator('.school-timeline-item');
  await expect(items).toHaveCount(10);
  await expect(items.first()).toContainText('Bonificação APTA');
  await expect(page.locator('[data-timeline-event-type="pendency_opened"]')).toHaveCount(1);
  await expect(page.locator('[data-timeline-event-type="pendency_contact"]')).toContainText('Orientação prestada à direção');
  await expect(page.locator('[data-timeline-event-type="asset_inventoried"]')).toContainText('Projetor');
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_reviewed"]')).toContainText('Reanálise concluída');
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_registered"]')).toContainText('Novo documento enviado pela escola.');
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_registered"]')).toContainText('Direção E2E');
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_reviewed"]')).toContainText('Assinatura validada na reanálise.');
  expect(pageErrors).toEqual([]);
});

test('Gestão SME mantém eventos gerenciais e oculta detalhe técnico restrito', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Recorte gerencial validado no desktop.');

  await page.goto('/');
  expect(await page.evaluate(() => window.RadarProductExtensionsReady)).toBe(true);
  await openTimeline(page, 'sme');

  const consolidations = page.locator('[data-timeline-event-type="verification_consolidated"]');
  await expect(page.locator('[data-timeline-source="administrative_logs"]')).toHaveCount(1);
  await expect(page.locator('[data-timeline-event-type="technical_analysis_changed"]')).toHaveCount(0);
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_reviewed"]')).toHaveCount(0);
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_registered"]')).toBeVisible();
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_registered"]')).not.toContainText('Assinatura validada na reanálise.');
  await expect(consolidations).toHaveCount(2);
  await expect(consolidations.first()).toBeVisible();
  await expect(page.locator('[data-timeline-event-type="pendency_contact"]')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar no histórico' }).fill('Assinatura validada');
  await expect(page.locator('.school-timeline-item')).toHaveCount(0);
  await expect(page.locator('.school-timeline-empty')).toContainText('Nenhuma movimentação corresponde à busca.');
});

test('busca e tipo localizam eventos sem perder contexto nem expor identificadores internos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Busca exercitada na mesma projeção do histórico.');
  await page.goto('/');
  await openTimeline(page);

  const search = page.getByRole('searchbox', { name: 'Buscar no histórico' });
  const category = page.getByRole('combobox', { name: 'Tipo de movimentação', exact: true });
  const clear = page.getByRole('button', { name: 'Limpar filtros', exact: true });
  const items = page.locator('.school-timeline-item');
  const count = page.locator('#school-timeline-count');
  await expect(clear).toBeDisabled();
  await expect(page.locator('.school-timeline-card')).not.toContainText('TIMELINE-E2E-PENDENCY');

  await search.fill('direcao escola');
  await expect(items).toHaveCount(1);
  await expect(items).toContainText('Novo documento enviado pela escola.');
  await expect(items).toContainText('Direção E2E');
  await expect(count).toHaveText('1 de 10 eventos');

  await category.selectOption('pendencies');
  await expect(items).toHaveCount(0);
  await expect(page.locator('.school-timeline-empty')).toContainText('Nenhuma movimentação corresponde à busca.');
  await expect(count).toHaveText('0 de 10 eventos');
  await clear.click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(category).toHaveValue('all');
  await expect(items).toHaveCount(10);

  await category.selectOption('documents');
  await expect(items).toHaveCount(3);
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_registered"]')).toBeVisible();
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_reviewed"]')).toBeVisible();
  await page.getByRole('tab', { name: 'Competências e Análises', exact: true }).click();
  await page.getByRole('tab', { name: 'Histórico cronológico', exact: true }).click();
  await expect(category).toHaveValue('documents');
  await expect(items).toHaveCount(3);
  await clear.click();
  await expect(count).toHaveText('10 eventos');
});

test('histórico mantém filtros e leitura em desktop, largura intermediária, celular e tema escuro', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Larguras controladas com a mesma massa sintética.');
  await page.goto('/');
  await openTimeline(page);
  for (const width of [1440, 960, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const search = page.getByRole('searchbox', { name: 'Buscar no histórico' });
    await search.fill('documento');
    await expect(page.locator('#school-timeline-count')).toHaveText('3 de 10 eventos');
    await expect(page.getByRole('combobox', { name: 'Tipo de movimentação', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limpar filtros', exact: true })).toBeEnabled();
    const overflow = await page.locator('.school-timeline-card').evaluate(element => ({
      card: element.scrollWidth - element.clientWidth,
      body: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    expect(overflow.card).toBeLessThanOrEqual(1);
    expect(overflow.body).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.querySelector('#tab-historico').scrollIntoView({ block: 'start' }));
    await testInfo.attach(`historico-busca-${width}`, {
      body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png'
    });
    await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { if (!document.body.classList.contains('dark-theme')) toggleTheme(); });
  await expect(page.locator('body')).toHaveClass(/dark-theme/);
  await page.evaluate(() => document.querySelector('#tab-historico').scrollIntoView({ block: 'start' }));
  await testInfo.attach('historico-completo-escuro-1440', {
    body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png'
  });
});

test('falha de leitura permite tentar novamente sem apresentar histórico parcial como completo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Falha de leitura simulada na projeção local.');
  await page.goto('/');
  await openTimeline(page);
  await page.evaluate(() => {
    window.__timelineReadAttempts = 0;
    window.RadarAdministrativeLogReadContext = {
      model: {
        async loadSchool() {
          window.__timelineReadAttempts += 1;
          if (window.__timelineReadAttempts === 1) throw new Error('Falha de leitura simulada no teste.');
          return { hasMore: false };
        }
      }
    };
  });
  await page.getByRole('tab', { name: 'Histórico cronológico', exact: true }).click();
  await expect(page.locator('#tab-historico').getByRole('alert')).toContainText('Não foi possível carregar o histórico completo');
  await expect(page.locator('.school-timeline-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'Carregar histórico novamente', exact: true }).click();
  await expect(page.locator('.school-timeline-item')).toHaveCount(10);
  expect(await page.evaluate(() => window.__timelineReadAttempts)).toBe(2);
});
