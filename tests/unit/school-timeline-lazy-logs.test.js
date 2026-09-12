'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '../../src/integration/school-timeline.js'),
    'utf8'
);

test('timeline solicita registros administrativos somente na ativação do histórico', () => {
    assert.match(
        source,
        /activateTimeline[\s\S]*RadarAdministrativeLogReadContext\?\.model\?\.loadSchool/
    );
    const installBlock = source.slice(
        source.indexOf('function installTimelineTab'),
        source.indexOf('function scheduleInstall')
    );
    assert.doesNotMatch(installBlock, /loadSchool\(/);
});
