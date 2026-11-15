'use strict';

(function installRadarPendencyCorrection(root) {
    const ACTIVE_STATUSES = new Set(['Aberta', 'Aguardando reanálise']);
    const VALID_REVIEW_RESULTS = new Set([
        'Correto',
        'Correto (Atrasado)',
        'Incorreto',
        'Arquivo não localizado ou inacessível'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function clone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function computeLateAnalysis(submissionDate, cutoffDate, requiresLateCorrect = false) {
        if (requiresLateCorrect) return 'Correto (Atrasado)';
        const sub = text(submissionDate);
        const cutoff = text(cutoffDate);
        if (sub && cutoff && sub > cutoff) {
            return 'Correto (Atrasado)';
        }
        return 'Correto';
    }

    function rebuildPendencyAfterCorrection(input = {}) {
        const pendency = clone(input.pendency || {});
        const attempts = Array.isArray(input.attempts) ? clone(input.attempts) : [];
        const action = text(input.action);
        const targetId = text(input.targetId);
        const changes = input.changes || {};

        const targetIndex = attempts.findIndex(item => text(item?.id) === targetId);
        if (targetIndex === -1) {
            return {
                pendency,
                attempts,
                affectedAnalysis: null,
                ambiguity: {
                    code: 'TARGET_ATTEMPT_NOT_FOUND',
                    message: 'A tentativa ou reanálise indicada não foi localizada na sequência.'
                }
            };
        }

        const target = attempts[targetIndex];
        const isLastEvent = targetIndex === attempts.length - 1;
        const laterEvents = attempts.slice(targetIndex + 1);

        if (action === 'correct_attempt') {
            if (Object.prototype.hasOwnProperty.call(changes, 'note')) {
                target.note = text(changes.note);
            }
            if (Object.prototype.hasOwnProperty.call(changes, 'link')) {
                target.link = text(changes.link);
            }
            let affectedAnalysis = null;
            if (Object.prototype.hasOwnProperty.call(changes, 'date') && text(changes.date)) {
                target.date = text(changes.date);
                const linkedReview = laterEvents.find(ev => text(ev?.kind) === 'review');
                if (linkedReview && (linkedReview.result === 'Correto' || linkedReview.result === 'Correto (Atrasado)')) {
                    const recomputed = computeLateAnalysis(
                        target.date,
                        pendency.cutoffDate || pendency.dataLimite,
                        Boolean(pendency.requiresLateCorrect)
                    );
                    linkedReview.result = recomputed;
                    affectedAnalysis = recomputed;
                }
            }
            return { pendency, attempts, affectedAnalysis, ambiguity: null };
        }

        if (action === 'correct_review') {
            if (Object.prototype.hasOwnProperty.call(changes, 'note')) {
                target.note = text(changes.note);
            }
            if (Object.prototype.hasOwnProperty.call(changes, 'result')) {
                const nextResult = text(changes.result);
                if (!VALID_REVIEW_RESULTS.has(nextResult)) {
                    return {
                        pendency,
                        attempts,
                        affectedAnalysis: null,
                        ambiguity: {
                            code: 'INVALID_REVIEW_RESULT',
                            message: 'Resultado de reanálise inválido.'
                        }
                    };
                }
                if (!isLastEvent && laterEvents.some(ev => text(ev?.kind) === 'submission')) {
                    return {
                        pendency,
                        attempts,
                        affectedAnalysis: null,
                        ambiguity: {
                            code: 'DEPENDENT_SUBSEQUENT_SUBMISSIONS',
                            message: 'Existem novos envios posteriores a esta reanálise. Escolha se deseja recompor a sequência atual ou excluir o conjunto.',
                            options: ['recompose_current', 'delete_pendency']
                        }
                    };
                }
                target.result = nextResult;
                if (nextResult === 'Correto' || nextResult === 'Correto (Atrasado)') {
                    pendency.status = 'Resolvida';
                    pendency.nextActor = null;
                    return { pendency, attempts, affectedAnalysis: nextResult, ambiguity: null };
                }
                pendency.status = 'Aberta';
                pendency.nextActor = 'Escola';
                if (Array.isArray(changes.errors) && changes.errors.length > 0) {
                    target.errors = clone(changes.errors);
                    pendency.errors = clone(changes.errors);
                }
                return { pendency, attempts, affectedAnalysis: 'Incorreto', ambiguity: null };
            }
            return { pendency, attempts, affectedAnalysis: null, ambiguity: null };
        }

        if (action === 'delete_review') {
            if (text(target.kind) !== 'review') {
                return {
                    pendency,
                    attempts,
                    affectedAnalysis: null,
                    ambiguity: {
                        code: 'TARGET_NOT_REVIEW',
                        message: 'O evento selecionado não é uma reanálise.'
                    }
                };
            }
            const hasSubsequentSubmission = laterEvents.some(ev => text(ev?.kind) === 'submission');
            const hasIndependentCancel = pendency.status === 'Cancelada' && Boolean(pendency.cancelledIndependently);
            attempts.splice(targetIndex, 1);

            if (hasIndependentCancel || hasSubsequentSubmission) {
                return { pendency, attempts, affectedAnalysis: null, ambiguity: null };
            }

            const lastRemaining = attempts[attempts.length - 1] || null;
            if (lastRemaining && text(lastRemaining.kind) === 'submission') {
                pendency.status = 'Aguardando reanálise';
                pendency.nextActor = 'Controlador';
                delete pendency.resolvedAt;
                return { pendency, attempts, affectedAnalysis: 'Incorreto', ambiguity: null };
            }

            pendency.status = 'Aberta';
            pendency.nextActor = 'Escola';
            delete pendency.resolvedAt;
            return { pendency, attempts, affectedAnalysis: 'Incorreto', ambiguity: null };
        }

        if (action === 'delete_attempt') {
            if (text(target.kind) !== 'submission') {
                return {
                    pendency,
                    attempts,
                    affectedAnalysis: null,
                    ambiguity: {
                        code: 'TARGET_NOT_SUBMISSION',
                        message: 'O evento selecionado não é um envio.'
                    }
                };
            }

            const hasDependentReviewImmediatelyAfter = laterEvents.length > 0
                && text(laterEvents[0]?.kind) === 'review';
            if (hasDependentReviewImmediatelyAfter && laterEvents.length > 1) {
                return {
                    pendency,
                    attempts,
                    affectedAnalysis: null,
                    ambiguity: {
                        code: 'AMBIGUOUS_INTERMEDIATE_SUBMISSION_REMOVAL',
                        message: 'Este envio possui reanálise e eventos posteriores dependentes. Confirme o alcance desejado.',
                        options: ['remove_submission_and_dependent_review', 'delete_pendency']
                    }
                };
            }

            if (hasDependentReviewImmediatelyAfter) {
                attempts.splice(targetIndex, 2);
            } else {
                attempts.splice(targetIndex, 1);
            }

            const lastRemaining = attempts[attempts.length - 1] || null;
            if (lastRemaining && text(lastRemaining.kind) === 'submission') {
                pendency.status = 'Aguardando reanálise';
                pendency.nextActor = 'Controlador';
                delete pendency.resolvedAt;
                return { pendency, attempts, affectedAnalysis: 'Incorreto', ambiguity: null };
            }

            pendency.status = 'Aberta';
            pendency.nextActor = 'Escola';
            delete pendency.resolvedAt;
            return { pendency, attempts, affectedAnalysis: 'Incorreto', ambiguity: null };
        }

        return {
            pendency,
            attempts,
            affectedAnalysis: ACTIVE_STATUSES.has(text(pendency.status)) ? 'Incorreto' : null,
            ambiguity: {
                code: 'UNSUPPORTED_CORRECTION_ACTION',
                message: `Ação de recomposição não suportada: ${action}`
            }
        };
    }

    const exported = Object.freeze({
        rebuildPendencyAfterCorrection,
        computeLateAnalysis
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }
    if (root) {
        root.RadarPendencyCorrection = exported;
    }
}(typeof window !== 'undefined' ? window : globalThis));
