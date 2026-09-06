'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const performanceObserver = require('../../src/integration/operational-write-performance.js');
const reconciler = require('../../src/integration/prontuario-conditional-reconciler.js');

test('performance observa persistência sem decorar política funcional do comando', async () => {
    const received = [];
    const dataService = {
        execute: async command => {
            received.push(command);
            return command;
        }
    };
    const root = {
        RadarApplicationServices: {
            pendencies: { dataService }
        }
    };

    assert.equal(performanceObserver.install(root), true);

    const persist = async () => ({ ok: true });
    const command = {
        name: 'pendency:open',
        changedEntities: ['pendencies', 'administrativeLogs'],
        persist
    };
    await dataService.execute(command);

    assert.equal(received.length, 1);
    assert.equal(received[0].name, 'pendency:open');
    assert.equal(received[0].remoteResultIsAuthoritative, undefined);
    assert.equal(received[0].remoteCommitIsAuthoritative, undefined);
    assert.equal(received[0].incrementalStateEntities, undefined);
    assert.equal(received[0].remoteRefreshExemptEntities, undefined);
    assert.equal(received[0].persist, persist, 'sem trace ativo, persist deve permanecer a mesma função');
});

test('reconciliador funcional instala sem depender de RadarOperationalWritePerformance', () => {
    const noop = async () => true;
    const root = {
        document: {
            querySelectorAll: () => [],
            querySelector: () => null
        },
        RadarApplicationServices: {
            verifications: {
                getState: () => ({
                    registeredInvoices: [],
                    pendencies: [],
                    verifications: {}
                })
            }
        },
        RadarServiceAdvisoryPendency: {},
        toggleBonif: noop,
        changeAnaliseTecnica: noop,
        toggleInvoiceAdvisorySent: noop,
        changeInvoiceAdvisoryAnalysis: noop,
        toggleConsEnviada: noop,
        renderProntuario: () => true
    };

    assert.equal(reconciler.install(root), true);
});

test('performance não exporta mapas nem reconciliadores funcionais', () => {
    assert.equal(performanceObserver.RESULT_AUTHORITATIVE_COMMANDS, undefined);
    assert.equal(performanceObserver.COMMIT_AUTHORITATIVE_COMMANDS, undefined);
    assert.equal(performanceObserver.INCREMENTAL_STATE_ENTITIES_BY_COMMAND, undefined);
    assert.equal(performanceObserver.REFRESH_EXEMPT_ENTITIES_BY_COMMAND, undefined);
    assert.equal(performanceObserver.decorateCommand, undefined);
    assert.equal(performanceObserver.suppressProntuarioRender, undefined);
    assert.equal(performanceObserver.syncProntuarioProgramUI, undefined);
    assert.equal(performanceObserver.patchInlineHandlers, undefined);
});
