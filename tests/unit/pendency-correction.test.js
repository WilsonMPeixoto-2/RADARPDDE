'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { rebuildPendencyAfterCorrection } = require('../../src/domain/pendency-correction.js');

function samplePendency() {
    return {
        id: 'PEND-1',
        status: 'Resolvida',
        responsavel: null,
        proximoAtor: null,
        dataResolucao: '2026-10-12',
        errosAtuais: ['Assinatura ausente'],
        tentativas: [
            {
                id: 'T-1',
                numero: 1,
                dataDisponibilizacao: '2026-10-10',
                observacaoEscola: 'Primeiro envio',
                status: 'analisada',
                dataAnalise: '2026-10-11',
                resultado: 'incorreto',
                errosEncontrados: ['Assinatura ausente'],
                observacaoAnalise: 'Faltou assinatura'
            },
            {
                id: 'T-2',
                numero: 2,
                dataDisponibilizacao: '2026-10-12',
                observacaoEscola: 'Segundo envio assinado',
                status: 'analisada',
                dataAnalise: '2026-10-12',
                resultado: 'correto',
                errosEncontrados: [],
                observacaoAnalise: 'Documento conferido'
            }
        ]
    };
}

test('delete_review reabre a tentativa para aguardando e devolve Pendência para Aguardando reanálise (Controlador)', () => {
    const result = rebuildPendencyAfterCorrection({
        pendency: samplePendency(),
        action: 'delete_review',
        targetId: 'T-2',
        verification: { bonusResult: null, deliveryStatus: 'Sim' }
    });
    assert.equal(result.pendency.status, 'Aguardando reanálise');
    assert.equal(result.pendency.proximoAtor, 'Controlador');
    assert.equal(result.pendency.responsavel, 'Controlador');
    assert.equal(result.pendency.dataResolucao, null);
    assert.equal(result.affectedAnalysis, 'Incorreto');
    assert.equal(result.attempts[1].status, 'aguardando');
    assert.equal(result.attempts[1].resultado, null);
});

test('delete_submission remove a tentativa mais recente e preserva os erros da análise incorreta anterior', () => {
    const result = rebuildPendencyAfterCorrection({
        pendency: samplePendency(),
        action: 'delete_submission',
        targetId: 'T-2',
        verification: { bonusResult: null, deliveryStatus: 'Sim' }
    });
    assert.equal(result.attempts.length, 1);
    assert.equal(result.pendency.status, 'Aberta');
    assert.equal(result.pendency.proximoAtor, 'Escola');
    assert.deepEqual(result.pendency.errosAtuais, ['Assinatura ausente']);
    assert.equal(result.affectedAnalysis, 'Incorreto');
});

test('correct_review aplica Correto (Atrasado) quando bonificação consolidada teve entrega Não (regra real de fluxo-operacional.js)', () => {
    const pending = samplePendency();
    pending.status = 'Aberta';
    pending.tentativas[1].resultado = 'incorreto';
    pending.tentativas[1].errosEncontrados = ['Valor divergente'];

    const lateResult = rebuildPendencyAfterCorrection({
        pendency: pending,
        action: 'correct_review',
        targetId: 'T-2',
        changes: { resultado: 'correto', observacaoAnalise: 'Retificado na conferência' },
        verification: { bonusResult: 'inapta', deliveryStatus: 'Não' }
    });
    assert.equal(lateResult.pendency.status, 'Resolvida');
    assert.equal(lateResult.affectedAnalysis, 'Correto (Atrasado)');

    const normalResult = rebuildPendencyAfterCorrection({
        pendency: pending,
        action: 'correct_review',
        targetId: 'T-2',
        changes: { resultado: 'correto', observacaoAnalise: 'Retificado na conferência' },
        verification: { bonusResult: 'apta', deliveryStatus: 'Sim' }
    });
    assert.equal(normalResult.pendency.status, 'Resolvida');
    assert.equal(normalResult.affectedAnalysis, 'Correto');
});

test('targetId inexistente lança erro explícito e nunca modifica silenciosamente a última tentativa', () => {
    assert.throws(
        () => rebuildPendencyAfterCorrection({
            pendency: samplePendency(),
            action: 'delete_review',
            targetId: 'T-INEXISTENTE'
        }),
        /Tentativa alvo não encontrada/
    );
});

test('múltiplas tentativas sem targetId retornam ambiguidade explícita sem mutar a Pendência', () => {
    const original = samplePendency();
    const result = rebuildPendencyAfterCorrection({
        pendency: original,
        action: 'delete_review'
    });
    assert.equal(result.ambiguity?.code, 'AMBIGUOUS_ATTEMPT_TARGET');
    assert.deepEqual(result.ambiguity?.candidates, ['T-1', 'T-2']);
    assert.equal(result.pendency.status, 'Resolvida');
    assert.equal(result.attempts.length, 2);
});
