'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

async function clientWith(fetchImpl) {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient('http://supabase.retry.test', 'sb_publishable_retry_fixture', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        },
        global: {
            fetch: fetchImpl
        }
    });
}

test('supabase-js 2.116.0 repete GET PostgREST em HTTP 503 pela política nativa', async () => {
    let calls = 0;
    const client = await clientWith(async () => {
        calls += 1;
        if (calls === 1) {
            return new Response(JSON.stringify({ message: 'temporarily unavailable' }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'content-type': 'application/json',
                    'retry-after': '0'
                }
            });
        }
        return new Response('[]', {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    });

    const { data, error } = await client.from('schools').select('*');

    assert.equal(error, null);
    assert.deepEqual(data, []);
    assert.equal(calls, 2);
});

test('supabase-js 2.116.0 não repete escrita POST em HTTP 503', async () => {
    let calls = 0;
    const client = await clientWith(async () => {
        calls += 1;
        return new Response(JSON.stringify({ message: 'temporarily unavailable' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'content-type': 'application/json' }
        });
    });

    const { error } = await client.from('schools').insert([{ id: 's1' }]);

    assert.ok(error);
    assert.equal(calls, 1);
});
