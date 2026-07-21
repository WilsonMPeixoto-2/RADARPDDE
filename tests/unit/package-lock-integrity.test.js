'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('package-lock é JSON único e alinhado ao package.json', () => {
    const lockSource = fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8');
    const conflictTokens = ['<'.repeat(7), '='.repeat(7), '>'.repeat(7)];
    conflictTokens.forEach(token => assert.equal(lockSource.includes(token), false));

    const packageJson = readJson('package.json');
    const lock = JSON.parse(lockSource);
    const rootPackage = lock.packages && lock.packages[''];

    assert.equal(lock.name, packageJson.name);
    assert.equal(lock.version, packageJson.version);
    assert.equal(lock.lockfileVersion, 3);
    assert.ok(rootPackage, 'Pacote raiz ausente no package-lock.');
    assert.deepEqual(rootPackage.dependencies || {}, packageJson.dependencies || {});
    assert.deepEqual(rootPackage.devDependencies || {}, packageJson.devDependencies || {});
});
