'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { fixtureForProfile } = require('../support/real-use-supabase.js');

test('resolve fixture ativa por perfil funcional', () => {
  assert.equal(fixtureForProfile('controller').profileId, 'controller');
  assert.equal(fixtureForProfile('federal_assistant').profileId, 'federal_assistant');
  assert.equal(fixtureForProfile('inventory').profileId, 'inventory');
  assert.equal(fixtureForProfile('sme_management').profileId, 'sme_management');
  assert.throws(
    () => fixtureForProfile('missing-profile'),
    /Fixture ativa ausente para missing-profile/
  );
});