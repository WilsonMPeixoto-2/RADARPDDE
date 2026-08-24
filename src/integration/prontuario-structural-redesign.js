(function installProntuarioStructuralRedesign(root) {
    'use strict';

    if (!root || typeof document === 'undefined') return;

    const MIN_WIDTH = 641;
    const MONTHS = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
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

    function getActiveCompetenceKey() {
        const activeTab = document.querySelector(
            '#tab-verificacoes .comp-sub-tab.active[data-competence], '
            + '#tab-verificacoes .comp-sub-tab[aria-pressed="true"][data-competence]'
        );
        const tabKey = String(activeTab?.dataset?.competence || '').trim();
        if (tabKey) return tabKey;
        return String(root.RadarCompetenceContext?.getState?.().activeKey || '').trim();
    }

    function formatCompetenceLabel(key) {
        if (!key) return '';
        try {
            const formatted = root.RadarCompetencia?.formatCompetencia?.(key);
            if (formatted) return String(formatted).replace('/', ' ');
        } catch (_error) {
            // Fallback local abaixo.
        }

        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key);
        if (!match) return key;
        return `${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
    }

    function ensureProntuarioCompetenceContext() {
        if (root.innerWidth < MIN_WIDTH) return false;
        const main = document.querySelector('#main-container');
        const pageHeader = main?.querySelector(':scope > .page-header');
        const dossier = main?.querySelector('.school-dossier');
        if (!pageHeader || !dossier) return false;

        let context = main.querySelector('.radar-prontuario-context');
        if (!context) {
            context = document.createElement('div');
            context.className = 'radar-context-block radar-prontuario-context';
            context.dataset.radarCompetenceContext = 'true';
            context.setAttribute('role', 'status');
            context.setAttribute('aria-label', 'Competência ativa');

            const primary = document.createElement('div');
            primary.className = 'radar-context-primary';

            const label = document.createElement('span');
            label.className = 'radar-context-label';
            label.textContent = 'Competência ativa';

            const value = document.createElement('strong');
            value.className = 'radar-context-value';

            const exercise = document.createElement('span');
            exercise.className = 'radar-context-exercise';

            primary.append(label, value);
            context.append(primary, exercise);
            pageHeader.insertAdjacentElement('afterend', context);
        }

        const key = getActiveCompetenceKey();
        const value = context.querySelector('.radar-context-value');
        const exercise = context.querySelector('.radar-context-exercise');
        if (value) value.textContent = formatCompetenceLabel(key);
        if (exercise) {
            const match = /^(\d{4})-/.exec(key);
            exercise.textContent = match ? `Exercício ${match[1]}` : '';
        }
        return true;
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
        ensureProntuarioCompetenceContext();
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