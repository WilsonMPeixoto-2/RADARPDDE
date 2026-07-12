(function installTask1213Retifications(root) {
    'use strict';

    const BONUS_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação',
        consEnviada: 'Consultoria enviada para Assessoria'
    });
    const BONUS_OPTIONS = ['', 'Sim', 'Não', 'Não se aplica'];

    let installed = false;
    let originalRenderProntuario = null;
    let originalToggleBonif = null;
    let originalToggleConsEnviada = null;
    let activeSchoolId = null;
    let activeContext = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarRetificacoes
            && root.RadarFluxoOperacional
            && typeof root.renderProntuario === 'function'
            && typeof root.toggleBonif === 'function'
        );
    }

    function currentProfileValue() {
        return typeof currentProfile !== 'undefined' ? currentProfile : '';
    }

    function canRetify() {
        return root.RadarRetificacoes.canRetify(currentProfileValue());
    }

    function getVerification(schoolId, compKey) {
        return verificacoes?.[schoolId]?.[compKey] || null;
    }

    function getProgramName(programId) {
        return programas.find(program => program.id === programId)?.name || programId;
    }

    function getSchoolName(schoolId) {
        const school = escolas.find(item => item.id === schoolId);
        return school?.denominação || school?.denominacao || schoolId;
    }

    function getCurrentUserSafe() {
        if (typeof getCurrentUser === 'function') return getCurrentUser();
        return { name: 'Assistente não identificado', role: currentProfileValue() };
    }

    function createClientId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatDateTime(value) {
        const parsed = new Date(value);
        if (!value || Number.isNaN(parsed.getTime())) return 'Data não informada';
        return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function formatResult(value) {
        const normalized = String(value || '').trim();
        if (!normalized) return 'Não consolidada';
        return normalized.toLocaleUpperCase('pt-BR');
    }

    function announce(message, type = 'success') {
        let region = document.getElementById('retification-live-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'retification-live-region';
            region.className = 'retification-live-region';
            region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            document.body.appendChild(region);
        }
        region.dataset.type = type;
        region.setAttribute('role', type === 'error' ? 'alert' : 'status');
        region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        region.textContent = message;
        root.setTimeout(() => {
            if (region.textContent === message) region.textContent = '';
        }, 5000);
    }

    function injectModal() {
        if (document.getElementById('modal-retification')) return;
        const modal = document.createElement('div');
        modal.id = 'modal-retification';
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-labelledby', 'retification-title');
        modal.setAttribute('inert', '');
        modal.innerHTML = `
            <div class="modal-content retification-modal">
                <header class="modal-header">
                    <div>
                        <h2 id="retification-title">Retificar consolidação</h2>
                        <p id="retification-context">Contexto não selecionado.</p>
                    </div>
                    <button type="button" class="btn-close" aria-label="Fechar retificação">×</button>
                </header>
                <form id="retification-form">
                    <div class="retification-result-strip">
                        <div><span>Resultado atual</span><strong id="retification-current-result">—</strong></div>
                        <span aria-hidden="true">→</span>
                        <div><span>Resultado projetado</span><strong id="retification-projected-result">—</strong></div>
                    </div>
                    <div id="retification-fields" class="retification-fields"></div>
                    <div class="form-group">
                        <label for="retification-justification">Justificativa da retificação</label>
                        <textarea id="retification-justification" class="form-control" rows="4" required></textarea>
                    </div>
                    <section class="retification-preview" aria-labelledby="retification-preview-title" data-testid="retification-preview">
                        <h3 id="retification-preview-title">Comparação antes e depois</h3>
                        <div id="retification-preview-content">Nenhuma alteração selecionada.</div>
                    </section>
                    <div id="retification-error" class="retification-error" role="alert" hidden></div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" data-action="close-retification">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Confirmar retificação</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.btn-close').addEventListener('click', closeRetificationModal);
        modal.querySelector('[data-action="close-retification"]').addEventListener('click', closeRetificationModal);
        modal.querySelector('#retification-form').addEventListener('submit', confirmRetification);
        modal.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRetificationModal();
                return;
            }
            if (event.key === 'Tab') {
                const focusable = Array.from(modal.querySelectorAll(
                    'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                ));
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function setModalOpen(open) {
        const modal = document.getElementById('modal-retification');
        if (!modal) return;
        modal.classList.toggle('show', open);
        modal.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) modal.removeAttribute('inert');
        else modal.setAttribute('inert', '');
        document.body.classList.toggle('modal-open', open);
    }

    function getDraftBonification() {
        const draft = {};
        document.querySelectorAll('#retification-fields [data-bonus-key]').forEach(input => {
            const key = input.dataset.bonusKey;
            draft[key] = input.type === 'checkbox' ? input.checked : input.value;
        });
        return draft;
    }

    function evaluateDraft(draft) {
        const evaluation = root.RadarFluxoOperacional.evaluateBonification(draft);
        return {
            canConsolidate: Boolean(evaluation.canConsolidate),
            status: evaluation.canConsolidate ? evaluation.status : null,
            missingFields: evaluation.missingFields || []
        };
    }

    function renderFields(verification, initialChanges = {}) {
        const container = document.getElementById('retification-fields');
        container.replaceChildren();
        const keys = Object.keys(verification.bonificacao || {});
        keys.forEach((key, index) => {
            const current = Object.prototype.hasOwnProperty.call(initialChanges, key)
                ? initialChanges[key]
                : verification.bonificacao[key];
            const field = document.createElement('div');
            field.className = 'form-group retification-field';
            const label = document.createElement('label');
            const id = `retification-field-${index}`;
            label.htmlFor = id;
            label.textContent = BONUS_LABELS[key] || key;
            let input;
            if (typeof verification.bonificacao[key] === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = Boolean(current);
                field.classList.add('retification-field-checkbox');
            } else {
                input = document.createElement('select');
                input.className = 'form-control';
                BONUS_OPTIONS.forEach(optionValue => {
                    const option = document.createElement('option');
                    option.value = optionValue;
                    option.textContent = optionValue || 'Não informado';
                    option.selected = optionValue === current;
                    input.appendChild(option);
                });
            }
            input.id = id;
            input.dataset.bonusKey = key;
            input.addEventListener('change', updateRetificationPreview);
            field.append(label, input);
            container.appendChild(field);
        });
    }

    function getChanges(before, after) {
        return Object.keys({ ...before, ...after })
            .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
            .map(key => ({
                key,
                label: BONUS_LABELS[key] || key,
                before: before[key],
                after: after[key]
            }));
    }

    function displayValue(value) {
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        return String(value == null || value === '' ? 'Não informado' : value);
    }

    function updateRetificationPreview() {
        if (!activeContext) return;
        const verification = getVerification(activeContext.schoolId, activeContext.compKey);
        if (!verification) return;
        const draft = getDraftBonification();
        const evaluation = evaluateDraft(draft);
        const changes = getChanges(verification.bonificacao || {}, draft);
        const projected = document.getElementById('retification-projected-result');
        projected.textContent = evaluation.canConsolidate
            ? formatResult(evaluation.status)
            : 'PREENCHIMENTO INCOMPLETO';
        projected.dataset.valid = evaluation.canConsolidate ? 'true' : 'false';
        const preview = document.getElementById('retification-preview-content');
        if (!changes.length) {
            preview.textContent = 'Nenhuma alteração selecionada.';
            return;
        }
        const list = document.createElement('ul');
        changes.forEach(change => {
            const item = document.createElement('li');
            const strong = document.createElement('strong');
            strong.textContent = `${change.label}: `;
            item.append(strong, document.createTextNode(`${displayValue(change.before)} → ${displayValue(change.after)}`));
            list.appendChild(item);
        });
        preview.replaceChildren(list);
    }

    function showRetificationError(message) {
        const error = document.getElementById('retification-error');
        error.hidden = false;
        error.textContent = message;
    }

    function openRetificationModal(context, initialChanges = {}) {
        if (!canRetify()) {
            announce('Retificação permitida somente ao perfil Assistente nesta fase.', 'error');
            return false;
        }
        const source = context && context.currentTarget ? context.currentTarget : context;
        const schoolId = source?.dataset?.schoolId || context?.schoolId;
        const compKey = source?.dataset?.compKey || context?.compKey;
        const verification = getVerification(schoolId, compKey);
        if (!verification || !verification.resultadoBonif) {
            announce('A consolidação selecionada não está disponível para retificação.', 'error');
            return false;
        }
        const parts = String(compKey).split('_');
        const programId = source?.dataset?.programId || context?.programId || parts.slice(1).join('_');
        activeContext = {
            schoolId,
            compKey,
            programId,
            trigger: source?.nodeType === 1 ? source : document.activeElement
        };
        injectModal();
        document.getElementById('retification-context').textContent = `${getSchoolName(schoolId)} · ${getProgramName(programId)} · ${parts[0]}`;
        document.getElementById('retification-current-result').textContent = formatResult(verification.resultadoBonif);
        document.getElementById('retification-justification').value = '';
        document.getElementById('retification-error').hidden = true;
        renderFields(verification, initialChanges);
        updateRetificationPreview();
        setModalOpen(true);
        root.requestAnimationFrame(() => {
            const changedKey = Object.keys(initialChanges)[0];
            const target = changedKey
                ? document.querySelector(`#retification-fields [data-bonus-key="${changedKey}"]`)
                : document.querySelector('#retification-fields select, #retification-fields input');
            if (target) target.focus({ preventScroll: true });
        });
        return true;
    }

    function closeRetificationModal() {
        const trigger = activeContext?.trigger;
        setModalOpen(false);
        activeContext = null;
        if (trigger && document.contains(trigger)) {
            root.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
        }
        return true;
    }

    function confirmRetification(event) {
        event.preventDefault();
        if (!activeContext) return false;
        try {
            const form = event.currentTarget;
            if (!form.checkValidity()) {
                form.reportValidity();
                return false;
            }
            const verification = getVerification(activeContext.schoolId, activeContext.compKey);
            if (!verification) throw new Error('Verificação não encontrada.');
            const draft = getDraftBonification();
            const evaluation = evaluateDraft(draft);
            if (!evaluation.canConsolidate) {
                const missing = evaluation.missingFields.map(key => BONUS_LABELS[key] || key).join(', ');
                throw new Error(`A retificação não pode ser concluída. Revise: ${missing || 'campos de bonificação'}.`);
            }
            const user = getCurrentUserSafe();
            const result = root.RadarRetificacoes.applyRetification(verification, {
                bonificacao: draft,
                resultadoBonif: evaluation.status,
                justificativa: document.getElementById('retification-justification').value
            }, {
                id: createClientId('retificacao'),
                at: new Date().toISOString(),
                usuario: user.name,
                perfil: user.role || currentProfileValue(),
                escolaId: activeContext.schoolId,
                competencia: activeContext.compKey.split('_')[0],
                programaId: activeContext.programId
            });
            verificacoes[activeContext.schoolId][activeContext.compKey] = result.verification;
            const schoolId = activeContext.schoolId;
            const schoolName = getSchoolName(schoolId);
            const compKey = activeContext.compKey;
            if (typeof registerLog === 'function') {
                registerLog(
                    'Consolidação retificada',
                    `${schoolName} · ${compKey}. Justificativa: ${result.retification.justificativa}. Campos: ${result.retification.changedFields.join(', ')}.`
                );
            } else if (typeof persist === 'function') {
                persist('verificacoes');
            }
            setModalOpen(false);
            activeContext = null;
            root.renderProntuario(schoolId);
            announce('Retificação registrada com histórico antes e depois.');
            root.requestAnimationFrame(() => {
                const history = document.querySelector('.retification-history-panel');
                const target = document.querySelector('[data-retification-control] button') || history;
                if (history) {
                    history.setAttribute('tabindex', '-1');
                    history.scrollIntoView({ block: 'nearest' });
                }
                if (target) target.focus({ preventScroll: true });
            });
            return true;
        } catch (error) {
            showRetificationError(error.message || 'Não foi possível registrar a retificação.');
            return false;
        }
    }

    function renderHistoryPanel(schoolId) {
        const table = document.getElementById('prontuario-verif-rows')?.closest('table');
        const panel = table?.closest('.panel-card');
        if (!panel) return;
        panel.querySelector('.retification-history-panel')?.remove();
        const competence = typeof activeProntuarioCompetencia !== 'undefined'
            ? activeProntuarioCompetencia
            : '';
        const entries = [];
        const schoolVerifications = verificacoes?.[schoolId] || {};
        Object.entries(schoolVerifications).forEach(([compKey, verification]) => {
            if (competence && !compKey.startsWith(`${competence}_`)) return;
            const programId = compKey.slice(compKey.indexOf('_') + 1);
            (Array.isArray(verification.retificacoes) ? verification.retificacoes : []).forEach(item => {
                entries.push({ ...item, compKey, programId });
            });
        });
        if (!entries.length) return;
        entries.sort((left, right) => String(right.dataHora).localeCompare(String(left.dataHora)));
        const section = document.createElement('section');
        section.className = 'retification-history-panel';
        section.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2>Histórico de retificações</h2>
                    <p>Alterações administrativas preservadas com autoria, justificativa e comparação.</p>
                </div>
                <span class="badge badge-info">${entries.length}</span>
            </div>
            <div class="retification-history-list">
                ${entries.map(item => `
                    <article>
                        <header>
                            <strong>${escapeHtml(getProgramName(item.programaId))}</strong>
                            <time>${escapeHtml(formatDateTime(item.dataHora))}</time>
                        </header>
                        <p>${escapeHtml(item.justificativa)}</p>
                        <small>${escapeHtml(item.usuario || 'Usuário não informado')} · ${escapeHtml(item.changedFields?.join(', ') || 'Alteração não detalhada')}</small>
                    </article>
                `).join('')}
            </div>
        `;
        panel.appendChild(section);
    }

    function enhanceRetificationControls(schoolId) {
        const rows = Array.from(document.querySelectorAll('#prontuario-verif-rows tr[data-program-id]'));
        const competence = typeof activeProntuarioCompetencia !== 'undefined'
            ? activeProntuarioCompetencia
            : '';
        const programIds = [...new Set(rows.map(row => row.dataset.programId).filter(Boolean))];
        programIds.forEach(programId => {
            const compKey = `${competence}_${programId}`;
            const verification = getVerification(schoolId, compKey);
            if (!verification?.resultadoBonif) return;
            const programRows = rows.filter(row => row.dataset.programId === programId);
            const anchorCell = programRows.map(row => row.querySelector('td[rowspan]')).find(Boolean)
                || programRows[0]?.cells[0];
            if (!anchorCell || anchorCell.querySelector('[data-retification-control]')) return;
            const control = document.createElement('div');
            control.className = 'retification-control';
            control.dataset.retificationControl = 'true';
            const count = Array.isArray(verification.retificacoes) ? verification.retificacoes.length : 0;
            if (canRetify()) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-primary btn-sm';
                button.textContent = 'Retificar consolidação';
                button.dataset.schoolId = schoolId;
                button.dataset.compKey = compKey;
                button.dataset.programId = programId;
                button.addEventListener('click', event => openRetificationModal(event));
                control.appendChild(button);
            }
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge badge-info';
                badge.textContent = `${count} retificação${count === 1 ? '' : 'ões'}`;
                control.appendChild(badge);
            }
            if (control.childElementCount) anchorCell.appendChild(control);
        });
        renderHistoryPanel(schoolId);
    }

    function renderProntuarioEnhanced(schoolId) {
        activeSchoolId = schoolId;
        const result = originalRenderProntuario(schoolId);
        root.requestAnimationFrame(() => enhanceRetificationControls(schoolId));
        return result;
    }

    function toggleBonifAudited(escolaId, compKey, docKey, value) {
        const verification = getVerification(escolaId, compKey);
        if (verification?.resultadoBonif && canRetify()) {
            return openRetificationModal({
                schoolId: escolaId,
                compKey,
                programId: compKey.slice(compKey.indexOf('_') + 1),
                nodeType: 0
            }, { [docKey]: value });
        }
        return originalToggleBonif(escolaId, compKey, docKey, value);
    }

    function toggleConsEnviadaAudited(escolaId, compKey, isChecked) {
        const verification = getVerification(escolaId, compKey);
        if (verification?.resultadoBonif && canRetify()) {
            return openRetificationModal({
                schoolId: escolaId,
                compKey,
                programId: compKey.slice(compKey.indexOf('_') + 1),
                nodeType: 0
            }, { consEnviada: Boolean(isChecked) });
        }
        return originalToggleConsEnviada
            ? originalToggleConsEnviada(escolaId, compKey, isChecked)
            : false;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        injectModal();
        originalRenderProntuario = root.renderProntuario.bind(root);
        originalToggleBonif = root.toggleBonif.bind(root);
        originalToggleConsEnviada = typeof root.toggleConsEnviada === 'function'
            ? root.toggleConsEnviada.bind(root)
            : null;
        root.renderProntuario = renderProntuarioEnhanced;
        root.toggleBonif = toggleBonifAudited;
        if (originalToggleConsEnviada) root.toggleConsEnviada = toggleConsEnviadaAudited;
        root.openRetificationModal = openRetificationModal;
        root.previewRetification = updateRetificationPreview;
        root.confirmRetification = confirmRetification;
        root.renderRetificationHistory = renderHistoryPanel;
        root.RadarTask1213Retifications = Object.freeze({
            VERSION: '1.0.0',
            enhance: enhanceRetificationControls,
            getActiveSchoolId: () => activeSchoolId
        });
        installed = true;
        if (typeof currentView !== 'undefined' && currentView === 'prontuario' && activeSchoolId) {
            root.requestAnimationFrame(() => enhanceRetificationControls(activeSchoolId));
        }
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
