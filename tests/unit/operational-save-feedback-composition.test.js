'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const feedback = require('../../src/integration/operational-write-feedback.js');
const performance = require('../../src/integration/operational-write-performance.js');

function syncedResult() {
    return {
        ok: true,
        stateSync: {
            status: 'applied',
            remoteCommitConfirmed: true,
            localStateApplied: true,
            refreshRequired: false
        },
        refreshPending: false,
        stateApplyErrorCode: null
    };
}

function createRoot(service) {
    return {
        RadarDataService: { DataService: service.constructor },
        RadarApplicationServices: { invoices: { dataService: service } },
        document: {},
        addEventListener() {},
        setTimeout,
        clearTimeout,
        queueMicrotask
    };
}

test('feedback continua alcançável quando performance já capturou execute na instância', async () => {
    let executions = 0;
    const notices = [];
    class FakeDataService {
        async execute() {
            executions += 1;
            return syncedResult();
        }
    }
    const service = new FakeDataService();
    const root = createRoot(service);

    assert.equal(performance.patchDataService(service, root), true);
    assert.equal(feedback.installDataServiceFeedback(root, notice => notices.push(notice)), true);

    await service.execute({ name: 'invoice:save' });

    assert.equal(executions, 1, 'a composição não pode repetir a escrita');
    assert.equal(notices.length, 1, 'o aviso precisa alcançar a fronteira realmente invocada');
    assert.equal(notices[0].kind, 'success');
});

test('feedback antes de performance e reinstalação tardia mantêm uma execução e um aviso', async () => {
    let executions = 0;
    const notices = [];
    class FakeDataService {
        async execute() {
            executions += 1;
            return syncedResult();
        }
    }
    const service = new FakeDataService();
    const root = createRoot(service);

    assert.equal(feedback.installDataServiceFeedback(root, notice => notices.push(notice)), true);
    assert.equal(performance.patchDataService(service, root), true);
    assert.equal(feedback.installDataServiceFeedback(root, notice => notices.push(notice)), true);

    await service.execute({ name: 'inventory:forward' });

    assert.equal(executions, 1);
    assert.equal(notices.length, 1);
});

test('timer de sucesso não oculta uma mensagem mais nova na região compartilhada', () => {
    let timer = null;
    const notice = {
        textContent: '',
        dataset: {},
        hidden: true
    };
    const root = {
        document: { getElementById: id => id === 'pendency-notice' ? notice : null },
        setTimeout(fn) { timer = fn; return 1; },
        clearTimeout() {}
    };

    feedback.showSaveNotice(root, { kind: 'success', message: 'Salvo', persistent: false });
    notice.textContent = 'Informe as observações da pendência.';
    notice.dataset.variant = 'danger';
    notice.hidden = false;

    timer();

    assert.equal(notice.hidden, false);
    assert.equal(notice.textContent, 'Informe as observações da pendência.');
    assert.equal(notice.dataset.variant, 'danger');
});

test('limpar mensagem de Pendência restaura advertência persistente de sincronização', () => {
    const notice = {
        textContent: '',
        dataset: {},
        hidden: true
    };
    const root = {
        document: { getElementById: id => id === 'pendency-notice' ? notice : null },
        setTimeout,
        clearTimeout
    };
    feedback.showSaveNotice(root, {
        kind: 'warning',
        message: feedback.SYNC_WARNING_MESSAGE,
        persistent: true
    });

    const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
    const start = appSource.indexOf('function showPendencyNotice(');
    const end = appSource.indexOf('function createPendencyClientId(');
    assert.notEqual(start, -1);
    assert.notEqual(end, -1);
    const context = vm.createContext({ document: root.document, clearTimeout });
    vm.runInContext(appSource.slice(start, end), context);

    context.showPendencyNotice('Informe as observações da pendência.', 'danger');
    assert.equal(notice.textContent, 'Informe as observações da pendência.');
    context.clearPendencyNotice();

    assert.equal(notice.hidden, false);
    assert.equal(notice.textContent, feedback.SYNC_WARNING_MESSAGE);
    assert.equal(notice.dataset.radarSaveFeedback, 'warning');
});
