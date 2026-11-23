// RADAR PDDE — cliente do contrato de correção operacional (T2/T3).
//
// SUGESTÃO DE REFERÊNCIA da auditoria independente do agente Manus (15/11/2026).
// Substitui a abordagem de src/application/operational-correction-service.js da
// branch feat/prontuario-correcao-integrada-20261114, que recalculava o plano no
// navegador e devolvia sucesso sem persistir. Aqui o servidor é a única fonte
// do plano (preview_operational_change) e da aplicação atômica
// (apply_operational_change); o cliente apenas monta o pedido, apresenta o
// resultado da prévia e repete a mesma operationKey em caso de nova tentativa.
(function installRadarOperationalCorrectionClient(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.RadarOperationalCorrectionClient = api;
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalCorrectionClientApi() {
    const CONTRACT_VERSION = 1;
    const SUPPORTED_ACTIONS = Object.freeze([
        'delete_invoice',
        'delete_pendency',
        'clear_analysis',
        'correct_analysis',
        'correct_bonification',
        'delete_context'
    ]);
    const TARGET_KIND_BY_ACTION = Object.freeze({
        delete_invoice: 'invoice',
        delete_pendency: 'pendency',
        clear_analysis: 'analysis',
        correct_analysis: 'analysis',
        correct_bonification: 'verification',
        delete_context: 'program_context'
    });
    const CORRECTABLE_ANALYSES = Object.freeze(['Correto', 'Correto (Atrasado)', 'Incorreto']);
    const MAX_NOTE_LENGTH = 2000;

    const ENTITY_LABELS = Object.freeze({
        verifications: ['avaliação mensal do programa', 'avaliações mensais dos programas'],
        registered_invoices: ['nota fiscal', 'notas fiscais'],
        pendencies: ['Pendência', 'Pendências'],
        pendency_attempts: ['envio da escola', 'envios da escola'],
        pendency_contacts: ['contato registrado', 'contatos registrados'],
        assets: ['bem patrimonial', 'bens patrimoniais']
    });

    const ERROR_MESSAGES = Object.freeze({
        STALE_PLAN: 'Os dados mudaram desde a pré-visualização. Revise a nova prévia antes de confirmar.',
        PLAN_BLOCKED: 'Esta correção não pode ser aplicada no estado atual.',
        IDEMPOTENCY_CONFLICT: 'Esta confirmação já foi usada para outra operação. Gere uma nova prévia.',
        ACTION_NOT_AVAILABLE: 'Esta correção ainda não está disponível nesta versão.',
        ASSET_ALREADY_INVENTORIED: 'O bem patrimonial está Inventariado e só pode ser removido pela correção da despesa.',
        OPTIMISTIC_CONFLICT: 'Outro usuário alterou estes dados. Atualize e gere uma nova prévia.',
        PERMISSION_DENIED: 'Seu perfil não pode corrigir lançamentos desta unidade.',
        VALIDATION_FAILED: 'O pedido de correção está incompleto ou fora do contexto selecionado.',
        NOT_FOUND: 'O registro não foi encontrado. Atualize a tela.'
    });

    class OperationalCorrectionError extends Error {
        constructor(code, message, options = {}) {
            super(message, options.cause ? { cause: options.cause } : undefined);
            this.name = 'OperationalCorrectionError';
            this.code = code;
            this.retryable = Boolean(options.retryable);
            this.details = options.details || null;
        }
    }

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function clone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function invalid(message) {
        return new OperationalCorrectionError('VALIDATION_FAILED', message);
    }

    // Monta o pedido canônico. Justificativa/observação é sempre opcional
    // (decisão do usuário de 14/11/2026); quando informada, segue como note.
    function buildRequest(input = {}) {
        const action = text(input.action);
        if (!SUPPORTED_ACTIONS.includes(action)) {
            throw invalid(`Ação de correção não suportada: ${action || '(vazia)'}`);
        }
        const source = input.target || {};
        const target = {
            kind: TARGET_KIND_BY_ACTION[action],
            schoolId: text(source.schoolId),
            competence: text(source.competence)
        };
        if (!target.schoolId || !target.competence) {
            throw invalid('Escola e competência são obrigatórias para a correção.');
        }
        for (const key of ['id', 'programId', 'documentKey']) {
            const value = text(source[key]);
            if (value) target[key] = value;
        }
        if (['invoice', 'pendency'].includes(target.kind) && !target.id) {
            throw invalid('Informe o registro a ser excluído.');
        }
        if (target.kind === 'analysis') {
            if (!target.programId || !target.documentKey) {
                throw invalid('Programa e documento são obrigatórios para corrigir a análise.');
            }
            if (['notaFiscal', 'consAssessoria'].includes(target.documentKey) && !target.id) {
                throw invalid('A análise de nota fiscal é individual: informe a nota.');
            }
        }

        // T4: exclusão de contexto tem identidade fechada por escola, competência
        // e programa. Não seleciona dependências nem movimenta registros no cliente.
        // O servidor continuará sendo a única autoridade do plano e da transação.
        if (action === 'delete_context') {
            const allowedTargetKeys = ['kind', 'schoolId', 'competence', 'programId'];
            const allowedRequestKeys = ['action', 'target', 'note'];
            const exactTarget = text(source.kind) === 'program_context'
                && Boolean(target.programId)
                && Object.keys(source).every(key => allowedTargetKeys.includes(key));
            const exactRequest = Object.keys(input).every(key => allowedRequestKeys.includes(key));
            if (!exactTarget || !exactRequest) {
                throw invalid('Informe exatamente escola, competência e programa, sem destino ou seleção parcial de registros.');
            }
        }

        const request = { contractVersion: CONTRACT_VERSION, action, target };
        if (action === 'correct_bonification') {
            const mark = input.changes?.bonificacao;
            if (!target.programId || target.documentKey !== 'notaFiscal'
                || ![null, 'Sim', 'Não', 'Não se aplica'].includes(mark)) {
                throw invalid('Informe o programa e a nova marca de Notas Fiscais.');
            }
            request.changes = { bonificacao: mark };
        }
        if (action === 'correct_analysis') {
            const analysis = text(input.changes?.analysis);
            if (!CORRECTABLE_ANALYSES.includes(analysis)) {
                throw invalid('Escolha o novo resultado da análise técnica.');
            }
            request.changes = { analysis };
        }
        if (Array.isArray(input.selectedPendencyIds)) {
            request.selectedPendencyIds = [...new Set(input.selectedPendencyIds.map(text).filter(Boolean))].sort();
        }
        const note = text(input.note);
        if (note) {
            if (note.length > MAX_NOTE_LENGTH) {
                throw invalid(`A observação deve ter no máximo ${MAX_NOTE_LENGTH} caracteres.`);
            }
            request.note = note;
        }
        return request;
    }

    // O digest do servidor não cobre a nota; a prévia é pedida sem ela.
    function previewPayload(request) {
        const payload = clone(request);
        delete payload.note;
        return payload;
    }

    function pluralize(entity, count) {
        const labels = ENTITY_LABELS[entity] || [entity, entity];
        return `${count} ${count === 1 ? labels[0] : labels[1]}`;
    }

    // Traduz o plano do servidor para o diálogo de confirmação (prancha
    // "Retificação": Antes → Depois, consequências e preservações).
    function describePlan(plan = {}) {
        const removals = [];
        const deleted = plan.effects?.delete || {};
        for (const entity of Object.keys(ENTITY_LABELS)) {
            const ids = Array.isArray(deleted[entity]) ? deleted[entity] : [];
            if (ids.length) removals.push({ entity, ids: [...ids], label: pluralize(entity, ids.length) });
        }
        const changes = (Array.isArray(plan.effects?.update) ? plan.effects.update : []).map(item => ({
            entity: item.entity,
            id: item.id,
            field: item.field,
            before: item.before ?? (plan.action === 'correct_bonification' ? 'Sem marca' : 'Não analisado'),
            after: item.after ?? (item.field === 'bonus_result' ? 'Pendente de consolidação'
                : plan.action === 'correct_bonification' ? 'Sem marca' : 'Não analisado')
        }));
        const blockers = Array.isArray(plan.blockers) ? clone(plan.blockers) : [];
        const contextRootPresent = plan.action !== 'delete_context'
            || (Array.isArray(deleted.verifications) && deleted.verifications.length === 1);
        const warnings = Array.isArray(plan.warnings) ? clone(plan.warnings) : [];
        return {
            action: plan.action || null,
            planDigest: text(plan.planDigest),
            removals,
            changes,
            preserved: clone(plan.preserved || {}),
            warnings,
            blockers,
            canApply: blockers.length === 0 && contextRootPresent && /^[0-9a-f]{64}$/.test(text(plan.planDigest)),
            summary: removals.length
                ? `Serão excluídos: ${removals.map(item => item.label).join(', ')}.`
                : 'Nenhum registro será excluído.'
        };
    }

    function errorCodeFrom(error) {
        const remote = text(error?.details?.remoteMessage || error?.message);
        for (const code of ['STALE_PLAN', 'PLAN_BLOCKED', 'IDEMPOTENCY_CONFLICT', 'ACTION_NOT_AVAILABLE', 'ASSET_ALREADY_INVENTORIED']) {
            if (remote.includes(code)) return code;
        }
        return text(error?.code) || 'UNKNOWN';
    }

    function toCorrectionError(error) {
        if (error instanceof OperationalCorrectionError) return error;
        if (error?.name === 'AbortError') return error;
        const code = errorCodeFrom(error);
        return new OperationalCorrectionError(code, ERROR_MESSAGES[code] || 'Não foi possível concluir a correção.', {
            cause: error,
            retryable: code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'UNAVAILABLE',
            details: { remoteMessage: text(error?.details?.remoteMessage || error?.message) || null }
        });
    }

    function defaultOperationKey() {
        const cryptoApi = globalThis.crypto;
        if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
        throw new OperationalCorrectionError('MISSING_CRYPTO', 'O navegador não oferece geração segura de identificadores.');
    }

    function createOperationalCorrectionClient(deps = {}) {
        const repository = deps.repository;
        if (!repository || typeof repository.executeRpc !== 'function') {
            throw new TypeError('createOperationalCorrectionClient exige repository.executeRpc');
        }
        const newOperationKey = typeof deps.newOperationKey === 'function' ? deps.newOperationKey : defaultOperationKey;
        const lockedRequests = new WeakMap();

        async function preview(input) {
            const request = buildRequest(input);
            try {
                const plan = await repository.executeRpc(
                    'preview_operational_change',
                    { p_request: previewPayload(request) },
                    'previewOperationalChange'
                );
                if (request.action === 'delete_context') {
                    const actual = plan?.target || {};
                    const expected = request.target;
                    const sameContext = plan?.action === request.action
                        && text(actual.kind) === expected.kind
                        && ['schoolId', 'competence', 'programId'].every(key => text(actual[key]) === expected[key]);
                    if (!sameContext) {
                        throw new OperationalCorrectionError(
                            'INVALID_PREVIEW',
                            'A prévia não corresponde exatamente à escola, competência e programa selecionados.'
                        );
                    }
                }
                return { request, plan, view: describePlan(plan) };
            } catch (error) {
                throw toCorrectionError(error);
            }
        }

        // Prepara uma confirmação. A mesma operationKey é reutilizada em novas
        // tentativas (falha de rede), garantindo efeito único no servidor.
        function prepareConfirmation(previewResult, extra = {}) {
            const view = previewResult?.view || describePlan(previewResult?.plan);
            if (!view.canApply) {
                const blocker = view.blockers[0];
                throw new OperationalCorrectionError('PLAN_BLOCKED', blocker?.message || ERROR_MESSAGES.PLAN_BLOCKED, {
                    details: { blockers: view.blockers }
                });
            }
            const request = clone(previewResult.request);
            const note = text(extra.note);
            if (note) request.note = note.slice(0, MAX_NOTE_LENGTH);
            const confirmation = Object.freeze({
                request,
                planDigest: view.planDigest,
                operationKey: newOperationKey()
            });
            if (note) lockedRequests.set(confirmation, clone(request));
            return confirmation;
        }

        async function apply(confirmation, extra = {}) {
            if (!confirmation?.planDigest || !confirmation?.operationKey || !confirmation?.request) {
                throw invalid('Confirmação incompleta: gere a prévia antes de aplicar.');
            }
            let request = lockedRequests.get(confirmation);
            if (!request) {
                request = clone(confirmation.request);
                const note = text(extra.note);
                if (note) request.note = note.slice(0, MAX_NOTE_LENGTH);
                lockedRequests.set(confirmation, clone(request));
            } else {
                request = clone(request);
            }
            try {
                const receipt = await repository.executeRpc(
                    'apply_operational_change',
                    {
                        p_request: request,
                        p_plan_digest: confirmation.planDigest,
                        p_operation_key: confirmation.operationKey
                    },
                    'applyOperationalChange'
                );
                if (!receipt || receipt.committed !== true) {
                    throw new OperationalCorrectionError('NOT_COMMITTED', 'O servidor não confirmou a correção.');
                }
                return receipt;
            } catch (error) {
                throw toCorrectionError(error);
            }
        }

        return Object.freeze({ preview, prepareConfirmation, apply });
    }

    return Object.freeze({
        CONTRACT_VERSION,
        SUPPORTED_ACTIONS,
        OperationalCorrectionError,
        buildRequest,
        describePlan,
        createOperationalCorrectionClient
    });
}));
