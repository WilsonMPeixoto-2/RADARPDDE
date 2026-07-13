'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    scanTextForSecrets,
    validateRuntimeConfigSource,
    validateMigrationManifest
} = require('../../scripts/check-supabase-readiness.js');

test('detecta atribuição real de segredo Supabase', () => {
    const findings = scanTextForSecrets("SUPABASE_SERVICE_ROLE_KEY='super-secret-value'");
    assert.equal(findings.length, 1);
    assert.match(findings[0], /service role/i);

    assert.deepEqual(scanTextForSecrets('SUPABASE_SERVICE_ROLE_KEY='), []);
    assert.deepEqual(scanTextForSecrets('Nunca use service_role no frontend.'), []);
});

test('recusa configuração publicada fora do modo local', () => {
    assert.deepEqual(validateRuntimeConfigSource("dataMode: 'local'"), []);
    assert.match(
        validateRuntimeConfigSource("dataMode: 'supabase-production'").join(' '),
        /modo local/i
    );
});

test('valida conjunto obrigatório de migrations', () => {
    assert.deepEqual(validateMigrationManifest([
        '202607130001_core_schema.sql',
        '202607130002_auth_and_rls.sql',
        '202607130003_audit_and_import.sql'
    ]), []);

    assert.match(
        validateMigrationManifest(['202607130001_core_schema.sql']).join(' '),
        /202607130002_auth_and_rls\.sql/
    );
});
