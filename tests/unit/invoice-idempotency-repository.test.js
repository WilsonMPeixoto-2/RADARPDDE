'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

const OPERATION_KEY = '11111111-2222-4333-8444-555555555555';

function createRpcClient(calls, responseId) {
    return {
        from() {
            throw new Error('from() não deve ser chamado neste teste de RPC');
        },
        async rpc(name, args) {
            calls.push({ name, args });
            return { data: { invoice: { id: responseId } }, error: null };
        }
    };
}

test('repositório usa save_invoice_with_effects_v2 quando recebe operationKey', async () => {
    const calls = [];
    const repository = new SupabaseRepository({
        client: createRpcClient(calls, 'nota-intent')
    });

    await repository.saveInvoiceWithEffects({
        operationKey: OPERATION_KEY,
        invoice: { id: 'nota-intent', school_id: 'ESC-1' },
        administrativeLog: { id: 'log-intent', action: 'Gasto Consumo Cadastrado' }
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'save_invoice_with_effects_v2');
    assert.equal(calls[0].args.p_operation_key, OPERATION_KEY);
});

test('v1 continua disponível somente para callers legados sem chave', async () => {
    const calls = [];
    const repository = new SupabaseRepository({
        client: createRpcClient(calls, 'nota-legada')
    });

    await repository.saveInvoiceWithEffects({
        invoice: { id: 'nota-legada', school_id: 'ESC-1' }
    });

    assert.equal(calls[0].name, 'save_invoice_with_effects');
    assert.equal(Object.hasOwn(calls[0].args, 'p_operation_key'), false);
});
