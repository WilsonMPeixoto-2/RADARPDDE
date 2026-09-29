'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

function validClient(rpc) {
    return {
        rpc,
        from() {
            return {
                select() { return this; },
                order() { return this; },
                limit() { return Promise.resolve({ data: [], error: null }); }
            };
        }
    };
}

function rpcBuilder(result, calls) {
    let signal = null;
    return {
        abortSignal(value) {
            signal = value;
            calls.push(['abortSignal', value]);
            return this;
        },
        then(resolve, reject) {
            if (signal?.aborted) {
                const error = new Error('The operation was aborted.');
                error.name = 'AbortError';
                return Promise.reject(error).then(resolve, reject);
            }
            return Promise.resolve(result).then(resolve, reject);
        }
    };
}

test('executeRpc propaga AbortSignal para leitura RPC sem alterar argumentos', async () => {
    const calls = [];
    const client = validClient((name, args) => {
        calls.push(['rpc', name, structuredClone(args)]);
        return rpcBuilder({ data: { ok: true }, error: null }, calls);
    });
    const repository = new SupabaseRepository({ client });
    const controller = new AbortController();

    const result = await repository.executeRpc(
        'read_operational_context',
        { p_competence_id: '2026-09', p_history_statuses: [] },
        'queryOperationalContext',
        { signal: controller.signal }
    );

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(calls[0], [
        'rpc',
        'read_operational_context',
        { p_competence_id: '2026-09', p_history_statuses: [] }
    ]);
    assert.deepEqual(calls[1], ['abortSignal', controller.signal]);
});

test('executeRpc sem signal preserva o contrato das RPCs de escrita e não exige abortSignal', async () => {
    const calls = [];
    const client = validClient((name, args) => {
        calls.push([name, structuredClone(args)]);
        return Promise.resolve({ data: { persisted: true }, error: null });
    });
    const repository = new SupabaseRepository({ client });

    const result = await repository.executeRpc(
        'save_verification_with_log',
        { p_verification: { id: 'v1' } },
        'saveVerificationWithLog'
    );

    assert.deepEqual(result, { persisted: true });
    assert.deepEqual(calls, [[
        'save_verification_with_log',
        { p_verification: { id: 'v1' } }
    ]]);
});

test('executeRpc mantém AbortError reconhecível para leitura cancelada', async () => {
    const client = validClient(() => rpcBuilder({ data: { ok: true }, error: null }, []));
    const repository = new SupabaseRepository({ client });
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
        repository.executeRpc(
            'read_operational_context',
            { p_competence_id: '2026-09', p_history_statuses: [] },
            'queryOperationalContext',
            { signal: controller.signal }
        ),
        error => error?.name === 'AbortError'
    );
});
