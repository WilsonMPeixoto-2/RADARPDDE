'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const {
    bootstrapRemoteAdmin,
    isUsableExistingAuthUser,
    TECHNICAL_ADMIN_PROFILE,
    TECHNICAL_ADMIN_SCOPE
} = require('../../scripts/lib/remote-admin-bootstrap.mjs');

function createClient({ users = [], profiles = [], logs = [], failTable = '', technicalProfileActive = true } = {}) {
    const state = {
        users: structuredClone(users),
        profiles: structuredClone(profiles),
        logs: structuredClone(logs),
        createdUsers: [],
        deletedUsers: [],
        inserts: []
    };
    let nextUser = 1;

    function tableRows(table) {
        if (table === 'user_profiles') return state.profiles;
        if (table === 'administrative_logs') return state.logs;
        if (table === 'profiles') return [{ id: TECHNICAL_ADMIN_PROFILE, active: technicalProfileActive }];
        throw new Error(`Tabela inesperada: ${table}`);
    }

    function builder(table) {
        const filters = [];
        return {
            select() { return this; },
            eq(column, value) {
                filters.push([column, value]);
                return this;
            },
            async then(resolve, reject) {
                try {
                    const data = tableRows(table).filter(row => filters.every(([column, value]) => row[column] === value));
                    return resolve({ data, error: null });
                } catch (error) {
                    return reject ? reject(error) : Promise.reject(error);
                }
            },
            async insert(record) {
                if (table === failTable) return { data: null, error: new Error('falha de persistencia') };
                const rows = tableRows(table);
                rows.push(structuredClone(record));
                state.inserts.push({ table, record: structuredClone(record) });
                return { data: record, error: null };
            }
        };
    }

    return {
        state,
        auth: {
            admin: {
                async listUsers() {
                    return { data: { users: state.users }, error: null };
                },
                async createUser(payload) {
                    const user = { id: `user-${nextUser++}`, email: payload.email, email_confirmed_at: '2026-07-20T12:00:00.000Z' };
                    state.users.push(user);
                    state.createdUsers.push({ user: structuredClone(user), payload: structuredClone(payload) });
                    return { data: { user }, error: null };
                },
                async deleteUser(userId) {
                    state.deletedUsers.push(userId);
                    state.users = state.users.filter(user => user.id !== userId);
                    return { data: { user: null }, error: null };
                }
            }
        },
        from: builder
    };
}

test('cria um Auth user confirmado e o vincula somente ao perfil technical_admin', async () => {
    const client = createClient();

    const report = await bootstrapRemoteAdmin({
        client,
        email: 'admin@radar.example',
        password: 'senha-somente-para-o-teste'
    });

    assert.deepEqual(report, {
        ok: true,
        created: true,
        userId: 'user-1',
        profileId: TECHNICAL_ADMIN_PROFILE,
        active: true
    });
    assert.deepEqual(client.state.createdUsers[0].payload, {
        email: 'admin@radar.example',
        password: 'senha-somente-para-o-teste',
        email_confirm: true
    });
    assert.deepEqual(client.state.profiles, [{
        user_id: 'user-1',
        profile_id: TECHNICAL_ADMIN_PROFILE,
        controller_id: null,
        inventory_member_id: null,
        cre_scope: TECHNICAL_ADMIN_SCOPE,
        active: true
    }]);
    assert.equal(client.state.logs.length, 1);
    assert.equal(client.state.logs[0].actor_user_id, 'user-1');
    assert.equal(client.state.logs[0].profile_name, TECHNICAL_ADMIN_PROFILE);
    assert.doesNotMatch(JSON.stringify(client.state.logs[0]), /senha-somente-para-o-teste/i);
});

test('reconhece usuário e vínculo técnico compatíveis sem criar ou alterar registros', async () => {
    const client = createClient({
        users: [{ id: 'existing-user', email: 'ADMIN@radar.example', email_confirmed_at: '2026-07-20T12:00:00.000Z' }],
        profiles: [{
            user_id: 'existing-user',
            profile_id: TECHNICAL_ADMIN_PROFILE,
            controller_id: null,
            inventory_member_id: null,
            cre_scope: TECHNICAL_ADMIN_SCOPE,
            active: true
        }],
        logs: [{
            id: 'bootstrap-technical-admin-existing-user',
            actor_user_id: 'existing-user',
            user_identifier: TECHNICAL_ADMIN_PROFILE,
            profile_name: TECHNICAL_ADMIN_PROFILE,
            action: 'Bootstrap do administrador técnico',
            details: { source: 'remote-admin-bootstrap' }
        }]
    });

    const report = await bootstrapRemoteAdmin({
        client,
        email: 'admin@radar.example',
        password: 'nao-deve-ser-usada'
    });

    assert.equal(report.created, false);
    assert.equal(client.state.createdUsers.length, 0);
    assert.equal(client.state.inserts.length, 0);
});

test('é idempotente em reexecução após a criação inicial', async () => {
    const client = createClient();
    await bootstrapRemoteAdmin({ client, email: 'admin@radar.example', password: 'segredo-local' });
    const insertsAfterFirstRun = client.state.inserts.length;

    const report = await bootstrapRemoteAdmin({ client, email: 'ADMIN@RADAR.EXAMPLE', password: 'outro-segredo' });

    assert.equal(report.created, false);
    assert.equal(client.state.createdUsers.length, 1);
    assert.equal(client.state.inserts.length, insertsAfterFirstRun);
});

test('aborta sem mutar quando o usuário existente possui papel incompatível', async () => {
    const client = createClient({
        users: [{ id: 'existing-user', email: 'admin@radar.example', email_confirmed_at: '2026-07-20T12:00:00.000Z' }],
        profiles: [{
            user_id: 'existing-user',
            profile_id: 'controller',
            controller_id: 'controller-1',
            inventory_member_id: null,
            cre_scope: TECHNICAL_ADMIN_SCOPE,
            active: true
        }]
    });

    await assert.rejects(
        bootstrapRemoteAdmin({ client, email: 'admin@radar.example', password: 'nao-usar' }),
        error => error.code === 'ADMIN_IDENTITY_CONFLICT'
    );
    assert.equal(client.state.createdUsers.length, 0);
    assert.equal(client.state.inserts.length, 0);
});

test('rejeita usuário Auth existente não confirmado, banido ou excluído', async () => {
    const now = Date.parse('2026-07-20T12:00:00.000Z');
    assert.equal(isUsableExistingAuthUser({ email_confirmed_at: null }, now), false);
    assert.equal(isUsableExistingAuthUser({ email_confirmed_at: '2026-07-20T10:00:00.000Z', banned_until: '2026-07-21T12:00:00.000Z' }, now), false);
    assert.equal(isUsableExistingAuthUser({ email_confirmed_at: '2026-07-20T10:00:00.000Z', deleted_at: '2026-07-20T11:00:00.000Z' }, now), false);
    assert.equal(isUsableExistingAuthUser({ email_confirmed_at: '2026-07-20T10:00:00.000Z', banned_until: '2026-07-19T12:00:00.000Z' }, now), true);
});

test('rejeita perfil técnico institucional desativado', async () => {
    const client = createClient({ technicalProfileActive: false });

    await assert.rejects(
        bootstrapRemoteAdmin({ client, email: 'admin@radar.example', password: 'segredo-local' }),
        error => error.code === 'ADMIN_BOOTSTRAP_FAILED'
    );
    assert.deepEqual(client.state.deletedUsers, ['user-1']);
});

test('compensa somente o Auth user criado quando o vínculo de perfil falha', async () => {
    const client = createClient({ failTable: 'user_profiles' });

    await assert.rejects(
        bootstrapRemoteAdmin({ client, email: 'admin@radar.example', password: 'segredo-local' }),
        error => error.code === 'ADMIN_BOOTSTRAP_FAILED'
    );
    assert.deepEqual(client.state.deletedUsers, ['user-1']);
    assert.equal(client.state.logs.length, 0);
});

test('não compensa um usuário Auth preexistente quando o vínculo falha', async () => {
    const client = createClient({
        users: [{ id: 'existing-user', email: 'admin@radar.example', email_confirmed_at: '2026-07-20T12:00:00.000Z' }],
        failTable: 'user_profiles'
    });

    await assert.rejects(
        bootstrapRemoteAdmin({ client, email: 'admin@radar.example', password: 'nao-usar' }),
        error => error.code === 'ADMIN_BOOTSTRAP_FAILED'
    );
    assert.deepEqual(client.state.deletedUsers, []);
});

test('a CLI exige ambiente administrativo sem revelar senha ou segredo', () => {
    const root = path.resolve(__dirname, '../..');
    const result = spawnSync(process.execPath, ['scripts/bootstrap-remote-admin.mjs', 'validate'], {
        cwd: root,
        encoding: 'utf8',
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ComSpec: process.env.ComSpec }
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /RADAR_SUPABASE_URL/);
    assert.doesNotMatch(result.stderr, /senha|password|service_role|sb_secret_|access_token/i);
});

test('inclui os scripts administrativos nos gates sintáticos do projeto', () => {
    const root = path.resolve(__dirname, '../..');
    const packageConfig = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

    assert.equal(packageConfig.scripts['bootstrap:supabase:admin'], 'node scripts/bootstrap-remote-admin.mjs');
    assert.match(packageConfig.scripts.check, /node --check scripts\/lib\/remote-admin-bootstrap\.mjs/);
    assert.match(packageConfig.scripts.check, /node --check scripts\/bootstrap-remote-admin\.mjs/);
});
