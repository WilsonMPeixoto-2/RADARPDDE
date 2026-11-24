'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const dialog = require('../../src/integration/operational-correction-dialog.js');

test('correção integrada permanece desligada sem flag ou repositório remoto', () => {
    assert.equal(dialog.canUse({}), false);
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: { repository: { executeRpc() {}, capabilities: () => ({ remote: false }) } }
    }), false);
});
test('falha de capabilities fecha a disponibilidade sem exceção', () => {
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: {
            repository: { executeRpc() {}, capabilities: () => { throw new Error('Sem conexão'); } }
        }
    }), false);
});
test('flag explícita com RPC remota e cliente libera somente o diálogo', () => {
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: { repository: { executeRpc() {}, capabilities: () => ({ remote: true }) } }
    }), true);
});

test('usa o repositório real publicado em RadarApplicationServices.data', () => {
    const repository = { executeRpc() {}, capabilities: () => ({ remote: true }) };
    const root = {
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarDataContext: Object.freeze({ ready: true, capabilities: { remote: true } }),
        RadarApplicationServices: Object.freeze({ data: { repository } }),
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} }
    };
    assert.equal(dialog.canUse(root), true);
});

test('bonificação T4 só é editável no piloto local ou com release próprio explicitamente ativado', () => {
    const context = {
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarApplicationServices: { data: { repository: {
            executeRpc() {}, capabilities: () => ({ remote: true })
        } } },
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} }
    };
    assert.equal(dialog.canCorrectFiscalBonus({
        ...context,
        RADAR_PDDE_CONFIG: { features: { operationalCorrectionRelease: true } }
    }), false);
    assert.equal(dialog.canCorrectFiscalBonus({
        ...context,
        RADAR_PDDE_CONFIG: { features: { operationalCorrectionPilot: true } }
    }), true);
    assert.equal(dialog.canCorrectFiscalBonus({
        ...context,
        RADAR_PDDE_CONFIG: { features: {
            operationalCorrectionRelease: true, bonificationCorrectionRelease: true
        } }
    }), true);
    assert.equal(dialog.canCorrectFiscalBonus({
        ...context, RADAR_OPERATIONAL_CORRECTION_PREVIEW: false,
        RADAR_PDDE_CONFIG: { features: { bonificationCorrectionRelease: true } }
    }), false);
});

test('inclui Não analisado (clear_analysis) nas opções suportadas pelo diálogo', () => {
    assert.equal(Array.isArray(dialog.ANALYSES), true);
    assert.equal(dialog.ANALYSES.includes('Não analisado'), true);
});


test('T4: exclusão de contexto só fica disponível no piloto local explícito com repositório remoto', () => {
    const repository = { executeRpc() {}, capabilities: () => ({ remote: true }) };
    const root = {
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        location: { hostname: 'localhost', protocol: 'http:' },
        RADAR_PDDE_CONFIG: { deploymentTarget: 'local', features: { operationalCorrectionPilot: true } },
        RadarApplicationServices: { data: { repository } },
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} }
    };
    assert.equal(dialog.canDeleteContext(root), false);
    assert.equal(dialog.canDeleteContext({ ...root, RADAR_T4_CONTEXT_DELETION_PILOT: true }), true);
    assert.equal(dialog.canDeleteContext({
        ...root,
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: false,
        RADAR_T4_CONTEXT_DELETION_PILOT: true
    }), false);
    assert.equal(dialog.canDeleteContext({
        ...root,
        RADAR_T4_CONTEXT_DELETION_PILOT: true,
        RadarApplicationServices: {
            data: { repository: { executeRpc() {}, capabilities: () => ({ remote: false }) } }
        }
    }), false);
});

test('T4: liberar exclusão exige configuração própria em HTTPS e não aceita piloto no endereço de produção', () => {
    const repository = { executeRpc() {}, capabilities: () => ({ remote: true }) };
    const base = {
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        location: { hostname: 'radarpdde-fix.vercel.app', protocol: 'https:' },
        RADAR_PDDE_CONFIG: {
            deploymentTarget: 'production',
            features: {
                operationalCorrectionRelease: true,
                bonificationCorrectionRelease: true
            }
        },
        RadarApplicationServices: { data: { repository } },
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} }
    };
    assert.equal(dialog.canDeleteContext(base), false, 'bonificação anterior não libera exclusão por herança');
    assert.equal(dialog.canDeleteContext({
        ...base,
        RADAR_T4_CONTEXT_DELETION_PILOT: true
    }), false, 'simular piloto no navegador de produção não pode liberar a função');
    assert.equal(dialog.canDeleteContext({
        ...base,
        RADAR_PDDE_CONFIG: {
            ...base.RADAR_PDDE_CONFIG,
            features: { ...base.RADAR_PDDE_CONFIG.features, contextDeletionRelease: true }
        }
    }), true, 'release própria autoriza a UI após os gates existentes');
    assert.equal(dialog.canDeleteContext({
        ...base,
        location: { hostname: 'radarpdde-fix.vercel.app', protocol: 'http:' },
        RADAR_PDDE_CONFIG: {
            ...base.RADAR_PDDE_CONFIG,
            features: { ...base.RADAR_PDDE_CONFIG.features, contextDeletionRelease: true }
        }
    }), false, 'sem HTTPS a opção continua desligada');
});
