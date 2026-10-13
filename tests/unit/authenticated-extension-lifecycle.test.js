'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createHarness({ loading = false } = {}) {
    const listeners = new Map();
    const domListeners = new Map();
    const intervals = new Map();
    const timeouts = [];
    const frames = [];
    const calls = { render: 0, detail: 0, navigation: 0, projection: 0, inventory: 0 };
    let sequence = 0;
    let competenceInitialized = false;
    const liveRegion = { dataset: {}, setAttribute() {}, textContent: '' };
    const document = {
        readyState: loading ? 'loading' : 'complete',
        getElementById(id) {
            if (['modal-pendency-contact', 'modal-retification'].includes(id)) return {};
            if (id === 'task-10-11-live-region') return liveRegion;
            return null;
        },
        querySelectorAll: () => [],
        addEventListener(type, callback) {
            domListeners.set(type, [...(domListeners.get(type) || []), callback]);
        },
        removeEventListener(type, callback) {
            domListeners.set(type, (domListeners.get(type) || []).filter(item => item !== callback));
        }
    };
    const root = {
        document,
        RadarPendencias: {},
        RadarPendenciasViewModel: {},
        RadarAccessPolicy: { CAPABILITIES: { CANCEL_PENDENCY: 'cancel' }, hasCapability: () => false },
        RadarRetificacoes: { canRetify: () => false },
        RadarFluxoOperacional: {},
        RadarTask9PendencyPage: { getState: () => ({ filters: { competence: '' } }) },
        RadarCompetenceContext: { isInitialized: () => competenceInitialized },
        getRadarAccessProfile: () => 'sme',
        renderPendencias() { calls.render++; return 'rendered'; },
        openPendencyDetail() { calls.detail++; return 'opened'; },
        resolvePendencyIdReference: source => source,
        encodePendencyIdReference: source => source,
        renderProntuario() { calls.render++; return 'rendered'; },
        toggleBonif: () => 'delegated',
        switchView() { calls.navigation++; return 'navigated'; },
        changePendencyFilter() {},
        getEscolaOperationalData() { calls.projection++; return { pendenciasAbertas: [] }; },
        inventariarBem() { calls.inventory++; return 'inventory'; },
        addEventListener(type, callback) {
            listeners.set(type, [...(listeners.get(type) || []), callback]);
        },
        removeEventListener(type, callback) {
            listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
        },
        CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
        dispatchEvent(event) {
            [...(listeners.get(event.type) || [])].forEach(callback => callback(event));
        },
        requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
        setInterval(callback, milliseconds) { intervals.set(++sequence, { callback, milliseconds }); return sequence; },
        clearInterval(id) { intervals.delete(id); },
        setTimeout(callback, milliseconds) { timeouts.push({ callback, milliseconds }); return ++sequence; }
    };
    const context = vm.createContext({ window: root, document, currentView: 'dashboard' });
    return {
        root, calls, intervals,
        load(file) {
            vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../src/integration', file), 'utf8'), context);
        },
        advancePastLoginDeadline() {
            // No wall-clock waiting: expire the original bounded-installation deadline.
            timeouts.filter(item => item.milliseconds <= 11000).forEach(item => item.callback());
        },
        publishServices() {
            root.RadarApplicationServices = { pendencies: {}, verifications: {} };
            this.dispatch('radar:application-services-ready');
        },
        publishCompetence() {
            competenceInitialized = true;
            this.dispatch('radar:competence-change');
        },
        dispatch(type) { [...(listeners.get(type) || [])].forEach(callback => callback({ type })); },
        finishDom() {
            document.readyState = 'complete';
            [...(domListeners.get('DOMContentLoaded') || [])].forEach(callback => callback());
        },
        tickInstallationIntervals() {
            [...intervals.values()].forEach(item => item.callback());
        },
        flushFrames() { while (frames.length) frames.shift()(); }
    };
}

test('Pendency page installed after DOM/services restores its dependent capabilities', () => {
    const harness = createHarness({ loading: true });
    delete harness.root.RadarTask9PendencyPage;
    const originalRenderer = harness.root.renderPendencias;
    harness.root.renderPendencias = undefined;
    harness.load('task-9-pendencias-page.js');
    harness.load('task-10-11-pendency-actions.js');
    harness.load('operational-readiness-bridge.js');
    harness.root.renderPendencias = originalRenderer;
    harness.finishDom();
    harness.publishServices();
    harness.publishCompetence();
    // Readiness now installs the page directly; no discovery timer is required.
    assert.ok(harness.root.RadarTask9PendencyPage);
    assert.ok(harness.root.RadarTask1011PendencyActions,
        'The page authority must notify actions that could not install at the services event');
    assert.ok(harness.root.RadarOperationalReadinessBridge,
        'The page authority must notify the competence bridge without needing another user gesture');
    assert.equal(harness.intervals.size, 0);
});

for (const [file, api, wrappedHandler] of [
    ['task-10-11-pendency-actions.js', 'RadarTask1011PendencyActions', 'renderPendencias'],
    ['task-12-13-retificacoes.js', 'RadarTask1213Retifications', 'renderProntuario']
]) {
    test(`${file}: late authentication installs once and delegates the original renderer once`, () => {
        const harness = createHarness();
        harness.load(file);
        assert.equal(harness.root[api], undefined, 'UI capability must not claim readiness before its dependencies');
        harness.advancePastLoginDeadline();
        harness.publishServices();
        assert.ok(harness.root[api], 'A legitimate late login must restore the complete UI capability');
        const renderer = harness.root[wrappedHandler];
        harness.publishServices();
        harness.dispatch('radar:competence-change');
        assert.equal(harness.root[wrappedHandler], renderer, 'Repeated lifecycle events must not stack wrappers');
        assert.equal(renderer('ESC-LOCAL'), 'rendered');
        harness.flushFrames();
        assert.equal(harness.calls.render, 1);
        assert.equal(harness.intervals.size, 0, 'Installation must not leave readiness polling active');
    });

    test(`${file}: script loaded after services are ready installs immediately`, () => {
        const harness = createHarness();
        harness.publishServices();
        harness.load(file);
        assert.ok(harness.root[api]);
        assert.equal(harness.intervals.size, 0);
    });

    test(`${file}: DOM readiness can complete dependencies after a services event`, () => {
        const harness = createHarness({ loading: true });
        const renderer = harness.root[wrappedHandler];
        harness.root[wrappedHandler] = undefined;
        harness.load(file);
        harness.publishServices();
        assert.equal(harness.root[api], undefined);
        harness.root[wrappedHandler] = renderer;
        harness.finishDom();
        assert.ok(harness.root[api]);
    });
}

test('late installation preserves denied Pendency mutations for a read-only profile', () => {
    const harness = createHarness();
    harness.load('task-10-11-pendency-actions.js');
    harness.advancePastLoginDeadline();
    harness.publishServices();
    assert.equal(harness.root.openCancelPendencyModal('missing'), false);
    assert.equal(harness.calls.detail, 0);
});

for (const order of ['services-first', 'competence-first']) {
    test(`operational bridge waits for the actual competence in ${order} lifecycle order`, () => {
        const harness = createHarness();
        harness.load('operational-readiness-bridge.js');
        harness.advancePastLoginDeadline();
        if (order === 'services-first') {
            harness.publishServices();
            assert.equal(harness.root.RadarOperationalReadinessBridge, undefined);
            harness.publishCompetence();
        } else {
            harness.publishCompetence();
            harness.publishServices();
        }
        assert.ok(harness.root.RadarOperationalReadinessBridge);
        const navigation = harness.root.switchView;
        harness.publishServices();
        harness.publishCompetence();
        assert.equal(harness.root.switchView, navigation);
        assert.equal(harness.root.switchView('escolas'), 'navigated');
        assert.equal(harness.calls.navigation, 1);
        assert.equal(harness.intervals.size, 0);
    });
}
