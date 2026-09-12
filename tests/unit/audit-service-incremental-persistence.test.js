'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AuditService } = require('../../src/application/audit-service.js');

test('audit:record persiste somente o novo log e declara retorno remoto autoritativo', async () => {
    let capturedCommand = null;
    const inserted = [];
    const canonicalLog = {
        id: 'LOG-NEW',
        school_id: '04.31.001',
        actor_user_id: 'USER-1',
        user_identifier: 'Controlador',
        profile_name: 'Controlador',
        action: 'Exportação gerada',
        details: { texto: 'Planilha emitida' },
        event_at: '2026-09-11T20:00:00Z'
    };
    const repository = {
        async load() {
            throw new Error('Não deve reler administrativeLogs para inserir um novo registro.');
        },
        async insertOnly(entity, records) {
            inserted.push({ entity, records: structuredClone(records) });
            return structuredClone(records);
        }
    };
    const dataService = {
        async execute(command) {
            capturedCommand = command;
            const value = command.mutate();
            const persisted = await command.persist({
                snapshot: { entities: { administrativeLogs: [canonicalLog] } },
                repository,
                defaultPersist: async () => {
                    throw new Error('Persistência genérica não deve ser usada.');
                }
            });
            return { ok: true, value, persisted };
        }
    };
    const service = new AuditService({
        dataService,
        appendLog: () => ({
            id: 'LOG-NEW',
            escolaId: '04.31.001',
            acao: 'Exportação gerada',
            detalhes: 'Planilha emitida'
        })
    });

    const result = await service.record({
        action: 'Exportação gerada',
        details: 'Planilha emitida',
        schoolId: '04.31.001'
    });

    assert.equal(capturedCommand.remoteResultIsAuthoritative, true);
    assert.deepEqual(capturedCommand.incrementalStateEntities, ['administrativeLogs']);
    assert.deepEqual(capturedCommand.remoteRefreshExemptEntities, ['administrativeLogs']);
    assert.deepEqual(inserted, [{
        entity: 'administrativeLogs',
        records: [canonicalLog]
    }]);
    assert.deepEqual(result.persisted, { administrative_log: canonicalLog });
});
