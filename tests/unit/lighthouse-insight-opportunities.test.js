'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const importExtractor = () => import('../../scripts/lib/lighthouse-opportunity-extractor.mjs');

function reportFor(reference, audit) {
    return {
        categories: { performance: { auditRefs: [reference] } },
        audits: { [reference.id]: audit }
    };
}

test('Lighthouse 13.6: insight com numericValue em millisecond produz economia estimada', async () => {
    const { extractPerformanceOpportunities } = await importExtractor();
    const report = reportFor(
        { id: 'render-blocking-insight', group: 'insights' },
        { title: 'Render blocking', score: 0, numericValue: 325, numericUnit: 'millisecond' }
    );
    assert.deepEqual(extractPerformanceOpportunities(report), [{
        id: 'render-blocking-insight',
        title: 'Render blocking',
        score: 0,
        displayValue: null,
        savingsMs: 325,
        savingsBytes: null
    }]);
});

test('Lighthouse 13.6: insight com numericValue em byte produz economia estimada de transferência', async () => {
    const { extractPerformanceOpportunities } = await importExtractor();
    const report = reportFor(
        { id: 'image-delivery-insight', group: 'insights' },
        { title: 'Image delivery', score: 0, numericValue: 4096, numericUnit: 'byte' }
    );
    assert.equal(extractPerformanceOpportunities(report)[0].savingsBytes, 4096);
    assert.equal(extractPerformanceOpportunities(report)[0].savingsMs, null);
});

test('Métrica LCP não pode ser falsamente apresentada como economia de 3 segundos', async () => {
    const { extractPerformanceOpportunities } = await importExtractor();
    const report = reportFor(
        { id: 'largest-contentful-paint', group: 'metrics' },
        { title: 'LCP', score: 0.4, numericValue: 3000, numericUnit: 'millisecond' }
    );
    assert.deepEqual(extractPerformanceOpportunities(report), []);
});

test('Oportunidade anterior com overallSavingsMs continua reconhecida sem regressão', async () => {
    const { extractPerformanceOpportunities } = await importExtractor();
    const report = reportFor(
        { id: 'unused-javascript', group: 'diagnostics' },
        { title: 'Unused JavaScript', score: 0.3, details: { overallSavingsMs: 225 } }
    );
    assert.equal(extractPerformanceOpportunities(report)[0].savingsMs, 225);
});

test('Não produzir economia fictícia para valores ausentes, negativos ou unidades desconhecidas', async () => {
    const { extractPerformanceOpportunities } = await importExtractor();
    const report = {
        categories: {
            performance: {
                auditRefs: [
                    { id: 'insight-a', group: 'insights' },
                    { id: 'insight-b', group: 'insights' },
                    { id: 'insight-c', group: 'insights' }
                ]
            }
        },
        audits: {
            'insight-a': { title: 'A', score: 0, numericValue: -5, numericUnit: 'millisecond' },
            'insight-b': { title: 'B', score: 0, numericValue: 50, numericUnit: 'unitless' },
            'insight-c': { title: 'C', score: null, numericValue: 500, numericUnit: 'byte' }
        }
    };
    assert.deepEqual(extractPerformanceOpportunities(report), []);
});
