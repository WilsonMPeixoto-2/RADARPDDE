const { test, expect } = require('@playwright/test');

async function waitForSmeAccessModules(page) {
  await page.waitForFunction(() => (
    Boolean(window.RadarAccessPolicy)
    && Boolean(window.RadarApplicationServices?.pendencies)
    && Boolean(window.RadarTask9PendencyPage)
    && Boolean(window.RadarTask1011PendencyActions)
  ));
}

test.describe('governança de acesso da Gestão SME', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
    await page.goto('/');
    await waitForSmeAccessModules(page);
  });

  test('visão mensal e prontuário exibem bonificação sem análise técnica ou ações', async ({ page }) => {
    const context = await page.evaluate(() => {
      const school = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, activeCompetenciaKey)
      ));
      if (!school) throw new Error('Unidade escolar em escopo não encontrada.');

      const programId = school.programasIds[0];
      const compKey = `${activeCompetenciaKey}_${programId}`;
      verificacoes[school.id] = verificacoes[school.id] || {};
      verificacoes[school.id][compKey] = {
        bonificacao: {
          extCC: 'Sim',
          extINV: 'Não',
          notaFiscal: 'Não se aplica',
          consAssessoria: '',
          declBBAgil: 'Sim',
          encampInventario: 'Não'
        },
        analise: {
          extCC: 'Incorreto',
          extINV: 'Correto',
          notaFiscal: 'Não analisado',
          consAssessoria: 'Correto',
          declBBAgil: 'Incorreto',
          encampInventario: 'Correto'
        },
        resultadoBonif: ''
      };

      switchProfile('sme');
      switchView('competencias');
      return { schoolId: school.id, competence: activeCompetenciaKey };
    });

    const competenceTable = page.locator('#main-container table.data-table').first();
    await expect(competenceTable.locator('thead th')).toHaveCount(3);
    await expect(competenceTable.locator('thead')).not.toContainText('Análise Técnica');
    await expect(competenceTable.locator('thead')).not.toContainText('Pendências abertas');
    await expect(competenceTable.locator('thead')).not.toContainText('Ações');
    await expect(page.locator('#passivo-competencias-list')).toHaveCount(0);

    await page.evaluate(({ schoolId, competence }) => {
      activeProntuarioCompetencia = competence;
      switchView('prontuario', schoolId);
    }, context);

    await expect(page.getByRole('tab', { name: 'Competências e Bonificação' })).toBeVisible();
    const prontuario = page.locator('#tab-verificacoes');
    await expect(prontuario.locator('thead th')).toHaveCount(3);
    await expect(prontuario.locator('thead')).not.toContainText('Análise Técnica');
    await expect(prontuario.locator('thead')).not.toContainText('Ações');
    await expect(prontuario.locator('select.select-analise')).toHaveCount(0);
    await expect(prontuario.locator('.btn-group-toggle')).toHaveCount(0);
    await expect(prontuario.locator('[data-bonification-value="Sim"]').first()).toBeVisible();
  });

  test('pendências permanecem consultáveis, mas não oferecem nem executam mutações', async ({ page }) => {
    await page.evaluate(() => {
      const school = escolas.find(candidate => candidate.programasIds?.includes('BASIC'));
      if (!school) throw new Error('Unidade escolar do PDDE Básico não encontrada.');

      const createOpen = (id, documentKey, item) => RadarPendencias.createDocumentPendency({
        id,
        escolaId: school.id,
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: documentKey,
        item,
        errosAtuais: ['Documento incompleto'],
        observacao: 'Pendência para validação da governança SME.',
        dataAbertura: '2026-07-01'
      }, {
        eventId: `${id}-open`,
        at: '2026-07-01T12:00:00.000Z',
        usuario: 'Controlador',
        perfil: 'Controlador'
      });

      const open = createOpen('sme-access-open', 'extCC', 'Extrato Conta Corrente');
      const awaitingBase = createOpen('sme-access-awaiting', 'extINV', 'Extrato Investimento');
      const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
        id: 'sme-access-attempt',
        dataDisponibilizacao: '2026-07-02',
        observacao: 'Documento substituído.'
      }, {
        eventId: 'sme-access-attempt-event',
        at: '2026-07-02T12:00:00.000Z',
        usuario: 'Escola',
        perfil: 'Escola'
      });
      const resolvedBase = createOpen('sme-access-resolved', 'declBBAgil', 'Declaração BB Ágil');
      const resolvedAwaiting = RadarPendencias.registerCorrectiveSubmission(resolvedBase, {
        id: 'sme-access-resolved-attempt',
        dataDisponibilizacao: '2026-07-03',
        observacao: 'Documento corrigido.'
      }, {
        eventId: 'sme-access-resolved-attempt-event',
        at: '2026-07-03T12:00:00.000Z',
        usuario: 'Escola',
        perfil: 'Escola'
      });
      const resolved = RadarPendencias.recordReanalysis(resolvedAwaiting, {
        resultado: 'correto',
        observacao: 'Documento regularizado.'
      }, {
        eventId: 'sme-access-resolved-event',
        at: '2026-07-04T12:00:00.000Z',
        usuario: 'Controlador',
        perfil: 'Controlador'
      });

      pendencias = [open, awaiting, resolved];
      contatos = [];
      rebuildOperationalIndexes();
      switchProfile('sme');
      switchView('pendencias');
    });

    const main = page.locator('#main-container');
    await expect(main.getByRole('button', { name: 'Ver detalhes' }).first()).toBeVisible();
    await expect(main.getByRole('button', { name: 'Abrir no Prontuário' }).first()).toBeVisible();

    for (const label of [
      'Registrar novo envio',
      'Registrar contato',
      'Cancelar pendência'
    ]) {
      await expect(main.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }

    await main.locator('#pendency-tab-aguardando').click();
    for (const label of [
      'Registrar substituição mais recente',
      'Reanalisar',
      'Registrar contato',
      'Cancelar pendência'
    ]) {
      await expect(main.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }

    await main.locator('#pendency-tab-resolvida').click();
    await expect(main.getByRole('button', { name: 'Reabrir pendência', exact: true })).toHaveCount(0);
    await main.locator('#pendency-tab-aberta').click();

    const guarded = await page.evaluate(() => ({
      openPendency: openNovaPendenciaModal(escolas[0].id),
      registerContact: openContatoModal(escolas[0].id),
      generateCharge: openCobrancaModal(escolas[0].id),
      registerSubmission: abrirModalRegistrarNovoEnvio(
        encodePendencyIdReference('sme-access-open')
      ),
      serviceStateBefore: pendencias.map(item => item.status)
    }));
    expect(guarded).toEqual({
      openPendency: false,
      registerContact: false,
      generateCharge: false,
      registerSubmission: false,
      serviceStateBefore: ['Aberta', 'Aguardando reanálise', 'Resolvida']
    });

    await main.getByRole('button', { name: 'Ver detalhes' }).first().click();
    await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toBeVisible();
  });

  test('registros internos usam o UUID mesmo na simulação SME do administrador técnico', async ({ page }) => {
    await page.evaluate(() => {
      window.RadarAuthContext = Object.freeze({
        user: Object.freeze({
          id: '00000000-0000-4000-8000-000000000971',
          email: 'admin@example.test',
          displayName: 'Administrador Técnico'
        }),
        authorization: Object.freeze({
          role: 'technical_admin',
          profile: { label: 'Administrador técnico' }
        })
      });
      logs = [
        {
          id: 'sme-log-own',
          actorUserId: '00000000-0000-4000-8000-000000000971',
          usuario: 'Administrador Técnico',
          perfil: 'Administrador técnico',
          acao: 'Registro próprio',
          detalhes: 'Deve aparecer na simulação SME.',
          dataHora: '2026-07-28T12:00:00.000Z'
        },
        {
          id: 'sme-log-other',
          actorUserId: '00000000-0000-4000-8000-000000000972',
          usuario: 'Outro Usuário',
          perfil: 'Gestão SME',
          acao: 'Registro alheio',
          detalhes: 'Não deve aparecer na simulação SME.',
          dataHora: '2026-07-28T11:00:00.000Z'
        },
        {
          id: 'sme-log-legacy',
          actorUserId: null,
          usuario: 'Legado',
          perfil: 'Gestão SME',
          acao: 'Registro legado',
          detalhes: 'Sem UUID.',
          dataHora: '2026-07-28T10:00:00.000Z'
        }
      ];

      switchProfile('sme');
      switchView('auditoria');
    });

    const table = page.locator('#main-container table.data-table');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table).toContainText('Registro próprio');
    await expect(table).not.toContainText('Registro alheio');
    await expect(table).not.toContainText('Registro legado');
    await expect(page.locator('#main-container')).toContainText(
      'Ações registradas pelo seu próprio login autenticado.'
    );

    await page.evaluate(() => {
      switchProfile('controlador');
      switchView('auditoria');
    });
    await expect(table.locator('tbody tr')).toHaveCount(3);
  });
});
