'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const navigation = require('../../src/integration/navigation-history.js');
const context = require('../../src/integration/operational-context-refresh.js');
const realtime = require('../../src/integration/operational-realtime-invalidation.js');

const settle = () => new Promise(resolve => setImmediate(resolve));

async function session(t) {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 100000 });
    const root = new EventTarget();
    let onBroadcast;
    let onStatus;
    const reads = [];
    const renders = [];
    let canonical = 1;
    let projected = 0;
    Object.assign(root, {
        CustomEvent,
        setTimeout: (...args) => setTimeout(...args),
        clearTimeout: (...args) => clearTimeout(...args),
        location: { pathname: '/escolas/SCHOOL-A', search: '' },
        history: {
            state: null,
            replaceState(state) { this.state = state; },
            pushState(state) { this.state = state; }
        },
        document: { activeElement: null, querySelectorAll: () => [], getElementById: () => null },
        RadarAuthContext: { user: { id: 'controller' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarNavigationHistory: navigation,
        switchView(view, school) { renders.push({ view, school, projected }); },
        RadarGlobalCompetenceSelector: {
            refreshCurrentView() {
                const route = navigation.currentRoute(root);
                root.switchView(route.view, route.param);
            }
        },
        console: { warn() {} }
    });
    navigation.install(root);
    navigation.applyPendingRoute(root);
    const controller = context.createController(root, {
        async loadOperationalContext(_key, options) {
            reads.push(canonical);
            if (!options.shouldApply()) return { stale: true };
            projected = canonical;
            return { stale: false };
        }
    });
    const channel = {
        on(_type, _filter, callback) { onBroadcast = callback; return this; },
        subscribe(callback) { onStatus = callback; return this; }
    };
    const sync = realtime.createController(root, {
        client: { channel: () => channel, realtime: { async setAuth() {} }, async removeChannel() {} },
        refreshController: controller
    });
    await sync.start();
    onStatus('SUBSCRIBED');
    return {
        root, reads, renders, sync,
        change(school) { canonical += 1; onBroadcast({ payload: { entity: 'verifications', schoolId: school } }); },
        navigate(view, school) { root.switchView(view, school); },
        async advance(ms = 2000) { t.mock.timers.tick(ms); await settle(); }
    };
}

for (const route of [{ view: 'prontuario', school: 'SCHOOL-B' }, { view: 'dashboard', school: null }]) {
    test(`reconciliação ao navegar para ${route.view} não agenda nova leitura pela própria renderização`, async t => {
        const tab = await session(t);
        tab.change('SCHOOL-B');
        await tab.advance();
        assert.equal(tab.reads.length, 0);
        tab.navigate(route.view, route.school);
        await tab.advance();
        assert.deepEqual(tab.reads, [2]);
        assert.equal(tab.renders.at(-1).projected, 2, 'a navegação passa a mostrar o estado canônico');
        await tab.advance();
        await tab.advance(31000);
        assert.deepEqual(tab.reads, [2], 'renderizar a resposta não é uma nova invalidação');
        assert.deepEqual(tab.sync.getMetrics().dirtySchoolIds, []);
        await tab.sync.stop();
    });
}
