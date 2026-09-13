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
        { id: 'v-mar-target', school_id: '04.31.001', competence_id: '2026-03', program_id: 'BASIC' },
        { id: 'v-mar-unrelated', school_id: '04.31.002', competence_id: '2026-03', program_id: 'BASIC' },
        { id: 'v-aug-target', school_id: '04.31.001', competence_id: '2026-08', program_id: 'BASIC' },
        { id: 'v-sep', school_id: '04.31.001', competence_id: '2026-09', program_id: 'BASIC' }
    ],
    registered_invoices: [
        { id: 'i-mar-linked', competence_id: '2026-03' },
        { id: 'i-mar-unrelated', competence_id: '2026-03' },
        { id: 'i-aug-linked', competence_id: '2026-08' },
        { id: 'i-sep', competence_id: '2026-09' }
    ],
    pendencies: [
        {
            id: 'p-old-open', school_id: '04.31.001', competence_origin: '2026-03',
            program_id: 'BASIC', registered_invoice_id: 'i-mar-linked', status: 'Aberta'
        },
        {
            id: 'p-old-resolved', school_id: '04.31.001', competence_origin: '2026-03',
            program_id: 'BASIC', registered_invoice_id: 'i-mar-unrelated', status: 'Resolvida'
        },
        {
            id: 'p-sep-resolved', school_id: '04.31.001', competence_origin: '2026-09',
            program_id: 'BASIC', registered_invoice_id: 'i-sep', status: 'Resolvida'
        },
        {
            id: 'p-aug-awaiting', school_id: '04.31.001', competence_origin: '2026-08',
            program_id: 'BASIC', registered_invoice_id: 'i-aug-linked', status: 'Aguardando reanálise'
        }
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

test('contexto mensal traz o mês selecionado e dependências mínimas das obrigações ainda ativas', async () => {
    const fake = createClient(seed);
    const repository = new OperationalSupabaseRepository({
        client: fake.client,
        pageSize: 2,
        readRetry: { maxAttempts: 1, delayMs: 0 }
    });

    const result = await repository.queryOperationalContext({ competenceId: '2026-09' });

    assert.equal(result.competenceId, '2026-09');
    assert.deepEqual(
        result.entities.verifications.map(row => row.id).sort(),
        ['v-aug-target', 'v-mar-target', 'v-sep']
    );
    assert.deepEqual(
        result.entities.registeredInvoices.map(row => row.id).sort(),
        ['i-aug-linked', 'i-mar-linked', 'i-sep']
    );
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

test('passivo de inventário conserva NF, avaliação e bens irmãos terminais necessários ao agregado', async () => {
    const data = structuredClone(seed);
    data.registered_invoices.push(
        { id: 'i-feb-active', school_id: 'school-old', competence_id: '2026-02', program_id: 'BASIC', linked_asset_id: 'b-old-active' },
        { id: 'i-feb-done', school_id: 'school-old', competence_id: '2026-02', program_id: 'BASIC', linked_asset_id: 'b-old-done' },
        { id: 'i-feb-other-school', school_id: 'unrelated', competence_id: '2026-02', program_id: 'BASIC' }
    );
    data.verifications.push({ id: 'v-feb-inventory', school_id: 'school-old', competence_id: '2026-02', program_id: 'BASIC' });
    const fake = createClient(data);
    const repo = new OperationalSupabaseRepository({ client: fake.client, pageSize: 2 });
    const { entities } = await repo.queryOperationalContext({ competenceId: '2026-09' });
    assert.ok(entities.registeredInvoices.some(row => row.id === 'i-feb-done'));
    assert.ok(entities.verifications.some(row => row.id === 'v-feb-inventory'));
    assert.ok(entities.assets.some(row => row.id === 'b-old-done'));
    assert.equal(entities.registeredInvoices.some(row => row.id === 'i-feb-other-school'), false);
});

test('reanálise histórica dispõe das demais notas do mesmo contexto para preservar resultado agregado', async () => {
    const data = structuredClone(seed);
    data.registered_invoices.push(
        { id: 'i-mar-sibling', school_id: '04.31.001', competence_id: '2026-03', program_id: 'BASIC' },
        { id: 'i-mar-other-program', school_id: '04.31.001', competence_id: '2026-03', program_id: 'OTHER' }
    );
    const fake = createClient(data);
    const repo = new OperationalSupabaseRepository({ client: fake.client, pageSize: 2 });
    const { entities } = await repo.queryOperationalContext({ competenceId: '2026-09' });
    assert.ok(entities.registeredInvoices.some(row => row.id === 'i-mar-sibling'));
    assert.equal(entities.registeredInvoices.some(row => row.id === 'i-mar-other-program'), false);
});

test('histórico explícito da escola inclui contatos sem pendência e históricos sem atravessar outra escola', async () => {
    const data = structuredClone(seed);
    data.pendency_contacts.push(
        { id: 'c-standalone', school_id: 'school-contact', pendency_id: null },
        { id: 'c-historical', school_id: 'school-contact', pendency_id: 'p-old-resolved' },
        { id: 'c-another', school_id: 'another-school', pendency_id: null }
    );
    const fake = createClient(data);
    const repo = new OperationalSupabaseRepository({ client: fake.client, pageSize: 1 });
    const contacts = await repo.querySchoolContacts('school-contact');
    assert.deepEqual(contacts.map(record => record.id).sort(), ['c-historical', 'c-standalone']);
    assert.ok(fake.calls.some(call => call[0] === 'gt'));
    await assert.rejects(repo.querySchoolContacts(''), error => error.code === 'INVALID_OPERATIONAL_CONTEXT');
});
