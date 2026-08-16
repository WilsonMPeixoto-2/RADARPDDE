'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { VerificationService } = require('../../src/application/verification-service.js');
const { transformLegacyState } = require('../../src/data/legacy-state-adapter.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function createState() {
    return {
        config: { exercicios: ['2026'] },
        programs: [{ id: 'BASIC', name: 'PDDE Básico', active: true }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{
            id: 'ESC-1',
            designação: 'ESC-1',
            denominação: 'Escola Teste',
            cre: '4ª CRE',
            programasIds: ['BASIC'],
            competenciaInicial: '2026-01'
        }],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    bonificacao: { extCC: '' },
                    analise: { extCC: 'Não analisado' },
                    resultadoBonif: '',
                    rowVersion: 4
                }
            }
        },
        pendencies: [],
        contacts: [],
        assets: [],
        registeredInvoices: [],
        logs: []
    };
}

function snapshotFromState(state) {
    const transformed = transformLegacyState(state);
    return createSnapshotEnvelope(transformed.entities, {
        version: '1',
        importId: 'verification-write-serialization',
        exportedAt: '2026-08-16T07:20:00.000Z'
    });
}

function createHarness() {
    const state = createState();
    const verification = state.verifications['ESC-1']['2026-05_BASIC'];
    const expectedVersions = [];
    let remoteVersion = 4;
    let activeExecutions = 0;
    let maxActiveExecutions = 0;
    let logSequence = 0;

    const repository = {
        async saveVerificationWithLog(input) {
            expectedVersions.push(input.expectedVersion);
            if (input.expectedVersion !== remoteVersion) {
                const conflict = new Error('OPTIMISTIC_CONFLICT: verifications/ESC-1::2026-05::BASIC');
                conflict.code = 'OPTIMISTIC_CONFLICT';
                throw conflict;
            }

            remoteVersion += 1;
            const savedVersion = remoteVersion;
            // O banco já confirmou a primeira escrita, mas a resposta ainda está em trânsito.
            await new Promise(resolve => setTimeout(resolve, 25));
            return {
                verification: {
                    ...structuredClone(input.verification),
                    row_version: savedVersion
                },
                administrative_log: structuredClone(input.administrativeLog)
            };
        }
    };

    const dataService = {
        async execute(command) {
            activeExecutions += 1;
            maxActiveExecutions = Math.max(maxActiveExecutions, activeExecutions);
            try {
                const value = await command.mutate();
                const snapshot = snapshotFromState(state);
                const persisted = await command.persist({
                    snapshot,
                    repository,
                    defaultPersist: async () => {
                        throw new Error('A operação deve usar a RPC atômica.');
                    }
                });
                if (persisted?.verification?.row_version) {
                    verification.rowVersion = persisted.verification.row_version;
                }
                return { ok: true, value, snapshot, persisted };
            } finally {
                activeExecutions -= 1;
            }
        }
    };

    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => {
            logSequence += 1;
            const log = {
                id: `log-${logSequence}`,
                escolaId: 'ESC-1',
                usuario: 'Controlador Teste',
                perfil: 'Controlador',
                acao: action,
                detalhes: details,
                dataHora: '2026-08-16T07:20:00.000Z'
            };
            state.logs.push(log);
            return log;
        }
    });

    return {
        service,
        verification,
        expectedVersions,
        getMaxActiveExecutions: () => maxActiveExecutions
    };
}

test('serializa gravações rápidas da mesma verificação e usa row_version devolvido pela escrita anterior', async () => {
    const harness = createHarness();

    const bonificationPromise = harness.service.setBonification({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Sim'
    });
    const analysisPromise = harness.service.setTechnicalAnalysis({
        profile: 'controlador',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto'
    });

    await Promise.all([bonificationPromise, analysisPromise]);

    assert.equal(harness.getMaxActiveExecutions(), 1);
    assert.deepEqual(harness.expectedVersions, [4, 5]);
    assert.equal(harness.verification.rowVersion, 6);
    assert.equal(harness.verification.bonificacao.extCC, 'Sim');
    assert.equal(harness.verification.analise.extCC, 'Correto');
});
