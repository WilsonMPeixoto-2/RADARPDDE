'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('drawer de Pendência ocupa a largura útil no mobile', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../styles.css'), 'utf8');
    const media = source.match(/@media\s*\(max-width:\s*720px\)[\s\S]*?\n}/g) || [];
    const responsiveDrawer = media.find(block => /\.pendency-preview-drawer\s*\{/.test(block));

    assert.ok(responsiveDrawer, 'deve existir override responsivo do drawer até 720px');
    assert.match(responsiveDrawer, /width:\s*100%/);
    assert.match(responsiveDrawer, /max-width:\s*100%/);
    assert.match(responsiveDrawer, /#pendency-preview-content[\s\S]*padding:/);
});
