#!/usr/bin/env node
/**
 * Auditável e read-only: valida consistência dos registros e roteadores T0–T6.
 * NÃO acessa GitHub, Supabase ou Production, NÃO modifica arquivos.
 * Conclusão de testes/CI não substitui prova de implantação ou aceite humano.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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


/**
 * Atlas de proveniência: rejeita falsas referências a código, origens sem SHA,
 * perda de decisão vinculada e mudanças silenciosas dos documentos de origem.
 * NÃO prova que um requisito foi implementado nem que todos os chats foram recuperados.
 */
const LINEAGE_STATES = new Set([
    'awaiting-human', 'candidate-partial', 'candidate-tested',
    'contract-active', 'evidence-gap', 'approved-future',
    'proposal-deferred', 'proposal-unresolved', 'open-verification',
    'historical-superseded', 'historical-rejected', 'reference-only'
]);
const SOURCE_STATES = new Set([
    'reviewed', 'partial-review', 'indexed-pending-review', 'not-recovered'
]);
const SOURCE_LOCATIONS = new Set(['release-branch', 'external-branch', 'unavailable-artifact']);

function gitBlobHash(bytes) {
    return createHash('sha1')
        .update(Buffer.from('blob ' + bytes.length + String.fromCharCode(0)))
        .update(bytes)
        .digest('hex');
}

function validateProntuarioLineage(atlas, { rootDir = null, registry = null } = {}) {
    const errors = [];
    if (!isRecord(atlas)) return ['atlas: objeto obrigatório'];
    if (atlas.schemaVersion !== 1 || atlas.feature !== 'PRONTUARIO_T0_T6') {
        errors.push('atlas: esquema ou frente não reconhecida');
    }
    if (!/^([a-f0-9]{40})$/.test(String(atlas.baselineCommit || ''))) {
        errors.push('atlas: baselineCommit SHA inválido');
    }
    const sources = ensureRecordList(atlas.sources, 'atlas.sources', errors);
    const requirements = ensureRecordList(atlas.requirements, 'atlas.requirements', errors);
    const sourcesById = new Map();
    const decisions = new Set(Array.isArray(registry?.decisions)
        ? registry.decisions.map(d => d.id)
        : []);
    for (const [i, source] of sources.entries()) {
        const loc = 'atlas.sources[' + i + ']';
        if (!isRecord(source)) { errors.push(loc + ': objeto inválido'); continue; }
        if (!/^S[0-9]{3}$/.test(String(source.id || ''))) errors.push(loc + ': ID inválido');
        if (sourcesById.has(source.id)) errors.push(loc + ': ID duplicado ' + source.id);
        sourcesById.set(source.id, source);
        if (!SOURCE_LOCATIONS.has(source.location)) errors.push(loc + ': localização inválida');
        if (!SOURCE_STATES.has(source.reviewStatus)) errors.push(loc + ': estado de revisão inválido');
        if (!validString(source.role)) errors.push(loc + ': propósito da fonte ausente');
        if (source.location === 'unavailable-artifact') {
            if (source.reviewStatus !== 'not-recovered' || !validString(source.note)) {
                errors.push(loc + ': artefato indisponível deve declarar lacuna e justificativa');
            }
            continue;
        }
        if (!isSafeRelativePath(source.path)) errors.push(loc + ': caminho de origem inválido');
        if (!/^[a-f0-9]{40}$/.test(String(source.contentSha || ''))) {
            errors.push(loc + ': conteúdo sem git blob SHA');
        }
        if (!validString(source.url) || !source.url.startsWith(GITHUB_REPO_URL)) {
            errors.push(loc + ': URL de proveniência inválida');
        }
        if (source.location === 'external-branch') {
            if (!validString(source.ref)) errors.push(loc + ': branch externa sem ref');
            if (!/^[a-f0-9]{40}$/.test(String(source.pinnedCommit || ''))) {
                errors.push(loc + ': falta SHA de commit imutável na origem');
            } else if (!String(source.url || '').includes('/blob/' + source.pinnedCommit + '/')) {
                errors.push(loc + ': URL não está fixada ao commit da origem');
            }
            continue;
        }
        if (rootDir && isSafeRelativePath(source.path)) {
            const file = path.join(rootDir, source.path);
            if (!fs.existsSync(file)) {
                errors.push(loc + ': arquivo da fonte não existe: ' + source.path);
            } else if (gitBlobHash(fs.readFileSync(file)) !== source.contentSha) {
                errors.push(loc + ': fingerprint divergente em ' + source.path
                    + '; revalidar decisões após alterar a fonte antes de atualizar o SHA');
            }
        }
    }
    const requirementIds = new Set();
    const usedSources = new Set();
    for (const [i, requirement] of requirements.entries()) {
        const loc = 'atlas.requirements[' + i + ']';
        if (!isRecord(requirement)) { errors.push(loc + ': objeto inválido'); continue; }
        if (!/^T0T6-R[0-9]{3}$/.test(String(requirement.id || ''))) errors.push(loc + ': ID inválido');
        if (requirementIds.has(requirement.id)) errors.push(loc + ': ID duplicado ' + requirement.id);
        requirementIds.add(requirement.id);
        if (!LINEAGE_STATES.has(requirement.state)) errors.push(loc + ': estado inválido');
        if (!validString(requirement.label) || !validString(requirement.phase)
            || !validString(requirement.evidence)) {
            errors.push(loc + ': descrição, fase ou limite de evidência ausente');
        }
        if (!Array.isArray(requirement.sourceIds) || !requirement.sourceIds.length) {
            errors.push(loc + ': sem fonte original');
        } else {
            for (const sourceId of requirement.sourceIds) {
                if (!sourcesById.has(sourceId)) errors.push(loc + ': fonte inexistente ' + sourceId);
                else usedSources.add(sourceId);
            }
        }
        if (!Array.isArray(requirement.decisionIds) || !requirement.decisionIds.length) {
            errors.push(loc + ': sem decisão relacionada');
        } else if (registry) {
            for (const id of requirement.decisionIds) {
                if (!decisions.has(id)) errors.push(loc + ': decisão inexistente ' + id);
            }
        }
        for (const [prop, kind] of [['codePaths', 'código'], ['testPaths', 'teste']]) {
            const refs = requirement[prop];
            if (!Array.isArray(refs)) { errors.push(loc + ': ' + prop + ' não é array'); continue; }
            for (const ref of refs) {
                if (!isSafeRelativePath(ref) || (rootDir && !fs.existsSync(path.join(rootDir, ref)))) {
                    errors.push(loc + ': arquivo de ' + kind + ' não existe: ' + ref);
                }
            }
        }
        if (requirement.state === 'candidate-tested'
            && (!Array.isArray(requirement.testPaths) || !requirement.testPaths.length)) {
            errors.push(loc + ': candidate-tested exige referência ao teste');
        }
        if (requirement.state === 'evidence-gap'
            && !requirement.sourceIds.some(id => sourcesById.get(id)?.reviewStatus === 'not-recovered')) {
            errors.push(loc + ': lacuna não aponta para artefato ausente');
        }
    }
    for (const source of sources) {
        if (isRecord(source) && !usedSources.has(source.id)) {
            errors.push('atlas: fonte sem nenhum requisito vinculado: ' + source.id);
        }
    }
    if (!Array.isArray(atlas.gaps) || !atlas.gaps.length) {
        errors.push('atlas: lacunas conhecidas ausentes; não alegar completude artificial');
    } else {
        const gapIds = new Set();
        for (const gap of atlas.gaps) {
            if (!isRecord(gap) || !validString(gap.id) || !validString(gap.description)
                || !validString(gap.nextStep)) {
                errors.push('atlas: lacuna sem ID, explicação ou próxima ação');
                continue;
            }
            if (gapIds.has(gap.id)) errors.push('atlas: ID de lacuna duplicado ' + gap.id);
            gapIds.add(gap.id);
            for (const ref of (Array.isArray(gap.sourceIds) ? gap.sourceIds : [])) {
                if (!sourcesById.has(ref)) errors.push('atlas: lacuna aponta para fonte inexistente ' + ref);
            }
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
    let lineage;
    try {
        lineage = JSON.parse(fs.readFileSync(path.join(rootDir, CONTINUITY_ROOT, 'lineage.json'), 'utf8'));
    } catch (error) {
        errors.push('lineage.json não pode ser lido: ' + error.message);
    }
    if (lineage) errors.push(...validateProntuarioLineage(lineage, { rootDir, registry }));
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

export { validateContinuityRegistry, validateProntuarioLineage, checkContinuityRepository };
