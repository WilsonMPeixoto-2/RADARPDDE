'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DataService } = require('../../src/application/data-service.js');
const { createStatePort } = require('../../src/application/state-port.js');
const { PendencyService } = require('../../src/application/pendency-service.js');
const pendencyDomain = require('../../src/domain/pendencias.js');

function createHarness({ type = 'consumo', priorAsset = false, omitVerification = false } = {}) {
    const schoolId = 'ESC-DOCUMENT-ATTEMPT';
    const competence = '2026-05';
    const programId = 'BASIC';
    const compKey = `${competence}_${programId}`;
    const invoiceId = 'invoice-document-attempt';
    const pendencyId = 'pendency-document-attempt';
    const instant = '2026-10-03T12:00:00.000Z';
    const pendency = pendencyDomain.createDocumentPendency({
        id: pendencyId, escolaId: schoolId, competencia: competence,
        programaId: programId, documentoKey: 'notaFiscal',
        registeredInvoiceId: invoiceId, item: 'Nota Fiscal NF-1',
        erros: ['Documento incompleto'], observacao: 'Aguardando novo envio.',
        dataAbertura: '2026-09-01'
    }, { eventId: 'opening-event', at: instant, usuario: 'Controller', perfil: 'Controlador' });
    pendency.rowVersion = 3;
    let state = {
        config: { exercicios: ['2026'], competenciaFechamento: competence },
        schools: [{ id: schoolId, denominação: 'Escola documental', cre: '4ª CRE', programasIds: [programId] }],
        programs: [{ id: programId, name: 'PDDE Básico', active: true }],
        controllers: [], inventoryTeamMembers: [], contacts: [], logs: [],
        verifications: { [schoolId]: { [compKey]: {
            bonificacao: { notaFiscal: 'Sim', extCC: 'Não' },
            analise: { notaFiscal: 'Incorreto', extCC: 'Não analisado' },
            resultadoBonif: 'apta', rowVersion: 4
        } } },
        registeredInvoices: [{
            id: invoiceId, escolaId: schoolId, compKey, competencia: competence,
            programaId: programId, tipo: type, numero: type === 'a_identificar' ? '' : 'NF-1',
            desc: 'Documento de despesa', descricao: 'Documento de despesa', valor: 500,
            analiseDocumentoFiscal: 'Incorreto', rowVersion: 2,
            ...(priorAsset ? { bemId: 'prior-asset' } : {})
        }],
        assets: priorAsset ? [{
            id: 'prior-asset', escolaId: schoolId, competencia: competence,
            item: 'Bem anterior', descricao: 'Bem anterior', tipo: 'permanente',
            valor: 500, notaFiscal: 'NF-OLD', status: 'Não encaminhada', rowVersion: 6
        }] : [],
        pendencies: [pendency]
    };
    const before = structuredClone(state);
    const calls = { rpc: [], context: [], patches: [] };
    let remoteVerification = null;
    const storage = {
        length: 0, key: () => null, getItem: () => null,
        setItem: () => { throw new Error('Remote operation must not persist browser storage'); },
        removeItem: () => undefined
    };
    const statePort = createStatePort({
        storage,
        readMemory: () => state,
        writeMemory: next => { state = structuredClone(next); },
        patchMemory: patch => {
            calls.patches.push(structuredClone(patch));
            state = { ...state, ...structuredClone(patch) };
        }
    });
    const unexpected = async () => { throw new Error('Unexpected generic repository persistence/read'); };
    const repository = {
        capabilities: () => ({ remote: true }),
        load: unexpected, save: unexpected, remove: unexpected,
        exportSnapshot: unexpected, restoreSnapshot: unexpected,
        healthCheck: async () => ({ ok: true }),
        async executeRpc(name, args) {
            assert.equal(name, 'register_invoice_document_attempt');
            calls.rpc.push(structuredClone(args));
            if (priorAsset && type === 'a_identificar') {
                const error = new Error('INTEGRITY_CONFLICT: despesa a identificar não pode possuir patrimônio anterior');
                error.code = 'INTEGRITY_CONFLICT';
                throw error;
            }
            const result = {
                invoice: { ...structuredClone(args.p_invoice), row_version: 3 },
                asset: args.p_asset ? { ...structuredClone(args.p_asset), row_version: 1 } : null,
                deleted_asset_id: null,
                pendency: { ...structuredClone(args.p_pendency), row_version: 4 },
                attempt: structuredClone(args.p_attempt),
                verification: { ...structuredClone(args.p_verification_patch), row_version: 5 },
                administrative_log: structuredClone(args.p_administrative_log)
            };
            remoteVerification = structuredClone(result.verification);
            if (omitVerification) result.verification = null;
            return result;
        },
        async queryOperationalContext() {
            calls.context.push(structuredClone(state));
            const snapshot = await statePort.exportCanonical();
            if (remoteVerification) snapshot.entities.verifications = [structuredClone(remoteVerification)];
            return { entities: snapshot.entities };
        }
    };
    const dataService = new DataService({ repository, statePort });
    dataService.currentOperationalCompetence = competence;
    let id = 0;
    const service = new PendencyService({
        dataService, domain: pendencyDomain, getState: () => state,
        getCurrentProfile: () => 'controlador',
        getCurrentUser: () => ({ name: 'Controller', role: 'Controlador' }),
        appendLog(action, details, context = {}) {
            const log = {
                id: `log-${++id}`, escolaId: context.schoolId || context.escolaId || schoolId,
                usuario: 'Controller', perfil: 'Controlador', acao: action,
                detalhes: details, dataHora: instant
            };
            state.logs.push(log);
            return log;
        },
        createId: prefix => `${prefix}-${++id}`, now: () => instant,
        getCorrectAnalysisLabel: () => 'Correto'
    });
    return { service, calls, before, state: () => state, schoolId, compKey, invoiceId, pendencyId };
}

async function submit(harness, identification) {
    return harness.service.registerAttempt({
        pendencyId: harness.pendencyId,
        availabilityDate: '2026-10-03', observation: 'Documento corrigido enviado.',
        link: 'https://drive.example/document',
        ...(identification ? { identification: {
            expenseType: identification, invoiceNumber: 'NF-IDENT',
            description: 'Despesa identificada', amount: 500
        } } : {})
    });
}

function assertImmediateState(harness, result) {
    const state = harness.state();
    const invoice = state.registeredInvoices.find(item => item.id === harness.invoiceId);
    const pendency = state.pendencies.find(item => item.id === harness.pendencyId);
    const verification = state.verifications[harness.schoolId][harness.compKey];
    assert.equal(harness.calls.rpc.length, 1);
    assert.equal(result.stateSync.status, 'applied');
    assert.equal(result.stateSync.remoteCommitConfirmed, true);
    assert.equal(invoice.analiseDocumentoFiscal, 'Não analisado');
    assert.equal(invoice.rowVersion, 3);
    assert.equal(pendency.status, 'Aguardando reanálise');
    assert.equal(pendency.rowVersion, 4);
    assert.equal(pendency.tentativas.length, 1);
    assert.equal(verification.analise.notaFiscal, 'Não analisado');
    assert.equal(verification.rowVersion, 5);
    assert.equal(verification.bonificacao.notaFiscal, 'Sim');
    assert.equal(verification.bonificacao.extCC, 'Não');
    assert.equal(verification.resultadoBonif, 'apta');
    return { state, invoice, verification };
}

test('novo envio de NF de consumo aplica retorno e derivados sem baixar contexto completo', async () => {
    const harness = createHarness();
    const result = await submit(harness);
    const { state, invoice } = assertImmediateState(harness, result);
    assert.equal(invoice.tipo, 'consumo');
    assert.equal(state.assets.length, 0);
    assert.equal(harness.calls.rpc[0].p_asset, null);
    assert.equal(harness.calls.context.length, 0);
});

test('identificação como serviço aplica Assessoria derivada imediatamente sem contexto completo', async () => {
    const harness = createHarness({ type: 'a_identificar' });
    const result = await submit(harness, 'servico');
    const { state, invoice, verification } = assertImmediateState(harness, result);
    assert.equal(invoice.tipo, 'servico');
    assert.equal(invoice.consultaAssessoriaEnviada, false);
    assert.equal(invoice.analiseConsultaAssessoria, 'Não analisado');
    assert.equal(verification.bonificacao.consAssessoria, 'Não');
    assert.equal(verification.analise.consAssessoria, 'Não analisado');
    assert.equal(state.assets.length, 0);
    assert.equal(harness.calls.context.length, 0);
});

test('identificação como permanente aplica patrimônio retornado e resumo sem perder sincronização', async () => {
    const harness = createHarness({ type: 'a_identificar' });
    const result = await submit(harness, 'permanente');
    const { state, invoice, verification } = assertImmediateState(harness, result);
    assert.equal(invoice.tipo, 'permanente');
    assert.equal(state.assets.length, 1);
    assert.equal(invoice.bemId, state.assets[0].id);
    assert.equal(state.assets[0].rowVersion, 1);
    assert.equal(state.assets[0].status, 'Não encaminhada');
    assert.equal(verification.bonificacao.encampInventario, 'Não');
    assert.equal(verification.analise.encampInventario, 'Não analisado');
    assert.equal(harness.calls.rpc[0].p_asset.id, state.assets[0].id);
    assert.equal(harness.calls.context.length, 0);
});

test('rejeição remota de identificação com patrimônio anterior restaura estado e vínculo', async () => {
    const harness = createHarness({ type: 'a_identificar', priorAsset: true });
    await assert.rejects(() => submit(harness, 'consumo'), /INTEGRITY_CONFLICT/);
    assert.deepEqual(harness.state(), harness.before);
    assert.equal(harness.calls.context.length, 0);
});

test('novo envio de NF permanente identificada preserva bem sem reler contexto', async () => {
    const harness = createHarness({ type: 'permanente', priorAsset: true });
    const result = await submit(harness);
    const { state, invoice } = assertImmediateState(harness, result);
    assert.equal(invoice.bemId, 'prior-asset');
    assert.deepEqual(state.assets, harness.before.assets);
    assert.equal(harness.calls.rpc[0].p_asset, null);
    assert.equal(harness.calls.context.length, 0);
});

test('retorno incompleto continua exigindo reconciliação canônica imediata', async () => {
    const harness = createHarness({ omitVerification: true });
    const result = await submit(harness);
    assertImmediateState(harness, result);
    assert.equal(harness.calls.context.length, 1);
});
