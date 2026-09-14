import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`Nenhuma alteração aplicada: ${label}`);
  return next;
}

function editFile(path, editor) {
  const source = fs.readFileSync(path, 'utf8');
  const next = editor(source);
  if (next === source) throw new Error(`Arquivo não alterado: ${path}`);
  fs.writeFileSync(path, next);
}

editFile('app.js', source => {
  const marker = 'function renderProntuario(';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('renderProntuario não encontrado');
  const nextFunction = source.indexOf('\nfunction ', start + marker.length);
  const end = nextFunction > start ? nextFunction : source.length;
  const before = source.slice(0, start);
  let segment = source.slice(start, end);
  const after = source.slice(end);

  segment = replaceOnce(
    segment,
    '<div class="page-header">',
    '<div class="page-header prontuario-school-header">',
    'classe do cabeçalho do Prontuário'
  );
  segment = replaceOnce(
    segment,
    `            \` : ''}\n        </div>\n\n        <div class="school-grid">`,
    `            \` : ''}\n            <button type="button" class="btn btn-secondary prontuario-data-toggle" aria-expanded="false" aria-controls="school-registration-details" onclick="toggleSchoolRegistrationDetails(this)">Exibir dados da unidade</button>\n        </div>\n\n        <div class="school-grid prontuario-school-grid">`,
    'botão de dados cadastrais'
  );
  segment = replaceOnce(
    segment,
    '<div class="school-sidebar">',
    '<div class="school-sidebar" id="school-registration-details" hidden>',
    'painel cadastral recolhível'
  );

  const toggleFunction = `function toggleSchoolRegistrationDetails(button) {\n    const panel = document.getElementById('school-registration-details');\n    if (!panel || !button) return false;\n    const expand = panel.hidden;\n    panel.hidden = !expand;\n    button.setAttribute('aria-expanded', String(expand));\n    button.textContent = expand ? 'Ocultar dados da unidade' : 'Exibir dados da unidade';\n    return expand;\n}\n\n`;
  return before + toggleFunction + segment + after;
});

editFile('styles.css', source => source + `\n\n/* Prontuário: contexto persistente e dados cadastrais sob demanda */\n.prontuario-school-header {\n    position: sticky;\n    top: 0;\n    z-index: 30;\n    background: var(--bg-primary, #f7f8fb);\n    border-bottom: 1px solid rgba(99, 102, 241, 0.12);\n    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);\n    padding-top: 12px;\n    padding-bottom: 12px;\n}\n\n.prontuario-data-toggle {\n    flex: 0 0 auto;\n}\n\n.prontuario-school-grid {\n    display: block;\n}\n\n#school-registration-details[hidden] {\n    display: none !important;\n}\n\n.prontuario-school-grid #school-registration-details {\n    width: 100%;\n    margin-bottom: 20px;\n}\n\n.prontuario-school-grid .school-workspace {\n    width: 100%;\n    min-width: 0;\n}\n`);

editFile('tests/e2e/school-details-desktop.spec.js', source => {
  let next = replaceOnce(
    source,
    `  test('compõe o resumo da unidade sem título duplicado, compressão ou marcadores sobrepostos', async ({ page }) => {\n    await openProfileSchool(page, 'controlador');\n\n    await expect(page.getByRole('heading', { name: 'Dados da unidade', exact: true })).toHaveCount(1);`,
    `  test('compõe o resumo da unidade sem título duplicado, compressão ou marcadores sobrepostos', async ({ page }) => {\n    await openProfileSchool(page, 'controlador');\n    await page.getByRole('button', { name: 'Exibir dados da unidade', exact: true }).click();\n\n    await expect(page.getByRole('heading', { name: 'Dados da unidade', exact: true })).toHaveCount(1);`,
    'abrir dados antes do ensaio geométrico'
  );
  const anchor = `  test('expõe programas vinculados como informação estática', async ({ page }) => {`;
  const insert = `  test('mantém dados cadastrais recolhidos e cabeçalho da escola visível durante rolagem', async ({ page }) => {\n    await openProfileSchool(page, 'controlador');\n\n    const toggle = page.getByRole('button', { name: 'Exibir dados da unidade', exact: true });\n    const panel = page.locator('#school-registration-details');\n    const header = page.locator('.prontuario-school-header');\n    await expect(toggle).toHaveAttribute('aria-expanded', 'false');\n    await expect(panel).toBeHidden();\n\n    await toggle.click();\n    await expect(toggle).toHaveAttribute('aria-expanded', 'true');\n    await expect(toggle).toHaveText('Ocultar dados da unidade');\n    await expect(panel).toBeVisible();\n    await expect(panel.locator('.school-data-item')).toHaveCount(14);\n    await expect(panel.locator('.school-program-list')).toBeVisible();\n\n    await toggle.click();\n    await expect(panel).toBeHidden();\n    await expect(toggle).toHaveAttribute('aria-expanded', 'false');\n\n    const beforeTop = await header.evaluate(element => element.getBoundingClientRect().top);\n    await page.evaluate(() => {\n      const main = document.querySelector('main.content-area');\n      main.scrollTop = Math.min(main.scrollHeight, 700);\n      main.dispatchEvent(new Event('scroll'));\n    });\n    await page.waitForTimeout(50);\n    const after = await page.evaluate(() => {\n      const main = document.querySelector('main.content-area').getBoundingClientRect();\n      const sticky = document.querySelector('.prontuario-school-header').getBoundingClientRect();\n      return { mainTop: main.top, headerTop: sticky.top, headerBottom: sticky.bottom };\n    });\n    expect(Math.abs(after.headerTop - after.mainTop)).toBeLessThanOrEqual(2);\n    expect(after.headerBottom).toBeGreaterThan(after.headerTop);\n    expect(beforeTop).toBeGreaterThanOrEqual(after.mainTop - 2);\n  });\n\n`;
  if (!next.includes(anchor)) throw new Error('Âncora E2E de programas não encontrada');
  next = next.replace(anchor, insert + anchor);
  return next;
});

editFile('tests/e2e/desktop-basic-monitors.spec.js', source => {
  let next = replaceOnce(
    source,
    `    expect(geometry.schoolSidebarDisplay).toBe('grid');\n    expect(geometry.workspaceBelowSummary).toBe(true);`,
    `    expect(geometry.schoolSidebarDisplay).toBe('none');\n    expect(geometry.workspaceBelowSummary).toBe(true);`,
    'monitor 1366 com cadastro recolhido'
  );
  next = replaceOnce(
    next,
    `    await openControllerSchool(page);\n\n    const summaryGeometry = await page.evaluate(() => {`,
    `    await openControllerSchool(page);\n    await page.getByRole('button', { name: 'Exibir dados da unidade', exact: true }).click();\n\n    const summaryGeometry = await page.evaluate(() => {`,
    'monitor 1920 abre resumo sob demanda'
  );
  return next;
});
