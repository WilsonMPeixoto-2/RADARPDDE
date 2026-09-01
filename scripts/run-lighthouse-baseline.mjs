import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configModule = await import(pathToFileURL(path.join(ROOT, 'lighthouserc.cjs')).href);
const config = configModule.default || configModule;
const profileName = process.env.LHCI_PROFILE === 'desktop' ? 'desktop' : 'mobile';
const profile = config.profiles?.[profileName];

if (!profile) {
    throw new Error(`Perfil Lighthouse desconhecido: ${profileName}`);
}

const METRICS = Object.freeze({
    'first-contentful-paint': Object.freeze({ label: 'First Contentful Paint', shortLabel: 'FCP' }),
    'largest-contentful-paint': Object.freeze({ label: 'Largest Contentful Paint', shortLabel: 'LCP' }),
    'speed-index': Object.freeze({ label: 'Speed Index', shortLabel: 'Speed Index' }),
    'total-blocking-time': Object.freeze({ label: 'Total Blocking Time', shortLabel: 'TBT' }),
    'cumulative-layout-shift': Object.freeze({ label: 'Cumulative Layout Shift', shortLabel: 'CLS' }),
    interactive: Object.freeze({ label: 'Time to Interactive', shortLabel: 'TTI' })
});

const outputDir = path.join(ROOT, 'artifacts', 'lighthouse', profileName);
const categories = Array.isArray(config.categories) ? config.categories : [];
const runs = Number.isInteger(config.numberOfRuns) && config.numberOfRuns > 0
    ? config.numberOfRuns
    : 1;

await mkdir(outputDir, { recursive: true });

async function resolveLighthouseCli() {
    const packageEntry = fileURLToPath(import.meta.resolve('lighthouse'));
    let directory = path.dirname(packageEntry);
    const filesystemRoot = path.parse(directory).root;

    while (directory !== filesystemRoot) {
        try {
            const packageJson = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
            if (packageJson.name === 'lighthouse') {
                const relativeBin = typeof packageJson.bin === 'string'
                    ? packageJson.bin
                    : packageJson.bin?.lighthouse;
                if (!relativeBin) {
                    throw new Error('O pacote Lighthouse não declarou o executável lighthouse.');
                }
                return path.resolve(directory, relativeBin);
            }
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
        }
        directory = path.dirname(directory);
    }

    throw new Error('Não foi possível localizar o executável do pacote Lighthouse.');
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: ROOT,
            env: process.env,
            stdio: 'inherit'
        });
        child.once('error', reject);
        child.once('exit', code => {
            if (code === 0) resolve();
            else reject(new Error(`Lighthouse encerrou com código ${String(code)}.`));
        });
    });
}

async function findJsonReport(baseName) {
    const candidates = (await readdir(outputDir))
        .filter(name => name.startsWith(baseName) && name.endsWith('.json'))
        .sort();
    const reportName = candidates.find(name => name.includes('.report.')) || candidates[0];
    if (!reportName) {
        throw new Error(`Relatório JSON não produzido para ${baseName}.`);
    }
    return path.join(outputDir, reportName);
}

function median(values) {
    const numericValues = values
        .filter(value => typeof value === 'number' && Number.isFinite(value))
        .sort((left, right) => left - right);
    if (numericValues.length === 0) return null;
    const middle = Math.floor(numericValues.length / 2);
    return numericValues.length % 2 === 0
        ? (numericValues[middle - 1] + numericValues[middle]) / 2
        : numericValues[middle];
}

function categoryScores(report) {
    return Object.fromEntries(categories.map(category => {
        const score = report.categories?.[category]?.score;
        return [category, typeof score === 'number' ? score : null];
    }));
}

function metricValues(report) {
    return Object.fromEntries(Object.keys(METRICS).map(auditId => {
        const audit = report.audits?.[auditId];
        return [auditId, audit
            ? {
                numericValue: typeof audit.numericValue === 'number' ? audit.numericValue : null,
                numericUnit: audit.numericUnit || null,
                displayValue: audit.displayValue || null,
                score: typeof audit.score === 'number' ? audit.score : null
            }
            : null];
    }));
}

function performanceOpportunities(report) {
    const performanceRefs = report.categories?.performance?.auditRefs || [];
    return performanceRefs
        .map(reference => ({ reference, audit: report.audits?.[reference.id] }))
        .filter(({ audit }) => audit && typeof audit.score === 'number' && audit.score < 1)
        .map(({ reference, audit }) => ({
            id: reference.id,
            title: audit.title || reference.id,
            score: audit.score,
            displayValue: audit.displayValue || null,
            savingsMs: typeof audit.details?.overallSavingsMs === 'number'
                ? audit.details.overallSavingsMs
                : null,
            savingsBytes: typeof audit.details?.overallSavingsBytes === 'number'
                ? audit.details.overallSavingsBytes
                : null
        }))
        .filter(item => (
            (item.savingsMs || 0) > 0
            || (item.savingsBytes || 0) > 0
            || /economia estimada|estimated savings/i.test(item.displayValue || '')
        ))
        .sort((left, right) => (
            (right.savingsMs || 0) - (left.savingsMs || 0)
            || (right.savingsBytes || 0) - (left.savingsBytes || 0)
            || left.score - right.score
        ))
        .slice(0, 8);
}

function accessibilityFindings(report) {
    const accessibilityRefs = report.categories?.accessibility?.auditRefs || [];
    return accessibilityRefs
        .map(reference => ({ reference, audit: report.audits?.[reference.id] }))
        .filter(({ audit }) => audit && typeof audit.score === 'number' && audit.score < 1)
        .map(({ reference, audit }) => ({
            id: reference.id,
            title: audit.title || reference.id,
            score: audit.score,
            itemCount: Array.isArray(audit.details?.items) ? audit.details.items.length : 0,
            displayValue: audit.displayValue || null
        }))
        .sort((left, right) => right.itemCount - left.itemCount || left.title.localeCompare(right.title, 'pt-BR'));
}

function aggregateOpportunities(results) {
    const aggregated = new Map();
    for (const result of results) {
        for (const item of result.opportunities) {
            const current = aggregated.get(item.id) || { ...item, occurrences: 0 };
            current.occurrences += 1;
            current.score = Math.min(current.score, item.score);
            current.savingsMs = Math.max(current.savingsMs || 0, item.savingsMs || 0) || null;
            current.savingsBytes = Math.max(current.savingsBytes || 0, item.savingsBytes || 0) || null;
            current.displayValue ||= item.displayValue;
            aggregated.set(item.id, current);
        }
    }
    return [...aggregated.values()]
        .sort((left, right) => (
            (right.savingsMs || 0) - (left.savingsMs || 0)
            || (right.savingsBytes || 0) - (left.savingsBytes || 0)
            || left.score - right.score
        ))
        .slice(0, 8);
}

function aggregateAccessibilityFindings(results) {
    const aggregated = new Map();
    for (const result of results) {
        for (const item of result.accessibilityFindings) {
            const current = aggregated.get(item.id) || { ...item, occurrences: 0 };
            current.occurrences += 1;
            current.score = Math.min(current.score, item.score);
            current.itemCount = Math.max(current.itemCount, item.itemCount);
            current.displayValue ||= item.displayValue;
            aggregated.set(item.id, current);
        }
    }
    return [...aggregated.values()]
        .sort((left, right) => right.itemCount - left.itemCount || left.title.localeCompare(right.title, 'pt-BR'));
}

function formatMetric(auditId, value) {
    if (typeof value !== 'number') return 'indisponível';
    if (auditId === 'cumulative-layout-shift') return value.toFixed(3);
    if (value >= 1000) return `${(value / 1000).toFixed(2).replace('.', ',')} s`;
    return `${Math.round(value)} ms`;
}

function formatSavings(item) {
    if (item.displayValue) return item.displayValue;
    if ((item.savingsMs || 0) > 0) return `economia estimada de ${Math.round(item.savingsMs)} ms`;
    if ((item.savingsBytes || 0) > 0) return `economia estimada de ${Math.round(item.savingsBytes / 1024)} KiB`;
    return 'oportunidade identificada';
}

function markdownEscape(value) {
    return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function buildMarkdown(summary) {
    const lines = [
        `## Lighthouse — ${summary.profile === 'mobile' ? 'Mobile' : 'Desktop'}`,
        '',
        '| Categoria | Mediana | Piso |',
        '|---|---:|---:|'
    ];

    for (const category of summary.categories) {
        const score = summary.medians[category];
        const threshold = profile.thresholds?.[category];
        lines.push(`| ${category} | ${typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : '—'} | ${typeof threshold === 'number' ? `${(threshold * 100).toFixed(0)}%` : '—'} |`);
    }

    lines.push('', '| Métrica | Mediana | Limite |', '|---|---:|---:|');
    for (const [auditId, metadata] of Object.entries(METRICS)) {
        const value = summary.metricMedians[auditId];
        const budget = profile.metricBudgets?.[auditId];
        lines.push(`| ${metadata.shortLabel} | ${formatMetric(auditId, value)} | ${typeof budget === 'number' ? formatMetric(auditId, budget) : 'informativo'} |`);
    }

    lines.push('', '### Oportunidades prioritárias');
    if (summary.opportunities.length === 0) {
        lines.push('- Nenhuma oportunidade com economia estimada foi identificada.');
    } else {
        summary.opportunities.forEach(item => {
            lines.push(`- **${markdownEscape(item.title)}** — ${markdownEscape(formatSavings(item))}.`);
        });
    }

    lines.push('', '### Achados de acessibilidade');
    if (summary.accessibilityFindings.length === 0) {
        lines.push('- Nenhum achado automático de acessibilidade.');
    } else {
        summary.accessibilityFindings.forEach(item => {
            const count = item.itemCount > 0 ? ` (${item.itemCount} ocorrência(s))` : '';
            lines.push(`- **${markdownEscape(item.title)}**${count}.`);
        });
    }

    lines.push('', summary.violations.length === 0
        ? '✅ Pisos de qualidade e orçamentos de métricas aprovados.'
        : `❌ ${summary.violations.length} violação(ões) de qualidade identificada(s).`);

    return `${lines.join('\n')}\n`;
}

const lighthouseCli = await resolveLighthouseCli();
const results = [];
for (let run = 1; run <= runs; run += 1) {
    const baseName = `lighthouse-${profileName}-${String(run).padStart(2, '0')}`;
    const outputPath = path.join(outputDir, baseName);
    const args = [
        lighthouseCli,
        String(config.url),
        '--quiet',
        '--locale=pt-BR',
        '--no-enable-error-reporting',
        '--chrome-flags=--headless --no-sandbox --disable-gpu --disable-dev-shm-usage',
        `--only-categories=${categories.join(',')}`,
        '--output=json',
        '--output=html',
        `--output-path=${outputPath}`,
        ...(Array.isArray(profile.args) ? profile.args : [])
    ];

    await runCommand(process.execPath, args);
    const reportPath = await findJsonReport(baseName);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    results.push({
        run,
        finalUrl: report.finalDisplayedUrl || report.finalUrl || String(config.url),
        fetchTime: report.fetchTime || null,
        scores: categoryScores(report),
        metrics: metricValues(report),
        opportunities: performanceOpportunities(report),
        accessibilityFindings: accessibilityFindings(report)
    });
}

const medians = Object.fromEntries(categories.map(category => [
    category,
    median(results.map(result => result.scores[category]))
]));
const metricMedians = Object.fromEntries(Object.keys(METRICS).map(auditId => [
    auditId,
    median(results.map(result => result.metrics[auditId]?.numericValue))
]));
const opportunities = aggregateOpportunities(results);
const aggregatedAccessibilityFindings = aggregateAccessibilityFindings(results);

const violations = [];
for (const [category, minimum] of Object.entries(profile.thresholds || {})) {
    const actual = medians[category];
    if (typeof actual === 'number' && actual < Number(minimum)) {
        violations.push({ type: 'category', category, minimum: Number(minimum), actual });
    }
}
for (const [auditId, maximum] of Object.entries(profile.metricBudgets || {})) {
    const actual = metricMedians[auditId];
    if (typeof actual === 'number' && actual > Number(maximum)) {
        violations.push({ type: 'metric', auditId, maximum: Number(maximum), actual });
    }
}

const summary = {
    schemaVersion: 3,
    profile: profileName,
    url: String(config.url),
    numberOfRuns: runs,
    aggregation: 'median',
    categories,
    medians,
    metricMedians,
    opportunities,
    accessibilityFindings: aggregatedAccessibilityFindings,
    violations,
    results
};

await writeFile(
    path.join(outputDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8'
);
await writeFile(path.join(outputDir, 'summary.md'), buildMarkdown(summary), 'utf8');

console.log(`[Lighthouse] Auditoria ${profileName} concluída com ${runs} execução(ões).`);
for (const [category, score] of Object.entries(medians)) {
    console.log(`- ${category}: ${typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : 'indisponível'}`);
}
for (const [auditId, value] of Object.entries(metricMedians)) {
    console.log(`- ${METRICS[auditId].shortLabel}: ${formatMetric(auditId, value)}`);
}
if (opportunities.length > 0) {
    console.log('[Lighthouse] Oportunidades prioritárias:');
    opportunities.forEach(item => console.log(`- ${item.title}: ${formatSavings(item)}`));
}
if (violations.length > 0) {
    violations.forEach(violation => console.error(`[Lighthouse] Violação: ${JSON.stringify(violation)}`));
    process.exitCode = 1;
}
