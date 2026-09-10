(function installRadarEvaluationRetificationUi(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarEvaluationRetificationUi = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            attemptInstall();
            root.addEventListener?.('radar:application-services-ready', attemptInstall);
            if (root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createEvaluationRetificationUiApi() {
    'use strict';

    const VERSION = '1.0.0';
    const DERIVED_TECHNICAL_DOCUMENTS = new Set(['notaFiscal', 'boletoInternet', 'consAssessoria']);
    const DERIVED_BONIFICATION_DOCUMENTS = new Set(['notaFiscal', 'boletoInternet', 'consAssessoria', 'consEnviada']);
    const EDITABLE_PROFILES = new Set(['controlador', 'assistente']);
    const ACTIVE_CLASSES = ['active-sim', 'active-nao', 'active-naoseaplica'];
    const ANALYSIS_VALUES = ['Não analisado', 'Correto', 'Correto (Atrasado)'];
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        boletoInternet: 'Boleto de pagamento de Internet',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });

    let installed = false;
    let observer = null;
    let scheduled = false;
    let lastTrigger = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'assistente cre' || normalized === 'assistente de verbas federais') return 'assistente';
        return normalized;
    }

    function escapeHtml(value) {
        return text(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function currentProfile(root) {
        try {
            return normalizeProfile(root.getRadarAccessProfile?.());
        } catch (_error) {
            return '';
        }
    }

    function canEdit(root) {
        return EDITABLE_PROFILES.has(currentProfile(root));
    }

    function stateOf(root) {
        const service = root.RadarApplicationServices?.verifications
            || root.RadarApplicationServices?.pendencies
            || root.RadarApplicationServices?.invoices;
        return typeof service?.getState === 'function' ? service.getState() : null;
    }

    function currentSchoolId(root) {
        try {
            return text(root.activeSchoolId || activeSchoolId);
        } catch (_error) {
            return text(root.activeSchoolId);
        }
    }

    function currentCompetence(root) {
        const activeTab = root.document.querySelector(
            '.comp-sub-tab.active[data-competence], .comp-sub-tab[aria-pressed="true"][data-competence]'
        );
        if (text(activeTab?.dataset?.competence)) return text(activeTab.dataset.competence);
        try {
            return text(root.activeProntuarioCompetencia || activeProntuarioCompetencia);
        } catch (_error) {
            return text(root.activeProntuarioCompetencia);
        }
    }

    function contextForRow(root, row) {
        const schoolId = currentSchoolId(root);
        const competence = currentCompetence(root);
        const programId = text(row?.dataset?.programId);
        const documentKey = text(row?.dataset?.documentKey);
        if (!schoolId || !competence || !programId || !documentKey) return null;
        return {
            schoolId,
            competence,
            programId,
            documentKey,
            compKey: `${competence}_${programId}`,
            documentLabel: DOCUMENT_LABELS[documentKey] || documentKey
        };
    }

    function verificationFor(root, context) {
        const state = stateOf(root);
        const fromState = state?.verifications?.[context.schoolId]?.[context.compKey];
        if (fromState) return fromState;
        try {
            return verificacoes?.[context.schoolId]?.[context.compKey] || null;
        } catch (_error) {
            return null;
        }
    }

    function activePendencyFor(root, context) {
        const service = root.RadarApplicationServices?.verifications;
        const state = stateOf(root);
        if (!state) return null;
        if (typeof service?.findActivePendency === 'function') {
            try {
                return service.findActivePendency(
                    state,
                    context.schoolId,
                    context.compKey,
                    context.documentKey
                ) || null;
            } catch (_error) {
                // Fallback para o domínio canônico abaixo.
            }
        }
        const lookup = root.RadarPendencias?.buildPendencyLookupContext?.({
            escolaId: context.schoolId,
            competencia: context.competence,
            programaId: context.programId,
            documentoKey: context.documentKey
        });
        return root.RadarPendencias?.findActivePendency?.(
            state.pendencies || state.pendencias || [],
            lookup || {}
        ) || null;
    }

    function notify(root, message, variant = 'success') {
        if (typeof root.showPendencyNotice === 'function') {
            root.showPendencyNotice(message, variant);
            return true;
        }
        const notice = root.document.getElementById('pendency-notice');
        if (!notice) return false;
        notice.textContent = message;
        notice.hidden = false;
        notice.dataset.variant = variant;
        notice.dataset.radarSaveFeedback = variant;
        root.setTimeout?.(() => {
            if (notice.textContent === message) notice.hidden = true;
        }, 5000);
        return true;
    }

    function reportError(root, error, fallback) {
        if (typeof root.reportRadarActionError === 'function') {
            root.reportRadarActionError(error, fallback);
            return;
        }
        notify(root, text(error?.message) || fallback, 'error');
    }

    function analysisClass(root, value) {
        return root.RadarOperationalWriteFeedback?.analysisStateClass?.(value)
            || `analise-${text(value || 'Não analisado')
                .toLocaleLowerCase('pt-BR')
                .replace(/\s+/g, '-')
                .replace(/[()]/g, '')}`;
    }

    function syncRowFromState(root, row, context) {
        const verification = verificationFor(root, context);
        if (!verification) return false;
        const bonification = verification.bonificacao || verification.bonification || {};
        const analysis = verification.analise || verification.analysis || {};
        const analysisValue = text(analysis[context.documentKey]) || 'Não analisado';
        const select = row.querySelector('select.select-analise');
        if (select) {
            select.value = analysisValue;
            Array.from(select.classList)
                .filter(className => className.startsWith('analise-'))
                .forEach(className => select.classList.remove(className));
            select.classList.add(analysisClass(root, analysisValue));
        }

        const bonificationValue = text(bonification[context.documentKey]);
        const group = row.querySelector('.btn-group-toggle');
        if (group) {
            const buttons = Array.from(group.querySelectorAll('button'));
            buttons.forEach(button => ACTIVE_CLASSES.forEach(className => button.classList.remove(className)));
            buttons.forEach(button => {
                const label = text(button.textContent);
                const normalized = label === 'N/A' ? 'Não se aplica' : label;
                if (normalized !== bonificationValue) return;
                if (normalized === 'Sim') button.classList.add('active-sim');
                if (normalized === 'Não') button.classList.add('active-nao');
                if (normalized === 'Não se aplica') button.classList.add('active-naoseaplica');
            });
        }
        return true;
    }

    function closeModal(root) {
        const layer = root.document.getElementById('evaluation-retification-modal-layer');
        if (!layer) return false;
        layer.remove();
        const trigger = lastTrigger;
        lastTrigger = null;
        root.requestAnimationFrame?.(() => trigger?.focus?.({ preventScroll: true }));
        return true;
    }

    function createOption(value, label, selected = false, disabled = false) {
        return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}>${escapeHtml(label)}</option>`;
    }

    function availableBonificationValues(row, currentValue) {
        const found = new Set();
        row.querySelectorAll('.btn-group-toggle button').forEach(button => {
            const label = text(button.textContent);
            if (label === 'Sim') found.add('Sim');
            if (label === 'Não') found.add('Não');
            if (label === 'N/A') found.add('Não se aplica');
        });
        if (currentValue) found.add(currentValue);
        return ['', ...found];
    }

    function buildModal(root, mode, row, context, trigger) {
        root.document.getElementById('evaluation-retification-modal-layer')?.remove();
        const verification = verificationFor(root, context);
        if (!verification) {
            notify(root, 'Não foi possível localizar a avaliação desta competência.', 'error');
            return false;
        }

        const isAnalysis = mode === 'analysis';
        const source = isAnalysis
            ? (verification.analise || verification.analysis || {})
            : (verification.bonificacao || verification.bonification || {});
        const currentValue = text(source[context.documentKey]) || (isAnalysis ? 'Não analisado' : 'Não preenchido');
        const activePendency = isAnalysis ? activePendencyFor(root, context) : null;
        const values = isAnalysis
            ? [...new Set([currentValue, ...ANALYSIS_VALUES])]
            : availableBonificationValues(row, currentValue === 'Não preenchido' ? '' : currentValue);
        const title = isAnalysis ? 'Editar análise técnica' : 'Editar bonificação';
        const selectLabel = isAnalysis ? 'Nova análise técnica' : 'Nova bonificação';
        const selectId = 'evaluation-retification-value';
        const currentDisplay = currentValue;

        const layer = root.document.createElement('div');
        layer.id = 'evaluation-retification-modal-layer';
        layer.className = 'evaluation-retification-modal-layer';
        layer.innerHTML = `
            <div class="evaluation-retification-backdrop" data-evaluation-retification-close="true"></div>
            <section class="evaluation-retification-dialog" role="dialog" aria-modal="true" aria-labelledby="evaluation-retification-title">
                <header class="evaluation-retification-header">
                    <div>
                        <span class="evaluation-retification-kicker">Correção auditável</span>
                        <h2 id="evaluation-retification-title">${escapeHtml(title)}</h2>
                        <p>${escapeHtml(context.documentLabel)} · ${escapeHtml(context.competence)}</p>
                    </div>
                    <button type="button" class="btn-close" aria-label="Fechar edição" data-evaluation-retification-close="true">×</button>
                </header>
                <form id="evaluation-retification-form" class="evaluation-retification-form">
                    <div class="evaluation-retification-current">
                        <span>Valor atual</span>
                        <strong data-testid="evaluation-current-value">${escapeHtml(currentDisplay)}</strong>
                    </div>
                    <div class="form-group">
                        <label for="${selectId}">${escapeHtml(selectLabel)}</label>
                        <select id="${selectId}" class="form-control" aria-label="${escapeHtml(selectLabel)}">
                            ${values.map(value => {
                                const display = value || 'Não preenchido';
                                const effectiveCurrent = currentValue === 'Não preenchido' ? '' : currentValue;
                                const disabled = isAnalysis && value === 'Incorreto' && value === effectiveCurrent;
                                return createOption(value, display, value === effectiveCurrent, disabled);
                            }).join('')}
                        </select>
                    </div>
                    <div class="evaluation-retification-impact" data-testid="evaluation-retification-confirmation" hidden>
                        <strong>Esta correção encerra uma Pendência ativa</strong>
                        <p>A Pendência vinculada será anulada por esta retificação. O histórico anterior será preservado e o registro ficará identificado como <b>Anulada por edição da avaliação</b>.</p>
                        <label class="evaluation-retification-check">
                            <input type="checkbox" id="evaluation-retification-confirm-check">
                            <span>Confirmo que estou corrigindo um lançamento de avaliação realizado incorretamente e que a Pendência vinculada deve ser anulada por esta retificação.</span>
                        </label>
                        <div class="form-group">
                            <label for="evaluation-retification-justification">Justificativa da retificação</label>
                            <textarea id="evaluation-retification-justification" class="form-control" rows="4" maxlength="1000" placeholder="Explique objetivamente por que a avaliação anterior foi registrada incorretamente."></textarea>
                            <small>Obrigatória para diferenciar esta operação de um cancelamento comum de Pendência.</small>
                        </div>
                    </div>
                    <div class="evaluation-retification-feedback" role="status" aria-live="polite"></div>
                    <footer class="evaluation-retification-actions">
                        <button type="button" class="btn btn-secondary" data-evaluation-retification-close="true">Voltar sem alterar</button>
                        <button type="submit" class="btn btn-primary" id="evaluation-retification-submit" disabled>Salvar edição</button>
                    </footer>
                </form>
            </section>
        `;
        root.document.body.appendChild(layer);
        lastTrigger = trigger || null;

        const form = layer.querySelector('#evaluation-retification-form');
        const valueSelect = layer.querySelector(`#${selectId}`);
        const impact = layer.querySelector('[data-testid="evaluation-retification-confirmation"]');
        const confirmCheck = layer.querySelector('#evaluation-retification-confirm-check');
        const justification = layer.querySelector('#evaluation-retification-justification');
        const submit = layer.querySelector('#evaluation-retification-submit');
        const feedback = layer.querySelector('.evaluation-retification-feedback');
        const effectiveInitial = currentValue === 'Não preenchido' ? '' : currentValue;

        const refresh = () => {
            const nextValue = text(valueSelect.value);
            const changed = nextValue !== effectiveInitial;
            const requiresFormalConfirmation = Boolean(
                isAnalysis
                && activePendency
                && effectiveInitial === 'Incorreto'
                && changed
            );
            impact.hidden = !requiresFormalConfirmation;
            submit.textContent = requiresFormalConfirmation
                ? 'Confirmar retificação e anular Pendência'
                : 'Salvar edição';
            const completeFormalConfirmation = !requiresFormalConfirmation || (
                confirmCheck.checked && Boolean(text(justification.value))
            );
            submit.disabled = !changed || !completeFormalConfirmation;
            feedback.textContent = '';
        };

        valueSelect.addEventListener('change', refresh);
        confirmCheck.addEventListener('change', refresh);
        justification.addEventListener('input', refresh);
        layer.querySelectorAll('[data-evaluation-retification-close="true"]').forEach(control => {
            control.addEventListener('click', () => closeModal(root));
        });
        layer.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal(root);
            }
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (submit.disabled) return;
            const nextValue = text(valueSelect.value);
            const requiresFormalConfirmation = Boolean(
                isAnalysis
                && activePendency
                && effectiveInitial === 'Incorreto'
                && nextValue !== effectiveInitial
            );
            submit.disabled = true;
            submit.setAttribute('aria-busy', 'true');
            form.setAttribute('aria-busy', 'true');
            feedback.textContent = 'Salvando alteração…';

            try {
                const service = root.RadarApplicationServices?.verifications;
                if (!service) throw new Error('Serviço de avaliações indisponível.');
                let result;
                if (isAnalysis) {
                    result = await service.correctTechnicalAnalysis({
                        schoolId: context.schoolId,
                        compKey: context.compKey,
                        documentKey: context.documentKey,
                        value: nextValue,
                        profile: currentProfile(root),
                        confirmPendencyCancellation: requiresFormalConfirmation,
                        retificationJustification: requiresFormalConfirmation
                            ? text(justification.value)
                            : undefined
                    });
                } else {
                    result = await service.setBonification({
                        schoolId: context.schoolId,
                        compKey: context.compKey,
                        documentKey: context.documentKey,
                        value: nextValue,
                        profile: currentProfile(root)
                    });
                }
                if (result?.ok !== true) throw result?.error || new Error('A alteração não foi confirmada.');

                syncRowFromState(root, row, context);
                closeModal(root);
                if (requiresFormalConfirmation) {
                    notify(root, 'Avaliação retificada e Pendência anulada com sucesso.', 'success');
                } else if (isAnalysis) {
                    notify(root, 'Análise técnica editada com sucesso.', 'success');
                } else if (!nextValue) {
                    notify(root, 'Bonificação desfeita com sucesso.', 'success');
                } else {
                    notify(root, 'Bonificação editada com sucesso.', 'success');
                }
                scheduleDecoration(root);
            } catch (error) {
                feedback.textContent = '';
                reportError(root, error, 'Não foi possível salvar a edição da avaliação.');
                submit.removeAttribute('aria-busy');
                form.removeAttribute('aria-busy');
                refresh();
            }
        });

        refresh();
        root.requestAnimationFrame?.(() => valueSelect.focus({ preventScroll: true }));
        return true;
    }

    function createEditButton(root, row, context, mode) {
        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm evaluation-retification-trigger';
        button.dataset.evaluationRetificationAction = mode;
        const label = mode === 'analysis' ? 'Editar análise' : 'Editar bonificação';
        button.setAttribute('aria-label', label);
        button.textContent = label;
        button.addEventListener('click', () => buildModal(root, mode, row, context, button));
        return button;
    }

    function ensureActionArea(root, cell, key) {
        let area = cell.querySelector(`[data-evaluation-retification-actions="${key}"]`);
        if (area) return area;
        area = root.document.createElement('div');
        area.className = 'evaluation-retification-inline-actions';
        area.dataset.evaluationRetificationActions = key;
        cell.appendChild(area);
        return area;
    }

    function decorateProntuarioRows(root) {
        if (!canEdit(root)) return false;
        const rows = root.document.querySelectorAll(
            '#prontuario-verif-rows tr[data-program-id][data-document-key]'
        );
        rows.forEach(row => {
            const context = contextForRow(root, row);
            if (!context) return;

            const analysisSelect = row.querySelector('select.select-analise');
            if (analysisSelect && !DERIVED_TECHNICAL_DOCUMENTS.has(context.documentKey)) {
                const analysisCell = analysisSelect.closest('td');
                if (analysisCell) {
                    const area = ensureActionArea(root, analysisCell, 'analysis');
                    if (!area.querySelector('[data-evaluation-retification-action="analysis"]')) {
                        const verification = verificationFor(root, context);
                        const bonificationValue = text(
                            verification?.bonificacao?.[context.documentKey]
                            || verification?.bonification?.[context.documentKey]
                        );
                        const lockedNa = context.documentKey === 'declBBAgil'
                            && bonificationValue === 'Não se aplica';
                        if (!lockedNa) area.appendChild(createEditButton(root, row, context, 'analysis'));
                    }
                }
            }

            const bonificationGroup = row.querySelector('.btn-group-toggle');
            if (bonificationGroup && !DERIVED_BONIFICATION_DOCUMENTS.has(context.documentKey)) {
                const bonificationCell = bonificationGroup.closest('td');
                if (bonificationCell) {
                    const area = ensureActionArea(root, bonificationCell, 'bonification');
                    if (!area.querySelector('[data-evaluation-retification-action="bonification"]')) {
                        area.appendChild(createEditButton(root, row, context, 'bonification'));
                    }
                }
            }
        });
        return true;
    }

    function specialCancellation(pendency) {
        const cancellation = pendency?.cancelamento || pendency?.cancellation || {};
        return text(cancellation.tipo || cancellation.type) === 'retificacao_avaliacao'
            ? cancellation
            : null;
    }

    function findPendencyById(root, pendencyId) {
        const state = stateOf(root);
        const collection = state?.pendencies || state?.pendencias || [];
        return Array.isArray(collection)
            ? collection.find(item => text(item?.id) === text(pendencyId)) || null
            : null;
    }

    function pendencyIdFromElement(root, element) {
        if (!element) return '';
        if (text(element.dataset?.pendencyId)) return text(element.dataset.pendencyId);
        try {
            return text(root.resolvePendencyIdReference?.(element));
        } catch (_error) {
            return '';
        }
    }

    function createSpecialBadge(root) {
        const badge = root.document.createElement('span');
        badge.className = 'badge evaluation-retification-status-badge';
        badge.dataset.evaluationRetificationStatus = 'true';
        badge.textContent = 'Anulada por edição da avaliação';
        return badge;
    }

    function decoratePendencyRecord(root, element) {
        const pendencyId = pendencyIdFromElement(root, element);
        const pendency = findPendencyById(root, pendencyId);
        const cancellation = specialCancellation(pendency);
        if (!cancellation) return false;
        element.classList.add('is-evaluation-retification');
        if (!element.querySelector('[data-evaluation-retification-status]')) {
            const statusBadge = Array.from(element.querySelectorAll('.badge'))
                .find(candidate => text(candidate.textContent) === 'Cancelada');
            if (statusBadge) statusBadge.insertAdjacentElement('afterend', createSpecialBadge(root));
        }
        return true;
    }

    function decoratePendencyDrawer(root) {
        const drawer = root.document.getElementById('pendency-detail-drawer');
        if (!drawer) return false;
        const pendencyId = pendencyIdFromElement(root, drawer);
        const pendency = findPendencyById(root, pendencyId);
        const cancellation = specialCancellation(pendency);
        if (!cancellation) return false;

        drawer.classList.add('is-evaluation-retification');
        const cancelSection = drawer.querySelector('.pendency-drawer-section.is-cancel');
        if (cancelSection && !cancelSection.dataset.evaluationRetificationSummary) {
            cancelSection.dataset.evaluationRetificationSummary = 'true';
            cancelSection.classList.add('is-evaluation-retification-summary');
            const before = text(cancellation.avaliacaoAnterior || cancellation.previousAnalysis) || 'Incorreto';
            const after = text(cancellation.avaliacaoNova || cancellation.newAnalysis) || 'Não informado';
            const justification = text(cancellation.justificativa) || 'Justificativa não informada.';
            const user = text(cancellation.usuario) || 'Usuário não identificado';
            const at = text(cancellation.dataHora);
            cancelSection.innerHTML = `
                <h3 id="pendency-detail-cancel-title">Retificação da avaliação técnica</h3>
                <span class="evaluation-retification-drawer-label">Anulada por edição da avaliação</span>
                <dl class="evaluation-retification-drawer-grid">
                    <div><dt>Alteração realizada</dt><dd>${escapeHtml(before)} → ${escapeHtml(after)}</dd></div>
                    <div><dt>Responsável</dt><dd>${escapeHtml(user)}</dd></div>
                    ${at ? `<div><dt>Data e hora</dt><dd>${escapeHtml(new Date(at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</dd></div>` : ''}
                </dl>
                <div class="evaluation-retification-justification">
                    <strong>Justificativa</strong>
                    <p>${escapeHtml(justification)}</p>
                </div>
            `;
        }

        drawer.querySelectorAll('.pendency-timeline-heading strong').forEach(label => {
            if (text(label.textContent).toLocaleLowerCase('pt-BR') === 'retificacao avaliacao') {
                label.textContent = 'Retificação da avaliação';
            }
        });
        return true;
    }

    function decoratePendencias(root) {
        root.document.querySelectorAll('[data-pendency-id]').forEach(element => {
            decoratePendencyRecord(root, element);
        });
        decoratePendencyDrawer(root);
        return true;
    }

    function decorate(root) {
        decorateProntuarioRows(root);
        decoratePendencias(root);
        return true;
    }

    function scheduleDecoration(root) {
        if (scheduled) return;
        scheduled = true;
        const run = () => {
            scheduled = false;
            decorate(root);
        };
        if (typeof root.requestAnimationFrame === 'function') root.requestAnimationFrame(run);
        else root.setTimeout?.(run, 0);
    }

    function dependenciesReady(root) {
        return Boolean(
            root?.document
            && root.RadarApplicationServices?.verifications
            && root.RadarEvaluationRetification
            && root.RadarPendencias
        );
    }

    function install(root) {
        if (installed) {
            scheduleDecoration(root);
            return true;
        }
        if (!dependenciesReady(root)) return false;
        installed = true;
        decorate(root);
        const target = root.document.getElementById('main-container') || root.document.body;
        observer = new MutationObserver(() => scheduleDecoration(root));
        observer.observe(target, { childList: true, subtree: true });
        root.addEventListener?.('radar:application-services-ready', () => scheduleDecoration(root));
        return true;
    }

    return Object.freeze({
        VERSION,
        install,
        decorate,
        closeModal
    });
}));
