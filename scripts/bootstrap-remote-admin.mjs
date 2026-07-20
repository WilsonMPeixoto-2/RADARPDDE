#!/usr/bin/env node
import { createRequire } from 'node:module';
import { TECHNICAL_ADMIN_PROFILE, bootstrapRemoteAdmin } from './lib/remote-admin-bootstrap.mjs';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const SENSITIVE_MESSAGE = /senha|password|service_role|sb_secret_|access_token|token|secret/i;
const REPORT_FIELDS = Object.freeze(['ok', 'created', 'userId', 'profileId', 'active']);

function cliError(code, message) { const error = new Error(message); error.code = code; return error; }

function requireEnvironment(environment = process.env) {
    const url = String(environment.RADAR_SUPABASE_URL || '').trim();
    const serviceRole = String(environment.RADAR_SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const email = String(environment.RADAR_BOOTSTRAP_ADMIN_EMAIL || '').trim();
    const password = String(environment.RADAR_BOOTSTRAP_ADMIN_PASSWORD || '');
    if (!url) throw cliError('MISSING_ENVIRONMENT', 'RADAR_SUPABASE_URL é obrigatória.');
    if (!serviceRole) throw cliError('MISSING_ENVIRONMENT', 'Credencial administrativa obrigatória ausente.');
    if (!email) throw cliError('MISSING_ENVIRONMENT', 'Identidade do administrador obrigatória ausente.');
    if (!password) throw cliError('MISSING_ENVIRONMENT', 'Credencial de acesso do administrador obrigatória ausente.');
    return { url, serviceRole, email, password };
}

function safeMessage(error) {
    const message = String(error?.message || 'Falha no bootstrap administrativo.');
    return SENSITIVE_MESSAGE.test(message) ? 'Falha no bootstrap administrativo.' : message;
}

function safeReport(report) {
    const sanitized = Object.fromEntries(REPORT_FIELDS.map(field => [field, report?.[field] ?? null]));
    sanitized.ok = Boolean(sanitized.ok); sanitized.created = Boolean(sanitized.created); sanitized.active = Boolean(sanitized.active);
    sanitized.profileId = sanitized.profileId || TECHNICAL_ADMIN_PROFILE;
    return sanitized;
}

function safeOutput(report, stream = process.stdout) { stream.write(`${JSON.stringify(safeReport(report), null, 2)}\n`); }
function staticReport() { return { ok: true, created: false, userId: null, profileId: TECHNICAL_ADMIN_PROFILE, active: false }; }

async function main(argv = process.argv.slice(2), environment = process.env) {
    const [mode = 'apply'] = argv;
    if (argv.length > 1 || !['validate', 'plan', 'apply', 'reconcile'].includes(mode)) throw cliError('INVALID_COMMAND', 'Comando de bootstrap administrativo inválido.');
    const configuration = requireEnvironment(environment);
    if (mode === 'validate' || mode === 'plan') return staticReport();
    const client = createClient(configuration.url, configuration.serviceRole, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    return bootstrapRemoteAdmin({ client, email: configuration.email, password: configuration.password });
}

if (import.meta.main) {
    main().then(report => safeOutput(report)).catch(error => { process.stderr.write(`${safeMessage(error)}\n`); process.exitCode = 1; });
}

export { main, requireEnvironment, safeMessage, safeOutput, safeReport };
