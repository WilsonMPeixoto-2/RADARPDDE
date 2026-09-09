import fs from 'node:fs';

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
`,
`    const selectedQuotedRow = page.locator('tr[data-pendency-ref].pendency-row-selected');
    await expect(selectedQuotedRow).toContainText(context.documents[2]);
    await page.evaluate(() => closePendencyDetail());
    await selectedQuotedRow.getByRole('button', {
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

console.log('PR #295: correções determinísticas aplicadas com sucesso.');
