'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { OperationalSupabaseRepository } = require('../../src/data/repository-factory.js');

function contextEntities({ historical = false } = {}) {
    return {
        verifications: [
            { id: 'v-aug-target', school_id: '04.31.001', competence_id: '2026-08', program_id: 'BASIC' },
            { id: 'v-mar-target', school_id: '04.31.001', competence_id: '2026-03', program_id: 'BASIC' },
            { id: 'v-sep', school_id: '04.31.001', competence_id: '2026-09', program_id: 'BASIC' }
        ],
        registeredInvoices: [
            { id: 'i-aug-linked', school_id: '04.31.001', competence_id: '2026-08', program_id: 'BASIC' },
            { id: 'i-mar-linked', school_id: '04.31.001', competence_id: '2026-03', program_id: 'BASIC' },
            ...(historical ? [{ id: 'i-mar-resolved', school_id: '04.31.001', competence_id: '2026-03', program_id: 'BASIC' }] : []),
            { id: 'i-sep', school_id: '04.31.001', competence_id: '2026-09', program_id: 'BASIC' }
        ],
        pendencies: [
            { id: 'p-aug-awaiting', status: 'Aguardando reanálise' },
            { id: 'p-old-open', status: 'Aberta' },
            ...(historical ? [{ id: 'p-old-resolved', status: 'Resolvida' }] : []),
            { id: 'p-sep-resolved', status: 'Resolvida' }
        ],
        pendencyAttempts: [
            { id: 'a-open', pendency_id: 'p-old-open' },
            ...(historical ? [{ id: 'a-old-resolved', pendency_id: 'p-old-resolved' }] : []),
            { id: 'a-sep', pendency_id: 'p-sep-resolved' }
        ],
        pendencyContacts: [
            { id: 'c-open', pendency_id: 'p-old-open' },
            ...(historical ? [{ id: 'c-old-resolved', pendency_id: 'p-old-resolved' }] : []),
            { id: 'c-sep', pendency_id: 'p-sep-resolved' }
        ],
        assets: [
            { id: 'b-old-active', status: 'Encaminhada' },
            { id: 'b-sep-done', status: 'Inventariada' }
        ]
    };
}

function createClient() {
    const calls = [];
    const schoolContacts = [
        { id: 'c-1', school_id: '04.31.001' },
        { id: 'c-2', school_id: '04.31.001' }
    ];

    const client = {
        rpc(name, args) {
            calls.push(['rpc', name, structuredClone(args)]);
            let signal = null;
            const historical = (args?.p_history_statuses || []).includes('Resolvida');
            return {
                abortSignal(value) {
                    signal = value;
                    calls.push(['rpcAbortSignal', name, value]);
                    return this;
                },
                then(resolve, reject) {
                    if (signal?.aborted) {
                        const error = new Error('The operation was aborted.');
                        error.name = 'AbortError';
                        return Promise.reject(error).then(resolve, reject);
                    }
                    return Promise.resolve({
                        data: {
                            competenceId: args?.p_competence_id,
                            entities: contextEntities({ historical })
                        },
                        error: null
                    }).then(resolve, reject);
                }
            };
        },
        from(table) {
            calls.push(['from', table]);
            let schoolId = '';
            let afterId = null;
            let maxRows = Infinity;
            return {
                select() { return this; },
                eq(column, value) {
                    if (column === 'school_id') schoolId = String(value);
                    return this;
                },
                order() { return this; },
                gt(column, value) {
                    if (column === 'id') afterId = String(value);
                    return this;
                },
                limit(value) {
                    maxRows = value;
                    return this;
                },
                then(resolve) {
                    let rows = schoolContacts
                        .filter(row => !schoolId || row.school_id === schoolId)
                        .sort((a, b) => a.id.localeCompare(b.id));
                    if (afterId) rows = rows.filter(row => row.id > afterId);
                    rows = rows.slice(0, maxRows);
                    return Promise.resolve({ data: structuredClone(rows), error: null }).then(resolve);
                }
            };
        }
    };

    return { client, calls };
}

test('contexto operacional usa uma única RPC set-based e não expande dependências no cliente', async () => {
    const fake = createClient();
    const repository = new OperationalSupabaseRepository({ client: fake.client });
    const controller = new AbortController();

    const result = await repository.queryOperationalContext({
        competenceId: '2026-09',
        signal: controller.signal
    });

    assert.equal(result.competenceId, '2026-09');
    assert.deepEqual(
        result.entities.verifications.map(row => row.id),
        ['v-aug-target', 'v-mar-target', 'v-sep']
    );
    assert.deepEqual(
        result.entities.registeredInvoices.map(row => row.id),
        ['i-aug-linked', 'i-mar-linked', 'i-sep']
    );
    assert.deepEqual(
        result.entities.pendencies.map(row => row.id),
        ['p-aug-awaiting', 'p-old-open', 'p-sep-resolved']
    );

    assert.deepEqual(fake.calls[0], [
        'rpc',
        'read_operational_context',
        { p_competence_id: '2026-09', p_history_statuses: [] }
    ]);
    assert.deepEqual(fake.calls[1], [
        'rpcAbortSignal',
        'read_operational_context',
        controller.signal
    ]);
    assert.equal(fake.calls.filter(call => call[0] === 'rpc').length, 1);
    assert.equal(fake.calls.some(call => call[0] === 'from'), false);
});

test('histórico solicitado é encaminhado à mesma RPC sem abrir segunda rota de leitura', async () => {
    const fake = createClient();
    const repository = new OperationalSupabaseRepository({ client: fake.client });

    const result = await repository.queryOperationalContext({
        competenceId: '2026-09',
        historyStatuses: ['Resolvida', 'Resolvida']
    });

    assert.ok(result.entities.pendencies.some(row => row.id === 'p-old-resolved'));
    assert.ok(result.entities.registeredInvoices.some(row => row.id === 'i-mar-resolved'));
    assert.deepEqual(fake.calls, [[
        'rpc',
        'read_operational_context',
        { p_competence_id: '2026-09', p_history_statuses: ['Resolvida'] }
    ]]);
});

test('consulta operacional rejeita competência e histórico inválidos antes de tocar o Supabase', async () => {
    const fake = createClient();
    const repository = new OperationalSupabaseRepository({ client: fake.client });

    await assert.rejects(
        repository.queryOperationalContext({ competenceId: 'setembro' }),
        error => error.code === 'INVALID_OPERATIONAL_CONTEXT'
    );
    await assert.rejects(
        repository.queryOperationalContext({
            competenceId: '2026-09',
            historyStatuses: ['all']
        }),
        error => error.code === 'INVALID_OPERATIONAL_CONTEXT'
    );
    assert.deepEqual(fake.calls, []);
});

test('contexto já cancelado não inicia RPC', async () => {
    const fake = createClient();
    const repository = new OperationalSupabaseRepository({ client: fake.client });
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
        repository.queryOperationalContext({
            competenceId: '2026-09',
            signal: controller.signal
        }),
        error => error?.name === 'AbortError'
    );
    assert.deepEqual(fake.calls, []);
});

test('histórico explícito da escola continua em consulta dedicada e paginada', async () => {
    const fake = createClient();
    const repository = new OperationalSupabaseRepository({
        client: fake.client,
        pageSize: 1
    });

    const contacts = await repository.querySchoolContacts('04.31.001');

    assert.deepEqual(contacts.map(record => record.id), ['c-1', 'c-2']);
    assert.equal(fake.calls.some(call => call[0] === 'rpc'), false);
    assert.equal(fake.calls.filter(call => call[0] === 'from').length, 3);
    await assert.rejects(
        repository.querySchoolContacts(''),
        error => error.code === 'INVALID_OPERATIONAL_CONTEXT'
    );
});
