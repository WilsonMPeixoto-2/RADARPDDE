'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../supabase/functions/team-account-management/index.ts'),
    'utf8'
);

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

test('falhas de compensação são detectadas e não são ignoradas silenciosamente', () => {
    assert.match(source, /COMPENSATION_FAILED/);
    assert.match(source, /removeInvitedUser/);
    assert.match(source, /restoreUser/);
    assert.match(source, /restoreAccess/);
    assert.doesNotMatch(source, /\.catch\(\(\)\s*=>\s*null\)/);
    assert.match(source, /if \(error\) throw error/g);
});

test('respostas públicas não expõem causa administrativa detalhada', () => {
    assert.match(source, /Acione a administração técnica/);
    assert.match(source, /console\.error\("team-account-management",\s*\{[\s\S]*code:[\s\S]*status:/);
    assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*(?:secret|service_role|password|token)/i);
});
