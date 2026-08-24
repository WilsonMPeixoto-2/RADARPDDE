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
        if (!dossier || dossier.dataset.radarStructuralRedesign === 'true') return;
        dossier.dataset.radarStructuralRedesign = 'true';
        dossier.classList.add('radar-school-summary');

        const header = dossier.querySelector('.school-dossier-header');
        const title = header?.querySelector('h2');
        if (header && title && !header.querySelector('.radar-school-summary-kicker')) {
            const kicker = document.createElement('span');
            kicker.className = 'radar-school-summary-kicker';
            kicker.textContent = 'Cadastro da unidade';
            header.insertBefore(kicker, title);
        }
    }

    function copyProgramHeader(metaCell, section) {
        const competence = text(metaCell.querySelector('strong'));
        const directSpans = Array.from(metaCell.children).filter(node => node.tagName === 'SPAN');
        const programName = text(directSpans[0]) || metaCell.dataset.programName || 'Programa';

        const heading = document.createElement('header');
        heading.className = 'radar-program-review-header';

        const identity = document.createElement('div');
        identity.className = 'radar-program-review-identity';

        const eyebrow = document.createElement('span');
        eyebrow.className = 'radar-program-review-competence';
        eyebrow.textContent = competence;

        const title = document.createElement('h3');
        title.className = 'radar-program-review-title';
        title.textContent = programName;

        identity.append(eyebrow, title);

        const operations = document.createElement('div');
        operations.className = 'radar-program-review-operations';

        const summary = metaCell.querySelector('.program-status-summary');
        if (summary) {
            summary.classList.add('radar-program-review-summary');
            operations.appendChild(summary);
        }

        const actionButtons = Array.from(metaCell.querySelectorAll('button'));
        actionButtons.forEach(button => {
            button.classList.add('radar-program-review-action');
            operations.appendChild(button);
        });

        heading.append(identity, operations);
        section.appendChild(heading);
    }

    function decorateDocumentRow(row, labels) {
        const cells = Array.from(row.children).filter(cell => cell.tagName === 'TD');
        cells.forEach((cell, index) => {
            const label = labels[index] || `Campo ${index + 1}`;
            cell.dataset.radarFieldLabel = label;
            cell.classList.add('radar-program-review-cell', `radar-program-review-cell--${slug(label)}`);
        });
        row.classList.add('radar-program-review-row');
    }

    function buildProgramSection(programId, rows, labels) {
        const firstRow = rows[0];
        const metaCell = firstRow?.querySelector('td[rowspan]');
        if (!firstRow || !metaCell) return null;

        const section = document.createElement('section');
        section.className = 'radar-program-review';
        section.dataset.programId = programId;

        copyProgramHeader(metaCell, section);
        metaCell.remove();

        const responsive = document.createElement('div');
        responsive.className = 'radar-program-review-table-wrap';

        const table = document.createElement('table');
        table.className = 'data-table radar-program-review-table';
        table.setAttribute('aria-label', `Itens de verificação - ${text(section.querySelector('.radar-program-review-title'))}`);

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        labels.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            decorateDocumentRow(row, labels);
            tbody.appendChild(row);
        });

        table.append(thead, tbody);
        responsive.appendChild(table);
        section.appendChild(responsive);
        return section;
    }

    function enhanceVerificationWorkspace() {
        if (root.innerWidth < MIN_WIDTH) return;

        const panel = document.querySelector('#tab-verificacoes .panel-card');
        if (!panel || panel.dataset.radarStructuralRedesign === 'true') return;

        const sourceTable = Array.from(panel.querySelectorAll('table.data-table')).find(table => (
            table.querySelector('tbody > tr[data-program-id]')
            && table.querySelector('tbody > tr[data-program-id] td[rowspan]')
        ));
        if (!sourceTable) return;

        const sourceWrapper = sourceTable.closest('.table-responsive');
        if (!sourceWrapper) return;

        const headers = Array.from(sourceTable.querySelectorAll('thead th')).map(text);
        const detailHeaders = headers.slice(1);
        const rows = Array.from(sourceTable.querySelectorAll('tbody > tr[data-program-id]'));
        if (!rows.length || !detailHeaders.length) return;

        const groups = [];
        let current = null;
        rows.forEach(row => {
            const programId = String(row.dataset.programId || '').trim();
            if (!current || current.programId !== programId) {
                current = { programId, rows: [] };
                groups.push(current);
            }
            current.rows.push(row);
        });

        const stack = document.createElement('div');
        stack.className = 'radar-program-review-stack';
        stack.dataset.radarProgramReviewStack = 'true';

        groups.forEach(group => {
            const section = buildProgramSection(group.programId, group.rows, detailHeaders);
            if (section) stack.appendChild(section);
        });

        if (!stack.children.length) return;

        sourceWrapper.replaceWith(stack);
        panel.dataset.radarStructuralRedesign = 'true';
        panel.classList.add('radar-verification-workspace');
    }

    function enhance() {
        scheduled = false;
        if (root.innerWidth < MIN_WIDTH) return;
        markDossier();
        enhanceVerificationWorkspace();
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