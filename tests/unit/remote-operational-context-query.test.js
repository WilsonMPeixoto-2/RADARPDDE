'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { OperationalSupabaseRepository } = require('../../src/data/repository-factory.js');

function createClient(seed = {}) {
    const calls = [];
    const client = {
        from(table) {
            const filters = [];
            let afterId = null;
            let maxRows = Infinity;
            const builder = {
                select(value) {
                    calls.push(['select', table, value]);
                    return this;
                },
                eq(column, value) {
                    filters.push(row => String(row?.[column] ?? '') === String(value));
                    calls.push(['eq', table, column, String(value)]);
                    return this;
                },
                in(column, values) {
                    const accepted = new Set((values || []).map(String));
                    filters.push(row => accepted.has(String(row?.[column] ?? '')));
                    calls.push(['in', table, column, [...accepted]]);
                    return this;
                },
                gt(column, value) {
                    if (column === 'id') afterId = String(value);
                    calls.push(['gt', table, column, String(value)]);
                    return this;
                },
                order(column, options) {
                    calls.push(['order', table, column, options]);
                    return this;
                },
                limit(value) {
                    maxRows = value;
                    calls.push(['limit', table, value]);
                    return this;
                },
                then(resolve, reject) {
                    let rows = structuredClone(seed[table] || []);
                    filters.forEach(filter => { rows = rows.filter(filter); });
                    rows.sort((a, b) => String(a.id).localeCompare(String(b.id)));
                    if (afterId !== null) rows = rows.filter(row => String(row.id) > afterId);
                    rows = rows.slice(0, maxRows);
                    return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
                }
            };
            calls.push(['from', table]);
            return builder;
        }
    };
    return { client, calls };
}

const seed = {
    verifications: [
        { id: 'v-aug', competence_id: '2026-08' },
        { id: 'v-sep', competence_id: '2026-09' }
    ],
    registered_invoices: [
        { id: 'i-aug', competence_id: '2026-08' },
        { id: 'i-sep', competence_id: '2026-09' }
    ],
    pendencies: [
        { id: 'p-old-open', competence_origin: '2026-03', status: 'Aberta' },
        { id: 'p-old-resolved', competence_origin: '2026-03', status: 'Resolvida' },
        { id: 'p-sep-resolved', competence_origin: '2026-09', status: 'Resolvida' },
        { id: 'p-aug-awaiting', competence_origin: '2026-08', status: 'Aguardando reanálise' }
    ],
    pendency_attempts: [
        { id: 'a-open', pendency_id: 'p-old-open' },
        { id: 'a-old-resolved', pendency_id: 'p-old-resolved' },
        { id: 'a-sep', pendency_id: 'p-sep-resolved' }
    ],
    pendency_contacts: [
        { id: 'c-open', pendency_id: 'p-old-open' },
        { id: 'c-old-resolved', pendency_id: 'p-old-resolved' },
        { id: 'c-sep', pendency_id: 'p-sep-resolved' }
    ],
    assets: [
        { id: 'b-old-active', competence_id: '2026-02', status: 'Encaminhada' },
        { id: 'b-old-done', competence_id: '2026-02', status: 'Inventariada' },
        { id: 'b-sep-done', competence_id: '2026-09', status: 'Inventariada' }
    ]
};

test('contexto mensal traz somente o mês selecionado mais obrigações ainda ativas', async () => {
    const fake = createClient(seed);
    const repository = new OperationalSupabaseRepository({
        client: fake.client,
        pageSize: 2,
        readRetry: { maxAttempts: 1, delayMs: 0 }
    });

    const result = await repository.queryOperationalContext({ competenceId: '2026-09' });

    assert.equal(result.competenceId, '2026-09');
    assert.deepEqual(result.entities.verifications.map(row => row.id), ['v-sep']);
    assert.deepEqual(result.entities.registeredInvoices.map(row => row.id), ['i-sep']);
    assert.deepEqual(
        result.entities.pendencies.map(row => row.id).sort(),
        ['p-aug-awaiting', 'p-old-open', 'p-sep-resolved']
    );
    assert.deepEqual(
        result.entities.pendencyAttempts.map(row => row.id).sort(),
        ['a-open', 'a-sep']
    );
    assert.deepEqual(
        result.entities.pendencyContacts.map(row => row.id).sort(),
        ['c-open', 'c-sep']
    );
    assert.deepEqual(
        result.entities.assets.map(row => row.id).sort(),
        ['b-old-active', 'b-sep-done']
    );

    assert.equal(
        fake.calls.some(call => call[0] === 'from' && ['administrative_logs', 'audit_events'].includes(call[1])),
        false
    );
});

test('consulta operacional rejeita competência inválida antes de ler tabelas', async () => {
    const fake = createClient(seed);
    const repository = new OperationalSupabaseRepository({ client: fake.client });

    await assert.rejects(
        repository.queryOperationalContext({ competenceId: 'setembro' }),
        error => error.code === 'INVALID_OPERATIONAL_CONTEXT'
    );
    assert.deepEqual(fake.calls, []);
});
