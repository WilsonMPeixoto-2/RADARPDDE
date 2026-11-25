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

test('targetId é a identidade persistida, nunca o número de exibição de outra tentativa', () => {
    const original = samplePendency();
    original.tentativas[0].numero = 2;
    original.tentativas[1].id = '2';
    original.tentativas[1].numero = 7;
    const result = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_submission', targetId: '2'
    });
    assert.deepEqual(result.attempts.map(attempt => attempt.id), ['T-1']);
    assert.equal(result.attempts[0].numero, 2);
});

test('excluir envio anterior preserva número, versão e resultado da tentativa posterior independente', () => {
    const original = samplePendency();
    original.rowVersion = 9;
    original.tentativas[1].rowVersion = 4;
    const preserved = structuredClone(original.tentativas[1]);
    const result = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_submission', targetId: 'T-1'
    });
    assert.deepEqual(result.attempts, [preserved]);
    assert.equal(result.pendency.rowVersion, 9);
    assert.equal(result.pendency.status, original.status);
    assert.equal(result.pendency.dataResolucao, original.dataResolucao);
    assert.equal(result.affectedAnalysis, null, 'nenhuma análise posterior independente é recalculada');
    assert.equal(original.tentativas.length, 2, 'o helper não modifica a entrada');
});

test('alvo ausente, identidade ausente ou duplicada devolvem ambiguidade sem inventar IDs ou análise', () => {
    for (const variant of ['target', 'missing-id', 'duplicate-id']) {
        const original = samplePendency();
        if (variant === 'target') original.tentativas = [original.tentativas[1]];
        if (variant === 'missing-id') delete original.tentativas[1].id;
        if (variant === 'duplicate-id') original.tentativas[1].id = original.tentativas[0].id;
        const before = structuredClone(original);
        const result = rebuildPendencyAfterCorrection({
            pendency: original,
            action: 'delete_review',
            ...(variant === 'target' ? {} : { targetId: 'T-1' })
        });
        assert.ok(result.ambiguity, variant);
        assert.equal(result.affectedAnalysis, null, variant);
        assert.deepEqual(result.pendency, before, variant);
        assert.deepEqual(result.attempts, before.tentativas, variant);
        assert.deepEqual(original, before, variant);
    }
});

test('correção de texto não desfaz cancelamento nem reabertura posterior independente', () => {
    for (const type of ['cancelamento', 'reabertura']) {
        const original = samplePendency();
        original.status = type === 'cancelamento' ? 'Cancelada' : 'Aberta';
        original.dataResolucao = null;
        original.proximoAtor = type === 'cancelamento' ? null : 'Escola';
        original.responsavel = original.proximoAtor;
        original.historico = [{ id: 'H-3', tipo: type, dataHora: '2026-10-13T10:00:00Z' }];
        if (type === 'cancelamento') original.cancelamento = { dataHora: '2026-10-13T10:00:00Z', justificativa: 'Duplicidade' };
        const result = rebuildPendencyAfterCorrection({
            pendency: original, action: 'correct_review', targetId: 'T-2',
            changes: { resultado: 'correto', observacaoAnalise: 'Texto corrigido' }
        });
        assert.equal(result.pendency.status, original.status, type);
        assert.equal(result.pendency.proximoAtor, original.proximoAtor, type);
        assert.equal(result.pendency.dataResolucao, null, type);
        assert.deepEqual(result.pendency.historico, original.historico, type);
        assert.deepEqual(result.pendency.cancelamento, original.cancelamento, type);
        assert.equal(result.attempts[1].observacaoAnalise, 'Texto corrigido', type);
        assert.equal(result.affectedAnalysis, null, type);
    }
});

test('exclusão de reanálise preserva reabertura posterior e exige evidência quando a sequência é ambígua', () => {
    const original = samplePendency();
    original.status = 'Aberta';
    original.dataResolucao = null;
    original.proximoAtor = 'Escola';
    original.responsavel = 'Escola';
    original.historico = [{ id: 'H-3', tipo: 'reabertura', dataHora: '2026-10-13T10:00:00Z' }];
    const preserved = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_review', targetId: 'T-2'
    });
    assert.equal(preserved.pendency.status, 'Aberta');
    assert.equal(preserved.pendency.proximoAtor, 'Escola');
    assert.equal(preserved.attempts[1].status, 'aguardando');
    assert.equal(preserved.affectedAnalysis, null);

    delete original.historico[0].dataHora;
    const ambiguous = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_review', targetId: 'T-2'
    });
    assert.ok(ambiguous.ambiguity);
    assert.deepEqual(ambiguous.pendency, original);
    assert.equal(ambiguous.affectedAnalysis, null);
});

test('a ordem do array não escolhe a tentativa vigente nem ressuscita envio substituído', () => {
    const original = samplePendency();
    original.tentativas.reverse();
    const corrected = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_review', targetId: 'T-2'
    });
    assert.equal(corrected.pendency.status, 'Aguardando reanálise');
    assert.equal(corrected.attempts[0].id, 'T-2');

    original.tentativas[1].status = 'substituida_antes_da_analise';
    const removed = rebuildPendencyAfterCorrection({
        pendency: original, action: 'delete_submission', targetId: 'T-2'
    });
    assert.equal(removed.pendency.status, 'Aberta');
    assert.equal(removed.affectedAnalysis, 'Incorreto');
    assert.equal(removed.attempts[0].status, 'substituida_antes_da_analise');
});

test('corrigir os erros da reanálise vigente atualiza sua projeção sem exigir mudança de resultado', () => {
    const original = samplePendency();
    original.status = 'Aberta';
    original.tentativas[1].resultado = 'incorreto';
    original.tentativas[1].errosEncontrados = ['Assinatura ausente'];
    const result = rebuildPendencyAfterCorrection({
        pendency: original, action: 'correct_review', targetId: 'T-2',
        changes: { resultado: 'incorreto', errosEncontrados: ['Valor divergente'] }
    });
    assert.deepEqual(result.pendency.errosAtuais, ['Valor divergente']);
    assert.equal(result.pendency.status, 'Aberta');
    assert.equal(result.affectedAnalysis, 'Incorreto');
});

test('reanálise anterior que pode sustentar os erros atuais exige alcance explícito enquanto o novo envio aguarda', () => {
    for (const action of ['correct_review', 'delete_review', 'delete_submission']) {
        const original = samplePendency();
        original.status = 'Aguardando reanálise';
        original.dataResolucao = null;
        original.responsavel = 'Controlador';
        original.proximoAtor = 'Controlador';
        original.tentativas[1].status = 'aguardando';
        original.tentativas[1].dataAnalise = null;
        original.tentativas[1].resultado = null;
        const before = structuredClone(original);
        const result = rebuildPendencyAfterCorrection({
            pendency: original, action, targetId: 'T-1',
            changes: { resultado: 'incorreto', errosEncontrados: ['Valor divergente'] }
        });
        assert.equal(result.ambiguity?.code, 'AMBIGUOUS_PENDENCY_HISTORY', action);
        assert.deepEqual(result.pendency, before, action);
        assert.deepEqual(result.attempts, before.tentativas, action);
        assert.equal(result.affectedAnalysis, null, action);
        assert.deepEqual(original, before, action);
    }
});
