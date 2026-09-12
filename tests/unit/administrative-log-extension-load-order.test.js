'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrapPath = path.join(__dirname, '../../src/integration/product-extensions-bootstrap.js');

test('leitura remota de logs é instalada antes da timeline e tratada como extensão crítica', () => {
    const source = fs.readFileSync(bootstrapPath, 'utf8');
    const logModel = "'/src/integration/administrative-log-read-model.js'";
    const timeline = "'/src/integration/school-timeline.js'";

    assert.ok(source.includes(logModel), 'bootstrap deve carregar administrative-log-read-model.js');
    assert.ok(source.indexOf(logModel) < source.indexOf(timeline), 'modelo remoto deve anteceder a timeline');
    assert.match(source, /criticalScripts[\s\S]*administrative-log-read-model\.js/);
    assert.match(source, /RadarAdministrativeLogReadModel\?\.install/);
});
