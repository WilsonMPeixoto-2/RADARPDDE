'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ROLE_TO_LEGACY_PROFILE,
    legacyProfileForRole
} = require('../../src/integration/auth-gate.js');

test('mapeia os cinco perfis institucionais sem permitir papel desconhecido', () => {
    assert.deepEqual(ROLE_TO_LEGACY_PROFILE, {
        controller: 'controlador',
        federal_assistant: 'assistente',
        inventory: 'inventario',
        sme_management: 'sme',
        technical_admin: 'assistente'
    });
    Object.entries(ROLE_TO_LEGACY_PROFILE).forEach(([role, legacy]) => {
        assert.equal(legacyProfileForRole(role), legacy);
    });
    assert.throws(() => legacyProfileForRole('unknown'), /perfil/i);
});
