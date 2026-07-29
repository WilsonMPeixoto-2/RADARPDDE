const { test, expect } = require('@playwright/test');

async function openTimeline(page, profile = 'controlador') {
  await page.evaluate(nextProfile => {
    switchProfile(nextProfile);
    const competence = '2026-08';
    activeCompetenciaKey = competence;
    activeProntuarioCompetencia = competence;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    const compKey = `${competence}_BASIC`;
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
      competenciaOrigem: competence,
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
        observacao: 'Novo arquivo conferido.',
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
      competencia: competence,
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
      detalhes: 'Consolidação registrada em 2026-08.',
      dataHora: '2026-08-31T17:00:00.000Z',
      usuario: 'Controlador E2E'
    });
    logs.push({
      id: 'TIMELINE-TECHNICAL',
      escolaId: school.id,
      acao: 'Análise Técnica Alterada',
      detalhes: 'Documento marcado como incorreto em 2026-08.',
      dataHora: '2026-08-18T13:00:00.000Z',
      usuario: 'Controlador E2E'
    });

    rebuildOperationalIndexes();
    switchView('prontuario', school.id);
    return school.id;
  }, profile);

  const tab = page.getByRole('button', { name: 'Histórico cronológico', exact: true });
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page.locator('#tab-historico')).toHaveClass(/active/);
}

test('prontuário apresenta eventos unificados em ordem cronológica e sem duplicar abertura', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Timeline integral validada no desktop.');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => window.RadarProductExtensionsReady);
  expect(await page.evaluate(() => window.RadarProductExtensionsReady)).toBeTruthy();
  await openTimeline(page, 'controlador');

  const items = page.locator('.school-timeline-item');
  await expect(items).toHaveCount(9);
  await expect(items.first()).toContainText('Bonificação APTA');
  await expect(page.locator('[data-timeline-event-type="pendency_opened"]')).toHaveCount(1);
  await expect(page.locator('[data-timeline-event-type="pendency_contact"]')).toContainText('Orientação prestada à direção');
  await expect(page.locator('[data-timeline-event-type="asset_inventoried"]')).toContainText('Projetor');
  await expect(page.locator('[data-timeline-event-type="pendency_attempt_reviewed"]')).toContainText('Reanálise concluída');
  expect(pageErrors).toEqual([]);
});

test('Gestão SME mantém eventos gerenciais e oculta detalhe técnico restrito', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Recorte gerencial validado no desktop.');

  await page.goto('/');
  await page.waitForFunction(() => window.RadarProductExtensionsReady);
  await openTimeline(page, 'sme');

  await expect(page.locator('[data-timeline-source="administrative_logs"]')).toHaveCount(1);
  await expect(page.locator('[data-timeline-event-type="technical_analysis_changed"]')).toHaveCount(0);
  await expect(page.locator('[data-timeline-event-type="verification_consolidated"]')).toBeVisible();
  await expect(page.locator('[data-timeline-event-type="pendency_contact"]')).toBeVisible();
});