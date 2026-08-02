#!/usr/bin/env node

import fs from 'node:fs/promises';

const indexPath = new URL('../index.html', import.meta.url);
let html = await fs.readFile(indexPath, 'utf8');

const eagerScripts = [
    '    <script src="vendor/fuse.js"></script>\n',
    '    <script src="vendor/floating-ui.js"></script>\n'
];

for (const script of eagerScripts) {
    if (!html.includes(script)) {
        throw new Error(`Referência antecipada não encontrada: ${script.trim()}`);
    }
    html = html.replace(script, '');
}

if (/script\s+src="vendor\/(?:fuse|floating-ui)\.js"/.test(html)) {
    throw new Error('Ainda existe vendor de busca ou posicionamento carregado antecipadamente.');
}

await fs.writeFile(indexPath, html);
console.log('Vendors da Rodada 2 removidos da carga inicial do index.html.');
