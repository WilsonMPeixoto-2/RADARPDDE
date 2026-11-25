'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../../src/integration/granular-correction-ui.js');
const dialog = require('../../src/integration/operational-correction-dialog.js');
const policy = require('../../src/domain/access-policy.js');

class DomNode {
    constructor(tag) {
        this.tagName = tag;
        this.childNodes = [];
        this.dataset = {};
        this.attributes = {};
        this.listeners = {};
        this.value = '';
        this.hidden = false;
        this.checked = false;
        this.disabled = false;
        this.className = '';
        this.classList = { add: value => { this.className += ` ${value}`; } };
    }
    get children() { return this.childNodes.filter(child => child.tagName !== '#text'); }
    get textContent() { return (this.text || '') + this.childNodes.map(child => child.textContent).join(''); }
    set textContent(value) { this.text = String(value); this.childNodes = []; }
    append(...nodes) { this.childNodes.push(...nodes); }
    appendChild(node) { this.append(node); return node; }
    replaceChildren(...nodes) { this.text = ''; this.childNodes = [...nodes]; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
    dispatch(type) { for (const handler of this.listeners[type] || []) handler({ target: this }); }
    querySelectorAll(selector) {
        const nodes = this.childNodes.flatMap(child => [child, ...child.querySelectorAll('*')]);
        if (selector === '*') return nodes;
        if (selector === 'input:checked') return nodes.filter(node => node.tagName === 'input' && node.checked);
        return nodes.filter(node => node.tagName === selector);
    }
    checkValidity() { return !this.required || Boolean(this.value); }
}
const document = {
    createElement: tag => new DomNode(tag),
    createTextNode(value) { const node = new DomNode('#text'); node.textContent = value; return node; }
};
function rootContext(role = 'controller', profile = 'controlador') {
    return {
        document,
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RADAR_T4_CONTEXT_DELETION_PILOT: true,
        RADAR_T4_ITEM_HISTORY_PILOT: true,
        RADAR_T5_HISTORY_PILOT: true,
        location: { hostname: 'localhost', protocol: 'http:' },
        RADAR_PDDE_CONFIG: { deploymentTarget: 'local', features: { operationalCorrectionPilot: true } },
        RadarApplicationServices: { data: { repository: { executeRpc() {}, capabilities: () => ({ remote: true }) } } },
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarOperationalCorrectionDialog: dialog,
        RadarGranularCorrectionUi: ui,
        RadarAccessPolicy: policy,
        RadarAuthContext: { authorization: { role } },
        getRadarAccessProfile: () => profile,
        RadarPendencias: { DOCUMENT_ERROR_TYPES: ['Documento ausente', 'Data incorreta'] }
    };
}

test('T5 abre somente no piloto local explícito ou no release próprio de produção', () => {
    const root = rootContext();
    assert.equal(ui.canUse(root, 'correct_attempt'), true);
    assert.equal(ui.canUse({ ...root, RADAR_T5_HISTORY_PILOT: false }, 'correct_attempt'), false);
    assert.equal(ui.canUse({ ...root, RADAR_T4_ITEM_HISTORY_PILOT: false }, 'correct_attempt'), false);
    const production = { ...root,
        location: { hostname: 'radarpdde-fix.vercel.app', protocol: 'https:' },
        RADAR_PDDE_CONFIG: { deploymentTarget: 'production', features: {
            operationalCorrectionRelease: true, bonificationCorrectionRelease: true,
            contextDeletionRelease: true, itemHistoryRelease: true
        } }
    };
    assert.equal(ui.canUse(production, 'correct_attempt'), false);
    production.RADAR_PDDE_CONFIG.features.granularHistoryRelease = true;
    assert.equal(ui.canUse(production, 'correct_attempt'), true);
});

test('T5 respeita capacidade efetiva, colaboração e administrador técnico em perfil visual simulado', () => {
    assert.equal(ui.canUse(rootContext('federal_assistant', 'assistente'), 'delete_review'), true);
    assert.equal(ui.canUse(rootContext('sme_management', 'controlador'), 'delete_review'), false);
    assert.equal(ui.canUse(rootContext('inventory', 'inventario'), 'correct_inventory'), true);
    assert.equal(ui.canUse(rootContext('inventory', 'inventario'), 'delete_asset'), true);
    assert.equal(ui.canUse(rootContext('inventory', 'inventario'), 'delete_attempt'), false);
    assert.equal(ui.canUse(rootContext('technical_admin', 'sme'), 'correct_review'), true);
});

test('corrigir texto da reanálise envia apenas a alteração e preserva data, resultado e autoria do fato', () => {
    const record = {
        id: 'ATT-REAL', resultado: 'incorreto', dataAnalise: '2026-11-12T15:22:13.123Z',
        errosEncontrados: ['Documento ausente'], observacaoAnalise: 'Conferência original',
        registradoPor: 'Controladora do envio', analisadoPor: 'Controlador da reanálise',
        observacao: 'Detalhe do envio'
    };
    const form = ui.createFields(rootContext(), 'correct_review', record);
    assert.deepEqual(ui.readChanges(form), {});
    assert.equal(form.fields.get('observation').control.value, 'Conferência original');
    form.fields.get('observation').control.value = '';
    assert.deepEqual(ui.readChanges(form), { observation: '' });
    assert.equal(ui.recordAuthor('correct_attempt', record), 'Controladora do envio');
    assert.equal(ui.recordAuthor('correct_review', record), 'Controlador da reanálise');
    assert.equal(record.dataAnalise, '2026-11-12T15:22:13.123Z');
});

test('corrigir link ou observação do envio não inclui campos de reanálise na intenção', () => {
    const form = ui.createFields(rootContext(), 'correct_attempt', {
        id: 'ATT-9', numero: 9, dataDisponibilizacao: '2026-11-12',
        link: 'https://drive.google.com/file/d/anterior', observacao: 'Anterior',
        resultado: 'correto', dataAnalise: '2026-11-13T15:00:00Z'
    });
    form.fields.get('driveUrl').control.value = 'https://drive.google.com/file/d/corrigido';
    assert.deepEqual(ui.readChanges(form), { driveUrl: 'https://drive.google.com/file/d/corrigido' });
    assert.match(ui.describeRecord('correct_attempt', { numero: 9, dataDisponibilizacao: '2026-11-12' }), /Envio 9/);
    assert.equal(form.fields.get('observation').control.required, false);
});

test('reverter inventariação não reenvia metadados ocultos como novos fatos', () => {
    const form = ui.createFields(rootContext('inventory', 'inventario'), 'correct_inventory', {
        id: 'ASSET-1', status: 'Inventariada', dataInventariacao: '2026-11-01T10:30:15Z',
        inventariadorId: 'MEMBER-1', observacoes: 'Original'
    }, { inventoryMembers: [{ id: 'MEMBER-1', name: 'Pessoa do Inventário' }] });
    assert.deepEqual(ui.readChanges(form), {});
    form.fields.get('status').control.value = 'Encaminhada';
    form.container.dispatch('change');
    assert.equal(form.fields.get('inventoriedAt').group.hidden, true);
    assert.deepEqual(ui.readChanges(form), { status: 'Encaminhada' });
    assert.match(ui.explanation('correct_inventory'), /não desfaz atos no SIGMA, SEI ou Processo.Rio/);
});

test('contato geral mantém identidade e vínculo inalterados ao limpar descrição opcional', () => {
    const form = ui.createFields(rootContext(), 'correct_contact', {
        id: 'CONTACT-1', school_id: 'ESC-1', pendency_id: null,
        contact_type: 'E-mail', contact_date: '2026-11-12', description: 'Descrição original'
    });
    form.fields.get('description').control.value = '';
    assert.deepEqual(ui.readChanges(form), { description: '' });
    assert.equal(form.fields.has('pendencyId'), false);
    assert.match(ui.explanation('correct_contact'), /contato geral/);
    assert.match(ui.explanation('delete_contact', { pendencyId: 'PEND-1' }), /não resolve a Pendência/);
});

test('desvincular contato exige escolha explícita e mantém o registro no histórico da escola', () => {
    const record = {
        id: 'CONTACT-LINKED', school_id: 'ESC-1', pendency_id: 'PEND-REAL',
        contact_type: 'Telefone', contact_date: '2026-11-12', description: 'Informação escolar independente',
        official_charge: true
    };
    const form = ui.createFields(rootContext(), 'correct_contact', record, { pendencyId: record.pendency_id });
    const unlink = form.fields.get('pendencyId').control;
    assert.equal(unlink.type, 'checkbox');
    assert.equal(unlink.checked, false);
    assert.deepEqual(ui.readChanges(form), {});
    unlink.checked = true;
    assert.deepEqual(ui.readChanges(form), { pendencyId: null });
    assert.equal(record.pendency_id, 'PEND-REAL', 'o formulário não altera o estado antes da confirmação');
    assert.equal(ui.humanValue('pendency_id', null), 'Contato geral da escola');
    unlink.checked = false;
    assert.deepEqual(ui.readChanges(form), {}, 'desmarcar não envia desligamento nem mudança de vínculo');
});

test('prévia mostra Antes/Depois legíveis e não apresenta o payload como JSON', () => {
    const container = new DomNode('div');
    ui.renderPreview(rootContext(), container, 'correct_review', {
        changes: [
            { field: 'payload', before: { observacaoAnalise: 'Detalhe anterior', internalKey: 'SEGREDO-INTERNO' },
                after: { observacaoAnalise: '', internalKey: 'SEGREDO-INTERNO' } },
            { field: 'status', before: 'analisada', after: 'aguardando' }
        ], removals: [], warnings: [], blockers: [], alternatives: []
    });
    assert.match(container.textContent, /Antes/);
    assert.match(container.textContent, /Depois/);
    assert.match(container.textContent, /Detalhe anterior/);
    assert.match(container.textContent, /Aguardando reanálise/);
    assert.doesNotMatch(container.textContent, /SEGREDO-INTERNO|internalKey|observacaoAnalise/);
    assert.equal(ui.humanValue('result', null), 'Sem reanálise');
});

test('ambiguidade somente oferece alternativas autorizadas pelo plano e exige nova prévia', () => {
    const container = new DomNode('div');
    let requested = null;
    const view = { changes: [], removals: [], warnings: [], blockers: [{
        code: 'AMBIGUOUS_PENDENCY_HISTORY', message: 'Não foi possível provar a ligação entre os registros.'
    }], alternatives: [] };
    ui.renderPreview(rootContext(), container, 'delete_review', view, { pendencyId: 'P-1' }, {
        openAlternative: value => { requested = value; }
    });
    assert.equal(container.querySelectorAll('button').length, 0);
    const alternative = { action: 'delete_pendency', target: { kind: 'pendency', id: 'P-1', schoolId: 'ESC-1' } };
    view.alternatives = [alternative];
    ui.renderPreview(rootContext(), container, 'delete_review', view, {}, {
        openAlternative: value => { requested = value; }
    });
    assert.equal(requested, null);
    const [button] = container.querySelectorAll('button');
    assert.match(button.textContent, /Conferir exclusão/);
    button.dispatch('click');
    assert.deepEqual(requested, alternative);
});
