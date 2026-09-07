'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');

function source(relative) {
    return fs.readFileSync(path.join(root, relative), 'utf8');
}

function commandWindow(body, needle, width = 700) {
    const index = body.indexOf(needle);
    assert.notEqual(index, -1, `comando ${needle} não localizado`);
    return body.slice(index, index + width);
}

function assertMarkers(relative, needle, markers) {
    const window = commandWindow(source(relative), needle);
    markers.forEach(marker => assert.match(
        window,
        marker,
        `${relative} deve declarar ${marker} no comando ${needle}`
    ));
}

test('serviços declaram autoridade que não pode depender do wrapper de performance', () => {
    const resultAuthoritative = [
        ['src/application/configuration-service.js', "name: 'configuration:save-calendar'"],
        ['src/application/directory-service.js', "name: 'directory:save-program'"],
        ['src/application/directory-service.js', "name: 'directory:deactivate-program'"],
        ['src/application/school-service.js', "name: 'school:assign-controller'"],
        ['src/application/school-service.js', "name: 'school:bulk-assign-controller'"],
        ['src/application/inventory-service.js', "name: 'inventory:update-asset'"],
        ['src/application/inventory-service.js', "name: 'inventory:forward'"],
        ['src/application/inventory-service.js', "name: 'inventory:complete'"],
        ['src/application/inventory-service.js', "name: 'inventory:create'"],
        ['src/application/pendency-service.js', "name: changesVerification ? 'pendency:open-with-analysis' : 'pendency:open'"],
        ['src/application/pendency-service.js', "name: 'pendency:register-attempt'"],
        ['src/application/pendency-service.js', "name: 'pendency:register-contact'"]
    ];
    resultAuthoritative.forEach(([relative, needle]) => {
        assertMarkers(relative, needle, [/remoteResultIsAuthoritative:\s*true/]);
    });

    const pendency = source('src/application/pendency-service.js');
    assert.match(pendency, /return this\.updateStatus\('cancel'/);
    assert.match(pendency, /return this\.updateStatus\('reopen'/);
    assert.match(
        commandWindow(pendency, 'name: `pendency:${operation}`', 450),
        /remoteResultIsAuthoritative:\s*true/,
        'cancelamento e reabertura devem compartilhar o comando autoritativo de updateStatus'
    );

    const commitAuthoritative = [
        ['src/application/school-service.js', "name: 'school:save'"],
        ['src/application/pendency-service.js', "name: 'pendency:reanalyze'"],
        ['src/application/invoice-service.js', "name: 'invoice:update-service-advisory'"]
    ];
    commitAuthoritative.forEach(([relative, needle]) => {
        assertMarkers(relative, needle, [/remoteCommitIsAuthoritative:\s*true/]);
    });
});

test('aplicação incremental fica declarada no núcleo que conhece as entidades alteradas', () => {
    [
        ['src/application/verification-service.js', "name: 'verification:set-bonification'", ['verifications', 'administrativeLogs']],
        ['src/application/verification-service.js', "name: 'verification:set-technical-analysis'", ['verifications', 'administrativeLogs']],
        ['src/application/verification-service.js', "name: 'verification:close-bonification'", ['verifications', 'administrativeLogs']],
        ['src/application/invoice-service.js', "name: 'invoice:update-service-advisory'", ['registeredInvoices', 'verifications', 'administrativeLogs']]
    ].forEach(([relative, needle, entities]) => {
        const window = commandWindow(source(relative), needle, 900);
        assert.match(window, /incrementalStateEntities\s*:/, `${needle} deve declarar incrementalStateEntities`);
        entities.forEach(entity => assert.match(window, new RegExp(`['\"]${entity}['\"]`)));
    });
});

test('criação de exercício declara apenas o histórico append-only como isento de refresh', () => {
    assertMarkers(
        'src/application/configuration-service.js',
        "name: 'configuration:create-exercise'",
        [/remoteRefreshExemptEntities:\s*\[\s*['\"]administrativeLogs['\"]\s*\]/]
    );
});