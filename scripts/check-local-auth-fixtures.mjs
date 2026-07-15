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
const MAX_AUTH_PROBE_ATTEMPTS = 4;
const AUTH_PROBE_RETRY_DELAYS_MS = Object.freeze([0, 250, 750, 1500]);

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

function createProbeClient() {
    return createClient(apiUrl, publishableKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false
        }
    });
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function authDiagnostic(error) {
    return [error?.status, error?.code, error?.message]
        .filter(value => value !== undefined && value !== null && String(value).trim())
        .map(String)
        .join(' | ');
}

async function authenticateFixture(fixture) {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_AUTH_PROBE_ATTEMPTS; attempt += 1) {
        const delay = AUTH_PROBE_RETRY_DELAYS_MS[attempt] || 0;
        if (delay > 0) await sleep(delay);

        const client = createProbeClient();
        const { data, error } = await client.auth.signInWithPassword({
            email: fixture.email,
            password: fixturePassword
        });

        if (!error
            && data.user?.id === fixture.id
            && data.session?.access_token) {
            const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
            if (signOutError) {
                throw new Error(
                    `A fixture Auth local não encerrou a sessão de ${fixture.email}: `
                    + (authDiagnostic(signOutError) || 'erro sem diagnóstico')
                );
            }
            return;
        }

        lastError = error || new Error(
            `A identidade autenticada não corresponde ao manifesto (${data.user?.id || 'sem usuário'}).`
        );
    }

    throw new Error(
        `A fixture Auth local não autenticou o usuário ${fixture.email} após `
        + `${MAX_AUTH_PROBE_ATTEMPTS} tentativas: `
        + (authDiagnostic(lastError) || lastError?.message || 'erro sem diagnóstico')
    );
}

for (const fixture of fixtures) {
    await authenticateFixture(fixture);
}

console.log(`Auth local: ${fixtures.length} identidades autenticaram e encerraram sessão com sucesso.`);
