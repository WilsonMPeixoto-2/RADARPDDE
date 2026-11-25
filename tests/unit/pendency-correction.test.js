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
    // T5 / flexibilização §7: sem revisão válida restante, não inventar erro.
    assert.equal(removed.affectedAnalysis, 'Não analisado');
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

test('T5 correct_attempt altera apenas texto/link do envio explícito e preserva fato, autoria e entrada original', () => {
    const pendency = samplePendency();
    Object.assign(pendency.tentativas[0], {
        link: 'https://example.test/original',
        dataRegistro: '2026-10-10T14:03:00.000Z',
        createdBy: 'autor-do-envio',
        registradoPor: 'Autor original',
        analisadoPor: 'Revisor original',
        rowVersion: 8
    });
    const before = structuredClone(pendency);
    const result = rebuildPendencyAfterCorrection({
        pendency, action: 'correct_attempt', targetId: 'T-1',
        changes: { observation: '', driveUrl: 'https://example.test/corrigido' }
    });
    assert.equal(result.attempts[0].link, 'https://example.test/corrigido');
    assert.equal(result.attempts[0].observacaoEscola, '');
    assert.equal(result.attempts[0].resultado, 'incorreto');
    assert.equal(result.attempts[0].dataAnalise, before.tentativas[0].dataAnalise);
    assert.equal(result.attempts[0].dataRegistro, before.tentativas[0].dataRegistro);
    assert.equal(result.attempts[0].createdBy, 'autor-do-envio');
    assert.equal(result.attempts[0].analisadoPor, 'Revisor original');
    assert.equal(result.attempts[0].rowVersion, 8);
    assert.deepEqual(result.attempts[1], before.tentativas[1]);
    assert.equal(result.pendency.status, before.status);
    assert.equal(result.affectedAnalysis, null);
    assert.deepEqual(pendency, before);
});

test('T5 correct_review aceita somente observação vazia sem fabricar outra reanálise', () => {
    const pendency = samplePendency();
    const before = structuredClone(pendency);
    const result = rebuildPendencyAfterCorrection({
        pendency, action: 'correct_review', targetId: 'T-2', changes: { observation: '' }
    });
    assert.equal(result.attempts[1].observacaoAnalise, '');
    assert.equal(result.attempts[1].resultado, 'correto');
    assert.equal(result.attempts[1].dataAnalise, before.tentativas[1].dataAnalise);
    assert.deepEqual(result.attempts[1].errosEncontrados, before.tentativas[1].errosEncontrados);
    assert.equal(result.pendency.dataResolucao, before.dataResolucao);
    assert.equal(result.affectedAnalysis, null);
    assert.deepEqual(pendency, before);
});

test('T5 corrigir disponibilização atravessa o prazo nos dois sentidos sem mudar resultado, registro ou bonificação', () => {
    const pendency = samplePendency();
    pendency.tentativas[1].dataRegistro = '2026-10-12T08:30:00.000Z';
    const verification = { bonusResult: 'apta', deliveryStatus: 'Sim', bonusDeadline: '2026-10-13' };
    const before = structuredClone({ pendency, verification });
    const late = rebuildPendencyAfterCorrection({
        pendency, action: 'correct_attempt', targetId: 'T-2',
        changes: { availableAt: '2026-10-14' }, verification
    });
    assert.equal(late.affectedAnalysis, 'Correto (Atrasado)');
    assert.equal(late.pendency.status, 'Resolvida');
    assert.equal(late.attempts[1].resultado, 'correto');
    assert.equal(late.attempts[1].dataRegistro, '2026-10-12T08:30:00.000Z');
    const onTime = rebuildPendencyAfterCorrection({
        pendency: late.pendency, action: 'correct_attempt', targetId: 'T-2',
        changes: { availableAt: '2026-10-13' },
        verification: { bonusResult: 'apta', deliveryStatus: 'Sim', bonifPrazo: '2026-10-13' }
    });
    assert.equal(onTime.affectedAnalysis, 'Correto');
    assert.equal(onTime.pendency.dataResolucao, before.pendency.dataResolucao);
    assert.deepEqual({ pendency, verification }, before);
});

test('T5 data no prazo não desfaz proteção de entrega Não já consolidada', () => {
    const result = rebuildPendencyAfterCorrection({
        pendency: samplePendency(), action: 'correct_attempt', targetId: 'T-2',
        changes: { availableAt: '2026-10-10' },
        verification: { bonusResult: 'inapta', deliveryStatus: 'Não', bonusDeadline: '2026-10-13' }
    });
    assert.equal(result.affectedAnalysis, 'Correto (Atrasado)');
});

test('T5 excluir única reanálise limpa seus metadados sem apagar autoria e registro do envio', () => {
    const pendency = samplePendency();
    pendency.tentativas = [pendency.tentativas[1]];
    Object.assign(pendency.tentativas[0], {
        dataRegistro: '2026-10-12T08:30:00.000Z',
        createdBy: 'autor-do-envio',
        analisadoPor: 'Revisora', analisadoPorId: 'revisor-1',
        authenticatedRoleAnalise: 'federal_assistant', actingProfileAnalise: 'assistente'
    });
    const result = rebuildPendencyAfterCorrection({ pendency, action: 'delete_review', targetId: 'T-2' });
    const attempt = result.attempts[0];
    assert.equal(attempt.status, 'aguardando');
    assert.equal(attempt.resultado, null);
    assert.equal(attempt.dataAnalise, null);
    assert.deepEqual(attempt.errosEncontrados, []);
    for (const field of ['analisadoPor', 'analisadoPorId', 'authenticatedRoleAnalise', 'actingProfileAnalise']) {
        assert.ok(!attempt[field], `${field} pertence à reanálise removida`);
    }
    assert.equal(attempt.createdBy, 'autor-do-envio');
    assert.equal(attempt.dataRegistro, '2026-10-12T08:30:00.000Z');
    assert.equal(result.pendency.status, 'Aguardando reanálise');
    assert.equal(result.pendency.dataResolucao, null);
    assert.equal(result.affectedAnalysis, 'Não analisado');
});

test('T5 excluir reanálise histórica remove só evento causal por tentativaId e conserva envio/reabertura posteriores', () => {
    const pendency = samplePendency();
    pendency.historico = [
        { id: 'send-1', tipo: 'novo_envio', tentativaId: 'T-1', dataHora: '2026-10-10T10:00:00Z' },
        { id: 'review-1', tipo: 'reanalise_incorreta', tentativaId: 'T-1', dataHora: '2026-10-11T10:00:00Z' },
        { id: 'send-2', tipo: 'novo_envio', tentativaId: 'T-2', dataHora: '2026-10-12T10:00:00Z' },
        { id: 'review-2', tipo: 'reanalise_correta', tentativaId: 'T-2', dataHora: '2026-10-12T12:00:00Z' },
        { id: 'independent', tipo: 'reabertura', dataHora: '2026-10-13T12:00:00Z', descricao: 'Outro fato independente' }
    ];
    const before = structuredClone(pendency);
    const result = rebuildPendencyAfterCorrection({ pendency, action: 'delete_review', targetId: 'T-1' });
    assert.deepEqual(result.pendency.historico.map(event => event.id), ['send-1', 'send-2', 'review-2', 'independent']);
    assert.deepEqual(result.attempts[1], before.tentativas[1]);
    assert.equal(result.pendency.status, before.status);
    assert.equal(result.affectedAnalysis, null);
    assert.deepEqual(pendency, before);
});

test('T5 excluir último envio não ressuscita substituído nem mantém resultado e erros que perderam sustentação', () => {
    const pendency = samplePendency();
    Object.assign(pendency.tentativas[0], {
        status: 'substituida_antes_da_analise', dataAnalise: null,
        resultado: null, errosEncontrados: [], observacaoAnalise: ''
    });
    const before = structuredClone(pendency);
    const result = rebuildPendencyAfterCorrection({ pendency, action: 'delete_attempt', targetId: 'T-2' });
    assert.deepEqual(result.attempts.map(attempt => [attempt.id, attempt.numero, attempt.status]), [
        ['T-1', 1, 'substituida_antes_da_analise']
    ]);
    assert.equal(result.pendency.status, 'Aberta');
    assert.equal(result.pendency.proximoAtor, 'Escola');
    assert.equal(result.pendency.dataResolucao, null);
    assert.deepEqual(result.pendency.errosAtuais, []);
    assert.equal(result.affectedAnalysis, 'Não analisado');
    assert.deepEqual(pendency, before);
});

test('T5 resultado corrigido para correto limpa apontamentos atuais sem reescrever erros históricos', () => {
    const pendency = samplePendency();
    pendency.status = 'Aberta';
    pendency.dataResolucao = null;
    pendency.tentativas[1].resultado = 'incorreto';
    pendency.tentativas[1].errosEncontrados = ['Valor divergente'];
    pendency.errosAtuais = ['Valor divergente'];
    const originalErrors = structuredClone(pendency.tentativas[0].errosEncontrados);
    const result = rebuildPendencyAfterCorrection({
        pendency, action: 'correct_review', targetId: 'T-2',
        changes: { result: 'correto', errors: [], observation: '' }
    });
    assert.deepEqual(result.pendency.errosAtuais, []);
    assert.equal(result.pendency.status, 'Resolvida');
    assert.equal(result.pendency.dataResolucao, '2026-10-12');
    assert.deepEqual(result.attempts[0].errosEncontrados, originalErrors);
    assert.equal(result.affectedAnalysis, 'Correto');
});

test('T5 data de envio aguardando não restaura análise incorreta antiga nem cria resultado para envio sem revisão', () => {
    const pendency = samplePendency();
    pendency.status = 'Aguardando reanálise';
    pendency.responsavel = 'Controlador';
    pendency.proximoAtor = 'Controlador';
    pendency.dataResolucao = null;
    Object.assign(pendency.tentativas[1], {
        status: 'aguardando', resultado: null, dataAnalise: null,
        errosEncontrados: [], observacaoAnalise: ''
    });
    const before = structuredClone(pendency);
    const result = rebuildPendencyAfterCorrection({
        pendency, action: 'correct_attempt', targetId: 'T-2',
        changes: { availableAt: '2026-10-20' },
        verification: { bonusDeadline: '2026-10-13', bonusResult: 'apta', deliveryStatus: 'Sim' }
    });
    assert.equal(result.attempts[1].dataDisponibilizacao, '2026-10-20');
    assert.equal(result.attempts[1].resultado, null);
    assert.equal(result.attempts[1].dataAnalise, null);
    assert.equal(result.pendency.status, 'Aguardando reanálise');
    assert.deepEqual(result.pendency.errosAtuais, before.errosAtuais);
    assert.equal(result.affectedAnalysis, null);
    assert.deepEqual(result.attempts[0], before.tentativas[0]);
    assert.deepEqual(pendency, before);
});
