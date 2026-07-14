import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');
const seed = fs.readFileSync(path.join(projectRoot, 'supabase/seed.sql'), 'utf8');
const passwordMatch = seed.match(/crypt\('([^']+)'\s*,\s*gen_salt\('bf'\)\)/i);
const emails = [...new Set(
    [...seed.matchAll(/"email":"([^"]+@radar\.local)"/g)].map(match => match[1])
)];

const apiUrl = process.env.RADAR_SUPABASE_URL;
const publishableKey = process.env.RADAR_SUPABASE_PUBLISHABLE_KEY;

if (!apiUrl || !publishableKey) {
    throw new Error('URL e chave publicável do Supabase local são obrigatórias para validar Auth.');
}

if (!passwordMatch || emails.length !== 7) {
    throw new Error('As sete credenciais da fixture Auth local não puderam ser lidas com segurança.');
}

const client = createClient(apiUrl, publishableKey, {
    auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
    }
});

for (const email of emails) {
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password: passwordMatch[1]
    });

    if (error || !data.user || !data.session) {
        throw new Error(`A fixture Auth local não autenticou o usuário ${email}.`);
    }

    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
        throw new Error(`A fixture Auth local não encerrou a sessão de ${email}.`);
    }
}

console.log(`Auth local: ${emails.length} identidades autenticaram e encerraram sessão com sucesso.`);
