'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ROLE_TO_OPERATIONAL_PROFILE,
    operationalProfileForRole,
    isTechnicalRole,
    AuthGate
} = require('../../src/integration/auth-gate.js');

test('mapeia os quatro perfis funcionais e identifica o administrador técnico', () => {
    assert.deepEqual(ROLE_TO_OPERATIONAL_PROFILE, {
        controller: 'controlador',
        federal_assistant: 'assistente',
        inventory: 'inventario',
        sme_management: 'sme'
    });
    Object.entries(ROLE_TO_OPERATIONAL_PROFILE).forEach(([role, profile]) => {
        assert.equal(operationalProfileForRole(role), profile);
    });
    assert.equal(isTechnicalRole('technical_admin'), true);
    assert.equal(isTechnicalRole('federal_assistant'), false);
    assert.throws(() => operationalProfileForRole('technical_admin'), /técnico|operacional/i);
    assert.throws(() => operationalProfileForRole('unknown'), /perfil/i);
});

test('administrador técnico recebe a interface operacional completa e o seletor de perfis', () => {
    const calls = [];
    const main = { innerHTML: '' };
    const sidebarStyles = new Map();
    const appStyles = new Map();
    const searchStyles = new Map();
    const switcherStyles = new Map();
    const createElement = styleValues => ({
        hidden: true,
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        style: {
            setProperty(name, value, priority) { styleValues.set(name, { value, priority }); },
            removeProperty(name) { styleValues.delete(name); }
        }
    });
    const sidebar = createElement(sidebarStyles);
    const search = createElement(searchStyles);
    const switcher = createElement(switcherStyles);
    const app = {
        inert: true,
        style: {
            setProperty(name, value, priority) { appStyles.set(name, { value, priority }); },
            removeProperty(name) { appStyles.delete(name); }
        }
    };
    const document = {
        body: { dataset: {} },
        documentElement: { classList: { remove() {} } },
        getElementById(id) {
            if (id === 'main-container') return main;
            if (id === 'app-layout') return app;
            if (id === 'profile-btn-label') return { textContent: '' };
            if (id === 'radar-auth-status') return { textContent: '', dataset: {} };
            return null;
        },
        querySelector(selector) {
            if (selector === '.sidebar') return sidebar;
            if (selector === '.search-bar-container') return search;
            if (selector === '.profile-switcher') return switcher;
            return null;
        }
    };
    const root = {
        RADAR_PDDE_CONFIG: { supabase: { connectionEnabled: true } },
        switchProfile(profile) { calls.push(profile); }
    };
    const gate = new AuthGate({ root, document });

    const result = gate.applyAuthorization({
        user: { id: 'admin-1', email: 'admin@radar.test' },
        authorization: {
            role: 'technical_admin',
            profile: { label: 'Administrador técnico' }
        }
    });

    assert.equal(result, 'controlador');
    assert.deepEqual(calls, ['controlador']);
    assert.equal(document.body.dataset.authRole, 'technical_admin');
    assert.doesNotMatch(main.innerHTML, /acesso técnico/i);
    assert.equal(sidebar.hidden, false);
    assert.equal(sidebar.attributes['aria-hidden'], 'false');
    assert.equal(sidebarStyles.has('display'), false);
    assert.equal(search.hidden, false);
    assert.equal(searchStyles.has('display'), false);
    assert.equal(switcher.hidden, false);
    assert.equal(switcher.attributes['aria-hidden'], 'false');
    assert.equal(switcherStyles.has('display'), false);
    assert.equal(appStyles.has('grid-template-columns'), false);
    assert.equal(app.inert, false);
});

test('usuário operacional recebe apenas o próprio perfil e não vê o seletor de simulação', () => {
    const calls = [];
    const switcherStyles = new Map();
    const switcher = {
        hidden: false,
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        style: {
            setProperty(name, value, priority) { switcherStyles.set(name, { value, priority }); },
            removeProperty(name) { switcherStyles.delete(name); }
        }
    };
    const app = { inert: true, style: { removeProperty() {}, setProperty() {} } };
    const document = {
        body: { dataset: {} },
        documentElement: { classList: { remove() {} } },
        getElementById(id) {
            if (id === 'app-layout') return app;
            if (id === 'profile-btn-label') return { textContent: '' };
            if (id === 'radar-auth-status') return { textContent: '', dataset: {} };
            return null;
        },
        querySelector(selector) {
            if (selector === '.profile-switcher') return switcher;
            return null;
        }
    };
    const root = {
        RADAR_PDDE_CONFIG: { supabase: { connectionEnabled: true } },
        switchProfile(profile) { calls.push(profile); }
    };
    const gate = new AuthGate({ root, document });

    const result = gate.applyAuthorization({
        user: { id: 'assistant-1', email: 'assistant@radar.test' },
        authorization: {
            role: 'federal_assistant',
            profile: { label: 'Assistente de Verbas Federais' }
        }
    });

    assert.equal(result, 'assistente');
    assert.deepEqual(calls, ['assistente']);
    assert.equal(switcher.hidden, true);
    assert.equal(switcher.attributes['aria-hidden'], 'true');
    assert.deepEqual(switcherStyles.get('display'), { value: 'none', priority: 'important' });
});
