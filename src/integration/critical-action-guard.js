(function installRadarCriticalActionGuard(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarCriticalActionGuard = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createCriticalActionGuardApi() {
    'use strict';

    const INSTALL_FLAG = '__radarCriticalActionGuardInstalled';

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function hiddenValue(root, id) {
        return text(root?.document?.getElementById?.(id)?.value);
    }

    function formForEvent(event, fallback) {
        const current = event?.currentTarget;
        if (current?.tagName === 'FORM') return current;
        const target = event?.target;
        if (target?.tagName === 'FORM') return target;
        return fallback || null;
    }

    function setFormBusy(form, busy, busyLabel) {
        if (!form) return () => {};
        const submit = form.querySelector?.('button[type="submit"]') || null;
        const previous = {
            ariaBusy: form.getAttribute?.('aria-busy'),
            disabled: Boolean(submit?.disabled),
            label: submit?.textContent || ''
        };
        form.setAttribute?.('aria-busy', busy ? 'true' : 'false');
        if (submit && busy) {
            submit.disabled = true;
            submit.textContent = busyLabel;
        }
        return () => {
            if (previous.ariaBusy == null) form.removeAttribute?.('aria-busy');
            else form.setAttribute?.('aria-busy', previous.ariaBusy);
            if (submit) {
                submit.disabled = previous.disabled;
                submit.textContent = previous.label;
            }
        };
    }

    function createGuard(root) {
        const inFlight = new Map();

        function wrap(name, options = {}) {
            const original = root?.[name];
            if (typeof original !== 'function' || original.__radarCriticalActionGuard === true) {
                return false;
            }

            const wrapped = async function guardedCriticalAction(...args) {
                const key = text(options.key?.(root, args)) || name;
                if (inFlight.has(key)) return false;

                const event = args[0];
                event?.preventDefault?.();
                event?.stopImmediatePropagation?.();
                const form = options.form?.(root, args)
                    || formForEvent(event, null);
                const restoreUi = setFormBusy(form, true, options.busyLabel || 'Salvando…');
                inFlight.set(key, true);
                try {
                    return await original.apply(this, args);
                } finally {
                    inFlight.delete(key);
                    restoreUi();
                }
            };
            Object.defineProperty(wrapped, '__radarCriticalActionGuard', { value: true });
            Object.defineProperty(wrapped, '__radarCriticalActionOriginal', { value: original });
            root[name] = wrapped;
            return true;
        }

        return Object.freeze({ wrap, inFlight });
    }

    function install(root) {
        if (!root || root[INSTALL_FLAG]) return Boolean(root?.[INSTALL_FLAG]);
        const guard = createGuard(root);

        guard.wrap('confirmarRegistrarNovoEnvio', {
            key: currentRoot => `pendency:submission:${hiddenValue(currentRoot, 'envio-pendencia-id')}`,
            form: currentRoot => currentRoot.document?.getElementById?.('form-registrar-envio') || null,
            busyLabel: 'Registrando…'
        });
        guard.wrap('confirmarReanalisePendencia', {
            key: currentRoot => `pendency:reanalyze:${hiddenValue(currentRoot, 'reanalisar-pendencia-id')}`,
            form: currentRoot => currentRoot.document?.getElementById?.('form-reanalisar-pendencia') || null,
            busyLabel: 'Reanalisando…'
        });
        guard.wrap('encaminharCapital', {
            key: (_currentRoot, args) => `inventory:forward:${text(args[0])}`
        });
        guard.wrap('salvarInventariacao', {
            key: currentRoot => `inventory:complete:${hiddenValue(currentRoot, 'inventario-bem-id')}`,
            form: currentRoot => currentRoot.document?.getElementById?.('form-inventario-confirm') || null,
            busyLabel: 'Inventariando…'
        });

        Object.defineProperty(root, INSTALL_FLAG, { value: guard, configurable: true });
        return true;
    }

    return Object.freeze({
        createGuard,
        install,
        setFormBusy
    });
}));
