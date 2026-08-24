(function installProntuarioStructuralRedesign(root) {
    'use strict';

    if (!root || typeof document === 'undefined') return;

    const MIN_WIDTH = 641;
    let scheduled = false;
    let observer = null;

    function text(node) {
        return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function slug(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function markDossier() {
        const dossier = document.querySelector('.school-dossier');
        if (!dossier) return false;

        dossier.classList.add('radar-school-summary-v4');
        const header = dossier.querySelector('.school-dossier-header');
        const title = header?.querySelector('h2');
        if (header && title && !header.querySelector('.radar-school-summary-kicker')) {
            const kicker = document.createElement('span');
            kicker.className = 'radar-school-summary-kicker';
            kicker.textContent = 'Ficha institucional';
            header.insertBefore(kicker, title);
        }
        return true;
    }

    function decorateVerificationRows() {
        if (root.innerWidth < MIN_WIDTH) return false;

        const panel = document.querySelector('#tab-verificacoes .panel-card');
        const table = Array.from(panel?.querySelectorAll('table.data-table') || []).find(candidate => (
            candidate.querySelector('tbody#prontuario-verif-rows > tr[data-program-id]')
        ));
        const tbody = table?.querySelector('tbody#prontuario-verif-rows');
        if (!panel || !table || !tbody) return false;

        const headers = Array.from(table.querySelectorAll('thead th')).map(text);
        const detailHeaders = headers.slice(1);
        const rows = Array.from(tbody.querySelectorAll(':scope > tr[data-program-id]'));
        if (!rows.length) return false;

        panel.classList.add('radar-verification-workspace-v4');
        table.classList.add('radar-program-ledger-v4');
        tbody.classList.add('radar-program-ledger-body-v4');

        let currentGroup = [];
        let currentProgram = '';
        const groups = [];

        rows.forEach(row => {
            const programId = String(row.dataset.programId || '').trim();
            const startsGroup = Boolean(row.querySelector(':scope > td[rowspan]'))
                || !currentGroup.length
                || programId !== currentProgram;

            if (startsGroup) {
                if (currentGroup.length) groups.push(currentGroup);
                currentGroup = [];
                currentProgram = programId;
            }
            currentGroup.push(row);
        });
        if (currentGroup.length) groups.push(currentGroup);

        groups.forEach(group => {
            group.forEach((row, rowIndex) => {
                row.classList.add('radar-program-row-v4');
                row.classList.toggle('radar-program-row-v4--first', rowIndex === 0);
                row.classList.toggle('radar-program-row-v4--last', rowIndex === group.length - 1);

                const cells = Array.from(row.children).filter(cell => cell.tagName === 'TD');
                const metaCell = row.querySelector(':scope > td[rowspan]');
                const detailCells = metaCell ? cells.slice(1) : cells;

                if (metaCell) {
                    metaCell.classList.add('radar-program-meta-v4');
                    const competence = metaCell.querySelector(':scope > strong');
                    const directProgramName = Array.from(metaCell.children).find(node => (
                        node.tagName === 'SPAN'
                        && !node.classList.contains('program-status-summary')
                        && !node.classList.contains('badge')
                    ));
                    competence?.classList.add('radar-program-meta-competence-v4');
                    directProgramName?.classList.add('radar-program-meta-name-v4');
                    metaCell.querySelector('.program-status-summary')?.classList.add('radar-program-meta-summary-v4');
                    metaCell.querySelectorAll(':scope > button').forEach(button => {
                        button.classList.add('radar-program-meta-action-v4');
                    });
                }

                detailCells.forEach((cell, index) => {
                    const label = detailHeaders[index] || `Campo ${index + 1}`;
                    cell.dataset.radarFieldLabel = label;
                    cell.classList.add('radar-program-field-v4', `radar-program-field-v4--${slug(label)}`);
                });
            });
        });

        return true;
    }

    function enhance() {
        scheduled = false;
        if (root.innerWidth < MIN_WIDTH) return;
        markDossier();
        decorateVerificationRows();
    }

    function scheduleEnhance() {
        if (scheduled) return;
        scheduled = true;
        const queue = root.requestAnimationFrame || (callback => root.setTimeout(callback, 0));
        queue(enhance);
    }

    function start() {
        scheduleEnhance();
        const target = document.querySelector('#main-container') || document.querySelector('main.content-area') || document.body;
        if (typeof MutationObserver !== 'undefined' && target) {
            observer = new MutationObserver(scheduleEnhance);
            observer.observe(target, { childList: true, subtree: true });
        }
        root.addEventListener('resize', scheduleEnhance, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

    root.RadarProntuarioStructuralRedesign = Object.freeze({
        refresh: scheduleEnhance,
        disconnect() {
            observer?.disconnect();
            observer = null;
        }
    });
}(typeof window !== 'undefined' ? window : globalThis));