(function initRadarMobileNavigation(root) {
    'use strict';

    if (!root || !root.document || root.__RADAR_MOBILE_NAVIGATION__) return;
    root.__RADAR_MOBILE_NAVIGATION__ = true;

    const MOBILE_QUERY = '(max-width: 900px)';
    const ORIGINAL_LOGO_DATA_FILES = [
        'src/assets/logo-original/part-1.js',
        'src/assets/logo-original/part-2.js',
        'src/assets/logo-original/part-3.js',
        'src/assets/logo-original/part-4.js',
        'src/assets/logo-original/bundle-5-8.js',
        'src/assets/logo-original/bundle-9-12.js',
        'src/assets/logo-original/bundle-13-16.js',
        'src/assets/logo-original/bundle-17-20.js'
    ];
    const ORIGINAL_LOGO_ALT = 'RADAR PDDE — Registro de Acompanhamento das Demandas, Análises e Regularizações do PDDE';

    function ensureOriginalBrandStyles(document) {
        if (document.getElementById('radar-original-brand-styles')) return;

        const style = document.createElement('style');
        style.id = 'radar-original-brand-styles';
        style.textContent = `
            .radar-auth-brand::before,
            .radar-auth-brand::after,
            .sidebar-logo::before {
                content: none !important;
                display: none !important;
            }

            .radar-auth-brand {
                display: flex !important;
                width: 100% !important;
                min-height: 120px;
                margin: 0 0 24px !important;
                padding: 0 !important;
                align-items: center !important;
                justify-content: center !important;
                background: transparent !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                color: transparent !important;
                font-size: 0 !important;
                line-height: 0 !important;
                letter-spacing: 0 !important;
                overflow: hidden;
            }

            .radar-auth-brand > :not(.radar-original-logo) {
                display: none !important;
            }

            .radar-original-logo {
                display: block;
                width: 100%;
                height: auto;
                object-fit: contain;
                object-position: center;
                border: 0;
                border-radius: 0;
                background: transparent;
                box-shadow: none;
                filter: none;
            }

            .radar-auth-brand .radar-original-logo {
                max-width: 500px;
            }

            .sidebar-logo {
                position: relative;
                display: flex !important;
                width: 100%;
                min-height: 84px;
                margin-bottom: 24px !important;
                padding: 0 8px !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 0 !important;
                overflow: visible;
            }

            .sidebar-logo > svg,
            .sidebar-logo > div:not(.radar-original-logo-shell) {
                display: none !important;
            }

            .radar-original-logo-shell {
                display: block;
                width: 100%;
                max-width: 220px;
                line-height: 0;
            }

            .sidebar-logo .radar-original-logo {
                width: 100%;
                max-width: 220px;
            }

            @media (max-width: 900px) {
                .sidebar-logo {
                    min-height: 92px;
                    padding-right: 58px !important;
                }

                .radar-original-logo-shell,
                .sidebar-logo .radar-original-logo {
                    max-width: 230px;
                }

                .mobile-sidebar-close {
                    position: absolute !important;
                    top: 50% !important;
                    right: 8px !important;
                    transform: translateY(-50%);
                    margin: 0 !important;
                    flex: 0 0 auto;
                }
            }

            @media (max-width: 480px) {
                .radar-auth-brand {
                    min-height: 92px;
                    margin-bottom: 20px !important;
                }

                .radar-auth-brand .radar-original-logo {
                    max-width: 420px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function loadScript(document, src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[data-radar-logo-source="${src}"]`);
            if (existing?.dataset.loaded === 'true') {
                resolve();
                return;
            }
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = `${src}?v=20260720-original-logo-1`;
            script.async = false;
            script.dataset.radarLogoSource = src;
            script.addEventListener('load', () => {
                script.dataset.loaded = 'true';
                resolve();
            }, { once: true });
            script.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)), { once: true });
            document.head.appendChild(script);
        });
    }

    async function getOriginalLogoDataUrl(document) {
        if (root.__RADAR_PDDE_ORIGINAL_LOGO_DATA_URL__) {
            return root.__RADAR_PDDE_ORIGINAL_LOGO_DATA_URL__;
        }

        root.RADAR_PDDE_LOGO_PARTS = [];
        for (const src of ORIGINAL_LOGO_DATA_FILES) {
            await loadScript(document, src);
        }

        const parts = root.RADAR_PDDE_LOGO_PARTS;
        if (!Array.isArray(parts) || parts.length !== 20 || parts.some(part => typeof part !== 'string' || !part.length)) {
            throw new Error('A imagem original do RADAR PDDE não foi carregada integralmente.');
        }

        const dataUrl = `data:image/webp;base64,${parts.join('')}`;
        root.__RADAR_PDDE_ORIGINAL_LOGO_DATA_URL__ = dataUrl;
        return dataUrl;
    }

    function createOriginalLogoImage(document, dataUrl) {
        const image = document.createElement('img');
        image.className = 'radar-original-logo';
        image.src = dataUrl;
        image.alt = ORIGINAL_LOGO_ALT;
        image.width = 1235;
        image.height = 499;
        image.decoding = 'async';
        image.draggable = false;
        return image;
    }

    function applyOriginalBrand(document, dataUrl) {
        const authBrand = document.querySelector('.radar-auth-brand');
        if (authBrand) {
            authBrand.replaceChildren(createOriginalLogoImage(document, dataUrl));
            authBrand.removeAttribute('aria-hidden');
        }

        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            const closeButton = sidebarLogo.querySelector('.mobile-sidebar-close');
            const shell = document.createElement('div');
            shell.className = 'radar-original-logo-shell';
            shell.appendChild(createOriginalLogoImage(document, dataUrl));
            sidebarLogo.replaceChildren(shell);
            if (closeButton) sidebarLogo.appendChild(closeButton);
        }
    }

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

        getOriginalLogoDataUrl(document)
            .then(dataUrl => applyOriginalBrand(document, dataUrl))
            .catch(error => console.error('[RADAR PDDE] Falha ao aplicar o logo original.', error));

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

    ensureOriginalBrandStyles(root.document);

    if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
}(typeof window !== 'undefined' ? window : globalThis));
