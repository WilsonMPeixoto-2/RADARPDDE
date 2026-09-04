'use strict';

const fs = require('node:fs');
const path = require('node:path');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));

function fixtureForProfile(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  return fixture;
}

async function waitForReady(page, profileId) {
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
    && Boolean(window.RadarApplicationServices?.data?.repository)
  ), profileId);
}

async function signInAs(page, profileId) {
  const fixture = fixtureForProfile(profileId);
  const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
  if (!password) throw new Error('RADAR_AUTH_FIXTURE_PASSWORD ausente.');

  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitForReady(page, profileId);
  return fixture;
}

async function reloadAndWait(page, profileId) {
  await page.reload();
  await waitForReady(page, profileId);
}

async function loadEntity(page, entityName) {
  return page.evaluate(async name => (
    window.RadarApplicationServices.data.repository.load(name)
  ), entityName);
}

async function findEntity(page, entityName, expectedFields) {
  return page.evaluate(async ({ name, fields }) => {
    const rows = await window.RadarApplicationServices.data.repository.load(name);
    return rows.find(row => Object.entries(fields).every(([key, value]) => row?.[key] === value)) || null;
  }, { name: entityName, fields: expectedFields });
}

async function countEntity(page, entityName, expectedFields) {
  return page.evaluate(async ({ name, fields }) => {
    const rows = await window.RadarApplicationServices.data.repository.load(name);
    return rows.filter(row => Object.entries(fields).every(([key, value]) => row?.[key] === value)).length;
  }, { name: entityName, fields: expectedFields });
}

module.exports = {
  fixtureForProfile,
  signInAs,
  waitForReady,
  reloadAndWait,
  loadEntity,
  findEntity,
  countEntity
};
