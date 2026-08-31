(function installRadarServiceAdvisoryPendency(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('../domain/service-advisory.js')
        : root.RadarServiceAdvisory;
    const api = factory(contract, serviceAdvisory);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarServiceAdvisoryPendency = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            attemptInstall();
            if (root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
            root.addEventListener?.('radar:application-services-ready', attemptInstall);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createServiceAdvisoryPendencyApi(
    contract,
    serviceAdvisory
) {
    'use strict';

    if (!contract || !serviceAdvisory) {
        throw new Error('Contrato de dados e domínio de Assessoria são obrigatórios para integrar Assessoria e pendências.');
    }
    const { RepositoryError, cloneValue } = contract;
    const { getServiceAdvisoryState } = serviceAdvisory;
    let pendingContext = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function splitContext(root, compKey) {
        const parsed = root.RadarCompetencia?.splitCompetenciaContext?.(compKey) || {};
        const competence = text(parsed.competenciaKey || parsed.competencia || String(compKey).slice(0, 7));
        const programId = text(parsed.contextId || parsed.programId || String(compKey).slice(8));
        return { competence, programId };
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function invoiceIdOf(pendency = {}) {
        return text(pendency.registeredInvoiceId || pendency.registered_invoice_id);
    }

    function isLinkedServiceAdvisoryPendency(pendency = {}) {
        return text(pendency.documentoKey || pendency.document_key) === 'consAssessoria'
            && Boolean(invoiceIdOf(pendency));
    }

    function findActiveForInvoice(root, state, invoice) {
        if (!invoice) return null;
        const { competence, programId } = splitContext(root, invoice.compKey);
        const context = root.RadarPendencias?.buildPendencyLookupContext?.({
            escolaId: invoice.escolaId,
            competencia: competence,
            programaId: programId,
            documentoKey: 'consAssessoria',
            registeredInvoiceId: invoice.id
        });
        return root.RadarPendencias?.findActivePendency?.(
            state.pendencies || [],
            context || {}
        ) || null;
    }

    function currentProfile(root) {
        return text(root.getRadarAccessProfile?.());
    }

    function pendingMatches(input = {}) {
        if (!pendingContext) return false;
        return text(input.schoolId || input.escolaId) === pendingContext.schoolId
            && text(input.competence || input.competencia) === pendingContext.competence
            && text(input.programId || input.programaId) === pendingContext.programId
            && text(input.documentKey || input.documentoKey) === 'consAssessoria';
    }

    async function persistAtomicOpen(root, service, persistence, context) {
        const { snapshot, repository, defaultPersist } = context;
        const capabilities = repository.capabilities?.() || {};
        if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') {
            return defaultPersist();
        }
        const entities = snapshot.entities || {};
        const invoice = (entities.registeredInvoices || [])
            .find(record => String(record.id) === String(persistence.invoiceId));
        const pendency = (entities.pendencies || [])
            .find(record => String(record.id) === String(persistence.pendencyId));
        const verification = (entities.verifications || []).find(record => (
            String(record.school_id) === String(persistence.schoolId)
            && String(record.competence_id) === String(persistence.competence)
            && String(record.program_id || '') === String(persistence.programId)
        ));
        const administrativeLog = (entities.administrativeLogs || [])
            .find(record => String(record.id) === String(persistence.logId));
        if (!invoice || !pendency || !verification || !administrativeLog) {
            fail(
                'PERSISTENCE_CONTEXT_MISSING',
                'A confirmação da Assessoria não produziu o agregado completo para persistência.',
                'saveServiceAdvisoryWithPendency',
                cloneValue(persistence)
            );
        }
        return repository.executeRpc(
            'save_service_advisory_with_pendency',
            {
                p_invoice: invoice,
                p_expected_invoice_version: persistence.expectedInvoiceVersion,
                p_verification_patch: verification,
                p_expected_verification_version: persistence.expectedVerificationVersion,
                p_pendency: pendency,
                p_administrative_log: administrativeLog
            },
            'saveServiceAdvisoryWithPendency'
        );
    }

    async function buildAtomicOpen(root, pendencyService, input = {}) {
        const invoiceService = root.RadarApplicationServices?.invoices;
        if (!invoiceService) fail('SERVICE_UNAVAILABLE', 'Serviço de notas fiscais indisponível.', 'openServiceAdvisoryPendency');
        pendencyService.assertCapability(root.RadarAccessPolicy.CAPABILITIES.OPEN_PENDENCY, 'open');
        const persistence = {};

        return pendencyService.dataService.execute({
            name: 'invoice:update-service-advisory-with-pendency',
            changedEntities: ['registeredInvoices', 'verifications', 'pendencies', 'administrativeLogs'],
            remoteResultIsAuthoritative: true,
            mutate: () => {
                const state = pendencyService.getState();
                const invoice = state.registeredInvoices.find(record => (
                    String(record.id) === String(pendingContext?.registeredInvoiceId)
                ));
                if (!invoice || invoice.tipo !== 'servico') {
                    fail('NOT_FOUND', 'Nota Fiscal de serviço vinculada à pendência não localizada.', 'openServiceAdvisoryPendency');
                }
                const active = findActiveForInvoice(root, state, invoice);
                if (active) {
                    fail(
                        'DUPLICATE_PENDENCY',
                        'Já existe uma pendência ativa para a Assessoria desta Nota Fiscal.',
                        'openServiceAdvisoryPendency',
                        { existingPendencyId: active.id }
                    );
                }
                const { competence, programId } = splitContext(root, invoice.compKey);
                const verification = state.verifications?.[invoice.escolaId]?.[invoice.compKey];
                if (!verification) fail('NOT_FOUND', 'Verificação mensal não localizada.', 'openServiceAdvisoryPendency');

                const profile = invoiceService.assertEditable(currentProfile(root), 'updateServiceAdvisory');
                invoiceService.assertVerificationEditable(verification, profile, 'updateServiceAdvisory');
                persistence.invoiceId = invoice.id;
                persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                persistence.expectedVerificationVersion = rowVersionOf(verification);
                persistence.schoolId = invoice.escolaId;
                persistence.competence = competence;
                persistence.programId = programId;

                invoice.analiseConsultaAssessoria = 'Incorreto';
                invoiceService.syncServiceRequirement(state, invoice.escolaId, invoice.compKey);
                const reopened = profile === 'assistente' && Boolean(text(verification.resultadoBonif));
                if (reopened) {
                    verification.resultadoBonif = '';
                }

                const opened = pendencyService.domain.createDocumentPendency({
                    id: text(input.id) || pendencyService.createId('pend'),
                    escolaId: invoice.escolaId,
                    competencia: competence,
                    programaId: programId,
                    documentoKey: 'consAssessoria',
                    registeredInvoiceId: invoice.id,
                    item: text(input.item) || `Consulta Assessoria — NF ${invoice.numero || invoice.id}`,
                    erros: input.errors || input.erros,
                    observacao: text(input.observation || input.observacao),
                    dataAbertura: text(input.openingDate || input.dataAbertura) || pendencyService.now().slice(0, 10)
                }, pendencyService.audit('evento-pendencia'));
                state.pendencies.push(opened);
                const reopenSuffix = reopened
                    ? ' A consolidação anterior foi reaberta pela alteração.'
                    : '';
                const log = pendencyService.appendSchoolLog(
                    invoice.escolaId,
                    'Análise incorreta e pendência aberta',
                    `Consulta à Assessoria da NF ${invoice.numero || invoice.id} marcada como “Incorreto” e pendência ${opened.id} aberta atomicamente.${reopenSuffix}`
                );
                persistence.pendencyId = opened.id;
                persistence.logId = text(log?.id);
                return {
                    invoice: cloneValue(invoice),
                    verification: cloneValue(verification),
                    pendency: cloneValue(opened)
                };
            },
            persist: context => persistAtomicOpen(root, pendencyService, persistence, context)
        });
    }

    async function persistServiceReanalysis(root, service, persistence, context) {
        const { snapshot, repository, defaultPersist } = context;
        const capabilities = repository.capabilities?.() || {};
        if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') return defaultPersist();
        const entities = snapshot.entities || {};
        const invoice = (entities.registeredInvoices || [])
            .find(record => String(record.id) === String(persistence.invoiceId));
        const pendency = (entities.pendencies || [])
            .find(record => String(record.id) === String(persistence.pendencyId));
        const attempt = persistence.attemptId
            ? (entities.pendencyAttempts || []).find(record => String(record.id) === String(persistence.attemptId))
            : null;
        const verification = (entities.verifications || []).find(record => (
            String(record.school_id) === String(persistence.schoolId)
            && String(record.competence_id) === String(persistence.competence)
            && String(record.program_id || '') === String(persistence.programId)
        ));
        const administrativeLogRecord = (entities.administrativeLogs || [])
            .find(record => String(record.id) === String(persistence.logId));
        const administrativeLog = typeof service.decorateAdministrativeLog === 'function'
            ? service.decorateAdministrativeLog(administrativeLogRecord)
            : administrativeLogRecord;
        if (!invoice || !pendency || !verification || !administrativeLog
            || (persistence.attemptId && !attempt)) {
            fail(
                'PERSISTENCE_CONTEXT_MISSING',
                'A reanálise da Assessoria não produziu o agregado completo para persistência.',
                'reanalyzeServiceAdvisoryPendency',
                cloneValue(persistence)
            );
        }
        return repository.executeRpc(
            'reanalyze_service_advisory_pendency',
            {
                p_invoice: invoice,
                p_expected_invoice_version: persistence.expectedInvoiceVersion,
                p_pendency: pendency,
                p_attempt: attempt,
                p_verification_patch: verification,
                p_expected_pendency_version: persistence.expectedPendencyVersion,
                p_expected_verification_version: persistence.expectedVerificationVersion,
                p_administrative_log: administrativeLog
            },
            'reanalyzeServiceAdvisoryPendency'
        );
    }

    async function reanalyzeLinkedServicePendency(root, service, input, target) {
        const invoiceService = root.RadarApplicationServices?.invoices;
        if (!invoiceService) fail('SERVICE_UNAVAILABLE', 'Serviço de notas fiscais indisponível.', 'reanalyzeServiceAdvisoryPendency');
        const persistence = {
            pendencyId: String(target.id),
            invoiceId: invoiceIdOf(target),
            schoolId: target.escolaId,
            competence: target.competenciaOrigem || target.competencia,
            programId: target.programaId,
            expectedPendencyVersion: rowVersionOf(target)
        };
        return service.dataService.execute({
            name: 'pendency:reanalyze-service-advisory',
            changedEntities: [
                'registeredInvoices',
                'pendencies',
                'pendencyAttempts',
                'verifications',
                'administrativeLogs'
            ],
            remoteResultIsAuthoritative: true,
            mutate: () => {
                const state = service.getState();
                const { index, pendency } = service.find(state, input.pendencyId, 'reanalyze');
                const { verification } = service.verificationFor(state, pendency, 'reanalyze');
                const invoice = state.registeredInvoices.find(record => (
                    String(record.id) === String(persistence.invoiceId)
                ));
                if (!invoice || invoice.tipo !== 'servico') {
                    fail('NOT_FOUND', 'Nota Fiscal vinculada à pendência não localizada.', 'reanalyzeServiceAdvisoryPendency');
                }
                const awaitingAttempt = [...(pendency.tentativas || [])]
                    .reverse()
                    .find(attempt => attempt && attempt.status === 'aguardando');
                persistence.attemptId = text(awaitingAttempt?.id) || null;
                persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                persistence.expectedVerificationVersion = rowVersionOf(verification);

                const next = service.domain.recordReanalysis(pendency, {
                    resultado: text(input.result || input.resultado),
                    erros: input.errors || input.erros,
                    observacao: text(input.observation || input.observacao) || 'Regularização confirmada.'
                }, service.audit('evento-reanalise'));
                const result = text(input.result || input.resultado);
                invoice.analiseConsultaAssessoria = result === 'correto'
                    ? service.getCorrectAnalysisLabel(
                        pendency.competenciaOrigem || pendency.competencia,
                        awaitingAttempt?.dataDisponibilizacao
                    )
                    : 'Incorreto';
                invoiceService.syncServiceRequirement(state, pendency.escolaId, invoice.compKey);
                state.pendencies[index] = next;

                const log = service.appendSchoolLog(
                    pendency.escolaId,
                    'Reanálise registrada',
                    `Reanálise da Consulta à Assessoria da NF ${invoice.numero || invoice.id}, tentativa ${awaitingAttempt?.id || 'não identificada'}, resultado ${result}.`
                );
                persistence.logId = text(log?.id);
                return {
                    invoice: cloneValue(invoice),
                    pendency: cloneValue(next),
                    verification: cloneValue(verification)
                };
            },
            persist: context => persistServiceReanalysis(root, service, persistence, context)
        });
    }

    function patchServices(root) {
        const services = root.RadarApplicationServices;
        const invoiceService = services?.invoices;
        const pendencyService = services?.pendencies;
        if (!invoiceService || !pendencyService) return false;
        if (pendencyService.__radarServiceAdvisoryPendency === true) return true;

        const originalOpen = pendencyService.open.bind(pendencyService);
        pendencyService.open = async function openWithServiceAdvisory(input = {}) {
            if (!pendingMatches(input)) return originalOpen(input);
            const result = await buildAtomicOpen(root, pendencyService, input);
            pendingContext = null;
            return result;
        };

        const originalReanalyze = pendencyService.reanalyze.bind(pendencyService);
        pendencyService.reanalyze = async function reanalyzeWithServiceAdvisory(input = {}) {
            const state = pendencyService.getState();
            const target = (state.pendencies || []).find(record => String(record.id) === String(input.pendencyId));
            if (!isLinkedServiceAdvisoryPendency(target)) return originalReanalyze(input);
            return reanalyzeLinkedServicePendency(root, pendencyService, input, target);
        };

        Object.defineProperty(pendencyService, '__radarServiceAdvisoryPendency', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function patchUi(root) {
        if (typeof root.changeInvoiceAdvisoryAnalysis !== 'function') return false;
        if (root.changeInvoiceAdvisoryAnalysis.__radarServiceAdvisoryPendency === true) return true;
        if (!root.RadarApplicationServices?.invoices) return false;

        const wrapped = async function changeInvoiceAdvisoryAnalysisPerInvoice(
            invoiceId,
            schoolId,
            value,
            selectElement = null
        ) {
            const invoiceService = root.RadarApplicationServices?.invoices;
            if (!invoiceService) return false;
            const state = invoiceService.getState();
            const invoice = state.registeredInvoices.find(record => String(record.id) === String(invoiceId));
            if (!invoice || invoice.tipo !== 'servico') return false;
            const previous = getServiceAdvisoryState(invoice).analysis;
            const active = findActiveForInvoice(root, state, invoice);
            if (active) {
                if (selectElement && typeof selectElement === 'object') selectElement.value = previous;
                root.openPendencyDrawer?.(active.id);
                return false;
            }

            if (text(value) === 'Incorreto') {
                if (selectElement && typeof selectElement === 'object') selectElement.value = previous;
                const { competence, programId } = splitContext(root, invoice.compKey);
                const program = state.programs.find(record => String(record.id) === String(programId));
                pendingContext = {
                    registeredInvoiceId: invoice.id,
                    schoolId: invoice.escolaId,
                    compKey: invoice.compKey,
                    competence,
                    programId,
                    previousValue: previous
                };
                const opened = root.openNovaPendenciaModalWithDefaults?.(
                    invoice.escolaId,
                    invoice.compKey,
                    program?.name || programId,
                    'consAssessoria',
                    `Consulta Assessoria — NF ${invoice.numero || invoice.id}`
                );
                if (opened === false) {
                    pendingContext = null;
                    return false;
                }
                const observation = root.document?.getElementById?.('pend-obs');
                if (observation) {
                    observation.value = `Identificado erro técnico na consulta à Assessoria referente à NF ${invoice.numero || invoice.id}. A análise “Incorreto” será gravada somente ao confirmar esta pendência.`;
                }
                return true;
            }

            try {
                await invoiceService.updateServiceAdvisory({
                    id: invoice.id,
                    schoolId: invoice.escolaId,
                    analysis: value,
                    profile: currentProfile(root)
                });
                root.rebuildOperationalIndexes?.();
                root.renderProntuario?.(invoice.escolaId);
                return true;
            } catch (error) {
                if (selectElement && typeof selectElement === 'object') selectElement.value = previous;
                root.reportRadarActionError?.(
                    error,
                    'Não foi possível alterar a análise da consulta à Assessoria para esta nota fiscal.'
                );
                return false;
            }
        };
        Object.defineProperty(wrapped, '__radarServiceAdvisoryPendency', {
            value: true,
            enumerable: false
        });
        root.changeInvoiceAdvisoryAnalysis = wrapped;

        if (typeof root.closeModal === 'function') {
            const previousCloseModal = root.closeModal.bind(root);
            root.closeModal = function closeModalWithServiceAdvisoryContext(id, ...args) {
                if (id === 'modal-nova-pendencia') pendingContext = null;
                return previousCloseModal(id, ...args);
            };
        }
        return true;
    }

    function install(root) {
        if (!root?.RadarPendencias
            || !root?.RadarAccessPolicy
            || !root?.RadarApplicationServices?.invoices
            || !root?.RadarApplicationServices?.pendencies
            || typeof root.changeInvoiceAdvisoryAnalysis !== 'function'
            || typeof root.openNovaPendenciaModalWithDefaults !== 'function') {
            return false;
        }
        return Boolean(patchServices(root) && patchUi(root));
    }

    return Object.freeze({
        invoiceIdOf,
        isLinkedServiceAdvisoryPendency,
        findActiveForInvoice,
        getPendingContext: () => pendingContext ? { ...pendingContext } : null,
        clearPendingContext: () => { pendingContext = null; },
        buildAtomicOpen,
        reanalyzeLinkedServicePendency,
        install
    });
}));
