/* global activeSchoolId, bens, notasRegistradas */
(function installRadarProntuarioOperationalUx(root) {
    'use strict';

    if (!root?.document || root.RadarProntuarioOperationalUx) return;

    const SENT_LABEL_PREFIX = 'Consulta enviada à Assessoria para a NF ';
    const CONSOLIDATED_BONUS_LABELS = new Set(['apta', 'inapta']);
    let installed = false;
    let originalRenderProntuario = null;
    let renderedSchoolId = '';

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function formatCurrency(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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

    function getRegisteredInvoices() {
        try {
            return Array.isArray(notasRegistradas) ? notasRegistradas : [];
        } catch (_error) {
            return [];
        }
    }

    function getAssets() {
        try {
            return Array.isArray(bens) ? bens : [];
        } catch (_error) {
            return [];
        }
    }

    function resolveSchoolId(explicitSchoolId = '') {
        const explicit = text(explicitSchoolId);
        if (explicit) return explicit;
        try {
            return text(activeSchoolId) || renderedSchoolId;
        } catch (_error) {
            return renderedSchoolId;
        }
    }

    function invoiceBelongsToContext(invoice, schoolId, competenceKey, programId) {
        if (text(invoice?.escolaId) !== text(schoolId) || text(invoice?.tipo) !== 'permanente') {
            return false;
        }
        const compKey = text(invoice?.compKey);
        if (!compKey) return false;
        if (root.RadarCompetencia?.splitCompetenciaContext) {
            try {
                const context = root.RadarCompetencia.splitCompetenciaContext(compKey);
                return text(context?.competenciaKey) === text(competenceKey)
                    && text(context?.contextId) === text(programId);
            } catch (_error) {
                return false;
            }
        }
        return compKey === `${text(competenceKey)}_${text(programId)}`;
    }

    function inventoryStatusClass(status) {
        if (status === 'Inventariada') return 'is-inventoried';
        if (status === 'Encaminhada') return 'is-forwarded';
        if (status === 'Não encaminhada') return 'is-pending';
        return 'is-missing';
    }

    function createInventoryLinkedEntry(invoice, asset) {
        const entry = root.document.createElement('div');
        const invoiceId = text(invoice?.id);
        const invoiceNumber = text(invoice?.numero) || invoiceId || 'sem número';
        const description = text(invoice?.desc || invoice?.descricao || asset?.item || asset?.descricao)
            || 'Bem permanente';
        const status = text(asset?.status) || 'Bem vinculado não localizado';
        entry.className = 'inventory-document-link';
        entry.dataset.inventoryLinkedInvoiceId = invoiceId;
        entry.setAttribute('role', 'group');
        entry.setAttribute(
            'aria-label',
            `NF ${invoiceNumber}; ${description}; ${formatCurrency(invoice?.valor)}; ${status}`
        );

        const connector = root.document.createElement('span');
        connector.className = 'inventory-document-link-connector';
        connector.setAttribute('aria-hidden', 'true');
        connector.textContent = '↳';

        const copy = root.document.createElement('span');
        copy.className = 'inventory-document-link-copy';
        const title = root.document.createElement('strong');
        title.textContent = `NF: ${invoiceNumber}`;
        const meta = root.document.createElement('span');
        meta.textContent = `${description} · ${formatCurrency(invoice?.valor)}`;
        copy.append(title, meta);

        const badge = root.document.createElement('span');
        badge.className = `inventory-document-link-status ${inventoryStatusClass(status)}`;
        badge.textContent = status;
        if (text(asset?.processoInventario)) {
            badge.title = `Processo de inventário: ${text(asset.processoInventario)}`;
        }

        entry.append(connector, copy, badge);
        return entry;
    }

    function decorateInventoryLinks(group, schoolId) {
        const inventoryRow = group.rows.find(row => row.dataset.documentKey === 'encampInventario');
        if (!inventoryRow) return;
        const nameCell = inventoryRow.querySelector('.verification-document-name-cell');
        if (!nameCell) return;

        const existing = nameCell.querySelector('[data-inventory-document-links]');
        const competenceKey = getActiveCompetenceKey();
        const programId = text(inventoryRow.dataset.programId);
        const resolvedSchoolId = resolveSchoolId(schoolId);
        if (!competenceKey || !programId || !resolvedSchoolId) {
            existing?.remove();
            return;
        }

        const permanentInvoices = getRegisteredInvoices().filter(invoice => (
            invoiceBelongsToContext(invoice, resolvedSchoolId, competenceKey, programId)
        ));
        if (!permanentInvoices.length) {
            existing?.remove();
            return;
        }

        const assetsById = new Map(getAssets().map(asset => [text(asset?.id), asset]));
        const panel = existing || root.document.createElement('div');
        panel.className = 'inventory-document-links';
        panel.dataset.inventoryDocumentLinks = 'true';
        panel.setAttribute(
            'aria-label',
            'Aquisições permanentes vinculadas ao encaminhamento para inventariação'
        );
        panel.replaceChildren();

        const caption = root.document.createElement('span');
        caption.className = 'inventory-document-links-caption';
        caption.textContent = permanentInvoices.length === 1
            ? '1 aquisição patrimonial vinculada'
            : `${permanentInvoices.length} aquisições patrimoniais vinculadas`;
        panel.appendChild(caption);

        permanentInvoices.forEach(invoice => {
            const assetId = text(invoice?.bemId || invoice?.linkedAssetId || invoice?.linked_asset_id);
            panel.appendChild(createInventoryLinkedEntry(invoice, assetsById.get(assetId) || null));
        });

        if (!existing) {
            nameCell.querySelector('.verification-document-cell')?.insertAdjacentElement('afterend', panel);
        }
    }

    function orderProgramGroupsForPresentation(groups) {
        const rowsContainer = root.document.getElementById('prontuario-verif-rows');
        if (!rowsContainer || groups.length < 2) return groups;

        const ordered = groups
            .map((group, sourceIndex) => ({
                group,
                sourceIndex,
                programId: text(group.rows[0]?.dataset?.programId)
            }))
            .sort((left, right) => {
                const leftPriority = left.programId === 'BASIC' ? 0 : 1;
                const rightPriority = right.programId === 'BASIC' ? 0 : 1;
                return leftPriority - rightPriority || left.sourceIndex - right.sourceIndex;
            });

        ordered.forEach(({ group }) => {
            group.rows.forEach(row => rowsContainer.appendChild(row));
        });

        return ordered.map(item => item.group);
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
        const advisoryRow = rowsByDocument.get('consAssessoria');
        if (!advisoryRow) return;

        const invoiceCards = Array.from(
            advisoryRow.querySelectorAll('[data-service-advisory-invoice]')
        );

        // A grade canônica atual já possui colunas próprias para Documento,
        // Envio à Assessoria, Situação técnica e Ação. O decorador abaixo
        // existe apenas para o markup legado em formato de card. Aplicá-lo
        // sobre uma .invoice-document-row transforma a linha em uma grade
        // de duas colunas e desloca os controles para cabeçalhos errados.
        const legacyInvoiceCards = invoiceCards.filter(card => (
            !card.classList.contains('invoice-document-row')
        ));
        legacyInvoiceCards.forEach(decorateInvoiceCard);
        if (!legacyInvoiceCards.length) return;

        const checkboxes = Array.from(advisoryRow.querySelectorAll(
            `input[type="checkbox"][aria-label^="${SENT_LABEL_PREFIX}"]`
        ));
        const usedCards = new Set();

        checkboxes.forEach((checkbox, index) => {
            const accessibleLabel = text(checkbox.getAttribute('aria-label'));
            const invoiceNumber = accessibleLabel.slice(SENT_LABEL_PREFIX.length).trim();
            const card = findInvoiceCard(legacyInvoiceCards, invoiceNumber, index, usedCards);
            const label = checkbox.closest('label');
            if (!card || !label) return;

            label.classList.add('service-invoice-advisory-toggle');
            const copy = label.querySelector('span');
            if (copy) copy.textContent = 'Enviada à Assessoria';
            card.appendChild(label);
        });
    }

    function isProgramBonificationConsolidated(group) {
        const badge = group.contextCell?.querySelector('[data-status-dimension="bonificacao"]');
        return CONSOLIDATED_BONUS_LABELS.has(text(badge?.textContent).toLocaleLowerCase('pt-BR'));
    }

    function rowWasNotDelivered(row) {
        if (row.querySelector('.btn-toggle.active-nao')) return true;
        const readOnlyValue = row.querySelector('[data-bonification-value]');
        return text(readOnlyValue?.getAttribute('data-bonification-value')) === 'Não'
            || text(readOnlyValue?.textContent) === 'Não';
    }

    function applyLateCorrectRestriction(group) {
        const consolidated = isProgramBonificationConsolidated(group);
        group.rows.forEach(row => {
            const requiresLate = consolidated
                && rowWasNotDelivered(row)
                && root.RadarFluxoOperacional?.requiresLateCorrect?.({
                    bonusResult: 'inapta',
                    deliveryStatus: 'Não'
                }) === true;

            row.querySelectorAll('select.select-analise').forEach(select => {
                const correctOption = select.querySelector('option[value="Correto"]');
                if (!correctOption) return;

                if (requiresLate) {
                    correctOption.disabled = true;
                    correctOption.dataset.lateCorrectDisabled = 'true';
                    select.setAttribute('data-late-correct-required', 'true');
                    select.title = 'Documento não entregue no período consolidado: se estiver correto após envio posterior, use Correto (Atrasado).';
                    return;
                }

                if (correctOption.dataset.lateCorrectDisabled === 'true') {
                    correctOption.disabled = false;
                    delete correctOption.dataset.lateCorrectDisabled;
                }
                select.removeAttribute('data-late-correct-required');
                if (select.title.startsWith('Documento não entregue no período consolidado:')) {
                    select.removeAttribute('title');
                }
            });
        });
    }

    function restoreFutureCompetenceControls() {
        root.document.querySelectorAll('[data-future-competence-disabled="true"]').forEach(control => {
            control.disabled = false;
            delete control.dataset.futureCompetenceDisabled;
            if (control.getAttribute('aria-disabled') === 'true') {
                control.removeAttribute('aria-disabled');
            }
        });
    }

    function removeFutureCompetenceNotice() {
        root.document.querySelector('[data-future-competence-notice]')?.remove();
    }

    function decorateCompetenceTabs(referenceDate) {
        const competenceApi = root.RadarCompetencia;
        if (!competenceApi?.isFutureCompetence) return;

        root.document.querySelectorAll('.comp-sub-tab[data-competence]').forEach(tab => {
            let future = false;
            try {
                future = competenceApi.isFutureCompetence(tab.dataset.competence, referenceDate);
            } catch (_error) {
                future = false;
            }
            tab.classList.toggle('future-competence-tab', future);
            if (future) tab.dataset.futureCompetence = 'true';
            else delete tab.dataset.futureCompetence;
        });
    }

    function getActiveCompetenceKey() {
        const activeTab = root.document.querySelector(
            '.comp-sub-tab.active[data-competence], .comp-sub-tab[aria-pressed="true"][data-competence]'
        );
        return text(activeTab?.dataset?.competence);
    }

    function createFutureCompetenceNotice(competenceKey) {
        const notice = root.document.createElement('div');
        notice.className = 'future-competence-notice';
        notice.setAttribute('data-future-competence-notice', 'true');
        notice.setAttribute('role', 'note');

        const strong = root.document.createElement('strong');
        strong.textContent = 'Competência futura · somente leitura';
        const detail = root.document.createElement('span');
        const label = root.RadarCompetencia?.formatCompetencia?.(competenceKey) || competenceKey;
        detail.textContent = ` ${label} permanecerá disponível para consulta, mas os lançamentos serão liberados somente no início do respectivo mês.`;
        notice.append(strong, detail);
        return notice;
    }

    function applyFutureCompetenceReadOnly(referenceDate) {
        restoreFutureCompetenceControls();
        removeFutureCompetenceNotice();
        decorateCompetenceTabs(referenceDate);

        const competenceApi = root.RadarCompetencia;
        const activeCompetence = getActiveCompetenceKey();
        if (!competenceApi?.isFutureCompetence || !activeCompetence) return false;

        let isFuture = false;
        try {
            isFuture = competenceApi.isFutureCompetence(activeCompetence, referenceDate);
        } catch (_error) {
            return false;
        }
        if (!isFuture) return false;

        const tabPanel = root.document.getElementById('tab-verificacoes');
        const competenceTabs = tabPanel?.querySelector('.comp-tabs-container');
        const rowsContainer = root.document.getElementById('prontuario-verif-rows');
        if (!tabPanel || !rowsContainer) return false;

        const notice = createFutureCompetenceNotice(activeCompetence);
        if (competenceTabs) competenceTabs.insertAdjacentElement('afterend', notice);
        else tabPanel.prepend(notice);

        rowsContainer.querySelectorAll('button, input, select, textarea').forEach(control => {
            if (control.disabled) return;
            control.disabled = true;
            control.dataset.futureCompetenceDisabled = 'true';
            control.setAttribute('aria-disabled', 'true');
        });
        return true;
    }

    function enhanceProntuario(referenceDate = new Date(), schoolId = '') {
        const rows = getVerificationRows();
        decorateCompetenceTabs(referenceDate);
        if (!rows.length) {
            applyFutureCompetenceReadOnly(referenceDate);
            return false;
        }

        const resolvedSchoolId = resolveSchoolId(schoolId);
        orderProgramGroupsForPresentation(getProgramGroups(rows)).forEach(group => {
            decorateProgramGroup(group);
            moveServiceAdvisoryControls(group);
            decorateInventoryLinks(group, resolvedSchoolId);
            applyLateCorrectRestriction(group);
        });
        applyFutureCompetenceReadOnly(referenceDate);
        return true;
    }

    function install() {
        if (installed || typeof root.renderProntuario !== 'function') return installed;

        installed = true;
        originalRenderProntuario = root.renderProntuario;
        root.renderProntuario = function renderProntuarioWithOperationalUx(...args) {
            renderedSchoolId = text(args[0]) || renderedSchoolId;
            const result = originalRenderProntuario.apply(this, args);
            enhanceProntuario(new Date(), renderedSchoolId);
            return result;
        };
        enhanceProntuario(new Date(), resolveSchoolId());
        return true;
    }

    root.RadarProntuarioOperationalUx = Object.freeze({
        install,
        enhance: enhanceProntuario
    });

    install();
}(typeof window !== 'undefined' ? window : globalThis));
