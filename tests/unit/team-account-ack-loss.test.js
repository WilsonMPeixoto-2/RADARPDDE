'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const esbuild = require('esbuild');

const repo = path.resolve(__dirname, '../..');

async function loadEdgeProbe() {
    const domain = await import(pathToFileURL(
        path.join(repo, 'supabase/functions/_shared/team-account-domain.mjs')
    ).href + `?ack-loss=${Date.now()}-${Math.random()}`);
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
    vm.runInContext(`${code}\nglobalThis.__teamProbe={saveMember,deactivateMember};`, context);
    return {
        domain,
        saveMember: context.__teamProbe.saveMember,
        deactivateMember: context.__teamProbe.deactivateMember
    };
}

function commandFor(domain, options = {}) {
    const id = options.id || 'ctrl-a';
    const email = options.email || 'novo@example.test';
    return domain.normalizeTeamCommand({
        operation: 'save_controller',
        controller: { id, name: options.name || 'Novo', email, rowVersion: 7 },
        previousController: options.previousController || null,
        administrativeLog: {
            id: options.logId || 'log-op-a',
            action: 'Gestão de Equipe',
            details: { text: 'teste de fronteira' }
        }
    });
}

function deactivateCommandFor(domain, options = {}) {
    return domain.normalizeTeamCommand({
        operation: 'deactivate_controller',
        controllerId: options.id || 'ctrl-a',
        fallbackControllerId: null,
        reassignedCount: 0,
        administrativeLog: {
            id: options.logId || 'log-deactivate',
            action: 'Gestão de Equipe',
            details: { text: 'desativação de fronteira' }
        }
    });
}

function createHarness(options = {}) {
    const events = [];
    const state = {
        auth: options.auth ? structuredClone(options.auth) : null,
        directory: options.directory ? structuredClone(options.directory) : null,
        profiles: options.profiles ? structuredClone(options.profiles) : [],
        log: null
    };
    const rpcMode = options.rpcMode || 'commit-loss';

    function rows(table) {
        if (table === 'controllers') return state.directory ? [state.directory] : [];
        if (table === 'user_profiles') return Array.isArray(state.profiles) ? state.profiles : [];
        if (table === 'administrative_logs') return state.log ? [state.log] : [];
        return [];
    }

    function query(table) {
        const filters = [];
        const api = {
            select() { return api; },
            eq(column, value) { filters.push([column, value]); return api; },
            order() { return api; },
            limit(limit) {
                const data = rows(table)
                    .filter(row => filters.every(([column, value]) => row?.[column] === value))
                    .slice(0, limit);
                return Promise.resolve({ data: structuredClone(data), error: null });
            },
            maybeSingle() {
                const data = rows(table)
                    .filter(row => filters.every(([column, value]) => row?.[column] === value))[0] || null;
                return Promise.resolve({ data: data ? structuredClone(data) : null, error: null });
            }
        };
        return api;
    }

    function saveCommit(args) {
        state.directory = {
            ...structuredClone(args.p_member),
            user_id: args.p_user_id,
            active: true
        };
        state.profiles = [{
            user_id: args.p_user_id,
            profile_id: args.p_profile_id,
            controller_id: args.p_profile_id === 'controller' ? args.p_member.id : null,
            inventory_member_id: args.p_profile_id === 'inventory' ? args.p_member.id : null,
            cre_scope: args.p_member.cre_scope || '4ª CRE',
            active: true
        }];
        state.log = {
            id: args.p_administrative_log.id,
            actor_user_id: args.p_actor_user_id,
            action: args.p_administrative_log.action || 'Gestão de Equipe'
        };
    }

    function deactivateCommit(args) {
        if (state.directory) state.directory.active = false;
        state.profiles = state.profiles.map(profile => ({ ...profile, active: false }));
        state.log = {
            id: args.p_administrative_log.id,
            actor_user_id: args.p_actor_user_id,
            action: args.p_administrative_log.action || 'Gestão de Equipe'
        };
    }

    const admin = {
        from: table => query(table),
        auth: {
            admin: {
                async inviteUserByEmail(email, inviteOptions) {
                    events.push('auth-invite');
                    state.auth = {
                        id: '00000000-0000-4000-8000-000000000011',
                        email,
                        user_metadata: structuredClone(inviteOptions?.data || {}),
                        banned_until: null
                    };
                    return { data: { user: structuredClone(state.auth) }, error: null };
                },
                async getUserById(userId) {
                    const user = state.auth?.id === userId ? structuredClone(state.auth) : null;
                    return { data: { user }, error: null };
                },
                async updateUserById(userId, changes) {
                    if (!state.auth || state.auth.id !== userId) return { error: new Error('user missing') };
                    if (Object.prototype.hasOwnProperty.call(changes, 'email')) {
                        events.push('auth-update-profile');
                        state.auth.email = changes.email;
                    }
                    if (Object.prototype.hasOwnProperty.call(changes, 'user_metadata')) {
                        state.auth.user_metadata = structuredClone(changes.user_metadata);
                    }
                    if (changes.ban_duration === '876000h') {
                        events.push('auth-ban');
                        state.auth.banned_until = '2126-01-01T00:00:00.000Z';
                    } else if (changes.ban_duration === 'none') {
                        events.push('auth-restore-access');
                        state.auth.banned_until = null;
                    }
                    return { data: { user: structuredClone(state.auth) }, error: null };
                },
                async deleteUser(userId) {
                    events.push('auth-delete-compensation');
                    if (state.auth?.id === userId) state.auth = null;
                    if (state.directory?.user_id === userId) state.directory.user_id = null;
                    state.profiles = state.profiles.filter(profile => profile.user_id !== userId);
                    return { error: null };
                }
            }
        },
        async rpc(name, args) {
            if (name === 'resolve_team_auth_user_id_by_email') {
                const match = state.auth && state.auth.email === args.p_email ? state.auth.id : null;
                return { data: match, error: null };
            }
            if (name === 'upsert_team_member_account') {
                events.push(`rpc-save:${rpcMode}`);
                if (rpcMode === 'commit-loss') {
                    saveCommit(args);
                    return { data: null, error: new Error('synthetic transport failure after committed transaction') };
                }
                if (rpcMode === 'transport-no-proof') {
                    return { data: null, error: new Error('synthetic transport failure before proof') };
                }
                if (rpcMode === 'definitive-reject') {
                    return {
                        data: null,
                        error: { code: 'P0001', message: 'VALIDATION_ERROR: synthetic rejection' }
                    };
                }
            }
            if (name === 'deactivate_controller_account') {
                events.push(`rpc-deactivate:${rpcMode}`);
                if (rpcMode === 'commit-loss') {
                    deactivateCommit(args);
                    return { data: null, error: new Error('synthetic transport failure after committed deactivation') };
                }
                if (rpcMode === 'transport-no-proof') {
                    return { data: null, error: new Error('synthetic transport failure before deactivation proof') };
                }
                if (rpcMode === 'definitive-reject') {
                    return {
                        data: null,
                        error: { code: 'P0001', message: 'VALIDATION_ERROR: synthetic deactivation rejection' }
                    };
                }
            }
            throw new Error(`RPC/mode não suportado: ${name}/${rpcMode}`);
        }
    };

    return { admin, state, events };
}

const actor = { id: '00000000-0000-4000-8000-000000000001' };

function activeControllerState() {
    const userId = '00000000-0000-4000-8000-000000000022';
    return {
        auth: {
            id: userId,
            email: 'ativo@example.test',
            user_metadata: { display_name: 'Ativo', radar_profile: 'controller', radar_entity_id: 'ctrl-a' },
            banned_until: null
        },
        directory: {
            id: 'ctrl-a',
            name: 'Ativo',
            email: 'ativo@example.test',
            active: true,
            user_id: userId
        },
        profiles: [{
            user_id: userId,
            profile_id: 'controller',
            controller_id: 'ctrl-a',
            inventory_member_id: null,
            cre_scope: '4ª CRE',
            active: true
        }]
    };
}

test('convite confirmado + commit + ACK perdido preserva Auth e reconcilia pelo estado durável', async () => {
    const { domain, saveMember } = await loadEdgeProbe();
    const command = commandFor(domain);
    const harness = createHarness({ rpcMode: 'commit-loss' });

    const result = await saveMember(harness.admin, actor, command);

    assert.equal(result.ok, true);
    assert.equal(harness.state.auth?.id, '00000000-0000-4000-8000-000000000011');
    assert.equal(harness.state.directory?.user_id, harness.state.auth?.id);
    assert.equal(harness.state.profiles[0]?.user_id, harness.state.auth?.id);
    assert.equal(harness.state.log?.id, 'log-op-a');
    assert.equal(harness.events.includes('auth-delete-compensation'), false);
});

test('rejeição definitiva sem commit compensa somente a conta criada pela operação', async () => {
    const { domain, saveMember } = await loadEdgeProbe();
    const command = commandFor(domain, { logId: 'log-definitive' });
    const harness = createHarness({ rpcMode: 'definitive-reject' });

    await assert.rejects(
        () => saveMember(harness.admin, actor, command),
        error => error?.code === 'P0001' || /synthetic rejection/i.test(String(error?.message || error))
    );

    assert.equal(harness.state.auth, null);
    assert.equal(harness.state.directory, null);
    assert.equal(harness.state.log, null);
    assert.equal(harness.events.filter(item => item === 'auth-delete-compensation').length, 1);
});

test('resultado remoto ainda ambíguo preserva Auth em vez de executar compensação destrutiva', async () => {
    const { domain, saveMember } = await loadEdgeProbe();
    const command = commandFor(domain, { logId: 'log-unknown' });
    const harness = createHarness({ rpcMode: 'transport-no-proof' });

    await assert.rejects(
        () => saveMember(harness.admin, actor, command),
        /REMOTE_COMMIT_UNKNOWN/
    );

    assert.equal(harness.state.auth?.id, '00000000-0000-4000-8000-000000000011');
    assert.equal(harness.state.directory, null);
    assert.equal(harness.state.log, null);
    assert.equal(harness.events.includes('auth-delete-compensation'), false);
});

test('conta preexistente não restaura metadados antigos quando o commit já ocorreu e o ACK se perdeu', async () => {
    const { domain, saveMember } = await loadEdgeProbe();
    const userId = '00000000-0000-4000-8000-000000000022';
    const previousAuth = {
        id: userId,
        email: 'antigo@example.test',
        user_metadata: { display_name: 'Antigo', radar_profile: 'controller', radar_entity_id: 'ctrl-a' },
        banned_until: null
    };
    const previousDirectory = {
        id: 'ctrl-a',
        name: 'Antigo',
        email: 'antigo@example.test',
        active: true,
        user_id: userId
    };
    const previousProfiles = [{
        user_id: userId,
        profile_id: 'controller',
        controller_id: 'ctrl-a',
        inventory_member_id: null,
        cre_scope: '4ª CRE',
        active: true
    }];
    const command = commandFor(domain, {
        name: 'Novo Nome',
        email: 'novo@example.test',
        logId: 'log-existing',
        previousController: previousDirectory
    });
    const harness = createHarness({
        rpcMode: 'commit-loss',
        auth: previousAuth,
        directory: previousDirectory,
        profiles: previousProfiles
    });

    const result = await saveMember(harness.admin, actor, command);

    assert.equal(result.ok, true);
    assert.equal(harness.state.auth?.email, 'novo@example.test');
    assert.equal(harness.state.auth?.user_metadata?.display_name, 'Novo Nome');
    assert.equal(harness.state.directory?.email, 'novo@example.test');
    assert.equal(harness.state.log?.id, 'log-existing');
    assert.equal(harness.events.includes('auth-delete-compensation'), false);
});

test('desativação commitada com ACK perdido mantém Auth bloqueado e reconcilia pelo banco', async () => {
    const { domain, deactivateMember } = await loadEdgeProbe();
    const initial = activeControllerState();
    const command = deactivateCommandFor(domain, { logId: 'log-deactivate-commit' });
    const harness = createHarness({ rpcMode: 'commit-loss', ...initial });

    const result = await deactivateMember(harness.admin, actor, command);

    assert.equal(result.ok, true);
    assert.equal(harness.state.directory?.active, false);
    assert.equal(harness.state.profiles[0]?.active, false);
    assert.equal(harness.state.log?.id, 'log-deactivate-commit');
    assert.equal(harness.state.auth?.banned_until, '2126-01-01T00:00:00.000Z');
    assert.equal(harness.events.includes('auth-restore-access'), false);
});

test('desativação definitivamente rejeitada restaura o acesso anterior', async () => {
    const { domain, deactivateMember } = await loadEdgeProbe();
    const initial = activeControllerState();
    const command = deactivateCommandFor(domain, { logId: 'log-deactivate-reject' });
    const harness = createHarness({ rpcMode: 'definitive-reject', ...initial });

    await assert.rejects(
        () => deactivateMember(harness.admin, actor, command),
        /synthetic deactivation rejection/i
    );

    assert.equal(harness.state.directory?.active, true);
    assert.equal(harness.state.profiles[0]?.active, true);
    assert.equal(harness.state.auth?.banned_until, null);
    assert.equal(harness.events.filter(item => item === 'auth-restore-access').length, 1);
});

test('desativação ambígua sem prova mantém bloqueio Auth e não inventa rollback do banco', async () => {
    const { domain, deactivateMember } = await loadEdgeProbe();
    const initial = activeControllerState();
    const command = deactivateCommandFor(domain, { logId: 'log-deactivate-unknown' });
    const harness = createHarness({ rpcMode: 'transport-no-proof', ...initial });

    await assert.rejects(
        () => deactivateMember(harness.admin, actor, command),
        /REMOTE_COMMIT_UNKNOWN/
    );

    assert.equal(harness.state.directory?.active, true);
    assert.equal(harness.state.profiles[0]?.active, true);
    assert.equal(harness.state.auth?.banned_until, '2126-01-01T00:00:00.000Z');
    assert.equal(harness.events.includes('auth-restore-access'), false);
});
