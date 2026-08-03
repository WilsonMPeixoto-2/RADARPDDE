#!/usr/bin/env node

import fs from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE = 22;
const ZIP_MAX_COMMENT_SIZE = 0xffff;
const REQUIRED_XLSX_ENTRIES = Object.freeze([
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels'
]);

function assertBuffer(buffer, source) {
    if (!Buffer.isBuffer(buffer)) {
        throw new TypeError(`${source}: o conteúdo do template deve ser um Buffer.`);
    }
    if (buffer.length < ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE) {
        throw new Error(`${source}: arquivo pequeno demais para ser um XLSX válido.`);
    }
    if (buffer.readUInt32LE(0) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
        throw new Error(`${source}: assinatura ZIP PK\\x03\\x04 ausente.`);
    }
}

function findEndOfCentralDirectoryOffset(buffer, source = 'template Excel SME') {
    const minimumOffset = Math.max(
        0,
        buffer.length - ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE - ZIP_MAX_COMMENT_SIZE
    );

    for (
        let offset = buffer.length - ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE;
        offset >= minimumOffset;
        offset -= 1
    ) {
        if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
            return offset;
        }
    }

    throw new Error(`${source}: diretório central ZIP não encontrado.`);
}

function readZipEntryNames(buffer, source = 'template Excel SME') {
    assertBuffer(buffer, source);

    const endOffset = findEndOfCentralDirectoryOffset(buffer, source);
    const diskNumber = buffer.readUInt16LE(endOffset + 4);
    const centralDirectoryDisk = buffer.readUInt16LE(endOffset + 6);
    const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
    const totalEntries = buffer.readUInt16LE(endOffset + 10);
    const centralDirectorySize = buffer.readUInt32LE(endOffset + 12);
    const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);

    if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== totalEntries) {
        throw new Error(`${source}: arquivos ZIP multidisco não são aceitos.`);
    }
    if (totalEntries === 0) {
        throw new Error(`${source}: o pacote XLSX não contém entradas.`);
    }
    if (centralDirectoryOffset + centralDirectorySize > endOffset) {
        throw new Error(`${source}: diretório central ZIP fora dos limites do arquivo.`);
    }

    const names = new Set();
    let cursor = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
        if (cursor + 46 > buffer.length) {
            throw new Error(`${source}: cabeçalho central ZIP truncado.`);
        }
        if (buffer.readUInt32LE(cursor) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
            throw new Error(`${source}: assinatura de entrada do diretório central inválida.`);
        }

        const fileNameLength = buffer.readUInt16LE(cursor + 28);
        const extraFieldLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const nameStart = cursor + 46;
        const nameEnd = nameStart + fileNameLength;
        const nextCursor = nameEnd + extraFieldLength + commentLength;

        if (nextCursor > buffer.length) {
            throw new Error(`${source}: entrada ZIP truncada.`);
        }

        names.add(buffer.toString('utf8', nameStart, nameEnd));
        cursor = nextCursor;
    }

    return names;
}

function verifyExcelSmeTemplateBuffer(buffer, { source = 'template Excel SME' } = {}) {
    const entries = readZipEntryNames(buffer, source);

    for (const requiredEntry of REQUIRED_XLSX_ENTRIES) {
        if (!entries.has(requiredEntry)) {
            throw new Error(`${source}: entrada OOXML obrigatória ausente: ${requiredEntry}.`);
        }
    }

    const worksheetEntries = [...entries].filter(entry => (
        /^xl\/worksheets\/sheet\d+\.xml$/u.test(entry)
    ));
    if (worksheetEntries.length === 0) {
        throw new Error(`${source}: nenhuma planilha OOXML foi encontrada.`);
    }

    return Object.freeze({
        source,
        byteLength: buffer.length,
        entryCount: entries.size,
        worksheetCount: worksheetEntries.length,
        signature: 'PK\\x03\\x04'
    });
}

async function verifyExcelSmeTemplateFile(filePath) {
    const buffer = await fs.readFile(filePath);
    return verifyExcelSmeTemplateBuffer(buffer, { source: filePath });
}

async function fetchExcelSmeTemplate(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'cache-control': 'no-cache',
            pragma: 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status} ${response.statusText}.`);
    }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
        throw new Error(`${url}: resposta HTML recebida no lugar do XLSX.`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const verification = verifyExcelSmeTemplateBuffer(buffer, { source: url });

    return Object.freeze({
        ...verification,
        status: response.status,
        contentType,
        contentLength: response.headers.get('content-length') || '',
        etag: response.headers.get('etag') || ''
    });
}

function parsePositiveInteger(value, optionName) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${optionName} deve ser um inteiro positivo.`);
    }
    return parsed;
}

function parseArguments(argv) {
    const options = {
        file: '',
        url: '',
        manifestUrl: '',
        expectedCommitSha: '',
        attempts: 1,
        intervalMs: 10_000
    };

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        const next = argv[index + 1];

        if (argument === '--file') {
            if (!next) throw new Error('--file exige um caminho.');
            options.file = next;
            index += 1;
        } else if (argument === '--url') {
            if (!next) throw new Error('--url exige uma URL.');
            options.url = next;
            index += 1;
        } else if (argument === '--manifest-url') {
            if (!next) throw new Error('--manifest-url exige uma URL.');
            options.manifestUrl = next;
            index += 1;
        } else if (argument === '--expected-commit') {
            if (!next) throw new Error('--expected-commit exige um SHA.');
            options.expectedCommitSha = String(next).trim().toLowerCase();
            index += 1;
        } else if (argument === '--attempts') {
            if (!next) throw new Error('--attempts exige um valor.');
            options.attempts = parsePositiveInteger(next, '--attempts');
            index += 1;
        } else if (argument === '--interval-ms') {
            if (!next) throw new Error('--interval-ms exige um valor.');
            options.intervalMs = parsePositiveInteger(next, '--interval-ms');
            index += 1;
        } else {
            throw new Error(`Argumento desconhecido: ${argument}`);
        }
    }

    if (Boolean(options.file) === Boolean(options.url)) {
        throw new Error('Informe exatamente uma origem: --file ou --url.');
    }
    if (options.expectedCommitSha && !/^[0-9a-f]{7,40}$/u.test(options.expectedCommitSha)) {
        throw new Error('--expected-commit deve conter um SHA Git válido.');
    }
    if (options.manifestUrl && !options.expectedCommitSha) {
        throw new Error('--manifest-url exige --expected-commit.');
    }

    return options;
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchManifestCommitSha(manifestUrl) {
    const separator = manifestUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${manifestUrl}${separator}t=${Date.now()}`, {
        redirect: 'follow',
        headers: {
            'cache-control': 'no-cache',
            pragma: 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(`${manifestUrl}: HTTP ${response.status} ${response.statusText}.`);
    }

    const manifest = await response.json();
    return String(manifest?.commitSha || '').trim().toLowerCase();
}

async function verifyRemoteWithRetries(options) {
    let lastError = null;

    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
        try {
            if (options.manifestUrl) {
                const deployedCommitSha = await fetchManifestCommitSha(options.manifestUrl);
                if (deployedCommitSha !== options.expectedCommitSha) {
                    throw new Error(
                        `deployment ainda está no commit ${deployedCommitSha || '(ausente)'}, `
                        + `esperado ${options.expectedCommitSha}.`
                    );
                }
            }

            return await fetchExcelSmeTemplate(options.url);
        } catch (error) {
            lastError = error;
            if (attempt >= options.attempts) break;
            console.log(
                `Tentativa ${attempt}/${options.attempts} ainda não concluiu: ${error.message}`
            );
            await delay(options.intervalMs);
        }
    }

    throw lastError;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const result = options.file
        ? await verifyExcelSmeTemplateFile(options.file)
        : await verifyRemoteWithRetries(options);

    console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(`Falha na verificação do template Excel SME: ${error.message}`);
        process.exitCode = 1;
    });
}

export {
    REQUIRED_XLSX_ENTRIES,
    XLSX_CONTENT_TYPE,
    fetchExcelSmeTemplate,
    findEndOfCentralDirectoryOffset,
    readZipEntryNames,
    verifyExcelSmeTemplateBuffer,
    verifyExcelSmeTemplateFile
};
