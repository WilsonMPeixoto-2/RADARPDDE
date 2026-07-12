(function initRadarMobileNavigation(root) {
    'use strict';

    if (!root || !root.document || root.__RADAR_MOBILE_NAVIGATION__) return;
    root.__RADAR_MOBILE_NAVIGATION__ = true;

    const MOBILE_QUERY = '(max-width: 900px)';

    function initialize() {
        const document = root.document;
        const sidebar = document.querySelector('aside.sidebar');
        const header = document.querySelector('header.top-header');

        if (!sidebar || !header) return;

        const mediaQuery = root.matchMedia(MOBILE_QUERY);
        let lastFocusedElement = null;

        sidebar.id = sidebar.id || 'radar-primary-navigation';
        sidebar.setAttribute('aria-label', 'Navegação principal');

        const menuButton = document.createElement('button');
        menuButton.type = 'button';
        menuButton.id = 'mobile-menu-button';
        menuButton.className = 'mobile-menu-button';
        menuButton.setAttribute('aria-controls', sidebar.id);
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Abrir menu de navegação');
        menuButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="17" x2="20" y2="17"></line>
            </svg>
            <span>Menu</span>
        `;
        header.insertBefore(menuButton, header.firstChild);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'mobile-sidebar-close';
        closeButton.setAttribute('aria-label', 'Fechar menu de navegação');
        closeButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18"></line>
                <line x1="18" y1="6" x2="6" y2="18"></line>
            </svg>
        `;
        const sidebarLogo = sidebar.querySelector('.sidebar-logo');
        if (sidebarLogo) sidebarLogo.appendChild(closeButton);

        const overlay = document.createElement('button');
        overlay.type = 'button';
        overlay.className = 'mobile-sidebar-overlay';
        overlay.setAttribute('aria-label', 'Fechar menu de navegação');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);

        function wrapResponsiveTables(scope) {
            if (!scope) return;

            const tables = [];
            if (scope.nodeType === 1 && scope.matches('table.data-table')) tables.push(scope);
            if (typeof scope.querySelectorAll === 'function') {
                tables.push(...scope.querySelectorAll('table.data-table'));
            }

            tables.forEach(table => {
                if (!table.parentElement || table.parentElement.classList.contains('table-responsive')) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive mobile-generated-table-wrapper';
                wrapper.setAttribute('role', 'region');
                wrapper.setAttribute('aria-label', 'Tabela com rolagem horizontal');
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            });
        }

        wrapResponsiveTables(document);
        const mainContainer = document.querySelector('#main-container');
        if (mainContainer) {
            const tableObserver = new MutationObserver(records => {
                records.forEach(record => {
                    record.addedNodes.forEach(node => wrapResponsiveTables(node));
                });
            });
            tableObserver.observe(mainContainer, { childList: true, subtree: true });
        }

        function isOpen() {
            return sidebar.classList.contains('mobile-open');
        }

        function updateAccessibility() {
            const isMobile = mediaQuery.matches;
            sidebar.setAttribute('aria-hidden', isMobile && !isOpen() ? 'true' : 'false');
            menuButton.setAttribute('aria-expanded', String(isOpen()));
            menuButton.setAttribute('aria-label', isOpen() ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
            overlay.setAttribute('aria-hidden', String(!isOpen()));
        }

        function openMenu() {
            if (!mediaQuery.matches || isOpen()) return;
            lastFocusedElement = menuButton;
            sidebar.classList.add('mobile-open');
            overlay.classList.add('is-visible');
            document.body.classList.add('mobile-nav-open');
            updateAccessibility();

            root.requestAnimationFrame(() => {
                const firstVisibleItem = Array.from(sidebar.querySelectorAll('.nav-item'))
                    .find(item => root.getComputedStyle(item).display !== 'none');
                if (firstVisibleItem) {
                    firstVisibleItem.setAttribute('tabindex', '-1');
                    firstVisibleItem.focus({ preventScroll: true });
                } else {
                    closeButton.focus({ preventScroll: true });
                }
            });
        }

        function restoreMenuButtonFocus(focusTarget) {
            const applyFocus = () => {
                if (!focusTarget || !focusTarget.isConnected) return;
                try {
                    focusTarget.focus({ preventScroll: true });
                } catch (error) {
                    focusTarget.focus();
                }
            };
            root.requestAnimationFrame(() => {
                root.requestAnimationFrame(applyFocus);
            });
            root.setTimeout(applyFocus, 50);
        }

        function closeMenu(options) {
            const settings = Object.assign({ restoreFocus: true }, options);
            if (!isOpen()) {
                updateAccessibility();
                return;
            }

            const focusTarget = lastFocusedElement && typeof lastFocusedElement.focus === 'function'
                ? lastFocusedElement
                : menuButton;
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('is-visible');
            document.body.classList.remove('mobile-nav-open');
            updateAccessibility();

            if (settings.restoreFocus) restoreMenuButtonFocus(focusTarget);
        }

        function toggleMenu() {
            if (isOpen()) closeMenu();
            else openMenu();
        }

        menuButton.addEventListener('click', toggleMenu);
        closeButton.addEventListener('click', () => closeMenu());
        overlay.addEventListener('click', () => closeMenu());

        sidebar.addEventListener('click', event => {
            if (event.target.closest('.nav-item') && mediaQuery.matches) {
                closeMenu({ restoreFocus: false });
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && isOpen()) {
                event.preventDefault();
                event.stopPropagation();
                closeMenu();
            }
        });

        mediaQuery.addEventListener('change', event => {
            if (!event.matches) closeMenu({ restoreFocus: false });
            updateAccessibility();
        });

        root.addEventListener('pageshow', updateAccessibility);
        updateAccessibility();
    }

    if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
}(typeof window !== 'undefined' ? window : globalThis));
