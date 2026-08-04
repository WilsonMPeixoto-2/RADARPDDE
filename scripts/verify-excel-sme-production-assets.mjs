#!/usr/bin/env node

import crypto from 'node:crypto';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { verifyExcelSmeTemplateBuffer } from './verify-excel-sme-template.mjs';

const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const BOOTSTRAP_GUARD_PATH = '/src/integration/excel-export-bootstrap-guard.js';

function createVerificationError(code, message, details = null, cause = null) {
    const error = new Error(message);
    error.code = code;
    if (details) error.details = details;
    if (cause) error.cause = cause;
    return error;
}

function validateDescriptor(value, expectedPath, name) {
    const descriptor = value && typeof value === 'object' ? value : null;
    const assetPath = String(descriptor?.path || '').trim();
    const sha256 = String(descriptor?.sha256 || '').trim().toLowerCase();
    const bytes = Number(descriptor?.bytes);
    if (assetPath !== expectedPath
        || !SHA256_PATTERN.test(sha256)
        || !Number.isSafeInteger(bytes)
        || bytes <= 0) {
        throw createVerificationError(
            'SME_PRODUCTION_MANIFEST_INVALID',
            `Descritor inválido no manifesto de produção: ${name}.`,
            { name, expectedPath }
        );
    }
    return Object.freeze({ path: assetPath, sha256, bytes });
}

function validateAssetsManifest(value) {
    if (!value || value.schemaVersion !== 1) {
        throw createVerificationError(
            'SME_PRODUCTION_MANIFEST_INVALID',
            'Versão inválida do manifesto de assets do Excel SME.'
        );
    }
    return Object.freeze({
        schemaVersion: 1,
        template: validateDescriptor(
            value.template,
            '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx',
            'template'
        ),
        exceljs: validateDescriptor(value.exceljs, '/vendor/exceljs.min.js', 'ExcelJS')
    });
}

function assetUrl(baseUrl, descriptor) {
    const url = new URL(descriptor.path, baseUrl);
    url.searchParams.set('v', descriptor.sha256.slice(0, 16));
    url.searchParams.set('smoke', String(Date.now()));
    return url.toString();
}

function noCacheOptions() {
    return {
        redirect: 'follow',
        headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
    };
}

async function fetchJson(url, fetchImpl) {
    const response = await fetchImpl(url, noCacheOptions());
    if (!response.ok) {
        throw createVerificationError(
            'SME_PRODUCTION_HTTP_FAILED',
            `${url}: HTTP ${response.status} ${response.statusText || ''}.`.trim(),
            { url, status: response.status }
        );
    }
    try {
        return await response.json();
    } catch (error) {
        throw createVerificationError(
            'SME_PRODUCTION_JSON_INVALID',
            `${url}: resposta JSON inválida.`,
            { url },
            error
        );
    }
}

async function fetchTextResource(url, fetchImpl, options = {}) {
    const response = await fetchImpl(url, noCacheOptions());
    if (!response.ok) {
        throw createVerificationError(
            'SME_PRODUCTION_HTTP_FAILED',
            `${url}: HTTP ${response.status} ${response.statusText || ''}.`.trim(),
            { url, status: response.status }
        );
    }
    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    if (options.rejectHtml === true && contentType.includes('text/html')) {
        throw createVerificationError(
            'SME_PRODUCTION_ASSET_INVALID',
            `${url}: resposta HTML recebida no lugar do asset.`,
            { url, contentType }
        );
    }
    const text = await response.text();
    if (!text.trim()) {
        throw createVerificationError(
            'SME_PRODUCTION_ASSET_INVALID',
            `${url}: recurso publicado está vazio.`,
            { url, contentType }
        );
    }
    return Object.freeze({
        text,
        bytes: Buffer.byteLength(text, 'utf8'),
        contentType,
        sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex')
    });
}

async function fetchAsset(url, descriptor, fetchImpl) {
    const response = await fetchImpl(url, noCacheOptions());
    if (!response.ok) {
        throw createVerificationError(
            'SME_PRODUCTION_HTTP_FAILED',
            `${url}: HTTP ${response.status} ${response.statusText || ''}.`.trim(),
            { url, status: response.status }
        );
    }
    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
        throw createVerificationError(
            'SME_PRODUCTION_ASSET_INVALID',
            `${url}: resposta HTML recebida no lugar do asset.`,
            { url, contentType }
        );
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    if (buffer.length !== descriptor.bytes || sha256 !== descriptor.sha256) {
        throw createVerificationError(
            'SME_PRODUCTION_ASSET_MISMATCH',
            `${url}: conteúdo publicado diverge do manifesto.`,
            {
                url,
                expectedBytes: descriptor.bytes,
                actualBytes: buffer.length,
                expectedSha256: descriptor.sha256,
                actualSha256: sha256
            }
        );
    }
    return Object.freeze({ buffer, contentType, sha256, bytes: buffer.length });
}

async function verifyExcelSmeProductionAssets({
    baseUrl,
    expectedCommitSha,
    fetchImpl = fetch
}) {
    const normalizedBaseUrl = new URL('/', baseUrl).toString();
    const expectedSha = String(expectedCommitSha || '').trim().toLowerCase();
    if (!/^[0-9a-f]{7,40}$/u.test(expectedSha)) {
        throw new Error('expectedCommitSha deve conter um SHA Git válido.');
    }

    const buildManifestUrl = new URL('/radar-build-manifest.json', normalizedBaseUrl);
    buildManifestUrl.searchParams.set('smoke', String(Date.now()));
    const buildManifest = await fetchJson(buildManifestUrl.toString(), fetchImpl);
    const deployedCommitSha = String(buildManifest?.commitSha || '').trim().toLowerCase();
    if (deployedCommitSha !== expectedSha) {
        throw createVerificationError(
            'SME_PRODUCTION_COMMIT_MISMATCH',
            `Deployment está no commit ${deployedCommitSha || '(ausente)'}, esperado ${expectedSha}.`,
            { deployedCommitSha, expectedCommitSha: expectedSha }
        );
    }

    const assetsManifestUrl = new URL('/excel-sme-assets.json', normalizedBaseUrl);
    assetsManifestUrl.searchParams.set('smoke', String(Date.now()));
    const assetsManifest = validateAssetsManifest(
        await fetchJson(assetsManifestUrl.toString(), fetchImpl)
    );

    const template = await fetchAsset(
        assetUrl(normalizedBaseUrl, assetsManifest.template),
        assetsManifest.template,
        fetchImpl
    );
    const exceljs = await fetchAsset(
        assetUrl(normalizedBaseUrl, assetsManifest.exceljs),
        assetsManifest.exceljs,
        fetchImpl
    );
    const indexUrl = new URL('/', normalizedBaseUrl);
    indexUrl.searchParams.set('smoke', String(Date.now()));
    const index = await fetchTextResource(indexUrl.toString(), fetchImpl);
    if (!index.text.includes(BOOTSTRAP_GUARD_PATH)) {
        throw createVerificationError(
            'SME_PRODUCTION_BOOTSTRAP_GUARD_MISSING',
            'O index publicado não referencia o guard do bootstrap Excel.',
            { path: BOOTSTRAP_GUARD_PATH }
        );
    }
    const guardUrl = new URL(BOOTSTRAP_GUARD_PATH, normalizedBaseUrl);
    guardUrl.searchParams.set('smoke', String(Date.now()));
    const guard = await fetchTextResource(guardUrl.toString(), fetchImpl, { rejectHtml: true });
    if (!guard.text.includes('RadarExcelExportBootstrapGuard')) {
        throw createVerificationError(
            'SME_PRODUCTION_BOOTSTRAP_GUARD_INVALID',
            'O guard do bootstrap Excel publicado não contém o contrato esperado.',
            { path: BOOTSTRAP_GUARD_PATH }
        );
    }

    const ooxml = verifyExcelSmeTemplateBuffer(template.buffer, {
        source: `${normalizedBaseUrl}${assetsManifest.template.path}`
    });

    return Object.freeze({
        commitSha: deployedCommitSha,
        template: Object.freeze({
            bytes: template.bytes,
            sha256: template.sha256,
            contentType: template.contentType,
            entryCount: ooxml.entryCount,
            worksheetCount: ooxml.worksheetCount
        }),
        exceljs: Object.freeze({
            bytes: exceljs.bytes,
            sha256: exceljs.sha256,
            contentType: exceljs.contentType
        }),
        bootstrapGuard: Object.freeze({
            path: BOOTSTRAP_GUARD_PATH,
            bytes: guard.bytes,
            sha256: guard.sha256,
            contentType: guard.contentType,
            referencedByIndex: true
        })
    });
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function verifyWithRetries(options) {
    let lastError = null;
    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
        try {
            return await verifyExcelSmeProductionAssets(options);
        } catch (error) {
            lastError = error;
            if (attempt >= options.attempts) break;
            console.log(`Tentativa ${attempt}/${options.attempts}: ${error.message}`);
            await delay(options.intervalMs);
        }
    }
    throw lastError;
}

function positiveInteger(value, name) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} deve ser um inteiro positivo.`);
    }
    return parsed;
}

function parseArguments(argv) {
    const options = {
        baseUrl: '',
        expectedCommitSha: '',
        attempts: 1,
        intervalMs: 10_000
    };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        const next = argv[index + 1];
        if (argument === '--base-url') {
            if (!next) throw new Error('--base-url exige uma URL.');
            options.baseUrl = next;
            index += 1;
        } else if (argument === '--expected-commit') {
            if (!next) throw new Error('--expected-commit exige um SHA.');
            options.expectedCommitSha = next;
            index += 1;
        } else if (argument === '--attempts') {
            if (!next) throw new Error('--attempts exige um valor.');
            options.attempts = positiveInteger(next, '--attempts');
            index += 1;
        } else if (argument === '--interval-ms') {
            if (!next) throw new Error('--interval-ms exige um valor.');
            options.intervalMs = positiveInteger(next, '--interval-ms');
            index += 1;
        } else {
            throw new Error(`Argumento desconhecido: ${argument}`);
        }
    }
    if (!options.baseUrl || !options.expectedCommitSha) {
        throw new Error('Informe --base-url e --expected-commit.');
    }
    return options;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const result = await verifyWithRetries(options);
    console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha no smoke de produção do Excel SME: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    BOOTSTRAP_GUARD_PATH,
    assetUrl,
    fetchAsset,
    fetchTextResource,
    validateAssetsManifest,
    verifyExcelSmeProductionAssets,
    verifyWithRetries
};
