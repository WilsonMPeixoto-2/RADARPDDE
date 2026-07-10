(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelWorkbookPlan = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '0.1.0';
    const SHEET_ORDER = Object.freeze(['BONIFICACOES', 'SINTESE', 'QUALIDADE_DADOS', 'METADADOS']);
    const PALETTE = Object.freeze({
        structural: '#17324D', informational: '#2F6FA5', positive: '#287B78',
        attention: '#C98512', critical: '#B43A3A', analytical: '#6658A6',
        functionalGray: '#64748B', lightBackground: '#F5F7FA', border: '#D8DEE6',
        white: '#FFFFFF', text: '#243447'
    });

    const clone = value => JSON.parse(JSON.stringify(value));
    const valuesOf = (rows, columns) => rows.map(row => columns.map(column => row[column.key]));

    function validate(model) {
        if (!model || !model.base || !Array.isArray(model.base.rows)) {
            throw new TypeError('Modelo de exportação Excel inválido.');
        }
        if (!model.equivalence || model.equivalence.equivalent !== true) {
            throw new Error('A geração XLSX foi bloqueada porque a equivalência com o CSV não foi comprovada.');
        }
        if (!Array.isArray(model.base.columns) || model.base.columns.length !== 12) {
            throw new Error('A aba BONIFICACOES deve preservar exatamente os 12 campos originais.');
        }
    }

    function context(options) {
        const suppliedDate = options.generatedAt;
        const generatedAt = suppliedDate instanceof Date
            ? suppliedDate.toISOString()
            : (typeof suppliedDate === 'string' && suppliedDate ? suppliedDate : new Date().toISOString());
        return {
            generatedAt,
            source: options.source || 'Dados ativos no RADAR PDDE',
            temporalScope: options.temporalScope || 'Todas as competências consolidadas',
            fileName: options.fileName || 'RADAR_PDDE_BONIFICACOES_CONSOLIDADAS.xlsx'
        };
    }

    function baseSheet(model, ctx, palette) {
        const layout = model.layout.sheets.BONIFICACOES;
        const first = layout.firstDataRow;
        const last = Math.max(first, first + model.base.rows.length - 1);
        return {
            name: 'BONIFICACOES', required: true, role: 'base', palette,
            freeze: { rows: layout.freezeRows, columns: layout.freezeColumns },
            title: { range: 'A1:L1', value: 'RADAR PDDE — BONIFICAÇÕES CONSOLIDADAS' },
            description: { range: 'A2:L2', value: 'Aba principal: preserva integralmente o escopo do relatório CSV original — uma linha por escola, competência e programa, somente após consolidação.' },
            metadata: [
                ['DATA DE GERAÇÃO', ctx.generatedAt, 'A4:B5', 'dd/mm/yyyy hh:mm'],
                ['ESCOPO TEMPORAL', ctx.temporalScope, 'C4:D5'],
                ['REGRA DE INCLUSÃO', 'Bonificação consolidada', 'E4:F5'],
                ['FONTE', ctx.source, 'G4:H5']
            ],
            merges: ['A1:L1', 'A2:L2', 'A4:B4', 'C4:D4', 'E4:F4', 'G4:H4', 'A5:B5', 'C5:D5', 'E5:F5', 'G5:H5'],
            table: {
                name: 'BonificacoesConsolidadasTable', headerRow: layout.headerRow,
                firstDataRow: first, lastDataRow: last, range: `A${layout.headerRow}:L${last}`,
                headers: model.base.columns.map(column => column.label),
                rows: valuesOf(model.base.rows, model.base.columns),
                columns: clone(model.base.columns), autofilter: true, bandedRows: true
            },
            conditionalFormats: [
                { range: `L${first}:L${last}`, formula: `=L${first}="APTA"`, style: 'statusPositive' },
                { range: `L${first}:L${last}`, formula: `=L${first}="INAPTA"`, style: 'statusCritical' }
            ]
        };
    }

    function summarySheet(model, base, palette) {
        const summary = model.optional.summary;
        const first = base.table.firstDataRow;
        const last = base.table.lastDataRow;
        const compLast = Math.max(11, 10 + summary.byCompetencia.length);
        const progLast = Math.max(11, 10 + summary.byPrograma.length);
        return {
            name: 'SINTESE', required: false, role: 'summary', palette, freeze: { rows: 2, columns: 0 },
            title: { range: 'A1:I1', value: 'SÍNTESE OPCIONAL — BONIFICAÇÕES CONSOLIDADAS' },
            description: { range: 'A2:I2', value: 'Análises derivadas exclusivamente da aba BONIFICACOES. A unidade estatística é escola × competência × programa.' },
            kpis: [
                ['LINHAS CONSOLIDADAS', 'A5:B6', `=COUNTA(BONIFICACOES!A${first}:A${last})`, 'kpiInformational'],
                ['APTAS', 'C5:D6', `=COUNTIF(BONIFICACOES!L${first}:L${last},"APTA")`, 'kpiPositive'],
                ['INAPTAS', 'E5:F6', `=COUNTIF(BONIFICACOES!L${first}:L${last},"INAPTA")`, 'kpiCritical'],
                ['TAXA DE APTIDÃO', 'G5:H6', `=IFERROR(COUNTIF(BONIFICACOES!L${first}:L${last},"APTA")/COUNTA(BONIFICACOES!A${first}:A${last}),0)`, 'kpiAnalytical', '0.0%']
            ],
            competenceTable: {
                name: 'SinteseCompetenciaTable', range: `A10:D${compLast}`,
                headers: ['Competência', 'Consolidadas', 'Aptas', 'Inaptas'],
                rows: summary.byCompetencia.map(item => [item.label, item.totalConsolidadas, item.aptas, item.inaptas]),
                columns: [{ width: 20, alignment: 'center' }, { width: 14, alignment: 'center' }, { width: 14, alignment: 'center' }, { width: 14, alignment: 'center' }]
            },
            programTable: {
                name: 'SinteseProgramaTable', range: `F10:I${progLast}`,
                headers: ['Programa', 'Consolidadas', 'Aptas', 'Inaptas'],
                rows: summary.byPrograma.map(item => [item.label, item.totalConsolidadas, item.aptas, item.inaptas]),
                columns: [{ width: 26, alignment: 'left' }, { width: 14, alignment: 'center' }, { width: 14, alignment: 'center' }, { width: 14, alignment: 'center' }]
            },
            charts: summary.byCompetencia.length ? [{ type: 'bar', title: 'Resultados consolidados por competência', sourceRange: `A10:D${compLast}`, start: 'A16', end: 'I32', legend: 'bottom' }] : []
        };
    }

    function qualitySheet(model, palette) {
        const quality = model.optional.dataQuality;
        const layout = model.layout.sheets.QUALIDADE_DADOS;
        const first = layout.firstDataRow;
        const last = Math.max(first, first + quality.rows.length - 1);
        return {
            name: 'QUALIDADE_DADOS', required: false, role: 'quality', palette,
            freeze: { rows: layout.freezeRows, columns: 0 },
            title: { range: 'A1:H1', value: 'QUALIDADE DOS DADOS — VERIFICAÇÃO OPCIONAL' },
            description: { range: 'A2:H2', value: 'Aba auxiliar para localizar campos vazios ou representados por traço na base exportada.' },
            table: {
                name: 'QualidadeDadosTable', headerRow: layout.headerRow, firstDataRow: first,
                lastDataRow: last, range: `A${layout.headerRow}:H${last}`,
                headers: quality.columns.map(column => column.label),
                rows: valuesOf(quality.rows, quality.columns), columns: clone(quality.columns),
                autofilter: true, bandedRows: true
            },
            conditionalFormats: [{ range: `H${first}:H${last}`, formula: `=H${first}="Revisar"`, style: 'statusAttention' }]
        };
    }

    function metadataSheet(model, ctx, palette) {
        const values = model.optional.metadata.values;
        return {
            name: 'METADADOS', required: false, role: 'metadata', palette,
            freeze: { rows: 12, columns: 0 },
            title: { range: 'A1:D1', value: 'METADADOS E CONTRATO DO RELATÓRIO' },
            properties: [
                ['Produto', 'Exportação operacional de bonificações consolidadas do RADAR PDDE'],
                ['Data de geração', ctx.generatedAt], ['Fonte', ctx.source],
                ['Versão do modelo', values.modelVersion], ['Regra de inclusão', values.inclusionRule],
                ['Granularidade', values.granularity], ['Escopo temporal', values.competenceScope]
            ],
            dictionary: {
                range: `A12:D${12 + model.base.columns.length}`,
                headers: ['Campo original', 'Rótulo aprimorado', 'Origem', 'Significado'],
                rows: model.base.columns.map(column => [column.legacyLabel, column.label, 'Modelo de exportação do RADAR PDDE', `Campo preservado da exportação original (${column.key}).`]),
                columns: [{ width: 26, alignment: 'left' }, { width: 28, alignment: 'left' }, { width: 28, alignment: 'left' }, { width: 48, alignment: 'left' }]
            }
        };
    }

    function createWorkbookPlan(model, options = {}) {
        validate(model);
        const ctx = context(options);
        const palette = clone({ ...PALETTE, ...(model.layout.palette || {}) });
        const base = baseSheet(model, ctx, palette);
        const sheets = [base, summarySheet(model, base, palette), qualitySheet(model, palette), metadataSheet(model, ctx, palette)];
        return {
            version: VERSION, sourceModelVersion: model.version, fileName: ctx.fileName,
            sheetOrder: sheets.map(sheet => sheet.name),
            workbook: { title: 'RADAR PDDE — Bonificações consolidadas', creator: 'RADAR PDDE', generatedAt: ctx.generatedAt, activeSheet: 'BONIFICACOES', calculationMode: 'automatic' },
            styles: {
                title: { fill: palette.structural, font: { bold: true, color: palette.white, size: 16 } },
                header: { fill: palette.informational, font: { bold: true, color: palette.white, size: 10 }, horizontalAlignment: 'center', wrapText: true },
                statusPositive: { fill: '#DCEFE8', font: { bold: true, color: '#195C4F' } },
                statusCritical: { fill: '#F5DEDE', font: { bold: true, color: '#842929' } },
                statusAttention: { fill: '#F8EBCF', font: { bold: true, color: '#85580D' } }
            },
            sheets
        };
    }

    return Object.freeze({ PALETTE, SHEET_ORDER, VERSION, createWorkbookPlan });
}));
