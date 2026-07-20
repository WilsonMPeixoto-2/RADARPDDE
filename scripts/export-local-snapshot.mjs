#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const DEFAULT_URL = 'http://127.0.0.1:4175';
const SANITIZED_ENTITIES = ['userProfiles', 'userSchoolScopes', 'auditEvents', 'dataImportRuns'];

function sanitizeLocalSnapshot(snapshot) {
    const sanitized = structuredClone(snapshot);
    sanitized.entities = { ...(sanitized.entities || {}) };
    SANITIZED_ENTITIES.forEach(entity => {
        sanitized.entities[entity] = [];
    });
    return sanitized;
}

function outputPath(environment = process.env) {
    const value = String(environment.RADAR_SNAPSHOT_FILE || '').trim();
    if (!value) throw new Error('RADAR_SNAPSHOT_FILE é obrigatória.');
    return path.resolve(value);
}

async function exportFromCleanApplication({ baseUrl = DEFAULT_URL, importId, exportedAt } = {}) {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.RadarDataContext?.ready === true);
        const snapshot = await page.evaluate(({ importId: currentImportId, exportedAt: currentExportedAt }) => {
            const repository = new window.RadarLocalStorageRepository.LocalStorageRepository({
                storage: window.localStorage,
                schemaVersion: '1'
            });
            return repository.exportSnapshot({
                includeEmpty: true,
                importId: currentImportId,
                exportedAt: currentExportedAt
            });
        }, { importId, exportedAt });
        return sanitizeLocalSnapshot(snapshot);
    } finally {
        await browser.close();
    }
}

function writeSnapshot(snapshot, destination) {
    fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    fs.writeFileSync(destination, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
}

async function main(environment = process.env) {
    const destination = outputPath(environment);
    const snapshot = await exportFromCleanApplication({
        baseUrl: environment.RADAR_LOCAL_SNAPSHOT_URL || DEFAULT_URL,
        importId: environment.RADAR_SNAPSHOT_IMPORT_ID,
        exportedAt: environment.RADAR_SNAPSHOT_EXPORTED_AT
    });
    writeSnapshot(snapshot, destination);
    process.stdout.write(`${JSON.stringify({ ok: true, destination: path.basename(destination) })}\n`);
}

if (import.meta.main) {
    main().catch(error => {
        process.stderr.write(`${JSON.stringify({ ok: false, code: 'LOCAL_SNAPSHOT_EXPORT_FAILED', message: error?.message || 'Falha ao exportar snapshot local.' })}\n`);
        process.exitCode = 1;
    });
}

export { SANITIZED_ENTITIES, sanitizeLocalSnapshot, outputPath, exportFromCleanApplication, writeSnapshot, main };
