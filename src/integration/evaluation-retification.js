(function installRadarEvaluationRetification(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('../domain/service-advisory.js')
        : root.RadarServiceAdvisory;
    const pendencias = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const api = factory(contract, serviceAdvisory, pendencias);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarEvaluationRetification = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createEvaluationRetificationApi(
    contract,
    serviceAdvisory,
    pendencyDomain
) {
    'use strict';

    if (!contract || !serviceAdvisory || !pendencyDomain) {
        throw new Error('Contrato de dados e domínios de Assessoria/Pendências são obrigatórios para retificação de avaliações.');
    }

    const { RepositoryError, cloneValue } = contract;
    const { deriveServiceAdvisory } = serviceAdvisory;
    const PROTECTED = Symbol('radarEvaluationRetificationProtected');
    const ORIGINAL_SET_BONIFICATION = Symbol('radarOriginalSetBonification');
    const DERIVED_DOCUMENTS = new Set(['notaFiscal', 'boletoInternet', 'consAssessoria']);
    const DERIVED_BONIFICATION = new Set(['boletoInternet', 'consAssessoria', 'consEnviada']);
    const RETIFICATION_CANCELLATION_TYPE = 'retificacao_avaliacao';
    const RETIFICATION_CANCELLATION_ORIGIN = 'avaliacao_tecnica';
    const RETIFICATION_CANCELLATION_LABEL = 'Anulada por edição da avaliação';
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        boletoInternet: 'Boleto de pagamento de Internet',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function assertRetifiableBonification(documentKey) {
        if (DERIVED_BONIFICATION.has(documentKey)) {
            fail(
                'DOCUMENT_NOT_APPLICABLE',
                documentKey === 'boletoInternet'
                    ? 'Boleto de pagamento de Internet é um tipo de gasto de Notas Fiscais e não possui bonificação documental independente.'
                    : 'Esta bonificação é derivada e não pode ser desfeita como avaliação mensal autônoma.',
                'undoBonification',
                { documentKey }
            );
        }
    }

    function assertRetifiableTechnicalDocument(documentKey) {
        if (!DERIVED_DOCUMENTS.has(documentKey)) return;
        const messages = {
            notaFiscal: 'A situação técnica de Notas Fiscais é calculada a partir das despesas individualizadas e não pode ser retificada como análise mensal agregada.',
            boletoInternet: 'Boleto de pagamento de Internet é avaliado dentro de Notas Fiscais e não possui análise documental independente.',
            consAssessoria: 'A Consulta à Assessoria é analisada por Nota Fiscal de serviço e não pode ser retificada como análise mensal agregada.'
        };
        fail('DOCUMENT_NOT_APPLICABLE', messages[documentKey], 'correctTechnicalAnalysis', { documentKey });
    }

    function syncDerivedAfterBonificationUndo(service, state, verification, documentKey, previousValue) {
        verification.bonificacao = verification.bonificacao || {};
        verification.analise = verification.analise || {};
        verification.bonificacao[documentKey] = '';
        verification.analise[documentKey] = 'Não analisado';

        if (documentKey === 'declBBAgil' && previousValue === 'Não se aplica') {
            verification.analise.declBBAgil = 'Não analisado';
        }

        if (documentKey !== 'notaFiscal') return;

        if (previousValue === 'Não se aplica'
            && text(verification.bonificacao.encampInventario) === 'Não se aplica') {
            verification.bonificacao.encampInventario = '';
            verification.analise.encampInventario = 'Não analisado';
        }

        const schoolId = text(verification.escolaId || verification.school_id);
        const compKey = text(verification.compKey);
        const registeredNotes = list(state?.registeredInvoices).filter(note => (
            text(note.escolaId || note.school_id) === schoolId
            && (!compKey || text(note.compKey) === compKey)
        ));
        const advisory = deriveServiceAdvisory(registeredNotes);
        verification.bonificacao.consAssessoria = advisory.delivery;
        verification.bonificacao.consEnviada = advisory.sent;
        verification.analise.consAssessoria = advisory.analysis;
    }

    function validateTechnicalCorrection(service, verification, documentKey, requestedValue) {
        verification.analise = verification.analise || {};
        verification.bonificacao = verification.bonificacao || {};

        if (documentKey === 'declBBAgil'
            && text(verification.bonificacao[documentKey]) === 'Não se aplica') {
            fail(
                'DOCUMENT_NOT_APPLICABLE',
                'A Declaração BB Ágil marcada como N/A não possui análise técnica editável.',
                'correctTechnicalAnalysis',
                { documentKey }
            );
        }
        if (requestedValue !== 'Não analisado'
            && !text(verification.bonificacao[documentKey])) {
            fail(
                'DELIVERY_REQUIRED',
                'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).',
                'correctTechnicalAnalysis'
            );
        }
        if (requestedValue === 'Correto' && service.flow.requiresLateCorrect({
            bonusResult: verification.resultadoBonif,
            deliveryStatus: verification.bonificacao[documentKey]
        })) {
            fail(
                'LATE_ANALYSIS_REQUIRED',
                'Este documento exige o estado “Correto (Atrasado)” conforme a regra vigente de entrega posterior.',
                'correctTechnicalAnalysis',
                { documentKey }
            );
        }
    }

    function retificationAudit(service) {
        const user = service.getCurrentUser?.() || {};
        return {
            eventId: service.createId('evento-retificacao-avaliacao'),
            at: service.now(),
            usuario: text(user.name || user.nome || user.email || 'Sistema'),
            perfil: text(service.getCurrentProfile?.() || user.role || user.perfil || 'sistema')
        };
    }

    function requireFormalRetificationConfirmation(input, activePendency, currentValue) {
        if (!activePendency || currentValue !== 'Incorreto') return null;
        if (input.confirmPendencyCancellation !== true) {
            fail(
                'RETIFICATION_CONFIRMATION_REQUIRED',
                'Esta avaliação possui Pendência ativa. Confirme expressamente a retificação para anular a Pendência preservando seu histórico.',
                'correctTechnicalAnalysis',
                { pendencyId: activePendency.id }
            );
        }
        const justification = text(input.retificationJustification);
        if (!justification) {
            fail(
                'RETIFICATION_JUSTIFICATION_REQUIRED',
                'Informe a justificativa da retificação antes de confirmar a anulação da Pendência.',
                'correctTechnicalAnalysis',
                { pendencyId: activePendency.id }
            );
        }
        return Object.freeze({
            type: RETIFICATION_CANCELLATION_TYPE,
            origin: RETIFICATION_CANCELLATION_ORIGIN,
            label: RETIFICATION_CANCELLATION_LABEL,
            justification,
            confirmed: true
        });
    }

    function decorateFormalRetificationCancellation(cancelledPendency, details = {}) {
        const next = cancelledPendency;
        const previousValue = text(details.previousValue);
        const requestedValue = text(details.requestedValue);
        const justification = text(details.justification);
        next.cancelamento = {
            ...(next.cancelamento || {}),
            tipo: RETIFICATION_CANCELLATION_TYPE,
            origem: RETIFICATION_CANCELLATION_ORIGIN,
            rotulo: RETIFICATION_CANCELLATION_LABEL,
            avaliacaoAnterior: previousValue,
            avaliacaoNova: requestedValue,
            justificativa: justification,
            confirmacaoExpressa: true
        };
        const event = list(next.historico).at(-1);
        if (event) {
            event.tipo = RETIFICATION_CANCELLATION_TYPE;
            event.detalhe = `Avaliação técnica retificada de "${previousValue}" para "${requestedValue}". Pendência anulada por edição da avaliação. Justificativa: ${justification}`;
            event.metadados = {
                tipoEncerramento: RETIFICATION_CANCELLATION_TYPE,
                origem: RETIFICATION_CANCELLATION_ORIGIN,
                avaliacaoAnterior: previousValue,
                avaliacaoNova: requestedValue,
                confirmacaoExpressa: true
            };
        }
        return next;
    }

    function findSnapshotVerification(entities, persistence) {
        if (persistence.verificationId) {
            const byId = list(entities.verifications)
                .find(record => text(record.id) === text(persistence.verificationId));
            if (byId) return byId;
        }
        const separator = text(persistence.compKey).indexOf('_');
        const competence = separator < 0
            ? text(persistence.compKey)
            : text(persistence.compKey).slice(0, separator);
        const programId = separator < 0
            ? ''
            : text(persistence.compKey).slice(separator + 1);
        return list(entities.verifications).find(record => (
            text(record.school_id) === text(persistence.schoolId)
            && text(record.competence_id) === competence
            && (!programId || text(record.program_id) === programId)
        ));
    }

    async function persistCorrectionWithCancellation(service, context, persistence) {
        const { snapshot, repository, defaultPersist } = context;
        const entities = snapshot?.entities || {};
        const verification = findSnapshotVerification(entities, persistence);
        const pendency = list(entities.pendencies)
            .find(record => text(record.id) === text(persistence.pendencyId));
        const administrativeLog = list(entities.administrativeLogs)
            .find(record => text(record.id) === text(persistence.logId));

        if (!verification || !pendency || !administrativeLog) {
            fail(
                'PERSISTENCE_CONTEXT_MISSING',
                'A verificação, a Pendência anulada ou o histórico da retificação não foi produzido para persistência.',
                'correctTechnicalAnalysis',
                {
                    schoolId: persistence.schoolId,
                    compKey: persistence.compKey,
                    pendencyId: persistence.pendencyId,
                    logId: persistence.logId
                }
            );
        }

        const capabilities = repository.capabilities?.() || {};
        if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') {
            return defaultPersist();
        }

        return repository.executeRpc('retify_verification_with_pendency_cancel', {
            p_verification: verification,
            p_expected_verification_version: persistence.expectedVerificationVersion,
            p_pendency: pendency,
            p_expected_pendency_version: persistence.expectedPendencyVersion,
            p_administrative_log: administrativeLog,
            p_retification: persistence.retification
        }, 'retifyVerificationWithPendencyCancel');
    }

    async function undoBonification(service, input = {}) {
        const profile = service.assertEditable(input.profile, 'undoBonification');
        service.assertCompetenceEditable(input.compKey, 'undoBonification');
        const documentKey = text(input.documentKey);
        assertRetifiableBonification(documentKey);

        return service.runSerializedVerificationWrite(input, async () => {
            const schoolId = text(input.schoolId);
            const compKey = text(input.compKey);
            const currentVerification = service.getVerification(schoolId, compKey);
            const previousValue = text(currentVerification?.bonificacao?.[documentKey]);
            if (!previousValue) {
                return {
                    ok: true,
                    value: {
                        verification: cloneValue(currentVerification),
                        unchanged: true,
                        undone: false
                    }
                };
            }

            const persistence = {};
            return service.dataService.execute({
                name: 'verification:undo-bonification',
                changedEntities: ['verifications', 'administrativeLogs'],
                incrementalStateEntities: ['verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const state = service.getState();
                    const verification = service.getVerification(schoolId, compKey);
                    persistence.schoolId = schoolId;
                    persistence.compKey = compKey;
                    persistence.expectedVersion = rowVersionOf(verification);

                    if (verification.resultadoBonif && profile !== 'assistente') {
                        fail(
                            'CONSOLIDATED_VERIFICATION',
                            'Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos na bonificação.',
                            'undoBonification'
                        );
                    }

                    const valueBeforeMutation = text(verification?.bonificacao?.[documentKey]);
                    syncDerivedAfterBonificationUndo(
                        service,
                        state,
                        verification,
                        documentKey,
                        valueBeforeMutation
                    );

                    const previousConsolidation = text(verification.resultadoBonif);
                    const reopened = profile === 'assistente' && Boolean(previousConsolidation);
                    if (reopened) verification.resultadoBonif = '';

                    const log = service.appendSchoolLog(
                        schoolId,
                        'Avaliação desfeita',
                        `Avaliação de ${DOCUMENT_LABELS[documentKey] || documentKey} em ${compKey} da escola ${schoolId} desfeita de "${valueBeforeMutation}" para estado não preenchido.`
                            + (reopened ? ` Consolidação ${previousConsolidation.toUpperCase()} reaberta após a retificação.` : '')
                    );
                    persistence.logId = text(log?.id);
                    return {
                        verification: cloneValue(verification),
                        previousValue: valueBeforeMutation,
                        undone: true,
                        reopened
                    };
                },
                persist: context => service.persistAtomicVerification(context, persistence)
            });
        });
    }

    async function correctTechnicalAnalysis(service, input = {}) {
        service.assertEditable(input.profile, 'correctTechnicalAnalysis');
        service.assertCompetenceEditable(input.compKey, 'correctTechnicalAnalysis');
        const documentKey = text(input.documentKey);
        assertRetifiableTechnicalDocument(documentKey);
        const requestedValue = text(input.value);

        if (requestedValue === 'Incorreto') {
            fail(
                'PENDENCY_REQUIRED',
                'A análise “Incorreto” continua exigindo abertura atômica de Pendência e não pode ser produzida pela retificação simples.',
                'correctTechnicalAnalysis',
                {
                    schoolId: text(input.schoolId),
                    compKey: text(input.compKey),
                    documentKey
                }
            );
        }

        return service.runSerializedVerificationWrite(input, async () => {
            const schoolId = text(input.schoolId);
            const compKey = text(input.compKey);
            const state = service.getState();
            const activePendency = input.activePendency
                || service.findActivePendency(state, schoolId, compKey, documentKey);
            const currentVerification = service.getVerification(schoolId, compKey);
            const currentValue = text(currentVerification?.analise?.[documentKey]);
            const formalRetification = requireFormalRetificationConfirmation(
                input,
                activePendency,
                currentValue
            );

            if (activePendency) {
                const persistence = {};
                return service.dataService.execute({
                    name: 'verification:correct-technical-analysis-with-pendency-cancel',
                    changedEntities: ['verifications', 'pendencies', 'administrativeLogs'],
                    incrementalStateEntities: ['verifications', 'pendencies', 'administrativeLogs'],
                    remoteResultIsAuthoritative: true,
                    mutate: () => {
                        const liveState = service.getState();
                        const verification = service.getVerification(schoolId, compKey);
                        const livePendency = service.findActivePendency(
                            liveState,
                            schoolId,
                            compKey,
                            documentKey
                        );
                        if (!livePendency || text(livePendency.id) !== text(activePendency.id)) {
                            fail(
                                'OPTIMISTIC_CONFLICT',
                                'A Pendência vinculada mudou enquanto a retificação estava sendo processada. Atualize os dados antes de tentar novamente.',
                                'correctTechnicalAnalysis',
                                { pendencyId: activePendency.id }
                            );
                        }
                        const previousAnalysis = text(verification?.analise?.[documentKey]);
                        if (previousAnalysis !== 'Incorreto') {
                            fail(
                                'OPTIMISTIC_CONFLICT',
                                'A análise técnica mudou enquanto a retificação estava sendo processada. Atualize os dados antes de tentar novamente.',
                                'correctTechnicalAnalysis',
                                { documentKey, previousAnalysis }
                            );
                        }

                        validateTechnicalCorrection(service, verification, documentKey, requestedValue);
                        persistence.schoolId = schoolId;
                        persistence.compKey = compKey;
                        persistence.verificationId = text(verification.id || verification.verification_id);
                        persistence.expectedVerificationVersion = rowVersionOf(verification);
                        persistence.pendencyId = text(livePendency.id);
                        persistence.expectedPendencyVersion = rowVersionOf(livePendency);
                        persistence.retification = {
                            kind: RETIFICATION_CANCELLATION_TYPE,
                            origin: RETIFICATION_CANCELLATION_ORIGIN,
                            previousAnalysis,
                            newAnalysis: requestedValue,
                            justification: formalRetification.justification,
                            confirmed: true
                        };

                        const pendencyIndex = list(liveState.pendencies)
                            .findIndex(item => text(item?.id) === text(livePendency.id));
                        if (pendencyIndex < 0) {
                            fail('NOT_FOUND', 'Pendência vinculada não localizada.', 'correctTechnicalAnalysis');
                        }
                        const cancelledPendency = pendencyDomain.cancelPendency(
                            livePendency,
                            { justificativa: formalRetification.justification },
                            retificationAudit(service)
                        );
                        decorateFormalRetificationCancellation(cancelledPendency, {
                            previousValue: previousAnalysis,
                            requestedValue,
                            justification: formalRetification.justification
                        });
                        liveState.pendencies[pendencyIndex] = cancelledPendency;

                        verification.analise[documentKey] = requestedValue;
                        const log = service.appendSchoolLog(
                            schoolId,
                            'Avaliação técnica retificada',
                            `Análise técnica de ${DOCUMENT_LABELS[documentKey] || documentKey} em ${compKey} da escola ${schoolId} retificada de "${previousAnalysis}" para "${requestedValue}". Pendência ${livePendency.id} anulada por edição da avaliação, com histórico preservado. Justificativa: ${formalRetification.justification}`
                        );
                        persistence.logId = text(log?.id);
                        return {
                            verification: cloneValue(verification),
                            pendency: cloneValue(cancelledPendency),
                            previousValue: previousAnalysis,
                            value: requestedValue,
                            retified: true,
                            pendencyCancelled: true,
                            pendencyAnnulledByRetification: true
                        };
                    },
                    persist: context => persistCorrectionWithCancellation(service, context, persistence)
                });
            }

            if (currentValue === requestedValue) {
                return {
                    ok: true,
                    value: {
                        verification: cloneValue(currentVerification),
                        unchanged: true
                    }
                };
            }

            const persistence = {};
            return service.dataService.execute({
                name: 'verification:correct-technical-analysis',
                changedEntities: ['verifications', 'administrativeLogs'],
                incrementalStateEntities: ['verifications', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const verification = service.getVerification(schoolId, compKey);
                    persistence.schoolId = schoolId;
                    persistence.compKey = compKey;
                    persistence.expectedVersion = rowVersionOf(verification);
                    validateTechnicalCorrection(service, verification, documentKey, requestedValue);

                    const previousAnalysis = text(verification.analise[documentKey]);
                    verification.analise[documentKey] = requestedValue;
                    const log = service.appendSchoolLog(
                        schoolId,
                        'Avaliação técnica retificada',
                        `Análise técnica de ${DOCUMENT_LABELS[documentKey] || documentKey} em ${compKey} da escola ${schoolId} retificada de "${previousAnalysis}" para "${requestedValue}" por correção de lançamento.`
                    );
                    persistence.logId = text(log?.id);
                    return {
                        verification: cloneValue(verification),
                        previousValue: previousAnalysis,
                        value: requestedValue,
                        retified: true
                    };
                },
                persist: context => service.persistAtomicVerification(context, persistence)
            });
        });
    }

    function protectVerificationService(service) {
        if (!service || typeof service.setBonification !== 'function') return false;
        if (service[PROTECTED]) return true;

        const originalSetBonification = service.setBonification.bind(service);
        Object.defineProperty(service, ORIGINAL_SET_BONIFICATION, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: originalSetBonification
        });
        service.setBonification = function setBonificationWithUndo(input = {}) {
            if (text(input.value)) return originalSetBonification(input);
            return undoBonification(service, input);
        };
        service.correctTechnicalAnalysis = function correctTechnicalAnalysisCommand(input = {}) {
            return correctTechnicalAnalysis(service, input);
        };
        Object.defineProperty(service, PROTECTED, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true
        });
        return true;
    }

    function install(root) {
        const service = root?.RadarApplicationServices?.verifications;
        if (!service) return false;
        return protectVerificationService(service);
    }

    return Object.freeze({
        RETIFICATION_CANCELLATION_TYPE,
        RETIFICATION_CANCELLATION_ORIGIN,
        RETIFICATION_CANCELLATION_LABEL,
        install,
        protectVerificationService,
        undoBonification,
        correctTechnicalAnalysis
    });
}));
