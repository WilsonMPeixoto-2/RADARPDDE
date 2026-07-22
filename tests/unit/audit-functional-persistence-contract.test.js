const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONFIG_FIELD_MAP,
  inspectJavaScript
} = require('../../scripts/audit-functional-persistence.js');

test('classifica metadados de concorrência da configuração no Supabase', () => {
  assert.deepEqual(CONFIG_FIELD_MAP.rowVersion, ['app_config.row_version']);
  assert.deepEqual(CONFIG_FIELD_MAP.row_version, ['app_config.row_version']);
});

test('reconhece callback injetado como persistido pelo serviço chamador', () => {
  const inspection = inspectJavaScript([
    {
      file: 'app.js',
      source: `
        const verificacoes = {};
        function ensureProgramVerification() {
          verificacoes.school = {};
        }
        const dependencies = { ensureVerification: ensureProgramVerification };
      `
    },
    {
      file: 'src/application/verification-service.js',
      source: `
        function executeVerification() {
          this.ensureVerification();
          persist('verificacoes');
        }
      `
    }
  ]);

  const record = inspection.mutationFunctions.find(item => item.name === 'ensureProgramVerification');
  assert.ok(record);
  assert.equal(record.persistedByCaller, true);
  assert.deepEqual(record.callers, ['executeVerification']);
});
