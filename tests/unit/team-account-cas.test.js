'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const esbuild = require('esbuild');

const repo = path.resolve(__dirname, '../..');

async function loadProbe() {
    const domain = await import(pathToFileURL(
        path.join(repo, 'supabase/functions/_shared/team-account-domain.mjs')
    ).href + `?cas=${Date.now()}-${Math.random()}`);
    const source = fs.readFileSync(
        path.join(repo, 'supabase/functions/team-account-management/index.ts'),
        'utf8'
    ).replace(/^import[\s\S]*?;\r?\n/gm, '');
    const code = esbuild.transformSync(source, { loader: 'ts', target: 'es2022' }).code;
    const context = {
        ...domain,
        console,
        Date,
        Set,
        JSON,
        Response,
        Deno: { serve() {}, env: { get() { return undefined; } } }
    };
    vm.createContext(context);
    vm.runInContext(`${code}\nglobalThis.__teamCasProbe={saveMember};`, context);
    return { domain, saveMember: context.__teamCasProbe.saveMember };
}

function editCommand(domain, expectedVersion = 7) {
    return domain.normalizeTeamCommand({
        operation: 'save_controller',
        controller: {
            id: 'ctrl-cas',
            name: 'Nome novo',
            email: 'novo@example.test',
            rowVersion: expectedVersion
        },
        previousController: {
            id: 'ctrl-cas',
            name: 'Nome anterior',
            email: 'anterior@example.test',
            active: true,
            user_id: '00000000-0000-4000-8000-000000000077',
            rowVersion: expectedVersion
        },
        administrativeLog: {
            id: 'log-cas',
            action: 'Gestão de Equipe',
            details: { text: 'edição concorrente' }
        }
    });
}

test('edição de equipe preserva a versão esperada até a fronteira remota', async () => {
    const { domain } = await loadProbe();
    const command = editCommand(domain, 7);

    assert.equal(command.expectedVersion, 7);
    assert.equal(command.entity.row_version, 7);
});

test('edição obsoleta é rejeitada antes de alterar Auth ou chamar a RPC', async () => {
    const { domain, saveMember } = await loadProbe();
    const command = editCommand(domain, 7);
    const events = [];
    const userId = '00000000-0000-4000-8000-000000000077';
    const directory = {
        id: 'ctrl-cas',
        name: 'Alteração concorrente',
        email: 'concorrente@example.test',
        active: true,
        user_id: userId,
        row_version: 8
    };
    const authUser = {
        id: userId,
        email: 'concorrente@example.test',
        user_metadata: {
            display_name: 'Alteração concorrente',
            radar_profile: 'controller',
            radar_entity_id: 'ctrl-cas'
        },
        banned_until: null
    };

    function query(table) {
        const filters = [];
        const api = {
            select() { return api; },
            eq(column, value) { filters.push([column, value]); return api; },
            order() { return api; },
            limit(limit) {
                const rows = table === 'user_profiles'
                    ? [{ user_id: userId, profile_id: 'controller', controller_id: 'ctrl-cas', active: true }]
                    : [];
                return Promise.resolve({
                    data: rows.filter(row => filters.every(([key, value]) => row[key] === value)).slice(0, limit),
                    error: null
                });
            },
            maybeSingle() {
                const rows = table === 'controllers' ? [directory] : [];
                const row = rows.find(item => filters.every(([key, value]) => item[key] === value)) || null;
                return Promise.resolve({ data: row ? structuredClone(row) : null, error: null });
            }
        };
        return api;
    }

    const admin = {
        from: table => query(table),
        auth: {
            admin: {
                async getUserById() { return { data: { user: structuredClone(authUser) }, error: null }; },
                async updateUserById() { events.push('auth-update'); return { data: { user: authUser }, error: null }; },
                async deleteUser() { events.push('auth-delete'); return { error: null }; }
            }
        },
        async rpc(name) {
            events.push(`rpc:${name}`);
            if (name === 'resolve_team_auth_user_id_by_email') return { data: userId, error: null };
            return { data: null, error: { code: 'P0001', message: 'synthetic fallback' } };
        }
    };

    await assert.rejects(
        () => saveMember(admin, { id: '00000000-0000-4000-8000-000000000001' }, command),
        /OPTIMISTIC_CONFLICT/
    );

    assert.deepEqual(events, []);
});

test('CAS perdido após a pré-checagem restaura Auth para o estado vencedor, não para o snapshot obsoleto', async () => {
    const { domain, saveMember } = await loadProbe();
    const command = editCommand(domain, 7);
    const userId = '00000000-0000-4000-8000-000000000077';
    const events = [];
    let directory = {
        id: 'ctrl-cas',
        name: 'Nome anterior',
        email: 'anterior@example.test',
        active: true,
        user_id: userId,
        row_version: 7
    };
    let authUser = {
        id: userId,
        email: 'anterior@example.test',
        user_metadata: {
            display_name: 'Nome anterior',
            radar_profile: 'controller',
            radar_entity_id: 'ctrl-cas'
        },
        banned_until: null
    };

    function query(table) {
        const filters = [];
        const api = {
            select() { return api; },
            eq(column, value) { filters.push([column, value]); return api; },
            order() { return api; },
            limit(limit) {
                const rows = table === 'user_profiles'
                    ? [{ user_id: userId, profile_id: 'controller', controller_id: 'ctrl-cas', active: true }]
                    : [];
                return Promise.resolve({
                    data: rows.filter(row => filters.every(([key, value]) => row[key] === value)).slice(0, limit),
                    error: null
                });
            },
            maybeSingle() {
                const rows = table === 'controllers' ? [directory] : [];
                const row = rows.find(item => filters.every(([key, value]) => item[key] === value)) || null;
                return Promise.resolve({ data: row ? structuredClone(row) : null, error: null });
            }
        };
        return api;
    }

    const admin = {
        from: table => query(table),
        auth: {
            admin: {
                async getUserById() { return { data: { user: structuredClone(authUser) }, error: null }; },
                async updateUserById(_id, changes) {
                    events.push(`auth-update:${changes.email || ''}`);
                    if (changes.email) authUser.email = changes.email;
                    if (changes.user_metadata) authUser.user_metadata = structuredClone(changes.user_metadata);
                    return { data: { user: structuredClone(authUser) }, error: null };
                },
                async deleteUser() { events.push('auth-delete'); return { error: null }; }
            }
        },
        async rpc(name) {
            if (name === 'resolve_team_auth_user_id_by_email') return { data: userId, error: null };
            if (name === 'upsert_team_member_account') {
                events.push('rpc:upsert');
                directory = {
                    ...directory,
                    name: 'Sessão vencedora',
                    email: 'vencedora@example.test',
                    row_version: 8
                };
                return {
                    data: null,
                    error: { code: 'P0001', message: 'OPTIMISTIC_CONFLICT: versão obsoleta' }
                };
            }
            throw new Error(`RPC inesperada: ${name}`);
        }
    };

    await assert.rejects(
        () => saveMember(admin, { id: '00000000-0000-4000-8000-000000000001' }, command),
        /OPTIMISTIC_CONFLICT/
    );

    assert.equal(authUser.email, 'vencedora@example.test');
    assert.equal(authUser.user_metadata.display_name, 'Sessão vencedora');
    assert.equal(events.includes('auth-delete'), false);
});
