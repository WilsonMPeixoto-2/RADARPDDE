'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pendencyDomain = require('../../src/domain/pendencias.js');
const accessPolicy = require('../../src/domain/access-policy.js');

function freshIntegration() {
    const resolved = require.resolve('../../src/integration/service-advisory-corrective-submission.js');
    delete require.cache[resolved];
    return require(resolved);
}

function harness() {
    const state = {
        registeredInvoices: [{
            id: 'NF-A',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            tipo: 'servico',
            numero: '100',
            analiseConsultaAssessoria: 'Incorreto',
            rowVersion: 2
        }, {
            id: 'NF-B',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            tipo: 'servico',
            numero: '200',
            analiseConsultaAssessoria: 'Correto',
            rowVersion: 3
        }],
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': {
                    bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Sim', consEnviada: true },
                    analise: { notaFiscal: 'Correto', consAssessoria: 'Incorreto' },
                    resultadoBonif: 'apta',
                    rowVersion: 4
                }
            }
        },
        pendencies: [],
        logs: []
    };
    state.pendencies.push(pendencyDomain.createDocumentPendency({
        id: 'PEND-A',
        escolaId: 'ESC-1',
        competencia: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A',
        item: 'Consulta Assessoria — NF 100',
        erros: ['Dados divergentes'],
        observacao: 'Corrigir consulta.',
        dataAbertura: '2026-08-23'
    }, {
        eventId: 'EVENT-OPEN',
        at: '2026-08-23T10:00:00.000Z',
        usuario: 'Controlador',
        perfil: 'Controlador'
    }));
    state.pendencies[0].rowVersion = 5;

    let seq = 0;
    const genericCalls = [];
    const service = {
        dataService: {
            async execute(command) {
                return { ok: true, value: await command.mutate() };
            }
        },
        domain: pendencyDomain,
        getState: () => state,
        assertCapability: () => true,
        find(current, id) {
            const index = current.pendencies.findIndex(item => String(item.id) === String(id));
            return { index, pendency: current.pendencies[index] };
        },
        verificationFor(current, pendency) {
            return {
                verification: current.verifications[pendency.escolaId][
                    `${pendency.competenciaOrigem || pendency.competencia}_${pendency.programaId}`
                ]
            };
        },
        createId: prefix => `${prefix}-${++seq}`,
        audit: () => ({
            eventId: `event-${++seq}`,
            at: '2026-08-24T10:00:00.000Z',
            usuario: 'Controlador',
            perfil: 'Controlador'
        }),
        appendSchoolLog(_schoolId, action, details) {
            const log = { id: `log-${++seq}`, action, details };
            state.logs.push(log);
            return log;
        },
        decorateAdministrativeLog: value => value,
        async registerAttempt(input) {
            genericCalls.push(input);
            return { ok: true, value: { generic: true } };
        }
    };
    const invoices = {
        assertEditable: () => 'controlador',
        assertVerificationEditable: () => true,
        syncServiceRequirement(current, schoolId, compKey) {
            const verification = current.verifications[schoolId][compKey];
            const linked = current.registeredInvoices.filter(item => (
                item.escolaId === schoolId && item.compKey === compKey && item.tipo === 'servico'
            ));
            verification.analise.consAssessoria = linked.some(
                item => item.analiseConsultaAssessoria === 'Incorreto'
            ) ? 'Incorreto' : linked.some(
                item => item.analiseConsultaAssessoria === 'Não analisado'
            ) ? 'Não analisado' : 'Correto';
        }
    };
    const root = {
        RadarApplicationServices: { pendencies: service, invoices },
        RadarAccessPolicy: accessPolicy,
        RadarServiceAdvisoryPendency: {
            isLinkedServiceAdvisoryPendency(pendency) {
                return pendency?.documentoKey === 'consAssessoria'
                    && Boolean(pendency?.registeredInvoiceId);
            }
        }
    };
    return { root, state, service, genericCalls };
}

test('novo envio corretivo da Assessoria usa a NF vinculada e preserva outras NFs', async () => {
    const integration = freshIntegration();
    const h = harness();
    const bonificationBefore = structuredClone(
        h.state.verifications['ESC-1']['2026-08_BASIC'].bonificacao
    );
    const resultBefore = h.state.verifications['ESC-1']['2026-08_BASIC'].resultadoBonif;

    assert.equal(integration.install(h.root), true);

    const result = await h.service.registerAttempt({
        pendencyId: 'PEND-A',
        availabilityDate: '2026-08-24',
        observation: 'Arquivo corrigido.'
    });

    assert.equal(h.genericCalls.length, 0);
    assert.equal(result.value.invoice.id, 'NF-A');
    assert.equal(h.state.registeredInvoices[0].analiseConsultaAssessoria, 'Não analisado');
    assert.equal(h.state.registeredInvoices[1].analiseConsultaAssessoria, 'Correto');
    assert.equal(result.value.pendency.status, 'Aguardando reanálise');
    assert.equal(result.value.pendency.registeredInvoiceId, 'NF-A');
    assert.equal(result.value.pendency.tentativas.length, 1);
    assert.equal(
        h.state.verifications['ESC-1']['2026-08_BASIC'].analise.consAssessoria,
        'Não analisado'
    );
    assert.deepEqual(
        h.state.verifications['ESC-1']['2026-08_BASIC'].bonificacao,
        bonificationBefore
    );
    assert.equal(
        h.state.verifications['ESC-1']['2026-08_BASIC'].resultadoBonif,
        resultBefore
    );
});

test('Pendência não individual continua delegada ao registerAttempt canônico', async () => {
    const integration = freshIntegration();
    const h = harness();
    h.state.pendencies.push({
        id: 'PEND-GENERIC',
        documentoKey: 'extCC',
        escolaId: 'ESC-1'
    });

    assert.equal(integration.install(h.root), true);
    const result = await h.service.registerAttempt({ pendencyId: 'PEND-GENERIC' });

    assert.equal(result.value.generic, true);
    assert.equal(h.genericCalls.length, 1);
});
