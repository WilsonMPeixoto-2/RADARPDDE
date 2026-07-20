'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createSnapshot } = require('../../src/data/snapshot-tools.js');
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');
const {
    PROFILE_BASELINE,
    bootstrapRemoteSnapshot
} = require('../../scripts/lib/remote-bootstrap.mjs');

function snapshot(entities = {}) {
    return createSnapshot(Object.fromEntries(RADAR_ENTITIES.map(entity => [
        entity,
        entities[entity] || []
    ])), {
        importId: 'sanitized-destination-test',
        exportedAt: '2026-07-20T12:00:00.000Z'
    });
}

function repositoryFor(destination) {
    return {
        async exportSnapshot() {
            return structuredClone(destination);
        },
        async insertOnly() {
            throw new Error('WRITES_NOT_EXPECTED');
        }
    };
}

test('ignora identidades e auditorias remotas que o bootstrap de dados não controla', async () => {
    const school = { id: 'school-1', denomination: 'Escola real' };
    const source = snapshot({ schools: [school] });
    const destination = snapshot({
        profiles: PROFILE_BASELINE.map(profile => ({
            ...profile,
            row_version: 1,
            created_at: '2026-07-20T12:00:00.000Z',
            updated_at: '2026-07-20T12:00:00.000Z'
        })),
        schools: [{
            ...school,
            row_version: 1,
            created_at: '2026-07-20T12:00:00.000Z',
            updated_at: '2026-07-20T12:00:00.000Z'
        }],
        userProfiles: [{
            id: 'profile-link-1',
            user_id: 'auth-user-1',
            profile_id: 'technical_admin',
            controller_id: null,
            inventory_member_id: null,
            cre_scope: '4ª CRE',
            active: true
        }],
        userSchoolScopes: [{
            id: 'scope-1',
            user_id: 'auth-user-1',
            school_id: 'school-1',
            can_write: true
        }],
        auditEvents: [{ id: 'audit-1', table_name: 'schools' }],
        dataImportRuns: [{ id: 'run-1', status: 'completed' }]
    });

    const validated = await bootstrapRemoteSnapshot({
        repository: repositoryFor(destination),
        snapshot: source,
        mode: 'validate'
    });
    const reconciled = await bootstrapRemoteSnapshot({
        repository: repositoryFor(destination),
        snapshot: source,
        mode: 'reconcile'
    });

    assert.equal(validated.ok, true);
    assert.equal(reconciled.ok, true);
    assert.equal(reconciled.reconciliation.ok, true);
});
