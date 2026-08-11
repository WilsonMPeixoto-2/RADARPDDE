'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.resolve(__dirname, '../../src/integration/shared-interactions.js');

function loadApi() {
    if (!fs.existsSync(modulePath)) return {};
    delete require.cache[modulePath];
    return require(modulePath);
}

test('expõe o contrato compartilhado de desativação de controladores', () => {
    const api = loadApi();

    assert.equal(typeof api.buildControllerDeactivationModel, 'function');
    assert.equal(typeof api.validateControllerRecipient, 'function');
    assert.equal(typeof api.normalizeControllerRecords, 'function');
    assert.equal(typeof api.formatControllerDeactivationSuccess, 'function');
});

test('bloqueia a desativação enquanto houver escolas vinculadas', () => {
    const api = loadApi();
    const model = api.buildControllerDeactivationModel({
        controller: { id: 'alzira', name: 'Alzira de Souza', active: true },
        controllers: [
            { id: 'alzira', name: 'Alzira de Souza', active: true },
            { id: 'erica', name: 'Érika Reis', active: true },
            { id: 'monica', name: 'Mônica Chagas', active: true },
            { id: 'inativa', name: 'Pessoa Inativa', active: false }
        ],
        schoolCount: 13
    });

    assert.deepEqual(model.candidates.map(item => item.id), ['erica', 'monica']);
    assert.equal(model.canDeactivate, false);
    assert.equal(model.requiresRecipient, false);
    assert.equal(model.confirmLabel, 'Desativar controladora');
});

test('permite desativar sem destinatário quando não há escolas vinculadas', () => {
    const api = loadApi();
    const model = api.buildControllerDeactivationModel({
        controller: { id: 'alzira', name: 'Alzira de Souza', active: true },
        controllers: [
            { id: 'alzira', name: 'Alzira de Souza', active: true },
            { id: 'erica', name: 'Érika Reis', active: true }
        ],
        schoolCount: 0
    });

    assert.equal(model.canDeactivate, true);
    assert.equal(model.confirmLabel, 'Desativar controladora');
    assert.equal(api.validateControllerRecipient(model, ''), null);
});

test('corrige apenas o nome legado de Érika Reis e preserva os demais registros', () => {
    const api = loadApi();
    const original = [
        { id: 'erica', name: 'Érica', email: 'institucional@rio.gov.br', active: true },
        { id: 'monica', name: 'Mônica Chagas', email: '', active: true }
    ];

    const normalized = api.normalizeControllerRecords(original);

    assert.equal(normalized[0].name, 'Érika Reis');
    assert.equal(normalized[1].name, 'Mônica Chagas');
    assert.notEqual(normalized, original);
    assert.equal(original[0].name, 'Érica');
});

test('produz feedback de sucesso com pessoa e quantidade transferida', () => {
    const api = loadApi();

    assert.equal(
        api.formatControllerDeactivationSuccess({
            controllerName: 'Alzira de Souza',
            recipientName: 'Érika Reis',
            schoolCount: 13
        }),
        'Alzira de Souza foi desativada. 13 escolas foram transferidas para Érika Reis.'
    );
});
