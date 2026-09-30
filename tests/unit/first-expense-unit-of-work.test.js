'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { InvoiceService } = require('../../src/application/invoice-service.js');
const { DataService } = require('../../src/application/data-service.js');
const { createStatePort } = require('../../src/application/state-port.js');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const { createEmptyVerification } = require('../../src/domain/fluxo-operacional.js');

function harness(remoteMessage) {
    let memory = {
        config: { exercicios: ['2026'], competenciaFechamento: '2026-05', competencias: [
            { key: '2026-05', label: 'Maio 2026', bonifPrazo: '2026-06-15' }
        ] },
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        schools: [{ id: '04.31.001', designação: '04.31.001', denominação: 'Escola Inicial',
            programasIds: ['BASIC'], competenciaInicial: '2026-01' }],
        controllers: [], inventoryTeamMembers: [], verifications: {},
        registeredInvoices: [], pendencies: [], contacts: [], assets: [], logs: []
    };
    const stored = new Map();
    const storage = {
        get length() { return stored.size; },
        key: i => [...stored.keys()][i] ?? null,
        getItem: k => stored.get(k) ?? null,
        setItem: (k, v) => stored.set(k, String(v)), removeItem: k => stored.delete(k)
    };
    const calls = [];
    const repository = new SupabaseRepository({ client: {
        from() { throw new Error('Global table read must not be used'); },
        async rpc(name, args) {
            calls.push({ name, args });
            return { data: null, error: { code: 'P0001', message: remoteMessage } };
        }
    } });
    const statePort = createStatePort({ storage, readMemory: () => structuredClone(memory),
        writeMemory: value => { memory = structuredClone(value); },
        patchMemory: patch => Object.assign(memory, structuredClone(patch)) });
    const dataService = new DataService({ repository, statePort });
    let sequence = 0;
    const service = new InvoiceService({ dataService, getState: () => memory,
        getCurrentProfile: () => 'controlador',
        ensureVerification(schoolId, compKey) {
            memory.verifications[schoolId] ||= {};
            memory.verifications[schoolId][compKey] ||= createEmptyVerification('BASIC');
        },
        createId: prefix => `${prefix}-${++sequence}`,
        appendLog(action, details) {
            const entry = { id: `log-${++sequence}`, escolaId: '04.31.001', action, details,
                timestamp: '2026-05-12T12:00:00Z' };
            memory.logs.push(entry);
            return entry;
        },
        now: () => '2026-05-12T12:00:00Z'
    });
    return { service, calls, stored, get state() { return memory; } };
}

for (const error of ['VALIDATION_ERROR: rejeição controlada', 'OPTIMISTIC_CONFLICT: contexto concorrente']) {
    for (const type of ['consumo', 'permanente', 'a_identificar']) {
        test(`primeira ${type}: ${error} reverte efeitos via DataService/UoW/bridge reais`, async () => {
            const h = harness(error);
            const input = { schoolId: '04.31.001', compKey: '2026-05_BASIC', description: 'Material',
                expenseType: type, invoiceNumber: type === 'a_identificar' ? '' : 'NF-1', amount: 200,
                profile: 'controlador', reason: 'Documento ausente', notes: 'Aguardando identificação' };
            const command = type === 'a_identificar'
                ? h.service.saveUnidentifiedExpenseWithPendency(input) : h.service.save(input);
            await assert.rejects(command);
            assert.equal(h.calls.length, 1, 'atinge a persistência real da operação');
            assert.equal(h.calls[0].args.p_verification_patch.school_id, input.schoolId);
            assert.equal(h.calls[0].args.p_verification_patch.program_id, 'BASIC');
            assert.equal(Object.hasOwn(h.calls[0].args.p_verification_patch, 'bonus_result'), false);
            for (const entity of ['registeredInvoices', 'pendencies', 'assets', 'logs']) {
                assert.deepEqual(h.state[entity], [], `sem ${entity} artificialmente confirmado`);
            }
            assert.deepEqual(h.state.verifications[input.schoolId][input.compKey], createEmptyVerification('BASIC'),
                'somente projeção estrutural vazia permitida; nenhum lançamento ou resultado');
            assert.equal(h.stored.size, 0, 'não cria segunda fonte de verdade em localStorage');
        });
    }
}

test('validação falha antes de materializar o contexto ou iniciar a persistência', async () => {
    const h = harness('VALIDATION_ERROR');
    await assert.rejects(h.service.save({ schoolId: '04.31.001', compKey: '2026-05_BASIC',
        description: '', expenseType: 'consumo', invoiceNumber: 'NF-1', amount: 200 }));
    assert.deepEqual(h.state.verifications, {});
    assert.equal(h.calls.length, 0);
});
