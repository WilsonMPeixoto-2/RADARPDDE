import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function replaceOnce(path, oldText, newText) {
  const text = fs.readFileSync(path, 'utf8');
  const parts = text.split(oldText);
  if (parts.length !== 2) {
    throw new Error(`${path}: esperado exatamente 1 trecho; encontrados ${parts.length - 1}`);
  }
  fs.writeFileSync(path, parts[0] + newText + parts[1], 'utf8');
}

replaceOnce(
  'src/domain/invoice-effects.js',
`        if (!existingInvoice) {
            desiredInvoice.analiseDocumentoFiscal = request.expenseType === UNIDENTIFIED_EXPENSE_TYPE
                ? 'Incorreto'
                : 'Não analisado';
        } else if (request.expenseType === UNIDENTIFIED_EXPENSE_TYPE
            || previousType === UNIDENTIFIED_EXPENSE_TYPE) {
            desiredInvoice.analiseDocumentoFiscal = 'Incorreto';
        }
`,
`        if (!existingInvoice) {
            desiredInvoice.analiseDocumentoFiscal = request.expenseType === UNIDENTIFIED_EXPENSE_TYPE
                ? 'Incorreto'
                : 'Não analisado';
        } else if (request.expenseType === UNIDENTIFIED_EXPENSE_TYPE) {
            if (hasExplicitInvoiceDocumentAnalysis(existingInvoice)) {
                desiredInvoice.analiseDocumentoFiscal = 'Incorreto';
            } else {
                delete desiredInvoice.analiseDocumentoFiscal;
            }
        } else if (previousType === UNIDENTIFIED_EXPENSE_TYPE) {
            desiredInvoice.analiseDocumentoFiscal = 'Incorreto';
        }
`
);

const unitPath = 'tests/unit/invoice-effects.test.js';
const unitMarker = "\n\ntest('remoção da última NF de serviço reconverge Assessoria e análise fiscal pelo mesmo planner', () => {";
const regression = `

test('retificação de a_identificar legado preserva ausência de análise individual explícita', () => {
    const legacy = {
        ...baseInput().existingInvoice,
        tipo: 'a_identificar',
        numero: '',
        desc: 'Débito histórico sem documentação suficiente',
        descricao: 'Débito histórico sem documentação suficiente',
        valor: 321.45
    };
    delete legacy.analiseDocumentoFiscal;

    const input = baseInput({
        existingInvoice: legacy,
        contextInvoices: [legacy],
        request: {
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competence: '2026-05',
            programId: 'BASIC',
            description: 'Débito histórico corrigido',
            expenseType: 'a_identificar',
            invoiceNumber: 'REF-LEGADO-CORRIGIDA',
            amount: 350.25
        }
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.unchanged, false);
    assert.equal(result.invoice.id, legacy.id);
    assert.equal(result.invoice.tipo, 'a_identificar');
    assert.equal(result.invoice.numero, 'REF-LEGADO-CORRIGIDA');
    assert.equal(result.invoice.valor, 350.25);
    assert.equal(
        Object.prototype.hasOwnProperty.call(result.invoice, 'analiseDocumentoFiscal'),
        false
    );
});
`;
replaceOnce(unitPath, unitMarker, regression + unitMarker);

replaceOnce(
  'tests/e2e/pendency-cycle.spec.js',
`    await expect(focusedReplacementTrigger)
      .toHaveText('Registrar substituição mais recente');

    await replacementTrigger.click();
`,
`    await expect(focusedReplacementTrigger)
      .toHaveText('Registrar substituição mais recente');

    await page.evaluate(() => closePendencyDetail());
    await replacementTrigger.click();
`
);

replaceOnce(
  'tests/e2e/pendency-cycle.spec.js',
`    const selectedQuotedRow = page.locator('tr[data-pendency-ref].pendency-row-selected');
    await expect(selectedQuotedRow).toContainText(context.documents[2]);
    await selectedQuotedRow.getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    }).click();
`,
`    const selectedQuotedRow = page.locator('tr[data-pendency-ref].pendency-row-selected');
    await expect(selectedQuotedRow).toContainText(context.documents[2]);
    await page.evaluate(() => closePendencyDetail());
    const quotedRowAfterClose = rowFor(context.documents[2]);
    await quotedRowAfterClose.getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    }).click();
`
);

replaceOnce(
  'tests/e2e/functional-core.spec.js',
`    const awaitingRow = page.locator(
      \`#p-aguardando tr[data-pendency-ref*="\${createdPendency.id}"]\`
    );
    await awaitingRow.getByRole('button', { name: 'Reanalisar', exact: true }).click();
`,
`    const awaitingRow = page.locator(
      \`#p-aguardando tr[data-pendency-ref*="\${createdPendency.id}"]\`
    );
    await page.evaluate(() => closePendencyDetail());
    await awaitingRow.getByRole('button', { name: 'Reanalisar', exact: true }).click();
`
);

replaceOnce(
  'tests/e2e/task-10-11-pendencias.spec.js',
`    await dialog.getByLabel('Justificativa do cancelamento').fill('Registro indevido.');
    await dialog.getByRole('button', { name: 'Confirmar cancelamento' }).click();

    await page.getByRole('tab', { name: /^Canceladas\\b/ }).click();
`,
`    await dialog.getByLabel('Justificativa do cancelamento').fill('Registro indevido.');
    await dialog.getByRole('button', { name: 'Confirmar cancelamento' }).click();
    await page.evaluate(() => closePendencyDetail());

    await page.getByRole('tab', { name: /^Canceladas\\b/ }).click();
`
);

replaceOnce(
  'tests/e2e/task-9-cross-view.spec.js',
"  test('mantém as ações da lista e o cabeçalho global acessíveis com o drawer aberto no desktop', async ({ page }, testInfo) => {\n",
"  test('mantém o cabeçalho acessível e fecha o drawer antes de agir na lista no desktop', async ({ page }, testInfo) => {\n"
);

replaceOnce(
  'tests/e2e/task-9-cross-view.spec.js',
`    await page.locator('#alerts-bell-container > .bell-button').click();

    const action = record.getByRole('button', { name: 'Registrar novo envio' });
`,
`    await page.locator('#alerts-bell-container > .bell-button').click();

    await page.evaluate(() => closePendencyDetail());
    const action = record.getByRole('button', { name: 'Registrar novo envio' });
`
);

replaceOnce(
  'docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md',
'19. Pendência ativa bloqueia edição estrutural comum da despesa no Prontuário.\n20. Pendências históricas sem identidade individual não recebem associação automática por número, valor, descrição ou heurística.\n',
'19. Pendência ativa não bloqueia a retificação cadastral auditável do mesmo lançamento; permanecem bloqueadas mudanças estruturais de identidade, contexto e ciclo operacional.\n20. Pendências históricas sem identidade individual não recebem associação automática por número, valor, descrição ou heurística.\n21. O PR #295 trata somente de edição/retificação. Exclusão de lançamentos com histórico protegido permanece fora do escopo e deverá ser discutida em PR próprio.\n'
);

replaceOnce(
  'docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md',
'- com Pendência ativa, controles normais de edição documental não competem com a ação operacional;\n',
'- com Pendência ativa, **Editar lançamento** pode coexistir com **Visualizar pendência**; a edição corrige dados cadastrais e não substitui novo envio ou reanálise;\n'
);

replaceOnce(
  'docs/superpowers/specs/2026-09-09-edicao-auditavel-lancamentos-design.md',
'A edição é uma **retificação auditável do mesmo registro**, e não um novo lançamento.\n',
'A edição é uma **retificação auditável do mesmo registro**, e não um novo lançamento.\n\n**Escopo desta entrega:** somente edição/retificação. A exclusão de lançamentos, especialmente quando houver Pendência ou histórico protegido, não faz parte do PR #295 e será tratada separadamente em outro PR. As regras atuais de exclusão permanecem inalteradas nesta entrega.\n'
);

replaceOnce(
  'docs/superpowers/plans/2026-09-09-edicao-auditavel-lancamentos.md',
'**Goal:** Permitir retificação auditável de todos os campos cadastrais editáveis de lançamentos e Pendências, inclusive com Pendência ativa, preservando identidade, histórico e ciclo de regularização e propagando cada alteração para todas as projeções de estado atual.\n',
'**Goal:** Permitir retificação auditável de todos os campos cadastrais editáveis de lançamentos e Pendências, inclusive com Pendência ativa, preservando identidade, histórico e ciclo de regularização e propagando cada alteração para todas as projeções de estado atual.\n\n**Fora do escopo do PR #295:** exclusão de lançamentos. A remoção, sobretudo quando houver histórico protegido, será tratada em PR próprio e não terá suas regras ampliadas nesta entrega.\n'
);

replaceOnce(
  'docs/evidence/2026-09-09-edicao-lancamentos-matriz-campo-projecao.md',
'**Branch:** `feat/edicao-lancamentos-auditavel`\n',
'**Branch:** `feat/edicao-lancamentos-auditavel`\n**Escopo:** edição/retificação apenas; exclusão permanece com as regras vigentes e fica para PR separado.\n'
);

replaceOnce(
  'docs/reference/functional-contract-matrix/operations.json',
'    "action": "Cadastrar/editar Nota Fiscal ou despesa, incluindo criação atômica de A identificar",\n',
'    "action": "Cadastrar Nota Fiscal/despesa e retificar dados editáveis do mesmo lançamento, inclusive com Pendência ativa; A identificar nasce atomicamente",\n'
);
replaceOnce(
  'docs/reference/functional-contract-matrix/operations.json',
'        "src/application/invoice-service.js",\n        "async saveUnidentifiedExpenseWithPendency"\n      ],\n      [\n        "src/data/supabase-repository.js",\n',
'        "src/application/invoice-service.js",\n        "async saveUnidentifiedExpenseWithPendency"\n      ],\n      [\n        "src/integration/auditable-retification.js",\n        "protectInvoiceService"\n      ],\n      [\n        "src/data/supabase-repository.js",\n'
);
replaceOnce(
  'docs/reference/functional-contract-matrix/operations.json',
'    "service": "InvoiceService.save + saveUnidentifiedExpenseWithPendency",\n',
'    "service": "InvoiceService.save + saveUnidentifiedExpenseWithPendency + RadarAuditableRetification",\n'
);
replaceOnce(
  'docs/reference/functional-contract-matrix/operations.json',
'    "action": "Excluir documento fiscal sem qualquer histórico de Pendência individual e reverter efeitos vinculados",\n',
'    "action": "Excluir documento fiscal sem qualquer histórico de Pendência individual e reverter efeitos vinculados; operação separada da retificação",\n'
);

replaceOnce(
  'docs/reference/functional-contract-matrix.json',
'  "updatedAt": "2026-09-06",\n  "sourceCommit": "3135d4c66bb5020507bd54d2fe202a79884680c7",\n',
'  "updatedAt": "2026-09-09",\n  "sourceCommit": "6b40922afcd2793ad685c27994dc405d5d5aa141",\n'
);

const matrix = spawnSync(process.execPath, ['scripts/check-functional-contract-matrix.mjs', '--write'], {
  stdio: 'inherit'
});
if (matrix.status !== 0) {
  throw new Error(`Falha ao regenerar matriz funcional: exit ${matrix.status}`);
}

console.log('PR #295: correções determinísticas, testes de layout e documentação aplicados com sucesso.');
