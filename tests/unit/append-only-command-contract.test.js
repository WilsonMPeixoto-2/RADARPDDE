'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const SOURCE_ROOTS = ['src/application', 'src/integration'];

function jsFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) return jsFiles(full);
        return entry.isFile() && entry.name.endsWith('.js') ? [full] : [];
    });
}

function matchingBrace(source, openIndex) {
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let index = openIndex; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];

        if (lineComment) {
            if (char === '\n') lineComment = false;
            continue;
        }
        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                index += 1;
            }
            continue;
        }
        if (quote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === quote) quote = null;
            continue;
        }
        if (char === '/' && next === '/') {
            lineComment = true;
            index += 1;
            continue;
        }
        if (char === '/' && next === '*') {
            blockComment = true;
            index += 1;
            continue;
        }
        if (char === '\'' || char === '"' || char === '`') {
            quote = char;
            continue;
        }
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    return -1;
}

function executeBlocks(source) {
    const blocks = [];
    const needle = '.dataService.execute({';
    let cursor = 0;
    while (cursor < source.length) {
        const found = source.indexOf(needle, cursor);
        if (found < 0) break;
        const open = source.indexOf('{', found);
        const close = matchingBrace(source, open);
        assert.notEqual(close, -1, 'objeto dataService.execute sem fechamento correspondente');
        blocks.push(source.slice(found, close + 1));
        cursor = close + 1;
    }
    return blocks;
}

test('todo comando remoto que altera histórico administrativo declara persistência especializada', () => {
    const offenders = [];

    SOURCE_ROOTS.flatMap(relative => jsFiles(path.join(root, relative))).forEach(file => {
        const source = fs.readFileSync(file, 'utf8');
        executeBlocks(source).forEach(block => {
            if (!/changedEntities\s*:[\s\S]*?administrativeLogs/.test(block)) return;
            if (/persist\s*:/.test(block)) return;
            const name = block.match(/name\s*:\s*([^,\n]+)/)?.[1]?.trim() || 'comando sem nome';
            offenders.push(`${path.relative(root, file)} :: ${name}`);
        });
    });

    assert.deepEqual(
        offenders,
        [],
        `Comandos com administrativeLogs sem persistência remota especializada:\n${offenders.join('\n')}`
    );
});
