'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..', '..');

function extractFunction(source, name) {
    const start = source.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `Função ${name} não encontrada em app.js`);
    let depth = 0;
    let opened = false;
    for (let i = start; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === '{') {
            depth += 1;
            opened = true;
        } else if (ch === '}') {
            depth -= 1;
            if (opened && depth === 0) return source.slice(start, i + 1);
        }
    }
    throw new Error(`Fechamento da função ${name} não localizado.`);
}

test('Onda 1: data civil local em contatos prioriza Temporal.PlainDate e faz fallback sem drift UTC', () => {
    const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const helperSource = extractFunction(appSource, 'getTodayLocalIsoDate');
    const openModalSource = extractFunction(appSource, 'openContatoModal');

    assert.match(openModalSource, /getTodayLocalIsoDate\(\)/);
    assert.doesNotMatch(openModalSource, /toISOString\(\)/);

    const temporalContext = vm.createContext({
        window: {
            Temporal: {
                Now: {
                    plainDateISO: () => ({ toString: () => '2026-11-22' })
                }
            }
        }
    });
    vm.runInContext(helperSource, temporalContext);
    assert.equal(temporalContext.getTodayLocalIsoDate(), '2026-11-22');

    // Simula 23:30 local em 22/11 (que já seria 23/11 em UTC-3 via toISOString)
    class FakeLateNightDate {
        getFullYear() { return 2026; }
        getMonth() { return 10; }
        getDate() { return 22; }
        toISOString() { return '2026-11-23T02:30:00.000Z'; }
    }
    const fallbackContext = vm.createContext({
        window: {},
        Date: FakeLateNightDate
    });
    vm.runInContext(helperSource, fallbackContext);
    assert.equal(fallbackContext.getTodayLocalIsoDate(), '2026-11-22');
});

test('Onda 1: getSchoolDisplayName cobre denominação, denominaçao, denominacao e fallback para id', () => {
    const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const helperSource = extractFunction(appSource, 'getSchoolDisplayName');
    const ctx = vm.createContext({});
    vm.runInContext(helperSource, ctx);

    assert.equal(ctx.getSchoolDisplayName({ denominação: 'E.M. Alpha', id: '04.10.001' }), 'E.M. Alpha');
    assert.equal(ctx.getSchoolDisplayName({ denominaçao: 'E.M. Legada', id: '04.10.002' }), 'E.M. Legada');
    assert.equal(ctx.getSchoolDisplayName({ denominacao: 'E.M. Sem Acento', id: '04.10.003' }), 'E.M. Sem Acento');
    assert.equal(ctx.getSchoolDisplayName({ id: '04.10.004' }, '04.10.004'), '04.10.004');
    assert.equal(ctx.getSchoolDisplayName(null, '04.10.005'), '04.10.005');
});

test('Onda 3: compactação do painel provisório vazio vive em quality-provisional.css sem regras deslocadas', () => {
    const qualityCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'quality-provisional.css'), 'utf8');
    const unidentifiedCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'unidentified-expense-ux.css'), 'utf8');
    const qualityJs = fs.readFileSync(path.join(ROOT, 'src', 'integration', 'quality-provisional-ux.js'), 'utf8');

    assert.match(qualityCss, /\.quality-provisional-panel\.is-empty\s*\{/);
    assert.match(qualityCss, /\.quality-provisional-panel\.is-empty\s+\.quality-provisional-heading\s*\{/);
    assert.match(qualityCss, /\.quality-provisional-panel\.is-empty\s+\.quality-provisional-mark\s*\{/);
    assert.match(qualityCss, /\.quality-provisional-feedback:empty\s*\{\s*display:\s*none;\s*\}/);
    assert.doesNotMatch(unidentifiedCss, /quality-provisional-panel/);
    assert.match(qualityJs, /panel\.classList\.toggle\('is-empty',\s*!records\.length\)/);
    assert.match(qualityJs, /Nenhuma saída provisória registrada nesta competência\./);
});

test('T4 D021: runbook de publicação não mantém resquício de Corrigir marca no passo de smoke', () => {
    const runbook = fs.readFileSync(
        path.join(ROOT, 'docs', 'runbooks', 'PRONTUARIO_RELEASE_2_T4_PUBLICACAO.md'),
        'utf8'
    );
    assert.doesNotMatch(runbook, /Corrigir marca/);
    assert.match(runbook, /encontrar \*\*Corrigir consolidação\*\*/);
});
