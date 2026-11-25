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

    function cloneAttempt(attempt) {
        const raw = attempt && typeof attempt === 'object' ? attempt : {};
        // Identidade, sequência e versão pertencem ao registro persistido.
        // Corrigir um alvo não normaliza nem renumera os demais registros.
        return JSON.parse(JSON.stringify(raw));
    }

    function resolveTargetAttemptIndex(attempts, targetId) {
        if (!attempts.length) {
            return { index: -1, ambiguity: null };
        }
        const ids = attempts.map(item => text(item.id));
        if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
            return { index: -1, ambiguity: {
                code: 'AMBIGUOUS_ATTEMPT_IDENTITY',
                message: 'Há tentativas sem identidade única; confira o registro original antes de corrigir.',
                candidates: [...new Set(ids.filter(Boolean))]
            } };
        }
        const normalizedTarget = text(targetId);
        if (normalizedTarget) {
            const idx = attempts.findIndex(item => text(item.id) === normalizedTarget);
            if (idx === -1) {
                throw new Error(`Tentativa alvo não encontrada na Pendência: ${normalizedTarget}`);
            }
            return { index: idx, ambiguity: null };
        }
        return {
            index: -1,
            ambiguity: {
                code: 'AMBIGUOUS_ATTEMPT_TARGET',
                message: 'Informe a identidade da tentativa que será corrigida.',
                candidates: ids
            }
        };
    }

    function activeAttemptsInOrder(attempts) {
        return attempts.filter(item => text(item.status) !== ATTEMPT_STATUS.SUPERSEDED)
            .sort((left, right) => Number(left.numero) - Number(right.numero));
    }

    function projectionScope(pendency, attempts, targetId) {
        if (text(pendency.status) === PENDENCY_STATUS.CANCELLED) return 'preserve';
        const numbers = attempts.map(item => Number(item.numero));
        if (numbers.some(number => !Number.isInteger(number) || number < 1)
            || new Set(numbers).size !== numbers.length
            || attempts.some(item => !Object.values(ATTEMPT_STATUS).includes(text(item.status)))) {
            return 'ambiguous';
        }
        const latest = activeAttemptsInOrder(attempts).at(-1);
        if (!latest) return 'preserve';
        if (text(latest.id) !== text(targetId)) {
            const target = attempts.find(item => text(item.id) === text(targetId));
            // Um envio ainda não analisado pode continuar exibindo erros de uma
            // reanálise anterior. A posição do alvo não prova independência.
            if (latest.status === ATTEMPT_STATUS.WAITING_REVIEW
                && target?.status === ATTEMPT_STATUS.REVIEWED) return 'ambiguous';
            return 'preserve';
        }

        const stateEvents = (Array.isArray(pendency.historico) ? pendency.historico : [])
            .filter(event => ['cancelamento', 'reabertura'].includes(text(event?.tipo)));
        if (stateEvents.length) {
            const attemptAt = Date.parse(latest.status === ATTEMPT_STATUS.REVIEWED
                ? latest.dataAnalise : latest.dataRegistro || latest.dataDisponibilizacao);
            const eventTimes = stateEvents.map(event => Date.parse(event.dataHora));
            if (!Number.isFinite(attemptAt) || eventTimes.some(time => !Number.isFinite(time))) return 'ambiguous';
            const lastStateAt = Math.max(...eventTimes);
            if (lastStateAt === attemptAt) return 'ambiguous';
            if (lastStateAt > attemptAt) return 'preserve';
        }
        const expectedStatus = latest.status === ATTEMPT_STATUS.WAITING_REVIEW
            ? PENDENCY_STATUS.WAITING_REVIEW
            : text(latest.resultado).toLowerCase() === REVIEW_RESULTS.CORRECT
                ? PENDENCY_STATUS.RESOLVED : PENDENCY_STATUS.OPEN;
        return text(pendency.status) === expectedStatus ? 'rebuild' : 'ambiguous';
    }

    /**
     * Recompõe o estado da Pendência e da análise técnica vinculada a partir
     * do esquema real de `src/domain/pendencias.js` (`tentativas`) e da regra
     * real `requiresLateCorrect` de `src/domain/fluxo-operacional.js`.
     * Helper preparatório T5, sem persistência. affectedAnalysis=null significa
     * preservar a análise vigente; ambiguidade nunca fornece uma recomposição.
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
            : (Array.isArray(externalAttempts) ? externalAttempts.map(cloneAttempt) : []);
        const attempts = sourceAttempts.map(cloneAttempt);

        const normalizedAction = text(action);
        const { index: targetIdx, ambiguity } = resolveTargetAttemptIndex(attempts, targetId);

        if (ambiguity) {
            return {
                pendency: nextPendency,
                attempts: sourceAttempts,
                affectedAnalysis: null,
                ambiguity
            };
        }

        let changesProjection = true;

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
            if (target.status !== ATTEMPT_STATUS.REVIEWED) {
                throw new Error('A tentativa selecionada não possui reanálise concluída para correção.');
            }
            const nextResult = text(changes.resultado || changes.result).toLowerCase();
            if (!Object.values(REVIEW_RESULTS).includes(nextResult)) {
                throw new Error(`Resultado de reanálise inválido: ${nextResult}`);
            }
            const nextDate = text(changes.dataAnalise || changes.date || target.dataAnalise) || null;
            const nextErrors = nextResult === REVIEW_RESULTS.CORRECT
                ? [] : normalizeErrors(changes.errosEncontrados || changes.errors || target.errosEncontrados);
            changesProjection = nextResult !== text(target.resultado).toLowerCase()
                || nextDate !== (text(target.dataAnalise) || null)
                || JSON.stringify(nextErrors) !== JSON.stringify(normalizeErrors(target.errosEncontrados));
            target.resultado = nextResult;
            target.dataAnalise = nextDate;
            target.observacaoAnalise = text(
                changes.observacaoAnalise !== undefined
                    ? changes.observacaoAnalise
                    : (changes.note !== undefined ? changes.note : target.observacaoAnalise)
            );
            target.errosEncontrados = nextErrors;
        } else if (normalizedAction === 'delete_submission') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para excluir envio.');
            }
            attempts.splice(targetIdx, 1);
        } else if (normalizedAction === 'correct_submission') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para corrigir envio.');
            }
            const target = attempts[targetIdx];
            changesProjection = false;
            if (changes.dataDisponibilizacao !== undefined || changes.date !== undefined) {
                const nextDate = text(changes.dataDisponibilizacao ?? changes.date) || null;
                changesProjection = nextDate !== (text(target.dataDisponibilizacao) || null);
                target.dataDisponibilizacao = nextDate;
            }
            if (changes.observacaoEscola !== undefined || changes.note !== undefined) {
                target.observacaoEscola = text(changes.observacaoEscola ?? changes.note);
            }
        } else {
            throw new Error(`Ação de correção de histórico desconhecida: ${normalizedAction}`);
        }

        const scope = changesProjection ? projectionScope(nextPendency, sourceAttempts, targetId) : 'preserve';
        if (scope === 'ambiguous') {
            return {
                pendency: nextPendency,
                attempts: sourceAttempts,
                affectedAnalysis: null,
                ambiguity: {
                    code: 'AMBIGUOUS_PENDENCY_HISTORY',
                    message: 'O histórico não comprova qual estado depende desta tentativa; confira a sequência antes de corrigir.',
                    candidates: sourceAttempts.map(item => item.id)
                }
            };
        }
        if (scope === 'preserve') {
            nextPendency.tentativas = attempts;
            return { pendency: nextPendency, attempts, affectedAnalysis: null, ambiguity: null };
        }

        const activeAttempts = activeAttemptsInOrder(attempts);
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
                .find(item => item.status === ATTEMPT_STATUS.REVIEWED && normalizeErrors(item.errosEncontrados).length > 0);
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
                if (normalizeErrors(latest.errosEncontrados).length > 0) {
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
