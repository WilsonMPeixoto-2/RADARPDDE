#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const { SupabaseRepository } = require('../src/data/supabase-repository.js');
const { bootstrapRemoteSnapshot } = require('./lib/remote-bootstrap.mjs');

const SENSITIVE_MESSAGE = /service_role|sb_secret_|password|access_token/i;

function safeMessage(error) {
    const message = String(error?.message || 'Falha no bootstrap remoto.');
    return SENSITIVE_MESSAGE.test(message) ? 'Falha no bootstrap remoto.' : message;
}

function requireEnvironment(environment = process.env) {
    if (!String(environment.RADAR_SUPABASE_URL || '').trim()) {
        const error = new Error('RADAR_SUPABASE_URL é obrigatória.');
        error.code = 'MISSING_ENVIRONMENT';
        throw error;
    }
    if (!String(environment.RADAR_SUPABASE_SERVICE_ROLE_KEY || '').trim()) {
        const error = new Error('Credencial administrativa obrigatória ausente.');
        error.code = 'MISSING_ENVIRONMENT';
        throw error;
    }
    if (!String(environment.RADAR_SNAPSHOT_FILE || '').trim()) {
        const error = new Error('RADAR_SNAPSHOT_FILE é obrigatória.');
        error.code = 'MISSING_ENVIRONMENT';
        throw error;
    }
    return {
        url: environment.RADAR_SUPABASE_URL,
        serviceRole: environment.RADAR_SUPABASE_SERVICE_ROLE_KEY,
        snapshotFile: environment.RADAR_SNAPSHOT_FILE
    };
}

function readSnapshot(snapshotFile) {
    return JSON.parse(fs.readFileSync(path.resolve(snapshotFile), 'utf8'));
}

function safeOutput(value, stream = process.stdout) {
    const serialized = JSON.stringify(value, null, 2);
    if (SENSITIVE_MESSAGE.test(serialized)) throw new Error('Relatório contém conteúdo sensível.');
    stream.write(`${serialized}\n`);
}

async function main(argv = process.argv.slice(2), environment = process.env) {
    const [mode = ''] = argv;
    if (!['validate', 'plan', 'import', 'reconcile'].includes(mode)) {
        const error = new Error('Comando de bootstrap inválido.');
        error.code = 'INVALID_COMMAND';
        throw error;
    }
    const { url, serviceRole, snapshotFile } = requireEnvironment(environment);
    const client = createClient(url, serviceRole, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
    const repository = new SupabaseRepository({ client });
    return bootstrapRemoteSnapshot({ repository, snapshot: readSnapshot(snapshotFile), mode });
}

if (import.meta.main) {
    main().then(report => safeOutput(report)).catch(error => {
        safeOutput({ ok: false, code: error?.code || 'REMOTE_BOOTSTRAP_FAILED', message: safeMessage(error) }, process.stderr);
        process.exitCode = 1;
    });
}

export { requireEnvironment, readSnapshot, safeMessage, safeOutput, main };
