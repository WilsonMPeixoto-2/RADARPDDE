(function installRadarUnidentifiedExpenseUx(root) {
    'use strict';

    if (!root?.document || root.RadarUnidentifiedExpenseUx) return;

    const TYPE = 'a_identificar';
    const DEFAULT_DESCRIPTION_PLACEHOLDER = 'Ex: Ar Condicionado Split, Pintura de Sala, Papelaria...';
    const DEFAULT_NUMBER_PLACEHOLDER = 'Ex: NF-12345';
    const UNIDENTIFIED_DESCRIPTION_PLACEHOLDER = 'Ex: Saída de R$ 850,00 observada no extrato; documentação pendente';
    let installed = false;
    let originalRenderProntuario = null;
    let originalOpenModal = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function getLegacyValue(name, fallback) {
        try {
            if (name === 'activeSchoolId' && typeof activeSchoolId !== 'undefined') return activeSchoolId;
            if (name === 'activeProntuarioCompetencia' && typeof activeProntuarioCompetencia !== 'undefined') return activeProntuarioCompetencia;
            if (name === 'notasRegistradas' && typeof notasRegistradas !== 'undefined') return notasRegistradas;
            if (name === 'verificacoes' && typeof verificacoes !== 'undefined') return verificacoes;
        } catch (_error) {
            return fallback;
        }
        return fallback;
    }

    function ensureTypeOption() {
        const select = root.document.getElementById('nota-tipo');
        if (!select) return null;
        if (!select.querySelector(`option[value="${TYPE}"]`)) {
            const previousValue = select.value || 'consumo';
            const option = root.document.createElement('option');
            option.value = TYPE;
            option.textContent = 'A identificar (documentação pendente)';
            option.defaultSelected = false;
            select.appendChild(option);
            select.value = previousValue;
            if (!select.value) select.value = 'consumo';
        }
        if (select.dataset.unidentifiedExpenseBound !== 'true') {
            select.addEventListener('change', syncModalFields);
            select.dataset.unidentifiedExpenseBound = 'true';
        }
        return select;
    }

    function ensureHint(numberInput) {
        const group = numberInput?.closest('.form-group');
        if (!group) return null;
        let hint = group.querySelector('[data-unidentified-expense-hint]');
        if (!hint) {
            hint = root.document.createElement('small');
            hint.className = 'unidentified-expense-hint';
            hint.dataset.unidentifiedExpenseHint = 'true';
            hint.textContent = 'Use “A identificar” quando a saída constar no extrato, mas a escola ainda não tiver apresentado documentação suficiente para definir a natureza do gasto ou a Nota Fiscal.';
            group.appendChild(hint);
        }
        return hint;
    }

    function syncModalFields() {
        const select = ensureTypeOption();
        const numberInput = root.document.getElementById('nota-numero');
        if (!select || !numberInput) return false;

        const label = root.document.querySelector('label[for="nota-numero"]');
        const hint = ensureHint(numberInput);
        const modal = root.document.getElementById('modal-dados-nota');
        const description = root.document.getElementById('nota-desc');
        const invoiceId = text(root.document.getElementById('nota-id')?.value);
        const title = modal?.querySelector('h3');
        const submit = modal?.querySelector('button[type="submit"]');
        const unidentified = select.value === TYPE;

        numberInput.required = !unidentified;
        numberInput.setAttribute('aria-required', unidentified ? 'false' : 'true');
        numberInput.placeholder = unidentified
            ? 'Opcional enquanto a documentação estiver pendente'
            : DEFAULT_NUMBER_PLACEHOLDER;
        if (label) {
            label.textContent = unidentified
                ? 'Número da Nota Fiscal (opcional neste estágio)'
                : 'Número da Nota Fiscal';
        }
        if (hint) hint.hidden = !unidentified;
        if (description) {
            description.placeholder = unidentified
                ? UNIDENTIFIED_DESCRIPTION_PLACEHOLDER
                : DEFAULT_DESCRIPTION_PLACEHOLDER;
        }

        if (title) {
            title.textContent = unidentified
                ? (invoiceId ? 'Editar despesa a identificar' : 'Registrar despesa a identificar')
                : (invoiceId ? 'Editar Dados da Nota Fiscal' : 'Dados da Nota Fiscal / Despesa');
        }
        if (submit) {
            submit.textContent = unidentified
                ? (invoiceId ? 'Salvar Alterações' : 'Registrar Despesa')
                : (invoiceId ? 'Salvar Alterações' : 'Salvar Gasto');
        }
        return unidentified;
    }

    function openUnidentifiedExpenseModal(schoolId, compKey) {
        if (typeof root.openModalDadosNota !== 'function') return false;
        const opened = root.openModalDadosNota(schoolId, compKey);
        if (opened === false) return false;
        const select = ensureTypeOption();
        if (!select) return false;
        select.value = TYPE;
        syncModalFields();
        const description = root.document.getElementById('nota-desc');
        if (description) description.focus({ preventScroll: true });
        return true;
    }

    function currentAccessProfile() {
        try {
            return typeof getRadarAccessProfile === 'function'
                ? text(getRadarAccessProfile()).toLocaleLowerCase('pt-BR')
                : '';
        } catch (_error) {
            return '';
        }
    }

    function canOfferUnidentifiedExpense(schoolId, compKey) {
        const profile = currentAccessProfile();
        if (!['controlador', 'assistente'].includes(profile)) return false;
        const allVerifications = getLegacyValue('verificacoes', {});
        const verification = allVerifications?.[schoolId]?.[compKey] || null;
        if (verification?.bonificacao?.notaFiscal === 'Não se aplica') return false;
        if (verification?.resultadoBonif && profile !== 'assistente') return false;
        return true;
    }

    function findDocumentCell(row) {
        return Array.from(row.cells || []).find(cell => (
            Array.from(cell.querySelectorAll(':scope > span')).some(span => text(span.textContent) === 'Notas Fiscais')
        )) || row.cells?.[0] || null;
    }

    function decorateUnidentifiedBadges(row, notes) {
        const cell = findDocumentCell(row);
        if (!cell) return;
        const badgeContainer = Array.from(cell.querySelectorAll('div')).find(container => (
            Array.from(container.children).some(child => child.classList?.contains('badge-info'))
        ));
        if (!badgeContainer) return;
        const badges = Array.from(badgeContainer.children).filter(child => child.classList?.contains('badge-info'));

        notes.forEach((note, index) => {
            if (note?.tipo !== TYPE) return;
            const badge = badges[index];
            if (!badge) return;
            badge.classList.add('unidentified-expense-badge');
            badge.dataset.unidentifiedExpense = 'true';
            badge.title = 'Natureza e documentação fiscal ainda pendentes de identificação.';
            const firstTextNode = Array.from(badge.childNodes).find(node => node.nodeType === 3);
            const amount = Number(note.valor || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const reference = text(note.numero) ? ` · ref. ${text(note.numero)}` : '';
            if (firstTextNode) {
                firstTextNode.textContent = ` Despesa a identificar${reference} (R$ ${amount}) `;
            }
            badge.querySelector('[title="Editar Nota"]')?.setAttribute('title', 'Editar despesa');
            badge.querySelector('[title="Excluir Nota"]')?.setAttribute('title', 'Excluir despesa');
        });
    }

    function addRegistrationAction(row, schoolId, compKey) {
        if (!canOfferUnidentifiedExpense(schoolId, compKey)) return;
        const cell = findDocumentCell(row);
        if (!cell || cell.querySelector('[data-register-unidentified-expense]')) return;

        let actions = cell.querySelector('[data-unidentified-expense-actions]');
        if (!actions) {
            actions = root.document.createElement('div');
            actions.className = 'unidentified-expense-actions';
            actions.dataset.unidentifiedExpenseActions = 'true';
            cell.appendChild(actions);
        }

        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm unidentified-expense-button';
        button.dataset.registerUnidentifiedExpense = 'true';
        button.textContent = 'Registrar despesa a identificar';
        button.title = 'Registrar uma saída observada no extrato enquanto a documentação da escola ainda não permite identificar a natureza ou a Nota Fiscal.';
        button.addEventListener('click', () => openUnidentifiedExpenseModal(schoolId, compKey));
        actions.appendChild(button);
    }

    function enhanceProntuario() {
        const schoolId = text(getLegacyValue('activeSchoolId', ''));
        const competence = text(getLegacyValue('activeProntuarioCompetencia', ''));
        const invoices = getLegacyValue('notasRegistradas', []);
        if (!schoolId || !competence || !Array.isArray(invoices)) return false;

        root.document.querySelectorAll('#prontuario-verif-rows tr[data-program-id][data-document-key="notaFiscal"]')
            .forEach(row => {
                if (row.querySelector('[data-invoice-document-panel]')) return;
                const programId = text(row.dataset.programId);
                const compKey = `${competence}_${programId}`;
                const notes = invoices.filter(note => (
                    note?.escolaId === schoolId && note?.compKey === compKey
                ));
                decorateUnidentifiedBadges(row, notes);
                addRegistrationAction(row, schoolId, compKey);
            });
        return true;
    }

    function install() {
        if (installed) return true;
        ensureTypeOption();

        if (typeof root.openModal === 'function') {
            originalOpenModal = root.openModal;
            root.openModal = function openModalWithUnidentifiedExpenseUx(...args) {
                const result = originalOpenModal.apply(this, args);
                if (args[0] === 'modal-dados-nota') {
                    root.queueMicrotask?.(syncModalFields);
                    if (!root.queueMicrotask) setTimeout(syncModalFields, 0);
                }
                return result;
            };
        }

        if (typeof root.renderProntuario === 'function') {
            originalRenderProntuario = root.renderProntuario;
            root.renderProntuario = function renderProntuarioWithUnidentifiedExpenseUx(...args) {
                const result = originalRenderProntuario.apply(this, args);
                enhanceProntuario();
                return result;
            };
        }

        root.openUnidentifiedExpenseModal = openUnidentifiedExpenseModal;
        installed = true;
        enhanceProntuario();
        return true;
    }

    root.RadarUnidentifiedExpenseUx = Object.freeze({
        TYPE,
        enhance: enhanceProntuario,
        install,
        open: openUnidentifiedExpenseModal,
        syncModalFields
    });

    install();
}(typeof window !== 'undefined' ? window : globalThis));
