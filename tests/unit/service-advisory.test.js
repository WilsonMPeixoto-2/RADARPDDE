'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    SERVICE_ADVISORY_ANALYSES,
    deriveServiceAdvisory,
    getServiceAdvisoryState,
    normalizeServiceAdvisoryAnalysis
} = require('../../src/domain/service-advisory.js');

function service(overrides = {}) {
    return {
        id: overrides.id || 'nota-1',
        tipo: 'servico',
        consultaAssessoriaEnviada: false,
        analiseConsultaAssessoria: 'Não analisado',
        ...overrides
    };
}

test('sem NF de serviço deriva Não se aplica, não enviada e Correto', () => {
    const result = deriveServiceAdvisory([
        { id: 'consumo-1', tipo: 'consumo' },
        { id: 'pendente-1', tipo: 'a_identificar' }
    ]);

    assert.deepEqual(result, {
        delivery: 'Não se aplica',
        sent: false,
        analysis: 'Correto',
        invoiceCount: 0
    });
});

test('uma NF de serviço nova começa como Não, não enviada e Não analisado', () => {
    assert.deepEqual(
        deriveServiceAdvisory([service()]),
        {
            delivery: 'Não',
            sent: false,
            analysis: 'Não analisado',
            invoiceCount: 1
        }
    );
});

test('parte das consultas enviadas mantém entrega Não e agrega análises individuais', () => {
    const result = deriveServiceAdvisory([
        service({
            id: 'nota-1',
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto'
        }),
        service({
            id: 'nota-2',
            consultaAssessoriaEnviada: false,
            analiseConsultaAssessoria: 'Correto'
        })
    ]);

    assert.equal(result.delivery, 'Não');
    assert.equal(result.sent, false);
    assert.equal(result.analysis, 'Correto');
    assert.equal(result.invoiceCount, 2);
});

test('todas as consultas enviadas produzem entrega Sim', () => {
    const result = deriveServiceAdvisory([
        service({
            id: 'nota-1',
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto'
        }),
        service({
            id: 'nota-2',
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto'
        })
    ]);

    assert.equal(result.delivery, 'Sim');
    assert.equal(result.sent, true);
    assert.equal(result.analysis, 'Correto');
});

test('Incorreto prevalece sobre qualquer outro estado de análise', () => {
    const result = deriveServiceAdvisory([
        service({ id: 'nota-1', analiseConsultaAssessoria: 'Correto (Atrasado)' }),
        service({ id: 'nota-2', analiseConsultaAssessoria: 'Não analisado' }),
        service({ id: 'nota-3', analiseConsultaAssessoria: 'Incorreto' })
    ]);

    assert.equal(result.analysis, 'Incorreto');
});

test('Não analisado prevalece sobre Correto (Atrasado)', () => {
    const result = deriveServiceAdvisory([
        service({ id: 'nota-1', analiseConsultaAssessoria: 'Correto (Atrasado)' }),
        service({ id: 'nota-2', analiseConsultaAssessoria: 'Não analisado' }),
        service({ id: 'nota-3', analiseConsultaAssessoria: 'Correto' })
    ]);

    assert.equal(result.analysis, 'Não analisado');
});

test('Correto (Atrasado) prevalece sobre Correto quando não há estado pior', () => {
    const result = deriveServiceAdvisory([
        service({ id: 'nota-1', analiseConsultaAssessoria: 'Correto' }),
        service({ id: 'nota-2', analiseConsultaAssessoria: 'Correto (Atrasado)' })
    ]);

    assert.equal(result.analysis, 'Correto (Atrasado)');
});

test('normaliza rótulo legado Correto após o prazo para Correto (Atrasado)', () => {
    assert.equal(
        normalizeServiceAdvisoryAnalysis('Correto após o prazo'),
        'Correto (Atrasado)'
    );
    assert.deepEqual(SERVICE_ADVISORY_ANALYSES, [
        'Não analisado',
        'Correto',
        'Correto (Atrasado)',
        'Incorreto'
    ]);
});

test('estado individual usa fallback legado somente quando a NF não possui valor próprio', () => {
    assert.deepEqual(
        getServiceAdvisoryState({}, {
            sent: true,
            analysis: 'Correto após o prazo'
        }),
        {
            sent: true,
            analysis: 'Correto (Atrasado)'
        }
    );

    assert.deepEqual(
        getServiceAdvisoryState({
            consultaAssessoriaEnviada: false,
            analiseConsultaAssessoria: 'Incorreto'
        }, {
            sent: true,
            analysis: 'Correto'
        }),
        {
            sent: false,
            analysis: 'Incorreto'
        }
    );
});

test('remoção da última NF de serviço reconverge a matriz para Não se aplica', () => {
    const before = deriveServiceAdvisory([
        service({
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto'
        })
    ]);
    const after = deriveServiceAdvisory([]);

    assert.equal(before.delivery, 'Sim');
    assert.equal(after.delivery, 'Não se aplica');
    assert.equal(after.sent, false);
    assert.equal(after.analysis, 'Correto');
});

test('conversão serviço para consumo retira a NF da regra e permanente para serviço a inclui', () => {
    const convertedToConsumption = deriveServiceAdvisory([
        { id: 'nota-1', tipo: 'consumo' }
    ]);
    const convertedToService = deriveServiceAdvisory([
        service({ id: 'nota-1' })
    ]);

    assert.equal(convertedToConsumption.invoiceCount, 0);
    assert.equal(convertedToConsumption.delivery, 'Não se aplica');
    assert.equal(convertedToService.invoiceCount, 1);
    assert.equal(convertedToService.delivery, 'Não');
});
