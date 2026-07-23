'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

function canonicalVerification(overrides = {}) {
    return {
        id: 'ESC-1::2026-05::BASIC',
        school_id: 'ESC-1',
        competence_id: '2026-05',
        program_id: 'BASIC',
        bonification: { extCC: 'Sim' },
        analysis: { extCC: 'Não analisado' },
        bonus_result: '',
        payload: {},
        row_version: 1,
        ...overrides
    };
}

function createClient() {
    const calls = [];
    return {
        calls,
        from(table) {
            const state = { table, operation: null, payload: null, filters: [], returning: false };
            const query = {
                upsert(payload) {
                    state.operation = 'upsert';
                    state.payload = structuredClone(payload);
                    return query;
                },
                update(payload) {
                    state.operation = 'update';
                    state.payload = structuredClone(payload);
                    return query;
                },
                eq(column, value) {
                    state.filters.push([column, value]);
                    return query;
                },
                select() {
                    state.returning = true;
                    return query;
                },
                then(resolve) {
                    calls.push(structuredClone(state));
                    const data = state.operation === 'update'
                        ? [{ ...state.payload, id: 'ESC-1::2026-05::BASIC', row_version: 2 }]
                        : structuredClone(state.payload || []);
                    resolve({ data, error: null });
                }
            };
            return query;
        }
    };
}

test('salva verificação canônica usando a API pública real de contratos', async () => {
    const client = createClient();
    const repository = new SupabaseRepository({ client });
    const verification = canonicalVerification();

    await repository.save('verifications', [verification]);

    assert.equal(client.calls.length, 1);
    assert.equal(client.calls[0].table, 'verifications');
    assert.equal(client.calls[0].operation, 'upsert');
    assert.deepEqual(client.calls[0].payload, [verification]);
});

test('atualiza verificação versionada após validar o registro canônico completo', async () => {
    const client = createClient();
    const repository = new SupabaseRepository({ client });

    const result = await repository.updateWithVersion(
        'verifications',
        canonicalVerification({ bonification: { extCC: 'Não' } }),
        1
    );

    assert.equal(client.calls.length, 1);
    assert.equal(client.calls[0].operation, 'update');
    assert.deepEqual(client.calls[0].filters, [
        ['id', 'ESC-1::2026-05::BASIC'],
        ['row_version', 1]
    ]);
    assert.equal(result.row_version, 2);
});

test('rejeita JSON canônico inválido antes de enviar a gravação', async () => {
    const client = createClient();
    const repository = new SupabaseRepository({ client });

    await assert.rejects(
        repository.save('verifications', [canonicalVerification({ bonification: [] })]),
        error => error?.code === 'VALIDATION_FAILED'
            && error?.entity === 'verifications'
            && error?.operation === 'save'
    );

    assert.equal(client.calls.length, 0);
});

test('RPC de verificação rejeita operação sem log administrativo', async () => {
    const client = createClient();
    const repository = new SupabaseRepository({ client });

    await assert.rejects(
        repository.saveVerificationWithLog({ verification: canonicalVerification() }),
        error => error?.code === 'VALIDATION_FAILED'
            && error?.operation === 'saveVerificationWithLog'
            && /log administrativo/i.test(error?.message || '')
    );

    assert.equal(client.calls.length, 0);
});
