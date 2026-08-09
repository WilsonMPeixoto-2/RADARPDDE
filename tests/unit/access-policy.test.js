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
        assert.equal(policy.hasCapability('sme', capability, 'sme_management'), false, capability);
        assert.equal(policy.hasCapability('sme_management', capability, 'sme_management'), false, capability);
    });

    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_TECHNICAL_ANALYSIS, 'sme_management'), false);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_COMPETENCE_PENDENCIES, 'sme_management'), false);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_OWN_ADMINISTRATIVE_LOGS, 'sme_management'), true);
    assert.equal(policy.hasCapability('sme', CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS, 'sme_management'), false);
});

test('Controlador e Assistente podem reanalisar pendências', () => {
    assert.equal(policy.hasCapability('controlador', CAPABILITIES.REANALYZE_PENDENCY, 'controller'), true);
    assert.equal(policy.hasCapability('assistente', CAPABILITIES.REANALYZE_PENDENCY, 'federal_assistant'), true);

    [
        CAPABILITIES.OPEN_PENDENCY,
        CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
        CAPABILITIES.REGISTER_PENDENCY_CONTACT,
        CAPABILITIES.CANCEL_PENDENCY,
        CAPABILITIES.REOPEN_PENDENCY,
        CAPABILITIES.VIEW_ALL_ADMINISTRATIVE_LOGS
    ].forEach(capability => {
        assert.equal(policy.hasCapability('controlador', capability, 'controller'), true, capability);
        assert.equal(policy.hasCapability('assistente', capability, 'federal_assistant'), true, capability);
    });
});

test('administrador técnico mantém simulação visual sem perder autoridade absoluta', () => {
    assert.equal(policy.resolveEffectiveProfile('sme', 'technical_admin'), 'sme');
    assert.equal(policy.resolveEffectiveProfile('assistente', 'technical_admin'), 'assistente');
    assert.equal(policy.resolveEffectiveProfile('inventario', 'technical_admin'), 'inventario');

    for (const capability of Object.values(CAPABILITIES)) {
        assert.equal(policy.hasCapability('sme', capability, 'technical_admin'), true, capability);
        assert.equal(policy.hasCapability('inventario', capability, 'technical_admin'), true, capability);
    }
});

test('filtro de registros internos usa o UUID autenticado e preserva autoridade do administrador técnico', () => {
    const records = [
        { id: 'own', actorUserId: 'user-own' },
        { id: 'other', actor_user_id: 'user-other' },
        { id: 'legacy', actorUserId: null }
    ];

    assert.deepEqual(
        policy.filterAdministrativeLogs(records, 'sme', 'user-own', 'sme_management').map(item => item.id),
        ['own']
    );
    assert.deepEqual(policy.filterAdministrativeLogs(records, 'sme', '', 'sme_management'), []);
    assert.deepEqual(
        policy.filterAdministrativeLogs(records, 'controlador', 'user-own', 'controller').map(item => item.id),
        ['own', 'other', 'legacy']
    );
    assert.deepEqual(
        policy.filterAdministrativeLogs(records, 'sme', 'user-own', 'technical_admin').map(item => item.id),
        ['own', 'other', 'legacy']
    );
});

test('perfil institucional prevalece para usuários comuns e admin usa somente a simulação visual', () => {
    assert.equal(policy.resolveEffectiveProfile('controlador', 'sme_management'), 'sme');
    assert.equal(policy.resolveEffectiveProfile('sme', 'controller'), 'controlador');
    assert.equal(policy.resolveEffectiveProfile('sme', 'technical_admin'), 'sme');
    assert.equal(policy.resolveEffectiveProfile('assistente', 'technical_admin'), 'assistente');
    assert.equal(policy.resolveEffectiveProfile('sme', ''), 'sme');
});
