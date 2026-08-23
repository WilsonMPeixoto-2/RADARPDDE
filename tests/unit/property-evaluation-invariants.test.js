'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');

const fluxo = require('../../src/domain/fluxo-operacional.js');
const retificacoes = require('../../src/domain/retificacoes.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const { aggregateServiceAdvisories } = require('../../src/application/invoice-service.js');

const SEED = 20260823;

function createHarness() {
    const verification = {
        bonificacao: {
            extCC: '', extINV: '', notaFiscal: '', consAssessoria: '',
            declBBAgil: '', encampInventario: ''
        },
        analise: {
            extCC: 'Não analisado', extINV: 'Não analisado', notaFiscal: 'Não analisado',
            consAssessoria: 'Não analisado', declBBAgil: 'Não analisado',
            encampInventario: 'Não analisado'
        },
        resultadoBonif: ''
    };
    const state = {
        verifications: { 'ESC-1': { '2026-05_BASIC': verification } },
        registeredInvoices: [],
        pendencies: [],
        schools: [{ id: 'ESC-1' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        logs: []
    };
    const calls = [];
    const dataService = {
        async execute(command) {
            calls.push(command.name);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    const service = new VerificationService({
        dataService,
        getState: () => state,
        ensureVerification: () => verification,
        appendLog: (action, details) => {
            const log = { id: `log-${state.logs.length + 1}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentUser: () => ({ name: 'Teste', role: 'Controlador' }),
        getCurrentProfile: () => '',
        createId: prefix => `${prefix}-1`,
        now: () => '2026-08-23T12:00:00.000Z',
        fluxo,
        retificacoes,
        reopenConsolidation: (_schoolId, _compKey, target, changed) => {
            if (changed) target.resultadoBonif = '';
        }
    });
    return { service, state, verification, calls };
}

test('property: sair de N/A para Sim/Não nunca conserva análise fiscal artificialmente correta', async () => {
    await fc.assert(fc.asyncProperty(
        fc.constantFrom('Sim', 'Não'),
        async nextValue => {
            const harness = createHarness();
            await harness.service.setBonification({
                schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'notaFiscal',
                value: 'Não se aplica', profile: 'controlador'
            });
            await harness.service.setBonification({
                schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'notaFiscal',
                value: nextValue, profile: 'controlador'
            });

            assert.equal(harness.verification.bonificacao.notaFiscal, nextValue);
            assert.equal(harness.verification.analise.notaFiscal, 'Não analisado');
            assert.notEqual(harness.verification.bonificacao.consAssessoria, 'Não se aplica');
            assert.notEqual(harness.verification.bonificacao.encampInventario, 'Não se aplica');
        }
    ), { seed: SEED, numRuns: 20 });
});

test('property: repetir valor semanticamente igual é no-op sem persistência nem log', async () => {
    await fc.assert(fc.asyncProperty(
        fc.constantFrom('Sim', 'Não', 'Não se aplica'),
        async value => {
            const harness = createHarness();
            await harness.service.setBonification({
                schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'declBBAgil',
                value, profile: 'controlador'
            });
            const callsBefore = harness.calls.length;
            const logsBefore = harness.state.logs.length;
            const result = await harness.service.setBonification({
                schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey: 'declBBAgil',
                value, profile: 'controlador'
            });

            assert.equal(result.value.unchanged, true);
            assert.equal(harness.calls.length, callsBefore);
            assert.equal(harness.state.logs.length, logsBefore);
        }
    ), { seed: SEED, numRuns: 30 });
});

test('property: Incorreto nunca é persistido isoladamente pelo VerificationService', async () => {
    await fc.assert(fc.asyncProperty(
        fc.constantFrom('extCC', 'extINV', 'notaFiscal', 'consAssessoria', 'declBBAgil', 'encampInventario'),
        async documentKey => {
            const harness = createHarness();
            harness.verification.bonificacao[documentKey] = 'Sim';
            await assert.rejects(
                () => harness.service.setTechnicalAnalysis({
                    schoolId: 'ESC-1', compKey: '2026-05_BASIC', documentKey,
                    value: 'Incorreto', profile: 'controlador'
                }),
                error => error?.code === 'PENDENCY_REQUIRED'
            );
            assert.equal(harness.calls.length, 0);
            assert.notEqual(harness.verification.analise[documentKey], 'Incorreto');
        }
    ), { seed: SEED, numRuns: 30 });
});

test('property: alterar a Assessoria da NF A não altera o estado individual da NF B', () => {
    const analysisArbitrary = fc.constantFrom(
        'Não analisado', 'Correto', 'Correto (Atrasado)', 'Incorreto'
    );
    fc.assert(fc.property(
        analysisArbitrary,
        analysisArbitrary,
        fc.boolean(),
        fc.boolean(),
        (analysisA, analysisB, sentA, sentB) => {
            const invoices = [{
                id: 'A', tipo: 'servico', consultaAssessoriaEnviada: sentA,
                analiseConsultaAssessoria: analysisA
            }, {
                id: 'B', tipo: 'servico', consultaAssessoriaEnviada: sentB,
                analiseConsultaAssessoria: analysisB
            }];
            const siblingBefore = structuredClone(invoices[1]);
            const next = structuredClone(invoices);
            next[0].analiseConsultaAssessoria = analysisA === 'Incorreto' ? 'Correto' : 'Incorreto';
            aggregateServiceAdvisories(next);

            assert.deepEqual(next[1], siblingBefore);
            assert.deepEqual(invoices[1], siblingBefore);
        }
    ), { seed: SEED, numRuns: 100 });
});
