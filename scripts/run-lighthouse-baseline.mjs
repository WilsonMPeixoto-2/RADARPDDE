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

const outputDir = path.join(ROOT, 'artifacts', 'lighthouse', profileName);
const lighthouseBinary = path.join(
    ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse'
);
const categories = Array.isArray(config.categories) ? config.categories : [];
const runs = Number.isInteger(config.numberOfRuns) && config.numberOfRuns > 0
    ? config.numberOfRuns
    : 1;

await mkdir(outputDir, { recursive: true });

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

function categoryScores(report) {
    return Object.fromEntries(categories.map(category => {
        const score = report.categories?.[category]?.score;
        return [category, typeof score === 'number' ? score : null];
    }));
}

const results = [];
for (let run = 1; run <= runs; run += 1) {
    const baseName = `lighthouse-${profileName}-${String(run).padStart(2, '0')}`;
    const outputPath = path.join(outputDir, baseName);
    const args = [
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

    await runCommand(lighthouseBinary, args);
    const reportPath = await findJsonReport(baseName);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    results.push({
        run,
        finalUrl: report.finalDisplayedUrl || report.finalUrl || String(config.url),
        fetchTime: report.fetchTime || null,
        scores: categoryScores(report)
    });
}

const averages = Object.fromEntries(categories.map(category => {
    const values = results
        .map(result => result.scores[category])
        .filter(value => typeof value === 'number');
    const average = values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
    return [category, average];
}));

const warnings = [];
for (const [category, minimum] of Object.entries(config.thresholds || {})) {
    const actual = averages[category];
    if (typeof actual === 'number' && actual < Number(minimum)) {
        warnings.push({ category, minimum: Number(minimum), actual });
        console.warn(
            `[Lighthouse] ${category}: média ${(actual * 100).toFixed(0)} abaixo do baseline informativo ${(Number(minimum) * 100).toFixed(0)}.`
        );
    }
}

const summary = {
    schemaVersion: 1,
    profile: profileName,
    url: String(config.url),
    numberOfRuns: runs,
    categories,
    averages,
    warnings,
    results
};

await writeFile(
    path.join(outputDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8'
);

console.log(`[Lighthouse] Baseline ${profileName} concluído com ${runs} execução(ões).`);
for (const [category, score] of Object.entries(averages)) {
    console.log(`- ${category}: ${typeof score === 'number' ? `${(score * 100).toFixed(0)}%` : 'indisponível'}`);
}
