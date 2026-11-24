(function installOperationalCorrectionDialog(root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarOperationalCorrectionDialog = api;
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalCorrectionDialog() {
    'use strict';

    const ANALYSES = ['Correto', 'Correto (Atrasado)', 'Incorreto', 'Não analisado'];
    const EFFECT_LABELS = {
        'payload.analiseDocumentoFiscal': 'Análise da nota fiscal',
        'analysis.notaFiscal': 'Resumo das notas fiscais do programa',
        'payload.analiseConsultaAssessoria': 'Consulta à Assessoria da nota fiscal',
        'analysis.consAssessoria': 'Resumo da Assessoria do programa',
        'bonification.consAssessoria': 'Entrega da consulta à Assessoria',
        'bonification.consEnviada': 'Envio da consulta à Assessoria',
        'bonification.encampInventario': 'Entrega do encaminhamento ao Inventário',
        'analysis.encampInventario': 'Análise do encaminhamento ao Inventário'
    };
    const text = value => value == null ? '' : String(value).trim();
    const el = (doc, tag, className, value) => {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    };
    // A ajuda complementa o rótulo: leitura por tecnologia assistiva e tooltip
    // ao passar o mouse ou chegar ao botão pelo teclado, sem executar a ação.
    function actionHelp(button, description) {
        button.classList.add('radar-action-help');
        button.setAttribute('data-tooltip', description);
        button.setAttribute('aria-description', description);
        return button;
    }
    // Design da informação: escopo identificado, quantidades reais e proteção
    // visualmente distinta. A lista completa de registros continua no DOM.
    function scopeFields(doc, entries) {
        const scope = el(doc, 'dl', 'correction-scope-fields');
        for (const [label, value] of entries) {
            if (!text(value)) continue;
            const field = el(doc, 'div', 'correction-scope-field');
            field.append(el(doc, 'dt', '', label), el(doc, 'dd', '', value));
            scope.appendChild(field);
        }
        return scope;
    }
    function impactTiles(doc, removals) {
        const list = el(doc, 'ul', 'context-deletion-impact-list correction-impact-tiles');
        list.setAttribute('aria-label', 'Quantidades de registros a excluir');
        for (const item of removals) {
            const count = Array.isArray(item.ids) ? item.ids.length : 0;
            if (!count) continue;
            const cell = el(doc, 'li', 'correction-impact-tile');
            const name = text(item.label).replace(/^\d+\s+/, '');
            cell.dataset.entity = text(item.entity);
            cell.append(el(doc, 'strong', 'correction-impact-count', String(count)),
                doc.createTextNode(' '), el(doc, 'span', 'correction-impact-name', name));
            list.appendChild(cell);
        }
        return list;
    }
    function preservationPanel(doc, description) {
        const panel = el(doc, 'section', 'correction-preservation-panel');
        const heading = el(doc, 'h4', 'correction-panel-heading');
        const icon = el(doc, 'span', 'correction-preservation-icon', '✓');
        icon.setAttribute('aria-hidden', 'true');
        heading.append(icon, el(doc, 'span', '', 'O que será preservado'));
        panel.append(heading, el(doc, 'p', 'context-deletion-preserved', description));
        return panel;
    }
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
    function canCorrectFiscalBonus(root) {
        const features = root?.RADAR_PDDE_CONFIG?.features;
        return canUse(root) && (
            features?.operationalCorrectionPilot === true
            || (features?.operationalCorrectionRelease === true
                && features?.bonificationCorrectionRelease === true)
        );
    }
    function canDeleteContext(root) {
        if (!canUse(root)) return false;
        const features = root?.RADAR_PDDE_CONFIG?.features;
        const localPilot = root?.RADAR_T4_CONTEXT_DELETION_PILOT === true
            && features?.operationalCorrectionPilot === true
            && ['localhost', '127.0.0.1'].includes(root?.location?.hostname)
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget !== 'production';
        const productionRelease = features?.contextDeletionRelease === true
            && features?.bonificationCorrectionRelease === true
            && features?.operationalCorrectionRelease === true
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget === 'production'
            && root?.location?.protocol === 'https:';
        return localPilot || productionRelease;
    }
    function canClearHistory(root) {
        if (!canUse(root)) return false;
        const features = root?.RADAR_PDDE_CONFIG?.features;
        const localPilot = root?.RADAR_T4_ITEM_HISTORY_PILOT === true
            && features?.operationalCorrectionPilot === true
            && ['localhost', '127.0.0.1'].includes(root?.location?.hostname)
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget !== 'production';
        const productionRelease = features?.itemHistoryRelease === true
            && canDeleteContext(root)
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget === 'production'
            && root?.location?.protocol === 'https:';
        return localPilot || productionRelease;
    }
    function open(root, input = {}) {
        const context = input.context || {};
        const mode = input.mode || 'analysis';
        const contextDeletion = mode === 'delete_context';
        const historyDeletion = mode === 'clear_item_history';
        const deleting = contextDeletion || historyDeletion || mode === 'delete_invoice' || mode === 'delete_pendency';
        const bonus = mode === 'correct_bonification';
        if (bonus && !canCorrectFiscalBonus(root)) return false;
        if (contextDeletion && !canDeleteContext(root)) return false;
        if (historyDeletion && !canClearHistory(root)) return false;
        if (!bonus && !['analysis', 'delete_invoice', 'delete_pendency', 'delete_context', 'clear_item_history'].includes(mode)) return false;
        if (!canUse(root) || !context.schoolId || !context.competence
            || (contextDeletion && !context.programId)
            || (!deleting && (!context.programId || !context.documentKey))
            || (historyDeletion && (!context.programId || !context.documentKey
                || (['notaFiscal', 'consAssessoria'].includes(context.documentKey) && !text(context.invoiceId))))
            || (deleting && !contextDeletion && !historyDeletion
                && !text(mode === 'delete_invoice' ? context.invoiceId : context.pendencyId))) return false;
        const doc = root.document;
        if (doc.getElementById('radar-operational-correction-layer')) return true;
        const client = root.RadarOperationalCorrectionClient.createOperationalCorrectionClient({
            repository: repositoryOf(root)
        });
        const target = contextDeletion ? {
            kind: 'program_context',
            schoolId: context.schoolId,
            competence: context.competence,
            programId: context.programId
        } : {
            ...(historyDeletion ? { kind: 'analysis' } : {}),
            schoolId: context.schoolId,
            competence: context.competence,
            programId: context.programId,
            documentKey: context.documentKey
        };
        if (deleting && !contextDeletion && !historyDeletion) {
            target.id = text(mode === 'delete_invoice' ? context.invoiceId : context.pendencyId);
        } else if (!contextDeletion && context.invoiceId) {
            target.id = text(context.invoiceId);
        }
        const layer = el(doc, 'div', 'radar-operational-correction-layer evaluation-retification-modal-layer');
        layer.id = 'radar-operational-correction-layer';
        const backdrop = el(doc, 'div', 'radar-operational-correction-backdrop evaluation-retification-backdrop');
        const dialog = el(doc, 'section', 'radar-operational-correction-dialog evaluation-retification-dialog');
        if (bonus) dialog.classList.add('is-fiscal-bonus');
        if (contextDeletion) dialog.classList.add('is-context-deletion');
        if (historyDeletion) dialog.classList.add('is-item-history');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'radar-operational-correction-title');
        const header = el(doc, 'header', 'radar-operational-correction-header');
        const kicker = el(doc, 'span', 'evaluation-retification-kicker',
            contextDeletion ? 'Exclusão de lançamentos' : historyDeletion ? 'Limpeza de histórico' : bonus ? 'Avaliação de Notas Fiscais'
                : deleting ? (mode === 'delete_invoice' ? 'Exclusão de nota fiscal' : 'Exclusão de pendência')
                    : 'Correção operacional');
        const title = el(doc, 'h2', '', contextDeletion ? 'Excluir lançamentos deste programa neste mês' : historyDeletion
            ? 'Limpar todo o histórico deste item' : deleting
            ? (mode === 'delete_invoice' ? 'Excluir nota fiscal' : 'Excluir pendência')
            : bonus ? 'Corrigir consolidação da bonificação' : 'Corrigir análise técnica');
        title.id = 'radar-operational-correction-title';
        const summary = el(doc, 'p', '', [
            context.schoolName || (bonus || contextDeletion || historyDeletion ? context.schoolId : ''),
            context.programName || (bonus || contextDeletion || historyDeletion ? context.programId : ''),
            context.competenceLabel || context.competence,
            ...(!bonus && !contextDeletion ? [context.documentLabel || context.documentKey] : [])
        ].filter(Boolean).join(' · '));
        header.append(kicker, title);
        if (contextDeletion || historyDeletion) {
            header.appendChild(scopeFields(doc, [
                ['Escola', context.schoolName || context.schoolId],
                ['Mês de referência', context.competenceLabel || context.competence],
                ['Programa', context.programName || context.programId],
                ...(historyDeletion ? [['Documento', context.documentLabel || context.documentKey]] : [])
            ]));
            const caution = el(doc, 'div', 'correction-caution');
            const mark = el(doc, 'span', 'correction-caution-icon', '!');
            mark.setAttribute('aria-hidden', 'true');
            const message = el(doc, 'div', 'correction-caution-copy');
            message.append(el(doc, 'strong', '', 'Exclusão definitiva no Prontuário'),
                el(doc, 'p', '', contextDeletion
                    ? 'Você vai excluir os registros listados abaixo.'
                    : 'A avaliação atual e o histórico deste item serão removidos.'));
            caution.append(mark, message);
            header.appendChild(caution);
        } else {
            header.appendChild(summary);
        }
        if (deleting && !contextDeletion && !historyDeletion) {
            header.appendChild(el(doc, 'p', 'context-deletion-explanation',
                'Confira os registros e vínculos que serão excluídos. A exclusão só será realizada depois da sua confirmação.'));
        }
        if (!deleting && !bonus) {
            header.appendChild(el(doc, 'p', 'correction-confirmation-hint',
                'Escolha o resultado e confira os efeitos. Nada será gravado antes da confirmação.'));
        }
        if (bonus) {
            const explanation = el(doc, 'p', 'fiscal-bonus-explanation',
                'Nesta etapa, você pode corrigir apenas a avaliação de Notas Fiscais. '
                + 'Se a bonificação já tiver sido consolidada, ao confirmar a alteração '
                + 'o programa ficará com Alterações pendentes de consolidação até '
                + 'você utilizar Consolidar bonificação.');
            header.appendChild(explanation);
        }
        const current = el(doc, 'p', 'radar-operational-correction-current', bonus
            ? 'Avaliação atual: ' + text(input.currentValue || 'Não preenchida')
            : 'Resultado atual: ' + text(input.currentValue || 'Não analisado'));
        const label = el(doc, 'label', '', bonus ? 'Nova avaliação — Notas Fiscais' : 'Novo resultado');
        label.htmlFor = 'radar-operational-correction-select';
        const select = el(doc, 'select', 'form-control');
        select.id = 'radar-operational-correction-select';
        const choices = bonus ? ['', 'Sim', 'Não', 'Não se aplica', 'Limpar resposta'] : ANALYSES;
        for (const choice of choices) {
            const option = el(doc, 'option', '', choice || 'Escolha uma opção');
            option.value = choice;
            if (bonus) option.disabled = !choice || choice === input.currentValue
                || (choice === 'Limpar resposta' && !input.currentValue);
            select.appendChild(option);
        }
        // Preserva a sugestão inicial de "Correto" quando ainda não há análise;
        // "Não analisado" permanece disponível para limpeza deliberada.
        const currentChoice = text(input.currentValue);
        const suggestedValue = text(input.suggestedValue);
        select.value = bonus ? '' : ANALYSES.includes(suggestedValue)
            ? suggestedValue
            : currentChoice !== 'Não analisado' && ANALYSES.includes(currentChoice)
                ? currentChoice : 'Correto';
        const noteLabel = el(doc, 'label', '', 'Observação (opcional)');
        noteLabel.htmlFor = 'radar-operational-correction-note';
        const note = el(doc, 'textarea', 'form-control');
        note.id = 'radar-operational-correction-note';
        note.maxLength = 2000;
        note.rows = 3;
        const planTitle = el(doc, 'h3', '', deleting ? 'Confira o que será excluído' : 'O que vai mudar ao confirmar');
        const effects = el(doc, 'div', 'radar-operational-correction-effects', 'Calculando o que vai mudar…');
        effects.setAttribute('aria-live', 'polite');
        const feedback = el(doc, 'p', 'radar-operational-correction-feedback');
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        const actions = el(doc, 'div', 'radar-operational-correction-actions');
        const cancel = el(doc, 'button', 'btn btn-secondary', 'Cancelar');
        const clearBtn = el(doc, 'button', 'btn btn-secondary', 'Limpar análise');
        const review = el(doc, 'button', 'btn btn-secondary',
            contextDeletion || historyDeletion ? 'Conferir novamente' : 'Revisar prévia');
        const save = el(doc, 'button', contextDeletion || historyDeletion ? 'btn btn-danger' : 'btn btn-primary',
            contextDeletion ? 'Excluir estes lançamentos' : historyDeletion ? 'Limpar histórico deste item'
                : deleting ? 'Confirmar exclusão' : 'Confirmar correção');
        for (const button of [cancel, clearBtn, review, save]) button.type = 'button';
        actionHelp(cancel, 'Fecha esta janela sem alterar os registros.');
        actionHelp(clearBtn, 'Prepara o resultado Não analisado. Confira os efeitos antes de confirmar.');
        actionHelp(review, 'Consulta novamente os efeitos. Este botão não exclui nem grava registros.');
        actionHelp(save, contextDeletion
            ? 'Exclui os registros conferidos deste mês e programa. Não transfere lançamentos.'
            : historyDeletion
                ? 'Remove a avaliação e as Pendências listadas; preserva a despesa e os registros independentes.'
                : mode === 'delete_invoice'
                    ? 'Exclui a despesa selecionada e os vínculos indicados na prévia.'
                    : mode === 'delete_pendency'
                        ? 'Exclui a Pendência selecionada e os vínculos indicados na prévia.'
                        : bonus
                            ? 'Grava a nova avaliação de Notas Fiscais. Se necessário, consolide a bonificação novamente.'
                            : 'Grava o resultado e os efeitos indicados na prévia.');
        (deleting ? cancel : select).autofocus = true;
        clearBtn.disabled = currentChoice === 'Não analisado' || !currentChoice;
        save.disabled = true;
        actions.append(cancel);
        if (!deleting && !bonus) actions.append(clearBtn);
        if (bonus) review.hidden = true;
        actions.append(review, save);
        const bodyGrid = el(doc, 'div', deleting
            ? 'radar-operational-correction-body is-single'
            : 'radar-operational-correction-body is-split');
        const effectsCol = el(doc, 'aside', 'radar-operational-correction-preview-col');
        effectsCol.append(planTitle, effects);
        if (!deleting) {
            const inputsCol = el(doc, 'div', 'radar-operational-correction-inputs-col');
            if (bonus) {
                inputsCol.append(current, label, select);
                const optionalNote = el(doc, 'details', 'fiscal-bonus-note');
                const toggle = el(doc, 'summary', '', 'Adicionar observação');
                optionalNote.append(toggle, noteLabel, note);
                inputsCol.appendChild(optionalNote);
            } else {
                inputsCol.append(label, select, current, noteLabel, note);
            }
            bodyGrid.append(inputsCol, effectsCol);
        } else {
            bodyGrid.append(effectsCol);
        }
        dialog.append(header, bodyGrid, feedback, actions);
        layer.append(backdrop, dialog);
        doc.body.appendChild(layer);
        const inertSiblings = [];
        for (const sibling of Array.from(doc.body?.children || [])) {
            if (sibling !== layer && 'inert' in sibling && !sibling.inert) {
                sibling.inert = true;
                inertSiblings.push(sibling);
            }
        }
        const previousFocus = input.trigger || doc.activeElement;
        let serial = 0, preview = null, confirmation = null, pending = false, committed = false;
        let uncertain = false, submittedNote = null;
        let candidatePendencyIds = [];
        const selectedPendencyIds = new Set();
        function close(force = false, restoreFocus = true) {
            if ((pending || uncertain) && !force) return;
            layer.remove();
            while (inertSiblings.length > 0) {
                inertSiblings.pop().inert = false;
            }
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
            const changes = Array.isArray(view.changes) ? view.changes : [];
            const warnings = Array.isArray(view.warnings) ? view.warnings : [];
            const blockers = Array.isArray(view.blockers) ? view.blockers : [];
            if (deleting) {
                if (contextDeletion) {
                    const removals = Array.isArray(view.removals) ? view.removals : [];
                    if (removals.length) {
                        effects.appendChild(impactTiles(doc, removals));
                    } else {
                        effects.appendChild(el(doc, 'p', '', 'Nenhum registro foi encontrado para excluir.'));
                    }
                    effects.appendChild(preservationPanel(doc,
                        'Outros meses e programas, contatos gerais e registros fora desta seleção.'));
                    const next = el(doc, 'p', 'correction-next-step',
                        'Os lançamentos não serão transferidos automaticamente. Para registrar no lugar correto, faça um novo lançamento.');
                    effects.appendChild(next);
                    // A confirmação não depende de IDs técnicos: mostre ao
                    // Controlador os documentos reais de cada parte do conjunto.
                    const records = view.affectedRecords || {};
                    const documentNames = {
                        notaFiscal: 'Nota fiscal',
                        extCC: 'Extrato da conta corrente',
                        extCI: 'Extrato de investimentos',
                        extINV: 'Extrato de investimentos',
                        consAssessoria: 'Consulta à assessoria',
                        boletoInternet: 'Boleto de pagamento de Internet',
                        declBBAgil: 'Declaração BB Ágil',
                        encampInventario: 'Encaminhamento para inventariação'
                    };
                    const makeDetails = (heading, entries) => {
                        if (!Array.isArray(entries) || entries.length === 0) return null;
                        const section = el(doc, 'section', 'context-deletion-details');
                        section.appendChild(el(doc, 'h4', '', heading));
                        const list = el(doc, 'ul', 'context-deletion-records');
                        for (const entry of entries) list.appendChild(el(doc, 'li', '', entry));
                        section.appendChild(list);
                        return section;
                    };
                    const invoices = (records.invoices || []).map(invoice => {
                        const expenseType = text(invoice.expenseType).toLocaleLowerCase('pt-BR');
                        const number = text(invoice.invoiceNumber);
                        const label = expenseType === 'a_identificar'
                            ? 'Despesa a identificar'
                            : expenseType === 'boleto_internet'
                                ? (number ? 'Boleto Internet ' + number : 'Boleto Internet sem número')
                                : 'NF ' + (number || 'sem número');
                        const description = text(invoice.description);
                        const amount = invoice.amount == null || !Number.isFinite(Number(invoice.amount))
                            ? '' : new Intl.NumberFormat('pt-BR', {
                                style: 'currency', currency: 'BRL'
                            }).format(Number(invoice.amount));
                        return [label, description, amount].filter(Boolean).join(' · ');
                    });
                    const invoiceDetails = makeDetails('Notas fiscais', invoices);
                    if (invoiceDetails) effects.appendChild(invoiceDetails);
                    const pendencies = (records.pendencies || []).map(item => {
                        const document = documentNames[item.documentKey]
                            || text(item.documentKey) || 'Documento não informado';
                        return 'Pendência: ' + document + (text(item.status) ? ' · ' + text(item.status) : '');
                    });
                    const pendencyDetails = makeDetails('Pendências', pendencies);
                    if (pendencyDetails) effects.appendChild(pendencyDetails);
                    const assets = (records.assets || []).map(item => [
                        text(item.description) || 'Bem sem descrição',
                        text(item.status)
                    ].filter(Boolean).join(' · '));
                    const assetDetails = makeDetails('Bens vinculados', assets);
                    if (assetDetails) effects.appendChild(assetDetails);

                } else if (historyDeletion) {
                    const records = view.affectedRecords || {};
                    const removals = Array.isArray(view.removals) ? view.removals : [];
                    if (removals.length) effects.appendChild(impactTiles(doc, removals));
                    else effects.appendChild(el(doc, 'p', '', text(view.summary)));
                    effects.appendChild(preservationPanel(doc,
                        'Notas fiscais, bens, outros documentos, programas, bonificação, contatos gerais e registros administrativos de auditoria.'));
                    const documentNames = {
                        extCC: 'Extrato da conta corrente', extCI: 'Extrato de investimentos',
                        extINV: 'Extrato de investimentos', notaFiscal: 'Nota fiscal',
                        consAssessoria: 'Consulta à Assessoria', boletoInternet: 'Boleto de Internet',
                        declBBAgil: 'Declaração BB Ágil', encampInventario: 'Encaminhamento para inventariação'
                    };
                    const contactNames = { email: 'E-mail', telefone: 'Telefone', whatsapp: 'WhatsApp', presencial: 'Presencial' };
                    const historyPendencies = records.pendencies || [];
                    const pendencyLabels = new Map(historyPendencies.map((item, index) => [text(item.id),
                        'Pendência ' + (index + 1) + (text(item.status) ? ' (' + text(item.status) + ')' : '')]));
                    const historyReference = item => pendencyLabels.get(text(item.pendencyId)) || 'Pendência vinculada';
                    const rows = [
                        ['Pendências — inclusive resolvidas e canceladas', historyPendencies,
                            item => [pendencyLabels.get(text(item.id)), documentNames[item.documentKey]
                                || text(context.documentLabel) || 'Documento selecionado'].filter(Boolean).join(' · ')],
                        ['Envios documentais vinculados', records.attempts || [],
                            item => ['Envio', item.attemptNumber ? 'tentativa ' + item.attemptNumber : '',
                                historyReference(item)].filter(Boolean).join(' · ')],
                        ['Contatos vinculados às Pendências', records.contacts || [],
                            item => [contactNames[text(item.contactType).toLowerCase()] || text(item.contactType) || 'Contato',
                                text(item.description), historyReference(item)].filter(Boolean).join(' · ')]
                    ];
                    for (const [heading, entries, format] of rows) {
                        if (!Array.isArray(entries) || entries.length === 0) continue;
                        const section = el(doc, 'section', 'context-deletion-details item-history-detail');
                        section.appendChild(el(doc, 'h4', '', heading + ' (' + entries.length + ')'));
                        const list = el(doc, 'ul', 'context-deletion-records');
                        for (const entry of entries) {
                            const row = el(doc, 'li', '', format(entry));
                            // Referência estável para a auditoria, sem poluir a leitura principal.
                            if (entry.id) row.setAttribute('title', 'Referência do registro: ' + text(entry.id));
                            list.appendChild(row);
                        }
                        section.appendChild(list);
                        effects.appendChild(section);
                    }

                } else {
                    effects.appendChild(el(doc, 'p', '', text(view.summary)));
                }
                if (view.preserved?.bonusResult && !historyDeletion) {
                    effects.appendChild(el(doc, 'p', '',
                        'O resultado da bonificação já consolidada será preservado.'));
                }
                if (view.preserved?.sharedAssetId) {
                    effects.appendChild(el(doc, 'p', '',
                        'O bem vinculado a outra nota fiscal será preservado.'));
                }
            }
            if (!changes.length && !contextDeletion) {
                effects.appendChild(el(doc, 'p', '', deleting
                    ? 'Nenhuma outra informação será alterada.' : 'Nenhuma outra análise será alterada.'));
            }
            if (bonus) {
                for (const change of changes) {
                    if (change.field === 'bonification.notaFiscal') {
                        const pair = el(doc, 'div', 'fiscal-bonus-transition');
                        pair.append(el(doc, 'span', '', change.before), el(doc, 'span', 'fiscal-bonus-arrow', '→'),
                            el(doc, 'strong', '', change.after));
                        effects.appendChild(pair);
                    } else if (change.field === 'bonus_result') {
                        effects.appendChild(el(doc, 'p', '', 'O resultado ' + text(change.before).toLocaleUpperCase('pt-BR')
                            + ' deste programa será reaberto para consolidação.'));
                    }
                }
                effects.appendChild(el(doc, 'p', 'fiscal-bonus-preserved',
                    'As notas fiscais, as análises individuais e as pendências serão preservadas.'));
                for (const item of [...warnings, ...blockers]) effects.appendChild(el(doc, 'p', '', text(item.message || item.code)));
                return;
            }
            const transitions = new Map();
            let reopenedProvisionalCount = 0;
            for (const change of changes) {
                if (change.entity === 'quality_provisional_movements' && change.field === 'status'
                    && change.before === 'identified' && change.after === 'open') {
                    reopenedProvisionalCount += 1;
                    continue;
                }
                if (text(change.before) === 'Não analisado' && text(change.after) === 'Não analisado') continue;
                const valueChange = text(change.before) + ' → ' + text(change.after);
                if (!transitions.has(valueChange)) transitions.set(valueChange, new Set());
                const fieldLabel = EFFECT_LABELS[change.field] || context.documentLabel;
                if (fieldLabel) transitions.get(valueChange).add(fieldLabel);
            }
            if (reopenedProvisionalCount === 1) {
                effects.appendChild(el(doc, 'p', '',
                    'A saída provisória do PDDE Qualidade voltará para “Programa a identificar” e poderá ser identificada novamente.'));
            } else if (reopenedProvisionalCount > 1) {
                effects.appendChild(el(doc, 'p', '',
                    reopenedProvisionalCount + ' saídas provisórias do PDDE Qualidade voltarão para “Programa a identificar” e poderão ser identificadas novamente.'));
            }
            for (const [valueChange, labels] of transitions) {
                const scope = [...labels].join(' / ');
                if (contextDeletion || historyDeletion) {
                    const transition = el(doc, 'div', 'correction-effect-transition');
                    if (scope) transition.appendChild(el(doc, 'span', 'correction-effect-label', scope));
                    transition.appendChild(el(doc, 'strong', '', valueChange));
                    effects.appendChild(transition);
                } else {
                    effects.appendChild(el(doc, 'p', '', scope ? scope + ' — ' + valueChange : valueChange));
                }
            }
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
                        actionHelp(altBtn, 'Abre o formulário de Pendência deste item. Nada é gravado nesta etapa.');
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
                if (item?.code === 'MANDATORY_ANALYSIS' && target.id
                    && typeof root.removerNotaRegistrada === 'function') {
                    const action = el(doc, 'button', 'btn btn-secondary btn-sm',
                        'Excluir despesa lançada por engano');
                    action.type = 'button';
                    actionHelp(action, 'Abre a conferência de exclusão da despesa. Você ainda precisará confirmar.');
                    action.dataset.operationalCorrectionAlt = 'delete-invoice-instead';
                    action.addEventListener('click', () => {
                        close();
                        root.removerNotaRegistrada(target.id, target.schoolId);
                    });
                    effects.appendChild(action);
                }
                if (item?.code === 'MANDATORY_PENDENCY' && mode === 'delete_pendency'
                    && text(context.linkedInvoiceId)
                    && typeof root.removerNotaRegistrada === 'function') {
                    const guidance = el(doc, 'button', 'btn btn-secondary btn-sm',
                        'Excluir despesa e Pendência juntas');
                    guidance.type = 'button';
                    actionHelp(guidance, 'Abre a conferência da despesa e dos registros vinculados antes de excluir.');
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
                if (bonus && !select.value) {
                    effects.textContent = 'Escolha a nova avaliação para conferir o efeito neste programa.';
                    return;
                }
                const action = bonus || deleting ? mode : select.value === 'Não analisado'
                    ? 'clear_analysis' : 'correct_analysis';
                const result = await client.preview({
                    action,
                    target,
                    ...(bonus ? { changes: { bonificacao: select.value === 'Limpar resposta' ? null : select.value } } : {}),
                    ...(action === 'correct_analysis' ? { changes: { analysis: select.value } } : {}),
                    ...(selectedPendencyIds.size > 0 && !deleting
                        ? { selectedPendencyIds: [...selectedPendencyIds] } : {})
                });
                if (generation !== serial || !layer.isConnected) return;
                if (bonus) review.hidden = true;
                preview = result;
                renderPlan(result.view);
                if (action === 'correct_analysis') {
                    actionHelp(save, 'Grava o novo resultado da análise técnica e os efeitos indicados na prévia.');
                }
                if (result.view.canApply) {
                    save.disabled = false;
                    if (action === 'clear_analysis') {
                        actionHelp(save, 'Define a análise como Não analisado e aplica apenas os efeitos mostrados na prévia.');
                        status('Análise pronta para ser limpa. Confira o que vai mudar acima e clique em Confirmar correção.', false);
                    } else if (contextDeletion) {
                        status('Prévia pronta. Confira antes de excluir.', false);
                    } else if (historyDeletion) {
                        status('Prévia pronta. Confira antes de limpar.', false);
                    } else if (deleting) {
                        status('Confira quais registros serão excluídos e clique em Confirmar exclusão.', false);
                    }
                } else {
                    status(contextDeletion
                        ? 'Não é possível excluir esses lançamentos agora. Confira o motivo acima.'
                        : historyDeletion
                            ? 'Não é possível limpar este histórico agora. Confira o motivo acima.'
                            : 'Ação pendente ou bloqueada. Confira os avisos acima antes de confirmar.', true);
                }
            } catch (error) {
                if (generation !== serial || !layer.isConnected) return;
                if (bonus) review.hidden = false;
                effects.textContent = '';
                status(contextDeletion
                    ? 'Não foi possível conferir os lançamentos. Nada foi excluído. Tente novamente.'
                    : error?.message || 'Não foi possível obter a prévia.', true);
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
                if (doc?.querySelector?.('.pendency-page-header') && typeof root.renderPendencias === 'function') {
                    root.renderPendencias();
                } else {
                    root.renderProntuario?.(target.schoolId);
                }
                if (bonus && previousFocus?.dataset) {
                    const control = Array.from(doc.querySelectorAll('.fiscal-bonus-edit')).find(button =>
                        button.dataset.schoolId === target.schoolId
                        && button.dataset.compKey === previousFocus.dataset.compKey);
                    control?.focus({ preventScroll: true });
                } else if (historyDeletion) {
                    const itemRow = Array.from(doc.querySelectorAll?.('tr[data-document-key]') || [])
                        .find(row => row.dataset?.documentKey === target.documentKey
                            && row.dataset?.programId === target.programId);
                    const focusTarget = itemRow?.querySelector?.('.prontuario-history-clear-button')
                        || itemRow?.querySelector?.('.verification-document-copy strong')
                        || doc.getElementById?.('prontuario-verif-rows');
                    if (focusTarget?.tagName === 'STRONG' && !focusTarget.hasAttribute('tabindex')) {
                        focusTarget.setAttribute('tabindex', '-1');
                    }
                    focusTarget?.focus?.({ preventScroll: true });
                } else if (contextDeletion) {
                    const programHeader = Array.from(doc.querySelectorAll?.('tr[data-program-header]') || [])
                        .find(row => row.dataset?.programHeader === target.programId);
                    const heading = programHeader?.querySelector?.('.program-context-name');
                    const focusTarget = programHeader?.querySelector?.('.program-consolidate-button:not(:disabled)')
                        || heading
                        || doc.getElementById?.('prontuario-verif-rows');
                    if (focusTarget === heading && heading && !heading.hasAttribute('tabindex')) {
                        heading.setAttribute('tabindex', '-1');
                    }
                    focusTarget?.focus?.({ preventScroll: true });
                }
                root.updateAlertsBell?.();
                let message = contextDeletion
                    ? 'Lançamentos excluídos. Confira o programa e o mês antes de cadastrar novamente.'
                    : historyDeletion
                        ? 'Histórico do item limpo. A nota fiscal, a bonificação e os demais documentos foram preservados.'
                        : deleting ? 'Exclusão confirmada. Os registros relacionados foram atualizados.'
                            : 'Correção confirmada e informações atualizadas.';
                if (bonus) {
                    const reopened = preview.view.changes.some(change => change.field === 'bonus_result');
                    const cleared = select.value === 'Limpar resposta';
                    message = reopened ? (cleared
                        ? 'Avaliação removida. Preencha novamente Notas Fiscais para habilitar Consolidar bonificação no cabeçalho do programa.'
                        : 'Avaliação corrigida. Para concluir, utilize Consolidar bonificação no cabeçalho do programa.')
                        : (cleared ? 'Avaliação de Notas Fiscais removida.' : 'Avaliação de Notas Fiscais atualizada.');
                }
                root.RadarSharedInteractions?.notify?.({ type: 'success', message });
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
                actionHelp(reload, 'Recarrega a página para conferir o resultado já gravado.');
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
                    if (bonus) review.hidden = false;
                    status(contextDeletion || historyDeletion
                        ? 'Os registros mudaram desde a conferência. Confira novamente antes de excluir.'
                        : 'Os dados mudaram. Revise a prévia antes de confirmar.', true);
                } else {
                    uncertain = true;
                    status(contextDeletion
                        ? 'Não foi possível confirmar se a exclusão terminou. Atualize a página e confira os lançamentos antes de tentar novamente.'
                        : 'Estado incerto: o servidor pode ter confirmado a gravação. Tente novamente com a mesma intenção ou atualize a página e confira o resultado antes de um novo lançamento.', true);
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
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
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
        (deleting ? cancel : select).focus({ preventScroll: true });
        void loadPreview();
        return true;
    }
    return Object.freeze({ ANALYSES, canUse, canCorrectFiscalBonus, canDeleteContext, canClearHistory, open });
}));
