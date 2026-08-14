(function installRadarProntuarioOperationalUx(root) {
    'use strict';

    if (!root?.document || root.RadarProntuarioOperationalUx) return;

    const SENT_LABEL_PREFIX = 'Consulta enviada à Assessoria para a NF ';
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
        const fiscalNoteRow = rowsByDocument.get('notaFiscal');
        const advisoryRow = rowsByDocument.get('consAssessoria');
        if (!fiscalNoteRow || !advisoryRow) return;

        const invoiceCards = Array.from(
            fiscalNoteRow.querySelectorAll('[data-service-advisory-invoice]')
        );
        invoiceCards.forEach(decorateInvoiceCard);
        if (!invoiceCards.length) return;

        const checkboxes = Array.from(advisoryRow.querySelectorAll(
            `input[type="checkbox"][aria-label^="${SENT_LABEL_PREFIX}"]`
        ));
        const usedCards = new Set();

        checkboxes.forEach((checkbox, index) => {
            const accessibleLabel = text(checkbox.getAttribute('aria-label'));
            const invoiceNumber = accessibleLabel.slice(SENT_LABEL_PREFIX.length).trim();
            const card = findInvoiceCard(invoiceCards, invoiceNumber, index, usedCards);
            const label = checkbox.closest('label');
            if (!card || !label) return;

            label.classList.add('service-invoice-advisory-toggle');
            const copy = label.querySelector('span');
            if (copy) copy.textContent = 'Enviada à Assessoria';
            card.appendChild(label);
        });
    }

    function enhanceProntuario() {
        const rows = getVerificationRows();
        if (!rows.length) return false;

        getProgramGroups(rows).forEach(group => {
            decorateProgramGroup(group);
            moveServiceAdvisoryControls(group);
        });
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
