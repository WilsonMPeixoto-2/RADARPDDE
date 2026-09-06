'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const feedback = require('../../src/integration/operational-write-feedback.js');

test('nota fiscal salva e sincronizada recebe confirmação visual de sucesso', () => {
    const result = feedback.feedbackForResult('invoice:save', {
        ok: true,
        stateSync: {
            status: 'applied',
            remoteCommitConfirmed: true,
            localStateApplied: true,
            refreshRequired: false
        },
        refreshPending: false,
        stateApplyErrorCode: null
    });

    assert.deepEqual(result, {
        kind: 'success',
        message: 'Nota fiscal salva com sucesso.',
        persistent: false
    });
});

test('commit remoto confirmado sem sincronização local avisa para atualizar sem mandar salvar novamente', () => {
    const result = feedback.feedbackForResult('invoice:save', {
        ok: true,
        stateSync: {
            status: 'failed',
            remoteCommitConfirmed: true,
            localStateApplied: false,
            refreshRequired: true
        },
        refreshPending: true,
        stateApplyErrorCode: 'LOCAL_STATE_APPLY_FAILED'
    });

    assert.equal(result.kind, 'warning');
    assert.equal(result.persistent, true);
    assert.equal(
        result.message,
        'A alteração foi salva, mas a tela não conseguiu atualizar os dados. Atualize a página antes de continuar.'
    );
    assert.doesNotMatch(result.message, /salve novamente|tente novamente|repita/i);
});

test('feedback explícito cobre as operações patrimoniais aprovadas sem gerar mensagem para outras escritas', () => {
    const synced = {
        ok: true,
        stateSync: { status: 'applied', remoteCommitConfirmed: true, localStateApplied: true, refreshRequired: false },
        refreshPending: false,
        stateApplyErrorCode: null
    };

    assert.equal(
        feedback.feedbackForResult('inventory:update-asset', synced)?.message,
        'Alterações do bem salvas com sucesso.'
    );
    assert.equal(
        feedback.feedbackForResult('inventory:forward', synced)?.message,
        'Encaminhamento para inventariação salvo com sucesso.'
    );
    assert.equal(
        feedback.feedbackForResult('inventory:complete', synced)?.message,
        'Inventariação salva com sucesso.'
    );
    assert.equal(feedback.feedbackForResult('verification:set-bonification', synced), null);
});

test('wrapper de feedback executa a gravação original uma única vez', async () => {
    let executions = 0;
    const notices = [];
    class FakeDataService {
        async execute(command) {
            executions += 1;
            return {
                ok: true,
                value: command.name,
                stateSync: { status: 'applied', remoteCommitConfirmed: true, localStateApplied: true, refreshRequired: false },
                refreshPending: false,
                stateApplyErrorCode: null
            };
        }
    }

    const root = {
        RadarDataService: { DataService: FakeDataService },
        document: {},
        setTimeout
    };
    feedback.installDataServiceFeedback(root, notice => notices.push(notice));

    const service = new FakeDataService();
    const result = await service.execute({ name: 'invoice:save' });

    assert.equal(executions, 1);
    assert.equal(result.ok, true);
    assert.equal(notices.length, 1);
    assert.equal(notices[0].kind, 'success');
});
