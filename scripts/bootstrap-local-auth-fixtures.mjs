import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');
const fixtures = JSON.parse(fs.readFileSync(
    path.join(projectRoot, 'supabase/fixtures/auth-users.json'),
    'utf8'
));

const apiUrl = process.env.RADAR_SUPABASE_URL;
const adminKey = process.env.RADAR_SUPABASE_ADMIN_KEY;
const fixturePassword = process.env.RADAR_AUTH_FIXTURE_PASSWORD;
const explicitlyAllowed = process.env.RADAR_ALLOW_LOCAL_AUTH_BOOTSTRAP === 'true';

function assertLocalTarget(value) {
    let target;
    try {
        target = new URL(value);
    } catch {
        throw new Error('A URL da pilha Supabase local é inválida.');
    }

    if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname)) {
        throw new Error('O bootstrap Auth é exclusivo da pilha Supabase local.');
    }
}

function assertConfiguration() {
    if (!explicitlyAllowed) {
        throw new Error('O bootstrap Auth local exige autorização explícita.');
    }
    if (!apiUrl || !adminKey || !fixturePassword) {
        throw new Error('A configuração efêmera do bootstrap Auth local está incompleta.');
    }
    if (fixturePassword.length < 20) {
        throw new Error('A senha efêmera das fixtures Auth deve ter ao menos 20 caracteres.');
    }
    assertLocalTarget(apiUrl);
}

function isNotFound(error) {
    return error?.status === 404 || error?.code === 'user_not_found';
}

function editableAuthAttributes(fixture) {
    return {
        email: fixture.email,
        password: fixturePassword,
        email_confirm: true,
        user_metadata: { name: fixture.name }
    };
}

async function upsertAuthUser(client, fixture) {
    const current = await client.auth.admin.getUserById(fixture.id);

    if (current.error && !isNotFound(current.error)) {
        throw new Error(`Não foi possível consultar a identidade local ${fixture.email}.`);
    }

    const editableAttributes = editableAuthAttributes(fixture);
    const result = current.data?.user
        ? await client.auth.admin.updateUserById(fixture.id, editableAttributes)
        : await client.auth.admin.createUser({
            id: fixture.id,
            ...editableAttributes
        });

    if (result.error
        || result.data.user?.id !== fixture.id
        || result.data.user?.email !== fixture.email) {
        const diagnostic = [result.error?.code, result.error?.message]
            .filter(Boolean)
            .join(' | ');
        throw new Error(
            `Não foi possível preparar a identidade local ${fixture.email}`
            + (diagnostic ? `: ${diagnostic}` : '.')
        );
    }
}

async function requireSingleRow(operation, label) {
    const { data, error } = await operation.select('id').single();
    if (error) {
        const diagnostic = [error.code, error.message, error.details, error.hint]
            .filter(Boolean)
            .join(' | ');
        throw new Error(`Não foi possível vincular ${label} à identidade local: ${diagnostic}`);
    }
    if (!data?.id) {
        throw new Error(`Não foi possível vincular ${label}: nenhum registro funcional foi localizado.`);
    }
}

async function provisionInstitutionalLinks(client) {
    const controller = fixtures.find(fixture => fixture.controllerId);
    const inventory = fixtures.find(fixture => fixture.inventoryMemberId);

    await requireSingleRow(
        client.from('controllers').update({ user_id: controller.id }).eq('id', controller.controllerId),
        'o Controlador'
    );
    await requireSingleRow(
        client.from('inventory_team_members')
            .update({ user_id: inventory.id })
            .eq('id', inventory.inventoryMemberId),
        'a equipe de inventário'
    );

    const profiles = fixtures
        .filter(fixture => fixture.profileId)
        .map(fixture => ({
            id: fixture.profileRowId,
            user_id: fixture.id,
            profile_id: fixture.profileId,
            controller_id: fixture.controllerId,
            inventory_member_id: fixture.inventoryMemberId,
            cre_scope: fixture.creScope,
            active: fixture.active
        }));
    const scopes = fixtures.flatMap(fixture => fixture.scopes.map(scope => ({
        id: scope.id,
        user_id: fixture.id,
        school_id: scope.schoolId,
        can_write: scope.canWrite
    })));

    const profileResult = await client.from('user_profiles').upsert(profiles, { onConflict: 'id' });
    if (profileResult.error) {
        throw new Error(
            `Não foi possível preparar os perfis institucionais locais: ${profileResult.error.code || 'erro da Data API'}.`
        );
    }

    const scopeResult = await client.from('user_school_scopes').upsert(scopes, { onConflict: 'id' });
    if (scopeResult.error) {
        throw new Error(
            `Não foi possível preparar os escopos institucionais locais: ${scopeResult.error.code || 'erro da Data API'}.`
        );
    }
}

assertConfiguration();

const client = createClient(apiUrl, adminKey, {
    auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
    }
});

for (const fixture of fixtures) {
    await upsertAuthUser(client, fixture);
}
await provisionInstitutionalLinks(client);

console.log(`Auth local: ${fixtures.length} identidades e vínculos institucionais preparados pela API Admin.`);
