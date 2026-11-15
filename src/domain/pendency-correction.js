(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else if (root) {
        root.RadarPendencyCorrection = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const ATTEMPT_STATUS = Object.freeze({
        WAITING_REVIEW: 'aguardando',
        REVIEWED: 'analisada',
        SUPERSEDED: 'substituida_antes_da_analise'
    });

    const REVIEW_RESULTS = Object.freeze({
        CORRECT: 'correto',
        INCORRECT: 'incorreto',
        UNAVAILABLE: 'arquivo_indisponivel'
    });

    const PENDENCY_STATUS = Object.freeze({
        OPEN: 'Aberta',
        WAITING_REVIEW: 'Aguardando reanálise',
        RESOLVED: 'Resolvida',
        CANCELLED: 'Cancelada'
    });

    const ACTORS = Object.freeze({
        SCHOOL: 'Escola',
        CONTROLLER: 'Controlador'
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeErrors(errors) {
        if (!Array.isArray(errors)) return [];
        const unique = new Set();
        errors.forEach(item => {
            const normalized = text(item);
            if (normalized) unique.add(normalized);
        });
        return Array.from(unique);
    }

    function requiresLateCorrect({ bonusResult, deliveryStatus } = {}) {
        const consolidatedResults = ['apta', 'inapta'];
        return consolidatedResults.includes(text(bonusResult).toLowerCase())
            && text(deliveryStatus) === 'Não';
    }

    function cloneAttempt(attempt, index) {
        const raw = attempt && typeof attempt === 'object' ? attempt : {};
        return {
            ...raw,
            id: text(raw.id) || `tentativa-${index + 1}`,
            numero: Number(raw.numero) > 0 ? Number(raw.numero) : index + 1,
            dataDisponibilizacao: text(raw.dataDisponibilizacao || raw.date) || null,
            observacaoEscola: text(raw.observacaoEscola || raw.note),
            status: text(raw.status) || ATTEMPT_STATUS.WAITING_REVIEW,
            dataAnalise: text(raw.dataAnalise) || null,
            resultado: text(raw.resultado) ? text(raw.resultado).toLowerCase() : null,
            errosEncontrados: normalizeErrors(raw.errosEncontrados || raw.errors),
            observacaoAnalise: text(raw.observacaoAnalise)
        };
    }

    function resolveTargetAttemptIndex(attempts, targetId) {
        if (!attempts.length) {
            return { index: -1, ambiguity: null };
        }
        const normalizedTarget = text(targetId);
        if (normalizedTarget) {
            const idx = attempts.findIndex(item => (
                text(item.id) === normalizedTarget || String(item.numero) === normalizedTarget
            ));
            if (idx === -1) {
                throw new Error(`Tentativa alvo não encontrada na Pendência: ${normalizedTarget}`);
            }
            return { index: idx, ambiguity: null };
        }
        if (attempts.length > 1) {
            return {
                index: -1,
                ambiguity: {
                    code: 'AMBIGUOUS_ATTEMPT_TARGET',
                    message: 'A Pendência possui múltiplas tentativas; informe targetId explicitamente.',
                    candidates: attempts.map(item => item.id)
                }
            };
        }
        return { index: 0, ambiguity: null };
    }

    /**
     * Recompõe o estado da Pendência e da análise técnica vinculada a partir
     * do esquema real de `src/domain/pendencias.js` (`tentativas`) e da regra
     * real `requiresLateCorrect` de `src/domain/fluxo-operacional.js`.
     */
    function rebuildPendencyAfterCorrection({
        pendency,
        attempts: externalAttempts = null,
        action,
        targetId = null,
        changes = {},
        verification = {}
    } = {}) {
        if (!pendency || typeof pendency !== 'object') {
            throw new Error('Pendência inválida para recomposição.');
        }

        const nextPendency = JSON.parse(JSON.stringify(pendency));
        const sourceAttempts = Array.isArray(nextPendency.tentativas)
            ? nextPendency.tentativas
            : (Array.isArray(externalAttempts) ? externalAttempts : []);
        const attempts = sourceAttempts.map(cloneAttempt);

        const normalizedAction = text(action);
        const { index: targetIdx, ambiguity } = resolveTargetAttemptIndex(attempts, targetId);

        if (ambiguity) {
            return {
                pendency: nextPendency,
                attempts,
                affectedAnalysis: 'Incorreto',
                ambiguity
            };
        }

        if (normalizedAction === 'delete_review') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para excluir reanálise.');
            }
            const target = attempts[targetIdx];
            if (target.status !== ATTEMPT_STATUS.REVIEWED) {
                throw new Error('A tentativa selecionada não possui reanálise concluída para exclusão.');
            }
            target.status = ATTEMPT_STATUS.WAITING_REVIEW;
            target.dataAnalise = null;
            target.resultado = null;
            target.errosEncontrados = [];
            target.observacaoAnalise = '';
        } else if (normalizedAction === 'correct_review') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para corrigir reanálise.');
            }
            const target = attempts[targetIdx];
            const nextResult = text(changes.resultado || changes.result).toLowerCase();
            if (!Object.values(REVIEW_RESULTS).includes(nextResult)) {
                throw new Error(`Resultado de reanálise inválido: ${nextResult}`);
            }
            target.status = ATTEMPT_STATUS.REVIEWED;
            target.resultado = nextResult;
            target.dataAnalise = text(changes.dataAnalise || changes.date || target.dataAnalise) || null;
            target.observacaoAnalise = text(
                changes.observacaoAnalise !== undefined
                    ? changes.observacaoAnalise
                    : (changes.note !== undefined ? changes.note : target.observacaoAnalise)
            );
            target.errosEncontrados = nextResult === REVIEW_RESULTS.CORRECT
                ? []
                : normalizeErrors(changes.errosEncontrados || changes.errors || target.errosEncontrados);
        } else if (normalizedAction === 'delete_submission') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para excluir envio.');
            }
            attempts.splice(targetIdx, 1);
            attempts.forEach((item, index) => {
                item.numero = index + 1;
            });
        } else if (normalizedAction === 'correct_submission') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para corrigir envio.');
            }
            const target = attempts[targetIdx];
            if (changes.dataDisponibilizacao !== undefined || changes.date !== undefined) {
                target.dataDisponibilizacao = text(changes.dataDisponibilizacao ?? changes.date) || null;
            }
            if (changes.observacaoEscola !== undefined || changes.note !== undefined) {
                target.observacaoEscola = text(changes.observacaoEscola ?? changes.note);
            }
        } else {
            throw new Error(`Ação de correção de histórico desconhecida: ${normalizedAction}`);
        }

        const activeAttempts = attempts.filter(item => item.status !== ATTEMPT_STATUS.SUPERSEDED);
        const latest = activeAttempts.length ? activeAttempts[activeAttempts.length - 1] : null;
        let affectedAnalysis = 'Incorreto';

        if (!latest) {
            nextPendency.status = PENDENCY_STATUS.OPEN;
            nextPendency.responsavel = ACTORS.SCHOOL;
            nextPendency.proximoAtor = ACTORS.SCHOOL;
            nextPendency.dataResolucao = null;
        } else if (latest.status === ATTEMPT_STATUS.WAITING_REVIEW) {
            nextPendency.status = PENDENCY_STATUS.WAITING_REVIEW;
            nextPendency.responsavel = ACTORS.CONTROLLER;
            nextPendency.proximoAtor = ACTORS.CONTROLLER;
            nextPendency.dataResolucao = null;
            const previousReviewedIncorrect = activeAttempts
                .slice(0, -1)
                .reverse()
                .find(item => item.status === ATTEMPT_STATUS.REVIEWED && item.errosEncontrados.length > 0);
            if (previousReviewedIncorrect) {
                nextPendency.errosAtuais = normalizeErrors(previousReviewedIncorrect.errosEncontrados);
            }
        } else if (latest.status === ATTEMPT_STATUS.REVIEWED) {
            if (latest.resultado === REVIEW_RESULTS.CORRECT) {
                nextPendency.status = PENDENCY_STATUS.RESOLVED;
                nextPendency.responsavel = null;
                nextPendency.proximoAtor = null;
                nextPendency.dataResolucao = latest.dataAnalise || nextPendency.dataResolucao || null;
                const isLate = requiresLateCorrect({
                    bonusResult: verification.bonusResult ?? verification.resultadoBonif,
                    deliveryStatus: verification.deliveryStatus ?? verification.bonificationValue
                });
                affectedAnalysis = isLate ? 'Correto (Atrasado)' : 'Correto';
            } else {
                nextPendency.status = PENDENCY_STATUS.OPEN;
                nextPendency.responsavel = ACTORS.SCHOOL;
                nextPendency.proximoAtor = ACTORS.SCHOOL;
                nextPendency.dataResolucao = null;
                if (latest.errosEncontrados.length > 0) {
                    nextPendency.errosAtuais = normalizeErrors(latest.errosEncontrados);
                }
                affectedAnalysis = 'Incorreto';
            }
        }

        nextPendency.tentativas = attempts;

        return {
            pendency: nextPendency,
            attempts: nextPendency.tentativas,
            affectedAnalysis,
            ambiguity: null
        };
    }

    return Object.freeze({
        ATTEMPT_STATUS,
        REVIEW_RESULTS,
        PENDENCY_STATUS,
        ACTORS,
        requiresLateCorrect,
        rebuildPendencyAfterCorrection
    });
}));
