'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSnapshot } = require('../../src/data/snapshot-tools.js');

function run(args, cwd) {
    return spawnSync(process.execPath, [path.resolve('scripts/migration-cli.mjs'), ...args], {
        cwd,
        encoding: 'utf8'
    });
}

test('CLI planeja e executa fluxo local sem imprimir registros integrais', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-migration-cli-'));
    const snapshotPath = path.join(cwd, 'snapshot.json');
    const statePath = path.join(cwd, 'target-state.json');
    const checkpointDir = path.join(cwd, 'checkpoints');
    const snapshot = createSnapshot({
        competences: [{ id: '2028-01', label: 'Janeiro 2028', exercise: 2028 }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        appConfig: [{ id: 'global', exercises: ['2028'], closing_competence: '2028-01', settings: {} }],
        schools: [{ id: 'school-secret-id', designation: '04.99.001', denomination: 'Escola Sigilosa', cre: '4ª CRE' }],
        schoolPrograms: [{ id: 'sp1', school_id: 'school-secret-id', program_id: 'BASIC', active: true }]
    }, { importId: 'cli-test', version: '1', exportedAt: '2026-07-14T12:00:00.000Z' });
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

    const plan = run(['plan', '--snapshot', snapshotPath], path.resolve('.'));
    assert.equal(plan.status, 0, plan.stderr);
    assert.match(plan.stdout, /"importId": "cli-test"/);
    assert.equal(plan.stdout.includes('Escola Sigilosa'), false);
    assert.equal(plan.stdout.includes('school-secret-id'), false);

    const imported = run([
        'import:local', '--snapshot', snapshotPath,
        '--state', statePath, '--checkpoints', checkpointDir
    ], path.resolve('.'));
    assert.equal(imported.status, 0, imported.stderr);
    assert.match(imported.stdout, /"status": "reconciled"/);
    assert.equal(imported.stdout.includes('Escola Sigilosa'), false);

    const rolledBack = run([
        'rollback', '--import-id', 'cli-test',
        '--state', statePath, '--checkpoints', checkpointDir
    ], path.resolve('.'));
    assert.equal(rolledBack.status, 0, rolledBack.stderr);
    assert.match(rolledBack.stdout, /"status": "rolled_back"/);
});
