(function installSchoolTimelineIntegration(root) {
    'use strict';

    if (!root?.document || !root.RadarSchoolTimeline) return;
    if (root.__radarSchoolTimelineIntegrationInstalled) return;
    root.__radarSchoolTimelineIntegrationInstalled = true;

    const document = root.document;

    function html(value) {
        if (typeof root.escapeHtml === 'function') return root.escapeHtml(value == null ? '' : String(value));
        const node = document.createElement('span');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
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

    function renderTimeline(panel, schoolId) {
        if (!panel) return;
        const input = timelineInput(schoolId);
        const events = root.RadarSchoolTimeline.buildSchoolTimeline(input);
        const competenceLabel = (() => {
            try {
                const item = typeof COMPETENCIAS !== 'undefined'
                    ? COMPETENCIAS.find(candidate => candidate.key === input.competenceKey)
                    : null;
                return item?.label || input.competenceKey;
            } catch (_error) {
                return input.competenceKey;
            }
        })();

        panel.innerHTML = `
            <div class="panel-card school-timeline-card">
                <div class="panel-header school-timeline-header">
                    <div>
                        <h2>Histórico cronológico da unidade</h2>
                        <p>Eventos consolidados da competência ${html(competenceLabel)}.</p>
                    </div>
                    <span class="badge badge-info">${events.length} ${events.length === 1 ? 'evento' : 'eventos'}</span>
                </div>
                <div class="school-timeline" role="list" aria-label="Histórico cronológico da unidade">
                    ${events.length ? events.map(event => `
                        <article
                            class="school-timeline-item"
                            role="listitem"
                            data-timeline-event-type="${html(event.type)}"
                            data-timeline-source="${html(event.sourceEntity)}"
                        >
                            <div class="school-timeline-marker" aria-hidden="true">${html(iconFor(event.type))}</div>
                            <div class="school-timeline-content">
                                <div class="school-timeline-topline">
                                    <div>
                                        <h3>${html(event.title)}</h3>
                                        <time datetime="${html(event.occurredAt)}">${html(formatDateTime(event.occurredAt))}</time>
                                    </div>
                                    ${event.status ? `<span class="school-timeline-status">${html(event.status)}</span>` : ''}
                                </div>
                                ${event.description ? `<p>${html(event.description)}</p>` : ''}
                                <div class="school-timeline-meta">
                                    <span><strong>Responsável:</strong> ${html(event.actor || 'Sistema')}</span>
                                    ${event.programId ? `<span><strong>Programa:</strong> ${html(event.programId)}</span>` : ''}
                                    ${event.pendencyId ? `<span><strong>Pendência:</strong> ${html(event.pendencyId)}</span>` : ''}
                                </div>
                            </div>
                        </article>
                    `).join('') : `
                        <div class="school-timeline-empty">
                            Nenhum evento foi registrado para esta unidade na competência selecionada.
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    function activateTimeline(event, panel, schoolId) {
        if (typeof switchSchoolTab === 'function') {
            switchSchoolTab(event, 'tab-historico');
        } else {
            document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
            document.querySelectorAll('.tab-content-panel').forEach(content => content.classList.remove('active'));
            event.currentTarget.classList.add('active');
            panel.classList.add('active');
        }
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