import { randomUUID } from 'node:crypto';

const TECHNICAL_ADMIN_PROFILE = 'technical_admin';
const TECHNICAL_ADMIN_SCOPE = '4ª CRE';
const BOOTSTRAP_ACTION = 'Bootstrap do administrador técnico';

function bootstrapError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function assertValidInput({ client, email, password }) {
    if (!client?.auth?.admin || typeof client.from !== 'function') throw bootstrapError('INVALID_CLIENT', 'Cliente administrativo inválido.');
    if (!String(email || '').trim()) throw bootstrapError('INVALID_ADMIN_IDENTITY', 'Identidade do administrador obrigatória.');
    if (!String(password || '')) throw bootstrapError('INVALID_ADMIN_CREDENTIAL', 'Credencial de acesso do administrador obrigatória.');
}

async function readRows(query, code = 'ADMIN_BOOTSTRAP_FAILED') {
    const { data, error } = await query;
    if (error) throw bootstrapError(code, 'Falha na operação administrativa.');
    return Array.isArray(data) ? data : [];
}

async function findAuthUserByEmail(client, email) {
    const normalizedEmail = String(email).trim().toLocaleLowerCase('en-US');
    const matches = [];
    const perPage = 1000;
    for (let page = 1; page <= 1000; page += 1) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage });
        if (error) throw bootstrapError('ADMIN_BOOTSTRAP_FAILED', 'Falha ao consultar identidades administrativas.');
        const users = Array.isArray(data?.users) ? data.users : [];
        matches.push(...users.filter(user => String(user?.email || '').trim().toLocaleLowerCase('en-US') === normalizedEmail));
        if (users.length < perPage) break;
    }
    if (matches.length > 1) throw bootstrapError('ADMIN_IDENTITY_CONFLICT', 'Há mais de uma identidade administrativa compatível.');
    return matches[0] || null;
}

async function createConfirmedUser(client, email, password) {
    const { data, error } = await client.auth.admin.createUser({ email: String(email).trim(), password, email_confirm: true });
    if (error || !data?.user?.id) throw bootstrapError('ADMIN_BOOTSTRAP_FAILED', 'Falha ao criar a identidade administrativa.');
    return data.user;
}

function isCompatibleTechnicalProfile(profile, userId) {
    return profile?.user_id === userId && profile.profile_id === TECHNICAL_ADMIN_PROFILE
        && profile.controller_id === null && profile.inventory_member_id === null
        && profile.cre_scope === TECHNICAL_ADMIN_SCOPE && profile.active === true;
}

async function assertTechnicalProfileExists(client) {
    const profiles = await readRows(client.from('profiles').select('id').eq('id', TECHNICAL_ADMIN_PROFILE), 'ADMIN_PROFILE_UNAVAILABLE');
    if (profiles.length !== 1 || profiles[0].id !== TECHNICAL_ADMIN_PROFILE) throw bootstrapError('ADMIN_PROFILE_UNAVAILABLE', 'Perfil técnico obrigatório indisponível.');
}

async function upsertTechnicalAdminProfile(client, userId) {
    await assertTechnicalProfileExists(client);
    const profiles = await readRows(client.from('user_profiles').select('user_id, profile_id, controller_id, inventory_member_id, cre_scope, active').eq('user_id', userId));
    if (profiles.length > 0) {
        if (profiles.length !== 1 || !isCompatibleTechnicalProfile(profiles[0], userId)) throw bootstrapError('ADMIN_IDENTITY_CONFLICT', 'A identidade já possui vínculo de perfil incompatível.');
        return false;
    }
    const profile = { user_id: userId, profile_id: TECHNICAL_ADMIN_PROFILE, controller_id: null, inventory_member_id: null, cre_scope: TECHNICAL_ADMIN_SCOPE, active: true };
    const { error } = await client.from('user_profiles').insert(profile);
    if (error) throw bootstrapError('ADMIN_BOOTSTRAP_FAILED', 'Falha ao vincular o perfil técnico.');
    return true;
}

function bootstrapLogId(userId) {
    return `bootstrap-technical-admin-${userId}`;
}

function isCompatibleBootstrapLog(log, userId) {
    return log?.id === bootstrapLogId(userId) && log.actor_user_id === userId
        && log.user_identifier === TECHNICAL_ADMIN_PROFILE && log.profile_name === TECHNICAL_ADMIN_PROFILE
        && log.action === BOOTSTRAP_ACTION && log?.details?.source === 'remote-admin-bootstrap';
}

async function writeSanitizedBootstrapLog(client, userId) {
    const id = bootstrapLogId(userId);
    const logs = await readRows(client.from('administrative_logs').select('id, actor_user_id, user_identifier, profile_name, action, details').eq('id', id));
    if (logs.length > 0) {
        if (logs.length !== 1 || !isCompatibleBootstrapLog(logs[0], userId)) throw bootstrapError('ADMIN_LOG_CONFLICT', 'O registro administrativo existente é incompatível.');
        return false;
    }
    const { error } = await client.from('administrative_logs').insert({
        id, school_id: null, actor_user_id: userId, user_identifier: TECHNICAL_ADMIN_PROFILE,
        profile_name: TECHNICAL_ADMIN_PROFILE, action: BOOTSTRAP_ACTION,
        details: { source: 'remote-admin-bootstrap', request_id: randomUUID() }
    });
    if (error) throw bootstrapError('ADMIN_BOOTSTRAP_FAILED', 'Falha ao registrar o bootstrap administrativo.');
    return true;
}

async function compensateCreatedUser(client, userId) {
    try {
        const { error } = await client.auth.admin.deleteUser(userId);
        if (!error) return;
    } catch (error) {
        // A exclusão pode não estar disponível em todas as versões da API.
    }
    try {
        await client.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    } catch (error) {
        // O erro principal é preservado; identidades preexistentes nunca são compensadas.
    }
}

async function bootstrapRemoteAdmin({ client, email, password }) {
    assertValidInput({ client, email, password });
    const existing = await findAuthUserByEmail(client, email);
    const user = existing || await createConfirmedUser(client, email, password);
    try {
        await upsertTechnicalAdminProfile(client, user.id);
        await writeSanitizedBootstrapLog(client, user.id);
    } catch (error) {
        if (!existing) await compensateCreatedUser(client, user.id);
        if (String(error?.code || '').endsWith('_CONFLICT')) throw error;
        throw bootstrapError('ADMIN_BOOTSTRAP_FAILED', 'Falha ao concluir o bootstrap administrativo.');
    }
    return { ok: true, created: !existing, userId: user.id, profileId: TECHNICAL_ADMIN_PROFILE, active: true };
}

export { BOOTSTRAP_ACTION, TECHNICAL_ADMIN_PROFILE, TECHNICAL_ADMIN_SCOPE, bootstrapLogId, bootstrapRemoteAdmin, createConfirmedUser, findAuthUserByEmail, upsertTechnicalAdminProfile, writeSanitizedBootstrapLog };
