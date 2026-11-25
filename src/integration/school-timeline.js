(function installSchoolTimelineIntegration(root) {
    'use strict';

    if (!root?.document || !root.RadarSchoolTimeline) return;
    if (root.__radarSchoolTimelineIntegrationInstalled) return;
    root.__radarSchoolTimelineIntegrationInstalled = true;

    const document = root.document;
    let readingState = { context: '', query: '', category: 'all' };
    const CATEGORIES = [
        ['all', 'Todos os tipos'],
        ['documents', 'Envios e análises'],
        ['pendencies', 'Pendências e contatos'],
        ['expenses', 'Despesas e patrimônio'],
        ['bonus', 'Bonificação'],
        ['administrative', 'Outros registros']
    ];

    function eventCategory(type) {
        if (type === 'verification_consolidated') return 'bonus';
        if (type === 'pendency_attempt_registered' || type === 'pendency_attempt_reviewed'
            || type === 'technical_analysis_changed') return 'documents';
        if (type.startsWith('pendency_')) return 'pendencies';
        if (type.startsWith('invoice_') || type.startsWith('asset_')) return 'expenses';
        return 'administrative';
    }

    function searchText(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    }

    function programLabel(input, id) {
        if (!id) return '';
        const program = input.programs.find(item => String(item.id) === String(id));
        return program?.nome || program?.name || id;
    }

    function formatDateTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    }

    function iconFor(type) {
        const icons = {
            verification_consolidated: '✓',
            pendency_opened: '!',
            pendency_resolved: '✓',
            pendency_cancelled: '×',
            pendency_attempt_registered: '↥',
            pendency_attempt_reviewed: '↻',
            pendency_contact: '☎',
            invoice_registered: 'NF',
            asset_registered: '◆',
            asset_inventoried: '◆',
            technical_analysis_changed: '⚙',
            administrative_event: '•'
        };
        return icons[type] || '•';
    }

    function currentProfile() {
        try {
            return typeof getRadarAccessProfile === 'function'
                ? getRadarAccessProfile()
                : '';
        } catch (_error) {
            return '';
        }
    }

    function currentCompetence() {
        try {
            if (typeof activeProntuarioCompetencia !== 'undefined' && activeProntuarioCompetencia) {
                return activeProntuarioCompetencia;
            }
            if (typeof activeCompetenciaKey !== 'undefined') return activeCompetenciaKey || '';
        } catch (_error) {
            return '';
        }
        return '';
    }

    function timelineInput(schoolId) {
        return {
            schoolId,
            competenceKey: currentCompetence(),
            accessProfile: currentProfile(),
            programs: typeof programas !== 'undefined' ? programas : [],
            verifications: typeof verificacoes !== 'undefined' ? verificacoes : {},
            pendencies: typeof pendencias !== 'undefined' ? pendencias : [],
            contacts: typeof contatos !== 'undefined' ? contatos : [],
            invoices: typeof notasRegistradas !== 'undefined' ? notasRegistradas : [],
            assets: typeof bens !== 'undefined' ? bens : [],
            logs: typeof logs !== 'undefined' ? logs : []
        };
    }

    function competenceLabel(input) {
        try {
            const item = typeof COMPETENCIAS !== 'undefined'
                ? COMPETENCIAS.find(candidate => candidate.key === input.competenceKey)
                : null;
            return item?.label || input.competenceKey;
        } catch (_error) {
            return input.competenceKey;
        }
    }

    function textElement(tagName, className, value) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        element.textContent = value == null ? '' : String(value);
        return element;
    }

    function appendMeta(container, label, value) {
        if (!value) return;
        const item = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = `${label}:`;
        item.append(strong, document.createTextNode(` ${value}`));
        container.appendChild(item);
    }

    function buildTimelineItem(event, input) {
        const article = document.createElement('article');
        article.className = 'school-timeline-item';
        article.setAttribute('role', 'listitem');
        article.dataset.timelineEventType = event.type;
        article.dataset.timelineSource = event.sourceEntity;
        article.dataset.timelineEventId = event.id;
        article.dataset.timelineCategory = eventCategory(event.type);

        const marker = textElement('div', 'school-timeline-marker', iconFor(event.type));
        marker.setAttribute('aria-hidden', 'true');

        const content = document.createElement('div');
        content.className = 'school-timeline-content';

        const topLine = document.createElement('div');
        topLine.className = 'school-timeline-topline';
        const titleBlock = document.createElement('div');
        titleBlock.appendChild(textElement('h4', '', event.title));
        const time = textElement('time', '', formatDateTime(event.occurredAt));
        time.dateTime = event.occurredAt;
        titleBlock.appendChild(time);
        topLine.appendChild(titleBlock);
        if (event.status) topLine.appendChild(textElement('span', 'school-timeline-status', event.status));
        content.appendChild(topLine);

        if (event.description) content.appendChild(textElement('p', '', event.description));

        const meta = document.createElement('div');
        meta.className = 'school-timeline-meta';
        appendMeta(meta, 'Responsável', event.actor || 'Sistema');
        appendMeta(meta, 'Programa', programLabel(input, event.programId));
        content.appendChild(meta);

        article.append(marker, content);
        return article;
    }

    function buildTimelineCard(input, events) {
        const context = `${input.schoolId}:${input.competenceKey}:${input.accessProfile}`;
        if (readingState.context !== context) readingState = { context, query: '', category: 'all' };
        const card = document.createElement('div');
        card.className = 'panel-card school-timeline-card';

        const header = document.createElement('div');
        header.className = 'panel-header school-timeline-header';
        const heading = document.createElement('div');
        heading.appendChild(textElement('h2', '', 'Histórico cronológico da unidade'));
        heading.appendChild(textElement(
            'p',
            '',
            `Movimentações de ${competenceLabel(input)}. Mais recentes primeiro.`
        ));
        const count = textElement(
            'span',
            'badge badge-info',
            `${events.length} ${events.length === 1 ? 'evento' : 'eventos'}`
        );
        count.id = 'school-timeline-count';
        count.setAttribute('role', 'status');
        count.setAttribute('aria-live', 'polite');
        header.append(heading, count);
        card.appendChild(header);

        const filters = document.createElement('form');
        filters.className = 'school-timeline-filters';
        filters.setAttribute('role', 'search');
        filters.setAttribute('aria-label', 'Filtrar o histórico desta unidade');
        filters.addEventListener('submit', event => event.preventDefault());
        const searchLabel = textElement('label', 'school-timeline-search', 'Buscar no histórico');
        const search = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Documento, observação, responsável ou programa';
        search.value = readingState.query;
        search.setAttribute('aria-controls', 'school-timeline-events');
        search.setAttribute('aria-describedby', 'school-timeline-count');
        searchLabel.appendChild(search);
        const categoryLabel = textElement('label', 'school-timeline-type', 'Tipo de movimentação');
        const category = document.createElement('select');
        CATEGORIES.forEach(([value, label]) => {
            const option = textElement('option', '', label);
            option.value = value;
            category.appendChild(option);
        });
        category.value = readingState.category;
        category.setAttribute('aria-controls', 'school-timeline-events');
        categoryLabel.appendChild(category);
        const clear = textElement('button', 'btn btn-secondary school-timeline-clear', 'Limpar filtros');
        clear.type = 'button';
        filters.append(searchLabel, categoryLabel, clear);
        card.appendChild(filters);

        const listElement = document.createElement('div');
        listElement.className = 'school-timeline';
        listElement.id = 'school-timeline-events';
        function updateResults() {
            const terms = searchText(readingState.query).trim().split(/\s+/).filter(Boolean);
            const filtered = events.filter(event => {
                if (readingState.category !== 'all' && eventCategory(event.type) !== readingState.category) return false;
                const text = searchText([event.title, event.description, event.actor, event.status,
                    programLabel(input, event.programId)].join(' '));
                return terms.every(term => text.includes(term));
            });
            const hasFilter = terms.length > 0 || readingState.category !== 'all';
            count.textContent = hasFilter
                ? `${filtered.length} de ${events.length} eventos`
                : `${events.length} ${events.length === 1 ? 'evento' : 'eventos'}`;
            clear.disabled = !hasFilter && !readingState.query;
            listElement.replaceChildren();
            listElement.classList.toggle('is-empty', filtered.length === 0);
            const days = new Map();
            filtered.forEach(event => {
                const date = new Date(event.occurredAt);
                const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                if (!days.has(day)) {
                    const section = document.createElement('section');
                    section.className = 'school-timeline-day';
                    section.appendChild(textElement('h3', 'school-timeline-day-label', day));
                    const list = document.createElement('div');
                    list.setAttribute('role', 'list');
                    list.setAttribute('aria-label', `Movimentações de ${day}`);
                    section.appendChild(list);
                    listElement.appendChild(section);
                    days.set(day, list);
                }
                days.get(day).appendChild(buildTimelineItem(event, input));
            });
            if (!filtered.length) {
                const empty = document.createElement('div');
                empty.className = 'school-timeline-empty';
                empty.appendChild(textElement('strong', '', events.length
                    ? 'Nenhuma movimentação corresponde à busca.'
                    : 'Ainda não há movimentações neste mês.'));
                empty.appendChild(textElement('p', '', events.length
                    ? 'Altere o texto ou limpe os filtros para rever o histórico.'
                    : 'Escolha outra competência no cabeçalho para consultar o histórico de outro mês.'));
                listElement.appendChild(empty);
            }
        }
        search.addEventListener('input', () => { readingState.query = search.value; updateResults(); });
        category.addEventListener('change', () => { readingState.category = category.value; updateResults(); });
        clear.addEventListener('click', () => {
            readingState.query = ''; readingState.category = 'all';
            search.value = ''; category.value = 'all';
            updateResults(); search.focus();
        });
        card.appendChild(listElement);
        updateResults();
        return card;
    }

    function renderTimeline(panel, schoolId) {
        if (!panel) return;
        const input = timelineInput(schoolId);
        const events = root.RadarSchoolTimeline.buildSchoolTimeline(input);
        panel.replaceChildren(buildTimelineCard(input, events));
    }

    function activateExtendedTab(event, panel) {
        const targetButton = event?.currentTarget;
        const tabContainer = targetButton?.closest?.('.tab-container');
        const panelContainer = panel?.parentElement;
        if (!targetButton || !tabContainer || !panelContainer) return false;

        Array.from(tabContainer.children).forEach(element => {
            if (!element.classList.contains('tab-button')) return;
            const isActive = element === targetButton;
            element.classList.toggle('active', isActive);
            element.setAttribute('aria-selected', String(isActive));
            element.tabIndex = isActive ? 0 : -1;
        });
        Array.from(panelContainer.children).forEach(element => {
            if (!element.classList.contains('tab-content-panel')) return;
            const isActive = element === panel;
            element.classList.toggle('active', isActive);
            element.hidden = !isActive;
        });
        return true;
    }

    async function loadSchoolHistory(schoolId, options = {}) {
        const readModel = root.RadarAdministrativeLogReadContext?.model;
        if (typeof readModel?.loadSchool !== 'function') return null;
        let state = await readModel.loadSchool(schoolId, { refresh: options.refresh === true });
        while (state?.hasMore === true) {
            state = await readModel.loadSchool(schoolId, { append: true });
        }
        return state;
    }

    async function activateTimeline(event, panel, schoolId) {
        let activated = false;
        try {
            if (typeof activateProntuarioTab === 'function') {
                activated = activateProntuarioTab('tab-historico') === true;
            }
        } catch (_error) {
            activated = false;
        }
        if (!activated) activateExtendedTab(event, panel);

        const readModel = root.RadarAdministrativeLogReadContext?.model;
        if (typeof readModel?.loadSchool === 'function') {
            panel.replaceChildren(textElement(
                'div',
                'school-timeline-empty',
                'Carregando histórico da unidade...'
            ));
            try {
                await loadSchoolHistory(schoolId, { refresh: true });
            } catch (error) {
                if (!panel.isConnected || panel.dataset.schoolId !== String(schoolId)) return;
                const notice = textElement('div', 'school-timeline-empty', 'Não foi possível carregar o histórico completo da unidade.');
                notice.setAttribute('role', 'alert');
                const retry = textElement('button', 'btn btn-secondary', 'Carregar histórico novamente');
                retry.type = 'button';
                retry.addEventListener('click', () => activateTimeline({ currentTarget: document.getElementById('prontuario-tab-historico') }, panel, schoolId));
                notice.appendChild(retry);
                panel.replaceChildren(notice);
                root.console?.error?.('Não foi possível carregar os registros administrativos da unidade.', error);
                return;
            }
        }
        if (!panel.isConnected || panel.dataset.schoolId !== String(schoolId)) return;
        renderTimeline(panel, schoolId);
    }

    function installTimelineTab(schoolId) {
        const main = document.getElementById('main-container');
        const tabContainer = main?.querySelector('.school-grid .tab-container');
        if (!tabContainer) return false;

        const workspace = tabContainer.closest('.school-workspace');
        if (!workspace) return false;

        let button = tabContainer.querySelector('[data-tab="historico"]');
        let panel = main.querySelector('#tab-historico');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'tab-content-panel';
            panel.id = 'tab-historico';
            panel.hidden = true;
            workspace.appendChild(panel);
        }
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'tab-button';
            button.dataset.tab = 'historico';
            button.textContent = 'Histórico cronológico';
            tabContainer.appendChild(button);
        }
        button.id = 'prontuario-tab-historico';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', 'tab-historico');
        button.setAttribute('aria-selected', String(button.classList.contains('active')));
        button.tabIndex = button.classList.contains('active') ? 0 : -1;
        button.onkeydown = event => root.handleSchoolTabKeydown?.(event);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', button.id);
        panel.hidden = !button.classList.contains('active');
        button.onclick = event => activateTimeline(event, panel, schoolId);
        button.dataset.schoolId = schoolId;
        panel.dataset.schoolId = schoolId;
        renderTimeline(panel, schoolId);
        return true;
    }

    function scheduleInstall(schoolId) {
        root.__radarTimelineSchoolId = schoolId;
        root.requestAnimationFrame(() => installTimelineTab(schoolId));
    }

    const originalRenderProntuario = root.renderProntuario;
    if (typeof originalRenderProntuario === 'function' && !originalRenderProntuario.__radarTimelineWrapped) {
        const wrapped = function renderProntuarioWithTimeline(schoolId) {
            const result = originalRenderProntuario.apply(this, arguments);
            scheduleInstall(schoolId);
            return result;
        };
        wrapped.__radarTimelineWrapped = true;
        wrapped.__radarOriginal = originalRenderProntuario;
        root.renderProntuario = wrapped;
        try { renderProntuario = wrapped; } catch (_error) { /* global binding already linked */ }
    }

    const mainContainer = document.getElementById('main-container');
    if (mainContainer && typeof root.MutationObserver === 'function') {
        const observer = new root.MutationObserver(() => {
            const schoolId = root.__radarTimelineSchoolId;
            if (schoolId && mainContainer.querySelector('.school-grid')) installTimelineTab(schoolId);
        });
        observer.observe(mainContainer, { childList: true, subtree: false });
        root.__radarSchoolTimelineObserver = observer;
    }
}(typeof window !== 'undefined' ? window : globalThis));
