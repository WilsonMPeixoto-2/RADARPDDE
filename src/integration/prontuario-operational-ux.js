(function installRadarProntuarioOperationalUx(root) {
    'use strict';

    if (!root?.document || root.RadarProntuarioOperationalUx) return;

    const SENT_LABEL_PREFIX = 'Consulta enviada à Assessoria para a NF ';
    const CONSOLIDATED_BONUS_LABELS = new Set(['apta', 'inapta']);
    const STANDARD_DOCUMENT_META = Object.freeze({
        extCC: Object.freeze({
            label: 'Extrato Conta Corrente',
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h10M7 13h5M7 16h7"/></svg>'
        }),
        extINV: Object.freeze({
            label: 'Extrato Investimento',
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5V11m5 7.5V7m5 11.5v-5m5 5V4"/><path d="M3 20h18"/></svg>'
        }),
        declBBAgil: Object.freeze({
            label: 'Declaração BB Ágil',
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h10l4 4V20.5H5z"/><path d="M15 3.5v4h4"/><path d="M8 12h8M8 15.5h6"/><path d="M8 8.5h3"/></svg>'
        }),
        encampInventario: Object.freeze({
            label: 'Encaminhado para Inventariação',
            icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16v12H4z"/><path d="M8 7.5V5h8v2.5M8 12h8M8 15.5h5"/></svg>'
        })
    });
    let installed = false;
    let originalRenderProntuario = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function getVerificationRows() {
        return Array.from(root.document.querySelectorAll(
            '#prontuario-verif-rows tr[data-program-id][data-document-key]'
        ));
    }

    function getProgramGroups(rows) {
        const groups = [];
        let currentGroup = null;

        rows.forEach(row => {
            const contextCell = row.querySelector('td[rowspan]');
            if (contextCell) {
                currentGroup = { contextCell, rows: [] };
                groups.push(currentGroup);
            }
            if (currentGroup) currentGroup.rows.push(row);
        });

        return groups;
    }

    function decorateProgramGroup(group) {
        const firstRow = group.rows[0];
        if (!firstRow || !group.contextCell) return;

        firstRow.classList.add('program-block-start');
        group.contextCell.classList.add('program-context-cell');

        const competenceLabel = group.contextCell.querySelector(':scope > strong');
        const programName = group.contextCell.querySelector(':scope > span');
        if (competenceLabel) competenceLabel.classList.add('program-context-competence');
        if (programName) programName.classList.add('program-context-name');
    }

    function getDocumentCell(row) {
        const cells = Array.from(row.querySelectorAll(':scope > td'));
        if (!cells.length) return null;
        return cells[0].hasAttribute('rowspan') ? (cells[1] || null) : cells[0];
    }

    function decorateStandardDocumentRow(row) {
        const documentKey = text(row.dataset.documentKey);
        const meta = STANDARD_DOCUMENT_META[documentKey];
        if (!meta || row.dataset.radarDocumentDecorated === 'true') return;

        const cell = getDocumentCell(row);
        if (!cell) return;
        const title = Array.from(cell.children).find(child => (
            child.tagName === 'SPAN' && text(child.textContent) === meta.label
        ));
        if (!title) return;

        row.dataset.radarDocumentDecorated = 'true';
        row.classList.add('prontuario-standard-document-row');
        cell.classList.add('prontuario-document-cell');
        title.classList.add('prontuario-document-title');
        title.removeAttribute('style');

        const icon = root.document.createElement('span');
        icon.className = `prontuario-document-icon is-${documentKey}`;
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = meta.icon;
        cell.insertBefore(icon, title);
    }

    function decorateStandardDocumentRows(rows) {
        rows.forEach(decorateStandardDocumentRow);
    }

    function findInvoiceCard(cards, invoiceNumber, fallbackIndex, usedCards) {
        const expectedLabel = `NF ${invoiceNumber}`;
        const exactMatch = cards.find(card => (
            !usedCards.has(card)
            && text(card.querySelector(':scope > strong')?.textContent) === expectedLabel
        ));
        const positionalFallback = cards[fallbackIndex];
        const card = exactMatch
            || (positionalFallback && !usedCards.has(positionalFallback) ? positionalFallback : null)
            || cards.find(candidate => !usedCards.has(candidate))
            || null;
        if (card) usedCards.add(card);
        return card;
    }

    function decorateInvoiceCard(card) {
        card.classList.add('service-invoice-card');
        const number = card.querySelector(':scope > strong');
        const description = card.querySelector(':scope > div');
        if (number) number.classList.add('service-invoice-number');
        if (description) description.classList.add('service-invoice-description');
    }

    function moveServiceAdvisoryControls(group) {
        const rowsByDocument = new Map(group.rows.map(row => [row.dataset.documentKey || '', row]));
        const advisoryRow = rowsByDocument.get('consAssessoria');
        if (!advisoryRow) return;

        const invoiceCards = Array.from(
            advisoryRow.querySelectorAll('[data-service-advisory-invoice]')
        );

        // A grade canônica atual já possui colunas próprias para Documento,
        // Envio à Assessoria, Situação técnica e Ação. O decorador abaixo
        // existe apenas para o markup legado em formato de card. Aplicá-lo
        // sobre uma .invoice-document-row transforma a linha em uma grade
        // de duas colunas e desloca os controles para cabeçalhos errados.
        const legacyInvoiceCards = invoiceCards.filter(card => (
            !card.classList.contains('invoice-document-row')
        ));
        legacyInvoiceCards.forEach(decorateInvoiceCard);
        if (!legacyInvoiceCards.length) return;

        const checkboxes = Array.from(advisoryRow.querySelectorAll(
            `input[type="checkbox"][aria-label^="${SENT_LABEL_PREFIX}"]`
        ));
        const usedCards = new Set();

        checkboxes.forEach((checkbox, index) => {
            const accessibleLabel = text(checkbox.getAttribute('aria-label'));
            const invoiceNumber = accessibleLabel.slice(SENT_LABEL_PREFIX.length).trim();
            const card = findInvoiceCard(legacyInvoiceCards, invoiceNumber, index, usedCards);
            const label = checkbox.closest('label');
            if (!card || !label) return;

            label.classList.add('service-invoice-advisory-toggle');
            const copy = label.querySelector('span');
            if (copy) copy.textContent = 'Enviada à Assessoria';
            card.appendChild(label);
        });
    }

    function isProgramBonificationConsolidated(group) {
        const badge = group.contextCell?.querySelector('[data-status-dimension="bonificacao"]');
        return CONSOLIDATED_BONUS_LABELS.has(text(badge?.textContent).toLocaleLowerCase('pt-BR'));
    }

    function rowWasNotDelivered(row) {
        if (row.querySelector('.btn-toggle.active-nao')) return true;
        const readOnlyValue = row.querySelector('[data-bonification-value]');
        return text(readOnlyValue?.getAttribute('data-bonification-value')) === 'Não'
            || text(readOnlyValue?.textContent) === 'Não';
    }

    function applyLateCorrectRestriction(group) {
        const consolidated = isProgramBonificationConsolidated(group);
        group.rows.forEach(row => {
            const requiresLate = consolidated
                && rowWasNotDelivered(row)
                && root.RadarFluxoOperacional?.requiresLateCorrect?.({
                    bonusResult: 'inapta',
                    deliveryStatus: 'Não'
                }) === true;

            row.querySelectorAll('select.select-analise').forEach(select => {
                const correctOption = select.querySelector('option[value="Correto"]');
                if (!correctOption) return;

                if (requiresLate) {
                    correctOption.disabled = true;
                    correctOption.dataset.lateCorrectDisabled = 'true';
                    select.setAttribute('data-late-correct-required', 'true');
                    select.title = 'Documento não entregue no período consolidado: se estiver correto após envio posterior, use Correto (Atrasado).';
                    return;
                }

                if (correctOption.dataset.lateCorrectDisabled === 'true') {
                    correctOption.disabled = false;
                    delete correctOption.dataset.lateCorrectDisabled;
                }
                select.removeAttribute('data-late-correct-required');
                if (select.title.startsWith('Documento não entregue no período consolidado:')) {
                    select.removeAttribute('title');
                }
            });
        });
    }

    function restoreFutureCompetenceControls() {
        root.document.querySelectorAll('[data-future-competence-disabled="true"]').forEach(control => {
            control.disabled = false;
            delete control.dataset.futureCompetenceDisabled;
            if (control.getAttribute('aria-disabled') === 'true') {
                control.removeAttribute('aria-disabled');
            }
        });
    }

    function removeFutureCompetenceNotice() {
        root.document.querySelector('[data-future-competence-notice]')?.remove();
    }

    function decorateCompetenceTabs(referenceDate) {
        const competenceApi = root.RadarCompetencia;
        if (!competenceApi?.isFutureCompetence) return;

        root.document.querySelectorAll('.comp-sub-tab[data-competence]').forEach(tab => {
            let future = false;
            try {
                future = competenceApi.isFutureCompetence(tab.dataset.competence, referenceDate);
            } catch (_error) {
                future = false;
            }
            tab.classList.toggle('future-competence-tab', future);
            if (future) tab.dataset.futureCompetence = 'true';
            else delete tab.dataset.futureCompetence;
        });
    }

    function getActiveCompetenceKey() {
        const activeTab = root.document.querySelector(
            '.comp-sub-tab.active[data-competence], .comp-sub-tab[aria-pressed="true"][data-competence]'
        );
        return text(activeTab?.dataset?.competence);
    }

    function createFutureCompetenceNotice(competenceKey) {
        const notice = root.document.createElement('div');
        notice.className = 'future-competence-notice';
        notice.setAttribute('data-future-competence-notice', 'true');
        notice.setAttribute('role', 'note');

        const strong = root.document.createElement('strong');
        strong.textContent = 'Competência futura · somente leitura';
        const detail = root.document.createElement('span');
        const label = root.RadarCompetencia?.formatCompetencia?.(competenceKey) || competenceKey;
        detail.textContent = ` ${label} permanecerá disponível para consulta, mas os lançamentos serão liberados somente no início do respectivo mês.`;
        notice.append(strong, detail);
        return notice;
    }

    function applyFutureCompetenceReadOnly(referenceDate) {
        restoreFutureCompetenceControls();
        removeFutureCompetenceNotice();
        decorateCompetenceTabs(referenceDate);

        const competenceApi = root.RadarCompetencia;
        const activeCompetence = getActiveCompetenceKey();
        if (!competenceApi?.isFutureCompetence || !activeCompetence) return false;

        let isFuture = false;
        try {
            isFuture = competenceApi.isFutureCompetence(activeCompetence, referenceDate);
        } catch (_error) {
            return false;
        }
        if (!isFuture) return false;

        const tabPanel = root.document.getElementById('tab-verificacoes');
        const competenceTabs = tabPanel?.querySelector('.comp-tabs-container');
        const rowsContainer = root.document.getElementById('prontuario-verif-rows');
        if (!tabPanel || !rowsContainer) return false;

        const notice = createFutureCompetenceNotice(activeCompetence);
        if (competenceTabs) competenceTabs.insertAdjacentElement('afterend', notice);
        else tabPanel.prepend(notice);

        rowsContainer.querySelectorAll('button, input, select, textarea').forEach(control => {
            if (control.disabled) return;
            control.disabled = true;
            control.dataset.futureCompetenceDisabled = 'true';
            control.setAttribute('aria-disabled', 'true');
        });
        return true;
    }

    function enhanceProntuario(referenceDate = new Date()) {
        const rows = getVerificationRows();
        decorateCompetenceTabs(referenceDate);
        if (!rows.length) {
            applyFutureCompetenceReadOnly(referenceDate);
            return false;
        }

        decorateStandardDocumentRows(rows);
        getProgramGroups(rows).forEach(group => {
            decorateProgramGroup(group);
            moveServiceAdvisoryControls(group);
            applyLateCorrectRestriction(group);
        });
        applyFutureCompetenceReadOnly(referenceDate);
        return true;
    }

    function install() {
        if (installed || typeof root.renderProntuario !== 'function') return installed;

        installed = true;
        originalRenderProntuario = root.renderProntuario;
        root.renderProntuario = function renderProntuarioWithOperationalUx(...args) {
            const result = originalRenderProntuario.apply(this, args);
            enhanceProntuario();
            return result;
        };
        enhanceProntuario();
        return true;
    }

    root.RadarProntuarioOperationalUx = Object.freeze({
        install,
        enhance: enhanceProntuario
    });

    install();
}(typeof window !== 'undefined' ? window : globalThis));
