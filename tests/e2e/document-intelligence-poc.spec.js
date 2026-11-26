const { test, expect } = require('@playwright/test');

test('demonstração documental preserva evidências, recusa coincidência por valor e exige revisão humana', async ({ page }, testInfo) => {
  const externalRequests = [];
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') externalRequests.push(request.url());
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ops/document-intelligence-poc/index.html');
    await expect(page.getByRole('heading', { name: 'Cinco situações para conferir' })).toBeVisible();
    await expect(page.locator('#queue button')).toHaveCount(5);
    await expect(page.locator('#status')).toHaveText('Correspondência a conferir');

    await page.getByRole('button', { name: /^Nota DEMO-004/ }).click();
    await expect(page.locator('#detail-title')).toBeFocused();
    await expect(page.locator('#status')).toHaveText('Sem correspondência suficiente');
    await expect(page.locator('#explanation')).toContainText('Um valor igual, sozinho, não identifica um pagamento.');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-003/ }).click();
    await expect(page.locator('#payment-amount')).toHaveText('2 débitos possíveis');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-002/ }).click();
    await expect(page.locator('#status')).toHaveText('Diferença de valores');
    await page.getByLabel('Sua observação').fill('Conferir a diferença nas fontes fictícias antes de qualquer conclusão.');
    await page.getByRole('button', { name: 'Encaminhar para revisão documental' }).click();
    await expect(page.getByRole('status')).toHaveText('Revisão documental indicada no exemplo. Nenhuma Pendência foi criada.');

    await page.getByRole('button', { name: /^Nota DEMO-005/ }).click();
    await expect(page.locator('#status')).toHaveText('Extração precisa de revisão');
    await expect(page.getByRole('button', { name: 'Confirmar correspondência no exemplo' })).toBeDisabled();

    await page.getByRole('button', { name: /^Nota DEMO-001/ }).click();
    await page.getByRole('button', { name: 'Confirmar correspondência no exemplo' }).click();
    await expect(page.getByLabel('Sua observação')).toBeFocused();
    await expect(page.getByRole('status')).toContainText('Escreva uma breve observação');
    await page.locator('#sources summary').first().click();
    await expect(page.locator('#sources pre').first()).toContainText('DOCUMENTO SINTÉTICO — NÃO É NOTA FISCAL');
    await page.getByLabel('Sua observação').fill('Comparei referência, beneficiário, contexto e valor nas duas fontes fictícias.');
    await page.getByRole('button', { name: 'Confirmar correspondência no exemplo' }).click();
    await expect(page.getByRole('status')).toHaveText('Correspondência conferida no exemplo. Nenhuma decisão administrativa foi criada.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await testInfo.attach(`document-intelligence-${width}.png`, {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });
    await page.reload();
    await expect(page.locator('#queue button')).toHaveCount(5);
    await expect(page.getByLabel('Sua observação')).toHaveValue('');
    await expect(page.getByRole('status')).toBeEmpty();
  }
  expect(externalRequests).toEqual([]);
});


test('conferência privada abre a saída real do motor com fixture sintética, verifica origem e não importa dados', async ({ page }, testInfo) => {
  const { createHash } = require('node:crypto');
  const { analyzeManifest, hashText } = await import('../../ops/document-intelligence-poc/local-pdf-pilot/analyze.mjs');
  // Apenas bytes sintéticos para testar a identidade; não simulam PDF legível.
  const original = Buffer.from('%PDF-1.4\nBYTES SINTETICOS DE TESTE\n');
  const hash = createHash('sha256').update(original).digest('hex');
  const institution = 'CEC DO/A ESCOLA SINTÉTICA DE REVISÃO';
  const texts = [
    `RELAÇÃO DE BENS ADQUIRIDOS OU PRODUZIDOS\nPDDE BÁSICO 2025\n${institution} 00.000.000/0000-00\nBLOCO 2 – IDENTIFICAÇÃO DOS BENS\nDANF SYN-901 09/08/2025 <img src=x onerror=alert(1)> 1 100,00 100,00\n0 0 00/01/1900 0 0 - -\n12 - TOTAL 100,00\n`,
    `TERMO DE DOAÇÃO\nPelo presente instrumento o ${institution} do/a ESCOLA SINTÉTICA\nPDDE/BÁSICO/2025\nDESCRIÇÃO DO BEM QTDE. NOTA FISCAL DATA UNITÁRIO TOTAL\n1 <img src=x onerror=alert(1)> 1 SYN-901 09/08/2025 100,00 100,00\n2 BEM EXTRA SINTÉTICO 1 SYN-902 10/08/2025 50,00 50,00\nTOTAL: 150,00\n`
  ];
  const manifest = { schemaVersion: 1, synthetic: true, extractor: { version: 'synthetic/1' },
    documents: texts.map((text,index)=>({ id: 'synthetic-'+index,
      source: { pdfSha256: index===0?hash:hashText('outros bytes sintéticos'), version: 'synthetic/1' },
      textSha256: hashText(text), pageCount: 1, pages: [{ page: 1, text, textSha256: hashText(text) }],
      signatureFieldsPresence: { present: false, count: 0 }, signatureTextMarkersPresent: false })) };
  const analysis = analyzeManifest(manifest,{ targetExercise: 2026 });
  const fixture = { name:'synthetic-analysis.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(analysis)) };
  const requests=[];
  page.on('request',request=>requests.push(request.url()));
  await page.goto('/ops/document-intelligence-poc/local-pdf-pilot/review.html');
  const requestCount=requests.length;
  await page.getByLabel('Relatório privado de extração (.json)').setInputFiles(fixture);
  await expect(page.locator('#load-status')).toContainText('2 documento(s) carregado(s)');
  await page.getByLabel('CNPJ da unidade no RADAR (informado por você)').fill('00.000.000/0000-00');
  await page.getByLabel('Exercício no RADAR (informado por você)').fill('2026');
  await expect(page.locator('#comparison')).toContainText('CNPJ coincide');
  await expect(page.locator('#comparison')).toContainText('Exercício diverge');
  await expect(page.locator('#items')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#items img')).toHaveCount(0);
  await expect(page.locator('#items')).toContainText('1 linha(s) vazia(s)');
  await expect(page.locator('#pairs')).toContainText('Não é contagem de compras');
  const checkPairOwnership = async () => {
    await expect(page.locator('#pairs')).toContainText('1. Relação de bens · item 1');
    await expect(page.locator('#pairs')).toContainText('2. Termo de doação · item 1');
    await expect(page.locator('#pairs')).toContainText('2. Termo de doação · itens sem correspondência na relação de bens: 2');
  };
  await checkPairOwnership();
  await page.locator('#fields summary').first().click();
  await expect(page.locator('#fields blockquote').first()).toBeVisible();
  await page.getByLabel('PDF original deste documento').setInputFiles({name:'wrong.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nDIFERENTE')});
  await expect(page.locator('#source-status')).toContainText('PDF diferente do relatório');
  await page.getByLabel('PDF original deste documento').setInputFiles({name:'original.pdf',mimeType:'application/pdf',buffer:original});
  await expect(page.locator('#source-status')).toContainText('Bytes coincidem');
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await testInfo.attach('conferencia-privada-'+width+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  }
  await page.getByLabel('Documento do relatório').selectOption('synthetic-1');
  await checkPairOwnership();
  await expect(page.locator('#comparison')).toContainText('CNPJ do documento não identificado');
  await expect(page.locator('#items')).toContainText('Item 2 · BEM EXTRA SINTÉTICO');
  await expect(page.locator('#source-status')).toHaveText('Original ainda não conferido.');
  await page.getByRole('button',{name:'Limpar conferência'}).click();
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.getByLabel('Relatório privado de extração (.json)')).toHaveValue('');
  await page.getByLabel('Relatório privado de extração (.json)').setInputFiles({...fixture,buffer:Buffer.from(JSON.stringify({...analysis,requiresHumanReview:false}))});
  await expect(page.locator('#load-status')).toContainText('Não foi possível abrir');
  await expect(page.locator('#workspace')).toBeHidden();
  expect(requests.slice(requestCount)).toEqual([]);
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});
