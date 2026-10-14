'use strict';

// Diagnostic-only E2E: real disposable Supabase/Auth/RLS and browser rendering.
// No Production access, mutations, historical purges or arbitrary time budgets.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
    && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Requires the disposable Production-shaped operational workflow.');
test.describe.configure({ mode: 'serial', retries: 0 });

const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) {
    throw new Error('Disposable Auth fixture credential is missing.');
}

async function twoFrames(page) {
    await page.evaluate(() => new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function ready(page) {
    await page.waitForFunction(() => window.RadarDataContext?.ready === true
        && window.RadarAuthContext?.authorization?.role === 'controller'
        && window.RadarCompetenceContext?.isInitialized?.()
        && window.RadarApplicationServices?.data?.repository?.capabilities?.().remote === true,
    null, { timeout: 45000 });
    await expect(page.locator('#radar-auth-gate')).toBeHidden();
    await expect(page.locator('#app-layout')).toBeVisible();
    await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true);
    await twoFrames(page);
}

async function signIn(page) {
    await page.goto('/');
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await page.locator('#radar-auth-email').fill('operational-1@radar.local');
    await page.locator('#radar-auth-password').fill(password);
    await page.locator('#radar-auth-form button[type="submit"]').click();
    await ready(page);
}

test('mede alternância real entre três competências na mesma escola com volume institucional', async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const faults = [];
    const requests = [];
    page.on('pageerror', error => faults.push(error.message));
    page.on('request', request => {
        if (request.method() !== 'POST') return;
        const match = new URL(request.url()).pathname.match(
            /\\/rest\\/v1\\/rpc\\/(read_(?:school_)?operational_context)$/
        );
        if (!match) return;
        const body = request.postDataJSON() || {};
        requests.push({
            rpc: match[1],
            competence: body.p_competence_id || null,
            schoolScoped: Boolean(body.p_school_id)
        });
    });

    await signIn(page);
    await page.goto('/escolas/OPS-SESSION-1');
    await ready(page);
    await expect(page).toHaveURL(/\\/escolas\\/OPS-SESSION-1/);

    const selector = page.locator('#global-competence-select');
    for (const month of ['2026-08', '2026-09', '2026-10']) {
        await expect(selector.locator('option[value="' + month + '"]')).toHaveCount(1);
    }
    await page.evaluate(() => {
        const store = window.__monthlyPerformanceProbe = {
            longTasks: [], mutations: 0, mainReplacements: 0
        };
        if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            const observer = new PerformanceObserver(list => {
                for (const item of list.getEntries()) store.longTasks.push(item.duration);
            });
            observer.observe({ type: 'longtask', buffered: false });
            store.longTaskObserver = observer;
        }
        const main = document.getElementById('main-container');
        store.mutationObserver = new MutationObserver(items => {
            for (const item of items) {
                store.mutations += 1;
                if (item.type === 'childList' && item.target === main) {
                    store.mainReplacements += 1;
                }
            }
        });
        store.mutationObserver.observe(main, {
            attributes: true, childList: true, subtree: true
        });
    });

    const samples = [];
    try {
        // The fixture contains ten competences with sharply different data volumes.
        // Repeating A -> B -> C -> A reveals cold/warm, routing and visual cost.
        for (const month of ['2026-08', '2026-09', '2026-10', '2026-08', '2026-09', '2026-10']) {
            const before = await page.evaluate(() => {
                const store = window.__monthlyPerformanceProbe;
                return {
                    started: performance.now(),
                    taskIndex: store.longTasks.length,
                    mutations: store.mutations,
                    mainReplacements: store.mainReplacements
                };
            });
            const requestIndex = requests.length;
            await selector.selectOption(month);
            await page.waitForFunction(expected => (
                window.RadarCompetenceContext?.getState?.().activeKey === expected
                && document.getElementById('global-competence-select')?.value === expected
                && document.getElementById('main-container')?.inert !== true
            ), month, { timeout: 30000 });
            await twoFrames(page);
            const after = await page.evaluate(() => {
                const store = window.__monthlyPerformanceProbe;
                return {
                    finished: performance.now(),
                    totalTasks: store.longTasks.length,
                    longTasks: store.longTasks.slice(),
                    mutations: store.mutations,
                    mainReplacements: store.mainReplacements,
                    selectedMonth: document.getElementById('global-competence-select')?.value
                };
            });
            samples.push({
                month,
                elapsedMs: Math.round(after.finished - before.started),
                longTasks: after.totalTasks - before.taskIndex,
                longTaskMs: Math.round(after.longTasks.slice(before.taskIndex).reduce((a, b) => a + b, 0)),
                mutationCallbacks: after.mutations - before.mutations,
                mainReplacements: after.mainReplacements - before.mainReplacements,
                requests: requests.slice(requestIndex)
            });
            expect(after.selectedMonth).toBe(month);
            await expect(page.locator('#app-layout')).toBeVisible();
        }
    } finally {
        await page.evaluate(() => {
            const store = window.__monthlyPerformanceProbe;
            store?.longTaskObserver?.disconnect();
            store?.mutationObserver?.disconnect();
        }).catch(() => undefined);
    }

    // Report-only: a slower result is a diagnosis, not an invitation to relax correctness.
    const report = {
        schemaVersion: 1,
        kind: 'multi-competence-perceived-performance',
        variant: process.env.RADAR_OPERATIONAL_VARIANT || 'unknown',
        simulatedSchools: 163,
        months: samples,
        totalContextRequests: requests.length,
        browserErrors: faults.length
    };
    const directory = path.resolve('test-results/operational-sustained');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory,
        'multi-competence-' + report.variant + '.json'), JSON.stringify(report, null, 2));
    console.log('[operational-multi-competence]', JSON.stringify({
        variant: report.variant,
        summary: samples.map(sample => ({
            month: sample.month,
            elapsedMs: sample.elapsedMs,
            rpcs: sample.requests.length,
            longTaskMs: sample.longTaskMs,
            mutationCallbacks: sample.mutationCallbacks
        }))
    }));
    assertNoBrowserErrors(faults);
});

function assertNoBrowserErrors(errors) {
    expect(errors).toEqual([]);
}
