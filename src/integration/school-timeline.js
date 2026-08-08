(function installSchoolTimelineIntegration(root) {
    'use strict';

    if (!root?.document || !root.RadarSchoolTimeline) return;
    if (root.__radarSchoolTimelineIntegrationInstalled) return;
    root.__radarSchoolTimelineIntegrationInstalled = true;

    const document = root.document;

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

    function buildTimelineItem(event) {
        const article = document.createElement('article');
        article.className = 'school-timeline-item';
        article.setAttribute('role', 'listitem');
        article.dataset.timelineEventType = event.type;
        article.dataset.timelineSource = event.sourceEntity;

        const marker = textElement('div', 'school-timeline-marker', iconFor(event.type));
        marker.setAttribute('aria-hidden', 'true');

        const content = document.createElement('div');
        content.className = 'school-timeline-content';

        const topLine = document.createElement('div');
        topLine.className = 'school-timeline-topline';
        const titleBlock = document.createElement('div');
        titleBlock.appendChild(textElement('h3', '', event.title));
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
        appendMeta(meta, 'Programa', event.programId);
        appendMeta(meta, 'Pendência', event.pendencyId);
        content.appendChild(meta);

        article.append(marker, content);
        return article;
    }

    function buildTimelineCard(input, events) {
        const card = document.createElement('div');
        card.className = 'panel-card school-timeline-card';

        const header = document.createElement('div');
        header.className = 'panel-header school-timeline-header';
        const heading = document.createElement('div');
        heading.appendChild(textElement('h2', '', 'Histórico cronológico da unidade'));
        heading.appendChild(textElement(
            'p',
            '',
            `Eventos consolidados da competência ${competenceLabel(input)}.`
        ));
        const count = textElement(
            'span',
            'badge badge-info',
            `${events.length} ${events.length === 1 ? 'evento' : 'eventos'}`
        );
        header.append(heading, count);
        card.appendChild(header);

        const listElement = document.createElement('div');
        listElement.className = 'school-timeline';
        listElement.setAttribute('role', 'list');
        listElement.setAttribute('aria-label', 'Histórico cronológico da unidade');
        if (events.length) {
            events.forEach(event => listElement.appendChild(buildTimelineItem(event)));
        } else {
            listElement.appendChild(textElement(
                'div',
                'school-timeline-empty',
                'Nenhum evento foi registrado para esta unidade na competência selecionada.'
            ));
        }
        card.appendChild(listElement);
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

    function activateTimeline(event, panel, schoolId) {
        let activated = false;
        try {
            if (typeof activateProntuarioTab === 'function') {
                activated = activateProntuarioTab('tab-historico') === true;
            }
        } catch (_error) {
            activated = false;
        }
        if (!activated) activateExtendedTab(event, panel);
        renderTimeline(panel, schoolId);
    }

    function installTimelineTab(schoolId) {
        const main = document.getElementById('main-container');
        const tabContainer = main?.querySelector('.school-grid .tab-container');
        if (!tabContainer) return false;

        let button = tabContainer.querySelector('[data-tab="historico"]');
        let panel = main.querySelector('#tab-historico');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'tab-content-panel';
            panel.id = 'tab-historico';
            panel.hidden = true;
            tabContainer.parentElement.appendChild(panel);
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
