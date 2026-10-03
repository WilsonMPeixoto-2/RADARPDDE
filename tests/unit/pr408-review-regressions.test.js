'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { createController } = require('../../src/integration/operational-context-refresh.js');
const { DataService } = require('../../src/application/data-service.js');
const { createStatePort } = require('../../src/application/state-port.js');
const { PendencyService } = require('../../src/application/pendency-service.js');
const pendencyDomain = require('../../src/domain/pendencias.js');

const POLICY_URL = pathToFileURL(
    path.resolve(__dirname, '../../scripts/check-exceljs-audit-policy.mjs')
).href;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function operationalRoot() {
    return {
        RadarAuthContext: { user: { id: 'local-controller' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };
}

test('invalidação Realtime recebida durante refresh que falha é drenada automaticamente após o cooldown', async () => {
    let calls = 0;
    let releaseFirst;
    const firstBarrier = new Promise(resolve => { releaseFirst = resolve; });
    const controller = createController(operationalRoot(), {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) {
                await firstBarrier;
                throw new Error('temporary failure');
            }
            return { stale: false };
        }
    }, { minIntervalMs: 20 });

    const focusRead = controller.refresh('focus');
    await Promise.resolve();
    const realtime = controller.refresh('realtime', { force: true });
    releaseFirst();

    await focusRead;
    await realtime;
    assert.equal(calls, 1, 'o cooldown não deve provocar retry imediato');
    assert.equal(controller.hasPendingRefresh(), true);

    await wait(120);
    assert.equal(calls, 2, 'a invalidação precisa ser recuperada sem novo gesto do usuário');
    assert.equal(controller.hasPendingRefresh(), false);
});

test('duas leituras Realtime abortadas por escrita são recuperadas após o cooldown sem clique ou foco', async () => {
    let calls = 0;
    const controller = createController(operationalRoot(), {
        async loadOperationalContext() {
            calls += 1;
            if (calls <= 2) return { stale: true, aborted: true };
            return { stale: false };
        }
    }, { minIntervalMs: 20 });

    await controller.refresh('realtime', { force: true });
    await controller.refresh('realtime-retry', { force: true });
    const settled = await controller.flushPending('write-settled');

    assert.equal(settled.skipped, true);
    assert.equal(settled.reason, 'throttled');
    assert.equal(calls, 2);
    assert.equal(controller.hasPendingRefresh(), true);

    await wait(120);
    assert.equal(calls, 3, 'o cooldown expirado precisa drenar uma única reconciliação pendente');
    assert.equal(controller.hasPendingRefresh(), false);
});

function createConcurrentDocumentHarness() {
    const schoolId = 'ESC-CONCURRENT-ATTEMPT';
    const competence = '2026-05';
    const programId = 'BASIC';
    const compKey = `${competence}_${programId}`;
    const invoiceId = 'invoice-concurrent-attempt';
    const pendencyId = 'pendency-concurrent-attempt';
    const instant = '2026-10-03T12:00:00.000Z';
    const pendency = pendencyDomain.createDocumentPendency({
        id: pendencyId,
        escolaId: schoolId,
        competencia: competence,
        programaId: programId,
        documentoKey: 'notaFiscal',
        registeredInvoiceId: invoiceId,
        item: 'Nota Fiscal a identificar',
        erros: ['Despesa a identificar'],
        observacao: 'Aguardando identificação.',
        dataAbertura: '2026-09-01'
    }, {
        eventId: 'opening-event',
        at: instant,
        usuario: 'Controller',
        perfil: 'Controlador'
    });
    pendency.rowVersion = 3;

    let state = {
        config: { exercicios: ['2026'], competenciaFechamento: competence },
        schools: [{ id: schoolId, denominação: 'Escola concorrente', cre: '4ª CRE', programasIds: [programId] }],
        programs: [{ id: programId, name: 'PDDE Básico', active: true }],
        controllers: [],
        inventoryTeamMembers: [],
        contacts: [],
        logs: [],
        verifications: { [schoolId]: { [compKey]: {
            bonificacao: { notaFiscal: 'Sim', extCC: 'Não' },
            analise: { notaFiscal: 'Incorreto', extCC: 'Não analisado' },
            resultadoBonif: 'apta',
            rowVersion: 4
        } } },
        registeredInvoices: [{
            id: invoiceId,
            escolaId: schoolId,
            compKey,
            competencia: competence,
            programaId: programId,
            tipo: 'a_identificar',
            numero: '',
            desc: 'Despesa a identificar',
            descricao: 'Despesa a identificar',
            valor: 500,
            analiseDocumentoFiscal: 'Incorreto',
            rowVersion: 2
        }],
        assets: [],
        pendencies: [pendency]
    };
    const before = structuredClone(state);
    const storage = {
        length: 0,
        key: () => null,
        getItem: () => null,
        setItem: () => { throw new Error('Remote operation must not persist browser storage'); },
        removeItem: () => undefined
    };
    const statePort = createStatePort({
        storage,
        readMemory: () => state,
        writeMemory: next => { state = structuredClone(next); },
        patchMemory: patch => { state = { ...state, ...structuredClone(patch) }; }
    });

    let rpcCalls = 0;
    let firstRpcStartedResolve;
    let firstRpcReleaseResolve;
    const firstRpcStarted = new Promise(resolve => { firstRpcStartedResolve = resolve; });
    const firstRpcRelease = new Promise(resolve => { firstRpcReleaseResolve = resolve; });
    const unexpected = async () => { throw new Error('Unexpected generic repository persistence/read'); };
    const repository = {
        capabilities: () => ({ remote: true }),
        load: unexpected,
        save: unexpected,
        remove: unexpected,
        exportSnapshot: unexpected,
        restoreSnapshot: unexpected,
        healthCheck: async () => ({ ok: true }),
        async executeRpc(name) {
            assert.equal(name, 'register_invoice_document_attempt');
            rpcCalls += 1;
            if (rpcCalls === 1) {
                firstRpcStartedResolve();
                await firstRpcRelease;
                const error = new Error('FIRST_REMOTE_FAILURE');
                error.code = 'REMOTE_FAILURE';
                throw error;
            }
            const error = new Error('SECOND_REMOTE_FAILURE');
            error.code = 'REMOTE_FAILURE';
            throw error;
        },
        queryOperationalContext: unexpected
    };
    const dataService = new DataService({ repository, statePort });
    dataService.currentOperationalCompetence = competence;
    let id = 0;
    const service = new PendencyService({
        dataService,
        domain: pendencyDomain,
        getState: () => state,
        getCurrentProfile: () => 'controlador',
        getCurrentUser: () => ({ name: 'Controller', role: 'Controlador' }),
        appendLog(action, details, context = {}) {
            const log = {
                id: `log-${++id}`,
                escolaId: context.schoolId || context.escolaId || schoolId,
                usuario: 'Controller',
                perfil: 'Controlador',
                acao: action,
                detalhes: details,
                dataHora: instant
            };
            state.logs.push(log);
            return log;
        },
        createId: prefix => `${prefix}-${++id}`,
        now: () => instant,
        getCorrectAnalysisLabel: () => 'Correto'
    });

    const submit = () => service.registerAttempt({
        pendencyId,
        availabilityDate: '2026-10-03',
        observation: 'Documento corrigido enviado.',
        link: 'https://drive.example/document',
        identification: {
            expenseType: 'permanente',
            invoiceNumber: 'NF-CONCURRENT',
            description: 'Bem identificado',
            amount: 500
        }
    });

    return {
        before,
        state: () => state,
        submit,
        firstRpcStarted,
        releaseFirstRpc: firstRpcReleaseResolve,
        rpcCalls: () => rpcCalls
    };
}

test('envios sobrepostos não deixam patrimônio órfão quando o primeiro rollback invalida o escopo pré-calculado do segundo', async () => {
    const harness = createConcurrentDocumentHarness();
    const first = harness.submit();
    const firstFailure = assert.rejects(first, /FIRST_REMOTE_FAILURE/);
    await harness.firstRpcStarted;

    const second = harness.submit();
    const secondFailure = assert.rejects(second, error => error?.code === 'OPTIMISTIC_CONFLICT');
    harness.releaseFirstRpc();

    await Promise.all([firstFailure, secondFailure]);
    assert.equal(harness.rpcCalls(), 1, 'o segundo envio deve falhar antes de persistir com escopo obsoleto');
    assert.deepEqual(harness.state(), harness.before, 'rollback concorrente não pode deixar bem órfão em memória');
});

function advisory(id, severity = 'high') {
    return {
        source: 1119441,
        name: 'braces',
        dependency: 'braces',
        title: id,
        url: `https://github.com/advisories/${id}`,
        severity
    };
}

function stylelintBracesReport() {
    return {
        auditReportVersion: 2,
        vulnerabilities: {
            braces: {
                severity: 'high',
                isDirect: false,
                via: [advisory('GHSA-vfj7-8cjw-p6xm')],
                effects: ['micromatch'],
                nodes: ['node_modules/braces']
            },
            micromatch: {
                severity: 'high',
                isDirect: false,
                via: ['braces'],
                effects: ['fast-glob', 'globby', 'stylelint'],
                nodes: ['node_modules/micromatch']
            },
            'fast-glob': {
                severity: 'high',
                isDirect: false,
                via: ['micromatch'],
                effects: ['globby', 'stylelint'],
                nodes: ['node_modules/fast-glob']
            },
            globby: {
                severity: 'high',
                isDirect: false,
                via: ['fast-glob', 'micromatch'],
                effects: ['stylelint'],
                nodes: ['node_modules/globby']
            },
            stylelint: {
                severity: 'high',
                isDirect: true,
                via: ['fast-glob', 'globby', 'micromatch'],
                effects: ['stylelint-config-recommended'],
                nodes: ['node_modules/stylelint']
            },
            'stylelint-config-recommended': {
                severity: 'high',
                isDirect: true,
                via: ['stylelint'],
                effects: [],
                nodes: ['node_modules/stylelint-config-recommended']
            }
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 0, high: 6, critical: 0, total: 6 }
        }
    };
}

test('relatório de erro do npm audit é inválido e nunca pode ser tratado como auditoria limpa', async () => {
    const policy = await import(POLICY_URL);
    const result = policy.evaluateAuditReport({
        error: { code: 'ENOTFOUND', summary: 'registry unavailable' }
    });

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'INVALID_AUDIT_REPORT'));
});

test('braces direto é rejeitado mesmo usando o advisory permitido para a cadeia Stylelint', async () => {
    const policy = await import(POLICY_URL);
    const report = stylelintBracesReport();
    report.vulnerabilities.braces.isDirect = true;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.packageName === 'braces'
        && item.advisory === 'GHSA-VFJ7-8CJW-P6XM'
    )));
});
