// Audit-only: reuse the existing main InventoryService harness; no database/network.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const repo = path.resolve(process.argv[2]);
const filename = path.join(repo, 'tests/unit/inventory-service.test.js');
const source = fs.readFileSync(filename, 'utf8');
const harnessModule = new Module(filename);
harnessModule.filename = filename;
harnessModule.paths = Module._nodeModulePaths(path.dirname(filename));
harnessModule._compile(source.slice(0, source.indexOf("test('")) + '\nmodule.exports = createHarness;', filename);
(async () => {
    const harness = harnessModule.exports();
    const transitions = [harness.state.assets[0].status];
    await harness.service.forward({ assetId: 'bem-1', profile: 'controlador' });
    transitions.push(harness.state.assets[0].status);
    await harness.service.forward({ assetId: 'bem-1', profile: 'controlador' });
    transitions.push(harness.state.assets[0].status);
    assert.deepEqual(transitions, ['Não encaminhada', 'Encaminhada', 'Encaminhada']);
    const terminal = harnessModule.exports();
    terminal.state.assets[0].status = 'Inventariada';
    await assert.rejects(terminal.service.forward({ assetId: 'bem-1', profile: 'controlador' }),
        error => error.code === 'ASSET_ALREADY_INVENTORIED');
    assert.equal(terminal.state.assets[0].status, 'Inventariada');
    assert.equal(terminal.persisted.length, 0);
    assert.equal(terminal.state.logs.length, 0);
    console.log(JSON.stringify({ transitions, legitimatePersists: harness.persisted.length,
        terminalStatus: terminal.state.assets[0].status, terminalPersists: terminal.persisted.length,
        terminalLogs: terminal.state.logs.length }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
