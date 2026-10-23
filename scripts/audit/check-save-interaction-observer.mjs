// Positive control for the instrument, deliberately slow HTML; never RADAR runtime.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { installSaveInteractionObserver } from './save-interaction-observer.mjs';

const output = path.resolve(process.env.RADAR_A9_CONTROL_OUTPUT || 'artifacts/a9-native-control');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent('<form id="form-dados-nota"><button type="submit">Salvar Gasto</button></form>');
  await page.evaluate(() => {
    window.RadarApplicationServices = { data: {} };
    document.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const end = performance.now() + 80;
      while (performance.now() < end) { /* Deliberate blocking for instrument validation. */ }
      document.body.dataset.complete = 'true';
    });
  });
  await page.evaluate(installSaveInteractionObserver);
  await page.getByRole('button', { name: 'Salvar Gasto' }).click();
  await page.waitForFunction(() => window.__A9_NATIVE__.sample().events.some(e => e.name === 'click' && e.duration >= 64));
  const result = await page.evaluate(() => window.__A9_NATIVE__.sample());
  assert.equal(result.click.trusted, true);
  assert.equal(result.click.visibility, 'visible');
  assert(result.events.some(e => e.name === 'click' && e.processingEnd - e.processingStart >= 75));
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({
    purpose: 'Instrument positive control, deliberately slow isolated HTML; not RADAR', browser: browser.version(), result
  }, null, 2));
  console.log('Native Event Timing detected deliberate blocking: PASS');
} finally {
  await browser.close();
}
