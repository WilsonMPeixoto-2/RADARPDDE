#!/usr/bin/env node
/**
 * Auditável e read-only: valida consistência dos registros e roteadores T0–T6.
 * NÃO acessa GitHub, Supabase ou Production, NÃO modifica arquivos.
 * Conclusão de testes/CI não substitui prova de implantação ou aceite humano.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTINUITY_ROOT = 'docs/continuity/prontuario-t0-t6';
const REGISTRY_PATH = `${CONTINUITY_ROOT}/registry.json`;
const ROUTERS = Object.freeze([
    'AGENTS.md',
    'docs/README.md',
    'docs/CURRENT_STAGE.md',
    'docs/reference/STATUS_DOCUMENTOS.md',
    'docs/releases/2026-11-20-prontuario-t0-t3-release-1.md'
]);
const DECISION_STATES = new Set(['approved', 'superseded', 'proposed']);
const CONTRIBUTION_STATES = new Set([
    'pending-review', 'accepted-for-validation', 'incorporated',
    'reference', 'rejected', 'deferred'
]);
const GITHUB_REPO_URL = 'https://github.com/WilsonMPeixoto-2/RADARPDDE/';

function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function validString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function isSafeRelativePath(value) {
    return validString(value)
        && !path.isAbsolute(value)
        && !value.split(/[\\/]+/).includes('..')
        && !value.startsWith('.')
        && !value.includes('\\');
}
function ensureRecordList(items, label, errors) {
    if (!Array.isArray(items) || items.length === 0) {
        errors.push(`${label}: lista ausente ou vazia`);
        return [];
    }
    return items;
}

function validateContinuityRegistry(registry, { rootDir = null } = {}) {
    const errors = [];
    if (!isRecord(registry)) return ['registry: objeto obrigatório'];
    if (registry.schemaVersion !== 1) errors.push('schemaVersion: esperado 1');
    if (registry.workstream !== 'RADARPDDE/PRONTUARIO-T0-T6') {
        errors.push('workstream: frente inesperada');
    }
    if (!isRecord(registry.active)) {
        errors.push('active: configuração ausente');
    } else {
        const active = registry.active;
        if (!/^R[1-3]$/.test(String(active.release || ''))) errors.push('active.release: versão inválida');
        if (!Number.isInteger(active.pr) || active.pr < 1) errors.push('active.pr: número inválido');
        if (!validString(active.branch)) errors.push('active.branch: faltando');
        if (!Array.isArray(active.stages) || !active.stages.length) errors.push('active.stages: vazio');
        if (active.decisionsPath !== REGISTRY_PATH) errors.push('active.decisionsPath: caminho divergente');
        if (active.checkpointPath !== `${CONTINUITY_ROOT}/CHECKPOINT.md`) {
            errors.push('active.checkpointPath: caminho divergente');
        }
        if (!validString(active.status)) errors.push('active.status: ausente');
        if (active.status === 'publicada' && !validString(active.productionEvidence)) {
            errors.push('active.productionEvidence: publicação exige prova externa explícita');
        }
    }

    const decisions = ensureRecordList(registry.decisions, 'decisions', errors);
    const contributions = ensureRecordList(registry.contributions, 'contributions', errors);
    const decisionIds = new Map();
    const supersededBy = new Map();

    for (const [index, row] of decisions.entries()) {
        const where = `decisions[${index}]`;
        if (!isRecord(row)) { errors.push(`${where}: objeto inválido`); continue; }
        if (!/^T0T6-D\d{3}$/.test(String(row.id || ''))) {
            errors.push(`${where}.id: identificador inválido`);
        }
        if (decisionIds.has(row.id)) errors.push(`${where}.id: ID duplicado ${row.id}`);
        else decisionIds.set(row.id, row);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date || ''))) {
            errors.push(`${where}.date: data inválida`);
        }
        if (!DECISION_STATES.has(row.status)) errors.push(`${where}.status: inválido`);
        for (const field of ['stage', 'title', 'decision']) {
            if (!validString(row[field])) errors.push(`${where}.${field}: vazio`);
        }
        if (!isSafeRelativePath(row.sourcePath)) {
            errors.push(`${where}.sourcePath: caminho inválido`);
        } else if (rootDir && !fs.existsSync(path.join(rootDir, row.sourcePath))) {
            errors.push(`${where}.sourcePath: arquivo não encontrado: ${row.sourcePath}`);
        }
        if (!Array.isArray(row.supersedes)) errors.push(`${where}.supersedes: exige array`);
    }
    for (const decision of decisions) {
        if (!isRecord(decision)) continue;
        for (const id of (Array.isArray(decision.supersedes) ? decision.supersedes : [])) {
            if (id === decision.id) errors.push(`${decision.id}: autossupersessão`);
            const old = decisionIds.get(id);
            if (!old) errors.push(`${decision.id}: supersedes ID inexistente ${id}`);
            else if (old.status !== 'superseded') errors.push(`${decision.id}: ${id} deve estar superseded`);
            if (decision.status !== 'approved') errors.push(`${decision.id}: supersedes exige decisão aprovada`);
            supersededBy.set(id, (supersededBy.get(id) || 0) + 1);
        }
    }
    for (const row of decisions) {
        if (isRecord(row) && row.status === 'superseded' && !supersededBy.has(row.id)) {
            errors.push(`${row.id}: decisão superseded sem sucessora declarada`);
        }
    }

    const contributionIds = new Set();
    for (const [index, row] of contributions.entries()) {
        const where = `contributions[${index}]`;
        if (!isRecord(row)) { errors.push(`${where}: objeto inválido`); continue; }
        if (!/^T0T6-C\d{3}$/.test(String(row.id || ''))) errors.push(`${where}.id: inválido`);
        if (contributionIds.has(row.id)) errors.push(`${where}.id: ID duplicado ${row.id}`);
        contributionIds.add(row.id);
        if (!CONTRIBUTION_STATES.has(row.status)) errors.push(`${where}.status: inválido`);
        for (const field of ['agent', 'stage', 'title', 'originRef', 'rationale']) {
            if (!validString(row[field])) errors.push(`${where}.${field}: vazio`);
        }
        if (!validString(row.sourceUrl) || !row.sourceUrl.startsWith(GITHUB_REPO_URL)) {
            errors.push(`${where}.sourceUrl: exigir referência verificável ao repositório`);
        }
        if (!Array.isArray(row.decisionIds) || !row.decisionIds.length) {
            errors.push(`${where}.decisionIds: vínculo obrigatório`);
        } else {
            for (const id of row.decisionIds) {
                if (!decisionIds.has(id)) errors.push(`${where}.decisionIds: decisão inexistente ${id}`);
            }
        }
        if (row.status === 'incorporated' && (
            !validString(row.integratedRef) || !row.integratedRef.startsWith(GITHUB_REPO_URL)
        )) {
            errors.push(`${where}.integratedRef: implementação sem prova GitHub`);
        }
    }
    return errors;
}

function checkContinuityRepository(rootDir = REPOSITORY_ROOT) {
    const errors = [];
    const registryFile = path.join(rootDir, REGISTRY_PATH);
    let registry;
    try {
        registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
    } catch (error) {
        return [`registry.json não pode ser lido: ${error.message}`];
    }
    errors.push(...validateContinuityRegistry(registry, { rootDir }));
    for (const file of ROUTERS) {
        const absolute = path.join(rootDir, file);
        const value = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
        const relativePointer = CONTINUITY_ROOT.slice('docs/'.length);
        if (!value.includes(CONTINUITY_ROOT) && !value.includes(relativePointer)) {
            errors.push(`${file}: falta o ponteiro canônico para ${CONTINUITY_ROOT}`);
        }
    }
    for (const file of ['README.md', 'CHECKPOINT.md']) {
        const current = path.join(rootDir, CONTINUITY_ROOT, file);
        if (!fs.existsSync(current)) errors.push(`${CONTINUITY_ROOT}/${file}: ausente`);
    }
    const checkpointFile = path.join(rootDir, CONTINUITY_ROOT, 'CHECKPOINT.md');
    if (fs.existsSync(checkpointFile)) {
        const checkpoint = fs.readFileSync(checkpointFile, 'utf8');
        if (!checkpoint.includes(`PR #${registry.active?.pr}`)) {
            errors.push('CHECKPOINT.md: não aponta para o PR ativo do registro');
        }
        if (!checkpoint.includes('registry.json')) {
            errors.push('CHECKPOINT.md: falta referência ao registro');
        }
    }
    return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const errors = checkContinuityRepository();
    if (errors.length) {
        for (const error of errors) console.error(`[continuidade] ${error}`);
        process.exitCode = 1;
    } else {
        console.log('[continuidade] T0–T6: registro, decisões, contribuições e ponteiros íntegros.');
    }
}

export { validateContinuityRegistry, checkContinuityRepository };
