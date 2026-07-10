'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    escapeCsvCell,
    protectSpreadsheetFormula,
    serializeCsv,
    validateDelimiter
} = require('../src/domain/csv.js');

test('serializa objetos com cabeçalho, ponto e vírgula e BOM UTF-8', () => {
    const csv = serializeCsv([
        { nome: 'Escola A', total: 10 },
        { nome: 'Escola B', total: 20 }
    ], {
        columns: [
            { key: 'nome', label: 'Unidade escolar' },
            { key: 'total', label: 'Total' }
        ]
    });

    assert.equal(
        csv,
        '\uFEFFUnidade escolar;Total\r\nEscola A;10\r\nEscola B;20'
    );
});

test('escapa delimitador, aspas e quebras de linha conforme RFC 4180', () => {
    assert.equal(escapeCsvCell('Escola; A'), '"Escola; A"');
    assert.equal(escapeCsvCell('Escola "Modelo"'), '"Escola ""Modelo"""');
    assert.equal(escapeCsvCell('Linha 1\nLinha 2'), '"Linha 1\nLinha 2"');
});

test('neutraliza fórmulas em valores textuais potencialmente perigosos', () => {
    assert.equal(protectSpreadsheetFormula('=SUM(A1:A2)'), "'=SUM(A1:A2)");
    assert.equal(protectSpreadsheetFormula(' +123'), "' +123");
    assert.equal(protectSpreadsheetFormula('-1+2'), "'-1+2");
    assert.equal(protectSpreadsheetFormula('@cmd'), "'@cmd");
    assert.equal(protectSpreadsheetFormula('\n=CMD()'), "'\n=CMD()");
    assert.equal(protectSpreadsheetFormula('Texto comum'), 'Texto comum');
    assert.equal(protectSpreadsheetFormula(-42), '-42');
});

test('permite desativar explicitamente a proteção contra fórmulas', () => {
    assert.equal(
        protectSpreadsheetFormula('=SUM(A1:A2)', { enabled: false }),
        '=SUM(A1:A2)'
    );

    assert.equal(
        serializeCsv([['=SUM(A1:A2)']], { includeBom: false, protectFormulas: false }),
        '=SUM(A1:A2)'
    );
});

test('aceita linhas matriciais sem definição de colunas', () => {
    const csv = serializeCsv([
        ['Escola', 'Situação'],
        ['E.M. Exemplo', 'Apta']
    ], { includeBom: false });

    assert.equal(csv, 'Escola;Situação\r\nE.M. Exemplo;Apta');
});

test('aplica getValue e format sem modificar os registros originais', () => {
    const rows = [{ nome: 'Escola A', valor: 1250.5 }];
    const snapshot = structuredClone(rows);

    const csv = serializeCsv(rows, {
        includeBom: false,
        columns: [
            { label: 'Nome', getValue: row => row.nome.toUpperCase() },
            {
                key: 'valor',
                label: 'Valor',
                format: value => value.toFixed(2).replace('.', ',')
            }
        ]
    });

    assert.equal(csv, 'Nome;Valor\r\nESCOLA A;1250,50');
    assert.deepEqual(rows, snapshot);
});

test('permite vírgula, LF, ausência de BOM e quebra final', () => {
    const csv = serializeCsv([['A', 'B']], {
        delimiter: ',',
        lineEnding: '\n',
        includeBom: false,
        finalLineBreak: true
    });

    assert.equal(csv, 'A,B\n');
});

test('gera somente o cabeçalho quando não há registros', () => {
    const csv = serializeCsv([], {
        includeBom: false,
        columns: ['nome', 'situacao']
    });

    assert.equal(csv, 'nome;situacao');
});

test('valida delimitadores, colunas e formato das linhas', () => {
    assert.throws(() => validateDelimiter(';;'), /exatamente um caractere/);
    assert.throws(() => validateDelimiter('"'), /não pode ser aspas/);
    assert.throws(() => serializeCsv('não é lista'), /devem ser informadas em uma lista/);
    assert.throws(() => serializeCsv([{}]), /deve ser uma lista/);
    assert.throws(() => serializeCsv([[]], { columns: [] }), /lista não vazia/);
    assert.throws(
        () => serializeCsv([{}], { columns: [{ label: 'Sem chave' }] }),
        /deve possuir key ou getValue/
    );
});
