'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    shouldAnimateNavigation,
    runViewTransition
} = require('../../src/integration/view-transitions.js');

const repoRoot = path.resolve(__dirname, '../..');

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

test('não aplica nome de transição ao conteúdo durante a carga inicial', () => {
    const script = fs.readFileSync(
        path.join(repoRoot, 'src/integration/view-transitions.js'),
        'utf8'
    );
    const styles = fs.readFileSync(
        path.join(repoRoot, 'src/styles/view-transitions.css'),
        'utf8'
    );

    assert.doesNotMatch(script, /style\.viewTransitionName\s*=/);
    assert.doesNotMatch(styles, /#main-container\s*\{[^}]*view-transition-name/s);
    assert.match(styles, /::view-transition-old\(root\)/);
    assert.match(styles, /::view-transition-new\(root\)/);
});
