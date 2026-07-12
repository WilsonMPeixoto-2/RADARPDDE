(function installTask1011PendencyActions(root) {
    'use strict';

    let installed = false;
    let originalRenderPendencias = null;
    let originalOpenPendencyDetail = null;
    let lastTrigger = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarPendencias
            && root.RadarTask9PendencyPage
            && typeof root.renderPendencias === 'function'
            && typeof root.openPendencyDetail === 'function'
            && typeof root.resolvePendencyIdReference === 'function'
        );
    }

    function getProfile() {
        return typeof currentProfile !== 'undefined' ? currentProfile : '';
    }

    function getUser() {
        if (typeof getCurrentUser === 'function') return getCurrentUser();
        return { name: 'Usuário não identificado', role: getProfile() || 'não informado' };
    }

    function findPendency(id) {
        return Array.isArray(pendencias) ? pendencias.find(item => item.id === id) : null;
    }

    function replacePendency(updated) {
        const index = pendencias.findIndex(item => item.id === updated.id);
        if (index < 0) throw new Error('Pendência não encontrada para atualização.');
        pendencias[index] = updated;
        if (typeof rebuildOperationalIndexes === 'function') rebuildOperationalIndexes();
    }

    function nextId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function announce(message, type = 'success') {
        let region = document.getElementById('task-10-11-live-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'task-10-11-live-region';
            region.className = 'task-operations-live-region';
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

    function dialogElement(id) {
        return document.getElementById(id);
    }

    function trapDialogFocus(event, dialog) {
        if (event.key !== 'Tab') return;
        const focusable = Array.from(dialog.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

    function openDialog(id, trigger) {
        const dialog = dialogElement(id);
        if (!dialog) return false;
        lastTrigger = trigger && trigger.nodeType === 1 ? trigger : document.activeElement;
        dialog.classList.add('show');
        dialog.setAttribute('aria-hidden', 'false');
        dialog.removeAttribute('inert');
        document.body.classList.add('modal-open');
        root.requestAnimationFrame(() => {
            const focusable = dialog.querySelector('textarea, select, input, button:not([disabled])');
            if (focusable) focusable.focus({ preventScroll: true });
        });
        return true;
    }

    function closeDialog(id) {
        const dialog = dialogElement(id);
        if (!dialog) return false;
        dialog.classList.remove('show');
        dialog.setAttribute('aria-hidden', 'true');
        dialog.setAttribute('inert', '');
        document.body.classList.remove('modal-open');
        if (lastTrigger && document.contains(lastTrigger)) {
            root.requestAnimationFrame(() => lastTrigger.focus({ preventScroll: true }));
        }
        lastTrigger = null;
        return true;
    }

    function injectDialogs() {
        if (document.getElementById('modal-pendency-contact')) return;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="modal-overlay" id="modal-pendency-contact" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pendency-contact-title" inert>
                <div class="modal-content task-operation-modal">
                    <div class="modal-header">
                        <div><h2 id="pendency-contact-title">Registrar contato da pendência</h2><p>O contato integra a linha do tempo sem alterar a situação da pendência.</p></div>
                        <button type="button" class="btn-close" aria-label="Fechar" data-close-dialog="modal-pendency-contact">×</button>
                    </div>
                    <form id="form-pendency-contact">
                        <input type="hidden" id="pendency-contact-id">
                        <div class="form-group">
                            <label for="pendency-contact-channel">Canal</label>
                            <select id="pendency-contact-channel" class="form-control" required>
                                <option value="Telefone">Telefone</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="E-mail">E-mail</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="pendency-contact-description">Descrição do contato</label>
                            <textarea id="pendency-contact-description" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" data-close-dialog="modal-pendency-contact">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar contato</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-overlay" id="modal-pendency-cancel" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pendency-cancel-title" inert>
                <div class="modal-content task-operation-modal">
                    <div class="modal-header">
                        <div><h2 id="pendency-cancel-title">Cancelar pendência</h2><p>Use somente para lançamento indevido. A ação será preservada no histórico.</p></div>
                        <button type="button" class="btn-close" aria-label="Fechar" data-close-dialog="modal-pendency-cancel">×</button>
                    </div>
                    <form id="form-pendency-cancel">
                        <input type="hidden" id="pendency-cancel-id">
                        <div class="task-destructive-note">O cancelamento retira o registro das filas ativas, mas não altera bonificação ou análise técnica.</div>
                        <div class="form-group">
                            <label for="pendency-cancel-justification">Justificativa do cancelamento</label>
                            <textarea id="pendency-cancel-justification" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" data-close-dialog="modal-pendency-cancel">Voltar</button>
                            <button type="submit" class="btn btn-danger">Confirmar cancelamento</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-overlay" id="modal-pendency-reopen" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pendency-reopen-title" inert>
                <div class="modal-content task-operation-modal">
                    <div class="modal-header">
                        <div><h2 id="pendency-reopen-title">Reabrir pendência</h2><p>Informe os erros atuais e a razão administrativa da reabertura.</p></div>
                        <button type="button" class="btn-close" aria-label="Fechar" data-close-dialog="modal-pendency-reopen">×</button>
                    </div>
                    <form id="form-pendency-reopen">
                        <input type="hidden" id="pendency-reopen-id">
                        <fieldset class="task-error-fieldset">
                            <legend>Erros documentais</legend>
                            <div id="pendency-reopen-errors" class="task-error-grid"></div>
                        </fieldset>
                        <div class="form-group">
                            <label for="pendency-reopen-justification">Justificativa da reabertura</label>
                            <textarea id="pendency-reopen-justification" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" data-close-dialog="modal-pendency-reopen">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Confirmar reabertura</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        Array.from(wrapper.children).forEach(child => document.body.appendChild(child));

        const errorContainer = document.getElementById('pendency-reopen-errors');
        root.RadarPendencias.DOCUMENT_ERROR_TYPES.forEach((error, index) => {
            const label = document.createElement('label');
            label.className = 'task-error-option';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = 'pendency-reopen-error';
            input.value = error;
            input.id = `pendency-reopen-error-${index}`;
            label.setAttribute('for', input.id);
            label.appendChild(input);
            label.appendChild(document.createTextNode(error));
            errorContainer.appendChild(label);
        });

        document.querySelectorAll('[data-close-dialog]').forEach(button => {
            button.addEventListener('click', () => closeDialog(button.dataset.closeDialog));
        });
        document.getElementById('form-pendency-contact').addEventListener('submit', savePendencyContact);
        document.getElementById('form-pendency-cancel').addEventListener('submit', confirmCancelPendency);
        document.getElementById('form-pendency-reopen').addEventListener('submit', confirmReopenPendency);
        errorContainer.addEventListener('change', enforceAbsentExclusivity);
        document.addEventListener('keydown', event => {
            const dialog = ['modal-pendency-contact', 'modal-pendency-cancel', 'modal-pendency-reopen']
                .map(dialogElement)
                .find(candidate => candidate && candidate.classList.contains('show'));
            if (!dialog) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDialog(dialog.id);
                return;
            }
            trapDialogFocus(event, dialog);
        });
    }

    function enforceAbsentExclusivity(event) {
        const inputs = Array.from(document.querySelectorAll('input[name="pendency-reopen-error"]'));
        const absent = inputs.find(input => input.value === 'Documento ausente');
        if (!absent) return;
        if (event.target === absent && absent.checked) {
            inputs.filter(input => input !== absent).forEach(input => { input.checked = false; });
        } else if (event.target.checked) {
            absent.checked = false;
        }
    }

    function resolveId(source) {
        try {
            return root.resolvePendencyIdReference(source);
        } catch (error) {
            announce('Não foi possível identificar a pendência selecionada.', 'error');
            return null;
        }
    }

    function openPendencyContactModal(source) {
        const id = resolveId(source);
        const pendency = findPendency(id);
        if (!pendency || !root.RadarPendencias.isActivePendency(pendency)) {
            announce('Contatos podem ser registrados apenas em pendências ativas.', 'error');
            return false;
        }
        document.getElementById('pendency-contact-id').value = JSON.stringify({ type: typeof id, value: id });
        document.getElementById('pendency-contact-channel').value = 'Telefone';
        document.getElementById('pendency-contact-description').value = '';
        return openDialog('modal-pendency-contact', source.currentTarget || source);
    }

    function savePendencyContact(event) {
        event.preventDefault();
        try {
            const reference = JSON.parse(document.getElementById('pendency-contact-id').value);
            const id = reference.value;
            const pendency = findPendency(id);
            if (!pendency || !root.RadarPendencias.isActivePendency(pendency)) {
                throw new Error('A pendência não está mais ativa.');
            }
            const description = document.getElementById('pendency-contact-description').value.trim();
            if (!description) throw new Error('Descrição do contato é obrigatória.');
            const user = getUser();
            const now = new Date().toISOString();
            contatos.push({
                id: nextId('contato-pendencia'),
                pendenciaId: pendency.id,
                escolaId: pendency.escolaId,
                competencia: pendency.competenciaOrigem || pendency.competencia,
                programaId: pendency.programaId || null,
                documentoKey: pendency.documentoKey || null,
                data: now.slice(0, 10),
                dataHora: now,
                tipo: document.getElementById('pendency-contact-channel').value,
                descricao: description,
                observacao: description,
                responsavel: user.name,
                usuario: user.name,
                perfil: user.role || getProfile()
            });
            if (typeof registerLog === 'function') {
                registerLog('Contato de pendência registrado', `${description} [Pendência ${String(pendency.id)}]`);
            } else if (typeof persist === 'function') {
                persist('contatos');
            }
            closeDialog('modal-pendency-contact');
            originalRenderPendencias();
            originalOpenPendencyDetail(pendency.id);
            enhancePendencyActions();
            announce('Contato registrado e incluído na linha do tempo.');
        } catch (error) {
            announce(error.message || 'Não foi possível registrar o contato.', 'error');
        }
    }

    function openCancelPendencyModal(source) {
        const id = resolveId(source);
        const pendency = findPendency(id);
        if (!pendency || !root.RadarPendencias.isActivePendency(pendency)) {
            announce('Somente pendências ativas podem ser canceladas.', 'error');
            return false;
        }
        document.getElementById('pendency-cancel-id').value = JSON.stringify({ type: typeof id, value: id });
        document.getElementById('pendency-cancel-justification').value = '';
        return openDialog('modal-pendency-cancel', source.currentTarget || source);
    }

    function confirmCancelPendency(event) {
        event.preventDefault();
        try {
            const reference = JSON.parse(document.getElementById('pendency-cancel-id').value);
            const pendency = findPendency(reference.value);
            if (!pendency) throw new Error('Pendência não encontrada.');
            const justification = document.getElementById('pendency-cancel-justification').value.trim();
            const user = getUser();
            const updated = root.RadarPendencias.cancelPendency(pendency, {
                justificativa: justification
            }, {
                eventId: nextId('evento-cancelamento'),
                at: new Date().toISOString(),
                usuario: user.name,
                perfil: user.role || getProfile()
            });
            replacePendency(updated);
            if (typeof registerLog === 'function') {
                registerLog('Pendência cancelada', `${justification} [Pendência ${String(updated.id)}]`);
            } else if (typeof persist === 'function') {
                persist('pendencias');
            }
            closeDialog('modal-pendency-cancel');
            originalRenderPendencias();
            originalOpenPendencyDetail(updated.id);
            enhancePendencyActions();
            announce('Pendência cancelada e preservada no histórico.');
        } catch (error) {
            announce(error.message || 'Não foi possível cancelar a pendência.', 'error');
        }
    }

    function openReopenPendencyModal(source) {
        const id = resolveId(source);
        const pendency = findPendency(id);
        if (!pendency || pendency.status !== 'Resolvida') {
            announce('Somente pendências resolvidas podem ser reabertas.', 'error');
            return false;
        }
        document.getElementById('pendency-reopen-id').value = JSON.stringify({ type: typeof id, value: id });
        document.getElementById('pendency-reopen-justification').value = '';
        document.querySelectorAll('input[name="pendency-reopen-error"]').forEach(input => { input.checked = false; });
        return openDialog('modal-pendency-reopen', source.currentTarget || source);
    }

    function confirmReopenPendency(event) {
        event.preventDefault();
        try {
            const reference = JSON.parse(document.getElementById('pendency-reopen-id').value);
            const pendency = findPendency(reference.value);
            if (!pendency) throw new Error('Pendência não encontrada.');
            const errors = Array.from(document.querySelectorAll('input[name="pendency-reopen-error"]:checked'))
                .map(input => input.value);
            const justification = document.getElementById('pendency-reopen-justification').value.trim();
            const user = getUser();
            const updated = root.RadarPendencias.reopenPendency(pendency, {
                justificativa: justification,
                errosAtuais: errors
            }, {
                eventId: nextId('evento-reabertura'),
                at: new Date().toISOString(),
                usuario: user.name,
                perfil: user.role || getProfile()
            });
            replacePendency(updated);
            if (typeof registerLog === 'function') {
                registerLog('Pendência reaberta', `${justification} [Pendência ${String(updated.id)}]`);
            } else if (typeof persist === 'function') {
                persist('pendencias');
            }
            closeDialog('modal-pendency-reopen');
            originalRenderPendencias();
            originalOpenPendencyDetail(updated.id);
            enhancePendencyActions();
            announce('Pendência reaberta e devolvida à fila Abertas.');
        } catch (error) {
            announce(error.message || 'Não foi possível reabrir a pendência.', 'error');
        }
    }

    function createActionButton(label, className, handlerName, reference) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-sm ${className}`;
        button.textContent = label;
        button.dataset.pendencyRef = reference;
        button.dataset.taskOperationAction = handlerName;
        button.addEventListener('click', event => root[handlerName](event.currentTarget));
        return button;
    }

    function enhanceActionGroup(group, pendency, reference) {
        if (!group || group.dataset.taskOperationsEnhanced === 'true') return;
        if (root.RadarPendencias.isActivePendency(pendency)) {
            group.appendChild(createActionButton('Registrar contato', 'btn-secondary', 'openPendencyContactModal', reference));
            group.appendChild(createActionButton('Cancelar pendência', 'btn-danger', 'openCancelPendencyModal', reference));
        } else if (pendency.status === 'Resolvida') {
            group.appendChild(createActionButton('Reabrir pendência', 'btn-secondary', 'openReopenPendencyModal', reference));
        }
        group.dataset.taskOperationsEnhanced = 'true';
    }

    function enhancePendencyActions() {
        injectDialogs();
        document.querySelectorAll('[data-pendency-ref]').forEach(container => {
            if (container.closest('.task-operation-modal')) return;
            const reference = container.dataset.pendencyRef;
            if (!reference) return;
            let id;
            try { id = root.resolvePendencyIdReference(container); } catch (error) { return; }
            const pendency = findPendency(id);
            if (!pendency) return;
            const groups = container.matches('.pendency-row-actions')
                ? [container]
                : Array.from(container.querySelectorAll('.pendency-row-actions'));
            groups.forEach(group => enhanceActionGroup(group, pendency, reference));
        });
        const drawer = document.getElementById('pendency-detail-drawer');
        if (drawer && drawer.dataset.pendencyRef) {
            let id;
            try { id = root.resolvePendencyIdReference(drawer); } catch (error) { return; }
            const pendency = findPendency(id);
            const group = drawer.querySelector('.pendency-drawer-footer .pendency-row-actions');
            if (pendency && group) enhanceActionGroup(group, pendency, drawer.dataset.pendencyRef);
        }
    }

    function renderPendenciasEnhanced(options) {
        const result = originalRenderPendencias(options);
        root.requestAnimationFrame(enhancePendencyActions);
        return result;
    }

    function openPendencyDetailEnhanced(source) {
        const result = originalOpenPendencyDetail(source);
        root.requestAnimationFrame(enhancePendencyActions);
        return result;
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalRenderPendencias = root.renderPendencias.bind(root);
        originalOpenPendencyDetail = root.openPendencyDetail.bind(root);
        root.renderPendencias = renderPendenciasEnhanced;
        root.openPendencyDetail = openPendencyDetailEnhanced;
        root.openPendencyContactModal = openPendencyContactModal;
        root.savePendencyContact = savePendencyContact;
        root.openCancelPendencyModal = openCancelPendencyModal;
        root.confirmCancelPendency = confirmCancelPendency;
        root.openReopenPendencyModal = openReopenPendencyModal;
        root.confirmReopenPendency = confirmReopenPendency;
        root.RadarTask1011PendencyActions = Object.freeze({
            VERSION: '1.0.0',
            enhance: enhancePendencyActions
        });
        injectDialogs();
        installed = true;
        if (typeof currentView !== 'undefined' && currentView === 'pendencias') {
            root.requestAnimationFrame(enhancePendencyActions);
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
