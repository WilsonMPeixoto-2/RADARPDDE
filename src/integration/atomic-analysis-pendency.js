(function installRadarAtomicAnalysisPendency(root) {
    'use strict';

    if (!root?.document || root.RadarAtomicAnalysisPendency) return;

    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });

    let installed = false;
    let pendingAnalysis = null;
    let originalChangeTechnicalAnalysis = null;
    let originalCloseModal = null;
    let originalServiceOpen = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function cloneValue(value) {
        return root.RadarRepositoryContract?.cloneValue
            ? root.RadarRepositoryContract.cloneValue(value)
            : JSON.parse(JSON.stringify(value));
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function fail(code, message, operation, details = null) {
        const ErrorCtor = root.RadarRepositoryContract?.RepositoryError;
        if (typeof ErrorCtor === 'function') {
            throw new ErrorCtor(code, message, { operation, details });
        }
        const error = new Error(message);
        error.code = code;
        error.details = details;
        throw error;
    }

    function splitContext(compKey) {
        const parsed = root.RadarCompetencia?.splitCompetenciaContext?.(compKey) || {};
        return {
            competence: text(parsed.competenciaKey || parsed.competencia || String(compKey).slice(0, 7)),
            programId: text(parsed.contextId || parsed.programId || String(compKey).slice(8))
        };
    }

    function currentProfile() {
        try {
            return text(root.getRadarAccessProfile?.());
        } catch (_error) {
            return '';
        }
    }

    function findActivePendency(state, schoolId, compKey, documentKey) {
        const { competence, programId } = splitContext(compKey);
        return root.RadarPendencias?.findActivePendency?.(state?.pendencies || [], {
            escolaId: schoolId,
            competencia: competence,
            competenciaOrigem: competence,
            programaId: programId,
            documentoKey: documentKey
        }) || null;
    }

    function pendingMatches(input = {}) {
        if (!pendingAnalysis) return false;
        return text(input.schoolId || input.escolaId) === pendingAnalysis.schoolId
            && text(input.competence || input.competencia) === pendingAnalysis.competence
            && text(input.programId || input.programaId) === pendingAnalysis.programId
            && text(input.documentKey || input.documentoKey) === pendingAnalysis.documentKey;
    }

    function buildAtomicOpen(service, input = {}) {
        service.assertCapability(root.RadarAccessPolicy.CAPABILITIES.OPEN_PENDENCY, 'open');
        const persistence = { operation: 'open', expectedPendencyVersion: null };
        const technicalAnalysisValue = text(input.technicalAnalysisValue);
        const changesVerification = Boolean(technicalAnalysisValue);

        return service.dataService.execute({
            name: changesVerification ? 'pendency:open-with-analysis' : 'pendency:open',
            changedEntities: changesVerification
                ? ['pendencies', 'verifications', 'administrativeLogs']
                : ['pendencies', 'administrativeLogs'],
            mutate: () => {
                const state = service.getState();
                const context = {
                    escolaId: text(input.schoolId || input.escolaId),
                    competencia: text(input.competence || input.competencia),
                    competenciaOrigem: text(input.competence || input.competencia),
                    programaId: text(input.programId || input.programaId),
                    documentoKey: text(input.documentKey || input.documentoKey),
                    item: text(input.item)
                };
                const documentary = Boolean(context.programaId && context.documentoKey);
                const existing = documentary
                    ? service.domain.findActivePendency(state.pendencies, context)
                    : null;
                if (documentary && existing) {
                    fail(
                        'DUPLICATE_PENDENCY',
                        'Já existe uma pendência ativa para esta escola, competência, programa e documento.',
                        'open',
                        { existingPendencyId: existing.id }
                    );
                }

                let verification = null;
                let bonificationBefore = null;
                let resultBefore = null;
                if (changesVerification) {
                    if (technicalAnalysisValue !== 'Incorreto' || !documentary) {
                        fail(
                            'VALIDATION_FAILED',
                            'A abertura atômica só aceita análise “Incorreto” em pendência documental.',
                            'open'
                        );
                    }
                    const compKey = `${context.competencia}_${context.programaId}`;
                    verification = state.verifications?.[context.escolaId]?.[compKey] || null;
                    if (!verification) {
                        fail('NOT_FOUND', 'Verificação documental não localizada.', 'open');
                    }
                    verification.analise = verification.analise || {};
                    verification.bonificacao = verification.bonificacao || {};
                    if (!text(verification.bonificacao[context.documentoKey])) {
                        fail(
                            'DELIVERY_REQUIRED',
                            'Você não pode registrar análise incorreta sem antes preencher o status de entrega no Drive.',
                            'open'
                        );
                    }
                    persistence.expectedVerificationVersion = rowVersionOf(verification);
                    persistence.verificationContext = {
                        schoolId: context.escolaId,
                        competence: context.competencia,
                        programId: context.programaId
                    };
                    bonificationBefore = cloneValue(verification.bonificacao);
                    resultBefore = cloneValue(verification.resultadoBonif);
                }

                try {
                    const id = text(input.id) || service.createId('pend');
                    const openingDate = text(input.openingDate || input.dataAbertura)
                        || service.now().slice(0, 10);
                    const observation = text(input.observation || input.observacao);
                    const opened = documentary
                        ? service.domain.createDocumentPendency({
                            id,
                            escolaId: context.escolaId,
                            competencia: context.competencia,
                            programaId: context.programaId,
                            documentoKey: context.documentoKey,
                            item: context.item,
                            erros: input.errors || input.erros,
                            observacao: observation,
                            dataAbertura: openingDate
                        }, service.audit('evento-pendencia'))
                        : service.domain.normalizePendencyRecord({
                            id,
                            escolaId: context.escolaId,
                            competencia: context.competencia,
                            item: context.item,
                            motivo: text(input.reason || input.motivo),
                            responsavel: text(input.responsible || input.responsavel),
                            status: 'Aberta',
                            dataAbertura: openingDate,
                            dataResolucao: null,
                            observacao: observation
                        });

                    state.pendencies.push(opened);
                    if (verification) {
                        verification.analise[context.documentoKey] = technicalAnalysisValue;
                        if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                            || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                            fail(
                                'BONIFICATION_INVARIANT',
                                'A abertura da pendência não pode alterar a bonificação consolidada.',
                                'open'
                            );
                        }
                    }

                    const log = service.appendSchoolLog(
                        opened.escolaId,
                        verification ? 'Análise incorreta e pendência aberta' : 'Pendência Aberta',
                        verification
                            ? `Análise técnica de ${DOCUMENT_LABELS[context.documentoKey] || context.documentoKey} marcada como “Incorreto” e pendência ${opened.id} aberta atomicamente para ${opened.item}.`
                            : `Pendência ${opened.id} aberta para ${opened.item}.`
                    );
                    persistence.pendencyId = opened.id;
                    persistence.logId = text(log?.id);
                    return {
                        pendency: cloneValue(opened),
                        verification: verification ? cloneValue(verification) : null
                    };
                } catch (error) {
                    if (error?.code) throw error;
                    fail('VALIDATION_FAILED', error?.message || 'Operação de pendência inválida.', 'open');
                }
            },
            persist: context => service.persistPendencyCommand(context, persistence)
        });
    }

    function installServicePatch() {
        const service = root.RadarApplicationServices?.pendencies;
        if (!service || service.__radarAtomicAnalysisOpen === true) return Boolean(service);
        originalServiceOpen = service.open.bind(service);
        service.open = async function openWithAtomicAnalysis(input = {}) {
            const effectiveInput = pendingMatches(input)
                ? { ...input, technicalAnalysisValue: 'Incorreto' }
                : input;
            if (!text(effectiveInput.technicalAnalysisValue)) {
                return originalServiceOpen(effectiveInput);
            }
            const result = await buildAtomicOpen(service, effectiveInput);
            if (pendingMatches(input)) pendingAnalysis = null;
            return result;
        };
        Object.defineProperty(service, '__radarAtomicAnalysisOpen', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function validateBeforeOpening(schoolId, compKey, documentKey) {
        const services = root.RadarApplicationServices;
        const verificationService = services?.verifications;
        const pendencyService = services?.pendencies;
        if (!verificationService || !pendencyService) return null;
        const profile = currentProfile();
        verificationService.assertEditable?.(profile, 'setTechnicalAnalysis');
        verificationService.assertCompetenceEditable?.(compKey, 'setTechnicalAnalysis');
        const state = pendencyService.getState();
        const active = findActivePendency(state, schoolId, compKey, documentKey);
        if (active) return { active, state };
        const { competence, programId } = splitContext(compKey);
        const verification = state.verifications?.[schoolId]?.[compKey] || null;
        if (!verification) fail('NOT_FOUND', 'Verificação documental não localizada.', 'setTechnicalAnalysis');
        if (!text(verification.bonificacao?.[documentKey])) {
            fail(
                'DELIVERY_REQUIRED',
                'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).',
                'setTechnicalAnalysis'
            );
        }
        return { active: null, state, verification, competence, programId };
    }

    function installUiPatch() {
        if (typeof root.changeAnaliseTecnica !== 'function') return false;
        originalChangeTechnicalAnalysis = root.changeAnaliseTecnica.bind(root);
        root.changeAnaliseTecnica = async function changeTechnicalAnalysisAtomically(
            schoolId,
            compKey,
            documentKey,
            value,
            selectElement = null
        ) {
            if (text(value) !== 'Incorreto') {
                return originalChangeTechnicalAnalysis(
                    schoolId,
                    compKey,
                    documentKey,
                    value,
                    selectElement
                );
            }

            const previousValue = (() => {
                try {
                    return text(verificacoes?.[schoolId]?.[compKey]?.analise?.[documentKey])
                        || 'Não analisado';
                } catch (_error) {
                    return 'Não analisado';
                }
            })();
            if (selectElement && typeof selectElement === 'object') {
                selectElement.value = previousValue;
            }

            try {
                const validation = validateBeforeOpening(schoolId, compKey, documentKey);
                if (!validation) return false;
                if (validation.active) {
                    return originalChangeTechnicalAnalysis(
                        schoolId,
                        compKey,
                        documentKey,
                        value,
                        selectElement
                    );
                }

                const program = (() => {
                    try {
                        return programas.find(item => item.id === validation.programId) || null;
                    } catch (_error) {
                        return null;
                    }
                })();
                pendingAnalysis = {
                    schoolId: text(schoolId),
                    compKey: text(compKey),
                    competence: validation.competence,
                    programId: validation.programId,
                    documentKey: text(documentKey),
                    previousValue
                };

                const opened = root.openNovaPendenciaModalWithDefaults?.(
                    schoolId,
                    compKey,
                    program?.name || validation.programId,
                    documentKey,
                    DOCUMENT_LABELS[documentKey] || documentKey
                );
                if (opened === false) {
                    pendingAnalysis = null;
                    return false;
                }
                const observation = root.document.getElementById('pend-obs');
                if (observation) {
                    observation.value = `Identificado erro técnico na conferência de ${DOCUMENT_LABELS[documentKey] || documentKey}. A análise “Incorreto” será gravada somente ao confirmar esta pendência.`;
                }
                return true;
            } catch (error) {
                pendingAnalysis = null;
                root.reportRadarActionError?.(
                    error,
                    'Não foi possível iniciar o registro da análise incorreta.'
                );
                return false;
            }
        };

        if (typeof root.closeModal === 'function') {
            originalCloseModal = root.closeModal.bind(root);
            root.closeModal = function closeModalWithAtomicAnalysis(id, ...args) {
                if (id === 'modal-nova-pendencia' && pendingAnalysis) {
                    pendingAnalysis = null;
                }
                return originalCloseModal(id, ...args);
            };
        }
        return true;
    }

    function dependenciesReady() {
        return Boolean(
            root.RadarRepositoryContract
            && root.RadarPendencias
            && root.RadarAccessPolicy
            && root.RadarApplicationServices?.pendencies
            && root.RadarApplicationServices?.verifications
            && typeof root.changeAnaliseTecnica === 'function'
            && typeof root.openNovaPendenciaModalWithDefaults === 'function'
        );
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        if (!installServicePatch() || !installUiPatch()) return false;
        root.RadarAtomicAnalysisPendency = Object.freeze({
            VERSION: '1.0.0',
            getPendingContext: () => pendingAnalysis ? { ...pendingAnalysis } : null,
            clearPendingContext: () => { pendingAnalysis = null; },
            buildAtomicOpen
        });
        installed = true;
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(typeof window !== 'undefined' ? window : globalThis));
