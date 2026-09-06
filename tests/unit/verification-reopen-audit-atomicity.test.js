'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope, RepositoryError } = require('../../src/data/repository-contract.js');

function createHarness() {
    const verification = {
        id: 'VER-1',
        rowVersion: 7,
        bonificacao: {
            extCC: 'Sim', extINV: '', notaFiscal: '', consAssessoria: '', declBBAgil: '', encampInventario: ''
        },
        analise: {
            extCC: 'Correto', extINV: 'Não analisado', notaFiscal: 'Não analisado', consAssessoria: 'Não analisado', declBBAgil: 'Não analisado', encampInventario: 'Não analisado'
        },
        resultadoBonif: 'apta'
    };
    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [], pendencies: [],
        schools: [{ id: 'ESC-1', denominação: 'Escola Um' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        logs: []
    };
    let sequence = 0;
    let command;
    const appendLog = (action, details) => {
        const log = { id: `log-${++sequence}`, action, details, escolaId: 'ESC-1' };
        state.logs.unshift(log);
        return log;
    };
    const service = new VerificationService({
        dataService: {
            async execute(next) {
                command = next;
                const value = await next.mutate();
                return { ok: true, value };
            }
        },
        getState: () => state,
        ensureVerification: () => verification,
        appendLog,
        getCurrentUser: () => ({ name: 'Assistente Teste', role: 'Assistente CRE' }),
        getCurrentProfile: () => 'assistente',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-09-06T07:00:00.000Z',
        fluxo,
        retificacoes,
    });
    return { state, service, getCommand: () => command };
}

test('alteração retroativa consolidada persiste toda a auditoria produzida pela mesma operação', async () => {
    const harness = createHarness();

    await harness.service.setBonification({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Não',
        profile: 'assistente'
    });

    assert.deepEqual(
        harness.state.logs.map(log => log.action).sort(),
        ['Bonificação Alterada'],
        'uma alteração e seu efeito derivado compõem um evento canônico'
    );
    assert.match(harness.state.logs[0].details, /Consolidação APTA reaberta/);
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif, '');

    const persistedLogIds = [];
    const command = harness.getCommand();
    const snapshot = {
        entities: {
            verifications: [{
                id: 'VER-1', school_id: 'ESC-1', competence_id: '2026-05', program_id: 'BASIC'
            }],
            administrativeLogs: harness.state.logs.map(log => ({
                id: log.id,
                school_id: 'ESC-1',
                action: log.action,
                details: { text: log.details }
            }))
        }
    };
    await command.persist({
        snapshot,
        repository: {
            async saveVerificationWithLog({ administrativeLog }) {
                persistedLogIds.push(administrativeLog.id);
                return { verification: snapshot.entities.verifications[0], administrative_log: administrativeLog };
            }
        },
        defaultPersist: async () => {
            throw new Error('fallback não esperado');
        }
    });

    assert.deepEqual(
        persistedLogIds.sort(),
        harness.state.logs.map(log => log.id).sort(),
        'nenhum evento da operação pode ficar apenas no estado local'
    );
});

test('mudança ordinária não inventa reabertura e repetição sem alteração não produz outro log', async () => {
    const harness = createHarness();
    harness.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif = '';
    const input = { schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'extCC', value: 'Não', profile: 'assistente' };
    await harness.service.setBonification(input);
    assert.equal(harness.state.logs.length, 1);
    assert.doesNotMatch(harness.state.logs[0].details, /reaberta/i);
    const repeated = await harness.service.setBonification(input);
    assert.equal(repeated.value.unchanged, true);
    assert.equal(harness.state.logs.length, 1);
});

for (const rejectWrite of [false, true]) {
    test(`serviço e UnitOfWork reais: reabertura e auditoria ${rejectWrite ? 'revertem juntas na rejeição' : 'persistem e sobrevivem à releitura'}`, async () => {
        const harness = createHarness();
        const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
        const capture = () => structuredClone({ verification, logs: harness.state.logs });
        const before = capture();
        const canonical = () => createSnapshotEnvelope({
            verifications: [{ id: 'VER-1', school_id: 'ESC-1', competence_id: '2026-05', program_id: 'BASIC', row_version: 7, payload: structuredClone(verification) }],
            administrativeLogs: harness.state.logs.map(log => ({ id: log.id, school_id: 'ESC-1', action: log.action, details: { text: log.details } }))
        });
        let remote = canonical();
        let writes = 0;
        const apply = snapshot => {
            Object.assign(verification, structuredClone(snapshot.entities.verifications[0].payload));
            harness.state.logs = snapshot.entities.administrativeLogs.map(log => ({ id: log.id, escolaId: log.school_id, action: log.action, details: log.details.text }));
        };
        const repository = {
            capabilities: () => ({ remote: true }),
            load: async entity => structuredClone(remote.entities[entity] || []),
            save: async () => { throw new Error('Sem gravação alternativa'); },
            remove: async () => { throw new Error('Sem remoção alternativa'); },
            exportSnapshot: async () => structuredClone(remote),
            restoreSnapshot: async () => { throw new Error('Sem rollback remoto por snapshot'); },
            healthCheck: async () => ({ ok: true }),
            saveVerificationWithLog: async ({ verification: row, administrativeLog, expectedVersion }) => {
                writes++;
                assert.equal(expectedVersion, 7);
                if (rejectWrite) throw new RepositoryError('OPTIMISTIC_CONFLICT', 'Conflito', { details: { rollbackConfirmed: true } });
                remote = createSnapshotEnvelope({ verifications: [{ ...row, row_version: 8 }], administrativeLogs: [administrativeLog] });
                return { verifications: remote.entities.verifications, administrativeLogs: remote.entities.administrativeLogs };
            }
        };
        const statePort = {
            capture: async () => capture(),
            restore: async saved => { Object.assign(verification, saved.verification); harness.state.logs = saved.logs; },
            exportCanonical: async () => canonical(),
            applyCanonical: async snapshot => apply(snapshot)
        };
        harness.service.dataService = new DataService({ repository, statePort });
        const operation = harness.service.setBonification({ schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'extCC', value: 'Não', profile: 'assistente' });
        if (rejectWrite) {
            await assert.rejects(operation, error => error.code === 'OPTIMISTIC_CONFLICT');
            assert.deepEqual(capture(), before);
            assert.equal(remote.entities.verifications[0].payload.resultadoBonif, 'apta');
            assert.deepEqual(remote.entities.administrativeLogs, []);
        } else {
            assert.equal((await operation).stateSync.status, 'applied');
            apply(await repository.exportSnapshot());
            assert.equal(verification.resultadoBonif, '');
            assert.equal(verification.bonificacao.extCC, 'Não');
            assert.equal(harness.state.logs.length, 1);
            assert.match(harness.state.logs[0].details, /Consolidação APTA reaberta/);
            assert.deepEqual(harness.state.logs.map(log => log.id), remote.entities.administrativeLogs.map(log => log.id));
        }
        assert.equal(writes, 1);
    });
}
