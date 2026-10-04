'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { OperationalSupabaseRepository } = require('../../src/data/repository-factory.js');
const { REMOTE_CONTEXT_ENTITIES } = require('../../src/data/repository-contract.js');

function envelope(overrides = {}) {
    return {
        schemaVersion: 1, schoolId: 'S', competenceId: '2026-08', historyStatuses: [],
        coverage: { kind: 'competence-and-dependencies', complete: true,
            contacts: 'selected-pendencies', collections: [...REMOTE_CONTEXT_ENTITIES] },
        fallback: null,
        entities: Object.fromEntries(REMOTE_CONTEXT_ENTITIES.map(entity => [entity, []])),
        ...overrides
    };
}

function harness(response = envelope()) {
    const calls = [];
    const repository = new OperationalSupabaseRepository({ client: {
        rpc(name, args) {
            calls.push({ name, args });
            return { abortSignal(signal) { calls.push({ signal }); return this; },
                then(resolve, reject) { return Promise.resolve({ data: response, error: null }).then(resolve, reject); } };
        },
        from() { throw new Error('Nenhum fan-out REST permitido'); }
    } });
    return { repository, calls };
}

const request = { schoolId: 'S', competenceId: '2026-08' };

test('leitura escolar explicita capacidade e usa uma RPC com H normalizado e AbortSignal', async () => {
    const response = envelope({ historyStatuses: ['Cancelada', 'Resolvida'] });
    const { repository, calls } = harness(response);
    const signal = new AbortController().signal;
    assert.equal(repository.capabilities().schoolOperationalContext, true);
    assert.deepEqual(await repository.querySchoolOperationalContext({ ...request, schoolId: ' S ',
        historyStatuses: ['Resolvida', 'Cancelada', 'Resolvida'], signal }), response);
    assert.deepEqual(calls, [{ name: 'read_school_operational_context', args: {
        p_school_id: 'S', p_competence_id: '2026-08', p_history_statuses: ['Cancelada', 'Resolvida']
    } }, { signal }]);
});

test('arrays completos vazios são verdade; fallback preserva envelope sem leitura global escondida', async () => {
    const empty = harness();
    assert.deepEqual(await empty.repository.querySchoolOperationalContext(request), envelope());
    const fallback = envelope({ coverage: { ...envelope().coverage, complete: false },
        fallback: { kind: 'global', reason: 'NON_ISOLATABLE_RELATION' }, entities: null });
    const h = harness(fallback);
    assert.deepEqual(await h.repository.querySchoolOperationalContext(request), fallback);
    assert.equal(h.calls.length, 1);
});

test('parâmetros inválidos e cancelamento prévio não iniciam leitura', async () => {
    const { repository, calls } = harness();
    for (const params of [{ ...request, schoolId: '' }, { ...request, competenceId: '2026-13' },
        { ...request, historyStatuses: 'Resolvida' }, { ...request, historyStatuses: [null] }]) {
        await assert.rejects(repository.querySchoolOperationalContext(params), { code: 'INVALID_SCHOOL_OPERATIONAL_CONTEXT' });
    }
    const controller = new AbortController(); controller.abort();
    await assert.rejects(repository.querySchoolOperationalContext({ ...request, signal: controller.signal }), { name: 'AbortError' });
    assert.equal(calls.length, 0);
});

test('completude exige identidade, cobertura e seis arrays válidos, sem dedup silencioso', async () => {
    const invalid = [null, envelope({ schemaVersion: 2 }), envelope({ schoolId: 'outra' }),
        envelope({ competenceId: '2026-09' }), envelope({ historyStatuses: ['Resolvida'] }),
        envelope({ coverage: { ...envelope().coverage, contacts: 'all' } }),
        envelope({ coverage: { ...envelope().coverage, collections: ['pendencies'] } }),
        envelope({ entities: {} }), envelope({ entities: { ...envelope().entities, pendencies: {} } }),
        envelope({ entities: { ...envelope().entities, assets: null } }),
        envelope({ entities: { ...envelope().entities, assets: [{ id: 'a', school_id: 'outra' }] } }),
        envelope({ entities: { ...envelope().entities, assets: [{ id: 'a', school_id: 'S' }, { id: 'a', school_id: 'S' }] } }),
        envelope({ entities: { ...envelope().entities, pendencyAttempts: [{ id: 't', pendency_id: 'ausente' }] } }),
        envelope({ entities: { ...envelope().entities, pendencyContacts: [{ id: 'c', school_id: 'S', pendency_id: null }] } })];
    for (const response of invalid) {
        await assert.rejects(harness(response).repository.querySchoolOperationalContext(request),
            { code: 'INVALID_SCHOOL_OPERATIONAL_CONTEXT' });
    }
});

test('fallback nunca entrega coleções aplicáveis, mesmo se o servidor mandar dados parciais', async () => {
    for (const response of [envelope({ coverage: { ...envelope().coverage, complete: false } }),
        envelope({ fallback: { kind: 'global', reason: 'UNKNOWN_COVERAGE' } })]) {
        const received = await harness(response).repository.querySchoolOperationalContext(request);
        assert.equal(received.coverage.complete, false);
        assert.equal(received.entities, null);
        assert.equal(received.fallback.kind, 'global');
    }
});
