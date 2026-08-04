'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '../..');
const TEMPLATE_PATH = 'assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx';
const EXCELJS_PATH = 'vendor/exceljs.min.js';
const GUARD_PATH = '/src/integration/excel-export-bootstrap-guard.js';

async function sha256(filePath) {
    const bytes = await fs.readFile(filePath);
    return {
        bytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex')
    };
}

test('build público gera manifesto coerente e injeta proteção do bootstrap Excel', async t => {
    const { buildVercelArtifact } = await import('../../scripts/build-vercel.mjs');
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    const outputDir = path.join(temporaryRoot, 'dist');
    t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

    await buildVercelArtifact({
        outputDir,
        environment: {
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'false',
            RADAR_SUPABASE_URL: '',
            RADAR_SUPABASE_PUBLISHABLE_KEY: '',
            RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
        }
    });

    const manifestPath = path.join(outputDir, 'excel-sme-assets.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const template = await sha256(path.join(ROOT, TEMPLATE_PATH));
    const exceljs = await sha256(path.join(ROOT, EXCELJS_PATH));
    const publicIndex = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

    assert.equal(manifest.schemaVersion, 1);
    assert.deepEqual(manifest.template, {
        path: `/${TEMPLATE_PATH}`,
        ...template
    });
    assert.deepEqual(manifest.exceljs, {
        path: `/${EXCELJS_PATH}`,
        ...exceljs
    });
    assert.match(
        publicIndex,
        new RegExp(`<script\\s+defer\\s+src="${GUARD_PATH.replaceAll('/', '\\/')}"`)
    );
    assert.equal((publicIndex.match(/excel-export-bootstrap-guard\.js/g) || []).length, 1);

    assert.deepEqual(
        await sha256(path.join(outputDir, TEMPLATE_PATH)),
        template
    );
    assert.deepEqual(
        await sha256(path.join(outputDir, EXCELJS_PATH)),
        exceljs
    );
});

test('gerador rejeita asset obrigatório ausente', async t => {
    const { generateExcelSmeAssetsManifest } = await import(
        '../../scripts/generate-excel-sme-assets-manifest.mjs'
    );
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-excel-assets-'));
    t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

    await assert.rejects(
        generateExcelSmeAssetsManifest({ rootDir: temporaryRoot }),
        /Asset obrigatório do Excel SME ausente/
    );
});
