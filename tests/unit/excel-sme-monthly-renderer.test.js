'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const baseRenderer = require('../../src/domain/excel-xlsx-renderer.js');
const modelApi = require('../../src/domain/excel-sme-export-model.js');
const renderer = require('../../src/domain/excel-sme-monthly-renderer.js');

const decoder = new TextDecoder('utf-8');

function model() {
    return modelApi.buildSmeMonthlyModel({
        activeCompetenciaKey: '2026-07',
        escolas: [{
            id: 'school-1',
            designação: '04.31.001',
            denominação: 'Escola Municipal Ary Barroso',
            cre: '4ª CRE',
            programasIds: ['BASIC']
        }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            'school-1': {
                '2026-07_BASIC': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                }
            }
        }
    });
}

function inspect(bytes) {
    return Object.fromEntries(
        Object.entries(baseRenderer.inspectStoredZip(bytes))
            .map(([name, value]) => [name, decoder.decode(value)])
    );
}

test('gera pacote XLSX de uma única aba mensal', () => {
    const bytes = renderer.renderWorkbook(model());
    const entries = inspect(bytes);

    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
    assert.deepEqual(Object.keys(entries).sort(), [
        '[Content_Types].xml',
        '_rels/.rels',
        'docProps/app.xml',
        'docProps/core.xml',
        'xl/_rels/workbook.xml.rels',
        'xl/styles.xml',
        'xl/workbook.xml',
        'xl/worksheets/sheet1.xml'
    ]);
    assert.match(entries['xl/workbook.xml'], /<sheet name="JULHO" sheetId="1" r:id="rId1"\/>/);
    assert.doesNotMatch(entries['xl/workbook.xml'], /sheetId="2"/);
});

test('preserva 26 colunas, cabeçalho e dados mensais', () => {
    const sheet = inspect(renderer.renderWorkbook(model()))['xl/worksheets/sheet1.xml'];

    assert.match(sheet, /<dimension ref="A1:Z2"\/>/);
    assert.equal((sheet.match(/<col min=/g) || []).length, 26);
    assert.match(sheet, /<c r="A1" s="1" t="inlineStr">[\s\S]*?<t[^>]*>Nº<\/t>/);
    assert.match(sheet, /<c r="D1" s="1" t="inlineStr">[\s\S]*?<t[^>]*>UNIDADE ESCOLAR<\/t>/);
    assert.match(sheet, /<c r="E1" s="2" t="inlineStr">[\s\S]*?<t[^>]*>EXTRATO CONTA CORRENTE<\/t>/);
    assert.match(sheet, /<c r="Z1" s="5" t="inlineStr">[\s\S]*?<t[^>]*>OBSERVAÇÕES<\/t>/);
    assert.match(sheet, /<c r="A2" s="6"><v>1<\/v><\/c>/);
    assert.match(sheet, /<c r="C2" s="6" t="inlineStr">[\s\S]*?<t[^>]*>04\.31\.001<\/t>/);
    assert.match(sheet, /<c r="D2" s="8" t="inlineStr">[\s\S]*?<t[^>]*>Escola Municipal Ary Barroso<\/t>/);
    assert.match(sheet, /<c r="E2" s="6" t="inlineStr">[\s\S]*?<t[^>]*>SIM<\/t>/);
    assert.match(sheet, /<c r="G2" s="6" t="inlineStr">[\s\S]*?<t[^>]*>NÃO SE APLICA<\/t>/);
    assert.match(sheet, /<c r="W2" s="6" t="inlineStr"><is><t xml:space="preserve"><\/t><\/is><\/c>/);
});

test('configura filtro, congelamento, validações e impressão', () => {
    const sheet = inspect(renderer.renderWorkbook(model()))['xl/worksheets/sheet1.xml'];

    assert.match(sheet, /<pane xSplit="4" ySplit="1" topLeftCell="E2"[^>]*state="frozen"\/>/);
    assert.match(sheet, /<autoFilter ref="A1:Z2"\/>/);
    assert.match(sheet, /<dataValidations count="18">/);
    assert.match(sheet, /sqref="E2:E2"/);
    assert.match(sheet, /<formula1>&quot;SIM,NÃO,NÃO SE APLICA&quot;<\/formula1>/);
    assert.match(sheet, /<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"\/>/);
    assert.match(sheet, /CONTROLE DE BONIFICAÇÃO — JULHO 2026/);
});

test('mantém estilos cromáticos e bordas no pacote', () => {
    const styles = inspect(renderer.renderWorkbook(model()))['xl/styles.xml'];

    for (const color of ['FF17365D', 'FF4F81BD', 'FF70AD47', 'FFED7D31', 'FF7F8C8D']) {
        assert.match(styles, new RegExp(color));
    }
    assert.match(styles, /<cellXfs count="10">/);
    assert.match(styles, /FFB7C3D0/);
    assert.match(styles, /<name val="Arial"\/>/);
});
