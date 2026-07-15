'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AuditService } = require('../../src/application/audit-service.js');

test('registra evento administrativo em uma única unidade de trabalho', async () => {
    const logs = [];
    const calls = [];
    const service = new AuditService({
        dataService: {
            async execute(command) {
                calls.push(command);
                return { ok: true, value: await command.mutate() };
            }
        },
        appendLog: (action, details) => {
            const log = { id: 'log-1', action, details };
            logs.unshift(log);
            return log;
        }
    });

    const result = await service.record({
        action: 'Relatório Exportado',
        details: 'Exportação concluída.'
    });

    assert.deepEqual(result.value.log, {
        id: 'log-1',
        action: 'Relatório Exportado',
        details: 'Exportação concluída.'
    });
    assert.equal(logs.length, 1);
    assert.deepEqual(calls[0].changedEntities, ['administrativeLogs']);
});

