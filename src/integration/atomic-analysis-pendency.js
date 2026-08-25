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

    async function buildAtomicOpen(service, input = {}) {
        if (!service || typeof service.open !== 'function') {
            throw new Error('Serviço de pendências indisponível para abertura atômica.');
        }
        return service.open({ ...input, technicalAnalysisValue: 'Incorreto' });
    }

    function installServicePatch() {
        const service = root.RadarApplicationServices?.pendencies;
        if (!service || service.__radarAtomicAnalysisOpen === true) return Boolean(service);
        originalServiceOpen = service.open.bind(service);
        service.open = async function openWithAtomicAnalysis(input = {}) {
            const shouldAttachAnalysis = pendingMatches(input);
            const effectiveInput = shouldAttachAnalysis
                ? { ...input, technicalAnalysisValue: 'Incorreto' }
                : input;
            const result = await originalServiceOpen(effectiveInput);
            if (shouldAttachAnalysis) pendingAnalysis = null;
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
        if (!verification) {
            const ErrorCtor = root.RadarRepositoryContract?.RepositoryError;
            if (typeof ErrorCtor === 'function') {
                throw new ErrorCtor('NOT_FOUND', 'Verificação documental não localizada.', {
                    operation: 'setTechnicalAnalysis'
                });
            }
            const error = new Error('Verificação documental não localizada.');
            error.code = 'NOT_FOUND';
            throw error;
        }
        if (!text(verification.bonificacao?.[documentKey])) {
            const ErrorCtor = root.RadarRepositoryContract?.RepositoryError;
            if (typeof ErrorCtor === 'function') {
                throw new ErrorCtor(
                    'DELIVERY_REQUIRED',
                    'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).',
                    { operation: 'setTechnicalAnalysis' }
                );
            }
            const error = new Error(
                'Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).'
            );
            error.code = 'DELIVERY_REQUIRED';
            throw error;
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
                    return text(root.verificacoes?.[schoolId]?.[compKey]?.analise?.[documentKey])
                        || text(verificacoes?.[schoolId]?.[compKey]?.analise?.[documentKey])
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
                        const availablePrograms = root.programas || programas;
                        return availablePrograms.find(item => item.id === validation.programId) || null;
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
            VERSION: '2.0.0',
            getPendingContext: () => pendingAnalysis ? { ...pendingAnalysis } : null,
            clearPendingContext: () => { pendingAnalysis = null; },
            buildAtomicOpen
        });
        root.RADAR_ATOMIC_ANALYSIS_READY = true;
        installed = true;
        return true;
    }

    if (!install()) {
        root.RADAR_ATOMIC_ANALYSIS_READY = false;
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 100);
    }
}(typeof window !== 'undefined' ? window : globalThis));