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

    function calendarDate(value) {
        const match = text(value).match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
        if (!match) return null;
        const parsed = new Date(`${match[1]}T00:00:00Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === match[1]
            ? match[1] : null;
    }

    function supplied(input, keys) {
        const key = keys.find(name => Object.prototype.hasOwnProperty.call(input, name));
        return key === undefined ? { present: false } : { present: true, value: input[key] };
    }

    function correctAnalysis(attempt, verification) {
        const available = calendarDate(attempt.dataDisponibilizacao);
        const deadline = calendarDate(verification.bonusDeadline ?? verification.bonifPrazo);
        const late = Boolean(available && deadline && available > deadline)
            || requiresLateCorrect({
                bonusResult: verification.bonusResult ?? verification.resultadoBonif,
                deliveryStatus: verification.deliveryStatus ?? verification.bonificationValue
            });
        return late ? 'Correto (Atrasado)' : 'Correto';
    }

    const REVIEW_EVENT_TYPES = new Set(['reanalise_correta', 'reanalise_incorreta', 'arquivo_indisponivel']);

    function reconcileHistory(pendency, action, targetId, attempt, changes) {
        if (!Array.isArray(pendency.historico)) return;
        pendency.historico = pendency.historico.flatMap(event => {
            if (text(event?.tentativaId) !== text(targetId)) return [event];
            const reviewEvent = REVIEW_EVENT_TYPES.has(text(event.tipo));
            if (action === 'delete_attempt' || (action === 'delete_review' && reviewEvent)) return [];
            if (action === 'correct_review' && reviewEvent) {
                const next = { ...event };
                const resultChanged = supplied(changes, ['resultado', 'result']).present;
                if (resultChanged) {
                    const types = { correto: 'reanalise_correta', incorreto: 'reanalise_incorreta', arquivo_indisponivel: 'arquivo_indisponivel' };
                    const details = {
                        correto: 'Reanálise confirmou a correção do documento.',
                        incorreto: 'Reanálise identificou erros no documento corrigido.',
                        arquivo_indisponivel: 'Reanálise não localizou um arquivo acessível.'
                    };
                    next.tipo = types[attempt.resultado];
                    next.detalhe = details[attempt.resultado];
                }
                if (supplied(changes, ['dataAnalise', 'analyzedAt', 'date']).present) next.dataHora = attempt.dataAnalise;
                if (resultChanged || supplied(changes, ['errosEncontrados', 'errors']).present) next.erros = [...attempt.errosEncontrados];
                if (supplied(changes, ['observacaoAnalise', 'observation', 'note']).present) next.observacao = attempt.observacaoAnalise;
                return [next];
            }
            if (action === 'correct_attempt' && event.tipo === 'novo_envio') {
                const next = { ...event };
                if (supplied(changes, ['dataDisponibilizacao', 'availableAt', 'date']).present) next.dataDisponibilizacao = attempt.dataDisponibilizacao;
                if (supplied(changes, ['link', 'driveUrl']).present) next.link = attempt.link;
                if (supplied(changes, ['observacaoEscola', 'observacao', 'observation', 'note']).present) next.observacao = attempt.observacao;
                // dataHora e autoria registram quando/por quem o envio ocorreu.
                return [next];
            }
            return [event];
        });
    }

    function alternatives(pendency) {
        const schoolId = text(pendency.escolaId || pendency.schoolId);
        const competence = text(pendency.competenciaOrigem || pendency.competencia);
        const id = text(pendency.id);
        return id && schoolId && competence ? [{
            action: 'delete_pendency',
            label: 'Excluir esta Pendência com seu histórico',
            target: { kind: 'pendency', id, schoolId, competence }
        }] : [];
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

    function projectionScope(pendency, attempts, targetId, action, changes) {
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
            const correctedDate = supplied(changes, ['dataAnalise', 'analyzedAt', 'date']);
            if (action === 'correct_review' && correctedDate.present
                && (Date.parse(correctedDate.value) >= lastStateAt) !== (attemptAt >= lastStateAt)) return 'ambiguous';
            if (lastStateAt > attemptAt) return 'preserve';
        }
        const expectedStatus = latest.status === ATTEMPT_STATUS.WAITING_REVIEW
            ? PENDENCY_STATUS.WAITING_REVIEW
            : text(latest.resultado).toLowerCase() === REVIEW_RESULTS.CORRECT
                ? PENDENCY_STATUS.RESOLVED : PENDENCY_STATUS.OPEN;
        return text(pendency.status) === expectedStatus ? 'rebuild' : 'ambiguous';
    }

    function remainingIndependentEvent(pendency, attempts) {
        const events = (Array.isArray(pendency.historico) ? pendency.historico : [])
            .filter(event => ['cancelamento', 'reabertura'].includes(text(event?.tipo)))
            .sort((left, right) => Date.parse(right.dataHora) - Date.parse(left.dataHora));
        if (!events.length) return { event: null, ambiguous: false };
        const event = events[0];
        const stateAt = Date.parse(event.dataHora);
        const latest = activeAttemptsInOrder(attempts).at(-1);
        const latestAt = latest ? Date.parse(latest.status === ATTEMPT_STATUS.REVIEWED
            ? latest.dataAnalise : latest.dataRegistro || latest.dataDisponibilizacao) : null;
        if (!Number.isFinite(stateAt) || (latest && !Number.isFinite(latestAt))) return { event: null, ambiguous: true };
        if (latest && stateAt < latestAt) return { event: null, ambiguous: false };
        // Remover A2 pode tornar dominante uma reabertura entre A1 e A2.
        // A análise válida de A1 continua independente do estado reaberto.
        if (stateAt === latestAt || event.tipo !== 'reabertura'
            || !Array.isArray(event.erros) || !event.erros.length
            || event.erros.some(error => typeof error !== 'string' || !error.trim())) {
            return { event: null, ambiguous: true };
        }
        return { event, ambiguous: false };
    }

    /**
     * Recompõe o estado da Pendência e da análise técnica vinculada a partir
     * do esquema real de `src/domain/pendencias.js` (`tentativas`) e da regra
     * real `requiresLateCorrect` de `src/domain/fluxo-operacional.js`.
     * Projeção pura T5, sem persistência. O servidor refaz a decisão na transação.
     * affectedAnalysis=null preserva a análise; 'Não analisado' retira o resultado
     * dependente. Ambiguidade nunca aplica uma recomposição ou amplia o alcance.
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
        const sourceAttempts = Array.isArray(externalAttempts)
            ? externalAttempts.map(cloneAttempt)
            : (Array.isArray(nextPendency.tentativas) ? nextPendency.tentativas : []);
        const attempts = sourceAttempts.map(cloneAttempt);

        const aliases = { delete_submission: 'delete_attempt', correct_submission: 'correct_attempt' };
        const normalizedAction = aliases[text(action)] || text(action);
        const { index: targetIdx, ambiguity } = resolveTargetAttemptIndex(attempts, targetId);

        if (ambiguity) {
            return {
                pendency: nextPendency,
                attempts: sourceAttempts,
                affectedAnalysis: null,
                ambiguity: { ...ambiguity, alternatives: alternatives(nextPendency) }
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
            target.analisadoPor = null;
            for (const key of ['analisadoPorId', 'authenticatedRoleAnalise', 'actingProfileAnalise',
                'analyzedBy', 'analyzedByUserId', 'reviewedBy', 'reviewedByUserId', 'reviewerProfile']) {
                if (Object.prototype.hasOwnProperty.call(target, key)) target[key] = null;
            }
        } else if (normalizedAction === 'correct_review') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para corrigir reanálise.');
            }
            const target = attempts[targetIdx];
            if (target.status !== ATTEMPT_STATUS.REVIEWED) {
                throw new Error('A tentativa selecionada não possui reanálise concluída para correção.');
            }
            const result = supplied(changes, ['resultado', 'result']);
            const nextResult = text(result.present ? result.value : target.resultado).toLowerCase();
            if (!Object.values(REVIEW_RESULTS).includes(nextResult)) {
                throw new Error(`Resultado de reanálise inválido: ${nextResult}`);
            }
            const date = supplied(changes, ['dataAnalise', 'analyzedAt', 'date']);
            const nextDate = text(date.present ? date.value : target.dataAnalise) || null;
            if (date.present && (!nextDate || !Number.isFinite(Date.parse(nextDate)) || !calendarDate(nextDate))) {
                throw new Error('Data de reanálise inválida.');
            }
            const errors = supplied(changes, ['errosEncontrados', 'errors']);
            const errorsChanged = result.present || errors.present;
            const nextErrors = !errorsChanged ? target.errosEncontrados : nextResult === REVIEW_RESULTS.CORRECT
                ? [] : nextResult === REVIEW_RESULTS.UNAVAILABLE
                    ? ['Arquivo não localizado ou inacessível']
                    : normalizeErrors(errors.present ? errors.value : target.errosEncontrados);
            if (errorsChanged && nextResult === REVIEW_RESULTS.INCORRECT && !nextErrors.length) {
                throw new Error('Reanálise incorreta exige ao menos um erro documental.');
            }
            changesProjection = nextResult !== text(target.resultado).toLowerCase()
                || nextDate !== (text(target.dataAnalise) || null)
                || JSON.stringify(nextErrors) !== JSON.stringify(target.errosEncontrados);
            target.resultado = nextResult;
            target.dataAnalise = nextDate;
            const observation = supplied(changes, ['observacaoAnalise', 'observation', 'note']);
            if (observation.present) target.observacaoAnalise = text(observation.value);
            if (errorsChanged) target.errosEncontrados = nextErrors;
        } else if (normalizedAction === 'delete_attempt') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para excluir envio.');
            }
            attempts.splice(targetIdx, 1);
        } else if (normalizedAction === 'correct_attempt') {
            if (targetIdx < 0) {
                throw new Error('Nenhuma tentativa disponível para corrigir envio.');
            }
            const target = attempts[targetIdx];
            changesProjection = false;
            const date = supplied(changes, ['dataDisponibilizacao', 'availableAt', 'date']);
            if (date.present) {
                const nextDate = calendarDate(date.value);
                if (!nextDate) throw new Error('Data de disponibilização inválida.');
                changesProjection = target.status === ATTEMPT_STATUS.REVIEWED
                    && nextDate !== (text(target.dataDisponibilizacao) || null);
                target.dataDisponibilizacao = nextDate;
            }
            const observation = supplied(changes, ['observacaoEscola', 'observacao', 'observation', 'note']);
            if (observation.present) {
                target.observacao = text(observation.value);
                if (Object.prototype.hasOwnProperty.call(target, 'observacaoEscola')) target.observacaoEscola = target.observacao;
            }
            const link = supplied(changes, ['link', 'driveUrl']);
            if (link.present) target.link = text(link.value) || null;
        } else {
            throw new Error(`Ação de correção de histórico desconhecida: ${normalizedAction}`);
        }

        const scope = changesProjection ? projectionScope(nextPendency, sourceAttempts, targetId, normalizedAction, changes) : 'preserve';
        const independent = scope === 'rebuild' ? remainingIndependentEvent(nextPendency, attempts) : { event: null, ambiguous: false };
        if (scope === 'ambiguous' || independent.ambiguous) {
            return {
                pendency: nextPendency,
                attempts: sourceAttempts,
                affectedAnalysis: null,
                ambiguity: {
                    code: 'AMBIGUOUS_PENDENCY_HISTORY',
                    message: 'O histórico não comprova qual estado depende desta tentativa; confira a sequência antes de corrigir.',
                    candidates: sourceAttempts.map(item => item.id),
                    alternatives: alternatives(nextPendency)
                }
            };
        }
        reconcileHistory(nextPendency, normalizedAction, targetId,
            attempts.find(item => text(item.id) === text(targetId)), changes);
        if (scope === 'preserve') {
            nextPendency.tentativas = attempts;
            return { pendency: nextPendency, attempts, affectedAnalysis: null, ambiguity: null };
        }

        const activeAttempts = activeAttemptsInOrder(attempts);
        const latest = activeAttempts.length ? activeAttempts[activeAttempts.length - 1] : null;
        let affectedAnalysis = 'Não analisado';

        if (!latest) {
            nextPendency.status = PENDENCY_STATUS.OPEN;
            nextPendency.responsavel = ACTORS.SCHOOL;
            nextPendency.proximoAtor = ACTORS.SCHOOL;
            nextPendency.dataResolucao = null;
            const opening = (nextPendency.historico || []).filter(event => event.tipo === 'abertura');
            nextPendency.errosAtuais = opening.length === 1 ? normalizeErrors(opening[0].erros) : [];
        } else if (latest.status === ATTEMPT_STATUS.WAITING_REVIEW) {
            nextPendency.status = PENDENCY_STATUS.WAITING_REVIEW;
            nextPendency.responsavel = ACTORS.CONTROLLER;
            nextPendency.proximoAtor = ACTORS.CONTROLLER;
            nextPendency.dataResolucao = null;
            const previousReviewed = activeAttempts
                .slice(0, -1)
                .reverse()
                .find(item => item.status === ATTEMPT_STATUS.REVIEWED && Object.values(REVIEW_RESULTS).includes(item.resultado));
            nextPendency.errosAtuais = previousReviewed ? normalizeErrors(previousReviewed.errosEncontrados) : [];
            if (previousReviewed) affectedAnalysis = previousReviewed.resultado === REVIEW_RESULTS.CORRECT
                ? correctAnalysis(previousReviewed, verification) : 'Incorreto';
        } else if (latest.status === ATTEMPT_STATUS.REVIEWED) {
            if (latest.resultado === REVIEW_RESULTS.CORRECT) {
                nextPendency.status = PENDENCY_STATUS.RESOLVED;
                nextPendency.responsavel = null;
                nextPendency.proximoAtor = null;
                nextPendency.dataResolucao = calendarDate(latest.dataAnalise);
                nextPendency.errosAtuais = [];
                affectedAnalysis = correctAnalysis(latest, verification);
            } else {
                nextPendency.status = PENDENCY_STATUS.OPEN;
                nextPendency.responsavel = ACTORS.SCHOOL;
                nextPendency.proximoAtor = ACTORS.SCHOOL;
                nextPendency.dataResolucao = null;
                nextPendency.errosAtuais = normalizeErrors(latest.errosEncontrados);
                affectedAnalysis = 'Incorreto';
            }
        }

        if (independent.event) {
            nextPendency.status = PENDENCY_STATUS.OPEN;
            nextPendency.responsavel = ACTORS.SCHOOL;
            nextPendency.proximoAtor = ACTORS.SCHOOL;
            nextPendency.dataResolucao = null;
            nextPendency.errosAtuais = normalizeErrors(independent.event.erros);
        }

        nextPendency.motivo = nextPendency.errosAtuais?.[0] || null;
        nextPendency.cancelamento = null;
        // Espelhos legados não podem ressuscitar projeções ao recarregar/salvar.
        for (const [alias, value] of Object.entries({
            resolved_at: nextPendency.dataResolucao,
            canceled_at: null,
            responsible_area: nextPendency.responsavel,
            next_actor: nextPendency.proximoAtor,
            reason: nextPendency.motivo
        })) {
            if (Object.prototype.hasOwnProperty.call(nextPendency, alias)) nextPendency[alias] = value;
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
