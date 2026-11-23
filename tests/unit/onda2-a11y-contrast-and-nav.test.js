'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..', '..');

function relativeLuminance(hex) {
    const channels = hex.replace('#', '').match(/../g).map(pair => {
        const value = Number.parseInt(pair, 16) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(fgHex, bgHex) {
    const l1 = relativeLuminance(fgHex);
    const l2 = relativeLuminance(bgHex);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function extractCssBlock(css, selector) {
    const start = css.indexOf(selector);
    assert.notEqual(start, -1, `Seletor não encontrado em styles.css: ${selector}`);
    const open = css.indexOf('{', start);
    const close = css.indexOf('}', open);
    return css.slice(open + 1, close);
}

function extractVar(block, name) {
    const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
    assert.ok(match, `Token ${name} não encontrado como cor hexadecimal.`);
    return match[1];
}

test('Onda 2: navegação lateral principal usa button semântico com ícones decorativos ocultos', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const navIds = [
        'nav-dashboard',
        'nav-escolas',
        'nav-competencias',
        'nav-pendencias',
        'nav-equipe',
        'nav-inventario',
        'nav-auditoria',
        'nav-sme-config'
    ];
    for (const id of navIds) {
        const buttonPattern = new RegExp(
            `<button\\s+type="button"\\s+class="nav-item(?:\\s+active)?"\\s+id="${id}"[^>]*>\\s*<svg\\s+aria-hidden="true"`
        );
        assert.match(html, buttonPattern, `Item ${id} deve ser <button type="button"> com <svg aria-hidden="true">.`);
    }
});

test('Onda 2: reset de button.nav-item usa :where() para não sobrescrever tipografia nem bordas de .nav-item', () => {
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    assert.match(css, /:where\(button\.nav-item\)\s*\{/);
    assert.doesNotMatch(css, /(?:^|\n)\s*button\.nav-item\s*\{/, 'button.nav-item sem :where() sobrescreve .nav-item em folhas posteriores.');
});

test('Onda 2: tokens de status atendem contraste WCAG AA (>= 4.5:1) nos temas claro e escuro', () => {
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    const lightBlock = extractCssBlock(css, ':root');
    const darkBlock = extractCssBlock(css, 'body.dark-theme');

    for (const token of ['--success', '--warning', '--danger', '--info']) {
        const lightColor = extractVar(lightBlock, token);
        const darkColor = extractVar(darkBlock, token);
        assert.ok(
            contrastRatio(lightColor, '#f8f7fc') >= 4.5,
            `Tema claro ${token} (${lightColor}) deve atingir contraste >= 4.5:1 sobre #f8f7fc.`
        );
        assert.ok(
            contrastRatio(darkColor, '#161126') >= 4.5,
            `Tema escuro ${token} (${darkColor}) deve atingir contraste >= 4.5:1 sobre #161126.`
        );
    }
});

test('Onda 2: diálogo de exclusão evita jargão causal e filtra transição nula Não analisado → Não analisado', () => {
    const source = fs.readFileSync(
        path.join(ROOT, 'src', 'integration', 'operational-correction-dialog.js'),
        'utf8'
    );
    assert.match(source, /'Exclusão de lançamento'/);
    assert.doesNotMatch(source, /Exclusão com alcance causal/);
    assert.match(source, /text\(change\.before\)\s*===\s*'Não analisado'\s*&&\s*text\(change\.after\)\s*===\s*'Não analisado'/);
});
