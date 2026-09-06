// Audit-only. A synthetic command invokes the real browser DataService after the real bootstrap.
// Local demo runtime only; network requests outside localhost are blocked.
const path = require('node:path');
const assert = require('node:assert/strict');
const repo = path.resolve(process.argv[2]);
const { chromium } = require(path.join(repo, 'node_modules/playwright'));
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
                ? route.continue() : route.abort();
        });
        await page.goto('http://127.0.0.1:4177/');
        await page.waitForFunction(() => window.RadarApplicationServices && window.RadarOperationalWriteFeedback);
        await page.evaluate(() => window.RadarProductExtensionsReady);
        const result = await page.evaluate(async () => {
            const ds = window.RadarApplicationServices.invoices.dataService;
            const notice = document.getElementById('pendency-notice');
            const capabilities = ds.repository.capabilities();
            if (capabilities.remote) throw new Error('Audit requires local demo runtime');
            notice.hidden = true;
            notice.textContent = '';
            let persistCalls = 0;
            const result = await ds.execute({ name: 'invoice:save', changedEntities: ['schools'],
                mutate: () => ({ auditOnly: true }), persist: async () => { persistCalls++; return {}; } });
            return { capabilities, persistCalls, resultOk: result.ok,
                ownExecute: Object.hasOwn(ds, 'execute'),
                performanceInstalled: ds.__radarOperationalWritePerformance === true,
                feedbackPrototypeInstalled: Object.getPrototypeOf(ds).__radarOperationalSaveFeedbackWrapped === true,
                executeName: ds.execute.name, notice: { hidden: notice.hidden, text: notice.textContent } };
        });
        assert.equal(result.persistCalls, 1);
        assert.equal(result.performanceInstalled, true);
        assert.equal(result.feedbackPrototypeInstalled, true);
        assert.equal(result.notice.hidden, true);
        console.log(JSON.stringify(result, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
