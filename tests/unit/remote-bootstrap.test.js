'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { createSnapshot } = require('../../src/data/snapshot-tools.js');
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');
const {
    IMPORT_ORDER,
    PROFILE_BASELINE,
    sanitizeBootstrapSnapshot,
    inspectDestination,
    bootstrapRemoteSnapshot
} = require('../../scripts/lib/remote-bootstrap.mjs');

function snapshot(entities = {}) {
    return createSnapshot(Object.fromEntries(RADAR_ENTITIES.map(entity => [entity, entities[entity] || []])), {
        importId: 'bootstrap-test',
        exportedAt: '2026-07-20T12:00:00.000Z'
    });
}

function createRepository(destination) {
    const inserts = [];
    return {
        inserts,
        async exportSnapshot() {
            return destination;
        },
        async save() {
            throw new Error('NORMAL_SAVE_NOT_ALLOWED');
        },
        async insertOnly(entity, records) {
            inserts.push({ entity, records });
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

test('exige versao 1, as 19 colecoes e referencias canonicas antes de escrever', async () => {
    const repository = createRepository(snapshot());
    const wrongVersion = snapshot();
    wrongVersion.version = '2';
    const wrongSchema = snapshot();
    wrongSchema.schemaVersion = '2';
    const incomplete = snapshot();
    delete incomplete.entities.schools;
    const orphan = snapshot({ schools: [{ id: 'school-1', controller_id: 'controller-inexistente' }] });

    for (const invalid of [wrongVersion, wrongSchema, incomplete, orphan]) {
        await assert.rejects(
            bootstrapRemoteSnapshot({ repository, snapshot: invalid, mode: 'import' }),
            error => error.code === 'VALIDATION_FAILED'
        );
    }
    assert.equal(repository.inserts.length, 0);
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
    const profiles = PROFILE_BASELINE.map(profile => ({
        ...profile,
        row_version: 1,
        created_at: '2026-07-20T12:00:00.000Z',
        updated_at: '2026-07-20T12:00:00.000Z'
    }));
    const source = snapshot();

    const empty = await inspectDestination(createRepository(snapshot()));
    assert.equal(empty.compatible, true);

    const onlyProfiles = await inspectDestination(createRepository(snapshot({ profiles })), source);
    assert.equal(onlyProfiles.compatible, true);

    const altered = structuredClone(profiles);
    altered[0].label = 'Perfil alterado';
    await assert.rejects(
        inspectDestination(createRepository(snapshot({ profiles: altered })), source),
        error => error.code === 'DESTINATION_CONFLICT'
    );
});

test('valida destino vazio sem escrever nem tratar ausencia como conflito', async () => {
    const source = snapshot({ schools: [{ id: 'school-1' }] });
    const repository = createRepository(snapshot());

    const report = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'validate' });

    assert.equal(report.ok, true);
    assert.equal(report.writtenRows, 0);
    assert.equal(repository.inserts.length, 0);
});

test('interrompe em IDs ou conte\u00fado incompat\u00edvel', async () => {
    const source = snapshot({ schools: [{ id: 'school-1', name: 'Escola original' }] });
    const repository = createRepository(snapshot({ schools: [{ id: 'school-1', name: 'Escola divergente' }] }));

    await assert.rejects(
        bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' }),
        error => error.code === 'DESTINATION_CONFLICT'
    );
    assert.equal(repository.inserts.length, 0);
});

test('grava na ordem can\u00f4nica em lotes', async () => {
    const source = snapshot({
        schools: [{ id: 'school-1' }, { id: 'school-2' }, { id: 'school-3' }],
        programs: [{ id: 'program-1' }],
        competences: [{ id: 'competence-1' }]
    });
    const repository = createRepository(snapshot());

    await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import', batchSize: 2 });

    assert.deepEqual(repository.inserts.map(call => call.entity), [
        ...IMPORT_ORDER.filter(entity => ['competences', 'programs', 'schools'].includes(entity)
            && source.entities[entity]?.length)
            .flatMap(entity => entity === 'schools' ? [entity, entity] : [entity])
    ]);
    assert.deepEqual(repository.inserts.map(call => call.records.length), [1, 1, 2, 1]);
});

test('reconcile divergente rejeita com codigo seguro', async () => {
    const source = snapshot({ schools: [{ id: 'school-1' }] });
    await assert.rejects(
        bootstrapRemoteSnapshot({ repository: createRepository(snapshot()), snapshot: source, mode: 'reconcile' }),
        error => error.code === 'RECONCILIATION_FAILED'
    );
});
