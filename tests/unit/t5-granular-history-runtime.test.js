'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRuntimeConfig } = require('../../config.js');

test('T5 não herda release T4; flag explícita exige toda a cadeia institucional e continua OFF em local/preview', async () => {
    const { buildRuntimeInput } = await import(pathToFileURL(path.resolve(__dirname, '../../scripts/generate-runtime-config.mjs')).href);
    const base = {
        RADAR_DATA_MODE: 'supabase-production', RADAR_ENVIRONMENT: 'production',
        RADAR_SUPABASE_REPOSITORY_ENABLED: 'true', RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'true',
        RADAR_SUPABASE_URL: 'https://example.supabase.co', RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED: 'true', RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED: 'true',
        RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED: 'true', RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED: 'true'
    };
    assert.equal(buildRuntimeInput(base).features.granularHistoryRelease, undefined);
    const input = buildRuntimeInput({ ...base, RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED: 'true' });
    assert.equal(input.features.granularHistoryRelease, true);
    assert.throws(() => buildRuntimeInput({ ...base, RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED: 'false', RADAR_T5_GRANULAR_HISTORY_RELEASE_ENABLED: 'true' }), /T5.*T4/);
    assert.equal(createRuntimeConfig({ ...input, deploymentTarget: 'production' }).features.granularHistoryRelease, true);
    for (const change of [{ deploymentTarget: 'preview' }, { deploymentTarget: '', environment: 'local', dataMode: 'local' },
        { features: { ...input.features, itemHistoryRelease: false } }]) {
        assert.notEqual(createRuntimeConfig({ ...input, deploymentTarget: 'production', ...change }).features.granularHistoryRelease, true);
    }
});
