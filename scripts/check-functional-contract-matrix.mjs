#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(MODULE_DIR, '..');
const MANIFEST_RELATIVE_PATH = 'docs/reference/functional-contract-matrix.json';
const MARKDOWN_RELATIVE_PATH = 'docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md';
const VALID_CRITICALITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const VALID_MODES = new Set(['read', 'write', 'edge-function', 'export', 'technical']);
const VALID_NEXT = new Set([
    'none',
    'authenticated-read',
    'controlled-write',
    'functional-decision',
    'production-observation'
]);
const NEXT_LABELS = Object.freeze({
    none: 'Nenhuma; manter regressão',
    'authenticated-read': 'Smoke autenticado de leitura',
    'controlled-write': 'Escrita controlada e reversível',
    'functional-decision': 'Decisão funcional expressa',
    'production-observation': 'Observação contínua em Production'
});
const COVERAGE_LABELS = Object.freeze({
    covered: 'Comprovada',
    partial: 'Parcial',
    gap: 'Lacuna',
    decision: 'Decisão pendente'
});

function readJson(rootDir, relativePath) {
    const absolutePath = path.join(rootDir, relativePath);
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function fileExists(rootDir, relativePath) {
    return fs.existsSync(path.join(rootDir, relativePath));
}

function textIncludes(rootDir, relativePath, expected) {
    if (!expected) return true;
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8').includes(expected);
}

function unique(values) {
    return [...new Set(values)];
}

function escapeCell(value) {
    return String(value ?? '')
        .replaceAll('|', '\\|')
        .replaceAll('\n', '<br>');
}

export function loadMatrix(rootDir = DEFAULT_ROOT) {
    const manifest = readJson(rootDir, MANIFEST_RELATIVE_PATH);
    const operations = [];
    for (const relativePath of manifest.operationFiles || []) {
        const rows = readJson(rootDir, `docs/reference/${relativePath}`);
        if (!Array.isArray(rows)) {
            throw new TypeError(`${relativePath} deve conter um array de operações.`);
        }
        operations.push(...rows);
    }
    return Object.freeze({ ...manifest, operations });
}

export function validateMatrix(matrix, rootDir = DEFAULT_ROOT) {
    const findings = [];
    const profiles = new Set((matrix.profiles || []).map(item => item.id));
    const surfaces = new Set((matrix.surfaces || []).map(item => item.id));
    const coverageStates = new Set(Object.keys(matrix.coverageStates || {}));
    const evidenceSets = matrix.evidenceSets || {};
    const operationIds = new Set();

    if (matrix.schemaVersion !== 1) findings.push('schemaVersion deve ser 1.');
    if (profiles.size < 6) findings.push('A matriz deve declarar os seis contextos de perfil, incluindo anônimo.');
    if (surfaces.size === 0) findings.push('A matriz deve declarar superfícies funcionais.');
    if (!Array.isArray(matrix.operations) || matrix.operations.length < 30) {
        findings.push('A matriz deve conter ao menos 30 operações críticas.');
    }

    for (const relativePath of matrix.operationFiles || []) {
        const fullPath = `docs/reference/${relativePath}`;
        if (!fileExists(rootDir, fullPath)) findings.push(`Arquivo de operações ausente: ${fullPath}.`);
    }

    for (const [evidenceId, evidence] of Object.entries(evidenceSets)) {
        for (const category of ['unit', 'e2e', 'database', 'production']) {
            if (!Array.isArray(evidence?.[category])) {
                findings.push(`Evidência ${evidenceId}.${category} deve ser um array.`);
                continue;
            }
            for (const relativePath of evidence[category]) {
                if (!fileExists(rootDir, relativePath)) {
                    findings.push(`Evidência inexistente em ${evidenceId}: ${relativePath}.`);
                }
            }
        }
    }

    for (const operation of matrix.operations || []) {
        const prefix = operation?.id || '<sem-id>';
        if (!/^[A-Z]+-\d{2}$/.test(prefix)) findings.push(`ID inválido: ${prefix}.`);
        if (operationIds.has(prefix)) findings.push(`ID duplicado: ${prefix}.`);
        operationIds.add(prefix);

        if (!surfaces.has(operation.surface)) findings.push(`${prefix}: superfície desconhecida ${operation.surface}.`);
        if (!VALID_MODES.has(operation.mode)) findings.push(`${prefix}: modo desconhecido ${operation.mode}.`);
        if (!VALID_CRITICALITIES.has(operation.criticality)) findings.push(`${prefix}: criticidade desconhecida ${operation.criticality}.`);
        if (!coverageStates.has(operation.coverage)) findings.push(`${prefix}: cobertura desconhecida ${operation.coverage}.`);
        if (!Object.hasOwn(evidenceSets, operation.evidence)) findings.push(`${prefix}: conjunto de evidências desconhecido ${operation.evidence}.`);
        if (!VALID_NEXT.has(operation.next)) findings.push(`${prefix}: próxima fase desconhecida ${operation.next}.`);

        const allow = Array.isArray(operation.allow) ? operation.allow : [];
        const deny = Array.isArray(operation.deny) ? operation.deny : [];
        const overlapping = allow.filter(profile => deny.includes(profile));
        if (overlapping.length > 0) findings.push(`${prefix}: perfis simultaneamente permitidos e negados: ${overlapping.join(', ')}.`);
        for (const profile of [...allow, ...deny]) {
            if (!profiles.has(profile)) findings.push(`${prefix}: perfil desconhecido ${profile}.`);
        }
        const classified = unique([...allow, ...deny]);
        if (classified.length !== profiles.size || classified.some(profile => !profiles.has(profile))) {
            findings.push(`${prefix}: allow + deny deve classificar todos os perfis exatamente uma vez.`);
        }
        if (allow.length === 0) findings.push(`${prefix}: ao menos um perfil deve ser permitido.`);

        if (!Array.isArray(operation.anchors) || operation.anchors.length === 0) {
            findings.push(`${prefix}: ao menos uma âncora de código é obrigatória.`);
        } else {
            for (const anchor of operation.anchors) {
                if (!Array.isArray(anchor) || anchor.length !== 2) {
                    findings.push(`${prefix}: âncora inválida; use [caminho, símbolo].`);
                    continue;
                }
                const [relativePath, symbol] = anchor;
                if (!fileExists(rootDir, relativePath)) {
                    findings.push(`${prefix}: arquivo de âncora ausente: ${relativePath}.`);
                } else if (symbol && !textIncludes(rootDir, relativePath, symbol)) {
                    findings.push(`${prefix}: símbolo "${symbol}" não encontrado em ${relativePath}.`);
                }
            }
        }

        for (const field of ['action', 'service', 'repository', 'concurrency', 'compensation']) {
            if (!String(operation[field] || '').trim()) findings.push(`${prefix}: campo obrigatório ausente: ${field}.`);
        }
        if (!Array.isArray(operation.resources) || operation.resources.length === 0) findings.push(`${prefix}: resources deve conter ao menos um recurso.`);
        if (!Array.isArray(operation.gaps)) findings.push(`${prefix}: gaps deve ser um array.`);
        if (operation.coverage === 'covered' && operation.gaps?.length > 0) findings.push(`${prefix}: operação coberta não pode declarar lacunas.`);
        if (operation.coverage !== 'covered' && operation.gaps?.length === 0) findings.push(`${prefix}: cobertura ${operation.coverage} exige lacuna explícita.`);

        const mutation = ['write', 'edge-function', 'technical'].includes(operation.mode);
        if (mutation && ['P0', 'P1'].includes(operation.criticality)) {
            if (operation.reload !== true) findings.push(`${prefix}: mutação P0/P1 deve exigir releitura após refresh.`);
            if (operation.concurrency === 'not_applicable') findings.push(`${prefix}: mutação P0/P1 deve declarar contrato de concorrência.`);
            if (operation.compensation === 'not_applicable') findings.push(`${prefix}: mutação P0/P1 deve declarar rollback ou compensação.`);
        }
    }

    return findings;
}

function renderSummary(matrix) {
    const counts = Object.fromEntries(Object.keys(matrix.coverageStates).map(key => [key, 0]));
    const nextCounts = Object.fromEntries([...VALID_NEXT].map(key => [key, 0]));
    for (const operation of matrix.operations) {
        counts[operation.coverage] = (counts[operation.coverage] || 0) + 1;
        nextCounts[operation.next] = (nextCounts[operation.next] || 0) + 1;
    }
    const coverageRows = Object.entries(counts)
        .map(([key, count]) => `| ${COVERAGE_LABELS[key] || key} | ${count} |`)
        .join('\n');
    const nextRows = Object.entries(nextCounts)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `| ${NEXT_LABELS[key] || key} | ${count} |`)
        .join('\n');
    return [
        '## Resumo executivo',
        '',
        `A matriz contém **${matrix.operations.length} operações** distribuídas entre ${matrix.surfaces.length} superfícies.`,
        '',
        '| Cobertura | Operações |',
        '|---|---:|',
        coverageRows,
        '',
        '| Próxima prova | Operações |',
        '|---|---:|',
        nextRows
    ].join('\n');
}

function renderProfiles(matrix) {
    const rows = matrix.profiles.map(profile => `| \`${profile.id}\` | ${escapeCell(profile.label)} | ${escapeCell(profile.kind)} |`).join('\n');
    return ['## Perfis', '', '| Identificador | Nome | Natureza |', '|---|---|---|', rows].join('\n');
}

function renderOperations(matrix) {
    const profileLabels = new Map(matrix.profiles.map(profile => [profile.id, profile.label]));
    const surfaceLabels = new Map(matrix.surfaces.map(surface => [surface.id, surface.label]));
    const sections = ['## Operações'];
    for (const surface of matrix.surfaces) {
        const operations = matrix.operations.filter(operation => operation.surface === surface.id);
        if (operations.length === 0) continue;
        sections.push('', `### ${surfaceLabels.get(surface.id)}`, '', '| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |', '|---|---|---|---|---|---|---|');
        for (const operation of operations) {
            const allowed = operation.allow.map(profile => profileLabels.get(profile) || profile).join(', ');
            const backend = `${operation.service} → ${operation.repository} (${operation.resources.join(', ')})`;
            sections.push(`| \`${operation.id}\` | ${escapeCell(operation.action)} | ${escapeCell(operation.mode)} / ${operation.criticality} | ${escapeCell(allowed)} | ${escapeCell(backend)} | ${COVERAGE_LABELS[operation.coverage] || operation.coverage} | ${escapeCell(NEXT_LABELS[operation.next] || operation.next)} |`);
        }
    }
    return sections.join('\n');
}

function renderGaps(matrix) {
    const rows = [];
    for (const operation of matrix.operations) {
        if (operation.coverage === 'covered') continue;
        for (const gap of operation.gaps) rows.push(`- **${operation.id} — ${operation.action}:** ${gap}`);
    }
    return ['## Lacunas e decisões pendentes', '', ...rows].join('\n');
}

export function renderMarkdown(matrix) {
    return [
        '# Matriz funcional ponta a ponta',
        '',
        `**Atualizado em:** ${matrix.updatedAt}  `,
        `**Baseline de origem:** \`${matrix.sourceCommit}\`  `,
        '**Fonte canônica:** `functional-contract-matrix.json` e arquivos JSON do diretório `functional-contract-matrix/`',
        '',
        '> Arquivo gerado por `scripts/check-functional-contract-matrix.mjs`. Não editar manualmente.',
        '',
        renderSummary(matrix),
        '',
        renderProfiles(matrix),
        '',
        renderOperations(matrix),
        '',
        renderGaps(matrix),
        '',
        '## Uso operacional',
        '',
        '```bash',
        'npm run generate:functional-matrix',
        'npm run check:functional-matrix',
        '```',
        '',
        'A matriz registra o contrato atual. Lacunas não autorizam alteração automática: cada correção exige regressão, branch isolada, revisão e autorização de integração.',
        ''
    ].join('\n');
}

export function main(argv = process.argv.slice(2), rootDir = DEFAULT_ROOT) {
    let matrix;
    try {
        matrix = loadMatrix(rootDir);
    } catch (error) {
        console.error(`Falha ao carregar a matriz funcional: ${error.message}`);
        return 1;
    }

    const findings = validateMatrix(matrix, rootDir);
    if (findings.length > 0) {
        console.error('Matriz funcional inválida:');
        findings.forEach(finding => console.error(`- ${finding}`));
        return 1;
    }

    const rendered = renderMarkdown(matrix);
    const markdownPath = path.join(rootDir, MARKDOWN_RELATIVE_PATH);
    if (argv.includes('--write')) {
        fs.writeFileSync(markdownPath, rendered, 'utf8');
        console.log(`Matriz funcional gerada em ${MARKDOWN_RELATIVE_PATH}.`);
        return 0;
    }

    if (!fs.existsSync(markdownPath)) {
        console.error(`Arquivo gerado ausente: ${MARKDOWN_RELATIVE_PATH}. Execute com --write.`);
        return 1;
    }
    const current = fs.readFileSync(markdownPath, 'utf8');
    if (current !== rendered) {
        console.error(`Arquivo gerado divergente: ${MARKDOWN_RELATIVE_PATH}. Execute com --write.`);
        return 1;
    }

    console.log(`Matriz funcional válida: ${matrix.operations.length} operações.`);
    return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    process.exitCode = main();
}
