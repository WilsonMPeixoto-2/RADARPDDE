#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const DATA_MODES = new Set(['local', 'supabase-preview', 'supabase-production']);
const ENVIRONMENTS = new Set(['local', 'development', 'test', 'preview', 'production']);
const FORBIDDEN_RUNTIME_VARIABLES = Object.freeze([
    'RADAR_SUPABASE_SERVICE_ROLE_KEY',
    'RADAR_SUPABASE_SECRET_KEY',
    'RADAR_DATABASE_URL',
    'RADAR_DATABASE_PASSWORD',
    'SUPABASE_SERVICE_ROLE_KEY'
]);

function parseBoolean(value, name, fallback = false) {
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    throw new Error(`${name} deve ser true ou false.`);
}

function decodeJwtRole(value) {
    const parts = String(value || '').trim().split('.');
    if (parts.length < 2 || !parts[1]) return '';
    try {
        return String(JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))?.role || '')
            .trim()
            .toLowerCase();
    } catch (error) {
        return '';
    }
}

function isForbiddenPublishableKey(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized.startsWith('sb_secret_')
        || normalized === 'service_role'
        || decodeJwtRole(value) === 'service_role';
}

function isValidSupabaseUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol)
            && (url.hostname.endsWith('.supabase.co')
                || ['localhost', '127.0.0.1'].includes(url.hostname));
    } catch (error) {
        return false;
    }
}

function isValidPublishableKey(value) {
    const key = String(value || '').trim();
    return key.startsWith('sb_publishable_') || key.startsWith('eyJ');
}

function assertNoRuntimeSecrets(environment) {
    const present = FORBIDDEN_RUNTIME_VARIABLES.find(name => (
        String(environment?.[name] || '').trim() !== ''
    ));
    if (present) {
        throw new Error('Variável secreta não é permitida na configuração pública do frontend.');
    }
}

function buildRuntimeInput(environment = {}) {
    assertNoRuntimeSecrets(environment);

    const dataMode = String(environment.RADAR_DATA_MODE || 'local').trim().toLowerCase();
    const runtimeEnvironment = String(environment.RADAR_ENVIRONMENT || 'local').trim().toLowerCase();
    if (!DATA_MODES.has(dataMode)) {
        throw new Error('RADAR_DATA_MODE possui valor não permitido.');
    }
    if (!ENVIRONMENTS.has(runtimeEnvironment)) {
        throw new Error('RADAR_ENVIRONMENT possui valor não permitido.');
    }

    const repositoryEnabled = parseBoolean(
        environment.RADAR_SUPABASE_REPOSITORY_ENABLED,
        'RADAR_SUPABASE_REPOSITORY_ENABLED'
    );
    const productionActivationApproved = parseBoolean(
        environment.RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED,
        'RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED'
    );
    const url = String(environment.RADAR_SUPABASE_URL || '').trim();
    const publishableKey = String(environment.RADAR_SUPABASE_PUBLISHABLE_KEY || '').trim();

    if (isForbiddenPublishableKey(publishableKey)) {
        throw new Error('Chave secreta não é permitida na configuração pública do frontend.');
    }

    if (dataMode === 'local') {
        return {
            environment: runtimeEnvironment,
            dataMode: 'local',
            productionActivationApproved: false,
            features: {
                supabaseRepositoryEnabled: false
            },
            supabase: {
                url: '',
                publishableKey: ''
            }
        };
    }

    if (!repositoryEnabled) {
        throw new Error('Modo Supabase exige autorização explícita do repositório.');
    }
    if (!isValidSupabaseUrl(url) || !isValidPublishableKey(publishableKey)) {
        throw new Error('Modo Supabase exige URL e chave publicável válidas.');
    }
    if (dataMode === 'supabase-preview' && runtimeEnvironment === 'production') {
        throw new Error('Modo Supabase de preview não pode ser publicado como ambiente de produção.');
    }
    if (dataMode === 'supabase-production'
        && (runtimeEnvironment !== 'production' || !productionActivationApproved)) {
        throw new Error('Modo Supabase de produção exige ambiente de produção e autorização explícita.');
    }

    return {
        environment: runtimeEnvironment,
        dataMode,
        productionActivationApproved: dataMode === 'supabase-production',
        features: {
            supabaseRepositoryEnabled: true
        },
        supabase: {
            url,
            publishableKey
        }
    };
}

function renderRuntimeConfig(input) {
    return `window.RADAR_PDDE_RUNTIME_INPUT = Object.freeze(${JSON.stringify(input, null, 2)});\n`;
}

function parseArguments(argv) {
    const result = {
        check: false,
        output: path.join(root, 'config.runtime.js')
    };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--check') {
            result.check = true;
        } else if (argument === '--output') {
            const next = argv[index + 1];
            if (!next) throw new Error('--output exige um caminho.');
            result.output = path.resolve(process.cwd(), next);
            index += 1;
        } else {
            throw new Error(`Argumento desconhecido: ${argument}`);
        }
    }
    return result;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const rendered = renderRuntimeConfig(buildRuntimeInput(process.env));

    if (options.check) {
        const current = await fs.readFile(options.output, 'utf8').catch(() => '');
        if (current !== rendered) {
            throw new Error('config.runtime.js diverge da configuração pública esperada.');
        }
        console.log('Configuração pública: aprovada.');
        return;
    }

    await fs.writeFile(options.output, rendered, 'utf8');
    console.log(`Configuração pública gerada em ${path.relative(root, options.output)}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha ao gerar configuração pública: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    FORBIDDEN_RUNTIME_VARIABLES,
    assertNoRuntimeSecrets,
    buildRuntimeInput,
    isForbiddenPublishableKey,
    parseBoolean,
    renderRuntimeConfig
};
