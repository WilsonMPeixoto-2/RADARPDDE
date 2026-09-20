'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '../../src/integration/operational-context-refresh.js'),
    'utf8'
);

test('sessão remota atualiza somente a competência ativa ao voltar para a aba', () => {
    assert.match(source, /visibilitychange/);
    assert.match(source, /focus/);
    assert.match(source, /loadOperationalContext\(competenceKey/);
    assert.doesNotMatch(source, /setInterval\s*\(/);
    assert.doesNotMatch(source, /administrativeLogs/);
});

test('atualização contextual é limitada por janela mínima e rerenderiza somente após confirmação', () => {
    assert.match(source, /MIN_REFRESH_INTERVAL_MS/);
    assert.match(source, /await\s+service\.loadOperationalContext[\s\S]*refreshCurrentView/);
    assert.match(source, /refreshPromise/);
    assert.match(source, /durationMs/);
});

const {
    createController,
    dialogActuallyOpen,
    editing: isEditing
} = require('../../src/integration/operational-context-refresh.js');

test('retomada usa a visão canônica, preserva formulários e descarta sessão encerrada durante a consulta', async () => {
    let editing = true, resolveQuery, shouldApply;
    const renders = [], calls = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView: () => renders.push('prontuario-school-1') },
        document: { querySelectorAll: () => editing ? [{}] : [] },
        console: { warn() {} }
    };
    const service = { loadOperationalContext(key, options) {
        calls.push(key); shouldApply = options.shouldApply;
        return new Promise(resolve => { resolveQuery = resolve; });
    } };
    const controller = createController(root, service, { minIntervalMs: 0 });
    const skipped = await controller.refresh();
    assert.equal(skipped.reason, 'editing');
    assert.equal(skipped.pending, true);
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(calls.length, 0);

    editing = false;
    const pending = controller.flushPending();
    await Promise.resolve();
    assert.equal(shouldApply(), true);
    root.RadarAuthContext = null;
    assert.equal(shouldApply(), false);
    resolveQuery({ stale: true });
    await pending;
    assert.equal(renders.length, 0);

    root.RadarAuthContext = {};
    const next = controller.refresh();
    await Promise.resolve();
    resolveQuery({ stale: false });
    await next;
    assert.deepEqual(renders, ['prontuario-school-1']);
});

test('refresh adiado é retomado após a edição e só atualiza o relógio depois de sucesso confirmado', async () => {
    let editing = true;
    const renders = [];
    const events = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView: () => renders.push('dashboard') },
        document: { querySelectorAll: () => editing ? [{}] : [] },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { events.push(event); },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            return { stale: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 30000 });

    assert.equal(controller.getLastRefreshAt(), 0);
    await controller.refresh('focus');
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(controller.getLastRefreshAt(), 0);

    editing = false;
    const result = await controller.flushPending('form-finished');
    assert.equal(result.stale, false);
    assert.equal(controller.hasPendingRefresh(), false);
    assert.ok(controller.getLastRefreshAt() > 0);
    assert.deepEqual(renders, ['dashboard']);
    assert.equal(events.at(-1).type, 'radar:operational-context-refreshed');
    assert.equal(events.at(-1).detail.competenceKey, '2026-08');
    assert.equal(typeof events.at(-1).detail.durationMs, 'number');
    assert.match(events.at(-1).detail.refreshedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('falha de refresh não avança lastRefreshAt nem apaga a necessidade de nova tentativa adiada', async () => {
    let editing = true;
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: { querySelectorAll: () => editing ? [{}] : [] },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            throw new Error('network');
        }
    };
    const controller = createController(root, service, { minIntervalMs: 30000 });

    await controller.refresh('focus');
    editing = false;
    const result = await controller.flushPending('form-finished');

    assert.equal(result.ok, false);
    assert.equal(controller.getLastRefreshAt(), 0);
    assert.equal(controller.hasPendingRefresh(), true);
});


function fakeDialog({
    id = '',
    hidden = false,
    ariaHidden = null,
    inert = false,
    overlayVisible = true,
    display = 'block',
    visibility = 'visible'
} = {}) {
    const attributes = new Map();
    if (ariaHidden != null) attributes.set('aria-hidden', String(ariaHidden));
    if (inert) attributes.set('inert', '');
    return {
        id,
        hidden,
        getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
        hasAttribute(name) { return attributes.has(name); },
        matches(selector) {
            if (selector === 'dialog') return false;
            if (selector === '.modal-overlay') return false;
            return false;
        },
        closest(selector) {
            if (selector === '[hidden], [inert], [aria-hidden="true"]') {
                return hidden || inert || ariaHidden === 'true' ? this : null;
            }
            if (selector === '.modal-overlay') {
                return {
                    classList: {
                        contains(name) {
                            return name === 'show' ? overlayVisible : false;
                        }
                    }
                };
            }
            return null;
        },
        __style: { display, visibility }
    };
}

test('diálogos fechados mantidos no DOM não bloqueiam refresh', () => {
    const closedByAria = fakeDialog({ ariaHidden: 'true', inert: true });
    const closedOverlay = fakeDialog({ overlayVisible: false });
    const authGate = fakeDialog({ id: 'radar-auth-gate' });
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        getComputedStyle(element) { return element.__style; }
    };

    assert.equal(dialogActuallyOpen(root, closedByAria), false);
    assert.equal(dialogActuallyOpen(root, closedOverlay), false);
    assert.equal(dialogActuallyOpen(root, authGate), false);
});

test('somente diálogo realmente aberto é tratado como edição', () => {
    const closed = fakeDialog({ ariaHidden: 'true', inert: true });
    const open = fakeDialog({ overlayVisible: true });
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        getComputedStyle(element) { return element.__style; },
        document: {
            querySelectorAll() { return [closed]; },
            activeElement: null,
            getElementById() { return null; }
        }
    };

    assert.equal(isEditing(root), false);
    root.document.querySelectorAll = () => [closed, open];
    assert.equal(isEditing(root), true);
});

test('instalação observa fechamento assíncrono para liberar refresh pendente', async () => {
    let modalOpen = true;
    let observerCallback = null;
    let calls = 0;
    const modal = {
        matches(selector) {
            return selector.includes('.modal-overlay');
        },
        classList: {
            contains(name) { return name === 'show'; }
        },
        querySelector() { return null; }
    };
    const document = {
        body: {},
        visibilityState: 'visible',
        addEventListener() {},
        querySelectorAll(selector) {
            if (selector.includes('.modal-overlay.show')) return modalOpen ? [modal] : [];
            return [];
        },
        getElementById() { return null; },
        activeElement: null
    };
    const root = {
        document,
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarApplicationServices: {
            data: {
                repository: { capabilities: () => ({ remote: true }) },
                async loadOperationalContext() {
                    calls += 1;
                    return { stale: false };
                }
            }
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        MutationObserver: class {
            constructor(callback) { observerCallback = callback; }
            observe() {}
        },
        addEventListener() {},
        setTimeout(callback) { callback(); return 1; },
        console: { warn() {} }
    };

    const api = require('../../src/integration/operational-context-refresh.js');
    assert.equal(api.install(root), true);
    await root.RadarOperationalContextRefreshController.refresh('focus');
    assert.equal(root.RadarOperationalContextRefreshController.hasPendingRefresh(), true);
    assert.equal(calls, 0);

    modalOpen = false;
    observerCallback([{ target: modal }]);
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(calls, 1);
    assert.equal(root.RadarOperationalContextRefreshController.hasPendingRefresh(), false);
});


test('remoção assíncrona de camada modal também libera refresh pendente', async () => {
    let modalPresent = true;
    let observerCallback = null;
    let calls = 0;
    const modal = {
        matches(selector) {
            return selector.includes('[role="dialog"]') || selector.includes('.modal-overlay');
        },
        classList: {
            contains(name) { return name === 'show'; }
        },
        querySelector() { return null; },
        getAttribute() { return null; },
        hasAttribute() { return false; },
        closest() { return null; }
    };
    const layer = {
        matches() { return false; },
        querySelector(selector) {
            return selector.includes('[role="dialog"]') ? modal : null;
        }
    };
    const document = {
        body: {},
        visibilityState: 'visible',
        addEventListener() {},
        querySelectorAll() { return modalPresent ? [modal] : []; },
        getElementById() { return null; },
        activeElement: null
    };
    const root = {
        document,
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarApplicationServices: {
            data: {
                repository: { capabilities: () => ({ remote: true }) },
                async loadOperationalContext() {
                    calls += 1;
                    return { stale: false };
                }
            }
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        getComputedStyle() { return { display: 'block', visibility: 'visible' }; },
        MutationObserver: class {
            constructor(callback) { observerCallback = callback; }
            observe(_target, options) {
                assert.equal(options.childList, true);
            }
        },
        addEventListener() {},
        setTimeout(callback) { callback(); return 1; },
        console: { warn() {} }
    };

    const api = require('../../src/integration/operational-context-refresh.js');
    assert.equal(api.install(root), true);
    await root.RadarOperationalContextRefreshController.refresh('focus');
    assert.equal(root.RadarOperationalContextRefreshController.hasPendingRefresh(), true);

    modalPresent = false;
    observerCallback([{
        type: 'childList',
        target: document.body,
        removedNodes: [layer],
        addedNodes: []
    }]);
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(calls, 1);
    assert.equal(root.RadarOperationalContextRefreshController.hasPendingRefresh(), false);
});


test('invalidação recebida durante refresh em voo força releitura após a consulta antiga terminar', async () => {
    let resolveFirst;
    let calls = 0;
    const renders = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        RadarGlobalCompetenceSelector: {
            refreshCurrentView() { renders.push('dashboard'); }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent() {},
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) {
                return new Promise(resolve => { resolveFirst = resolve; });
            }
            return { stale: false, revision: 'newer' };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const first = controller.refresh('focus', { force: true });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 1);

    const realtime = controller.refresh('realtime', { force: true });
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(calls, 1);

    resolveFirst({ stale: false, revision: 'older' });
    await first;
    const result = await realtime;

    assert.equal(result.stale, false);
    assert.equal(result.revision, 'newer');
    assert.equal(calls, 2);
    assert.equal(controller.hasPendingRefresh(), false);
    assert.equal(renders.length, 2);
});

test('invalidação em voo não é perdida quando a primeira consulta falha por rede', async () => {
    let rejectFirst;
    let calls = 0;
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) {
                return new Promise((_resolve, reject) => { rejectFirst = reject; });
            }
            return { stale: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const first = controller.refresh('focus', { force: true });
    await new Promise(resolve => setImmediate(resolve));
    const realtime = controller.refresh('realtime', { force: true });

    rejectFirst(new Error('network'));
    const firstResult = await first;
    const realtimeResult = await realtime;

    assert.equal(firstResult.ok, false);
    assert.equal(realtimeResult.stale, false);
    assert.equal(calls, 2);
    assert.equal(controller.hasPendingRefresh(), false);
});

test('invalidação em voo força releitura também após consulta antiga cancelada como stale', async () => {
    let resolveFirst;
    let calls = 0;
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) {
                return new Promise(resolve => { resolveFirst = resolve; });
            }
            return { stale: false, revision: 'fresh' };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 0 });

    const first = controller.refresh('focus', { force: true });
    await new Promise(resolve => setImmediate(resolve));
    const realtime = controller.refresh('realtime', { force: true });

    resolveFirst({ stale: true, aborted: true });
    const firstResult = await first;
    const realtimeResult = await realtime;

    assert.equal(firstResult.stale, true);
    assert.equal(firstResult.aborted, true);
    assert.equal(realtimeResult.stale, false);
    assert.equal(realtimeResult.revision, 'fresh');
    assert.equal(calls, 2);
    assert.equal(controller.hasPendingRefresh(), false);
});
