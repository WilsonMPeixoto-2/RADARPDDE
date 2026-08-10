(function finalizeRadarControllerGuide(root) {
    'use strict';

    if (!root?.RadarControllerGuide || !root.document) return;

    const baseGuide = root.RadarControllerGuide;

    function isGuideNavigationTarget(target) {
        return Boolean(target?.closest?.('#nav-guia-controlador'));
    }

    function forceGuideVisible() {
        const item = root.document.querySelector('#nav-guia-controlador');
        if (!item) return false;
        item.style.display = '';
        item.setAttribute('aria-hidden', 'false');
        return true;
    }

    function renderForAnyProfile() {
        const originalAccessProfile = root.getRadarAccessProfile;
        const role = root.document.querySelector('#current-user-role');
        const originalRole = role?.textContent;
        let resolverOverridden = false;

        try {
            if (typeof originalAccessProfile === 'function') {
                root.getRadarAccessProfile = () => 'controlador';
                resolverOverridden = root.getRadarAccessProfile !== originalAccessProfile;
            } else if (role) {
                role.textContent = 'Controlador';
            }
            return baseGuide.render?.();
        } finally {
            if (resolverOverridden) root.getRadarAccessProfile = originalAccessProfile;
            if (typeof originalAccessProfile !== 'function' && role && originalRole != null) {
                role.textContent = originalRole;
            }
            forceGuideVisible();
        }
    }

    function installForAllProfiles() {
        baseGuide.install?.();
        forceGuideVisible();
        return true;
    }

    root.RadarControllerGuide = Object.freeze({
        ...baseGuide,
        install: installForAllProfiles,
        render: renderForAnyProfile,
        isAvailable: () => true
    });

    function openGuide(event) {
        if (!isGuideNavigationTarget(event.target)) return;
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        root.RadarControllerGuide.render();
    }

    function bindDirectEntry() {
        if (root.__radarControllerGuideDirectEntryInstalled) return;
        root.document.addEventListener('click', openGuide, true);
        root.document.addEventListener('keydown', openGuide, true);
        root.__radarControllerGuideDirectEntryInstalled = true;
    }

    function keepVisibleAcrossProfileChanges() {
        if (typeof root.switchProfile === 'function' && !root.switchProfile.__radarGuideAllProfilesWrapped) {
            const previousSwitchProfile = root.switchProfile;
            const wrapped = function switchProfileWithGuideAvailable() {
                const result = previousSwitchProfile.apply(this, arguments);
                root.setTimeout(forceGuideVisible, 0);
                return result;
            };
            wrapped.__radarGuideAllProfilesWrapped = true;
            wrapped.__radarGuideAllProfilesBase = previousSwitchProfile;
            root.switchProfile = wrapped;
        }

        const role = root.document.querySelector('#current-user-role');
        if (role && typeof MutationObserver === 'function' && !root.__radarGuideAllProfilesObserver) {
            const observer = new MutationObserver(() => root.setTimeout(forceGuideVisible, 0));
            observer.observe(role, { childList: true, subtree: true, characterData: true });
            root.__radarGuideAllProfilesObserver = observer;
        }

        root.addEventListener('radar:auth-ready', () => root.setTimeout(forceGuideVisible, 0));
    }

    Promise.resolve(root.RadarNavigationContextReady)
        .catch(() => false)
        .then(() => {
            root.RadarControllerGuide.install();
            bindDirectEntry();
            keepVisibleAcrossProfileChanges();
            forceGuideVisible();
        });
}(typeof window !== 'undefined' ? window : globalThis));
