import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CURRENT_PLAN_MARKER = '**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**';
const HISTORICAL_BANNER = 'HISTÓRICO — NÃO EXECUTAR COMO FILA ATUAL';
const FUNCTIONAL_BASELINE_SHA = '8fc58926565a72465980143f253f0a2fee4b8fc2';
const COMPLETE_AUDIT = 'docs/audits/2026-09-05-continuity-semantic-traceability-complete.md';

const REQUIRED_FILES = Object.freeze([
    'START_HERE.md',
    'docs/CURRENT_STATE.md',
    'docs/MASTER_PLAN_CURRENT.md',
    'docs/PLAN_TRACEABILITY.md',
    COMPLETE_AUDIT
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
            if (entry.isDirectory()) visit(absolute);
            else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
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
    if (!source.includes(FUNCTIONAL_BASELINE_SHA) || !/#260\b/.test(source)) {
        errors.push(`START_HERE.md: baseline funcional PR #260 / ${FUNCTIONAL_BASELINE_SHA} não foi encontrada.`);
    }
    for (const reference of ['docs/CURRENT_STATE.md', 'docs/MASTER_PLAN_CURRENT.md', 'docs/PLAN_TRACEABILITY.md']) {
        if (!source.includes(reference)) {
            errors.push(`START_HERE.md: referência obrigatória ausente: ${reference}.`);
        }
    }
    if (!/#262/i.test(source) || !/ABORTADO/i.test(source) || !/SEM MERGE/i.test(source)) {
        errors.push('START_HERE.md: deve registrar explicitamente que o PR #262 foi abortado e fechado sem merge.');
    }
    if (!/#263/i.test(source) || !/documental|governan/i.test(source)) {
        errors.push('START_HERE.md: deve registrar que o PR #263 é consolidação documental/governança, não nova regra funcional.');
    }
    if (/compare o SHA atual com `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`/i.test(source)) {
        errors.push('START_HERE.md: não pode exigir que a main permaneça para sempre no checkpoint documental anterior ao próprio PR #263.');
    }
}

function validateCurrentPlanUniqueness(root, errors) {
    const matches = [];
    for (const relativePath of listMarkdownFiles(root)) {
        const source = read(root, relativePath);
        if (source?.includes(CURRENT_PLAN_MARKER)) matches.push(relativePath);
    }

    if (matches.length === 0) errors.push('Não existe documento marcado como plano executável vigente.');
    else if (matches.length > 1) errors.push(`Há mais de um documento marcado como plano executável vigente: ${matches.join(', ')}.`);
    else if (matches[0] !== 'docs/MASTER_PLAN_CURRENT.md') {
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
        if (!new RegExp(`\\bR${i}\\b`, 'i').test(source)) {
            errors.push(`docs/PLAN_TRACEABILITY.md: destino explícito ausente para R${i}.`);
        }
    }
    for (const pr of ['#254', '#256', '#257', '#258', '#260', '#261']) {
        if (!source.includes(pr)) errors.push(`docs/PLAN_TRACEABILITY.md: PR posterior obrigatório ausente: ${pr}.`);
    }
    if (!/#262/i.test(source) || !/abortad|sem merge/i.test(source)) {
        errors.push('docs/PLAN_TRACEABILITY.md: deve excluir explicitamente o PR #262 da baseline vigente.');
    }
}

function validateSemanticContinuity(root, errors) {
    const projectContext = read(root, 'docs/PROJECT_CONTEXT.md');
    if (projectContext != null) {
        if (!projectContext.includes('START_HERE.md') || !projectContext.includes('MASTER_PLAN_CURRENT.md')) {
            errors.push('docs/PROJECT_CONTEXT.md: deve apontar para START_HERE.md e MASTER_PLAN_CURRENT.md.');
        }
        if (/porta de entrada executável canônica é[^\n]*2026-09-03-plano-remanescente-source-first/i.test(projectContext)) {
            errors.push('docs/PROJECT_CONTEXT.md: ainda apresenta o plano de 03/09 como porta executável corrente.');
        }
        if (/novo envio exige Pendência `Aberta`/i.test(projectContext)) {
            errors.push('docs/PROJECT_CONTEXT.md: ainda contém a pré-condição de novo envio anterior ao PR #254.');
        }
    }

    const statusDocs = read(root, 'docs/reference/STATUS_DOCUMENTOS.md');
    if (statusDocs != null) {
        if (!statusDocs.includes('START_HERE.md') || !statusDocs.includes('MASTER_PLAN_CURRENT.md')) {
            errors.push('docs/reference/STATUS_DOCUMENTOS.md: deve apontar para a cadeia corrente.');
        }
        if (/plano source-first de 03\/09 é \*\*Canônico — plano executável corrente\*\*/i.test(statusDocs)
            || /fila atual é exclusivamente R1[–-]R9 no plano source-first/i.test(statusDocs)) {
            errors.push('docs/reference/STATUS_DOCUMENTOS.md: ainda contém uma fila executável superada.');
        }
    }

    const adr050 = read(root, 'docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md');
    if (adr050 != null) {
        if (/novo envio exige Pendência `Aberta` e cria/i.test(adr050)) {
            errors.push('ADR-050: a regra de novo envio deve refletir o PR #254.');
        }
        if (/Plano corrente:\s*`docs\/superpowers\/plans\/2026-09-03-plano-remanescente-source-first\.md`/i.test(adr050)) {
            errors.push('ADR-050: ainda aponta o plano de 03/09 como plano corrente.');
        }
    }

    const decisionLog = read(root, 'docs/DECISION_LOG.md');
    if (decisionLog != null && !decisionLog.includes('MASTER_PLAN_CURRENT.md')) {
        errors.push('docs/DECISION_LOG.md: falta registrar a sucessão para MASTER_PLAN_CURRENT.md.');
    }

    const loadOrder = read(root, 'docs/architecture/product-extensions-load-order.md');
    const bootstrap = read(root, 'src/integration/product-extensions-bootstrap.js');
    if (loadOrder != null && bootstrap?.includes('/src/integration/critical-action-guard.js')) {
        if (!loadOrder.includes('14. src/integration/critical-action-guard.js')
            || !loadOrder.includes('18. src/integration/operational-write-feedback.js')) {
            errors.push('docs/architecture/product-extensions-load-order.md: ordem não reflete o bootstrap pós-PR #260.');
        }
    }

    const catalog = read(root, 'docs/reference/PRODUCT_SURFACE_CATALOG.md');
    if (catalog != null) {
        if (!/processo já cadastrado[\s\S]{0,180}Encaminhada/i.test(catalog)
            || !/NF permanente sem processo[\s\S]{0,180}Não encaminhada/i.test(catalog)
            || !/não é etapa obrigatória de toda NF permanente/i.test(catalog)) {
            errors.push('PRODUCT_SURFACE_CATALOG.md: precisa preservar explicitamente os dois ramos da NF permanente.');
        }
    }

    const currentStage = read(root, 'docs/CURRENT_STAGE.md');
    if (currentStage != null && !/histórico de checkpoints/i.test(currentStage)) {
        errors.push('docs/CURRENT_STAGE.md: deve estar classificado como histórico de checkpoints, não como segunda fotografia corrente.');
    }

    const audit = read(root, COMPLETE_AUDIT);
    if (audit != null) {
        for (const required of ['#254', '#256', '#257', '#258', '#260', '#261', '#262', 'Inferências deliberadamente rejeitadas']) {
            if (!audit.includes(required)) errors.push(`${COMPLETE_AUDIT}: conteúdo obrigatório ausente: ${required}.`);
        }
        if (!/processo de inventário já existente[\s\S]{0,180}Encaminhada/i.test(audit)) {
            errors.push(`${COMPLETE_AUDIT}: regra condicional de inventário não foi registrada.`);
        }
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
    validateSemanticContinuity(root, errors);
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
        if (!files.has(required)) errors.push(`PR com alteração funcional deve atualizar ${required} para registrar o impacto na continuidade.`);
    }
    return errors;
}

function changedFilesFromGit(baseSha) {
    const output = execFileSync('git', ['diff', '--name-only', `${baseSha}...HEAD`], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    });
    return output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function printAndExit(errors) {
    if (errors.length === 0) {
        console.log('Continuidade válida: porta única, plano único, auditoria semântica completa e regras sensíveis alinhadas.');
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
        if (!baseSha) errors.push('Uso inválido: --pr-impact exige o SHA base do Pull Request.');
        else {
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
