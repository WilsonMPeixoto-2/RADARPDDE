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
            if (name === 'escolas' && typeof escolas !== 'undefined') return escolas;
            if (name === 'programas' && typeof programas !== 'undefined') return programas;
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
            option.hidden = true;
            option.disabled = true;
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

    function setUnidentifiedOptionAvailability(allowed) {
        const select = ensureTypeOption();
        const option = select?.querySelector(`option[value="${TYPE}"]`);
        if (!select || !option) return false;
        const enabled = Boolean(allowed);
        option.hidden = !enabled;
        option.disabled = !enabled;
        select.dataset.allowUnidentifiedExpense = enabled ? 'true' : 'false';
        if (!enabled && select.value === TYPE) select.value = 'consumo';
        return enabled;
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

    function ensureAutomaticClassificationNotice(modal) {
        if (!modal) return null;
        let notice = modal.querySelector('[data-unidentified-expense-classification]');
        if (notice) return notice;

        notice = root.document.createElement('section');
        notice.className = 'unidentified-expense-classification';
        notice.dataset.unidentifiedExpenseClassification = 'true';
        notice.hidden = true;
        notice.innerHTML = `
            <span class="unidentified-expense-classification-label">Classificação automática</span>
            <strong>Despesa a identificar</strong>
            <small>A natureza do gasto só será definida quando o primeiro documento for recebido.</small>
        `;
        const intro = root.document.getElementById('nota-modal-intro');
        if (intro?.parentNode) intro.insertAdjacentElement('afterend', notice);
        return notice;
    }

    function syncExpenseContext(modal) {
        const schoolId = text(root.document.getElementById('nota-escola-id')?.value);
        const compKey = text(root.document.getElementById('nota-comp-key')?.value);
        const intro = root.document.getElementById('nota-modal-intro');
        if (!modal || !intro) return;
        let context = modal.querySelector('[data-expense-context]');
        if (!context) {
            context = root.document.createElement('p');
            context.className = 'expense-modal-context';
            context.dataset.expenseContext = 'true';
            intro.insertAdjacentElement('beforebegin', context);
        }
        const school = getLegacyValue('escolas', []).find(item => String(item.id) === schoolId);
        const programId = compKey.slice(8);
        const program = getLegacyValue('programas', []).find(item => String(item.id) === programId);
        const competence = compKey.slice(0, 7);
        const formattedCompetence = /^\d{4}-\d{2}$/.test(competence)
            ? `${competence.slice(5)}/${competence.slice(0, 4)}` : competence;
        context.textContent = [
            school?.denominação || school?.denominacao || schoolId,
            formattedCompetence,
            program?.name || programId
        ].filter(Boolean).join(' · ');
        context.hidden = !context.textContent;
    }

    function syncUnidentifiedPresentation({
        modal,
        select,
        unidentified,
        invoiceId
    }) {
        const typeRow = select?.closest('.form-row') || select?.closest('.form-group');
        if (typeRow) typeRow.hidden = unidentified;

        const notice = ensureAutomaticClassificationNotice(modal);
        if (notice) notice.hidden = !unidentified;

        const observationGroup = root.document.getElementById(
            'nota-unidentified-observation-group'
        );
        const observationInput = root.document.getElementById(
            'nota-unidentified-observation'
        );
        const creatingUnidentified = unidentified && !invoiceId;
        if (observationGroup) observationGroup.hidden = !creatingUnidentified;
        if (!creatingUnidentified && observationInput) observationInput.value = '';

        if (select) {
            if (unidentified) {
                select.disabled = true;
                select.setAttribute('aria-hidden', 'true');
            } else {
                select.removeAttribute('aria-hidden');
                if (select.dataset.auditableRetificationLocked !== 'true') {
                    select.disabled = false;
                }
            }
        }
    }

    function syncModalFields() {
        const select = ensureTypeOption();
        const numberInput = root.document.getElementById('nota-numero');
        if (!select || !numberInput) return false;

        const label = root.document.querySelector('label[for="nota-numero"]');
        const descriptionLabel = root.document.querySelector('label[for="nota-desc"]');
        const hint = ensureHint(numberInput);
        const modal = root.document.getElementById('modal-dados-nota');
        const description = root.document.getElementById('nota-desc');
        const invoiceId = text(root.document.getElementById('nota-id')?.value);
        const title = modal?.querySelector('h3');
        const intro = root.document.getElementById('nota-modal-intro');
        const submit = modal?.querySelector('button[type="submit"]');
        const legacyUnidentifiedEdit = Boolean(invoiceId && select.value === TYPE);
        const unidentifiedAllowed = select.dataset.allowUnidentifiedExpense === 'true'
            || legacyUnidentifiedEdit;
        setUnidentifiedOptionAvailability(unidentifiedAllowed);
        if (!unidentifiedAllowed && select.value === TYPE) select.value = 'consumo';
        const unidentified = unidentifiedAllowed && select.value === TYPE;

        syncExpenseContext(modal);

        syncUnidentifiedPresentation({
            modal,
            select,
            unidentified,
            invoiceId
        });

        numberInput.required = !unidentified;
        numberInput.setAttribute('aria-required', unidentified ? 'false' : 'true');
        numberInput.placeholder = unidentified
            ? 'Opcional enquanto a documentação estiver pendente'
            : DEFAULT_NUMBER_PLACEHOLDER;
        if (label) {
            label.textContent = unidentified
                ? 'Referência provisória (opcional)'
                : 'Número da Nota Fiscal';
        }
        if (descriptionLabel) {
            descriptionLabel.textContent = unidentified
                ? 'Descrição provisória da saída'
                : 'Descrição do Gasto';
        }
        if (hint) {
            hint.hidden = !unidentified;
            if (unidentified) {
                hint.textContent = 'Não informe natureza do gasto ou número de Nota Fiscal sem documentação. A classificação permanece automaticamente como “Despesa a identificar”.';
            }
        }
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
        if (intro) {
            intro.textContent = unidentified
                ? (invoiceId
                    ? 'Corrija os dados provisórios deste mesmo lançamento. A Pendência e seu histórico permanecem vinculados; o documento recebido deve ser registrado na Pendência.'
                    : 'Registre apenas os dados já conhecidos sobre a saída observada no extrato. O RADAR classificará automaticamente este lançamento como “Despesa a identificar” e abrirá a Pendência correspondente.')
                : (invoiceId
                    ? 'Corrija os dados deste mesmo lançamento. Salvar as alterações não cria outra despesa ou Pendência.'
                    : 'Cadastre o gasto referente a esta Nota Fiscal para que o sistema direcione as obrigações operacionais corretas.');
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
        setUnidentifiedOptionAvailability(true);
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
        button.className = 'btn btn-secondary btn-sm unidentified-expense-button prontuario-tooltip prontuario-tooltip-up prontuario-tooltip-align-start';
        button.dataset.registerUnidentifiedExpense = 'true';
        button.dataset.tooltip = 'Use quando houver uma saída no extrato, mas a documentação ainda não permitir identificar a natureza da despesa ou o documento fiscal.';
        button.setAttribute('aria-label', 'Registrar despesa a identificar');
        button.textContent = 'Registrar despesa a identificar';
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
                    const select = ensureTypeOption();
                    const invoiceId = text(root.document.getElementById('nota-id')?.value);
                    const editingHistoricalUnidentified = Boolean(
                        invoiceId && select?.value === TYPE
                    );
                    setUnidentifiedOptionAvailability(editingHistoricalUnidentified);
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
