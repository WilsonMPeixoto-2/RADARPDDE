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
        const mode = input.mode || 'analysis';
        const deleting = mode === 'delete_invoice' || mode === 'delete_pendency';
        if (!['analysis', 'delete_invoice', 'delete_pendency'].includes(mode)) return false;
        if (!canUse(root) || !context.schoolId || !context.competence
            || (!deleting && (!context.programId || !context.documentKey))
            || (deleting && !text(mode === 'delete_invoice' ? context.invoiceId : context.pendencyId))) return false;
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
        if (deleting) {
            target.id = text(mode === 'delete_invoice' ? context.invoiceId : context.pendencyId);
        } else if (context.invoiceId) {
            target.id = text(context.invoiceId);
        }
        const layer = el(doc, 'div', 'radar-operational-correction-layer evaluation-retification-modal-layer');
        layer.id = 'radar-operational-correction-layer';
        const backdrop = el(doc, 'div', 'radar-operational-correction-backdrop evaluation-retification-backdrop');
        const dialog = el(doc, 'section', 'radar-operational-correction-dialog evaluation-retification-dialog');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'radar-operational-correction-title');
        const title = el(doc, 'h2', '', deleting
            ? (mode === 'delete_invoice' ? 'Excluir nota fiscal' : 'Excluir pendência')
            : 'Corrigir análise técnica');
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
        const suggestedValue = text(input.suggestedValue);
        select.value = ANALYSES.includes(suggestedValue)
            ? suggestedValue
            : currentChoice !== 'Não analisado' && ANALYSES.includes(currentChoice)
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
        const save = el(doc, 'button', 'btn btn-primary',
            deleting ? 'Confirmar exclusão' : 'Confirmar correção');
        for (const button of [cancel, clearBtn, review, save]) button.type = 'button';
        clearBtn.disabled = currentChoice === 'Não analisado' || !currentChoice;
        save.disabled = true;
        actions.append(cancel);
        if (!deleting) actions.append(clearBtn);
        actions.append(review, save);
        dialog.append(title, summary);
        if (!deleting) dialog.append(current, label, select, noteLabel, note);
        dialog.append(planTitle, effects, feedback, actions);
        layer.append(backdrop, dialog);
        doc.body.appendChild(layer);
        const previousFocus = input.trigger || doc.activeElement;
        let serial = 0, preview = null, confirmation = null, pending = false, committed = false;
        let uncertain = false, submittedNote = null;
        let candidatePendencyIds = [];
        const selectedPendencyIds = new Set();
        function close(force = false, restoreFocus = true) {
            if ((pending || uncertain) && !force) return;
            layer.remove();
            // Ao confirmar, não devolver foco a um <input>/<select> antes do
            // refresh: o controlador interpreta isso como edição em curso.
            if (restoreFocus && previousFocus?.isConnected) {
                previousFocus.focus?.({ preventScroll: true });
            }
        }
        function status(message, error = false) {
            feedback.textContent = message;
            feedback.dataset.status = error ? 'error' : 'info';
            feedback.setAttribute('role', error ? 'alert' : 'status');
        }
        function renderPlan(view) {
            effects.replaceChildren();
            candidatePendencyIds = [];
            const changes = Array.isArray(view.changes) ? view.changes : [];
            const warnings = Array.isArray(view.warnings) ? view.warnings : [];
            const blockers = Array.isArray(view.blockers) ? view.blockers : [];
            if (deleting) {
                effects.appendChild(el(doc, 'p', '', text(view.summary)));
                if (view.preserved?.bonusResult) {
                    effects.appendChild(el(doc, 'p', '',
                        'O resultado da bonificação já consolidada será preservado.'));
                }
                if (view.preserved?.sharedAssetId) {
                    effects.appendChild(el(doc, 'p', '',
                        'O bem vinculado a outra nota fiscal será preservado.'));
                }
            }
            effects.appendChild(el(doc, 'p', '', changes.length
                ? (deleting ? 'Informações relacionadas também serão atualizadas: ' : '')
                    + changes.map(change => text(change.before) + ' → ' + text(change.after)).join(' · ')
                : (deleting ? 'Nenhuma outra informação será alterada.' : 'Nenhuma outra análise será alterada.')));
            for (const item of [...warnings, ...blockers]) {
                effects.appendChild(el(doc, 'p', '', text(item?.message || item?.code || item)));
                if (['AMBIGUOUS_CONSEQUENCE', 'INCOMPLETE_PENDENCY_SELECTION'].includes(item?.code)
                    && Array.isArray(item.candidates)) {
                    candidatePendencyIds = item.candidates.map(text).filter(Boolean);
                }
                if (item?.code === 'OPEN_PENDENCY_FLOW_REQUIRED') {
                    const canOpenInvoicePendency = Boolean(
                        target.id && target.documentKey === 'notaFiscal'
                        && typeof root.openInvoiceDocumentPendencyModal === 'function'
                    );
                    const canOpenAdvisoryPendency = Boolean(
                        target.id && target.documentKey === 'consAssessoria'
                        && typeof root.changeInvoiceAdvisoryAnalysis === 'function'
                    );
                    const canOpenDocPendency = Boolean(
                        !target.id && typeof root.openNovaPendenciaModalWithDefaults === 'function'
                    );
                    if (canOpenInvoicePendency || canOpenAdvisoryPendency || canOpenDocPendency) {
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
                            } else if (canOpenAdvisoryPendency) {
                                void root.changeInvoiceAdvisoryAnalysis(target.id, target.schoolId, 'Incorreto');
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
                if (item?.code === 'MANDATORY_PENDENCY' && mode === 'delete_pendency'
                    && text(context.linkedInvoiceId)
                    && typeof root.removerNotaRegistrada === 'function') {
                    const guidance = el(doc, 'button', 'btn btn-secondary btn-sm',
                        'Excluir despesa e Pendência juntas');
                    guidance.type = 'button';
                    guidance.dataset.operationalCorrectionAlt = 'delete-linked-invoice';
                    guidance.addEventListener('click', () => {
                        close();
                        root.removerNotaRegistrada(text(context.linkedInvoiceId), target.schoolId);
                    });
                    effects.appendChild(guidance);
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
            if (!deleting && view.removals?.length) effects.appendChild(el(doc, 'p', '', text(view.summary)));
        }
        async function loadPreview() {
            // Não criar uma nova operação enquanto o resultado anterior for incerto.
            if (uncertain || pending || committed) return;
            const generation = ++serial;
            preview = null;
            confirmation = null;
            save.disabled = true;
            clearBtn.disabled = deleting || uncertain || pending || committed
                || currentChoice === 'Não analisado' || !currentChoice
                || select.value === 'Não analisado';
            effects.textContent = 'Calculando o que vai mudar…';
            status('');
            try {
                const action = deleting ? mode : select.value === 'Não analisado'
                    ? 'clear_analysis' : 'correct_analysis';
                const result = await client.preview({
                    action,
                    target,
                    ...(action === 'correct_analysis' ? { changes: { analysis: select.value } } : {}),
                    ...(selectedPendencyIds.size > 0 && !deleting
                        ? { selectedPendencyIds: [...selectedPendencyIds] } : {})
                });
                if (generation !== serial || !layer.isConnected) return;
                preview = result;
                renderPlan(result.view);
                if (result.view.canApply) {
                    save.disabled = false;
                    if (action === 'clear_analysis') {
                        status('Análise pronta para ser limpa. Confira o que vai mudar acima e clique em Confirmar correção.', false);
                    } else if (deleting) {
                        status('Confira quais registros serão excluídos e clique em Confirmar exclusão.', false);
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
            // A recarga canônica é suspensa quando existe qualquer modal ativo
            // ou um formulário focado. Fechar sem restaurar o foco ANTES do
            // refresh evita que o próprio diálogo/formulário seja o bloqueio.
            close(true, false);
            try {
                const refresher = root.RadarOperationalContextRefreshController;
                if (typeof refresher?.refreshSchool !== 'function') throw new Error('Recarga indisponível.');
                const result = await refresher.refreshSchool(target.schoolId,
                    'operational-correction', { force: true });
                if (result?.error || result?.skipped || result?.ok === false) {
                    throw new Error('A tela não foi sincronizada.');
                }
                root.rebuildOperationalIndexes?.();
                root.renderProntuario?.(target.schoolId);
                root.updateAlertsBell?.();
                root.RadarSharedInteractions?.notify?.({
                    type: 'success',
                    message: deleting ? 'Exclusão confirmada. Os registros relacionados foram atualizados.'
                        : 'Correção confirmada e informações atualizadas.'
                });
            } catch (_error) {
                // A gravação já foi confirmada: jamais executar apply novamente.
                root.RadarSharedInteractions?.notify?.({
                    type: 'warning',
                    message: 'A alteração foi gravada, mas não foi possível atualizar a tela. Recarregue a página para conferir. Não repita a operação.'
                });
                const notice = el(doc, 'div', 'radar-operational-refresh-notice');
                notice.setAttribute('role', 'alert');
                notice.appendChild(el(doc, 'span', '',
                    'Alteração gravada. Atualize a página para conferir o resultado.'));
                const reload = el(doc, 'button', 'btn btn-secondary btn-sm', 'Atualizar página');
                reload.type = 'button';
                reload.addEventListener('click', () => root.location.reload());
                notice.appendChild(reload);
                doc.body.appendChild(notice);
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
                clearBtn.disabled = deleting || uncertain || committed
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
        if (!deleting) select.addEventListener('change', loadPreview);
        review.addEventListener('click', loadPreview);
        save.addEventListener('click', apply);
        (deleting ? review : select).focus({ preventScroll: true });
        void loadPreview();
        return true;
    }
    return Object.freeze({ ANALYSES, canUse, open });
}));
