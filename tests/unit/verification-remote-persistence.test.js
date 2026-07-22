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
            id: '04.10.001',
            designação: '04.10.001',
            denominação: 'Escola Teste',
            cre: '4ª CRE',
            programasIds: ['BASIC'],
            competenciaInicial: '2026-01'
        }],
        verifications: {
            '04.10.001': {
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
        importId: 'verification-remote-persistence',
        exportedAt: '2026-07-22T21:00:00.000Z'
    });
}

test('VerificationService usa RPC atômica para verificação e log no modo remoto', async () => {
    const state = createState();
    const rpcCalls = [];
    let defaultPersistCalls = 0;
    let logSequence = 0;
    const repository = {
        saveVerificationWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { verification: input.verification, administrative_log: input.administrativeLog };
        }
    };
    const dataService = {
        async execute(command) {
            const value = command.mutate();
            const snapshot = snapshotFromState(state);
            if (typeof command.persist === 'function') {
                await command.persist({
                    snapshot,
                    repository,
                    defaultPersist: async () => { defaultPersistCalls += 1; }
                });
            } else {
                defaultPersistCalls += 1;
            }
            return { ok: true, value, snapshot };
        }
    };
    const appendLog = (action, details) => {
        logSequence += 1;
        const log = {
            id: `log-${logSequence}`,
            usuario: 'Controlador Teste',
            perfil: 'Controlador',
            acao: action,
            detalhes: details,
            dataHora: '2026-07-22T21:00:00.000Z'
        };
        state.logs.push(log);
        return log;
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: (schoolId, compKey) => state.verifications[schoolId][compKey],
        appendLog
    });

    await service.setBonification({
        profile: 'controlador',
        schoolId: '04.10.001',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Sim'
    });

    assert.equal(defaultPersistCalls, 0);
    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].expectedVersion, 4);
    assert.equal(rpcCalls[0].verification.id, '04.10.001::2026-05::BASIC');
    assert.equal(rpcCalls[0].verification.bonification.extCC, 'Sim');
    assert.equal(rpcCalls[0].administrativeLog.id, 'log-1');
    assert.equal(rpcCalls[0].administrativeLog.school_id, '04.10.001');
});

test('VerificationService tolera coleções opcionais ausentes antes de persistir', async () => {
    const state = createState();
    delete state.registeredInvoices;
    delete state.pendencies;
    const dataService = {
        async execute(command) {
            const value = command.mutate();
            return { ok: true, value };
        }
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: (schoolId, compKey) => state.verifications[schoolId][compKey],
        appendLog: () => ({ id: 'log-safe' })
    });

    await assert.doesNotReject(service.setBonification({
        profile: 'controlador',
        schoolId: '04.10.001',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Não'
    }));
});

function createAtomicHarness(configureState) {
    const state = createState();
    configureState?.(state);
    const rpcCalls = [];
    let defaultPersistCalls = 0;
    let logSequence = 0;
    const repository = {
        saveVerificationWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { verification: input.verification, administrative_log: input.administrativeLog };
        }
    };
    const dataService = {
        async execute(command) {
            const value = await command.mutate();
            const snapshot = snapshotFromState(state);
            await command.persist({
                snapshot,
                repository,
                defaultPersist: async () => { defaultPersistCalls += 1; }
            });
            return { ok: true, value, snapshot };
        }
    };
    const appendLog = (action, details, context = {}) => {
        logSequence += 1;
        const log = {
            id: `atomic-log-${logSequence}`,
            escolaId: context.escolaId || context.schoolId || '04.10.001',
            usuario: 'Assistente Teste',
            perfil: 'Assistente de Verbas Federais',
            acao: action,
            detalhes: details,
            dataHora: '2026-07-22T21:00:00.000Z'
        };
        state.logs.push(log);
        return log;
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: (schoolId, compKey) => state.verifications[schoolId][compKey],
        appendLog,
        getCurrentUser: () => ({ name: 'Assistente Teste', role: 'Assistente CRE' }),
        createId: prefix => `${prefix}-atomic`,
        now: () => '2026-07-22T21:00:00.000Z'
    });
    return { state, service, rpcCalls, getDefaultPersistCalls: () => defaultPersistCalls };
}

test('análise técnica usa a mesma RPC atômica com versão e log', async () => {
    const harness = createAtomicHarness(state => {
        state.verifications['04.10.001']['2026-05_BASIC'].bonificacao.extCC = 'Sim';
    });

    await harness.service.setTechnicalAnalysis({
        profile: 'controlador',
        schoolId: '04.10.001',
        compKey: '2026-05_BASIC',
        documentKey: 'extCC',
        value: 'Correto'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, 4);
    assert.equal(harness.rpcCalls[0].verification.analysis.extCC, 'Correto');
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Análise Técnica Alterada');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('consolidação usa a mesma RPC atômica com versão e log', async () => {
    const harness = createAtomicHarness(state => {
        state.verifications['04.10.001']['2026-05_BASIC'].bonificacao = {
            extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Sim', consAssessoria: 'Sim',
            declBBAgil: 'Sim', encampInventario: 'Sim'
        };
    });

    await harness.service.closeBonification({
        profile: 'controlador',
        schoolId: '04.10.001',
        compKey: '2026-05_BASIC'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, 4);
    assert.ok(['apta', 'inapta'].includes(harness.rpcCalls[0].verification.bonus_result));
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Bonificação Consolidada');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('retificação usa a mesma RPC atômica com versão e log', async () => {
    const harness = createAtomicHarness(state => {
        const verification = state.verifications['04.10.001']['2026-05_BASIC'];
        verification.bonificacao = {
            extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Sim', consAssessoria: 'Sim',
            declBBAgil: 'Sim', encampInventario: 'Sim'
        };
        verification.resultadoBonif = 'apta';
    });

    await harness.service.retify({
        profile: 'assistente',
        schoolId: '04.10.001',
        compKey: '2026-05_BASIC',
        programId: 'BASIC',
        bonification: { extCC: 'Não' },
        bonusResult: 'inapta',
        justification: 'Correção administrativa documentada.'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, 4);
    assert.equal(harness.rpcCalls[0].verification.bonification.extCC, 'Não');
    assert.equal(harness.rpcCalls[0].verification.bonus_result, 'inapta');
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Consolidação retificada');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});
