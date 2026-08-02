'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    shouldAnimateNavigation,
    runViewTransition
} = require('../../src/integration/view-transitions.js');

function createRoot({ supported = true, reduced = false } = {}) {
    const calls = [];
    const root = {
        document: supported ? {
            startViewTransition(update) {
                calls.push('transition');
                return { updateCallbackDone: Promise.resolve(update()) };
            }
        } : {},
        matchMedia() {
            return { matches: reduced };
        }
    };
    return { root, calls };
}

test('anima somente quando a API existe e não há redução de movimento', () => {
    assert.equal(shouldAnimateNavigation(createRoot().root), true);
    assert.equal(shouldAnimateNavigation(createRoot({ supported: false }).root), false);
    assert.equal(shouldAnimateNavigation(createRoot({ reduced: true }).root), false);
});

test('executa a atualização uma única vez com ou sem transição', async () => {
    const animated = createRoot();
    let animatedUpdates = 0;
    await runViewTransition(animated.root, () => {
        animatedUpdates += 1;
        return 'ok';
    });
    assert.equal(animatedUpdates, 1);
    assert.deepEqual(animated.calls, ['transition']);

    const fallback = createRoot({ supported: false });
    let fallbackUpdates = 0;
    const result = await runViewTransition(fallback.root, () => {
        fallbackUpdates += 1;
        return 'fallback';
    });
    assert.equal(result, 'fallback');
    assert.equal(fallbackUpdates, 1);
});
