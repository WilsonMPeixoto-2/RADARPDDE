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

function technicalBootstrapLog() {
    return {
        id: 'bootstrap-technical-admin-auth-user-1',
        school_id: null,
        actor_user_id: 'auth-user-1',
        user_identifier: 'technical_admin',
        profile_name: 'technical_admin',
        action: 'Bootstrap do administrador técnico',
        details: { source: 'remote-admin-bootstrap', request_id: 'request-1' }
    };
}

test('ignora identidades e auditorias técnicas que o bootstrap de dados não controla', async () => {
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
        administrativeLogs: [technicalBootstrapLog()],
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

test('continua rejeitando logs administrativos funcionais ausentes na fonte', async () => {
    const source = snapshot({});
    const destination = snapshot({
        profiles: PROFILE_BASELINE,
        administrativeLogs: [{
            id: 'functional-log-1',
            school_id: null,
            actor_user_id: null,
            user_identifier: 'operador',
            profile_name: 'controller',
            action: 'Alteração funcional',
            details: { source: 'application' }
        }]
    });

    await assert.rejects(
        bootstrapRemoteSnapshot({
            repository: repositoryFor(destination),
            snapshot: source,
            mode: 'validate'
        }),
        error => error.code === 'DESTINATION_CONFLICT'
    );
});
