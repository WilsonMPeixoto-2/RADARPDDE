'use strict';

// Testes de referência da auditoria independente do agente Manus (15/11/2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRequest,
    describePlan,
    createOperationalCorrectionClient,
    OperationalCorrectionError
} = require('../../src/application/operational-correction-client.js');

const DIGEST = 'a'.repeat(64);
const target = { schoolId: 'ESC-1', competence: '2026-10', programId: 'PDDE_BASICO' };

function fakeRepository(responses) {
    const calls = [];
    return {
        calls,
        async executeRpc(name, args, operation) {
            calls.push({ name, args: JSON.parse(JSON.stringify(args)), operation });
            const next = responses.shift();
            if (next instanceof Error) throw next;
            return typeof next === 'function' ? next(name, args) : next;
        }
    };
}

function remoteError(message) {
    const error = new Error(`Falha na operação transacional: ${message}`);
    error.code = 'UNKNOWN';
    error.details = { remoteMessage: message };
    return error;
}

const plan = {
    action: 'delete_invoice',
    planDigest: DIGEST,
    effects: {
        delete: {
            registered_invoices: ['NF-1'],
            pendencies: ['P-1', 'P-2'],
            pendency_attempts: ['A-1'],
            pendency_contacts: [],
            assets: []
        },
        update: [{ entity: 'verifications', id: 'V-1', field: 'analysis.notaFiscal', before: 'Incorreto', after: 'Correto' }]
    },
    preserved: { bonusResult: 'apta' },
    warnings: [],
    blockers: []
};

test('buildRequest monta pedido canônico sem exigir justificativa', () => {
    const request = buildRequest({ action: 'delete_invoice', target: { ...target, id: 'NF-1' } });
    assert.deepEqual(request, {
        contractVersion: 1,
        action: 'delete_invoice',
        target: { kind: 'invoice', schoolId: 'ESC-1', competence: '2026-10', id: 'NF-1', programId: 'PDDE_BASICO' }
    });
    assert.equal('note' in request, false);
});

test('buildRequest rejeita ação desconhecida e alvos incompletos', () => {
    assert.throws(() => buildRequest({ action: 'drop_table', target }), OperationalCorrectionError);
    assert.throws(() => buildRequest({ action: 'delete_invoice', target }), /registro a ser excluído/);
    assert.throws(
        () => buildRequest({ action: 'clear_analysis', target: { ...target, documentKey: 'notaFiscal' } }),
        /individual/
    );
    assert.throws(
        () => buildRequest({ action: 'correct_analysis', target: { ...target, documentKey: 'extCC' }, changes: { analysis: 'Talvez' } }),
        /novo resultado/
    );
});

test('buildRequest normaliza seleção explícita de Pendências e aceita nota opcional', () => {
    const request = buildRequest({
        action: 'correct_analysis',
        target: { ...target, documentKey: 'extCC' },
        changes: { analysis: 'Correto' },
        selectedPendencyIds: ['P-2', ' P-1 ', 'P-2', ''],
        note: '  Lançado por engano  '
    });
    assert.deepEqual(request.selectedPendencyIds, ['P-1', 'P-2']);
    assert.equal(request.note, 'Lançado por engano');
    assert.deepEqual(request.changes, { analysis: 'Correto' });
});

test('describePlan traduz efeitos para o diálogo de confirmação', () => {
    const view = describePlan(plan);
    assert.equal(view.canApply, true);
    assert.equal(view.summary, 'Serão excluídos: 1 nota fiscal, 2 Pendências, 1 envio da escola.');
    assert.deepEqual(view.changes[0], {
        entity: 'verifications', id: 'V-1', field: 'analysis.notaFiscal', before: 'Incorreto', after: 'Correto'
    });
    assert.equal(describePlan({ ...plan, blockers: [{ code: 'MANDATORY_PENDENCY', message: 'x' }] }).canApply, false);
    assert.equal(describePlan({ ...plan, planDigest: 'curto' }).canApply, false);
});

test('preview delega o plano ao servidor e não envia a nota para o cálculo do digest', async () => {
    const repository = fakeRepository([plan]);
    const client = createOperationalCorrectionClient({ repository, newOperationKey: () => 'k-1' });
    const result = await client.preview({ action: 'delete_invoice', target: { ...target, id: 'NF-1' }, note: 'duplicada' });
    assert.equal(repository.calls[0].name, 'preview_operational_change');
    assert.equal('note' in repository.calls[0].args.p_request, false);
    assert.equal(result.request.note, 'duplicada');
    assert.equal(result.view.planDigest, DIGEST);
});

test('apply envia digest e operationKey estáveis e reaproveita a chave em nova tentativa', async () => {
    const network = new Error('fetch failed');
    network.code = 'NETWORK_ERROR';
    const receipt = { committed: true, replayed: false, operationKey: 'k-1' };
    const repository = fakeRepository([plan, network, receipt]);
    let keys = 0;
    const client = createOperationalCorrectionClient({ repository, newOperationKey: () => `k-${++keys}` });
    const previewResult = await client.preview({ action: 'delete_invoice', target: { ...target, id: 'NF-1' } });
    const confirmation = client.prepareConfirmation(previewResult);

    await assert.rejects(client.apply(confirmation), error => error.code === 'NETWORK_ERROR' && error.retryable === true);
    assert.deepEqual(await client.apply(confirmation), receipt);

    const applies = repository.calls.filter(call => call.name === 'apply_operational_change');
    assert.equal(applies.length, 2);
    assert.equal(keys, 1, 'uma única operationKey por confirmação');
    for (const call of applies) {
        assert.equal(call.args.p_plan_digest, DIGEST);
        assert.equal(call.args.p_operation_key, 'k-1');
    }
});

test('prepareConfirmation impede aplicar plano bloqueado', async () => {
    const blocked = { ...plan, blockers: [{ code: 'MANDATORY_PENDENCY', message: 'Exclua a despesa.' }] };
    const client = createOperationalCorrectionClient({ repository: fakeRepository([blocked]) });
    const previewResult = await client.preview({ action: 'delete_pendency', target: { ...target, id: 'P-1' } });
    assert.throws(() => client.prepareConfirmation(previewResult), error => error.code === 'PLAN_BLOCKED' && /Exclua a despesa/.test(error.message));
});

test('erros do servidor viram mensagens orientadas ao usuário', async () => {
    const cases = [
        ['STALE_PLAN: o alcance da operação mudou', 'STALE_PLAN'],
        ['IDEMPOTENCY_CONFLICT: operationKey já utilizada', 'IDEMPOTENCY_CONFLICT'],
        ['ACTION_NOT_AVAILABLE: a ação correct_contact', 'ACTION_NOT_AVAILABLE'],
        ['ASSET_ALREADY_INVENTORIED: assets/B-1', 'ASSET_ALREADY_INVENTORIED']
    ];
    for (const [message, code] of cases) {
        const client = createOperationalCorrectionClient({ repository: fakeRepository([remoteError(message)]) });
        await assert.rejects(
            client.preview({ action: 'delete_invoice', target: { ...target, id: 'NF-1' } }),
            error => error instanceof OperationalCorrectionError && error.code === code && error.message.length > 10
        );
    }
});

test('apply exige recibo confirmado pelo servidor', async () => {
    const client = createOperationalCorrectionClient({ repository: fakeRepository([plan, { committed: false }]), newOperationKey: () => 'k' });
    const confirmation = client.prepareConfirmation(await client.preview({ action: 'delete_invoice', target: { ...target, id: 'NF-1' } }));
    await assert.rejects(client.apply(confirmation), error => error.code === 'NOT_COMMITTED');
});

test('apply congela o payload da requisicao na primeira tentativa para evitar IDEMPOTENCY_CONFLICT ao repetir com outra nota', async () => {
    const network = new Error('fetch failed');
    network.code = 'NETWORK_ERROR';
    const receipt = { committed: true, replayed: true, operationKey: 'k-note-1' };
    const repository = fakeRepository([plan, network, receipt]);
    const client = createOperationalCorrectionClient({ repository, newOperationKey: () => 'k-note-1' });
    const previewResult = await client.preview({ action: 'delete_invoice', target: { ...target, id: 'NF-1' } });
    const confirmation = client.prepareConfirmation(previewResult);

    await assert.rejects(
        client.apply(confirmation, { note: 'Nota original na primeira tentativa' }),
        error => error.code === 'NETWORK_ERROR'
    );
    await client.apply(confirmation, { note: 'Nota editada antes do retry' });

    const applies = repository.calls.filter(call => call.name === 'apply_operational_change');
    assert.equal(applies.length, 2);
    assert.equal(applies[0].args.p_operation_key, 'k-note-1');
    assert.equal(applies[1].args.p_operation_key, 'k-note-1');
    assert.deepEqual(applies[1].args.p_request, applies[0].args.p_request);
    assert.equal(applies[1].args.p_request.note, 'Nota original na primeira tentativa');
});
