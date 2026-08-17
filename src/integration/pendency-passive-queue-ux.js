(function installRadarPendencyPassiveQueueUX(root) {
    'use strict';

    if (!root?.document || root.RadarPendencyPassiveQueueUX) return;

    const document = root.document;
    const RECORD_SELECTOR = [
        '.pendency-operations-table tbody tr[data-pendency-ref]',
        '.pendency-mobile-card[data-pendency-ref]'
    ].join(', ');
    const INTERACTIVE_SELECTOR = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        'label',
        '[role="button"]',
        '[contenteditable="true"]'
    ].join(', ');
    const ADVANCED_FILTER_IDS = Object.freeze([
        'pendency-filter-program',
        'pendency-filter-document',
        'pendency-filter-error',
        'pendency-filter-actor',
        'pendency-filter-controller',
        'pendency-filter-age'
    ]);
    const MONTHS = Object.freeze([
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]);

    let decorating = false;

    function isPendenciasView() {
        return typeof currentView !== 'undefined' && currentView === 'pendencias';
    }

    function currentCompetence() {
        return String(root.RadarCompetenceContext?.getState?.()?.activeKey || '').trim();
    }

    function formatCompetence(value) {
        const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
        if (!match) return value || 'não definida';
        const month = Number(match[2]);
        return month >= 1 && month <= 12
            ? `${MONTHS[month - 1]} de ${match[1]}`
            : value;
    }

    function recordLabel(record) {
        const school = record.querySelector('strong')?.textContent?.trim() || 'Pendência';
        const competenceCell = record.matches('tr')
            ? record.querySelector('td:nth-child(2)')
            : Array.from(record.querySelectorAll('dt')).find(item => item.textContent.trim() === 'Competência')?.nextElementSibling;
        const competence = competenceCell?.textContent?.trim();
        return competence
            ? `${school}. Competência ${competence}. Abrir detalhes da pendência.`
            : `${school}. Abrir detalhes da pendência.`;
    }

    function decorateRecords(container) {
        container.querySelectorAll(RECORD_SELECTOR).forEach(record => {
            record.classList.add('pendency-record-clickable');
            record.setAttribute('tabindex', '0');
            record.setAttribute('aria-label', recordLabel(record));
            record.setAttribute('title', 'Abrir detalhes da pendência');
        });
    }

    function advancedFilterIsActive() {
        const filters = root.RadarTask9PendencyPage?.getState?.()?.filters || {};
        return Boolean(
            filters.programId
            || filters.documentKey
            || filters.error
            || filters.nextActor
            || filters.controllerId
            || filters.age
        );
    }

    function compactAdvancedFilters(container) {
        const grid = container.querySelector('.pendency-filter-grid');
        if (!grid || grid.querySelector('.pendency-more-filters')) return;

        const fields = ADVANCED_FILTER_IDS
            .map(id => container.getElementById ? container.getElementById(id) : document.getElementById(id))
            .filter(Boolean)
            .map(control => control.closest('.filter-field'))
            .filter(Boolean);
        if (!fields.length) return;

        const details = document.createElement('details');
        details.className = 'pendency-more-filters';
        if (advancedFilterIsActive()) details.open = true;

        const summary = document.createElement('summary');
        summary.textContent = 'Mais filtros';
        summary.setAttribute('aria-label', 'Exibir filtros adicionais de pendências');

        const content = document.createElement('div');
        content.className = 'pendency-more-filters-grid';
        fields.forEach(field => content.appendChild(field));

        details.append(summary, content);
        grid.appendChild(details);
    }

    function updateCrossCompetenceNotice(container) {
        const header = container.querySelector('.pendency-page-header');
        if (!header) return;

        let notice = container.querySelector('#pendency-cross-competence-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'pendency-cross-competence-notice';
            notice.className = 'pendency-cross-competence-notice';
            notice.setAttribute('role', 'note');
            notice.innerHTML = `
                <div>
                    <strong>Visão de todas as competências</strong>
                    <span>As pendências históricas permanecem nesta fila até sua conclusão. Use o filtro de competência apenas quando quiser restringir a consulta.</span>
                </div>
                <div class="pendency-global-context">
                    <span>Competência global</span>
                    <strong data-pendency-global-competence></strong>
                </div>
            `;
            header.insertAdjacentElement('afterend', notice);
        }

        const competence = notice.querySelector('[data-pendency-global-competence]');
        if (competence) competence.textContent = formatCompetence(currentCompetence());

        const intro = header.querySelector('h1 + p');
        if (intro) {
            intro.textContent = 'Acompanhe o passivo de pendências de todas as competências, com prioridade para o que ainda exige providência.';
        }

        const filterIntro = container.querySelector('.pendency-filter-header p');
        if (filterIntro) {
            filterIntro.textContent = 'Por padrão, nenhuma competência limita esta lista.';
        }

        const competenceSelect = container.querySelector('#pendency-filter-competence');
        if (competenceSelect?.options?.length) {
            competenceSelect.options[0].textContent = 'Todas as competências';
        }
    }

    function decorate() {
        if (decorating || !isPendenciasView()) return;
        const container = document.getElementById('main-container');
        if (!container || !container.querySelector('.pendency-page-header')) return;

        decorating = true;
        try {
            updateCrossCompetenceNotice(container);
            compactAdvancedFilters(container);
            decorateRecords(container);
        } finally {
            decorating = false;
        }
    }

    function shouldOpenFromRecord(event, record) {
        if (!record || !isPendenciasView()) return false;
        const interactive = event.target.closest?.(INTERACTIVE_SELECTOR);
        return !interactive || interactive === record;
    }

    document.addEventListener('click', event => {
        const record = event.target.closest?.(RECORD_SELECTOR);
        if (!shouldOpenFromRecord(event, record)) return;
        root.openPendencyDetail?.(record);
    });

    document.addEventListener('keydown', event => {
        if (!['Enter', ' '].includes(event.key)) return;
        const record = event.target.closest?.(RECORD_SELECTOR);
        if (!record || event.target !== record || !isPendenciasView()) return;
        event.preventDefault();
        root.openPendencyDetail?.(record);
    });

    root.addEventListener('radar:competence-change', () => root.requestAnimationFrame(decorate));

    const observer = new MutationObserver(() => {
        if (!decorating && isPendenciasView()) root.requestAnimationFrame(decorate);
    });
    observer.observe(document.getElementById('main-container') || document.body, {
        childList: true,
        subtree: true
    });

    root.RadarPendencyPassiveQueueUX = Object.freeze({
        VERSION: '1.0.1',
        decorate,
        formatCompetence
    });

    root.requestAnimationFrame(decorate);
}(typeof window !== 'undefined' ? window : globalThis));
