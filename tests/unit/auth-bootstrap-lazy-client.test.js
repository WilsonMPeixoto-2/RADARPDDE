'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const authBootstrap = require('../../src/integration/auth-bootstrap.js');

test('cliente Supabase é carregado sob demanda quando a conexão remota está ativa', async () => {
    assert.equal(typeof authBootstrap.ensureSupabaseClient, 'function');

    const appended = [];
    const root = {
        document: {
            querySelector() { return null; },
            createElement() {
                return {
                    dataset: {},
                    addEventListener(type, handler) {
                        this[`on:${type}`] = handler;
                    },
                    removeEventListener() {}
                };
            },
            head: {
                appendChild(script) {
                    appended.push(script);
                    root.supabase = { createClient() {} };
                    queueMicrotask(() => script['on:load']());
                }
            }
        }
    };

    const clientApi = await authBootstrap.ensureSupabaseClient(root);

    assert.equal(appended.length, 1);
    assert.equal(appended[0].src, 'vendor/supabase-client.js');
    assert.equal(appended[0].async, true);
    assert.equal(appended[0].dataset.radarSupabaseClient, 'true');
    assert.equal(clientApi, root.supabase);
});

test('cliente Supabase já disponível não dispara nova carga', async () => {
    let creates = 0;
    const root = {
        supabase: { createClient() {} },
        document: {
            createElement() { creates += 1; }
        }
    };

    const clientApi = await authBootstrap.ensureSupabaseClient(root);
    assert.equal(clientApi, root.supabase);
    assert.equal(creates, 0);
});

test('cada instância do navegador recebe identificador operacional próprio e estável', () => {
    assert.equal(typeof authBootstrap.ensureOperationalClientInstanceId, 'function');
    let generated = 0;
    const root = {
        crypto: {
            randomUUID() {
                generated += 1;
                return '11111111-2222-4333-8444-555555555555';
            }
        }
    };

    const first = authBootstrap.ensureOperationalClientInstanceId(root);
    const second = authBootstrap.ensureOperationalClientInstanceId(root);

    assert.equal(first, '11111111-2222-4333-8444-555555555555');
    assert.equal(second, first);
    assert.equal(root.RadarOperationalClientInstanceId, first);
    assert.equal(generated, 1, 'a identidade da aba não pode mudar entre gravações');
});
