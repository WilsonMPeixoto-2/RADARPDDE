'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    shouldAnimateNavigation,
    runViewTransition,
    createNavigationActivation,
    createNavigationIntent
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

test('anima somente quando a API existe, a página está estável e não há redução de movimento', () => {
    assert.equal(shouldAnimateNavigation(createRoot().root, true), true);
    assert.equal(shouldAnimateNavigation(createRoot().root, false), false);
    assert.equal(shouldAnimateNavigation(createRoot({ supported: false }).root, true), false);
    assert.equal(shouldAnimateNavigation(createRoot({ reduced: true }).root, true), false);
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

test('ativa transições somente após load, primeira rota e dois frames estáveis', () => {
    let loadHandler;
    const frames = [];
    const root = {
        document: { readyState: 'loading' },
        addEventListener(type, handler) {
            if (type === 'load') loadHandler = handler;
        },
        requestAnimationFrame(handler) {
            frames.push(handler);
        }
    };

    const activation = createNavigationActivation(root);
    assert.equal(activation.isActive(), false);
    assert.equal(typeof loadHandler, 'function');

    loadHandler();
    assert.equal(activation.isActive(), false);
    assert.equal(frames.length, 0);

    activation.noteNavigation();
    assert.equal(frames.length, 1);
    frames.shift()();
    assert.equal(activation.isActive(), false);
    assert.equal(frames.length, 1);
    frames.shift()();
    assert.equal(activation.isActive(), true);
});

test('reinicia a estabilização quando outra rota inicial é aplicada', () => {
    const frames = [];
    const root = {
        document: { readyState: 'complete' },
        requestAnimationFrame(handler) {
            frames.push(handler);
        }
    };
    const activation = createNavigationActivation(root);

    activation.noteNavigation();
    const firstFrame = frames.shift();
    activation.noteNavigation();
    firstFrame();
    frames.shift()();
    assert.equal(activation.isActive(), false);

    frames.shift()();
    frames.shift()();
    assert.equal(activation.isActive(), true);
});

test('consome intenção somente em navegação principal ou resultado da busca', () => {
    const listeners = new Map();
    const microtasks = [];
    const document = {
        addEventListener(type, handler) {
            listeners.set(type, handler);
        }
    };
    const intent = createNavigationIntent({
        document,
        queueMicrotask(handler) {
            microtasks.push(handler);
        }
    });

    const navigationTarget = {
        closest(selector) {
            return selector.includes('.nav-item') ? this : null;
        },
        matches() { return false; }
    };
    listeners.get('click')({
        type: 'click',
        isTrusted: true,
        target: navigationTarget
    });
    assert.equal(intent.consume(), true);
    assert.equal(intent.consume(), false);

    const tabTarget = {
        closest() { return null; },
        matches() { return false; }
    };
    listeners.get('click')({
        type: 'click',
        isTrusted: true,
        target: tabTarget
    });
    assert.equal(intent.consume(), false);

    const searchInput = {
        closest() { return null; },
        matches(selector) { return selector === '#global-search'; }
    };
    listeners.get('keydown')({
        type: 'keydown',
        key: 'Enter',
        isTrusted: true,
        target: searchInput
    });
    assert.equal(intent.consume(), true);

    listeners.get('click')({
        type: 'click',
        isTrusted: false,
        target: navigationTarget
    });
    assert.equal(intent.consume(), false);

    microtasks.forEach(handler => handler());
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
