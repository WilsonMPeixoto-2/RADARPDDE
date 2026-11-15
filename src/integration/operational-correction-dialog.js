(function installOperationalCorrectionDialog(root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarOperationalCorrectionDialog = api;
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalCorrectionDialog() {
    'use strict';

    const ANALYSES = ['Correto', 'Correto (Atrasado)', 'Incorreto', 'Não analisado'];
    const text = value => value == null ? '' : String(value).trim();
    const el = (doc, tag, className, value) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    };
    function repositoryOf(root) {
        // Autoridade: mesmo repositório já composto pelo app.js.
        return root?.RadarApplicationServices?.data?.repository
            || root?.RadarDataContext?.dataService?.repository
            || root?.RadarDataContext?.repository || null;
    }
    function canUse(root) {
        if (root?.RADAR_OPERATIONAL_CORRECTION_PREVIEW !== true) return false;
        try {
            const repository = repositoryOf(root);
            return typeof repository?.executeRpc === 'function'
                && repository?.capabilities?.().remote === true
                && typeof root.RadarOperationalCorrectionClient?.createOperationalCorrectionClient === 'function';
        } catch (_error) {
            return false;
        }
    }
    function open(root, input = {}) {
        const context = input.context || {};
        if (!canUse(root) || !context.schoolId || !context.competence
            || !context.programId || !context.documentKey) return false;
        const doc = root.document;
        if (doc.getElementById('radar-operational-correction-layer')) return true;
        const client = root.RadarOperationalCorrectionClient.createOperationalCorrectionClient({
            repository: repositoryOf(root)
        });
        const target = {
            schoolId: context.schoolId,
            competence: context.competence,
            programId: context.programId,
            documentKey: context.documentKey
        };
        if (context.invoiceId) target.id = context.invoiceId;
        const layer = el(doc, 'div', 'radar-operational-correction-layer evaluation-retification-modal-layer');
        layer.id = 'radar-operational-correction-layer';
        const backdrop = el(doc, 'div', 'radar-operational-correction-backdrop evaluation-retification-backdrop');
        const dialog = el(doc, 'section', 'radar-operational-correction-dialog evaluation-retification-dialog');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'radar-operational-correction-title');
        const title = el(doc, 'h2', '', 'Corrigir análise técnica');
        title.id = 'radar-operational-correction-title';
        const summary = el(doc, 'p', '', text(context.documentLabel || context.documentKey) + ' · ' + context.competence);
        const current = el(doc, 'p', '', 'Resultado atual: ' + text(input.currentValue || 'Não analisado'));
        const label = el(doc, 'label', '', 'Novo resultado');
        label.htmlFor = 'radar-operational-correction-select';
        const select = el(doc, 'select', 'form-control');
        select.id = 'radar-operational-correction-select';
        for (const analysis of ANALYSES) {
            const option = el(doc, 'option', '', analysis);
            option.value = analysis;
            select.appendChild(option);
        }
        // Preserva a sugestão inicial de "Correto" quando ainda não há análise;
        // "Não analisado" permanece disponível para limpeza deliberada.
        const currentChoice = text(input.currentValue);
        select.value = currentChoice !== 'Não analisado' && ANALYSES.includes(currentChoice)
            ? currentChoice : 'Correto';
        const noteLabel = el(doc, 'label', '', 'Observação (opcional)');
        noteLabel.htmlFor = 'radar-operational-correction-note';
        const note = el(doc, 'textarea', 'form-control');
        note.id = 'radar-operational-correction-note';
        note.maxLength = 2000;
        note.rows = 3;
        const planTitle = el(doc, 'h3', '', 'O que vai mudar ao confirmar');
        const effects = el(doc, 'div', 'radar-operational-correction-effects', 'Calculando o que vai mudar…');
        effects.setAttribute('aria-live', 'polite');
        const feedback = el(doc, 'p', 'radar-operational-correction-feedback');
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        const actions = el(doc, 'div', 'radar-operational-correction-actions');
        const cancel = el(doc, 'button', 'btn btn-secondary', 'Cancelar');
        const clearBtn = el(doc, 'button', 'btn btn-secondary', 'Limpar análise');
        const review = el(doc, 'button', 'btn btn-secondary', 'Revisar prévia');
        const save = el(doc, 'button', 'btn btn-primary', 'Confirmar correção');
        for (const button of [cancel, clearBtn, review, save]) button.type = 'button';
        clearBtn.disabled = currentChoice === 'Não analisado' || !currentChoice;
        save.disabled = true;
        actions.append(cancel, clearBtn, review, save);
        dialog.append(title, summary, current, label, select, noteLabel, note,
            planTitle, effects, feedback, actions);
        layer.append(backdrop, dialog);
        doc.body.appendChild(layer);
        const previousFocus = input.trigger || doc.activeElement;
        let serial = 0, preview = null, confirmation = null, pending = false, committed = false;
        let uncertain = false, submittedNote = null;
        let candidatePendencyIds = [];
        const selectedPendencyIds = new Set();
        function close(force = false) {
            if ((pending || uncertain) && !force) return;
            layer.remove();
            previousFocus?.focus?.({ preventScroll: true });
        }
        function status(message, error = false) {
            feedback.textContent = message;
            feedback.dataset.status = error ? 'error' : 'info';
            feedback.setAttribute('role', error ? 'alert' : 'status');
        }
        function renderPlan(view) {
            effects.replaceChildren();
            const changes = Array.isArray(view.changes) ? view.changes : [];
            const warnings = Array.isArray(view.warnings) ? view.warnings : [];
            const blockers = Array.isArray(view.blockers) ? view.blockers : [];
            effects.appendChild(el(doc, 'p', '', changes.length
                ? changes.map(change => text(change.before) + ' → ' + text(change.after)).join(' · ')
                : 'Nenhuma outra análise será alterada.'));
            for (const item of [...warnings, ...blockers]) {
                effects.appendChild(el(doc, 'p', '', text(item?.message || item?.code || item)));
                if (item?.code === 'AMBIGUOUS_CONSEQUENCE' && Array.isArray(item.candidates)) {
                    candidatePendencyIds = item.candidates.map(text).filter(Boolean);
                }
                if (item?.code === 'OPEN_PENDENCY_FLOW_REQUIRED') {
                    const canOpenInvoicePendency = Boolean(
                        target.id && typeof root.openInvoiceDocumentPendencyModal === 'function'
                    );
                    const canOpenDocPendency = Boolean(
                        !target.id && typeof root.openNovaPendenciaModalWithDefaults === 'function'
                    );
                    if (canOpenInvoicePendency || canOpenDocPendency) {
                        const altBtn = el(
                            doc,
                            'button',
                            'btn btn-secondary btn-sm',
                            'Ir para abertura de Pendência'
                        );
                        altBtn.type = 'button';
                        altBtn.dataset.operationalCorrectionAlt = 'open-pendency';
                        altBtn.addEventListener('click', () => {
                            close();
                            if (canOpenInvoicePendency) {
                                root.openInvoiceDocumentPendencyModal(target.id, target.schoolId);
                            } else if (canOpenDocPendency) {
                                root.openNovaPendenciaModalWithDefaults(
                                    target.schoolId,
                                    `${target.competence}_${target.programId}`,
                                    context.programName || target.programId,
                                    target.documentKey,
                                    context.documentLabel || target.documentKey
                                );
                            }
                        });
                        effects.appendChild(altBtn);
                    }
                }
            }
            if (candidatePendencyIds.length > 0) {
                const group = el(doc, 'div', 'radar-operational-correction-candidates');
                group.setAttribute('role', 'group');
                group.setAttribute('aria-label', 'Pendências candidatas para exclusão');
                for (const candidateId of candidatePendencyIds) {
                    const row = el(doc, 'label', 'evaluation-retification-check');
                    const checkbox = el(doc, 'input', '');
                    checkbox.type = 'checkbox';
                    checkbox.value = candidateId;
                    checkbox.checked = selectedPendencyIds.has(candidateId);
                    checkbox.dataset.pendencyCandidateId = candidateId;
                    checkbox.disabled = uncertain || committed || pending;
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) selectedPendencyIds.add(candidateId);
                        else selectedPendencyIds.delete(candidateId);
                        void loadPreview();
                    });
                    const span = el(doc, 'span', '', `Excluir Pendência ${candidateId}`);
                    row.append(checkbox, span);
                    group.appendChild(row);
                }
                effects.appendChild(group);
            }
            if (view.removals?.length) effects.appendChild(el(doc, 'p', '', text(view.summary)));
        }
        async function loadPreview() {
            // Não criar uma nova operação enquanto o resultado anterior for incerto.
            if (uncertain || pending || committed) return;
            const generation = ++serial;
            preview = null;
            confirmation = null;
            save.disabled = true;
            clearBtn.disabled = uncertain || pending || committed
                || currentChoice === 'Não analisado' || !currentChoice
                || select.value === 'Não analisado';
            effects.textContent = 'Calculando o que vai mudar…';
            status('');
            try {
                const action = select.value === 'Não analisado'
                    ? 'clear_analysis' : 'correct_analysis';
                const result = await client.preview({
                    action,
                    target,
                    ...(action === 'correct_analysis' ? { changes: { analysis: select.value } } : {}),
                    ...(selectedPendencyIds.size > 0 ? { selectedPendencyIds: [...selectedPendencyIds] } : {})
                });
                if (generation !== serial || !layer.isConnected) return;
                preview = result;
                renderPlan(result.view);
                if (result.view.canApply) {
                    save.disabled = false;
                    if (action === 'clear_analysis') {
                        status('Análise pronta para ser limpa. Confira o que vai mudar acima e clique em Confirmar correção.', false);
                    }
                } else {
                    status('Ação pendente ou bloqueada. Confira os avisos acima antes de confirmar.', true);
                }
            } catch (error) {
                if (generation !== serial || !layer.isConnected) return;
                effects.textContent = '';
                status(error?.message || 'Não foi possível obter a prévia.', true);
            }
        }
        async function synchronizeConfirmed() {
            try {
                const refresher = root.RadarOperationalContextRefreshController;
                if (typeof refresher?.refreshSchool !== 'function') throw new Error('Sem recarga remota.');
                const result = await refresher.refreshSchool(target.schoolId,
                    'operational-correction', { force: true });
                if (result?.error || result?.skipped || result?.ok === false) {
                    throw new Error('Atualização da tela não confirmada.');
                }
                root.rebuildOperationalIndexes?.();
                root.renderProntuario?.(target.schoolId);
                close(true);
            } catch (_error) {
                status('A correção foi confirmada pelo servidor, mas a atualização da tela não foi verificada. Atualize a página; não repita a gravação.', true);
                save.disabled = true;
                clearBtn.disabled = true;
                review.disabled = true;
                select.disabled = true;
                note.disabled = true;
                const reload = el(doc, 'button', 'btn btn-primary', 'Atualizar página');
                reload.type = 'button';
                reload.addEventListener('click', () => root.location.reload());
                actions.appendChild(reload);
                reload.focus({ preventScroll: true });
            }
        }
        async function apply() {
            if (pending || committed || !preview?.view?.canApply) return;
            pending = true;
            save.disabled = true;
            cancel.disabled = true;
            clearBtn.disabled = true;
            review.disabled = true;
            select.disabled = true;
            note.disabled = true;
            try {
                if (!confirmation) confirmation = client.prepareConfirmation(preview);
                // Mesmo payload nas tentativas idempotentes após erro de rede.
                if (submittedNote === null) submittedNote = note.value;
                const receipt = await client.apply(confirmation, { note: submittedNote });
                if (receipt?.committed !== true) throw new Error('O servidor não confirmou a gravação.');
                committed = true;
                await synchronizeConfirmed();
            } catch (error) {
                if (error?.code === 'STALE_PLAN') {
                    confirmation = null;
                    preview = null;
                    submittedNote = null;
                    uncertain = false;
                    doc.getElementById('radar-operational-correction-reload')?.remove();
                    status('Os dados mudaram. Revise a prévia antes de confirmar.', true);
                } else {
                    uncertain = true;
                    status('Estado incerto: o servidor pode ter confirmado a gravação. Tente novamente com a mesma intenção ou atualize a página e confira o resultado antes de um novo lançamento.', true);
                    if (!doc.getElementById('radar-operational-correction-reload')) {
                        const reload = el(doc, 'button', 'btn btn-secondary', 'Atualizar página');
                        reload.id = 'radar-operational-correction-reload';
                        reload.type = 'button';
                        reload.addEventListener('click', () => root.location.reload());
                        actions.appendChild(reload);
                    }
                }
            } finally {
                pending = false;
                cancel.disabled = uncertain || committed;
                clearBtn.disabled = uncertain || committed
                    || currentChoice === 'Não analisado' || !currentChoice
                    || select.value === 'Não analisado';
                review.disabled = uncertain || committed;
                select.disabled = uncertain || committed;
                note.disabled = uncertain || committed;
                save.disabled = committed || !preview?.view?.canApply;
            }
        }
        cancel.addEventListener('click', () => close());
        clearBtn.addEventListener('click', () => {
            if (uncertain || pending || committed) return;
            select.value = 'Não analisado';
            void loadPreview();
        });
        backdrop.addEventListener('click', () => close());
        layer.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
            }
            if (event.key === 'Tab') {
                const controls = Array.from(dialog.querySelectorAll(
                    'button:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
                ));
                const first = controls[0], last = controls.at(-1);
                if (event.shiftKey && doc.activeElement === first) {
                    event.preventDefault(); last?.focus();
                } else if (!event.shiftKey && doc.activeElement === last) {
                    event.preventDefault(); first?.focus();
                }
            }
        });
        select.addEventListener('change', loadPreview);
        review.addEventListener('click', loadPreview);
        save.addEventListener('click', apply);
        select.focus({ preventScroll: true });
        void loadPreview();
        return true;
    }
    return Object.freeze({ ANALYSES, canUse, open });
}));
