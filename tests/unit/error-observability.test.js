'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { UnitOfWork, createIncidentId } = require('../../src/application/unit-of-work.js');
const {
    publicMessageFor,
    showDataOperationError
} = require('../../src/application/error-mapper.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');

function createStatePort(overrides = {}) {
    return {
        async capture() {
            return { before: true };
        },
        async exportCanonical() {
            return { format: 'radar-pdde-snapshot', entities: {} };
        },
        async applyCanonical() {},
        async restore() {},
        commitCurrent() {},
        ...overrides
    };
}

test('incidentId pode ser injetado para rastreabilidade determinística', () => {
    assert.equal(createIncidentId({ incidentId: 'RADAR-TEST-001' }), 'RADAR-TEST-001');
    assert.equal(createIncidentId({ createIncidentId: () => 'RADAR-TEST-002' }), 'RADAR-TEST-002');
    assert.match(createIncidentId(), /^RADAR-[A-Z0-9]+-[A-Z0-9]+$/);
});

test('falha antes da rede registra fase e confirma que nenhuma escrita remota começou', async () => {
    const unitOfWork = new UnitOfWork({ statePort: createStatePort() });

    await assert.rejects(
        unitOfWork.run({
            name: 'school:save',
            incidentId: 'RADAR-BEFORE-NETWORK',
            changedEntities: ['schools'],
            remotePersistence: true,
            mutate() {
                throw new RepositoryError('VALIDATION_FAILED', 'Dados inválidos.');
            },
            async persist() {
                throw new Error('não deve executar');
            }
        }),
        error => error instanceof RepositoryError
            && error.incidentId === 'RADAR-BEFORE-NETWORK'
            && error.details.unitOfWorkPhase === 'mutate'
            && error.details.remoteWriteStarted === false
            && error.details.remoteCommitConfirmed === false
            && error.details.rollbackConfirmed === true
    );
});

test('erro RLS durante persistência não afirma rollback nem commit remoto', async () => {
    const unitOfWork = new UnitOfWork({ statePort: createStatePort() });

    await assert.rejects(
        unitOfWork.run({
            name: 'pendency:save',
            incidentId: 'RADAR-RLS',
            changedEntities: ['pendencies'],
            remotePersistence: true,
            mutate() {
                return { id: 'pend-1' };
            },
            async persist() {
                const error = new RepositoryError('PERMISSION_DENIED', 'RLS bloqueou a operação.');
                error.status = 403;
                throw error;
            }
        }),
        error => error.code === 'PERMISSION_DENIED'
            && error.operation === 'pendency:save'
            && error.details.unitOfWorkPhase === 'persist'
            && error.details.remoteWriteStarted === true
            && error.details.remoteCommitConfirmed === false
            && error.details.rollbackConfirmed === false
    );
});

test('falha local depois de persistência remota confirmada nunca é apresentada como rollback', async () => {
    const unitOfWork = new UnitOfWork({
        statePort: createStatePort({
            commitCurrent() {
                throw new Error('falha local após resposta remota');
            }
        })
    });

    await assert.rejects(
        unitOfWork.run({
            name: 'verification:save',
            incidentId: 'RADAR-REMOTE-COMMIT',
            changedEntities: ['verifications'],
            remotePersistence: true,
            mutate() {
                return { id: 'verification-1' };
            },
            async persist() {
                return { verification: { id: 'verification-1' } };
            }
        }),
        error => error.code === 'TRANSACTION_FAILED'
            && error.details.unitOfWorkPhase === 'commit'
            && error.details.remoteCommitConfirmed === true
            && error.details.rollbackConfirmed === false
    );
});

test('mensagem pública diferencia operação não enviada, reversão e commit remoto', () => {
    const notSent = publicMessageFor(
        'TRANSACTION_FAILED',
        { details: { rollbackConfirmed: true, unitOfWorkPhase: 'mutate' } },
        {},
        'RADAR-NOT-SENT'
    );
    assert.match(notSent, /não chegou a ser enviada ao servidor/i);
    assert.doesNotMatch(notSent, /desfeitas com segurança/i);

    const rolledBack = publicMessageFor(
        'TRANSACTION_FAILED',
        { details: { rollbackConfirmed: true, unitOfWorkPhase: 'persist' } },
        {},
        'RADAR-ROLLBACK'
    );
    assert.match(rolledBack, /reversão foi confirmada/i);

    const committed = publicMessageFor(
        'TRANSACTION_FAILED',
        { details: { remoteCommitConfirmed: true, unitOfWorkPhase: 'commit' } },
        {},
        'RADAR-COMMITTED'
    );
    assert.match(committed, /confirmada no servidor/i);
    assert.match(committed, /recarregue/i);
});

test('mensagem pública inclui incidente sem expor detalhes técnicos', () => {
    const originalConsoleError = console.error;
    const logs = [];
    console.error = (...args) => logs.push(args);
    try {
        const error = new RepositoryError('TRANSACTION_FAILED', 'segredo técnico interno', {
            operation: 'asset:save',
            details: {
                incidentId: 'RADAR-PUBLIC',
                unitOfWorkPhase: 'persist',
                secret: 'não publicar'
            }
        });
        const mapped = showDataOperationError(error);

        assert.equal(mapped.incidentId, 'RADAR-PUBLIC');
        assert.match(mapped.message, /RADAR-PUBLIC/);
        assert.doesNotMatch(mapped.message, /segredo|não publicar/i);
        assert.equal(logs.length, 1);
        assert.equal(logs[0][0], '[RADAR_DATA_ERROR]');
        assert.equal(logs[0][1].technicalMessage, 'segredo técnico interno');
    } finally {
        console.error = originalConsoleError;
    }
});
