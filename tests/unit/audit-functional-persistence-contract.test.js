const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONFIG_FIELD_MAP,
  inspectJavaScript,
  inspectInlineHandlers
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

test('valida sintaxe de handler inline preservando a localização do markup', () => {
  const markup = [
    '<section>',
    '  <button type="button" onclick="openPanel(]">Abrir</button>',
    '</section>'
  ].join('\n');

  const inspection = inspectInlineHandlers(markup, 'index.html');

  assert.deepEqual(inspection.handlers, ['openPanel']);
  assert.equal(inspection.syntaxErrors.length, 1);
  assert.equal(inspection.syntaxErrors[0].file, 'index.html');
  assert.equal(inspection.syntaxErrors[0].line, 2);
  assert.ok(inspection.syntaxErrors[0].column > 30);
});

test('aceita handler inline válido iniciado por comando de controle', () => {
  const markup = '<button onclick="if (ready) { openPanel(); }">Abrir</button>';

  const inspection = inspectInlineHandlers(markup, 'index.html');

  assert.equal(inspection.syntaxErrors.length, 0);
});

test('aceita aspas escapadas em HTML construído dentro de JavaScript', () => {
  const source = "const html = `<button onclick=\"switchView(\\'pendencias\\')\">Abrir</button>`;";

  const inspection = inspectInlineHandlers(source, 'src/integration/example.js');

  assert.deepEqual(inspection.handlers, ['switchView']);
  assert.equal(inspection.syntaxErrors.length, 0);
});
