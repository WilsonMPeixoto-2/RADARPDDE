'use strict';

async function selectFixtureCompetence(page, competenceKey = '2026-05') {
  await page.waitForFunction(() => Boolean(window.RadarCompetenceContext?.isInitialized?.()));
  await page.evaluate(key => {
    window.RadarCompetenceContext.select(key, { source: 'e2e-fixture' });
  }, competenceKey);
}

module.exports = {
  selectFixtureCompetence
};
