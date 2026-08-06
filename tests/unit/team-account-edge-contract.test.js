'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(
    path.join(root, 'supabase/functions/team-account-management/index.ts'),
    'utf8'
);
const corsSource = fs.readFileSync(
    path.join(root, 'supabase/functions/_shared/cors-policy.mjs'),
    'utf8'
);
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('Edge Function concentra o ciclo administrativo de Auth fora do navegador', () => {
    assert.match(source, /inviteUserByEmail/);
    assert.match(source, /updateUserById/);
    assert.match(source, /deleteUser/);
    assert.match(source, /current_app_role/);
    assert.match(source, /isTeamManagerRole/);
    assert.match(source, /upsert_team_member_account/);
    assert.match(source, /deactivate_controller_account/);
    assert.match(source, /deactivate_inventory_member_account/);
});

test('lookup de e-mail usa RPC administrativa restrita e não percorre usuários Auth', () => {
    assert.match(source, /resolve_team_auth_user_id_by_email/);
    assert.match(source, /admin\.rpc\("resolve_team_auth_user_id_by_email"/);
    assert.doesNotMatch(source, /admin\.auth\.admin\.listUsers/);
});

test('recupera vínculo Auth preexistente quando o diretório legado perdeu user_id', () => {
    assert.match(source, /async function linkedProfileUserId/);
    assert.match(source, /\.from\("user_profiles"\)/);
    assert.match(source, /controller_id/);
    assert.match(source, /inventory_member_id/);
    assert.match(source, /async function resolveMemberUserId/);
    assert.match(source, /diretório e perfil apontam para contas diferentes/);
    assert.match(source, /recoveredLink/);
    assert.match(source, /await resolveMemberUserId\([\s\S]*existing\?\.user_id/);
    assert.match(source, /await resolveMemberUserId\([\s\S]*existing\.user_id/);
});

test('falhas de compensação são detectadas e não são ignoradas silenciosamente', () => {
    assert.match(source, /COMPENSATION_FAILED/);
    assert.match(source, /removeInvitedUser/);
    assert.match(source, /restoreUser/);
    assert.match(source, /restoreAccess/);
    assert.doesNotMatch(source, /\.catch\(\(\)\s*=>\s*null\)/);
    assert.match(source, /if \(error\) throw error/g);
});

test('erros de comando e JSON inválido são classificados como validação pública', () => {
    assert.match(source, /async function requestCommand\(req: Request\)/);
    assert.match(source, /VALIDATION_ERROR/);
    assert.match(source, /const command = await requestCommand\(req\)/);
});

test('respostas públicas não expõem causa administrativa detalhada', () => {
    assert.match(source, /Acione a administração técnica/);
    assert.match(source, /console\.error\("team-account-management",\s*\{[\s\S]*code:[\s\S]*status:/);
    assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*(?:secret|service_role|password|token)/i);
});

test('CORS usa política compartilhada, origem canônica e configuração opcional sem wildcard', () => {
    assert.match(source, /cors-policy\.mjs/);
    assert.match(source, /corsHeadersForOrigin/);
    assert.match(source, /Deno\.env\.get\("RADAR_ALLOWED_ORIGIN"\)/);
    assert.match(source, /Deno\.env\.get\("RADAR_ALLOWED_ORIGINS"\)/);
    assert.doesNotMatch(source, /requiredEnv\("RADAR_ALLOWED_ORIGIN"\)/);
    assert.match(corsSource, /https:\/\/radarpdde-fix\.vercel\.app/);
    assert.match(corsSource, /ORIGIN_DENIED/);
    assert.match(corsSource, /'Vary': 'Origin'/);
    assert.doesNotMatch(corsSource, /Access-Control-Allow-Origin[\s\S]{0,80}\*/);
});

test('SDK da Edge Function acompanha a versão homologada do projeto', () => {
    const version = packageJson.devDependencies['@supabase/supabase-js'];
    const escapedVersion = version.replaceAll('.', '\\.');
    assert.match(source, new RegExp(`supabase-js@${escapedVersion}`));
});
