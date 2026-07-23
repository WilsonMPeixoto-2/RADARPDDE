'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    resolveControllerId,
    resolveControllerRecord,
    filterControllerAlerts,
    install
} = require('../../src/integration/controller-session-context.js');

test('usa o controllerId autenticado em vez do controlador padrão', () => {
    const controllerId = resolveControllerId({
        authorization: { role: 'controller', controllerId: 'tuane_coutinho' },
        controllers: [
            { id: 'wilson_peixoto', name: 'Wilson Peixoto', active: true },
            { id: 'tuane_coutinho', name: 'Tuane Coutinho', active: true }
        ],
        fallbackId: 'wilson_peixoto'
    });

    assert.equal(controllerId, 'tuane_coutinho');
});

test('mantém o controlador padrão para administrador técnico em modo de simulação', () => {
    const controllerId = resolveControllerId({
        authorization: { role: 'technical_admin', controllerId: null },
        controllers: [{ id: 'wilson_peixoto', active: true }],
        fallbackId: 'wilson_peixoto'
    });

    assert.equal(controllerId, 'wilson_peixoto');
});

test('resolve o nome institucional do controlador autenticado para o rodapé', () => {
    const controller = resolveControllerRecord({
        authorization: { role: 'controller', controllerId: 'tuane_coutinho' },
        user: { email: 'tuane.santos@rioeduca.net' },
        controllers: [{ id: 'tuane_coutinho', name: 'Tuane Coutinho', active: true }],
        fallbackId: 'wilson_peixoto'
    });

    assert.equal(controller.name, 'Tuane Coutinho');
});

test('filtra alertas do controlador para escolas da própria carteira', () => {
    const alerts = filterControllerAlerts({
        alerts: [
            { id: 'wilson-alert', schoolId: '04.31.001' },
            { id: 'tuane-alert', schoolId: '04.11.001' },
            { id: 'global-alert' }
        ],
        schools: [
            { id: '04.31.001', controladorId: 'wilson_peixoto' },
            { id: '04.11.001', controladorId: 'tuane_coutinho' }
        ],
        controllerId: 'tuane_coutinho'
    });

    assert.deepEqual(alerts.map(item => item.id), ['tuane-alert', 'global-alert']);
});

test('instala a resolução autenticada sobre os helpers legados', () => {
    const root = {
        RadarAuthContext: {
            user: { email: 'tuane.santos@rioeduca.net' },
            authorization: {
                role: 'controller',
                controllerId: 'tuane_coutinho',
                profile: { label: 'Controlador' }
            }
        },
        getDefaultControladorId() { return 'wilson_peixoto'; },
        getDefaultControlador() { return { id: 'wilson_peixoto', name: 'Wilson Peixoto' }; },
        getCurrentUser() { return { name: 'Wilson Peixoto', role: 'Controlador' }; },
        getAlerts() {
            return [
                { id: 'wilson-alert', schoolId: '04.31.001' },
                { id: 'tuane-alert', schoolId: '04.11.001' }
            ];
        }
    };

    install(root, {
        getControllers: () => [
            { id: 'wilson_peixoto', name: 'Wilson Peixoto', active: true },
            { id: 'tuane_coutinho', name: 'Tuane Coutinho', active: true }
        ],
        getSchools: () => [
            { id: '04.31.001', controladorId: 'wilson_peixoto' },
            { id: '04.11.001', controladorId: 'tuane_coutinho' }
        ]
    });

    assert.equal(root.getDefaultControladorId(), 'tuane_coutinho');
    assert.equal(root.getDefaultControlador().name, 'Tuane Coutinho');
    assert.equal(root.getCurrentUser().name, 'Tuane Coutinho');
    assert.deepEqual(root.getAlerts().map(item => item.id), ['tuane-alert']);
});