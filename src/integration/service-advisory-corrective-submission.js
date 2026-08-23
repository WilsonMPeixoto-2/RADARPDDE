(function installRadarServiceAdvisoryCorrectiveSubmission(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarServiceAdvisoryCorrectiveSubmission = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            if (!attemptInstall() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
            const interval = root.setInterval?.(() => {
                if (attemptInstall()) root.clearInterval?.(interval);
            }, 25);
            root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createServiceAdvisoryCorrectiveSubmissionApi(contract) {
    'use strict';

    if (!contract) throw new Error('Contrato de dados obrigatório para o novo envio da Assessoria.');
    const { RepositoryError, cloneValue } = contract;
    let installed = false;

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

    function invoiceIdOf(pendency = {}) {
        return text(pendency.registeredInvoiceId || pendency.registered_invoice_id);
    }

    function isLinkedPendency(root, pendency) {
        if (root.RadarServiceAdvisoryPendency?.isLinkedServiceAdvisoryPendency) {
            return root.RadarServiceAdvisoryPendency.isLinkedServiceAdvisoryPendency(pendency);
        }
        return text(pendency?.documentoKey || pendency?.document_key) === 'consAssessoria'
            && Boolean(invoiceIdOf(pendency));
    }

    async function persistLinkedAttempt(root, service, persistence, context) {
        const { snapshot, repository, defaultPersist } = context;
        const capabilities = repository.capabilities?.() || {};
        if (capabilities.remote !== true || typeof repository.executeRpc !== 'function') {
            return defaultPersist();
        }

        const entities = snapshot.entities || {};
        const invoice = list(entities.registeredInvoices)
            .find(record => String(record.id) === String(persistence.invoiceId));
        const pendency = list(entities.pendencies)
            .find(record => String(record.id) === String(persistence.pendencyId));
        const attempt = list(entities.pendencyAttempts)
            .find(record => String(record.id) === String(persistence.attemptId));
        const verification = list(entities.verifications).find(record => (
            String(record.school_id) === String(persistence.schoolId)
            && String(record.competence_id) === String(persistence.competence)
            && String(record.program_id || '') === String(persistence.programId)
        ));
        const administrativeLogRecord = list(entities.administrativeLogs)
            .find(record => String(record.id) === String(persistence.logId));
        const administrativeLog = typeof service.decorateAdministrativeLog === 'function'
            ? service.decorateAdministrativeLog(administrativeLogRecord)
            : administrativeLogRecord;

        if (!invoice || !pendency || !attempt || !verification || !administrativeLog) {
            fail(
                'PERSISTENCE_CONTEXT_MISSING',
                'O novo envio da Assessoria não produziu o agregado completo para persistência.',
                'registerServiceAdvisoryAttempt',
                cloneValue(persistence)
            );
        }

        return repository.executeRpc(
            'register_service_advisory_attempt',
            {
                p_invoice: invoice,
                p_expected_invoice_version: persistence.expectedInvoiceVersion,
                p_pendency: pendency,
                p_expected_pendency_version: persistence.expectedPendencyVersion,
                p_attempt: attempt,
                p_verification_patch: verification,
                p_expected_verification_version: persistence.expectedVerificationVersion,
                p_administrative_log: administrativeLog
            },
            'registerServiceAdvisoryAttempt'
        );
    }

    async function registerLinkedAttempt(root, service, input, target) {
        const invoiceService = root.RadarApplicationServices?.invoices;
        if (!invoiceService) {
            fail('SERVICE_UNAVAILABLE', 'Serviço de notas fiscais indisponível.', 'registerServiceAdvisoryAttempt');
        }
        service.assertCapability(
            root.RadarAccessPolicy.CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION,
            'registerAttempt'
        );

        const persistence = {
            pendencyId: String(target.id),
            invoiceId: invoiceIdOf(target),
            schoolId: target.escolaId,
            competence: target.competenciaOrigem || target.competencia,
            programId: target.programaId,
            expectedPendencyVersion: rowVersionOf(target)
        };

        return service.dataService.execute({
            name: 'pendency:register-service-advisory-attempt',
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
                const { index, pendency } = service.find(state, input.pendencyId, 'registerAttempt');
                const { verification } = service.verificationFor(state, pendency, 'registerAttempt');
                const invoice = list(state.registeredInvoices).find(record => (
                    String(record.id) === String(persistence.invoiceId)
                ));
                if (!invoice || invoice.tipo !== 'servico') {
                    fail(
                        'NOT_FOUND',
                        'Nota Fiscal vinculada à pendência da Assessoria não localizada.',
                        'registerServiceAdvisoryAttempt'
                    );
                }

                persistence.expectedInvoiceVersion = rowVersionOf(invoice);
                persistence.expectedPendencyVersion = rowVersionOf(pendency);
                persistence.expectedVerificationVersion = rowVersionOf(verification);

                const bonificationBefore = cloneValue(verification.bonificacao);
                const resultBefore = cloneValue(verification.resultadoBonif);
                const next = service.domain.registerCorrectiveSubmission(pendency, {
                    id: text(input.attemptId) || service.createId('tentativa'),
                    dataDisponibilizacao: text(input.availabilityDate || input.dataDisponibilizacao),
                    observacao: text(input.observation || input.observacao),
                    link: text(input.link) || null
                }, service.audit('evento-envio'));

                invoice.analiseConsultaAssessoria = 'Não analisado';
                invoiceService.syncServiceRequirement(state, pendency.escolaId, invoice.compKey);
                state.pendencies[index] = next;

                if (JSON.stringify(verification.bonificacao) !== JSON.stringify(bonificationBefore)
                    || JSON.stringify(verification.resultadoBonif) !== JSON.stringify(resultBefore)) {
                    fail(
                        'BONIFICATION_INVARIANT',
                        'O novo envio da Assessoria não pode alterar a bonificação consolidada.',
                        'registerServiceAdvisoryAttempt'
                    );
                }

                const attempt = list(next.tentativas).at(-1);
                persistence.attemptId = text(attempt?.id);
                const log = service.appendSchoolLog(
                    pendency.escolaId,
                    'Novo envio registrado',
                    `Novo envio da Consulta à Assessoria da NF ${invoice.numero || invoice.id}, disponibilizado em ${text(input.availabilityDate || input.dataDisponibilizacao)}.`
                );
                persistence.logId = text(log?.id);

                return {
                    invoice: cloneValue(invoice),
                    pendency: cloneValue(next),
                    verification: cloneValue(verification)
                };
            },
            persist: context => persistLinkedAttempt(root, service, persistence, context)
        });
    }

    function install(root) {
        if (installed) return true;
        const service = root?.RadarApplicationServices?.pendencies;
        if (!service
            || !root?.RadarApplicationServices?.invoices
            || !root?.RadarAccessPolicy
            || typeof service.registerAttempt !== 'function') {
            return false;
        }
        if (service.__radarServiceAdvisoryCorrectiveSubmission === true) {
            installed = true;
            return true;
        }

        const originalRegisterAttempt = service.registerAttempt.bind(service);
        service.registerAttempt = async function registerAttemptPerInvoice(input = {}) {
            const state = service.getState();
            const target = list(state.pendencies)
                .find(record => String(record.id) === String(input.pendencyId));
            if (!isLinkedPendency(root, target)) return originalRegisterAttempt(input);
            return registerLinkedAttempt(root, service, input, target);
        };

        Object.defineProperty(service, '__radarServiceAdvisoryCorrectiveSubmission', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        installed = true;
        return true;
    }

    return Object.freeze({
        invoiceIdOf,
        isLinkedPendency,
        registerLinkedAttempt,
        install
    });
}));
