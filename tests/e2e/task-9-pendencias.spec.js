const { test, expect } = require('@playwright/test');

async function seedFourPendencyStates(page) {
  return page.evaluate(() => {
    switchProfile('controlador');

    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, '2026-05')
    ));
    if (!school) throw new Error('Escola determinística para a Task 9 não encontrada.');

    const createOpen = ({ id, documentoKey, documentoNome, dataAbertura, erros }) => (
      RadarPendencias.createDocumentPendency({
        id,
        escolaId: school.id,
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey,
        item: `PDDE Básico - ${documentoNome}`,
        errosAtuais: erros,
        observacao: `Observação inicial da pendência ${id}.`,
        dataAbertura
      }, {
        eventId: `${id}-abertura`,
        at: `${dataAbertura}T12:00:00.000Z`,
        usuario: 'Controladora Task 9',
        perfil: 'Controlador'
      })
    );

    const open = createOpen({
      id: 'task9-open',
      documentoKey: 'extCC',
      documentoNome: 'Extrato Conta Corrente',
      dataAbertura: '2026-06-01',
      erros: ['Documento ilegível', 'Competência incorreta']
    });

    const awaitingBase = createOpen({
      id: 'task9-awaiting',
      documentoKey: 'extINV',
      documentoNome: 'Extrato Investimento',
      dataAbertura: '2026-06-02',
      erros: ['Documento incompleto']
    });
    const awaiting = RadarPendencias.registerCorrectiveSubmission(awaitingBase, {
      id: 'task9-awaiting-tentativa',
      dataDisponibilizacao: '2026-07-10',
      observacao: 'Arquivo corrigido disponibilizado no Drive.',
      link: 'https://drive.google.com/file/d/task9-awaiting/view'
    }, {
      eventId: 'task9-awaiting-envio',
      at: '2026-07-10T12:00:00.000Z',
      usuario: 'Escola Task 9',
      perfil: 'Escola'
    });

    const resolvedBase = createOpen({
      id: 'task9-resolved',
      documentoKey: 'notaFiscal',
      documentoNome: 'Notas Fiscais',
      dataAbertura: '2026-06-03',
      erros: ['Arquivo incompatível']
    });
    const resolvedAwaiting = RadarPendencias.registerCorrectiveSubmission(resolvedBase, {
      id: 'task9-resolved-tentativa',
      dataDisponibilizacao: '2026-07-08',
      observacao: 'Notas fiscais substituídas para conferência.'
    }, {
      eventId: 'task9-resolved-envio',
      at: '2026-07-08T12:00:00.000Z',
      usuario: 'Escola Task 9',
      perfil: 'Escola'
    });
    const resolved = RadarPendencias.recordReanalysis(resolvedAwaiting, {
      resultado: 'correto',
      observacao: 'Documentos conferidos e corretos.'
    }, {
      eventId: 'task9-resolved-reanalise',
      at: '2026-07-09T12:00:00.000Z',
      usuario: 'Controladora Task 9',
      perfil: 'Controlador'
    });

    const cancelledBase = createOpen({
      id: 'task9-cancelled',
      documentoKey: 'declBBAgil',
      documentoNome: 'Declaração BB Ágil',
      dataAbertura: '2026-06-04',
      erros: ['Dados divergentes']
    });
    const cancelled = RadarPendencias.cancelPendency(cancelledBase, {
      justificativa: 'Registro criado no documento incorreto.'
    }, {
      eventId: 'task9-cancelled-evento',
      at: '2026-07-07T12:00:00.000Z',
      usuario: 'Controladora Task 9',
      perfil: 'Controlador'
    });

    pendencias = [open, awaiting, resolved, cancelled];
    contatos = [
      {
        id: 'task9-contact',
        pendenciaId: open.id,
        escolaId: school.id,
        data: '2026-07-06',
        tipo: 'WhatsApp',
        descricao: 'Direção orientada sobre o documento ilegível.',
        responsavel: 'Controladora Task 9'
      }
    ];
    activePendencyDetailId = null;
    rebuildOperationalIndexes();
    persist();
    switchView('pendencias');

    return {
      schoolId: school.id,
      schoolName: school.denominação,
      schoolDesignation: school.designação
    };
  });
}

test.describe('Task 9 — página de Pendências Operacionais', () => {
  test('separa as quatro situações canônicas em abas acessíveis', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await seedFourPendencyStates(page);

    const tablist = page.getByRole('tablist', { name: 'Situações das pendências' });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Abertas\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Aguardando reanálise\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Resolvidas\b/ })).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /^Canceladas\b/ })).toBeVisible();

    const openTab = tablist.getByRole('tab', { name: /^Abertas\b/ });
    await expect(openTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: /^Abertas\b/ })
      .locator('[data-pendency-id="task9-open"]')).toHaveCount(1);
  });
});
