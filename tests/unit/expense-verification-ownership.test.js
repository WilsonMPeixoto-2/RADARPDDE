'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const { transformLegacyState } = require('../../src/data/legacy-state-adapter.js');
const { classifyError } = require('../../src/application/error-mapper.js');

const expenseRpcs = [
    'save_invoice_with_effects', 'save_invoice_with_effects_v2',
    'delete_invoice_with_effects', 'save_unidentified_expense_with_pendency',
    'save_invoice_document_with_pendency', 'register_invoice_document_attempt',
    'reanalyze_invoice_document_pendency', 'save_service_advisory_with_pendency',
    'register_service_advisory_attempt', 'reanalyze_service_advisory_pendency'
];

test('o patch emitido pelo bridge real não transmite null de consolidação à despesa', async () => {
    const { entities } = transformLegacyState({ verifications: {
        school: { '2026-05_BASIC': { bonificacao: { notaFiscal: 'Não' }, analise: {}, resultadoBonif: '' } }
    } });
    const patch = entities.verifications[0];
    assert.equal(patch.bonus_result, null, 'normalização legada real');
    let sent;
    const repository = new SupabaseRepository({ client: {
        from() { throw new Error('RPC only'); },
        async rpc(name, args) { sent = args; return { data: {}, error: null }; }
    } });
    await repository.saveInvoiceWithEffects({ invoice: { id: 'NF-1' }, verificationPatch: patch });
    assert.equal(Object.hasOwn(sent.p_verification_patch, 'bonus_result'), false);
});

for (const name of expenseRpcs) {
    test(`${name}: despesa não envia decisão de consolidação, nem altera o caller`, async () => {
        const calls = [];
        const repository = new SupabaseRepository({ client: {
            from() { throw new Error('RPC only'); },
            async rpc(rpc, args) { calls.push({ rpc, args }); return { data: {}, error: null }; }
        } });
        for (const result of [undefined, null, '', 'apta']) {
            const patch = { id: 'school::2026-05::BASIC', bonification: {
                notaFiscal: 'Não', consAssessoria: 'Sim', consEnviada: 'Não', encampInventario: 'Sim'
            }, analysis: { notaFiscal: 'Correto' } };
            if (result !== undefined) patch.bonus_result = result;
            const original = structuredClone(patch);
            await repository.executeRpc(name, { p_verification_patch: patch }, 'expense');
            assert.equal(Object.hasOwn(calls.at(-1).args.p_verification_patch, 'bonus_result'), false);
            assert.deepEqual(calls.at(-1).args.p_verification_patch.bonification, original.bonification);
            assert.deepEqual(patch, original);
        }
    });
}

test('a RPC própria da bonificação mantém a capacidade explícita de reabertura', async () => {
    let sent;
    const repository = new SupabaseRepository({ client: {
        from() { throw new Error('RPC only'); },
        async rpc(name, args) { sent = args; return { data: {}, error: null }; }
    } });
    await repository.executeRpc('save_verification_with_log', {
        p_verification: { id: 'school::2026-05::BASIC', bonus_result: null }
    }, 'verification');
    assert.equal(Object.hasOwn(sent.p_verification, 'bonus_result'), true);
    assert.equal(sent.p_verification.bonus_result, null);
});

test('colisão da primeira verification mantém conflito recuperável até o mapper da UI', async () => {
    const repository = new SupabaseRepository({ client: {
        from() { throw new Error('RPC only'); },
        async rpc() { return { data: null, error: { code: '23505',
            message: 'duplicate key value violates unique constraint "verifications_pkey"' } }; }
    } });
    await assert.rejects(repository.saveInvoiceWithEffects({ invoice: { id: 'NF-1' },
        verificationPatch: { id: 'school::2026-05::BASIC' } }), error => {
        assert.equal(classifyError(error), 'OPTIMISTIC_CONFLICT');
        assert.equal(error.code, 'OPTIMISTIC_CONFLICT');
        assert.equal(error.postgresCode, '23505');
        return true;
    });
});

test('tradução de colisão de despesa não muda a política das outras RPCs', async () => {
    const repository = new SupabaseRepository({ client: {
        from() { throw new Error('RPC only'); },
        async rpc() { return { data: null, error: { code: '23505', message: 'duplicate key' } }; }
    } });
    await assert.rejects(repository.executeRpc('save_verification_with_log', {}, 'verification'),
        error => error.code === 'CONFLICT' && error.postgresCode === '23505');
});
