'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const ui = require('../../src/integration/operational-guidance.js');
const guidance = require('../../src/domain/operational-guidance.js');

const app = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
const tree = acorn.parse(app, { ecmaVersion: 'latest', sourceType: 'script' });
const navigationNode = tree.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'openOperationalGuidanceTarget');
const inputNode = tree.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'getOperationalGuidanceInput');
const codecNode = tree.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'encodePendencyIdReference');
const encodePendencyIdReference = vm.runInNewContext('(' + app.slice(codecNode.start, codecNode.end) + ')');

test('ponte real aguarda competência inicializada no startup e após saída com contexto reiniciado', () => {
    function freshCompetenceApi() {
        const sandbox = { module: { exports: {} } };
        vm.createContext(sandbox);
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/domain/competence-context.js'), 'utf8'), sandbox);
        return sandbox.module.exports;
    }
    const context = {
        operationalGuidanceDashboardSchoolIds: ['ESC-A'], activeProntuarioCompetencia: '2026-05',
        currentView: 'dashboard', activeSchoolId: 'ESC-A',
        escolas: [{ id: 'ESC-A' }], programas: [], pendencias: [], notasRegistradas: [], bens: [], verificacoes: {},
        getRadarAccessProfile: () => 'controlador', hasRadarCapability: () => true, encodePendencyIdReference,
        window: { RadarCompetenceContext: freshCompetenceApi(),
            RadarApplicationServices: { data: { repository: { capabilities: () => ({ remote: true }) }, currentOperationalCompetence: '2026-05' } },
            RadarAccessPolicy: { normalizeProfile: role => role, CAPABILITIES: { OPEN_PENDENCY: 'open-pendency' } },
            RadarAuthContext: { authorization: { role: 'technical_admin' } }
        }
    };
    vm.createContext(context);
    vm.runInContext(app.slice(inputNode.start, inputNode.end), context);
    assert.equal(context.getOperationalGuidanceInput().ready, false);
    assert.equal(context.getOperationalGuidanceInput().competence, '');
    context.window.RadarCompetenceContext.initialize({ competences: ['2026-05'], currentExercise: '2026', closingCompetence: '2026-05' });
    assert.equal(context.getOperationalGuidanceInput().ready, true);
    assert.equal(context.getOperationalGuidanceInput().competence, '2026-05');
    context.window.RadarCompetenceContext = freshCompetenceApi();
    context.currentView = 'prontuario';
    assert.equal(context.getOperationalGuidanceInput('ESC-A').ready, false);
    assert.equal(context.getOperationalGuidanceInput('ESC-A').competence, '');
});

function navigationHarness({ fiscal = true, inventory = false, initialMonth = '2026-05',
    rendered = true, focusable = true, afterHydration } = {}) {
    const calls = [];
    let activeKey = initialMonth;
    const document = { activeElement: null };
    const node = dataset => ({ dataset, parentElement: null,
        getClientRects: () => rendered ? [{}] : [],
        scrollIntoView() { calls.push(['scroll', this.dataset]); },
        focus() { calls.push(['focus', this.dataset]); if (focusable) document.activeElement = this; }
    });
    const nodes = { '[data-asset-id]': node({ assetId: 'B-1' }), '[data-invoice-id]': node({ invoiceId: 'NF-1' }),
        '[data-program-header]': node({ programHeader: 'BASIC' }), drawer: node({ pendencyId: 'P-1' }) };
    document.querySelectorAll = selector => rendered && nodes[selector] ? [nodes[selector]] : [];
    document.getElementById = id => rendered && id === 'pendency-detail-drawer' ? nodes.drawer : null;
    const context = {
        getOperationalGuidanceInput: () => ({ capabilities: { fiscal, inventory } }),
        activeProntuarioCompetencia: initialMonth,
        pendencias: [{ id: 'P-1', escolaId: 'ESC-A', competenciaOrigem: '2026-05', programaId: 'BASIC' }],
        notasRegistradas: [{ id: 'NF-1', escolaId: 'ESC-A', compKey: '2026-05_BASIC' }],
        bens: [{ id: 'B-1', escolaId: 'ESC-A', competencia: '2026-05', programaId: 'BASIC' }],
        verificacoes: { 'ESC-A': { '2026-05_BASIC': { resultadoBonif: '' } } },
        switchView: async (view, school) => { calls.push(['view', view, school]); },
        activateProntuarioTab: tab => { calls.push(['tab', tab]); return true; },
        document,
        window: {
            RadarOperationalGuidance: guidance,
            requestAnimationFrame: callback => { queueMicrotask(callback); },
            RadarCompetenceContext: { isInitialized: () => true, getState: () => ({ activeKey }),
                select: key => { activeKey = key; calls.push(['competence', key]); } },
            RadarGlobalCompetenceSelector: { whenHydrated: async () => {
                await Promise.resolve();
                calls.push(['hydrated']);
                afterHydration?.(context);
            } },
            clearPendencyFilters: () => calls.push(['clear-filters']),
            openPendencyDetail: id => { calls.push(['pendency', id]); return true; },
            elementMatchesPendencyIdReference: (element, id) => element?.dataset.pendencyId === id
        }
    };
    vm.createContext(context);
    vm.runInContext(app.slice(navigationNode.start, navigationNode.end), context);
    return { context, calls, nodes, navigate: context.openOperationalGuidanceTarget };
}

test('botão de sugestão apenas navega para o alvo explícito, sem chamar comando ou mensagem externa', async () => {
    const calls = [];
    const root = {
        async openOperationalGuidanceTarget(target) { calls.push(target); return true; },
        RadarApplicationServices: { data: { execute() { throw new Error('Mutação indevida'); } } },
        sendMessage() { throw new Error('Mensagem indevida'); }
    };
    assert.equal(await ui.navigate(root, { target: { entity: 'pendency', id: 'P-EXATO', schoolId: 'ESC-A' } }), true);
    assert.deepEqual(calls, [{ entity: 'pendency', id: 'P-EXATO', schoolId: 'ESC-A' }]);
});

test('navegação real abre a Pendência identificada, limpa filtro anterior e não troca a entidade', async () => {
    const { navigate, calls, context, nodes } = navigationHarness();
    assert.equal(await navigate({ entity: 'pendency', id: 'P-1', schoolId: 'ESC-A', competence: '2026-05' }), true);
    assert.deepEqual(calls.slice(0, 4), [['hydrated'], ['view', 'pendencias', undefined], ['clear-filters'], ['pendency', 'P-1']]);
    assert.equal(context.document.activeElement, nodes.drawer);
});

test('navegação da orientação não confunde número123, string123 ou zero no mesmo recorte', async () => {
    const { navigate, calls, context, nodes } = navigationHarness();
    const ids = [123, '123', 0];
    context.pendencias = ids.map(id => ({ id, escolaId: 'ESC-A', competenciaOrigem: '2026-05', programaId: 'BASIC' }));
    for (const id of ids) {
        nodes.drawer.dataset.pendencyId = id;
        assert.equal(await navigate({ entity: 'pendency', id, schoolId: 'ESC-A', competence: '2026-05', programId: 'BASIC' }), true);
        assert.equal(context.document.activeElement, nodes.drawer);
    }
    assert.deepEqual(calls.filter(call => call[0] === 'pendency').map(call => call[1]), ids);
});

test('Inventário navega ao bem sem exigir flags T5 e sem liberar análise fiscal', async () => {
    const { navigate, calls, context, nodes } = navigationHarness({ fiscal: false, inventory: true });
    assert.equal(await navigate({ entity: 'invoice', id: 'NF-1', schoolId: 'ESC-A', competence: '2026-05' }), false);
    assert.deepEqual(calls, []);
    assert.equal(await navigate({ entity: 'asset', id: 'B-1', schoolId: 'ESC-A', competence: '2026-05' }), true);
    assert.deepEqual(calls.slice(0, 3), [['hydrated'], ['view', 'prontuario', 'ESC-A'], ['tab', 'tab-capital']]);
    assert.equal(context.document.activeElement, nodes['[data-asset-id]']);
});

test('acesso somente de consulta, escola divergente, registro excluído ou identidade duplicada não abrem ações operacionais', async () => {
    const readonly = navigationHarness({ fiscal: false, inventory: false });
    assert.equal(await readonly.navigate({ entity: 'pendency', id: 'P-1', schoolId: 'ESC-A' }), false);
    const { navigate, calls, context } = navigationHarness();
    assert.equal(await navigate({ entity: 'pendency', id: 'P-1', schoolId: 'ESC-B' }), false);
    assert.equal(await navigate({ entity: 'pendency', id: 'P-EXCLUIDA', schoolId: 'ESC-A' }), false);
    context.pendencias.push({ id: 'P-1', escolaId: 'ESC-A' });
    assert.equal(await navigate({ entity: 'pendency', id: 'P-1', schoolId: 'ESC-A' }), false);
    assert.deepEqual(calls, []);
});

test('mudança de mês aguarda hidratação canônica antes de abrir a avaliação existente', async () => {
    const { navigate, calls, context, nodes } = navigationHarness({ initialMonth: '2026-04' });
    assert.equal(await navigate({ entity: 'verification', contextKey: '2026-05_BASIC',
        schoolId: 'ESC-A', competence: '2026-05', programId: 'BASIC' }), true);
    assert.deepEqual(calls.slice(0, 4), [['competence', '2026-05'], ['hydrated'], ['view', 'prontuario', 'ESC-A'], ['tab', 'tab-verificacoes']]);
    assert.equal(context.document.activeElement, nodes['[data-program-header]']);
});

test('navegação não aceita mês ou programa incompatível com o registro identificado', async () => {
    const { navigate, calls } = navigationHarness();
    assert.equal(await navigate({ entity: 'verification', contextKey: '2026-05_BASIC',
        schoolId: 'ESC-A', competence: '2026-04', programId: 'BASIC' }), false);
    assert.equal(await navigate({ entity: 'invoice', id: 'NF-1',
        schoolId: 'ESC-A', competence: '2026-05', programId: 'LEITURA' }), false);
    assert.deepEqual(calls, []);
});

test('registro que desapareceu na hidratação, alvo sem render ou foco recusado nunca são reportados como abertos', async () => {
    const removed = navigationHarness({ afterHydration: context => { context.notasRegistradas = []; } });
    assert.equal(await removed.navigate({ entity: 'invoice', id: 'NF-1', schoolId: 'ESC-A' }), false);
    assert.deepEqual(removed.calls, [['hydrated']]);
    const notRendered = navigationHarness({ rendered: false });
    assert.equal(await notRendered.navigate({ entity: 'invoice', id: 'NF-1', schoolId: 'ESC-A' }), false);
    const notFocusable = navigationHarness({ focusable: false });
    assert.equal(await notFocusable.navigate({ entity: 'invoice', id: 'NF-1', schoolId: 'ESC-A' }), false);
});

test('a nota individual recebe foco, sem substituir o alvo pelo grupo de programa', async () => {
    const { navigate, nodes, context } = navigationHarness();
    assert.equal(await navigate({ entity: 'invoice', id: 'NF-1', schoolId: 'ESC-A' }), true);
    assert.equal(context.document.activeElement, nodes['[data-invoice-id]']);
});

test('cobertura fala de registros carregados e datas inválidas não são apresentadas como zero dias', () => {
    const model = { scope: { competence: '2026-05', schoolCount: 2, activePendencies: 3,
        invoices: 4, assets: 5, existingContexts: 6 } };
    assert.match(ui.coverageText(model, { fiscal: true }), /maio de 2026/);
    assert.match(ui.coverageText(model, { fiscal: true }), /6 contextos registrados/);
    assert.match(ui.coverageText(model, { fiscal: true }), /registros carregados neste recorte/);
    assert.equal(ui.ageLabel(null), 'Sem data válida para calcular');
    assert.equal(ui.ageLabel(0), '0 dias');
    assert.doesNotMatch(ui.coverageText(model, { inventory: true }), /notas|Pendências|contextos/);
});

class PanelNode {
    constructor(tagName) {
        this.tagName = tagName;
        this.childNodes = [];
        this.dataset = {};
        this.attributes = {};
        this.listeners = {};
        this.className = '';
        this.hidden = false;
        this.classList = {
            add: value => { this.className += ` ${value}`; },
            toggle: (value, active) => {
                const classes = new Set(this.className.split(' ').filter(Boolean));
                if (active) classes.add(value); else classes.delete(value);
                this.className = [...classes].join(' ');
            }
        };
    }
    get textContent() { return (this.text || '') + this.childNodes.map(child => child.textContent).join(''); }
    set textContent(value) { this.text = String(value); this.childNodes = []; }
    append(...nodes) { for (const node of nodes) { this.childNodes.push(node); node.parentElement = this; } }
    appendChild(node) { this.append(node); return node; }
    replaceChildren(...nodes) { this.text = ''; this.childNodes = []; this.append(...nodes); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    click() { return this.listeners.click?.({ target: this }); }
}
function descendants(node) { return node.childNodes.flatMap(child => [child, ...descendants(child)]); }

test('botões usam referências tipadas do codec, preservam zero e nunca transformam ID hostil em HTML ou handler', async () => {
    const ids = [123, '123', 0, `pend-'/</div><img src=x onerror=alert(1)>`];
    const panel = new PanelNode('section');
    const calls = [];
    const root = { document: { createElement: tag => new PanelNode(tag) }, RadarOperationalGuidance: guidance,
        encodePendencyIdReference, openOperationalGuidanceTarget: target => { calls.push(target.id); return true; } };
    const input = { ready: true, competence: '2026-05', encodePendencyIdReference, capabilities: { fiscal: true },
        schools: [{ id: 'ESC-A' }], pendencies: ids.map(id => ({ id, escolaId: 'ESC-A', competenciaOrigem: '2026-05',
            programaId: 'BASIC', documentoKey: 'extCC', status: 'Aberta' })) };
    ui.renderPanel(root, panel, input);
    const buttons = descendants(panel).filter(node => node.tagName === 'button' && node.dataset.action === 'open-operational-guidance');
    assert.equal(buttons.length, ids.length);
    for (const id of ids) {
        const button = buttons.find(node => node.dataset.pendencyRef === encodePendencyIdReference(id));
        assert.ok(button);
        assert.equal(button.dataset.guidanceTargetId, String(id));
        assert.equal(button.attributes.onclick, undefined);
        button.click();
    }
    await Promise.resolve();
    assert.deepEqual(calls, ids);
    assert.equal(descendants(panel).filter(node => node.tagName === 'img').length, 0);
    ui.renderPanel(root, panel, { ...input, pendencies: input.pendencies.filter(record => record.id === 0) }, { schoolMode: true });
    const shortcut = panel.childNodes[0].childNodes.find(node => node.dataset.action === 'open-operational-guidance');
    assert.equal(shortcut.dataset.guidanceTargetId, '0');
    assert.equal(shortcut.dataset.pendencyRef, encodePendencyIdReference(0));
});

test('escola começa compacta, com próximo passo navegável, e só expõe a fila após expansão explícita', async () => {
    const panel = new PanelNode('section');
    panel.id = 'operational-school-guidance';
    const navigated = [];
    const root = { document: { createElement: tag => new PanelNode(tag) }, RadarOperationalGuidance: guidance, encodePendencyIdReference,
        openOperationalGuidanceTarget: target => { navigated.push(target); return true; } };
    const input = { ready: true, competence: '2026-05', now: '2026-05-20T12:00:00Z',
        capabilities: { fiscal: true }, encodePendencyIdReference, schools: [{ id: 'ESC-A', denominação: 'Escola A' }],
        pendencies: [{ id: 'P-1', escolaId: 'ESC-A', competenciaOrigem: '2026-05',
            programaId: 'BASIC', documentoKey: 'extCC', status: 'Aberta' }], programs: [{ id: 'BASIC', name: 'PDDE Básico' }] };
    assert.equal(ui.renderPanel(root, panel, input, { schoolMode: true }), true);
    const all = descendants(panel);
    const body = all.find(node => node.id === 'operational-school-guidance-content');
    const toggle = all.find(node => node.dataset.action === 'toggle-operational-guidance');
    const shortcut = panel.childNodes[0].childNodes.find(node => node.dataset.action === 'open-operational-guidance');
    assert.equal(body.hidden, true);
    assert.equal(toggle.attributes['aria-expanded'], 'false');
    assert.equal(toggle.attributes['aria-controls'], body.id);
    assert.match(toggle.textContent, /Ver 1 sugestão/);
    assert.match(shortcut.textContent, /Próximo passo.*Registrar novo envio/);
    shortcut.click();
    await Promise.resolve();
    assert.equal(navigated[0].id, 'P-1');
    toggle.click();
    assert.equal(body.hidden, false);
    assert.equal(toggle.attributes['aria-expanded'], 'true');
    assert.match(body.textContent, /providência de Escola/);
    assert.ok(descendants(body).some(node => node.dataset.guidanceFilter === 'review'));
    ui.renderPanel(root, panel, input, { schoolMode: true });
    assert.equal(descendants(panel).find(node => node.id === body.id).hidden, false);
    descendants(panel).find(node => node.dataset.action === 'toggle-operational-guidance').click();
    assert.equal(descendants(panel).find(node => node.id === body.id).hidden, true);
});
