(function installSchoolTimelineIntegration(root, factory) {
    'use strict';

    const timelineApi = typeof module !== 'undefined' && module.exports
        ? require('../domain/school-timeline.js')
        : root?.RadarSchoolTimeline;
    const api = factory(timelineApi);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarSchoolTimelineIntegration = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSchoolTimelineIntegrationApi(timelineApi) {
    'use strict';

    const TYPE_META = Object.freeze({
        verification_consolidated: { label: 'Avaliação mensal', icon: '✓' },
        pendency_opened: { label: 'Pendência', icon: '!' },
        pendency_submission_registered: { label: 'Novo envio', icon: '↥' },
        pendency_attempt_reviewed: { label: 'Reanálise', icon: '↻' },
        pendency_resolved: { label: 'Regularização', icon: '✓' },
        pendency_cancelled: { label: 'Cancelamento', icon: '×' },
        pendency_contact: { label: 'Contato', icon: '◌' },
        invoice_registered: { label: 'Despesa', icon: 'R$' },
        asset_registered: { label: 'Bem patrimonial', icon: '□' },
        asset_inventoried: { label: 'Inventário', icon: '◆' },
        administrative_action: { label: 'Registro interno', icon: '•' },
        technical_analysis_changed: { label: 'Análise técnica', icon: '≡' }
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function safeGlobal(root, name, fallback) {
        try {
            const value = root[name];
            return value === undefined ? fallback : value;
        } catch (_error) {
            return fallback;
        }
    }

    function currentProfile(root) {
        try {
            return typeof root.getRadarAccessProfile === 'function'
                ? root.getRadarAccessProfile()
                : safeGlobal(root, 'currentProfile', 'controlador');
        } catch (_error) {
            return 'controlador';
        }
    }

    function formatDateTime(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Data não informada';
        return parsed.toLocaleString('pt-BR', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    function formatCompetence(root, value) {
        if (!value) return '';
        if (typeof root.formatCompetenciaText === 'function') {
            return root.formatCompetenciaText(value);
        }
        return value;
    }

    function createElement(document, tagName, className, textContent) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (textContent !== undefined) element.textContent = textContent;
        return element;
    }

    function buildEvents(root, schoolId) {
        return timelineApi.buildSchoolTimeline({
            schoolId,
            competenceKey: safeGlobal(root, 'activeProntuarioCompetencia', null)
                || safeGlobal(root, 'activeCompetenciaKey', null),
            programs: safeGlobal(root, 'programas', []),
            verifications: safeGlobal(root, 'verificacoes', {}),
            pendencies: safeGlobal(root, 'pendencias', []),
            contacts: safeGlobal(root, 'contatos', []),
            invoices: safeGlobal(root, 'notasRegistradas', []),
            assets: safeGlobal(root, 'bens', []),
            logs: safeGlobal(root, 'logs', []),
            accessProfile: currentProfile(root)
        });
    }

    function renderEmpty(document) {
        const empty = createElement(document, 'div', 'school-timeline-empty');
        const title = createElement(document, 'strong', null, 'Nenhuma movimentação registrada nesta competência.');
        const description = createElement(
            document,
            'p',
            null,
            'Avaliações, contatos, pendências, reanálises, despesas e eventos patrimoniais aparecerão aqui em ordem cronológica.'
        );
        empty.append(title, description);
        return empty;
    }

    function renderEvent(document, root, event) {
        const item = createElement(document, 'li', 'school-timeline-item');
        item.dataset.timelineEventId = event.id;
        item.dataset.timelineEventType = event.type;
        item.dataset.timelineSource = event.sourceEntity;

        const marker = createElement(document, 'span', 'school-timeline-marker');
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = TYPE_META[event.type]?.icon || '•';

        const card = createElement(document, 'article', 'school-timeline-card');
        const header = createElement(document, 'header', 'school-timeline-card-header');
        const headingGroup = createElement(document, 'div', 'school-timeline-heading');
        const type = createElement(
            document,
            'span',
            'school-timeline-type',
            TYPE_META[event.type]?.label || 'Movimentação'
        );
        const title = createElement(document, 'h3', null, event.title);
        headingGroup.append(type, title);
        const time = createElement(document, 'time', null, formatDateTime(event.occurredAt));
        time.dateTime = event.occurredAt;
        header.append(headingGroup, time);

        const description = createElement(document, 'p', 'school-timeline-description', event.description || 'Sem descrição adicional.');
        const metadata = createElement(document, 'dl', 'school-timeline-metadata');
        const pairs = [
            ['Responsável', event.actor],
            ['Competência', formatCompetence(root, event.competenceKey)],
            ['Programa', event.programId],
            ['Situação', event.status]
        ].filter(([, value]) => text(value));
        pairs.forEach(([label, value]) => {
            const group = createElement(document, 'div');
            group.append(
                createElement(document, 'dt', null, label),
                createElement(document, 'dd', null, value)
            );
            metadata.appendChild(group);
        });

        card.append(header, description);
        if (pairs.length) card.appendChild(metadata);
        item.append(marker, card);
        return item;
    }

    function renderTimeline(root, schoolId) {
        const document = root.document;
        const container = document.getElementById('school-timeline-list');
        const count = document.getElementById('school-timeline-count');
        if (!container || !timelineApi) return false;
        const events = buildEvents(root, schoolId);
        container.replaceChildren();
        if (count) count.textContent = `${events.length} evento${events.length === 1 ? '' : 's'}`;
        if (!events.length) {
            container.appendChild(renderEmpty(document));
            return true;
        }
        const list = createElement(document, 'ol', 'school-timeline-list');
        events.forEach(event => list.appendChild(renderEvent(document, root, event)));
        container.appendChild(list);
        return true;
    }

    function addTimelineTab(root, schoolId) {
        const document = root.document;
        const grid = document.querySelector('#main-container .school-grid');
        const tabContainer = grid?.querySelector('.tab-container');
        if (!grid || !tabContainer) return false;
        if (!tabContainer.querySelector('[data-tab="historico"]')) {
            const button = createElement(document, 'button', 'tab-button', 'Histórico cronológico');
            button.type = 'button';
            button.dataset.tab = 'historico';
            button.addEventListener('click', event => {
                root.switchSchoolTab?.(event, 'tab-historico');
            });
            tabContainer.appendChild(button);
        }
        let panel = grid.querySelector('#tab-historico');
        if (!panel) {
            panel = createElement(document, 'div', 'tab-content-panel');
            panel.id = 'tab-historico';
            const card = createElement(document, 'section', 'panel-card school-timeline-panel');
            card.setAttribute('aria-labelledby', 'school-timeline-title');
            const header = createElement(document, 'header', 'panel-header school-timeline-panel-header');
            const heading = createElement(document, 'div');
            const title = createElement(document, 'h2', null, 'Histórico cronológico da unidade');
            title.id = 'school-timeline-title';
            const subtitle = createElement(
                document,
                'p',
                null,
                'Movimentações consolidadas da competência ativa, preservando autoria, contexto e rastreabilidade.'
            );
            heading.append(title, subtitle);
            const count = createElement(document, 'span', 'school-timeline-count', '0 eventos');
            count.id = 'school-timeline-count';
            header.append(heading, count);
            const content = createElement(document, 'div', 'school-timeline-content');
            content.id = 'school-timeline-list';
            card.append(header, content);
            panel.appendChild(card);
            tabContainer.parentElement.appendChild(panel);
        }
        renderTimeline(root, schoolId);
        return true;
    }

    function activateTimelineTab(root) {
        const document = root.document;
        const grid = document.querySelector('#main-container .school-grid');
        const targetPanel = grid?.querySelector('#tab-historico');
        const targetButton = grid?.querySelector('[data-tab="historico"]');
        if (!targetPanel || !targetButton) return false;
        const tabContainer = targetButton.closest('.tab-container');
        Array.from(tabContainer?.children || []).forEach(element => {
            if (element.classList.contains('tab-button')) element.classList.remove('active');
        });
        Array.from(targetPanel.parentElement?.children || []).forEach(element => {
            if (element.classList.contains('tab-content-panel')) element.classList.remove('active');
        });
        targetButton.classList.add('active');
        targetPanel.classList.add('active');
        return true;
    }

    function install(root) {
        if (!root || root.__radarSchoolTimelineInstalled || !timelineApi) return false;
        if (!root.document || typeof root.renderProntuario !== 'function') return false;
        const originalRenderProntuario = root.renderProntuario.bind(root);
        const originalActivateProntuarioTab = typeof root.activateProntuarioTab === 'function'
            ? root.activateProntuarioTab.bind(root)
            : null;

        root.renderProntuario = function renderProntuarioWithTimeline(schoolId) {
            const result = originalRenderProntuario(schoolId);
            addTimelineTab(root, schoolId);
            return result;
        };
        try { renderProntuario = root.renderProntuario; } catch (_error) { /* global browser fallback */ }

        root.activateProntuarioTab = function activateProntuarioTabWithTimeline(tabId) {
            if (tabId === 'tab-historico') return activateTimelineTab(root);
            return originalActivateProntuarioTab ? originalActivateProntuarioTab(tabId) : false;
        };
        try { activateProntuarioTab = root.activateProntuarioTab; } catch (_error) { /* global browser fallback */ }

        root.addEventListener?.('radar:competence-change', () => {
            if (safeGlobal(root, 'currentView', '') !== 'prontuario') return;
            const schoolId = safeGlobal(root, 'activeSchoolId', null);
            if (schoolId) renderTimeline(root, schoolId);
        });

        root.__radarSchoolTimelineInstalled = true;
        if (safeGlobal(root, 'currentView', '') === 'prontuario') {
            const schoolId = safeGlobal(root, 'activeSchoolId', null);
            if (schoolId) addTimelineTab(root, schoolId);
        }
        return true;
    }

    return Object.freeze({
        install,
        renderTimeline,
        addTimelineTab,
        activateTimelineTab,
        buildEvents
    });
}));
