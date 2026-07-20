'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');

const COUNTS = Object.freeze({
    appConfig: 1,
    programs: 8,
    controllers: 5,
    inventoryTeamMembers: 3,
    competences: 12,
    schools: 163,
    schoolPrograms: 430
});

test('gera importação retomável sem sobrescrita ou exclusão', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-canonical-import-'));
    const snapshotPath = path.join(directory, 'snapshot.json');
    const sqlPath = path.join(directory, 'import.sql');
    const summaryPath = path.join(directory, 'summary.json');
    const entities = Object.fromEntries(RADAR_ENTITIES.map(entity => [
        entity,
        Array.from({ length: COUNTS[entity] || 0 }, (_, index) => ({ id: `${entity}-${index}` }))
    ]));
    fs.writeFileSync(snapshotPath, JSON.stringify({
        format: 'radar-pdde-snapshot',
        version: '1',
        importId: 'test-canonical-import',
        exportedAt: '2026-07-20T00:00:00.000Z',
        entities
    }));

    const result = spawnSync(process.execPath, ['scripts/ops/build-canonical-import-sql.mjs'], {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        env: {
            ...process.env,
            RADAR_SNAPSHOT_FILE: snapshotPath,
            RADAR_IMPORT_SQL_FILE: sqlPath,
            RADAR_IMPORT_SUMMARY_FILE: summaryPath
        }
    });

    assert.equal(result.status, 0, result.stderr);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    assert.match(sql, /where not exists\(select 1 from public\.schools/);
    assert.match(sql, /DESTINATION_CONFLICT:schools/);
    assert.match(sql, /POST_DATA_MISMATCH:school_programs/);
    assert.doesNotMatch(sql, /\bdelete\b|\bupdate\b|on conflict/i);
    assert.equal(summary.ok, true);
    assert.equal(summary.counts.schools, 163);
    assert.equal(summary.counts.schoolPrograms, 430);
});
