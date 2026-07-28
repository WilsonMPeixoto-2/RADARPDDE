'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const policy = require('../../src/domain/access-policy.js');
const { CAPABILITIES } = policy;

test('Gestão SME mantém consulta sem capacidades de mutação operacional', () => {
    [
        CAPABILITIES.OPEN_PENDENCY,
        CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
        CAPABILITIES.REANALYZE_PENDENCY,
        CAPABILITIES.REGISTER_PENDENCY_CONTACT,
        CAPABILITIES.CANCEL_PENDENCY,
        CAPABILITIES.REOPEN_PENDENCY
    ].forEach(capability => {
        assert.equal(policy.hasCapability('sme', capability), false, capability);
        assert.equal(policy.hasCapability('sme_management', capability), false, capability);
    });

    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_TECHNICAL_ANALYSIS), false);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_COMPETENCE_PENDENCIES), false);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_OWN_ADMINISTRATIVE_LOGS), true);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS), false);
});

test('Controlador e Assistente preservam as capacidades operacionais existentes', () => {
    assert.equal(policy.hasCapability('controlador', CAPABILITIES.REANALYZE_PENDENCY), true);
    assert.equal(policy.hasCapability('assistente', CAPABILITIES.REANALYZE_PENDENCY), false);

    [
        CAPABILITIES.OPEN_PENDENCY,
        CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
        CAPABILITIES.REGISTER_PENDENCY_CONTACT,
        CAPABILITIES.CANCEL_PENDENCY,
        CAPABILITIES.REOPEN_PENDENCY,
        CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS
    ].forEach(capability => {
        assert.equal(policy.hasCapability('controlador', capability), true, capability);
        assert.equal(policy.hasCapability('assistente', capability), true, capability);
    });
});

test('filtro de registros internos usa o UUID autenticado e exclui registros sem autor', () => {
    const records = [
        { id: 'own', actorUserId: 'user-own' },
        { id: 'other', actor_user_id: 'user-other' },
        { id: 'legacy', actorUserId: null }
    ];

    assert.deepEqual(
        policy.filterAdministrativeLogs(records, 'sme', 'user-own').map(item => item.id),
        ['own']
    );
    assert.deepEqual(policy.filterAdministrativeLogs(records, 'sme', ''), []);
    assert.deepEqual(
        policy.filterAdministrativeLogs(records, 'controlador', 'user-own').map(item => item.id),
        ['own', 'other', 'legacy']
    );
});

test('perfil autenticado prevalece e administrador técnico respeita a simulação visual', () => {
    assert.equal(policy.resolveEffectiveProfile('controlador', 'sme_management'), 'sme');
    assert.equal(policy.resolveEffectiveProfile('sme', 'controller'), 'controlador');
    assert.equal(policy.resolveEffectiveProfile('sme', 'technical_admin'), 'sme');
    assert.equal(policy.resolveEffectiveProfile('assistente', 'technical_admin'), 'assistente');
    assert.equal(policy.resolveEffectiveProfile('sme', ''), 'sme');
});
