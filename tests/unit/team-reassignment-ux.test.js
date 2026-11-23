'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const interactions = fs.readFileSync(path.join(root, 'src/integration/shared-interactions.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src/styles/shared-interactions.css'), 'utf8');

function functionSource(source, name) {
    const start = source.indexOf('function ' + name + '(');
    assert.notEqual(start, -1, name + ' não encontrada');
    let depth = 0;
    let inBody = false;
    for (let i = source.indexOf(') {', start) + 2; i < source.length; i += 1) {
        if (source[i] === '{') { depth += 1; inBody = true; }
        if (source[i] === '}') { depth -= 1; if (inBody && depth === 0) return source.slice(start, i + 1); }
    }
    throw new Error('Corpo de ' + name + ' não encontrado');
}

test('o diálogo de reatribuição reutiliza a infraestrutura compartilhada em vez de criar modal paralelo no app', () => {
    const api = require('../../src/integration/shared-interactions.js');
    assert.equal(typeof api.requestTeamReassignmentConfirm, 'function');
    assert.match(interactions, /modal-overlay radar-shared-dialog/);
    assert.match(interactions, /modal-content radar-team-reassignment-dialog/);
    assert.match(interactions, /radar-critical-dialog__footer/);
    assert.match(interactions, /openDialog\(dialog,/);
    assert.match(interactions, /closeDialog\(dialog\)/);
    assert.match(styles, /\.radar-team-reassignment-list/);
    assert.doesNotMatch(app, /function requestTeamReassignmentConfirm\(/);
    assert.doesNotMatch(interactions, /window\.confirm|modal-overlay active|className = 'modal'/);
});

test('a reatribuição individual identifica a escola e ambos os controladores sem referência indefinida', () => {
    const source = functionSource(app, 'reatribuirEscolaDirect');
    assert.match(source, /escolaNome/);
    assert.doesNotMatch(source, /\bescolaName\b/);
    assert.match(source, /RadarSharedInteractions\.requestTeamReassignmentConfirm/);
    assert.match(source, /renderEquipe\(\)/);
});

test('a reatribuição em lote mostra todas as escolas e o controlador escolhido sem referência indefinida', () => {
    const source = functionSource(app, 'aplicarAtribuicaoEmLote');
    assert.match(source, /targetEscolasIds\.map/);
    assert.match(source, /ctrlNome/);
    assert.doesNotMatch(source, /\bctrlName\b/);
    assert.match(source, /RadarSharedInteractions\.requestTeamReassignmentConfirm/);
    assert.match(source, /bulkAssignController/);
});

test('Escape disparado no document (foco fora do diálogo) resolve a confirmação sem deadlock', () => {
    assert.match(interactions, /ensureDocumentEscapeListener/);
    assert.match(interactions, /documentRef\.addEventListener\('keydown'/);
    assert.match(interactions, /if \(activeTeamReassignment\) \{[\s\S]*?finishTeamReassignment\(false\)/);
});
