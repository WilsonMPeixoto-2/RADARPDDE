(function installPainelControladorExpressiva(root) {
    'use strict';

    function loadIntegration(src) {
        if (document.querySelector(`script[data-radar-session-extension="${src}"]`)) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.dataset.radarSessionExtension = src;
        document.head.appendChild(script);
    }

    loadIntegration('src/integration/controller-session-context.js');
    loadIntegration('src/integration/navigation-history.js');

    const CARD_KINDS = ['scope', 'bonus', 'open', 'review', 'assets'];
    let scheduled = false;

    function activeCardLabel(cards) {
        const selected = cards.find(card => card.getAttribute('aria-pressed') === 'true');
        const label = selected?.querySelector('.stat-label')?.textContent?.trim();
        return label || 'Escolas no escopo';
    }

    function enhanceDashboard() {
        const cards = Array.from(document.querySelectorAll('#main-container .cycle-b-dashboard-card'));
        const isControllerDashboard = cards.length === CARD_KINDS.length
            && cards.some(card => card.getAttribute('aria-label')?.startsWith('Escolas no escopo:'));
        document.body.classList.toggle('radar-expressiva-institucional', isControllerDashboard);
        if (!isControllerDashboard) return;

        const pageTitle = document.querySelector('#main-container .page-title');
        if (pageTitle && !pageTitle.querySelector('.radar-page-eyebrow')) {
            const eyebrow = document.createElement('span');
            eyebrow.className = 'radar-page-eyebrow';
            eyebrow.textContent = 'Operação · Carteira';
            pageTitle.insertBefore(eyebrow, pageTitle.firstChild);
        }

        cards.forEach((card, index) => {
            card.dataset.radarCard = CARD_KINDS[index] || 'scope';
            card.setAttribute('aria-describedby', 'cycle-b-overlap-note');

            const existing = card.querySelector('.radar-card-status');
            const selected = card.getAttribute('aria-pressed') === 'true';
            if (selected && !existing) {
                const marker = document.createElement('span');
                marker.className = 'radar-card-status';
                marker.setAttribute('aria-hidden', 'true');
                marker.textContent = 'Ativo';
                card.appendChild(marker);
            } else if (!selected && existing) {
                existing.remove();
            }
        });

        const note = document.getElementById('cycle-b-overlap-note');
        if (note && cards.length) {
            const label = activeCardLabel(cards);
            if (note.dataset.activeLabel !== label) {
                note.dataset.activeLabel = label;
                note.setAttribute('role', 'status');
                note.setAttribute('aria-live', 'polite');
                note.innerHTML = '';

                const caption = document.createElement('span');
                caption.className = 'radar-context-caption';
                caption.textContent = 'Visualização atual';

                const value = document.createElement('strong');
                value.className = 'radar-context-value';
                value.textContent = label;

                const explanation = document.createElement('span');
                explanation.className = 'radar-context-explanation';
                explanation.textContent = 'O mesmo recorte orienta a planilha e as próximas ações. As dimensões podem se sobrepor e não devem ser somadas.';

                note.append(caption, value, explanation);
            }
        }

        const resultPanel = document.querySelector('#main-container .dash-layout > div:first-child .panel-card');
        if (resultPanel) resultPanel.classList.add('radar-result-panel');

        const queuePanel = document.querySelector('#main-container .cycle-b-action-queue');
        if (queuePanel) queuePanel.classList.add('radar-action-panel');
    }

    function scheduleEnhancement() {
        if (scheduled) return;
        scheduled = true;
        root.requestAnimationFrame(() => {
            scheduled = false;
            enhanceDashboard();
        });
    }

    function start() {
        enhanceDashboard();
        const main = document.getElementById('main-container');
        if (!main) return;
        const observer = new MutationObserver(scheduleEnhancement);
        observer.observe(main, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
}(window));