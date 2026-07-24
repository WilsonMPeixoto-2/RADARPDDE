(function (root, factory) {
    const nodeZlib = typeof module === 'object' && module.exports
        ? require('node:zlib')
        : null;
    const api = factory(root, nodeZlib);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeZip = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, nodeZlib) {
    'use strict';

    const VERSION = '0.1.0';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const CRC_TABLE = buildCrcTable();

    function buildCrcTable() {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n += 1) {
            let c = n;
            for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        return table;
    }

    function crc32(bytes) {
        let crc = 0xFFFFFFFF;
        for (let index = 0; index < bytes.length; index += 1) {
            crc = CRC_TABLE[(crc ^ bytes[index]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function readU16(view, offset) { return view.getUint16(offset, true); }
    function readU32(view, offset) { return view.getUint32(offset, true); }
    function writeU16(view, offset, value) { view.setUint16(offset, value, true); }
    function writeU32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

    function concatBytes(parts) {
        const length = parts.reduce((sum, part) => sum + part.length, 0);
        const output = new Uint8Array(length);
        let offset = 0;
        parts.forEach(part => {
            output.set(part, offset);
            offset += part.length;
        });
        return output;
    }

    function asUint8Array(value) {
        if (value instanceof Uint8Array) return value;
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        throw new TypeError('Conteúdo binário inválido.');
    }

    async function inflateRaw(bytes) {
        if (nodeZlib) return new Uint8Array(nodeZlib.inflateRawSync(bytes));
        if (typeof DecompressionStream !== 'function') {
            const error = new Error('Este navegador não oferece suporte à descompactação necessária para o modelo Excel SME.');
            error.code = 'DECOMPRESSION_UNAVAILABLE';
            throw error;
        }
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    function findEndOfCentralDirectory(bytes) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const minimum = Math.max(0, bytes.length - 0xFFFF - 22);
        for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
            if (readU32(view, offset) === 0x06054B50) return offset;
        }
        throw new Error('Estrutura ZIP inválida: diretório central não localizado.');
    }

    async function readZipEntries(input) {
        const bytes = asUint8Array(input);
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const eocdOffset = findEndOfCentralDirectory(bytes);
        const entryCount = readU16(view, eocdOffset + 10);
        const centralOffset = readU32(view, eocdOffset + 16);
        const entries = [];
        let cursor = centralOffset;

        for (let index = 0; index < entryCount; index += 1) {
            if (readU32(view, cursor) !== 0x02014B50) {
                throw new Error(`Estrutura ZIP inválida no item ${index + 1}.`);
            }
            const flags = readU16(view, cursor + 8);
            const method = readU16(view, cursor + 10);
            const modTime = readU16(view, cursor + 12);
            const modDate = readU16(view, cursor + 14);
            const compressedSize = readU32(view, cursor + 20);
            const uncompressedSize = readU32(view, cursor + 24);
            const nameLength = readU16(view, cursor + 28);
            const extraLength = readU16(view, cursor + 30);
            const commentLength = readU16(view, cursor + 32);
            const externalAttributes = readU32(view, cursor + 38);
            const localOffset = readU32(view, cursor + 42);
            const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
            const name = decoder.decode(nameBytes);

            if (readU32(view, localOffset) !== 0x04034B50) {
                throw new Error(`Estrutura ZIP inválida no arquivo ${name}.`);
            }
            const localNameLength = readU16(view, localOffset + 26);
            const localExtraLength = readU16(view, localOffset + 28);
            const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
            const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
            let content;
            if (method === 0) content = new Uint8Array(compressed);
            else if (method === 8) content = await inflateRaw(compressed);
            else throw new Error(`Método de compressão não suportado (${method}) em ${name}.`);
            if (content.length !== uncompressedSize) {
                throw new Error(`Tamanho descompactado divergente em ${name}.`);
            }

            entries.push({ name, bytes: content, flags, modTime, modDate, externalAttributes });
            cursor += 46 + nameLength + extraLength + commentLength;
        }
        return entries;
    }

    function buildStoredZip(entries) {
        const localParts = [];
        const centralParts = [];
        let localOffset = 0;

        entries.forEach(entry => {
            const nameBytes = encoder.encode(entry.name);
            const content = asUint8Array(entry.bytes);
            const checksum = crc32(content);
            const modTime = entry.modTime || 0;
            const modDate = entry.modDate || 0;

            const localHeader = new Uint8Array(30 + nameBytes.length);
            const localView = new DataView(localHeader.buffer);
            writeU32(localView, 0, 0x04034B50);
            writeU16(localView, 4, 20);
            writeU16(localView, 6, 0x0800);
            writeU16(localView, 8, 0);
            writeU16(localView, 10, modTime);
            writeU16(localView, 12, modDate);
            writeU32(localView, 14, checksum);
            writeU32(localView, 18, content.length);
            writeU32(localView, 22, content.length);
            writeU16(localView, 26, nameBytes.length);
            localHeader.set(nameBytes, 30);
            localParts.push(localHeader, content);

            const centralHeader = new Uint8Array(46 + nameBytes.length);
            const centralView = new DataView(centralHeader.buffer);
            writeU32(centralView, 0, 0x02014B50);
            writeU16(centralView, 4, 20);
            writeU16(centralView, 6, 20);
            writeU16(centralView, 8, 0x0800);
            writeU16(centralView, 10, 0);
            writeU16(centralView, 12, modTime);
            writeU16(centralView, 14, modDate);
            writeU32(centralView, 16, checksum);
            writeU32(centralView, 20, content.length);
            writeU32(centralView, 24, content.length);
            writeU16(centralView, 28, nameBytes.length);
            writeU32(centralView, 38, entry.externalAttributes || 0);
            writeU32(centralView, 42, localOffset);
            centralHeader.set(nameBytes, 46);
            centralParts.push(centralHeader);

            localOffset += localHeader.length + content.length;
        });

        const centralDirectory = concatBytes(centralParts);
        const end = new Uint8Array(22);
        const endView = new DataView(end.buffer);
        writeU32(endView, 0, 0x06054B50);
        writeU16(endView, 8, entries.length);
        writeU16(endView, 10, entries.length);
        writeU32(endView, 12, centralDirectory.length);
        writeU32(endView, 16, localOffset);
        return concatBytes([...localParts, centralDirectory, end]);
    }

    async function decodeBase64Text(text) {
        const compact = String(text || '').replace(/\s+/g, '');
        if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(compact, 'base64'));
        const binary = root.atob(compact);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes;
    }

    async function sha256Hex(bytes) {
        if (nodeZlib && typeof require === 'function') {
            return require('node:crypto').createHash('sha256').update(bytes).digest('hex');
        }
        if (!root?.crypto?.subtle) return '';
        const digest = await root.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    return Object.freeze({
        VERSION,
        asUint8Array,
        buildStoredZip,
        concatBytes,
        crc32,
        decodeBase64Text,
        readZipEntries,
        sha256Hex
    });
}));
