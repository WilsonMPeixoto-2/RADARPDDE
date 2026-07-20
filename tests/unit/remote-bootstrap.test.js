'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { createSnapshot } = require('../../src/data/snapshot-tools.js');
const {
    IMPORT_ORDER,
    sanitizeBootstrapSnapshot,
    inspectDestination,
    bootstrapRemoteSnapshot
} = require('../../scripts/lib/remote-bootstrap.mjs');

function snapshot(entities = {}) {
    return createSnapshot(entities, {
        importId: 'bootstrap-test',
        exportedAt: '2026-07-20T12:00:00.000Z'
    });
}

function createRepository(destination) {
    const saves = [];
    return {
        saves,
        async exportSnapshot() {
            return destination;
        },
        async save(entity, records) {
            saves.push({ entity, records });
            const byId = new Map((destination.entities[entity] || []).map(row => [row.id, row]));
            records.forEach(row => byId.set(row.id, structuredClone(row)));
            destination.entities[entity] = [...byId.values()];
            return records;
        }
    };
}

test('rejeita snapshot inv\u00e1lido', async () => {
    await assert.rejects(
        bootstrapRemoteSnapshot({ repository: createRepository(snapshot()), snapshot: {} }),
        error => error.code === 'VALIDATION_FAILED'
    );
});

test('rejeita vari\u00e1vel administrativa ausente sem imprimir segredo', () => {
    const root = path.resolve(__dirname, '../..');
    const result = spawnSync(process.execPath, ['scripts/bootstrap-supabase-remote.mjs', 'validate'], {
        cwd: root,
        encoding: 'utf8',
        env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            ComSpec: process.env.ComSpec
        }
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /RADAR_SUPABASE_URL/);
    assert.doesNotMatch(result.stderr, /sb_secret_|service_role|password|access_token/i);
});

test('sanitiza entidades de identidade e auditoria sem alterar dados can\u00f4nicos', () => {
    const source = snapshot({
        profiles: [{ id: 'profile-1', name: 'Perfil operacional' }],
        userProfiles: [{ id: 'user-1', profile_id: 'profile-1' }],
        userSchoolScopes: [{ id: 'scope-1', school_id: 'school-1' }],
        auditEvents: [{ id: 'audit-1' }],
        dataImportRuns: [{ id: 'run-1' }]
    });

    const sanitized = sanitizeBootstrapSnapshot(source);

    assert.deepEqual(sanitized.entities.profiles, source.entities.profiles);
    ['userProfiles', 'userSchoolScopes', 'auditEvents', 'dataImportRuns'].forEach(entity => {
        assert.deepEqual(sanitized.entities[entity], []);
    });
    assert.equal(source.entities.userProfiles.length, 1);
});

test('sanitiza o snapshot exportado pela aplicacao limpa antes de persistir', async () => {
    const { sanitizeLocalSnapshot } = await import('../../scripts/export-local-snapshot.mjs');
    const source = snapshot({
        schools: [{ id: 'school-1', denomination: 'Escola real' }],
        userProfiles: [{ id: 'user-1' }],
        auditEvents: [{ id: 'audit-1' }]
    });

    const sanitized = sanitizeLocalSnapshot(source);

    assert.deepEqual(sanitized.entities.schools, source.entities.schools);
    assert.deepEqual(sanitized.entities.userProfiles, []);
    assert.deepEqual(sanitized.entities.userSchoolScopes, []);
    assert.deepEqual(sanitized.entities.auditEvents, []);
    assert.deepEqual(sanitized.entities.dataImportRuns, []);
});

test('aceita destino vazio ou contendo somente cinco profiles', async () => {
    const profiles = Array.from({ length: 5 }, (_, index) => ({ id: `profile-${index + 1}` }));
    const source = snapshot({ profiles });

    const empty = await inspectDestination(createRepository(snapshot()));
    assert.equal(empty.compatible, true);

    const onlyProfiles = await inspectDestination(createRepository(snapshot({ profiles })), source);
    assert.equal(onlyProfiles.compatible, true);
});

test('valida destino vazio sem escrever nem tratar ausencia como conflito', async () => {
    const source = snapshot({ schools: [{ id: 'school-1' }] });
    const repository = createRepository(snapshot());

    const report = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'validate' });

    assert.equal(report.ok, true);
    assert.equal(report.writtenRows, 0);
    assert.equal(repository.saves.length, 0);
});

test('interrompe em IDs ou conte\u00fado incompat\u00edvel', async () => {
    const source = snapshot({ schools: [{ id: 'school-1', name: 'Escola original' }] });
    const repository = createRepository(snapshot({ schools: [{ id: 'school-1', name: 'Escola divergente' }] }));

    await assert.rejects(
        bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' }),
        error => error.code === 'DESTINATION_CONFLICT'
    );
    assert.equal(repository.saves.length, 0);
});

test('grava na ordem can\u00f4nica em lotes', async () => {
    const source = snapshot({
        schools: [{ id: 'school-1' }, { id: 'school-2' }, { id: 'school-3' }],
        programs: [{ id: 'program-1' }],
        competences: [{ id: 'competence-1' }]
    });
    const repository = createRepository(snapshot());

    await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import', batchSize: 2 });

    assert.deepEqual(repository.saves.map(call => call.entity), [
        ...IMPORT_ORDER.filter(entity => ['competences', 'programs', 'schools'].includes(entity)
            && source.entities[entity]?.length)
            .flatMap(entity => entity === 'schools' ? [entity, entity] : [entity])
    ]);
    assert.deepEqual(repository.saves.map(call => call.records.length), [1, 1, 2, 1]);
});
