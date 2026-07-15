(function installRadarSharedInteractions(root, factory) {
    'use strict';

    const api = factory(root);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root && root.document) {
        root.RadarSharedInteractions = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSharedInteractionsApi(root) {
    'use strict';

    const CONTROLLER_DIALOG_ID = 'radar-controller-deactivation-dialog';
    const FEEDBACK_REGION_ID = 'radar-feedback-region';
    let activeRequest = null;

    class InteractionError extends Error {
        constructor(code, message) {
            super(message);
            this.name = 'InteractionError';
            this.code = code;
        }
    }

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function count(value) {
        const parsed = Number.parseInt(String(value ?? 0), 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    }

    function pluralSchools(value) {
        return value === 1 ? '1 escola' : `${value} escolas`;
    }

    function normalizeControllerRecords(records) {
        return (Array.isArray(records) ? records : []).map(record => {
            const normalized = { ...(record || {}) };
            if (normalized.id === 'erica' && ['Érica', 'Erica'].includes(text(normalized.name))) {
                normalized.name = 'Érika Reis';
            }
            return normalized;
        });
    }

    function buildControllerDeactivationModel(input = {}) {
        const controller = {
            ...(input.controller || {}),
            id: text(input.controller?.id),
            name: text(input.controller?.name)
        };
        if (!controller.id || !controller.name) {
            throw new InteractionError(
                'INVALID_CONTROLLER',
                'Não foi possível identificar a controladora que será desativada.'
            );
        }

        const schoolCount = count(input.schoolCount);
        const candidates = normalizeControllerRecords(input.controllers)
            .filter(item => item.id && item.id !== controller.id && item.active !== false)
            .map(item => ({ id: text(item.id), name: text(item.name) }))
            .filter(item => item.id && item.name)
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

        if (schoolCount > 0 && candidates.length === 0) {
            throw new InteractionError(
                'NO_ACTIVE_RECIPIENT',
                'Cadastre ou reative outra pessoa antes de transferir esta carteira.'
            );
        }

        return Object.freeze({
            controller: Object.freeze(controller),
            schoolCount,
            candidates: Object.freeze(candidates.map(item => Object.freeze(item))),
            requiresRecipient: schoolCount > 0,
            confirmLabel: schoolCount > 0
                ? `Desativar e transferir ${pluralSchools(schoolCount)}`
                : 'Desativar controladora'
        });
    }

    function validateControllerRecipient(model, recipientId) {
        if (!model?.requiresRecipient) return null;
        const id = text(recipientId);
        if (!id) {
            throw new InteractionError(
                'RECIPIENT_REQUIRED',
                'Escolha quem receberá as escolas antes de continuar.'
            );
        }
        const recipient = model.candidates.find(item => item.id === id);
        if (!recipient) {
            throw new InteractionError(
                'INVALID_RECIPIENT',
                'A pessoa escolhida não está disponível para receber esta carteira.'
            );
        }
        return recipient;
    }

    function formatControllerDeactivationSuccess(input = {}) {
        const controllerName = text(input.controllerName) || 'A controladora';
        const recipientName = text(input.recipientName);
        const schoolCount = count(input.schoolCount);
        if (schoolCount === 0) return `${controllerName} foi desativada sem escolas vinculadas.`;
        const verb = schoolCount === 1 ? 'foi transferida' : 'foram transferidas';
        return `${controllerName} foi desativada. ${pluralSchools(schoolCount)} ${verb} para ${recipientName}.`;
    }

    function ensureFeedbackRegion(documentRef) {
        let region = documentRef.getElementById(FEEDBACK_REGION_ID);
        if (region) return region;
        region = documentRef.createElement('section');
        region.id = FEEDBACK_REGION_ID;
        region.className = 'radar-feedback-region';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        documentRef.body.appendChild(region);
        return region;
    }

    function notify(input = {}) {
        if (!root?.document) return null;
        const message = text(input.message);
        if (!message) return null;
        const type = ['success', 'error', 'warning', 'info'].includes(input.type)
            ? input.type
            : 'info';
        const region = ensureFeedbackRegion(root.document);
        region.setAttribute('role', type === 'error' ? 'alert' : 'status');
        region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        const notice = root.document.createElement('div');
        notice.className = `radar-feedback radar-feedback--${type}`;
        const messageNode = root.document.createElement('p');
        messageNode.textContent = message;
        const closeButton = root.document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'radar-feedback__close';
        closeButton.setAttribute('aria-label', 'Fechar mensagem');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => notice.remove());
        notice.append(messageNode, closeButton);
        region.replaceChildren(notice);

        const duration = Number.isFinite(input.duration) ? input.duration : 7000;
        if (duration > 0) root.setTimeout(() => notice.remove(), duration);
        return notice;
    }

    function ensureControllerDialog(documentRef) {
        let dialog = documentRef.getElementById(CONTROLLER_DIALOG_ID);
        if (dialog) return dialog;

        dialog = documentRef.createElement('div');
        dialog.id = CONTROLLER_DIALOG_ID;
        dialog.className = 'modal-overlay radar-shared-dialog';
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', `${CONTROLLER_DIALOG_ID}-title`);
        dialog.setAttribute('aria-describedby', `${CONTROLLER_DIALOG_ID}-description`);
        dialog.setAttribute('aria-hidden', 'true');
        dialog.setAttribute('inert', '');
        dialog.innerHTML = `
            <div class="modal-content radar-controller-deactivation-dialog">
                <header class="radar-critical-dialog__header">
                    <div>
                        <h2 id="${CONTROLLER_DIALOG_ID}-title"></h2>
                        <p id="${CONTROLLER_DIALOG_ID}-description">A controladora deixará de aparecer como opção ativa.</p>
                    </div>
                    <button type="button" class="btn-close" data-controller-deactivation-close aria-label="Fechar">×</button>
                </header>
                <div class="radar-critical-dialog__body">
                    <p class="radar-critical-dialog__impact" data-controller-deactivation-impact></p>
                    <div class="radar-critical-dialog__field" data-controller-deactivation-field>
                        <label for="controller-deactivation-recipient">Nova responsável</label>
                        <select class="form-control" id="controller-deactivation-recipient"></select>
                        <small>A reatribuição ocorrerá junto com a desativação.</small>
                    </div>
                    <p class="radar-critical-dialog__history" data-controller-deactivation-history></p>
                    <p class="radar-critical-dialog__error" data-controller-deactivation-error role="alert" tabindex="-1" hidden></p>
                </div>
                <footer class="modal-footer radar-critical-dialog__footer">
                    <button type="button" class="btn btn-secondary" data-controller-deactivation-cancel autofocus>Cancelar</button>
                    <button type="button" class="btn btn-danger" data-controller-deactivation-confirm></button>
                </footer>
            </div>
        `;
        documentRef.body.appendChild(dialog);

        const cancel = () => finishActiveRequest(null, { restoreFocus: true });
        dialog.querySelector('[data-controller-deactivation-close]').addEventListener('click', cancel);
        dialog.querySelector('[data-controller-deactivation-cancel]').addEventListener('click', cancel);
        dialog.querySelector('#controller-deactivation-recipient').addEventListener('change', event => {
            if (!activeRequest) return;
            activeRequest.confirmButton.disabled = activeRequest.model.requiresRecipient && !text(event.target.value);
            clearDialogError(activeRequest.dialog);
        });
        dialog.querySelector('[data-controller-deactivation-confirm]').addEventListener('click', submitActiveRequest);
        dialog.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !activeRequest) return;
            event.preventDefault();
            cancel();
        });
        return dialog;
    }

    function openDialog(dialog, trigger, cancelButton) {
        if (typeof root.openModal === 'function') {
            root.openModal(dialog.id, trigger);
        } else {
            dialog.classList.add('show');
            dialog.setAttribute('aria-hidden', 'false');
            dialog.removeAttribute('inert');
        }
        root.requestAnimationFrame(() => cancelButton.focus({ preventScroll: true }));
    }

    function closeDialog(dialog) {
        if (typeof root.closeModal === 'function') {
            root.closeModal(dialog.id);
        } else {
            dialog.classList.remove('show');
            dialog.setAttribute('aria-hidden', 'true');
            dialog.setAttribute('inert', '');
        }
    }

    function clearDialogError(dialog) {
        const error = dialog.querySelector('[data-controller-deactivation-error]');
        error.hidden = true;
        error.textContent = '';
    }

    function showDialogError(dialog, message) {
        const error = dialog.querySelector('[data-controller-deactivation-error]');
        error.textContent = text(message) || 'Não foi possível concluir a desativação.';
        error.hidden = false;
        error.focus?.({ preventScroll: true });
    }

    function setDialogBusy(request, busy) {
        request.dialog.setAttribute('aria-busy', busy ? 'true' : 'false');
        request.select.disabled = busy;
        request.cancelButton.disabled = busy;
        request.closeButton.disabled = busy;
        request.confirmButton.disabled = busy || (request.model.requiresRecipient && !text(request.select.value));
        request.confirmButton.textContent = busy
            ? 'Desativando e transferindo…'
            : request.model.confirmLabel;
    }

    function finishActiveRequest(result, options = {}) {
        const request = activeRequest;
        if (!request) return;
        activeRequest = null;
        closeDialog(request.dialog);
        request.dialog.removeAttribute('aria-busy');
        request.resolve(result);
        if (options.restoreFocus && request.trigger && root.document.contains(request.trigger)) {
            root.requestAnimationFrame(() => request.trigger.focus({ preventScroll: true }));
        }
    }

    async function submitActiveRequest() {
        const request = activeRequest;
        if (!request || request.pending) return;
        let recipient;
        try {
            recipient = validateControllerRecipient(request.model, request.select.value);
        } catch (error) {
            showDialogError(request.dialog, error.message);
            request.select.focus({ preventScroll: true });
            return;
        }

        request.pending = true;
        clearDialogError(request.dialog);
        setDialogBusy(request, true);
        try {
            const result = await request.onConfirm(recipient?.id || null, recipient);
            finishActiveRequest({ result, recipient }, { restoreFocus: false });
        } catch (error) {
            request.pending = false;
            setDialogBusy(request, false);
            showDialogError(request.dialog, error?.message);
            request.confirmButton.focus({ preventScroll: true });
        }
    }

    function requestControllerDeactivation(input = {}) {
        if (!root?.document) {
            return Promise.reject(new InteractionError('DOM_UNAVAILABLE', 'Interface indisponível.'));
        }
        if (activeRequest) {
            return Promise.reject(new InteractionError(
                'INTERACTION_IN_PROGRESS',
                'Conclua ou cancele a confirmação aberta antes de continuar.'
            ));
        }
        if (typeof input.onConfirm !== 'function') {
            return Promise.reject(new InteractionError(
                'CONFIRM_HANDLER_REQUIRED',
                'A operação de desativação não foi configurada.'
            ));
        }

        const model = buildControllerDeactivationModel(input);
        const dialog = ensureControllerDialog(root.document);
        const select = dialog.querySelector('#controller-deactivation-recipient');
        const confirmButton = dialog.querySelector('[data-controller-deactivation-confirm]');
        const cancelButton = dialog.querySelector('[data-controller-deactivation-cancel]');
        const closeButton = dialog.querySelector('[data-controller-deactivation-close]');

        dialog.querySelector(`#${CONTROLLER_DIALOG_ID}-title`).textContent = `Desativar ${model.controller.name}`;
        dialog.querySelector('[data-controller-deactivation-impact]').textContent = model.requiresRecipient
            ? `${pluralSchools(model.schoolCount)} precisam de nova responsável.`
            : 'Nenhuma escola está vinculada a este cadastro.';
        dialog.querySelector('[data-controller-deactivation-history]').textContent =
            `Os registros históricos de ${model.controller.name} serão mantidos.`;
        dialog.querySelector('[data-controller-deactivation-field]').hidden = !model.requiresRecipient;
        select.replaceChildren();
        const placeholder = root.document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecione uma pessoa';
        select.appendChild(placeholder);
        model.candidates.forEach(candidate => {
            const option = root.document.createElement('option');
            option.value = candidate.id;
            option.textContent = candidate.name;
            select.appendChild(option);
        });
        select.value = '';
        clearDialogError(dialog);
        confirmButton.textContent = model.confirmLabel;
        confirmButton.disabled = model.requiresRecipient;

        return new Promise(resolve => {
            activeRequest = {
                model,
                dialog,
                select,
                confirmButton,
                cancelButton,
                closeButton,
                trigger: input.trigger || root.document.activeElement,
                onConfirm: input.onConfirm,
                pending: false,
                resolve
            };
            setDialogBusy(activeRequest, false);
            openDialog(dialog, activeRequest.trigger, cancelButton);
        });
    }

    return Object.freeze({
        InteractionError,
        buildControllerDeactivationModel,
        validateControllerRecipient,
        normalizeControllerRecords,
        formatControllerDeactivationSuccess,
        requestControllerDeactivation,
        notify
    });
}));
