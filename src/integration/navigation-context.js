(function installRadarNavigationContext(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarNavigationContext = Object.freeze(api);
        if (root.document) api.install(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationContextApi() {
    'use strict';

    const STORAGE_KEY = 'radar_pdde_navigation_return_context_v1';
    const MAX_STACK_SIZE = 12;
    const MAX_FOCUS_RESTORE_FRAMES = 30;
    const CONTEXTUAL_VIEWS = new Set(['prontuario', 'pendencias']);
    const VIEW_LABELS = Object.freeze({
        dashboard: 'Dashboard',
        escolas: 'Carteira',
        competencias: 'Competências',
        pendencias: 'Pendências',
        inventario: 'Inventário',
        auditoria: 'Registros internos',
        equipe: 'Gestão de equipe',
        'sme-config': 'Configurações SME',
        prontuario: 'Prontuário'
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function safeStorage(storage) {
        return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
            ? storage
            : null;
    }

    function normalizeFilters(filters) {
        const result = {};
        if (!filters || typeof filters !== 'object') return result;
        Object.entries(filters).forEach(([key, value]) => {
            const normalizedKey = text(key);
            const normalizedValue = text(value);
            if (normalizedKey && normalizedValue) result[normalizedKey] = normalizedValue;
        });
        return result;
    }

    function normalizeRoute(route = {}) {
        return {
            view: text(route.view) || 'dashboard',
            param: text(route.param) || null,
            section: text(route.section) || null,
            filters: normalizeFilters(route.filters)
        };
    }

    function normalizeFocus(focus = {}) {
        return {
            id: text(focus.id),
            schoolId: text(focus.schoolId),
            pendencyRef: text(focus.pendencyRef),
            action: text(focus.action)
        };
    }

    function createReturnContext(input = {}) {
        const context = {
            version: 1,
            capturedAt: text(input.capturedAt) || new Date().toISOString(),
            origin: normalizeRoute(input.origin),
            target: normalizeRoute(input.target),
            competenceKey: text(input.competenceKey),
            scrollY: Math.max(0, Number.isFinite(Number(input.scrollY)) ? Number(input.scrollY) : 0),
            focus: normalizeFocus(input.focus)
        };
        const scrollTarget = text(input.scrollTarget);
        if (scrollTarget) context.scrollTarget = scrollTarget;
        return context;
    }

    function readStack(storage) {
        const target = safeStorage(storage);
        if (!target) return [];
        try {
            const parsed = JSON.parse(target.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(item => item && item.version === 1 && item.origin && item.target)
                .map(createReturnContext)
                .slice(-MAX_STACK_SIZE);
        } catch (_error) {
            return [];
        }
    }

    function writeStack(storage, stack) {
        const target = safeStorage(storage);
        if (!target) return false;
        const normalized = (Array.isArray(stack) ? stack : [])
            .map(createReturnContext)
            .slice(-MAX_STACK_SIZE);
        if (normalized.length === 0) target.removeItem?.(STORAGE_KEY);
        else target.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return true;
    }

    function pushReturnContext(storage, context) {
        const stack = readStack(storage);
        const normalized = createReturnContext(context);
        const previous = stack.at(-1);
        const sameTransition = previous
            && JSON.stringify(previous.origin) === JSON.stringify(normalized.origin)
            && JSON.stringify(previous.target) === JSON.stringify(normalized.target);
        if (sameTransition) stack[stack.length - 1] = normalized;
        else stack.push(normalized);
        writeStack(storage, stack);
        return normalized;
    }

    function peekReturnContext(storage) {
        return readStack(storage).at(-1) || null;
    }

    function popReturnContext(storage) {
        const stack = readStack(storage);
        const context = stack.pop() || null;
        writeStack(storage, stack);
        return context;
    }

    function shouldCaptureTransition(origin, target) {
        const from = normalizeRoute(origin);
        const to = normalizeRoute(target);
        return CONTEXTUAL_VIEWS.has(to.view) && from.view !== to.view;
    }

    function schoolIdFromElement(element, root) {
        const direct = text(element?.dataset?.schoolId);
        if (direct) return direct;
        const href = text(element?.getAttribute?.('href'));
        if (!href) return '';
        try {
            const url = new URL(href, root?.location?.href || 'https://radar.invalid/');
            const match = /^\/escolas\/([^/]+)(?:\/pendencias)?$/.exec(url.pathname);
            return match ? decodeURIComponent(match[1]) : '';
        } catch (_error) {
            return '';
        }
    }

    function captureFocus(root, sourceElement = null) {
        const element = sourceElement || root?.document?.activeElement;
        if (!element || element === root?.document?.body) return normalizeFocus();
        return normalizeFocus({
            id: element.id,
            schoolId: schoolIdFromElement(element, root),
            pendencyRef: element.dataset?.pendencyRef,
            action: element.dataset?.action
        });
    }

    function currentCompetence(root) {
        try {
            if (root?.RadarCompetenceContext?.isInitialized?.()) {
                return text(root.RadarCompetenceContext.getState().activeKey);
            }
        } catch (_error) {
            return '';
        }
        return '';
    }

    function contentScrollPort(root) {
        const candidate = root?.document?.querySelector?.('main.content-area');
        if (!candidate) return null;
        const scrollTop = Number(candidate.scrollTop) || 0;
        const scrollHeight = Number(candidate.scrollHeight) || 0;
        const clientHeight = Number(candidate.clientHeight) || 0;
        return scrollTop > 0 || scrollHeight > clientHeight ? candidate : null;
    }

    function captureScrollState(root) {
        const contentArea = contentScrollPort(root);
        if (contentArea) {
            return {
                scrollTarget: 'content-area',
                scrollY: Math.max(0, Number(contentArea.scrollTop) || 0)
            };
        }
        const documentTop = Number(root?.document?.scrollingElement?.scrollTop) || 0;
        return {
            scrollTarget: 'window',
            scrollY: Math.max(0, Number(root?.scrollY) || documentTop)
        };
    }

    function captureContext(root, origin, target, sourceElement = null) {
        const scroll = captureScrollState(root);
        return createReturnContext({
            origin,
            target,
            competenceKey: currentCompetence(root),
            scrollTarget: scroll.scrollTarget,
            scrollY: scroll.scrollY,
            focus: captureFocus(root, sourceElement)
        });
    }

    function isVisibleFocusCandidate(element, root) {
        if (!element || element.hidden || element.disabled) return false;
        if (element.getAttribute?.('aria-hidden') === 'true') return false;
        if (element.closest?.('[hidden], [aria-hidden="true"]')) return false;
        if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) {
            return false;
        }
        const style = typeof root?.getComputedStyle === 'function'
            ? root.getComputedStyle(element)
            : null;
        return !style || (style.display !== 'none' && style.visibility !== 'hidden');
    }

    function findFocusTarget(root, focus) {
        const document = root?.document;
        if (!document) return null;
        if (focus.id) {
            const byId = document.getElementById?.(focus.id);
            if (isVisibleFocusCandidate(byId, root)) return byId;
        }
        const candidates = Array.from(document.querySelectorAll?.(
            '[data-school-id], [data-pendency-ref], [data-action], a[data-radar-route="true"]'
        ) || []).filter(item => isVisibleFocusCandidate(item, root));
        if (focus.pendencyRef) {
            const byPendency = candidates.find(item => text(item.dataset?.pendencyRef) === focus.pendencyRef);
            if (byPendency) return byPendency;
        }
        if (focus.action) {
            const byAction = candidates.find(item => text(item.dataset?.action) === focus.action);
            if (byAction) return byAction;
        }
        if (focus.schoolId) {
            return candidates.find(item => schoolIdFromElement(item, root) === focus.schoolId) || null;
        }
        return null;
    }

    function nextFrame(root) {
        return new Promise(resolve => {
            const frame = typeof root?.requestAnimationFrame === 'function'
                ? root.requestAnimationFrame.bind(root)
                : callback => setTimeout(callback, 0);
            frame(resolve);
        });
    }

    async function afterRender(root) {
        await nextFrame(root);
        await nextFrame(root);
    }

    function restoreCompetence(root, competenceKey) {
        const key = text(competenceKey);
        const context = root?.RadarCompetenceContext;
        if (!key || !context?.isInitialized?.()) return false;
        const state = context.getState();
        if (state.activeKey === key) return true;
        const exercise = key.slice(0, 4);
        if (state.exercise !== exercise && typeof context.selectExercise === 'function') {
            context.selectExercise(exercise, {
                initialCompetence: key,
                source: 'contextual-return'
            });
            return true;
        }
        context.select(key, { source: 'contextual-return' });
        return true;
    }

    function restoreScrollState(root, context) {
        const top = Math.max(0, Number(context?.scrollY) || 0);
        if (context?.scrollTarget === 'content-area') {
            const contentArea = root?.document?.querySelector?.('main.content-area');
            if (contentArea) {
                if (typeof contentArea.scrollTo === 'function') {
                    contentArea.scrollTo({ top, left: 0, behavior: 'auto' });
                } else {
                    contentArea.scrollTop = top;
                }
                return true;
            }
        }
        root?.scrollTo?.({ top, left: 0, behavior: 'auto' });
        return true;
    }

    async function restoreFocus(root, focus) {
        const document = root?.document;
        const canVerify = Boolean(document && 'activeElement' in document);
        let focused = false;

        for (let attempt = 0; attempt < MAX_FOCUS_RESTORE_FRAMES; attempt += 1) {
            const target = findFocusTarget(root, focus || {});
            if (target && (!canVerify || document.activeElement !== target)) {
                target.focus?.({ preventScroll: true });
                focused = true;
                if (!canVerify) return true;
            }
            await nextFrame(root);
        }

        if (!canVerify) return focused;
        const finalTarget = findFocusTarget(root, focus || {});
        if (finalTarget && document.activeElement !== finalTarget) {
            finalTarget.focus?.({ preventScroll: true });
            await nextFrame(root);
        }
        return Boolean(finalTarget && document.activeElement === finalTarget);
    }

    async function restoreViewport(root, context) {
        restoreScrollState(root, context);
        await restoreFocus(root, context.focus || {});
        restoreScrollState(root, context);
    }

    function navigate(root, route) {
        if (root?.RadarNavigationHistory?.navigate) {
            return root.RadarNavigationHistory.navigate(root, normalizeRoute(route));
        }
        root?.switchView?.(route.view, route.param);
        return normalizeRoute(route);
    }

    async function returnToOrigin(root) {
        const storage = root?.sessionStorage;
        const context = popReturnContext(storage);
        root.__radarContextualNavigationRestoring = true;
        try {
            if (context) {
                restoreCompetence(root, context.competenceKey);
                navigate(root, context.origin);
                await afterRender(root);
                await restoreViewport(root, context);
                ensureBackButton(root);
                return context;
            }
            const fallbackRoute = normalizeRoute({ view: 'escolas' });
            navigate(root, fallbackRoute);
            await afterRender(root);
            const fallbackContext = {
                scrollTarget: contentScrollPort(root) ? 'content-area' : 'window',
                scrollY: 0
            };
            restoreScrollState(root, fallbackContext);
            ensureBackButton(root);
            return { fallback: true, origin: fallbackRoute };
        } finally {
            root.__radarContextualNavigationRestoring = false;
        }
    }

    function currentRoute(root) {
        return root?.RadarNavigationHistory?.currentRoute?.(root) || normalizeRoute({ view: 'dashboard' });
    }

    function routeLabel(route) {
        return VIEW_LABELS[normalizeRoute(route).view] || 'tela anterior';
    }

    function ensureBackButton(root) {
        const document = root?.document;
        if (!document) return false;
        const route = currentRoute(root);
        const existing = document.querySelector?.('[data-radar-contextual-back="true"]');
        if (!CONTEXTUAL_VIEWS.has(route.view)) {
            existing?.remove?.();
            return false;
        }
        const header = document.querySelector?.('#main-container .page-header');
        if (!header) return false;
        const context = peekReturnContext(root.sessionStorage);
        const label = context ? routeLabel(context.origin) : 'Carteira';
        const ariaLabel = `Voltar para ${label}`;
        const buttonText = `← Voltar para ${label}`;
        const button = existing || document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm radar-contextual-back';
        button.dataset.radarContextualBack = 'true';
        if (button.getAttribute?.('aria-label') !== ariaLabel) {
            button.setAttribute('aria-label', ariaLabel);
        }
        if (button.textContent !== buttonText) {
            button.textContent = buttonText;
        }
        button.style.alignSelf = 'flex-start';
        button.style.flexShrink = '0';
        if (!existing) {
            button.addEventListener('click', () => {
                returnToOrigin(root).catch(error => {
                    root.RADAR_LAST_CONTEXTUAL_NAVIGATION_ERROR = error;
                    console.error('Não foi possível restaurar a navegação contextual.', error);
                });
            });
            header.prepend(button);
        }
        return true;
    }

    function targetRouteFromLink(root, anchor) {
        if (!anchor || !root?.RadarNavigationRoutes?.parseRoute) return null;
        try {
            const url = new URL(anchor.href, root.location?.href || undefined);
            const parsed = root.RadarNavigationRoutes.parseRoute(url.pathname, url.search);
            return parsed?.valid ? normalizeRoute(parsed) : null;
        } catch (_error) {
            return null;
        }
    }

    function scheduleEnsure(root) {
        const frame = typeof root?.requestAnimationFrame === 'function'
            ? root.requestAnimationFrame.bind(root)
            : callback => setTimeout(callback, 0);
        frame(() => ensureBackButton(root));
    }

    function install(root) {
        if (!root || root.__radarNavigationContextInstalled) return false;
        if (!root.document || !root.RadarNavigationHistory || typeof root.switchView !== 'function') {
            return false;
        }

        const originalSwitchView = root.switchView.bind(root);
        root.switchView = function switchViewWithContext(view, param = null) {
            const origin = currentRoute(root);
            const target = normalizeRoute({ view, param });
            if (!root.__radarContextualNavigationRestoring && shouldCaptureTransition(origin, target)) {
                pushReturnContext(root.sessionStorage, captureContext(root, origin, target));
            }
            const result = originalSwitchView(view, param);
            scheduleEnsure(root);
            return result;
        };

        root.document.addEventListener('click', event => {
            const anchor = event.target?.closest?.('a[data-radar-route="true"]');
            if (!anchor || root.__radarContextualNavigationRestoring) return;
            const origin = currentRoute(root);
            const target = targetRouteFromLink(root, anchor);
            if (target && shouldCaptureTransition(origin, target)) {
                pushReturnContext(root.sessionStorage, captureContext(root, origin, target, anchor));
                scheduleEnsure(root);
            }
        }, true);

        const container = root.document.getElementById?.('main-container');
        if (container && typeof root.MutationObserver === 'function') {
            const observer = new root.MutationObserver(() => ensureBackButton(root));
            observer.observe(container, { childList: true, subtree: true });
            root.__radarNavigationContextObserver = observer;
        }

        root.returnToRadarOrigin = () => returnToOrigin(root);
        root.__radarNavigationContextInstalled = true;
        scheduleEnsure(root);
        return true;
    }

    return Object.freeze({
        STORAGE_KEY,
        MAX_STACK_SIZE,
        MAX_FOCUS_RESTORE_FRAMES,
        CONTEXTUAL_VIEWS,
        normalizeRoute,
        createReturnContext,
        pushReturnContext,
        peekReturnContext,
        popReturnContext,
        shouldCaptureTransition,
        captureScrollState,
        captureContext,
        restoreCompetence,
        restoreScrollState,
        isVisibleFocusCandidate,
        returnToOrigin,
        ensureBackButton,
        install
    });
}));