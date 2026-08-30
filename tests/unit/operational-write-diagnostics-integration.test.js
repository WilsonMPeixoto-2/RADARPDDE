'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const diagnostics = require('../../src/integration/operational-write-diagnostics.js');
const performancePolicy = require('../../src/integration/operational-write-performance.js');
const feedback = require('../../src/integration/operational-write-feedback.js');

const bootstrapSource = fs.readFileSync(
    path.join(__dirname, '../../src/integration/product-extensions-bootstrap.js'),
    'utf8'
);

function clockRoot() {
    let now = 0;
    const marks = [];
    const measures = [];
    const cleared = [];
    const root = {
        performance: {
            now: () => now,
            mark: name => marks.push(name),
            measure: (name, options) => measures.push({ name, options }),
            clearMarks: name => cleared.push(['mark', name]),
            clearMeasures: name => cleared.push(['measure', name])
        },
        requestAnimationFrame: callback => {
            now += 1;
            callback(now);
            return 1;
        }
    };
    root.RadarOperationalWriteDiagnostics = diagnostics;
    return {
        root,
        setNow: value => { now = value; },
        marks,
        measures,
        cleared
    };
}

test('runtime de diagnóstico é singleton e expõe apenas leitura na interface pública', () => {
    const { root } = clockRoot();
    const first = diagnostics.install(root, { limit: 2 });
    const second = diagnostics.install(root, { limit: 2 });

    assert.equal(first, second);
    assert.equal(typeof root.RadarOperationalWriteMetrics.snapshot, 'function');
    assert.equal(typeof root.RadarOperationalWriteMetrics.summary, 'function');
    assert.equal(root.RadarOperationalWriteMetrics.begin, undefined);
    assert.equal(root.RadarOperationalWriteMetrics.mark, undefined);
    assert.equal(Object.isFrozen(root.RadarOperationalWriteMetrics), true);
});

test('fila por handler correlaciona evento de UI e chamada inline sem dados de negócio', () => {
    const { root } = clockRoot();
    diagnostics.install(root, { limit: 5 });

    const id = diagnostics.begin(root, 'toggleBonif');
    assert.equal(typeof id, 'number');
    assert.equal(diagnostics.enqueue(root, 'toggleBonif', id), true);
    assert.equal(diagnostics.take(root, 'toggleBonif'), id);
    assert.equal(diagnostics.take(root, 'toggleBonif'), null);

    const entry = root.RadarOperationalWriteMetrics.snapshot()[0];
    assert.deepEqual(Object.keys(entry).sort(), ['click', 'durations', 'id', 'label']);
    assert.equal(entry.label, 'toggleBonif');
});

test('contexto ativo vale apenas durante a invocação síncrona e é restaurado', () => {
    const { root } = clockRoot();
    diagnostics.install(root);

    const seen = diagnostics.withActive(root, 7, () => diagnostics.active(root));
    assert.equal(seen, 7);
    assert.equal(diagnostics.active(root), null);

    assert.equal(
        diagnostics.withActive(root, 8, () => diagnostics.withActive(root, 9, () => diagnostics.active(root))),
        9
    );
    assert.equal(diagnostics.active(root), null);
});

test('API segura de marcação falha aberta sem interromper a operação', () => {
    const { root } = clockRoot();
    diagnostics.install(root);
    const id = diagnostics.begin(root, 'toggleBonif');

    assert.equal(diagnostics.mark(root, id, 'feedback'), true);
    assert.equal(diagnostics.mark(root, id, 'fase-inexistente'), false);
    assert.doesNotThrow(() => diagnostics.mark(null, id, 'feedback'));
});

test('bootstrap carrega diagnóstico antes da política de escrita', () => {
    const diagnosticsIndex = bootstrapSource.indexOf('/src/integration/operational-write-diagnostics.js');
    const performanceIndex = bootstrapSource.indexOf('/src/integration/operational-write-performance.js');

    assert.notEqual(diagnosticsIndex, -1, 'diagnóstico operacional não está no bootstrap oficial');
    assert.notEqual(performanceIndex, -1, 'política de escrita não está no bootstrap oficial');
    assert.ok(diagnosticsIndex < performanceIndex, 'diagnóstico deve carregar antes da política de escrita');
});

test('feedback identifica o handler técnico sem carregar argumentos do negócio para a métrica', () => {
    assert.equal(
        feedback.inlineHandlerName("toggleBonif('school-123', '2026-08_program-9', 'notaFiscal', 'Sim')"),
        'toggleBonif'
    );
    assert.equal(
        feedback.inlineHandlerName("changeInvoiceAdvisoryAnalysis('invoice-9', 'school-123', 'Correto')"),
        'changeInvoiceAdvisoryAnalysis'
    );
    assert.equal(feedback.inlineHandlerName('openModalDadosNota(123)'), '');
});

test('DataService instrumentado mede apenas a persistência customizada como RPC', async () => {
    const { root, setNow } = clockRoot();
    diagnostics.install(root);
    const id = diagnostics.begin(root, 'toggleBonif');

    const dataService = {
        execute: async command => {
            setNow(10);
            const persisted = await command.persist({ sample: true });
            setNow(30);
            return { ok: true, persisted };
        }
    };

    assert.equal(performancePolicy.patchDataService(dataService, root), true);
    const result = await diagnostics.withActive(root, id, () => dataService.execute({
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        persist: async context => {
            assert.equal(context.sample, true);
            setNow(20);
            return { verification: { id: 'opaque' } };
        }
    }));

    assert.equal(result.ok, true);
    const entry = root.RadarOperationalWriteMetrics.snapshot()[0];
    assert.equal(entry.rpcStart, 10);
    assert.equal(entry.rpcEnd, 20);
    assert.equal(entry.durations.rpc, 10);
});

test('escrita inline instrumentada fecha click, feedback, RPC, aplicação e estabilidade', async () => {
    const { root, setNow } = clockRoot();
    root.document = {
        querySelectorAll: () => []
    };
    root.renderProntuario = () => true;

    const dataService = {
        execute: async command => {
            setNow(10);
            const persisted = await command.persist({ source: 'fixture' });
            setNow(20);
            return persisted;
        }
    };
    const state = { verifications: {}, registeredInvoices: [] };
    root.RadarApplicationServices = {
        verifications: {
            dataService,
            getState: () => state
        }
    };

    root.toggleBonif = async () => dataService.execute({
        name: 'verification:set-bonification',
        persist: async context => {
            assert.equal(context.source, 'fixture');
            setNow(15);
            return true;
        }
    });
    root.changeAnaliseTecnica = async () => true;
    root.toggleInvoiceAdvisorySent = async () => true;
    root.changeInvoiceAdvisoryAnalysis = async () => true;
    root.toggleConsEnviada = async () => true;

    diagnostics.install(root);
    assert.equal(performancePolicy.install(root), true);

    setNow(0);
    const id = diagnostics.begin(root, 'toggleBonif');
    setNow(1);
    diagnostics.mark(root, id, 'feedback');
    diagnostics.enqueue(root, 'toggleBonif', id);

    assert.equal(
        await root.toggleBonif('school-opaque', '2026-08_program-opaque', 'extCC', 'Sim'),
        true
    );

    const entry = root.RadarOperationalWriteMetrics.snapshot()[0];
    assert.equal(entry.click, 0);
    assert.equal(entry.feedback, 1);
    assert.equal(entry.rpcStart, 10);
    assert.equal(entry.rpcEnd, 15);
    assert.equal(entry.applyStart, 20);
    assert.equal(entry.applyEnd, 20);
    assert.equal(entry.stable, 21);
    assert.deepEqual(entry.durations, {
        clickToFeedback: 1,
        rpc: 5,
        apply: 0,
        clickToStable: 21
    });
});

test('probe continua limitada após integração e resumo não contém identificadores de negócio', () => {
    const { root, setNow } = clockRoot();
    diagnostics.install(root, { limit: 2 });

    for (let index = 0; index < 3; index += 1) {
        setNow(index * 10);
        const id = diagnostics.begin(root, `handler-${index}`);
        setNow(index * 10 + 5);
        diagnostics.mark(root, id, 'stable');
    }

    const snapshot = root.RadarOperationalWriteMetrics.snapshot();
    assert.equal(snapshot.length, 2);
    assert.equal(snapshot[0].label, 'handler-1');
    assert.equal(snapshot[1].label, 'handler-2');

    assert.deepEqual(Object.keys(root.RadarOperationalWriteMetrics.summary()).sort(), [
        'apply',
        'clickToFeedback',
        'clickToStable',
        'rpc',
        'sampleCount'
    ]);
});
