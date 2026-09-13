'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dataService = require('../../src/application/data-service.js');

const root = path.join(__dirname, '../..');
const dataServiceSource = fs.readFileSync(
    path.join(root, 'src/application/data-service.js'),
    'utf8'
);
const performanceSource = fs.readFileSync(
    path.join(root, 'src/integration/operational-write-performance.js'),
    'utf8'
);

test('DataService limita isenção de refresh às entidades realmente append-only', () => {
    assert.deepEqual(dataService.REMOTE_REFRESH_EXEMPT_ENTITIES, [
        'administrativeLogs',
        'auditEvents'
    ]);
    assert.equal(Object.isFrozen(dataService.REMOTE_REFRESH_EXEMPT_ENTITIES), true);
});

test('DataService cruza a declaração do comando com a whitelist global antes de isentar refresh', () => {
    assert.match(dataServiceSource, /allowedRefreshExemptEntities\.has\(entity\)/);
    assert.match(dataServiceSource, /changedEntities\.includes\(entity\)/);
    assert.match(dataServiceSource, /REMOTE_REFRESH_EXEMPT_ENTITIES/);
});

test('módulo de performance não possui mais autoridade sobre refresh', () => {
    assert.doesNotMatch(performanceSource, /remoteRefreshExemptEntities/);
    assert.doesNotMatch(performanceSource, /ALLOWED_REFRESH_EXEMPT_ENTITIES/);
    assert.doesNotMatch(performanceSource, /REFRESH_EXEMPT_ENTITIES_BY_COMMAND/);
});
