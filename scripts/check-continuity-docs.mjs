import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CURRENT_PLAN_MARKER = '**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**';
const HISTORICAL_BANNER = 'HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL';
const BASELINE_SHA = '876c5976124815d2848f7d2d9e8a82b7cd3a43c5';

const REQUIRED_FILES = Object.freeze([
    'START_HERE.md',
    'docs/CURRENT_STATE.md',
    'docs/MASTER_PLAN_CURRENT.md',
    'docs/PLAN_TRACEABILITY.md'
]);

const ENTRY_POINTS = Object.freeze([
    'AGENTS.md',
    'README.md',
    'docs/README.md'
]);

const HISTORICAL_PLANS = Object.freeze([
    'docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md',
    'docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md'
]);

const STALE_PLAN_NAMES = Object.freeze([
    '2026-09-03-plano-remanescente-source-first',
    '2026-08-26-plano-mestre-correcoes-pos-auditoria'
]);

function read(root, relativePath) {
    const absolute = path.join(root, relativePath);
    if (!fs.existsSync(absolute)) return null;
    return fs.readFileSync(absolute, 'utf8');
}

function listMarkdownFiles(root) {
    const result = [];
    const excluded = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', 'audit-output']);

    function visit(directory) {
        if (!fs.existsSync(directory)) return;
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (excluded.has(entry.name)) continue;
            const absolute = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(absolute);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
                result.push(path.relative(root, absolute).split(path.sep).join('/'));
            }
        }
    }

    visit(root);
    return result;
}

function firstMeaningfulLines(source, limit = 16) {
    return String(source || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, limit);
}

function validateEntryPoint(relativePath, source, errors) {
    const lines = firstMeaningfulLines(source, 16);
    const joined = lines.join('\n');
    const startIndex = joined.indexOf('START_HERE');
    if (startIndex < 0) {
        errors.push(`${relativePath}: START_HERE.md deve aparecer nas primeiras linhas como porta de entrada.`);
        return;
    }

    for (const staleName of STALE_PLAN_NAMES) {
        const staleIndex = joined.indexOf(staleName);
        if (staleIndex >= 0 && staleIndex < startIndex) {
            errors.push(`${relativePath}: START_HERE.md precisa ser indicado antes de qualquer plano histórico (${staleName}).`);
        }
    }
}

function validateStartHere(source, errors) {
    if (!source.includes(BASELINE_SHA)) {
        errors.push(`START_HERE.md: baseline esperada ${BASELINE_SHA} não foi encontrada.`);
    }
    for (const reference of ['docs/CURRENT_STATE.md', 'docs/MASTER_PLAN_CURRENT.md', 'docs/PLAN_TRACEABILITY.md']) {
        if (!source.includes(reference)) {
            errors.push(`START_HERE.md: referência obrigatória ausente: ${reference}.`);
        }
    }
    if (!/#262/i.test(source) || !/ABORTADO/i.test(source) || !/SEM MERGE/i.test(source)) {
        errors.push('START_HERE.md: deve registrar explicitamente que o PR #262 foi abortado e fechado sem merge.');
    }
}

function validateCurrentPlanUniqueness(root, errors) {
    const matches = [];
    for (const relativePath of listMarkdownFiles(root)) {
        const source = read(root, relativePath);
        if (source?.includes(CURRENT_PLAN_MARKER)) matches.push(relativePath);
    }

    if (matches.length === 0) {
        errors.push('Não existe documento marcado como plano executável vigente.');
    } else if (matches.length > 1) {
        errors.push(`Há mais de um documento marcado como plano executável vigente: ${matches.join(', ')}.`);
    } else if (matches[0] !== 'docs/MASTER_PLAN_CURRENT.md') {
        errors.push(`O único plano executável vigente deve ser docs/MASTER_PLAN_CURRENT.md; encontrado em ${matches[0]}.`);
    }
}

function validateHistoricalPlans(root, errors) {
    for (const relativePath of HISTORICAL_PLANS) {
        const source = read(root, relativePath);
        if (source == null) {
            errors.push(`${relativePath}: plano histórico obrigatório não encontrado.`);
            continue;
        }
        const header = source.split(/\r?\n/).slice(0, 12).join('\n');
        if (!header.includes(HISTORICAL_BANNER)) {
            errors.push(`${relativePath}: deve conter o banner "${HISTORICAL_BANNER}" nas primeiras linhas.`);
        }
    }
}

function validateTraceability(source, errors) {
    for (let i = 1; i <= 9; i += 1) {
        const expression = new RegExp(`\\bR${i}\\b`, 'i');
        if (!expression.test(source)) {
            errors.push(`docs/PLAN_TRACEABILITY.md: destino explícito ausente para R${i}.`);
        }
    }

    for (const pr of ['#254', '#256', '#257', '#258', '#260', '#261']) {
        if (!source.includes(pr)) {
            errors.push(`docs/PLAN_TRACEABILITY.md: PR posterior obrigatório ausente da reconciliação: ${pr}.`);
        }
    }

    if (!/#262/i.test(source) || !/abortad|sem merge/i.test(source)) {
        errors.push('docs/PLAN_TRACEABILITY.md: deve excluir explicitamente o PR #262 da baseline vigente.');
    }
}

export function validateContinuityDocuments(root = process.cwd()) {
    const errors = [];

    for (const relativePath of REQUIRED_FILES) {
        if (!fs.existsSync(path.join(root, relativePath))) {
            errors.push(`Arquivo obrigatório de continuidade ausente: ${relativePath}.`);
        }
    }
    if (errors.length > 0) return errors;

    for (const relativePath of ENTRY_POINTS) {
        const source = read(root, relativePath);
        if (source == null) {
            errors.push(`Ponto de entrada obrigatório ausente: ${relativePath}.`);
            continue;
        }
        validateEntryPoint(relativePath, source, errors);
    }

    validateStartHere(read(root, 'START_HERE.md'), errors);
    validateCurrentPlanUniqueness(root, errors);
    validateHistoricalPlans(root, errors);
    validateTraceability(read(root, 'docs/PLAN_TRACEABILITY.md'), errors);

    return errors;
}

function isProductRuntimePath(filePath) {
    const normalized = String(filePath || '').replaceAll('\\', '/');
    if (['app.js', 'index.html', 'styles.css', 'config.js'].includes(normalized)) return true;
    return normalized.startsWith('src/')
        || normalized.startsWith('supabase/migrations/')
        || normalized.startsWith('supabase/functions/');
}

export function validatePullRequestContinuityImpact(changedFiles = []) {
    const files = new Set((Array.isArray(changedFiles) ? changedFiles : []).map(file => String(file).replaceAll('\\', '/')));
    if (![...files].some(isProductRuntimePath)) return [];

    const errors = [];
    for (const required of ['docs/CURRENT_STATE.md', 'docs/PLAN_TRACEABILITY.md']) {
        if (!files.has(required)) {
            errors.push(`PR com alteração funcional deve atualizar ${required} para registrar o impacto na continuidade.`);
        }
    }
    return errors;
}

function changedFilesFromGit(baseSha) {
    const output = execFileSync(
        'git',
        ['diff', '--name-only', `${baseSha}...HEAD`],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function printAndExit(errors) {
    if (errors.length === 0) {
        console.log('Continuidade documental válida: START_HERE único, plano corrente único e rastreabilidade íntegra.');
        return;
    }
    console.error('Falhas de continuidade documental:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
}

function isDirectExecution() {
    const current = fileURLToPath(import.meta.url);
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
    return invoked === current;
}

if (isDirectExecution()) {
    const args = process.argv.slice(2);
    const impactIndex = args.indexOf('--pr-impact');
    let errors = validateContinuityDocuments(process.cwd());

    if (impactIndex >= 0) {
        const baseSha = args[impactIndex + 1];
        if (!baseSha) {
            errors.push('Uso inválido: --pr-impact exige o SHA base do Pull Request.');
        } else {
            try {
                const files = changedFilesFromGit(baseSha);
                errors = errors.concat(validatePullRequestContinuityImpact(files));
                console.log(`Arquivos alterados analisados para continuidade: ${files.length}.`);
            } catch (error) {
                errors.push(`Não foi possível calcular o impacto do PR contra ${baseSha}: ${error.message}`);
            }
        }
    }

    printAndExit(errors);
}
