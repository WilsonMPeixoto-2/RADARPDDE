(function installOperationalGuidanceUi(root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (!root?.document) return;
    root.RadarOperationalGuidanceUi = Object.freeze(api);
    root.setTimeout?.(() => api.refresh(root), 0);
    root.addEventListener?.('radar:application-services-ready', () => api.refresh(root), { once: true });
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalGuidanceUi() {
    'use strict';
    const text = value => value == null ? '' : String(value).trim();
    const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
    function element(doc, tag, className, value) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    }
    function competenceLabel(value) {
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(text(value));
        return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
            .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Mês não informado';
    }
    function ageLabel(value) {
        return value == null ? 'Sem data válida para calcular' : `${number.format(value)} dia${value === 1 ? '' : 's'}`;
    }
    function coverageText(model, capabilities) {
        const scope = model.scope;
        const pieces = [`${scope.schoolCount} escola${scope.schoolCount === 1 ? '' : 's'}`];
        if (capabilities.fiscal) pieces.push(`${scope.activePendencies} Pendências ativas`,
            `${scope.invoices} notas e despesas`, `${scope.existingContexts} contextos registrados (${scope.consolidatedContexts || 0} com resultado de bonificação registrado)`);
        if (capabilities.fiscal || capabilities.inventory) pieces.push(`${scope.assets} bens`);
        return `${competenceLabel(scope.competence)} · ${pieces.join(' · ')}. Contagens dos registros carregados neste recorte.${scope.undatedAssets
            ? ` ${scope.undatedAssets} bens sem competência informada ficam fora do recorte mensal.` : ''}`;
    }
    async function navigate(root, item) {
        if (!item?.target || typeof root.openOperationalGuidanceTarget !== 'function') return false;
        try {
            const opened = await root.openOperationalGuidanceTarget({ ...item.target });
            if (opened !== true) root.RadarSharedInteractions?.notify?.({ type: 'info',
                message: 'O registro ou o acesso mudou. Atualize as sugestões para conferir a situação atual.' });
            return opened === true;
        } catch (_error) {
            root.RadarSharedInteractions?.notify?.({ type: 'warning',
                message: 'Não foi possível abrir o registro. Atualize a tela e tente novamente.' });
            return false;
        }
    }
    function renderItem(root, item, schoolMode) {
        const doc = root.document;
        const card = element(doc, 'article', 'operational-guidance-item');
        if (item.target.entity === 'pendency') card.classList.add('cycle-b-action-item');
        card.dataset.guidanceKey = item.key;
        card.dataset.guidanceGroup = item.group;
        card.dataset.schoolId = item.schoolId;
        if (item.target.id) card.dataset.guidanceTargetId = item.target.id;
        const heading = element(doc, 'div', 'operational-guidance-item-heading');
        if (!schoolMode) heading.appendChild(element(doc, 'p', 'operational-guidance-school',
            [item.schoolName, item.schoolDesignation].filter(Boolean).join(' · ')));
        heading.append(element(doc, 'h3', '', item.title), element(doc, 'span', 'operational-guidance-actor', item.actor));
        card.append(heading,
            element(doc, 'p', 'operational-guidance-item-context', [item.programName, competenceLabel(item.competence)].filter(Boolean).join(' · ')),
            element(doc, 'p', 'operational-guidance-reason', item.reason));
        if (item.target.entity === 'pendency' && Object.hasOwn(item, 'historicDays')) {
            const ages = element(doc, 'dl', 'operational-guidance-ages');
            for (const [label, value] of [['Desde a abertura', item.historicDays], ['Espera da etapa atual', item.stageDays]]) {
                const pair = element(doc, 'div', '');
                pair.append(element(doc, 'dt', '', label), element(doc, 'dd', '', ageLabel(value)));
                ages.appendChild(pair);
            }
            card.appendChild(ages);
        }
        const buttonLabels = { pendency: 'Abrir pendência', invoice: 'Conferir despesa',
            asset: 'Ver registro patrimonial', verification: 'Ver avaliações do programa' };
        const button = element(doc, 'button', 'btn btn-secondary btn-sm', buttonLabels[item.target.entity]);
        button.type = 'button';
        button.dataset.action = 'open-operational-guidance';
        button.dataset.guidanceTargetId = item.target.id || item.target.contextKey;
        button.setAttribute('aria-label', `${buttonLabels[item.target.entity]}: ${item.title} — ${item.schoolName}`);
        button.addEventListener('click', () => { void navigate(root, item); });
        card.appendChild(button);
        return card;
    }
    function renderPanel(root, panel, input, { schoolMode = false } = {}) {
        const doc = root.document;
        const fiscal = input.capabilities.fiscal === true;
        const inventory = input.capabilities.inventory === true || fiscal;
        if (!fiscal && !inventory) { panel.remove(); return false; }
        panel.classList.add('operational-guidance');
        panel.classList.toggle('is-school-guidance', schoolMode);
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', schoolMode ? 'Próximos passos desta escola' : 'Próximas ações operacionais');
        panel.dataset.operationalGuidance = schoolMode ? 'school' : 'dashboard';
        const previousFilter = panel.dataset.guidanceFilter || 'all';
        const previousLimit = Number(panel.dataset.guidanceLimit) || (schoolMode ? 3 : 6);
        let expanded = schoolMode && panel.dataset.guidanceExpanded === 'true';
        panel.replaceChildren();
        const header = element(doc, 'div', 'panel-header operational-guidance-header');
        const heading = element(doc, 'div', 'operational-guidance-heading');
        if (!schoolMode) heading.appendChild(element(doc, 'span', 'operational-guidance-kicker', 'Organizar o trabalho'));
        heading.appendChild(element(doc, 'h2', '', schoolMode ? 'Próximos passos desta escola' : 'Próximas ações operacionais'));
        const refresh = element(doc, 'button', 'btn btn-secondary btn-sm', 'Atualizar sugestões');
        refresh.type = 'button';
        refresh.dataset.action = 'refresh-operational-guidance';
        refresh.addEventListener('click', () => schoolMode ? renderSchool(root, input.currentSchoolId)
            : renderDashboard(root));
        header.appendChild(heading);
        if (!schoolMode) header.appendChild(refresh);
        panel.appendChild(header);
        if (!input.ready || !root.RadarOperationalGuidance.dependenciesReady()) {
            (schoolMode ? heading : panel).appendChild(element(doc, 'p', 'operational-guidance-empty', 'Carregando os registros do mês selecionado…'));
            return true;
        }
        const model = root.RadarOperationalGuidance.buildGuidance(input);
        let content = panel;
        if (schoolMode) {
            content = element(doc, 'div', 'operational-guidance-body');
            content.id = `${panel.id}-content`;
            const count = model.items.length;
            heading.appendChild(element(doc, 'p', 'operational-guidance-compact-count',
                `${count} sugest${count === 1 ? 'ão' : 'ões'} · ${competenceLabel(model.scope.competence)}`));
            const next = model.items[0];
            if (next) {
                const shortcut = element(doc, 'button', 'operational-guidance-next');
                shortcut.type = 'button';
                shortcut.dataset.action = 'open-operational-guidance';
                shortcut.dataset.guidanceTargetId = next.target.id || next.target.contextKey;
                shortcut.append(element(doc, 'span', 'operational-guidance-next-label', 'Próximo passo'),
                    element(doc, 'strong', '', [next.title, next.programName].filter(Boolean).join(' · ')));
                shortcut.setAttribute('aria-label', `Abrir próximo passo: ${next.title}`);
                shortcut.addEventListener('click', () => { void navigate(root, next); });
                header.appendChild(shortcut);
            }
            const toggle = element(doc, 'button', 'btn btn-secondary btn-sm operational-guidance-toggle');
            toggle.type = 'button';
            toggle.dataset.action = 'toggle-operational-guidance';
            toggle.setAttribute('aria-controls', content.id);
            function updateExpansion() {
                panel.dataset.guidanceExpanded = String(expanded);
                panel.classList.toggle('is-expanded', expanded);
                content.hidden = !expanded;
                toggle.setAttribute('aria-expanded', String(expanded));
                toggle.textContent = expanded ? 'Recolher sugestões' : count ? `Ver ${count} sugest${count === 1 ? 'ão' : 'ões'}` : 'Ver cobertura';
            }
            toggle.addEventListener('click', () => { expanded = !expanded; updateExpansion(); });
            updateExpansion();
            header.appendChild(toggle);
            const tools = element(doc, 'div', 'operational-guidance-tools');
            tools.appendChild(refresh);
            content.appendChild(tools);
            panel.appendChild(content);
        }
        content.appendChild(element(doc, 'p', 'operational-guidance-coverage', coverageText(model, input.capabilities)));
        const groups = model.groups.filter(group => fiscal || group.id === 'inventory');
        const filters = element(doc, 'div', 'operational-guidance-filters');
        filters.setAttribute('role', 'group');
        filters.setAttribute('aria-label', 'Filtrar sugestões por etapa');
        const results = element(doc, 'div', 'operational-guidance-results');
        const entries = element(doc, 'div', 'operational-guidance-list');
        const status = element(doc, 'p', 'operational-guidance-count');
        status.setAttribute('aria-live', 'polite');
        const more = element(doc, 'button', 'btn btn-secondary btn-sm operational-guidance-more', 'Mostrar mais sugestões');
        more.type = 'button';
        const filterButtons = [];
        let selected = groups.some(group => group.id === previousFilter) ? previousFilter : 'all';
        let limit = previousLimit;
        function drawResults() {
            const records = model.items.filter(item => selected === 'all' || item.group === selected);
            panel.dataset.guidanceFilter = selected;
            panel.dataset.guidanceLimit = String(limit);
            for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.guidanceFilter === selected));
            entries.replaceChildren(...records.slice(0, limit).map(item => renderItem(root, item, schoolMode)));
            if (!records.length) entries.appendChild(element(doc, 'p', 'operational-guidance-empty',
                'Nenhum próximo passo identificado nos registros carregados deste recorte.'));
            status.textContent = `${Math.min(records.length, limit)} de ${records.length} sugestões exibidas.`;
            more.hidden = records.length <= limit;
        }
        for (const group of [{ id: 'all', label: 'Todas', count: model.items.length }, ...groups]) {
            const button = element(doc, 'button', 'operational-guidance-filter');
            button.type = 'button'; button.dataset.guidanceFilter = group.id;
            button.append(element(doc, 'span', '', group.label), element(doc, 'strong', '', String(group.count)));
            button.addEventListener('click', () => { selected = group.id; limit = schoolMode ? 3 : 6; drawResults(); });
            filters.appendChild(button); filterButtons.push(button);
        }
        more.addEventListener('click', () => { limit += schoolMode ? 3 : 6; drawResults(); });
        content.appendChild(filters);
        if (fiscal && model.ages.historical.total > 0) {
            const metrics = element(doc, 'details', 'operational-guidance-measurement');
            metrics.appendChild(element(doc, 'summary', '', 'Antiguidade e cobertura das datas'));
            const historical = model.ages.historical;
            const review = model.ages.review;
            metrics.appendChild(element(doc, 'p', '', `Desde a abertura: mediana ${ageLabel(historical.median)}; P90 ${ageLabel(historical.p90)}. ${historical.valid} de ${historical.total} Pendências têm data válida.`));
            if (review.total) metrics.appendChild(element(doc, 'p', '', `Espera para reanálise: mediana ${ageLabel(review.median)}. ${review.valid} de ${review.total} Pendências aguardando reanálise têm data válida para esta etapa.`));
            metrics.appendChild(element(doc, 'p', '', 'A abertura e a espera da etapa são relógios diferentes. Datas ausentes, inválidas ou futuras ficam fora dos cálculos. Esses intervalos não são um prazo obrigatório nem medem produtividade individual.'));
            content.appendChild(metrics);
        }
        results.append(status, entries, more);
        content.appendChild(results);
        const reference = element(doc, 'p', 'operational-guidance-reference',
            `Referência de cálculo: ${new Date(model.asOf).toLocaleDateString('pt-BR')}. As sugestões abrem registros para conferência; a decisão continua nos fluxos existentes.`);
        content.appendChild(reference);
        drawResults();
        return true;
    }
    function renderDashboard(root) {
        if (!root?.RadarOperationalGuidance || typeof root.getOperationalGuidanceInput !== 'function') return false;
        const input = root.getOperationalGuidanceInput();
        if (input.view !== 'dashboard' || !input.capabilities.fiscal) return false;
        const main = root.document.getElementById('main-container');
        if (!main) return false;
        let panel = root.document.getElementById('cycle-b-action-queue') || root.document.getElementById('operational-work-guidance');
        if (panel?.id === 'cycle-b-action-queue') root.document.getElementById('operational-work-guidance')?.remove();
        if (!panel) {
            panel = element(root.document, 'section', 'panel-card');
            panel.id = 'operational-work-guidance';
            const anchor = main.querySelector('.grid-stats');
            if (anchor) anchor.after(panel); else main.appendChild(panel);
        }
        // O resumo existente tem universo e ação próprios; a nova fila não substitui sua autoridade.
        const bonificationSummary = panel.querySelector('.cycle-b-action-summary');
        const rendered = renderPanel(root, panel, input);
        if (rendered && bonificationSummary) panel.appendChild(bonificationSummary);
        return rendered;
    }
    function renderSchool(root, schoolId) {
        if (!root?.RadarOperationalGuidance || typeof root.getOperationalGuidanceInput !== 'function') return false;
        const input = root.getOperationalGuidanceInput(schoolId);
        if (input.view !== 'prontuario') return false;
        const header = root.document.querySelector('#main-container .prontuario-school-header');
        if (!header || (!input.capabilities.fiscal && !input.capabilities.inventory)) return false;
        let panel = root.document.getElementById('operational-school-guidance');
        if (!panel) {
            panel = element(root.document, 'section', 'panel-card');
            panel.id = 'operational-school-guidance';
            header.after(panel);
        }
        if (panel.dataset.guidanceSchoolId !== String(schoolId)) {
            panel.dataset.guidanceExpanded = 'false';
            panel.dataset.guidanceSchoolId = String(schoolId);
        }
        return renderPanel(root, panel, { ...input, currentSchoolId: schoolId }, { schoolMode: true });
    }
    function refresh(root) {
        const input = root?.getOperationalGuidanceInput?.();
        if (!input) return false;
        return input.view === 'prontuario' ? renderSchool(root, input.currentSchoolId) : renderDashboard(root);
    }
    return { competenceLabel, ageLabel, coverageText, navigate, renderPanel, renderDashboard, renderSchool, refresh };
}));
