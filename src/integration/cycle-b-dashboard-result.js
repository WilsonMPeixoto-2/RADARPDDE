(function installCycleBDashboardResultContext(root) {
    'use strict';

    let observer = null;

    function activeFilter() {
        return root.RadarCycleBDashboard
            && typeof root.RadarCycleBDashboard.getActiveFilter === 'function'
            ? root.RadarCycleBDashboard.getActiveFilter()
            : 'all';
    }

    function pendencyFilterValue() {
        const filter = activeFilter();
        return ['aberta', 'aguardando'].includes(filter) ? filter : 'all';
    }

    function enhanceResultPanel() {
        if (typeof currentProfile !== 'undefined' && currentProfile !== 'controlador') return false;
        if (typeof currentView !== 'undefined' && currentView !== 'dashboard') return false;

        const panel = document.querySelector('#main-container .dash-layout > div:first-child .panel-card');
        const header = panel && panel.querySelector('.panel-header');
        const listHeading = header && header.querySelector('.dashboard-list-heading');
        if (!panel || !header || !listHeading) return false;

        let title = header.querySelector('.cycle-b-result-title');
        if (!title) {
            title = document.createElement('h2');
            title.className = 'cycle-b-result-title';
            title.textContent = 'Resultado da carteira';
            header.insertBefore(title, listHeading);
        }

        const firstText = listHeading.querySelector('span:first-child');
        if (firstText && !firstText.textContent.startsWith('Escolas e Carteiras')) {
            firstText.textContent = `Escolas e Carteiras · ${firstText.textContent}`;
        }

        let status = header.querySelector('.cycle-b-result-filter-status');
        if (!status) {
            status = document.createElement('div');
            status.className = 'cycle-b-result-filter-status';
            status.innerHTML = `
                <label for="filter-escola-pendencias">Situação do recorte</label>
                <select id="filter-escola-pendencias" class="form-control" aria-readonly="true">
                    <option value="all">Todas</option>
                    <option value="aberta">Pendência aberta</option>
                    <option value="aguardando">Aguardando reanálise</option>
                    <option value="com">Com pendência ativa</option>
                    <option value="sem">Sem pendência ativa</option>
                </select>
            `;
            header.appendChild(status);
            status.querySelector('select').addEventListener('change', event => {
                event.target.value = pendencyFilterValue();
            });
        }
        status.querySelector('select').value = pendencyFilterValue();
        return true;
    }

    function install() {
        if (observer) return true;
        observer = new MutationObserver(() => enhanceResultPanel());
        observer.observe(document.getElementById('main-container') || document.body, {
            childList: true,
            subtree: true
        });
        root.addEventListener('resize', enhanceResultPanel);
        root.RadarCycleBDashboardResult = Object.freeze({
            VERSION: '1.0.0',
            enhance: enhanceResultPanel
        });
        enhanceResultPanel();
        return true;
    }

    install();
}(window));
