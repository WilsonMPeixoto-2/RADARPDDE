(function installRadarAuditableRetification(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const pendencyDomain = typeof module !== 'undefined' && module.exports
        ? require('../domain/pendencias.js')
        : root.RadarPendencias;
    const accessPolicy = typeof module !== 'undefined' && module.exports
        ? require('../domain/access-policy.js')
        : root.RadarAccessPolicy;
    const invoiceService = typeof module !== 'undefined' && module.exports
        ? require('../application/invoice-service.js')
        : root.RadarInvoiceService;
    const api = factory(contract, pendencyDomain, accessPolicy, invoiceService);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarAuditableRetification = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            attemptInstall();
            root.addEventListener?.('radar:application-services-ready', attemptInstall);
            if (root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createAuditableRetificationApi(
    contract,
    pendencyDomain,
    accessPolicy,
    invoiceService
) {
    'use strict';

    if (!contract || !pendencyDomain || !accessPolicy || !invoiceService) {
        throw new Error('Contrato de dados, domínio de Pendências e política de acesso são obrigatórios para retificação auditável.');
    }

    const { RepositoryError, cloneValue } = contract;
    const UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar';
    const INDIVIDUAL_HISTORY_KEYS = new Set(['notaFiscal', 'consAssessoria']);
    const MANUAL_ITEMS = Object.freeze([
        'Extrato Conta Corrente',
        'Extrato Investimento',
        'Notas Fiscais',
        'Consulta Assessoria',
        'Declaração BB Ágil',
        'Encaminhado para Inventariação',
        'Outro'
    ]);
    const MANUAL_RESPONSIBLES = Object.freeze([
        'Escola',
        'Verbas Federais',
        'Inventário'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeType(value) {
        return text(value).toLocaleLowerCase('pt-BR');
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'assistente cre' || normalized === 'assistente de verbas federais') return 'assistente';
        return normalized;
    }

    function rowVersionOf(record) {
        const value = Number(record?.rowVersion ?? record?.row_version);
        return Number.isInteger(value) && value > 0 ? value : null;
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    function invoiceIdOfPendency(pendency = {}) {
        return text(pendency.registeredInvoiceId || pendency.registered_invoice_id);
    }

    function invoiceHistory(state = {}, invoiceId) {
        const target = text(invoiceId);
        if (!target) return [];
        return (Array.isArray(state.pendencies) ? state.pendencies : []).filter(pendency => (
            invoiceIdOfPendency(pendency) === target
            && INDIVIDUAL_HISTORY_KEYS.has(text(pendency.documentoKey || pendency.document_key))
        ));
    }

    function currentInvoice(state = {}, invoiceId) {
        const target = text(invoiceId);
        return (Array.isArray(state.registeredInvoices) ? state.registeredInvoices : [])
            .find(invoice => text(invoice.id) === target) || null;
    }

    function invoiceContext(invoice = {}) {
        const schoolId = text(invoice.escolaId || invoice.school_id);
        const compKey = text(
            invoice.compKey
            || invoice.source_context_key
            || (text(invoice.competencia || invoice.competence_id) && text(invoice.programaId || invoice.program_id)
                ? `${text(invoice.competencia || invoice.competence_id)}_${text(invoice.programaId || invoice.program_id)}`
                : '')
        );
        return { schoolId, compKey };
    }

    function isRetifiableInvoice(state = {}, invoice = null) {
        if (!invoice) return false;
        return normalizeType(invoice.tipo || invoice.expense_type) === UNIDENTIFIED_EXPENSE_TYPE
            || invoiceHistory(state, invoice.id).length > 0;
    }

    function assertRetificationIdentity(state, existing, input = {}) {
        const currentType = normalizeType(existing.tipo || existing.expense_type);
        const requestedType = normalizeType(input.expenseType || currentType);
        const currentContext = invoiceContext(existing);
        const requestedSchool = text(input.schoolId || currentContext.schoolId);
        const requestedCompKey = text(input.compKey || currentContext.compKey);

        if (requestedSchool !== currentContext.schoolId || requestedCompKey !== currentContext.compKey) {
            fail(
                'INVOICE_HISTORY_LOCKED',
                'A retificação não pode transferir o lançamento para outra escola, competência ou programa.',
                'invoice:auditable-retification',
                { invoiceId: existing.id }
            );
        }
        if (requestedType !== currentType) {
            const restriction = invoiceService.invoiceTypeChangeRestriction(state, existing);
            if (restriction) fail(restriction.code, restriction.message, 'invoice:auditable-retification', { invoiceId: existing.id });
        }
        return true;
    }

    function createInvoiceRetificationContext(service) {
        const context = Object.create(service);
        Object.defineProperties(context, {
            assertNoActiveInvoiceDocumentPendency: {
                value: () => true,
                configurable: true
            },
            assertOrdinaryUnidentifiedMutationAllowed: {
                value: () => true,
                configurable: true
            }
        });
        return context;
    }

    function protectInvoiceService(service) {
        if (!service || typeof service.save !== 'function' || typeof service.getState !== 'function') return false;
        if (service.__radarAuditableRetificationSave === true) return true;

        const originalSave = service.save;
        service.save = async function saveWithAuditableRetification(input = {}) {
            const state = this.getState();
            const existing = currentInvoice(state, input.id);
            if (!isRetifiableInvoice(state, existing)) {
                return originalSave.call(this, input);
            }

            assertRetificationIdentity(state, existing, input);
            const context = createInvoiceRetificationContext(this);
            return originalSave.call(context, input);
        };

        Object.defineProperty(service, '__radarAuditableRetificationSave', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function isManualPendency(pendency = {}) {
        return !pendencyDomain.isDocumentaryPendency(pendency);
    }

    function protectPendencyService(service) {
        if (!service || typeof service.getState !== 'function'
            || !service.dataService || typeof service.dataService.execute !== 'function'
            || typeof service.persistPendencyCommand !== 'function') return false;
        if (service.__radarAuditableRetificationPendency === true) return true;

        service.retifyManualDetails = async function retifyManualDetails(input = {}) {
            this.assertCapability(accessPolicy.CAPABILITIES.OPEN_PENDENCY, 'retifyManualDetails');
            const pendencyId = text(input.pendencyId);
            const initialState = this.getState();
            const initialPendency = (initialState.pendencies || [])
                .find(item => text(item.id) === pendencyId);
            if (!initialPendency) {
                fail('NOT_FOUND', 'Pendência não localizada.', 'retifyManualDetails', { pendencyId });
            }
            if (!isManualPendency(initialPendency)) {
                fail(
                    'INVALID_RETIFICATION_TARGET',
                    'Pendências documentais devem continuar usando a edição documental canônica.',
                    'retifyManualDetails',
                    { pendencyId }
                );
            }

            const item = text(input.item);
            const reason = text(input.reason || input.motivo);
            const responsible = text(input.responsible || input.responsavel);
            const observation = text(input.observation || input.observacao);
            if (!item || !reason || !responsible || !observation) {
                fail(
                    'VALIDATION_FAILED',
                    'Item, motivo, responsável e observação são obrigatórios na retificação da Pendência.',
                    'retifyManualDetails',
                    { pendencyId }
                );
            }

            const currentItem = text(initialPendency.item);
            const currentResponsible = text(initialPendency.responsavel);
            if ((!MANUAL_ITEMS.includes(item) && item !== currentItem)
                || (!MANUAL_RESPONSIBLES.includes(responsible) && responsible !== currentResponsible)) {
                fail(
                    'VALIDATION_FAILED',
                    'Item e responsável devem usar opções já previstas no cadastro da Pendência.',
                    'retifyManualDetails',
                    { pendencyId }
                );
            }

            const unchanged = currentItem === item
                && text(initialPendency.motivo) === reason
                && currentResponsible === responsible
                && text(initialPendency.observacao) === observation;
            if (unchanged) {
                return {
                    ok: true,
                    value: { pendency: cloneValue(initialPendency), unchanged: true }
                };
            }

            const persistence = {
                operation: 'update_status',
                pendencyId,
                expectedPendencyVersion: rowVersionOf(initialPendency),
                logId: null
            };

            return this.dataService.execute({
                name: 'pendency:retify-manual-details',
                changedEntities: ['pendencies', 'administrativeLogs'],
                incrementalStateEntities: ['pendencies', 'administrativeLogs'],
                remoteResultIsAuthoritative: true,
                mutate: () => {
                    const state = this.getState();
                    const index = (state.pendencies || []).findIndex(entry => text(entry.id) === pendencyId);
                    if (index < 0) fail('NOT_FOUND', 'Pendência não localizada.', 'retifyManualDetails');
                    const current = state.pendencies[index];
                    if (!isManualPendency(current)) {
                        fail(
                            'INVALID_RETIFICATION_TARGET',
                            'A Pendência passou a ter contexto documental e não pode ser retificada por este fluxo.',
                            'retifyManualDetails',
                            { pendencyId }
                        );
                    }

                    const structuralDocumentKey = text(
                        current.documentoKey
                        || current.document_key
                        || current.item
                    );
                    const differences = [
                        ['Item', text(current.item), item],
                        ['Motivo', text(current.motivo), reason],
                        ['Responsável', text(current.responsavel), responsible],
                        ['Observação', text(current.observacao), observation]
                    ].filter(([, before, after]) => before !== after);
                    const next = cloneValue(current);
                    next.item = item;
                    next.documentoKey = structuralDocumentKey;
                    next.motivo = reason;
                    next.responsavel = responsible;
                    next.observacao = observation;
                    state.pendencies[index] = next;

                    const changeSummary = differences
                        .map(([label, before, after]) => `${label}: "${before}" → "${after}"`)
                        .join('; ');
                    const log = this.appendSchoolLog(
                        next.escolaId,
                        'Pendência Retificada',
                        `Pendência ${next.id} retificada. ${changeSummary}. Status, competência, contexto e histórico preservados.`
                    );
                    persistence.logId = text(log?.id);
                    return { pendency: cloneValue(next), unchanged: false };
                },
                persist: context => this.persistPendencyCommand(context, persistence)
            });
        };

        Object.defineProperty(service, '__radarAuditableRetificationPendency', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function stateFromRoot(root) {
        const service = root?.RadarApplicationServices?.invoices
            || root?.RadarApplicationServices?.pendencies;
        return typeof service?.getState === 'function' ? service.getState() : null;
    }

    function currentAccessProfile(root) {
        try {
            return typeof root?.getRadarAccessProfile === 'function'
                ? normalizeProfile(root.getRadarAccessProfile())
                : '';
        } catch (_error) {
            return '';
        }
    }

    function canRetifyInvoiceInUi(root, state, invoice) {
        const profile = currentAccessProfile(root);
        if (!['controlador', 'assistente'].includes(profile)) return false;
        return isRetifiableInvoice(state, invoice);
    }

    function invoiceEditLabel(root, invoice = {}) {
        if (typeof root?.getInvoiceDocumentTitle === 'function') {
            return `Editar lançamento: ${text(root.getInvoiceDocumentTitle(invoice))}`;
        }
        const type = normalizeType(invoice.tipo || invoice.expense_type);
        const number = text(invoice.numero || invoice.invoice_number || invoice.id);
        if (type === UNIDENTIFIED_EXPENSE_TYPE) return 'Editar lançamento: despesa a identificar';
        if (type === 'boleto_internet') return `Editar lançamento: Boleto Internet ${number}`;
        return `Editar lançamento: NF ${number}`;
    }

    function presentInvoiceEditButton(root, button, invoice) {
        button.dataset.auditableRetificationEdit = 'true';
        button.setAttribute('aria-label', invoiceEditLabel(root, invoice));
        const currentClass = text(button.getAttribute('class'));
        button.setAttribute(
            'class',
            `${currentClass} btn btn-secondary btn-sm invoice-retification-edit-action`.trim()
        );
        button.setAttribute(
            'style',
            'width:auto;height:30px;padding:0 9px;display:inline-flex;align-items:center;gap:5px;opacity:1;white-space:nowrap;border:1px solid rgba(91,33,182,.18);background:rgba(91,33,182,.06);font-size:.72rem;font-weight:700;'
        );
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l4.2-1 9.8-9.8-3.2-3.2-9.8 9.8z"/><path d="M13.8 7l3.2 3.2"/></svg><span>Editar lançamento</span>';
        return button;
    }

    function createInvoiceEditButton(root, invoice) {
        const button = root.document.createElement('button');
        button.type = 'button';
        presentInvoiceEditButton(root, button, invoice);
        button.addEventListener('click', () => {
            root.abrirEditarNota?.(text(invoice.id), text(invoice.escolaId || invoice.school_id));
        });
        return button;
    }

    function decorateInvoiceRows(root) {
        if (!root?.document) return false;
        const state = stateFromRoot(root);
        if (!state) return false;

        root.document.querySelectorAll('.invoice-document-row[data-invoice-id]').forEach(row => {
            const invoiceId = text(row.dataset.invoiceId);
            const invoice = currentInvoice(state, invoiceId);
            if (!canRetifyInvoiceInUi(root, state, invoice)) return;
            if (row.querySelector('[data-auditable-retification-edit]')) return;
            const existingEdit = Array.from(row.querySelectorAll('button[aria-label^="Editar "]'))
                .find(button => !text(button.getAttribute('aria-label')).includes('análise'));
            if (existingEdit) {
                presentInvoiceEditButton(root, existingEdit, invoice);
                return;
            }

            const titleLine = row.querySelector('.invoice-document-title-line');
            if (!titleLine) return;
            let actions = titleLine.querySelector('.invoice-document-inline-actions');
            if (!actions) {
                actions = root.document.createElement('span');
                actions.className = 'invoice-document-inline-actions';
                titleLine.appendChild(actions);
            }
            actions.appendChild(createInvoiceEditButton(root, invoice));
        });
        return true;
    }

    function resetInvoiceTypeLock(root) {
        const select = root?.document?.getElementById('nota-tipo');
        if (!select) return false;
        select.disabled = false;
        select.removeAttribute('aria-describedby');
        delete select.dataset.auditableRetificationLocked;
        root.document.querySelector('[data-auditable-retification-type-hint]')?.remove();
        root.document.querySelector('[data-auditable-retification-guidance]')?.remove();
        root.document.getElementById('invoice-edit-context')?.remove();
        root.document.getElementById('invoice-classification-preview')?.remove();
        return true;
    }

    const TYPE_LABELS = Object.freeze({
        consumo: 'Material de consumo',
        servico: 'Prestação de serviço',
        permanente: 'Bem permanente',
        boleto_internet: 'Boleto de internet',
        a_identificar: 'Despesa a identificar'
    });

    function classificationEffect(previousType, nextType) {
        const effects = [];
        if (nextType === 'servico') effects.push('O lançamento passará a seguir o fluxo de Prestação de Serviço, com Consulta à Assessoria.');
        else if (nextType === 'permanente') effects.push('Será criado e vinculado um bem para acompanhamento em Capital e Inventário.');
        else if (previousType === 'servico') effects.push('O lançamento deixará de seguir o fluxo de Consulta à Assessoria.');
        else effects.push('O lançamento passará a seguir as etapas aplicáveis ao novo tipo de gasto.');
        if (previousType === 'permanente' && nextType !== 'permanente') {
            effects.push('O bem vinculado, ainda não inventariado, será removido do acompanhamento patrimonial.');
        }
        return effects.join(' ');
    }

    function appendText(root, parent, tag, content, className = '') {
        const element = root.document.createElement(tag);
        element.textContent = content;
        if (className) element.className = className;
        parent.appendChild(element);
        return element;
    }

    function renderInvoiceEditContext(root, state, invoice) {
        const form = root.document.getElementById('form-dados-nota');
        if (!form) return;
        root.document.getElementById('invoice-edit-context')?.remove();
        const heading = root.document.querySelector('#modal-dados-nota h3');
        if (heading) heading.textContent = 'Editar lançamento';
        const context = invoiceContext(invoice);
        const school = (state.schools || []).find(item => text(item.id) === context.schoolId);
        const program = (state.programs || []).find(item => text(item.id) === text(invoice.programaId || invoice.program_id));
        const card = root.document.createElement('div');
        card.id = 'invoice-edit-context';
        card.className = 'invoice-edit-context';
        appendText(root, card, 'strong', `${text(invoice.numero) ? 'NF: ' + text(invoice.numero) : 'Sem número/referência'} · ${TYPE_LABELS[normalizeType(invoice.tipo)] || text(invoice.tipo)}`);
        const competence = text(invoice.competencia) || context.compKey.split('_')[0];
        const formattedCompetence = /^\d{4}-\d{2}$/.test(competence) ? competence.slice(5) + '/' + competence.slice(0, 4) : competence;
        appendText(root, card, 'span', `${text(school?.denominação || school?.name) || context.schoolId} · ${formattedCompetence} · ${text(program?.name) || text(invoice.programaId)}`);
        form.prepend(card);
        const intro = root.document.getElementById('nota-modal-intro');
        if (intro) intro.hidden = true;
    }

    function ensureInvoiceRetificationGuidance(root, state, invoice, group) {
        if (!group || !invoice) return false;
        root.document.querySelector('[data-auditable-retification-guidance]')?.remove();
        const guidance = root.document.createElement('div');
        guidance.className = 'invoice-retification-guidance';
        guidance.dataset.auditableRetificationGuidance = 'true';
        guidance.setAttribute('role', 'note');
        const hasHistory = invoiceHistory(state || {}, invoice.id).length > 0;
        const restriction = invoiceService.invoiceTypeChangeRestriction(state, invoice);
        appendText(root, guidance, 'strong', 'Você pode corrigir');
        let message;
        if (normalizeType(invoice.tipo || invoice.expense_type) === UNIDENTIFIED_EXPENSE_TYPE) {
            message = 'Descrição, referência e valor. A despesa continuará “A identificar”.'
                + (hasHistory ? ' A Pendência e o histórico serão preservados.' : '');
        } else {
            message = restriction
                ? 'Descrição, número/referência e valor. A Pendência e o histórico serão preservados.'
                : 'Descrição, número/referência, valor e classificação. O histórico anterior será preservado.';
        }
        appendText(root, guidance, 'span', message);
        const firstField = root.document.getElementById('nota-desc')?.closest('.form-group');
        (firstField || group.closest('.form-row') || group).before(guidance);
        return true;
    }

    function applyInvoiceTypeLock(root, invoiceId) {
        const state = stateFromRoot(root);
        const invoice = currentInvoice(state || {}, invoiceId);
        if (!invoice) return false;
        const select = root?.document?.getElementById('nota-tipo');
        if (!select) return false;
        const restriction = invoiceService.invoiceTypeChangeRestriction(state, invoice);
        select.disabled = Boolean(restriction);
        if (restriction) select.dataset.auditableRetificationLocked = 'true';
        else delete select.dataset.auditableRetificationLocked;

        const group = select.closest('.form-group');
        renderInvoiceEditContext(root, state, invoice);
        if (group) ensureInvoiceRetificationGuidance(root, state || {}, invoice, group);
        if (group && !group.querySelector('[data-auditable-retification-type-hint]')) {
            const hint = root.document.createElement('small');
            hint.className = 'form-hint';
            hint.dataset.auditableRetificationTypeHint = 'true';
            hint.textContent = restriction ? '🔒 ' + restriction.message
                : 'A classificação pode ser corrigida. O histórico anterior continuará registrado.';
            group.appendChild(hint);
            select.setAttribute('aria-describedby', 'invoice-classification-hint');
            hint.id = 'invoice-classification-hint';
        }
        updateInvoiceClassificationPreview(root);
        return true;
    }

    function updateInvoiceClassificationPreview(root) {
        const id = root.document.getElementById('nota-id')?.value;
        const state = stateFromRoot(root) || {};
        const invoice = currentInvoice(state, id);
        const select = root.document.getElementById('nota-tipo');
        const submit = root.document.querySelector('#form-dados-nota button[type="submit"]');
        root.document.getElementById('invoice-classification-preview')?.remove();
        if (!invoice || !select || !submit) return false;
        const previousType = normalizeType(invoice.tipo);
        const nextType = normalizeType(select.value);
        const changed = previousType !== nextType;
        submit.textContent = changed ? 'Confirmar nova classificação' : 'Salvar Alterações';
        if (!changed || select.disabled) return false;
        const preview = root.document.createElement('section');
        preview.id = 'invoice-classification-preview';
        preview.className = 'invoice-classification-preview';
        preview.setAttribute('aria-live', 'polite');
        appendText(root, preview, 'strong', 'Retificação de classificação');
        const comparison = appendText(root, preview, 'div', '', 'invoice-classification-comparison');
        for (const [label, type] of [['Antes', previousType], ['Depois', nextType]]) {
            const column = appendText(root, comparison, 'div', '');
            appendText(root, column, 'small', label);
            appendText(root, column, 'strong', TYPE_LABELS[type] || type);
        }
        appendText(root, preview, 'p', classificationEffect(previousType, nextType));
        appendText(root, preview, 'small', 'Identidade, escola, competência, programa e histórico serão preservados. Descrição, número e valor seguirão os dados deste formulário.');
        select.closest('.form-row')?.after(preview);
        return true;
    }

    async function confirmInvoiceTypeChange(root, input = {}) {
        const invoice = currentInvoice(stateFromRoot(root) || {}, input.id);
        const previousType = normalizeType(invoice?.tipo);
        const nextType = normalizeType(input.expenseType);
        if (!invoice || previousType === nextType) return true;
        if (root.document.getElementById('invoice-type-retification-confirmation')) return false;
        const restriction = invoiceService.invoiceTypeChangeRestriction(stateFromRoot(root) || {}, invoice);
        if (restriction) fail(restriction.code, restriction.message, 'invoice:save', { invoiceId: input.id });
        return new Promise(resolve => {
            const dialog = root.document.createElement('dialog');
            dialog.id = 'invoice-type-retification-confirmation';
            dialog.className = 'invoice-classification-dialog';
            dialog.setAttribute('aria-labelledby', 'invoice-type-confirmation-title');
            const title = appendText(root, dialog, 'h3', 'Confirmar alteração de classificação?');
            title.id = 'invoice-type-confirmation-title';
            appendText(root, dialog, 'p', `${TYPE_LABELS[previousType]} → ${TYPE_LABELS[nextType]}`, 'invoice-classification-dialog-transition');
            appendText(root, dialog, 'p', classificationEffect(previousType, nextType));
            appendText(root, dialog, 'p', 'O histórico anterior será preservado. Os demais dados serão salvos conforme o formulário.');
            const actions = appendText(root, dialog, 'div', '', 'invoice-classification-dialog-actions');
            const finish = accepted => {
                dialog.close();
                dialog.remove();
                root.document.querySelector('#form-dados-nota button[type="submit"]')?.focus();
                resolve(accepted);
            };
            const cancel = appendText(root, actions, 'button', 'Cancelar', 'btn btn-secondary');
            cancel.type = 'button';
            cancel.addEventListener('click', () => finish(false));
            const confirm = appendText(root, actions, 'button', 'Confirmar alteração', 'btn btn-primary');
            confirm.type = 'button';
            confirm.addEventListener('click', () => finish(true));
            dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
            root.document.body.appendChild(dialog);
            dialog.showModal();
            cancel.focus();
        });
    }

    function manualPendencyFromDrawer(root) {
        const drawer = root?.document?.getElementById('pendency-preview-drawer');
        const id = text(drawer?.dataset?.pendencyId);
        const service = root?.RadarApplicationServices?.pendencies;
        const state = typeof service?.getState === 'function' ? service.getState() : null;
        return (state?.pendencies || []).find(item => text(item.id) === id) || null;
    }

    function appendSelectOptions(root, select, values, current) {
        values.forEach(value => {
            const option = root.document.createElement('option');
            option.value = value;
            option.textContent = value;
            option.selected = value === current;
            select.appendChild(option);
        });
    }

    function ensureManualPendencyFields(root) {
        const drawer = root?.document?.getElementById('pendency-preview-drawer');
        if (!drawer || drawer.dataset.mode !== 'edit') return false;
        const pendency = manualPendencyFromDrawer(root);
        if (!pendency || !isManualPendency(pendency)) return false;
        const content = drawer.querySelector('#pendency-preview-content');
        const reasonField = content?.querySelector('.pendency-preview-field:has(#pendency-preview-reason)');
        if (!content || !reasonField) return false;

        if (!content.querySelector('#pendency-preview-item')) {
            const itemField = root.document.createElement('div');
            itemField.className = 'pendency-preview-field';
            const itemLabel = root.document.createElement('label');
            itemLabel.htmlFor = 'pendency-preview-item';
            itemLabel.textContent = 'Item';
            const itemSelect = root.document.createElement('select');
            itemSelect.id = 'pendency-preview-item';
            itemSelect.required = true;
            const current = text(pendency.item);
            const values = [...MANUAL_ITEMS];
            if (current && !values.includes(current)) values.unshift(current);
            appendSelectOptions(root, itemSelect, values, current);
            itemField.append(itemLabel, itemSelect);
            reasonField.before(itemField);
        }

        if (!content.querySelector('#pendency-preview-responsible')) {
            const responsibleField = root.document.createElement('div');
            responsibleField.className = 'pendency-preview-field';
            const responsibleLabel = root.document.createElement('label');
            responsibleLabel.htmlFor = 'pendency-preview-responsible';
            responsibleLabel.textContent = 'Responsável';
            const responsibleSelect = root.document.createElement('select');
            responsibleSelect.id = 'pendency-preview-responsible';
            const current = text(pendency.responsavel);
            const values = [...MANUAL_RESPONSIBLES];
            if (current && !values.includes(current)) values.unshift(current);
            appendSelectOptions(root, responsibleSelect, values, current);
            responsibleField.append(responsibleLabel, responsibleSelect);
            reasonField.after(responsibleField);
        }
        return true;
    }

    async function saveManualPendencyDrawer(root) {
        const drawer = root.document.getElementById('pendency-preview-drawer');
        const pendency = manualPendencyFromDrawer(root);
        const service = root.RadarApplicationServices?.pendencies;
        if (!drawer || !pendency || !service?.retifyManualDetails) return false;

        try {
            await service.retifyManualDetails({
                pendencyId: pendency.id,
                item: text(root.document.getElementById('pendency-preview-item')?.value),
                reason: text(root.document.getElementById('pendency-preview-reason')?.value),
                responsible: text(root.document.getElementById('pendency-preview-responsible')?.value),
                observation: text(root.document.getElementById('pendency-preview-observation')?.value)
            });
            root.rebuildOperationalIndexes?.();
            drawer.dataset.mode = 'view';
            root.renderPendencyDrawer?.();
            root.renderPendencias?.();
            root.updateAlertsBell?.();
            return true;
        } catch (error) {
            root.reportRadarPersistenceError?.(error);
            root.alert?.(error?.cause?.message || error?.message || 'Não foi possível retificar a Pendência.');
            return false;
        }
    }

    function installUi(root) {
        if (!root?.document) return false;
        if (root.__radarAuditableRetificationUi === true) {
            decorateInvoiceRows(root);
            ensureManualPendencyFields(root);
            return true;
        }
        if (typeof root.renderProntuario !== 'function'
            || typeof root.abrirEditarNota !== 'function'
            || typeof root.openModalDadosNota !== 'function'
            || typeof root.renderPendencyDrawer !== 'function'
            || typeof root.handlePendencyDrawerPrimaryAction !== 'function') {
            return false;
        }

        const originalRenderProntuario = root.renderProntuario;
        root.renderProntuario = function renderProntuarioWithAuditableRetification(...args) {
            const result = originalRenderProntuario.apply(this, args);
            decorateInvoiceRows(root);
            return result;
        };

        const originalOpenModalDadosNota = root.openModalDadosNota;
        root.openModalDadosNota = function openModalDadosNotaWithUnlockedType(...args) {
            resetInvoiceTypeLock(root);
            const intro = root.document.getElementById('nota-modal-intro');
            if (intro) intro.hidden = false;
            return originalOpenModalDadosNota.apply(this, args);
        };

        const originalAbrirEditarNota = root.abrirEditarNota;
        root.abrirEditarNota = function abrirEditarNotaWithAuditableRetification(notaId, escolaId, ...args) {
            resetInvoiceTypeLock(root);
            const result = originalAbrirEditarNota.call(this, notaId, escolaId, ...args);
            if (result !== false) applyInvoiceTypeLock(root, notaId);
            return result;
        };

        const originalRenderPendencyDrawer = root.renderPendencyDrawer;
        root.renderPendencyDrawer = function renderPendencyDrawerWithManualFields(...args) {
            const result = originalRenderPendencyDrawer.apply(this, args);
            ensureManualPendencyFields(root);
            return result;
        };

        const originalHandlePendencyDrawerPrimaryAction = root.handlePendencyDrawerPrimaryAction;
        root.handlePendencyDrawerPrimaryAction = async function handlePendencyDrawerPrimaryActionWithRetification(...args) {
            const drawer = root.document.getElementById('pendency-preview-drawer');
            const pendency = manualPendencyFromDrawer(root);
            if (drawer?.dataset?.mode === 'edit' && pendency && isManualPendency(pendency)) {
                return saveManualPendencyDrawer(root);
            }
            const result = await originalHandlePendencyDrawerPrimaryAction.apply(this, args);
            ensureManualPendencyFields(root);
            return result;
        };

        Object.defineProperty(root, '__radarAuditableRetificationUi', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        root.document.getElementById('nota-tipo')?.addEventListener('change', () => updateInvoiceClassificationPreview(root));
        decorateInvoiceRows(root);
        ensureManualPendencyFields(root);
        return true;
    }

    function install(root) {
        const invoiceInstalled = protectInvoiceService(root?.RadarApplicationServices?.invoices);
        const pendencyInstalled = protectPendencyService(root?.RadarApplicationServices?.pendencies);
        const uiInstalled = root?.document ? installUi(root) : true;
        return Boolean(invoiceInstalled && pendencyInstalled && uiInstalled);
    }

    return Object.freeze({
        UNIDENTIFIED_EXPENSE_TYPE,
        MANUAL_ITEMS,
        MANUAL_RESPONSIBLES,
        invoiceHistory,
        isRetifiableInvoice,
        assertRetificationIdentity,
        protectInvoiceService,
        isManualPendency,
        protectPendencyService,
        decorateInvoiceRows,
        ensureInvoiceRetificationGuidance,
        applyInvoiceTypeLock,
        classificationEffect,
        updateInvoiceClassificationPreview,
        confirmInvoiceTypeChange,
        ensureManualPendencyFields,
        installUi,
        install
    });
}));
