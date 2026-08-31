const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test.describe('análise Incorreto com pendência atômica', () => {
  test('continua funcional mesmo se uma extensão opcional seguinte falhar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    // Reproduz a classe de falha observada em produção: uma extensão opcional quebra.
    // A proteção de "Incorreto" precisa ter sido carregada antes dela.
    await page.route('**/src/domain/school-timeline.js', route => route.abort());
    await page.goto('/');
    await selectFixtureCompetence(page);

    await page.waitForFunction(() => window.RADAR_ATOMIC_ANALYSIS_READY === true, null, {
      timeout: 15_000
    });

    const context = await page.evaluate(() => {
      switchProfile('controlador');

      const programaId = 'ED_FAMILIA';
      const documentoKey = 'extCC';
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola determinística não encontrada para o teste atômico.');

      const compKey = `${competencia}_${programaId}`;
      pendencias = pendencias.filter(pendency => !(
        RadarPendencias.isActivePendency(pendency)
        && pendency.escolaId === escola.id
        && (pendency.competenciaOrigem || pendency.competencia) === competencia
        && pendency.programaId === programaId
        && pendency.documentoKey === documentoKey
      ));

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      const verification = RadarFluxoOperacional.createEmptyVerification();
      verification.bonificacao[documentoKey] = 'Sim';
      verification.analise[documentoKey] = 'Não analisado';
      verificacoes[escola.id][compKey] = verification;
      rebuildOperationalIndexes();
      persist();

      return {
        escolaId: escola.id,
        competencia,
        compKey,
        programaId,
        documentoKey
      };
    });

    const started = await page.evaluate(async seeded => {
      const select = { value: 'Incorreto' };
      const result = await changeAnaliseTecnica(
        seeded.escolaId,
        seeded.compKey,
        seeded.documentoKey,
        'Incorreto',
        select
      );
      return {
        result,
        selectValue: select.value,
        ready: window.RADAR_ATOMIC_ANALYSIS_READY,
        version: window.RadarAtomicAnalysisPendency?.VERSION || null
      };
    }, context);

    expect(started.ready).toBe(true);
    expect(started.version).toBe('2.0.0');
    expect(started.result).toBe(true);
    expect(started.selectValue).toBe('Não analisado');
    expect(dialogs.some(message => message.includes('PENDENCY_REQUIRED'))).toBe(false);
    expect(dialogs.some(message => message.includes('deve ser confirmada junto com a abertura da pendência'))).toBe(false);

    const modal = page.locator('#modal-nova-pendencia');
    await expect(modal).toHaveClass(/show/);
    await modal.locator('input[name="pend-erros"]').first().check();
    await modal.locator('#pend-obs').fill('Erro identificado no teste de regressão atômica.');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);

    const result = await page.evaluate(seeded => {
      const active = pendencias.filter(pendency => (
        RadarPendencias.isActivePendency(pendency)
        && pendency.escolaId === seeded.escolaId
        && (pendency.competenciaOrigem || pendency.competencia) === seeded.competencia
        && pendency.programaId === seeded.programaId
        && pendency.documentoKey === seeded.documentoKey
      ));
      const verification = verificacoes[seeded.escolaId][seeded.compKey];
      const atomicLogs = logs.filter(log => (
        log.acao === 'Análise incorreta e pendência aberta'
        && (log.escolaId === seeded.escolaId || log.schoolId === seeded.escolaId)
      ));
      return {
        activeCount: active.length,
        analysis: verification.analise[seeded.documentoKey],
        atomicLogCount: atomicLogs.length
      };
    }, context);

    expect(result.activeCount).toBe(1);
    expect(result.analysis).toBe('Incorreto');
    expect(result.atomicLogCount).toBe(1);
  });

  test('rota agregada antiga de Notas Fiscais não abre Pendência genérica', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await page.goto('/');
    await selectFixtureCompetence(page);
    await page.waitForFunction(() => window.RADAR_ATOMIC_ANALYSIS_READY === true, null, {
      timeout: 15_000
    });

    const result = await page.evaluate(async () => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola determinística não encontrada.');

      const programaId = escola.programasIds[0];
      const compKey = `${competencia}_${programaId}`;
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      const verification = RadarFluxoOperacional.createEmptyVerification();
      verification.bonificacao.notaFiscal = 'Sim';
      verification.analise.notaFiscal = 'Não analisado';
      verificacoes[escola.id][compKey] = verification;

      const before = pendencias.length;
      const changed = await changeAnaliseTecnica(
        escola.id,
        compKey,
        'notaFiscal',
        'Incorreto',
        { value: 'Incorreto' }
      );

      return {
        changed,
        before,
        after: pendencias.length,
        modalOpen: document.getElementById('modal-nova-pendencia')?.classList.contains('show') || false
      };
    });

    expect(result.changed).toBe(false);
    expect(result.after).toBe(result.before);
    expect(result.modalOpen).toBe(false);
    expect(dialogs.some(message => message.includes('calculada automaticamente'))).toBe(true);
  });

});
