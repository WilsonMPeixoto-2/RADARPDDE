'use strict';

const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
  && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável e as identidades da jornada operacional.');
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) throw new Error('Credencial efêmera de teste incompleta.');
const variant = process.env.RADAR_OPERATIONAL_VARIANT || 'candidate';
const candidate = variant === 'candidate';

const competence = '2026-08';
const school = index => `OPS-SESSION-${index}`;
const extCCRow = page => page.locator(
  '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
);

async function ready(page, expectedRole) {
  await page.waitForFunction(role => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === role
    && Boolean(window.RadarApplicationServices?.verifications), expectedRole);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await expect(page.locator('#app-layout')).toBeVisible();
}

async function signIn(page, email, schoolId, role = 'controller') {
  await page.goto('/');
  const runtime = await page.evaluate(() => ({
    environment: window.RADAR_PDDE_RUNTIME_INPUT?.environment,
    dataMode: window.RADAR_PDDE_RUNTIME_INPUT?.dataMode,
    url: window.RADAR_PDDE_RUNTIME_INPUT?.supabase?.url
  }));
  expect(runtime.environment).toBe('test');
  expect(runtime.dataMode).toBe('supabase-preview');
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(runtime.url).hostname);
  await page.locator('#radar-auth-email').fill(email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page, role);
  await page.goto(`/escolas/${schoolId}`);
  await ready(page, role);
  await page.locator('#global-competence-select').selectOption(competence);
  await expect(extCCRow(page)).toBeVisible();
  await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true
    && window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED');
  page.on('dialog', dialog => dialog.accept());
}

async function setDelivery(page, value) {
  await extCCRow(page).getByRole('button', { name: value, exact: true }).click();
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
  await expect(extCCRow(page).getByRole('button', { name: value, exact: true }))
    .toHaveClass(value === 'Sim' ? /active-sim/ : /active-nao/);
}

async function currentDelivery(page) {
  return extCCRow(page).locator('button.active-sim, button.active-nao, button.active-na')
    .first().innerText();
}

async function navigateSchool(page, index) {
  await page.locator('#nav-escolas').click();
  await page.getByRole('row').filter({ hasText: `Jornada operacional ${index}` })
    .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/escolas/OPS-SESSION-${index}(?:[/?#]|$)`));
  await expect(extCCRow(page)).toBeVisible();
}

function observeContextReads(page) {
  let reads = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/rest/v1/rpc/read_operational_context') reads += 1;
  });
  return () => reads;
}

test('mudança em outra escola não interrompe o Prontuário atual e é buscada ao navegar para ela', async ({ browser }) => {
  test.setTimeout(180000);
  const writerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const observerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const writer = await writerContext.newPage();
  const observer = await observerContext.newPage();
  try {
    await Promise.all([
      signIn(writer, 'operational-2@radar.local', school(2)),
      signIn(observer, 'operational-1@radar.local', school(1))
    ]);
    const getReads = observeContextReads(observer);
    const beforeA = await currentDelivery(observer);
    const beforeB = await currentDelivery(writer);
    const targetB = beforeB === 'Sim' ? 'Não' : 'Sim';

    await setDelivery(writer, targetB);

    await new Promise(resolve => setTimeout(resolve, 8000));
    expect(await currentDelivery(observer)).toBe(beforeA);
    const unrelatedReads = getReads();
    if (candidate) {
      expect(unrelatedReads, 'candidato não deve baixar contexto completo por alteração conhecida de outra escola').toBe(0);
    } else {
      expect(unrelatedReads,
        'baseline publicado deve documentar a releitura cruzada que o candidato pretende eliminar').toBeGreaterThan(0);
    }

    const readsBeforeNavigation = getReads();
    await navigateSchool(observer, 2);
    await expect(extCCRow(observer).getByRole('button', { name: targetB, exact: true }))
      .toHaveClass(targetB === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    const navigationReads = getReads() - readsBeforeNavigation;
    if (candidate) {
      expect(navigationReads,
        'ao entrar na escola alterada o candidato deve buscar a versão atual automaticamente').toBe(1);
    } else {
      expect(navigationReads,
        'baseline pode já ter baixado o contexto alheio antes da navegação, mas não deve criar uma tempestade adicional')
        .toBeLessThanOrEqual(1);
    }
  } finally {
    await Promise.all([writerContext.close(), observerContext.close()]);
  }
});

test('Assistente e Controlador na mesma escola recebem a correção automaticamente sem perder o contexto de trabalho', async ({ browser }) => {
  test.setTimeout(180000);
  const controllerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const assistantContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const controller = await controllerContext.newPage();
  const assistant = await assistantContext.newPage();
  try {
    await Promise.all([
      signIn(controller, 'operational-1@radar.local', school(1), 'controller'),
      signIn(assistant, 'operational-assistant@radar.local', school(1), 'federal_assistant')
    ]);
    const getReads = observeContextReads(controller);
    const before = await currentDelivery(assistant);
    const target = before === 'Sim' ? 'Não' : 'Sim';
    const focused = extCCRow(controller).getByRole('button', { name: 'Sim', exact: true });
    await focused.focus();
    await expect(focused).toBeFocused();

    await setDelivery(assistant, target);

    await expect(extCCRow(controller).getByRole('button', { name: target, exact: true }))
      .toHaveClass(target === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    expect(getReads(), 'mesma escola precisa convergir sem tempestade de leituras').toBeLessThanOrEqual(1);
    const focus = await controller.evaluate(() => {
      const element = document.activeElement;
      const row = element?.closest?.('[data-program-id="BASIC"][data-document-key="extCC"]');
      return { inRow: Boolean(row), text: String(element?.innerText || '').trim() };
    });
    expect(focus).toEqual({ inRow: true, text: 'Sim' });
  } finally {
    await Promise.all([controllerContext.close(), assistantContext.close()]);
  }
});

test('pico realista: seis Controladores alteram seis escolas diferentes sem provocar releituras cruzadas completas', async ({ browser }) => {
  test.setTimeout(240000);
  const contexts = await Promise.all(Array.from({ length: 6 }, () => browser.newContext({
    viewport: { width: 1440, height: 900 }
  })));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  try {
    await Promise.all(pages.map((page, index) => signIn(
      page,
      `operational-${index + 1}@radar.local`,
      school(index + 1),
      'controller'
    )));
    const getReads = pages.map(page => observeContextReads(page));

    const writer = async (page, offset) => {
      for (let round = 0; round < 12; round += 1) {
        const value = (round + offset) % 2 === 0 ? 'Sim' : 'Não';
        await setDelivery(page, value);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    };
    await Promise.all(pages.map((page, index) => writer(page, index)));

    // Dá tempo para qualquer atualização remota agendada se manifestar. Cada
    // pessoa continuou na própria escola; mudanças alheias não justificam uma
    // leitura completa do contexto enquanto essa tela continua em uso.
    await new Promise(resolve => setTimeout(resolve, 8000));
    const reads = getReads.map(read => read());
    if (candidate) {
      expect(reads, 'escritas em cinco outras escolas não devem multiplicar leituras completas em cada sessão')
        .toEqual([0, 0, 0, 0, 0, 0]);
    } else {
      expect(reads.some(value => value > 0),
        'baseline publicado deve tornar visível a amplificação cruzada que motivou esta correção').toBe(true);
    }

    // Convergência continua obrigatória: ao entrar depois em uma escola alterada,
    // o usuário deve receber o estado atual sem Ctrl+F5.
    const readsBeforeNavigation = getReads[0]();
    const expectedSchool6 = await currentDelivery(pages[5]);
    await navigateSchool(pages[0], 6);
    await expect(extCCRow(pages[0]).getByRole('button', { name: expectedSchool6, exact: true }))
      .toHaveClass(expectedSchool6 === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    const navigationReads = getReads[0]() - readsBeforeNavigation;
    if (candidate) expect(navigationReads).toBe(1);
    else expect(navigationReads).toBeLessThanOrEqual(1);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

test('candidato bloqueia edição ao abrir escola conhecida como alterada até a reconciliação terminar', async ({ browser }) => {
  test.skip(!candidate, 'Proteção de escola adiada pertence somente ao candidato #407.');
  test.setTimeout(180000);
  const writerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const observerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const writer = await writerContext.newPage();
  const observer = await observerContext.newPage();
  let releaseRead;
  let readStarted = false;
  let blockedWriteRequests = 0;
  try {
    await Promise.all([
      signIn(writer, 'operational-2@radar.local', school(2)),
      signIn(observer, 'operational-1@radar.local', school(1))
    ]);
    const beforeB = await currentDelivery(writer);
    const targetB = beforeB === 'Sim' ? 'Não' : 'Sim';
    await setDelivery(writer, targetB);
    await new Promise(resolve => setTimeout(resolve, 500));

    const readBarrier = new Promise(resolve => { releaseRead = resolve; });
    await observer.route('**/rest/v1/rpc/read_operational_context', async route => {
      readStarted = true;
      await readBarrier;
      await route.continue();
    });
    observer.on('request', request => {
      if (new URL(request.url()).pathname === '/rest/v1/rpc/save_verification_with_log') {
        blockedWriteRequests += 1;
      }
    });

    await navigateSchool(observer, 2);
    await expect.poll(() => readStarted, { timeout: 5000 }).toBe(true);
    await expect(observer.locator('#main-container'))
      .toHaveAttribute('data-radar-deferred-sync-gate', 'true');
    await expect(observer.locator('#main-container')).toHaveAttribute('aria-busy', 'true');

    // A tela antiga de B pode estar visível enquanto a leitura está propositalmente
    // presa. Clicar nela não pode gerar uma gravação sobre esse estado antigo.
    const staleValue = await currentDelivery(observer);
    const attemptedValue = staleValue === 'Sim' ? 'Não' : 'Sim';
    await extCCRow(observer).getByRole('button', { name: attemptedValue, exact: true }).click({ force: true });
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(blockedWriteRequests).toBe(0);

    releaseRead();
    await expect(extCCRow(observer).getByRole('button', { name: targetB, exact: true }))
      .toHaveClass(targetB === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    await expect(observer.locator('#main-container'))
      .not.toHaveAttribute('data-radar-deferred-sync-gate', 'true');
    await expect(observer.locator('#main-container')).not.toHaveAttribute('aria-busy', 'true');
  } finally {
    releaseRead?.();
    await Promise.all([writerContext.close(), observerContext.close()]);
  }
});