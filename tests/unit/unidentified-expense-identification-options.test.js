'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    IDENTIFIED_EXPENSE_TYPES
} = require('../../src/domain/invoice-document-analysis.js');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function identificationOptionValues() {
    const selectMatch = html.match(
        /<select[^>]*id="envio-identificacao-tipo"[^>]*>([\s\S]*?)<\/select>/
    );
    assert.ok(selectMatch, 'Select de identificação da despesa deve existir.');

    return Array.from(
        selectMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)
    )
        .map(match => ({
            value: match[1],
            label: match[2].trim()
        }))
        .filter(option => option.value);
}

test('UI de identificação oferece exatamente todos os tipos finais aceitos pelo domínio', () => {
    const options = identificationOptionValues();

    assert.deepEqual(
        options.map(option => option.value),
        [...IDENTIFIED_EXPENSE_TYPES]
    );
    assert.deepEqual(options, [
        { value: 'consumo', label: 'Material de Consumo' },
        { value: 'permanente', label: 'Bem Permanente' },
        { value: 'servico', label: 'Prestação de Serviço' },
        { value: 'boleto_internet', label: 'Boleto de pagamento de Internet' }
    ]);
});

test('Boleto de Internet permanece declarado como opção exclusiva de Educação Conectada', () => {
    assert.match(
        html,
        /<option value="boleto_internet" data-program-id="CONECTADA">Boleto de pagamento de Internet<\/option>/
    );
});
