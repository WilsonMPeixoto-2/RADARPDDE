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
const publishableKey = process.env.RADAR_SUPABASE_PUBLISHABLE_KEY;
const fixturePassword = process.env.RADAR_AUTH_FIXTURE_PASSWORD;

if (!apiUrl || !publishableKey || !fixturePassword) {
    throw new Error('A configuração efêmera do login-probe Auth local está incompleta.');
}

let target;
try {
    target = new URL(apiUrl);
} catch {
    throw new Error('A URL da pilha Supabase local é inválida.');
}
if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname)) {
    throw new Error('O login-probe Auth é exclusivo da pilha Supabase local.');
}
if (fixtures.length !== 7) {
    throw new Error('O manifesto Auth local deve conter sete identidades.');
}

const client = createClient(apiUrl, publishableKey, {
    auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
    }
});

for (const fixture of fixtures) {
    const { data, error } = await client.auth.signInWithPassword({
        email: fixture.email,
        password: fixturePassword
    });

    if (error || !data.user || !data.session) {
        throw new Error(`A fixture Auth local não autenticou o usuário ${fixture.email}.`);
    }

    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
        throw new Error(`A fixture Auth local não encerrou a sessão de ${fixture.email}.`);
    }
}

console.log(`Auth local: ${fixtures.length} identidades autenticaram e encerraram sessão com sucesso.`);
