(function installAccessibleLegacyModals(root) {
    'use strict';

    const EXCLUDED_IDS = new Set([
        'modal-registrar-envio',
        'modal-reanalisar-pendencia',
        'modal-pendency-contact',
        'modal-pendency-cancel',
        'modal-pendency-reopen'
    ]);
    const triggers = new Map();
    const managed = new Set();
    let installed = false;
    let originalOpenModal = null;
    let originalCloseModal = null;

    function getFocusable(dialog) {
        return Array.from(dialog.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(element => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
    }

    function ensureLabel(dialog) {
        if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
        const heading = dialog.querySelector('h1, h2, h3');
        if (!heading) {
            dialog.setAttribute('aria-label', 'Janela de diálogo');
            return;
        }
        if (!heading.id) heading.id = `${dialog.id || 'modal'}-accessible-title`;
        dialog.setAttribute('aria-labelledby', heading.id);
    }

    function normalizeDialog(dialog) {
        if (!dialog || !dialog.classList.contains('modal-overlay')) return false;
        if (dialog.getAttribute('role') !== 'alertdialog') {
            dialog.setAttribute('role', 'dialog');
        }
        dialog.setAttribute('aria-modal', 'true');
        ensureLabel(dialog);
        const closeButton = dialog.querySelector('.btn-close');
        if (closeButton && !closeButton.hasAttribute('aria-label')) {
            closeButton.setAttribute('aria-label', 'Fechar');
        }
        if (dialog.classList.contains('show')) {
            dialog.setAttribute('aria-hidden', 'false');
            dialog.removeAttribute('inert');
        } else {
            dialog.setAttribute('aria-hidden', 'true');
            dialog.setAttribute('inert', '');
        }
        return true;
    }

    function focusInitial(dialog) {
        const preferred = dialog.querySelector('[autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
        const target = preferred || getFocusable(dialog)[0] || dialog;
        if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }

    function openAccessible(id, trigger) {
        const dialog = document.getElementById(id);
        if (!dialog || EXCLUDED_IDS.has(id)) return originalOpenModal(id);
        const source = trigger && trigger.nodeType === 1 ? trigger : document.activeElement;
        if (source && source !== document.body) triggers.set(id, source);
        managed.add(id);
        const result = originalOpenModal(id);
        normalizeDialog(dialog);
        dialog.setAttribute('aria-hidden', 'false');
        dialog.removeAttribute('inert');
        document.body.classList.add('modal-open');
        root.requestAnimationFrame(() => focusInitial(dialog));
        return result;
    }

    function resolveLogicalFallback(id, dialog) {
        if (id === 'modal-retificacoes' || id === 'modal-reanalisar') {
            const cards = document.querySelectorAll('.card-escola, .escola-item, .school-card, .btn-action-main');
            if (cards.length > 0) return cards[0];
        }
        const h1 = document.querySelector('h1, h2, main, #app');
        if (h1) {
            if (!h1.hasAttribute('tabindex')) {
                h1.setAttribute('tabindex', '-1');
            }
            return h1;
        }
        return document.body;
    }

    function closeAccessible(id) {
        if (EXCLUDED_IDS.has(id) || !managed.has(id)) return originalCloseModal(id);
        const dialog = document.getElementById(id);
        const result = originalCloseModal(id);
        if (dialog) {
            dialog.setAttribute('aria-hidden', 'true');
            dialog.setAttribute('inert', '');
        }
        managed.delete(id);
        if (!Array.from(managed).some(candidate => document.getElementById(candidate)?.classList.contains('show'))) {
            document.body.classList.remove('modal-open');
        }
        const trigger = triggers.get(id);
        triggers.delete(id);
        if (trigger && document.contains(trigger) && trigger.isConnected) {
            root.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
        } else {
            const fallback = resolveLogicalFallback(id, dialog);
            if (fallback) {
                root.requestAnimationFrame(() => fallback.focus({ preventScroll: true }));
            }
        }
        return result;
    }

    function activeManagedDialog() {
        return Array.from(managed)
            .map(id => document.getElementById(id))
            .reverse()
            .find(dialog => dialog && dialog.classList.contains('show')) || null;
    }

    function handleKeydown(event) {
        const dialog = activeManagedDialog();
        if (!dialog) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            root.closeModal(dialog.id);
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = getFocusable(dialog);
        if (!focusable.length) {
            event.preventDefault();
            dialog.focus({ preventScroll: true });
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    }

    function install() {
        if (installed || typeof root.openModal !== 'function' || typeof root.closeModal !== 'function') return false;
        originalOpenModal = root.openModal.bind(root);
        originalCloseModal = root.closeModal.bind(root);
        document.querySelectorAll('.modal-overlay').forEach(normalizeDialog);
        root.openModal = openAccessible;
        root.closeModal = closeAccessible;
        document.addEventListener('keydown', handleKeydown, true);
        root.RadarModalAccessibility = Object.freeze({
            VERSION: '1.0.0',
            normalize: normalizeDialog,
            getActiveDialog: activeManagedDialog
        });
        installed = true;
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
