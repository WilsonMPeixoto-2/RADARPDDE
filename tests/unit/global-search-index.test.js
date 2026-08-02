'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeSearchText,
    createSearchCatalog,
    createSearchEngine,
    searchCatalog
} = require('../../src/domain/global-search-index.js');

class FakeFuse {
    constructor(items) {
        this.items = items;
    }

    search(query, options = {}) {
        const normalized = normalizeSearchText(query);
        return this.items
            .filter(item => normalizeSearchText([
                item.title,
                item.subtitle,
                ...(item.keywords || [])
            ].join(' ')).includes(normalized))
            .slice(0, options.limit || this.items.length)
            .map(item => ({ item, score: 0.1 }));
    }
}

const context = {
    schools: [
        {
            id: '04.31.026',
            denominação: 'Escola Municipal Herbert Moses',
            designação: '04.31.026',
            sici: '12345',
            programasIds: ['BASIC']
        },
        {
            id: '04.31.501',
            denominação: 'CIEP Mestre Cartola',
            designação: '04.31.501',
            programasIds: ['CONECTADA']
        }
    ],
    programs: [
        { id: 'BASIC', name: 'PDDE Básico' },
        { id: 'CONECTADA', name: 'Educação Conectada' }
    ],
    competencies: [
        { id: '2026-01', label: 'Janeiro de 2026' }
    ],
    pendencies: [
        { id: 'p1', escolaId: '04.31.026', documento: 'Planejamento', status: 'Aberta' }
    ],
    modules: [
        { id: 'dashboard', title: 'Dashboard', visible: true },
        { id: 'equipe', title: 'Gestão de Equipe', visible: false }
    ],
    allowedSchoolIds: ['04.31.026']
};

test('normaliza acentos e caixa para indexação estável', () => {
    assert.equal(normalizeSearchText('Educação Básica'), 'educacao basica');
});

test('monta catálogo apenas com escolas e módulos autorizados', () => {
    const catalog = createSearchCatalog(context);

    assert.ok(catalog.some(item => item.id === 'school:04.31.026'));
    assert.equal(catalog.some(item => item.id === 'school:04.31.501'), false);
    assert.ok(catalog.some(item => item.id === 'module:dashboard'));
    assert.equal(catalog.some(item => item.id === 'module:equipe'), false);
});

test('inclui programas, competências e pendências como destinos de consulta', () => {
    const catalog = createSearchCatalog(context);

    assert.ok(catalog.some(item => item.id === 'program:BASIC'));
    assert.ok(catalog.some(item => item.id === 'competence:2026-01'));
    assert.ok(catalog.some(item => item.id === 'pendency:p1'));
});

test('busca limita resultados e ignora consultas muito curtas', () => {
    const catalog = createSearchCatalog(context);
    const engine = createSearchEngine(FakeFuse, catalog);

    assert.deepEqual(searchCatalog(engine, 'h', 8), []);
    const results = searchCatalog(engine, 'herbert', 1);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'school:04.31.026');
});
