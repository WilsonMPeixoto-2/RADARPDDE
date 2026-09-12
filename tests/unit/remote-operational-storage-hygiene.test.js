'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridge = require('../../src/data/state-bridge-metadata.js');

function storage(seed = {}) {
    const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
    return {
        get length() {
            return values.size;
        },
        key(index) {
            return [...values.keys()][index] ?? null;
        },
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        dump() {
            return Object.fromEntries(values);
        }
    };
}

test('higiene remota remove apenas estado operacional legado e cópias canônicas obsoletas', () => {
    assert.equal(typeof bridge.clearPersistentOperationalCache, 'function');
    const target = storage({
        radar_pdde_escolas: '[{"id":"stale"}]',
        radar_pdde_pendencias: '[{"id":"p1"}]',
        radar_pdde_logs: '[{"id":"l1"}]',
        radar_pdde_bridge_metadata: '{"version":"1"}',
        radar_pdde_data_version: 'old',
        radar_pdde_pendency_schema_version: 'old',
        'radar_pdde_repository:schools': '[{"id":"canonical-stale"}]',
        'radar_pdde_repository:administrativeLogs': '[{"id":"canonical-log"}]',
        radar_pdde_theme: 'dark',
        radar_pdde_user_preference: 'compact',
        unrelated_key: 'keep'
    });

    const result = bridge.clearPersistentOperationalCache(target);
    const remaining = target.dump();

    assert.equal(remaining.radar_pdde_escolas, undefined);
    assert.equal(remaining.radar_pdde_pendencias, undefined);
    assert.equal(remaining.radar_pdde_logs, undefined);
    assert.equal(remaining.radar_pdde_bridge_metadata, undefined);
    assert.equal(remaining.radar_pdde_data_version, undefined);
    assert.equal(remaining.radar_pdde_pendency_schema_version, undefined);
    assert.equal(remaining['radar_pdde_repository:schools'], undefined);
    assert.equal(remaining['radar_pdde_repository:administrativeLogs'], undefined);
    assert.equal(remaining.radar_pdde_theme, 'dark');
    assert.equal(remaining.radar_pdde_user_preference, 'compact');
    assert.equal(remaining.unrelated_key, 'keep');
    assert.ok(result.removed.includes('radar_pdde_escolas'));
});

test('ponte aplica a higiene automaticamente apenas quando o runtime Supabase está ativo', () => {
    const source = fs.readFileSync(
        path.join(__dirname, '../../src/data/state-bridge-metadata.js'),
        'utf8'
    );

    assert.match(source, /RadarRepositoryFactory\?\.isSupabaseExplicitlyEnabled/);
    assert.match(source, /api\.clearPersistentOperationalCache\?\.\(root\.localStorage\)/);
});
