'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DOCUMENT_KEYS,
    buildPendencyContext,
    canRegisterFiscalNote,
    createEmptyVerification,
    evaluateBonification,
    getProgramOperationalStatus,
    pendencyMatchesContext,
    shouldRequireFiscalNote
} = require('../src/domain/fluxo-operacional.js');

const COMPLETE_APTA_BONIFICATION = {
    extCC: 'Sim',
    extINV: 'Sim',
    notaFiscal: 'Não se aplica',
    consAssessoria: 'Não se aplica',
    declBBAgil: 'Sim',
    encampInventario: 'Não se aplica'
};

const COMPLETE_ANALYSIS = Object.fromEntries(
    [
        ['extCC', 'Correto'],
        ['extINV', 'Correto (Atrasado)'],
        ['notaFiscal', 'Correto'],
        ['consAssessoria', 'Correto'],
        ['declBBAgil', 'Correto'],
        ['encampInventario', 'Correto']
    ]
);

test('cria a primeira verificação com os seis documentos vazios e não analisados', () => {
    assert.deepEqual(DOCUMENT_KEYS, [
        'extCC',
        'extINV',
        'notaFiscal',
        'consAssessoria',
        'declBBAgil',
        'encampInventario'
    ]);
    assert.deepEqual(createEmptyVerification(), {
        bonificacao: Object.fromEntries(DOCUMENT_KEYS.map(key => [key, ''])),
        analise: Object.fromEntries(DOCUMENT_KEYS.map(key => [key, 'Não analisado'])),
        resultadoBonif: ''
    });
});

test('consolida como apta quando os seis documentos possuem respostas válidas sem Não', () => {
    assert.deepEqual(evaluateBonification(COMPLETE_APTA_BONIFICATION), {
        canConsolidate: true,
        status: 'apta',
        missingFields: []
    });
});

test('consolida como inapta quando qualquer documento respondido é Não', () => {
    assert.deepEqual(evaluateBonification({
        ...COMPLETE_APTA_BONIFICATION,
        notaFiscal: 'Não'
    }), {
        canConsolidate: true,
        status: 'inapta',
        missingFields: []
    });
});

test('recusa consolidação e informa todos os documentos ausentes ou inválidos', () => {
    assert.deepEqual(evaluateBonification({
        extCC: 'Não se aplica',
        extINV: '',
        notaFiscal: 'Sim',
        consAssessoria: 'valor desconhecido',
        declBBAgil: 'Não se aplica',
        encampInventario: 'Não'
    }), {
        canConsolidate: false,
        status: null,
        missingFields: ['extCC', 'extINV', 'consAssessoria', 'declBBAgil']
    });
});

test('programa só fica apta com bonificação apta e as seis análises corretas', () => {
    assert.equal(getProgramOperationalStatus({
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: COMPLETE_ANALYSIS,
        resultadoBonif: 'apta'
    }), 'apta');

    assert.equal(getProgramOperationalStatus({
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: { ...COMPLETE_ANALYSIS, notaFiscal: 'Não analisado' },
        resultadoBonif: 'apta'
    }), 'em-andamento');
});

test('programa fica inapta por consolidação inapta ou qualquer análise incorreta', () => {
    assert.equal(getProgramOperationalStatus({
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: COMPLETE_ANALYSIS,
        resultadoBonif: 'inapta'
    }), 'inapta');

    assert.equal(getProgramOperationalStatus({
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: { ...COMPLETE_ANALYSIS, consAssessoria: 'Incorreto' },
        resultadoBonif: 'apta'
    }), 'inapta');
});

test('distingue verificação vazia de estado parcialmente preenchido', () => {
    assert.equal(getProgramOperationalStatus(), 'nao-lancado');
    assert.equal(getProgramOperationalStatus(createEmptyVerification()), 'nao-lancado');
    assert.equal(getProgramOperationalStatus({
        ...createEmptyVerification(),
        bonificacao: { ...createEmptyVerification().bonificacao, notaFiscal: 'Sim' }
    }), 'em-andamento');
});

test('permite cadastrar nota após entrega Sim apenas para perfis editáveis', () => {
    assert.equal(canRegisterFiscalNote('controlador', 'Sim'), true);
    assert.equal(canRegisterFiscalNote('assistente', 'Sim'), true);
    assert.equal(canRegisterFiscalNote('inventario', 'Sim'), false);
    assert.equal(canRegisterFiscalNote('sme', 'Sim'), false);
    assert.equal(canRegisterFiscalNote('controlador', 'Não'), false);
    assert.equal(canRegisterFiscalNote('controlador', 'Não se aplica'), false);
});

test('exige nota somente ao tentar aprovar entrega Sim ainda sem cadastro', () => {
    assert.equal(shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto',
        fiscalNotes: []
    }), true);
    assert.equal(shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto (Atrasado)',
        fiscalNotes: []
    }), true);
    assert.equal(shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto',
        fiscalNotes: [{ id: 'nf-1' }]
    }), false);
    assert.equal(shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Não',
        analiseValue: 'Correto',
        fiscalNotes: []
    }), false);
    assert.equal(shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Incorreto',
        fiscalNotes: []
    }), false);
});

test('preserva o programa completo ao criar contexto de pendência pela chave composta', () => {
    assert.deepEqual(buildPendencyContext({
        compProgKey: '2026-05_ED_FAMILIA',
        programaNome: 'Educação e Família',
        documentoKey: 'extCC',
        documentoNome: 'Extrato Conta Corrente'
    }), {
        competencia: '2026-05',
        programaId: 'ED_FAMILIA',
        documentoKey: 'extCC',
        documentoNome: 'Extrato Conta Corrente',
        item: 'Educação e Família - Extrato Conta Corrente'
    });

    assert.equal(buildPendencyContext({
        compProgKey: '2026-05_TEMPO_APRENDER',
        programaNome: 'Tempo de Aprender',
        documentoKey: 'extCC',
        documentoNome: 'Extrato Conta Corrente'
    }).programaId, 'TEMPO_APRENDER');
});

test('distingue o mesmo documento em programas diferentes pelo contexto estruturado', () => {
    const context = buildPendencyContext({
        compProgKey: '2026-05_ED_FAMILIA',
        programaNome: 'Educação e Família',
        documentoKey: 'extCC',
        documentoNome: 'Extrato Conta Corrente'
    });

    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        programaId: 'ED_FAMILIA',
        documentoKey: 'extCC',
        item: context.item
    }, context), true);
    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        programaId: 'TEMPO_APRENDER',
        documentoKey: 'extCC',
        item: context.item
    }, context), false);
    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        programaId: 'ED_FAMILIA',
        documentoKey: 'notaFiscal',
        item: context.item
    }, context), false);
});

test('mantém compatibilidade com pendências antigas pelo item completo ou documento', () => {
    const context = buildPendencyContext({
        compProgKey: '2026-05_ED_FAMILIA',
        programaNome: 'Educação e Família',
        documentoKey: 'extCC',
        documentoNome: 'Extrato Conta Corrente'
    });

    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        item: 'Educação e Família - Extrato Conta Corrente'
    }, context), true);
    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        item: 'Extrato Conta Corrente'
    }, context), true);
    assert.equal(pendencyMatchesContext({
        competencia: '2026-05',
        item: 'Notas Fiscais'
    }, context), false);
});
