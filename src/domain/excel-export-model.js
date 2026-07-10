(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarExcelExportModel = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const EXPORT_MODEL_VERSION = '0.2.0';
    const BASE_SHEET_NAME = 'BONIFICACOES';

    const SHEET_NAMES = Object.freeze({
        base: BASE_SHEET_NAME,
        summary: 'SINTESE',
        dataQuality: 'QUALIDADE_DADOS',
        metadata: 'METADADOS'
    });

    const ORIGINAL_COLUMNS = Object.freeze([
        Object.freeze({ key: 'inep', legacyLabel: 'INEP', label: 'INEP', column: 'A', width: 12, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'denominacao', legacyLabel: 'Denominacao', label: 'Denominação', column: 'B', width: 34, alignment: 'left', dataType: 'text' }),
        Object.freeze({ key: 'designacao', legacyLabel: 'Designacao', label: 'Designação', column: 'C', width: 14, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'competencia', legacyLabel: 'Competencia', label: 'Competência', column: 'D', width: 13, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'programa', legacyLabel: 'Programa', label: 'Programa', column: 'E', width: 24, alignment: 'left', dataType: 'text' }),
        Object.freeze({ key: 'contaCorrente', legacyLabel: 'CC', label: 'Conta corrente', column: 'F', width: 17, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'investimento', legacyLabel: 'Investimento', label: 'Investimento', column: 'G', width: 17, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'notaFiscal', legacyLabel: 'NF', label: 'Nota fiscal', column: 'H', width: 17, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'assessoria', legacyLabel: 'Assessoria', label: 'Assessoria', column: 'I', width: 17, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'bbAgil', legacyLabel: 'BBAgil', label: 'BB Ágil', column: 'J', width: 17, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'encaminhadoInventario', legacyLabel: 'EncaminhadoInventario', label: 'Encaminhado ao inventário', column: 'K', width: 20, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'statusBonificacao', legacyLabel: 'StatusBonificacao', label: 'Status da bonificação', column: 'L', width: 21, alignment: 'center', dataType: 'text' })
    ]);

    const DATA_QUALITY_COLUMNS = Object.freeze([
        Object.freeze({ key: 'linhaBase', label: 'Linha na base', column: 'A', width: 17, alignment: 'center', dataType: 'integer' }),
        Object.freeze({ key: 'inep', label: 'INEP', column: 'B', width: 14, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'designacao', label: 'Designação', column: 'C', width: 16, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'competencia', label: 'Competência', column: 'D', width: 14, alignment: 'center', dataType: 'text' }),
        Object.freeze({ key: 'programa', label: 'Programa', column: 'E', width: 26, alignment: 'left', dataType: 'text' }),
        Object.freeze({ key: 'camposAusentes', label: 'Campos ausentes', column: 'F', width: 17, alignment: 'center', dataType: 'integer' }),
        Object.freeze({ key: 'detalhamento', label: 'Detalhamento', column: 'G', width: 40, alignment: 'left', dataType: 'text' }),
        Object.freeze({ key: 'situacao', label: 'Situação', column: 'H', width: 15, alignment: 'center', dataType: 'text' })
    ]);

    const WORKBOOK_LAYOUT = Object.freeze({
        sheetOrder: Object.freeze([
            SHEET_NAMES.base,
            SHEET_NAMES.summary,
            SHEET_NAMES.dataQuality,
            SHEET_NAMES.metadata
        ]),
        palette: Object.freeze({
            structural: '#17324D',
            informational: '#2F6FA5',
            positive: '#287B78',
            attention: '#C98512',
            critical: '#B43A3A',
            analytical: '#6658A6',
            functionalGray: '#64748B',
            lightBackground: '#F5F7FA',
            border: '#D8DEE6'
        }),
        sheets: Object.freeze({
            BONIFICACOES: Object.freeze({
                required: true,
                titleRow: 1,
                descriptionRow: 2,
                metadataLabelRow: 4,
                metadataValueRow: 5,
                headerRow: 8,
                firstDataRow: 9,
                freezeRows: 8,
                freezeColumns: 3,
                columns: ORIGINAL_COLUMNS
            }),
            SINTESE: Object.freeze({
                required: false,
                titleRow: 1,
                descriptionRow: 2,
                combines: Object.freeze(['competencia', 'programa'])
            }),
            QUALIDADE_DADOS: Object.freeze({
                required: false,
                titleRow: 1,
                descriptionRow: 2,
                headerRow: 5,
                firstDataRow: 6,
                freezeRows: 5,
                columns: DATA_QUALITY_COLUMNS
            }),
            METADADOS: Object.freeze({
                required: false,
                titleRow: 1,
                dictionaryHeaderRow: 12,
                horizontalAlignment: 'left'
            })
        })
    });

    function formatCompetenciaLegacy(value) {
        const text = String(value || '');
        const match = /^(\d{4})-(\d{2})$/.exec(text);
        return match ? `${match[2]}-${match[1]}` : text;
    }

    function formatCompetenciaDisplay(value) {
        const text = String(value || '');
        const match = /^(\d{4})-(\d{2})$/.exec(text);
        if (!match) return text;

        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const monthIndex = Number(match[2]) - 1;
        return monthNames[monthIndex] ? `${monthNames[monthIndex]}/${match[1]}` : text;
    }

    function findProgramaName(programas, programaId) {
        const programa = (programas || []).find(item => item.id === programaId);
        return programa ? programa.name : programaId;
    }

    function getInputCollections(input) {
        return {
            escolas: input && Array.isArray(input.escolas) ? input.escolas : [],
            competencias: input && Array.isArray(input.competencias) ? input.competencias : [],
            programas: input && Array.isArray(input.programas) ? input.programas : [],
            verificacoes: input && input.verificacoes ? input.verificacoes : {}
        };
    }

    // Espelho lógico da rotina atual exportDataExcel(). Mantido separado de
    // buildBaseRows para que mudanças futuras possam ser verificadas por equivalência.
    function buildLegacyLogicalRows(input) {
        const { escolas, competencias, programas, verificacoes } = getInputCollections(input);
        const rows = [];

        escolas.forEach(escola => {
            competencias.forEach(competencia => {
                (escola.programasIds || []).forEach(programaId => {
                    const compoundKey = `${competencia.key}_${programaId}`;
                    const verification = verificacoes[escola.id] && verificacoes[escola.id][compoundKey];
                    if (!verification || !verification.resultadoBonif) return;

                    const bonificacao = verification.bonificacao || {};
                    rows.push([
                        escola.inep,
                        escola.denominação,
                        escola.designação,
                        formatCompetenciaLegacy(competencia.key),
                        findProgramaName(programas, programaId),
                        bonificacao.extCC,
                        bonificacao.extINV,
                        bonificacao.notaFiscal,
                        bonificacao.consAssessoria,
                        bonificacao.declBBAgil,
                        bonificacao.encampInventario || '-',
                        String(verification.resultadoBonif).toUpperCase()
                    ]);
                });
            });
        });

        return rows;
    }

    function buildBaseRows(input) {
        const { escolas, competencias, programas, verificacoes } = getInputCollections(input);
        const rows = [];

        escolas.forEach(escola => {
            competencias.forEach(competencia => {
                (escola.programasIds || []).forEach(programaId => {
                    const compoundKey = `${competencia.key}_${programaId}`;
                    const verification = verificacoes[escola.id] && verificacoes[escola.id][compoundKey];
                    if (!verification || !verification.resultadoBonif) return;

                    const bonificacao = verification.bonificacao || {};
                    rows.push({
                        inep: escola.inep,
                        denominacao: escola.denominação,
                        designacao: escola.designação,
                        competencia: formatCompetenciaLegacy(competencia.key),
                        competenciaKey: competencia.key,
                        competenciaDisplay: formatCompetenciaDisplay(competencia.key),
                        programa: findProgramaName(programas, programaId),
                        programaId,
                        contaCorrente: bonificacao.extCC,
                        investimento: bonificacao.extINV,
                        notaFiscal: bonificacao.notaFiscal,
                        assessoria: bonificacao.consAssessoria,
                        bbAgil: bonificacao.declBBAgil,
                        encaminhadoInventario: bonificacao.encampInventario || '-',
                        statusBonificacao: String(verification.resultadoBonif).toUpperCase()
                    });
                });
            });
        });

        return rows;
    }

    function toOriginalColumnValues(row) {
        return ORIGINAL_COLUMNS.map(column => row[column.key]);
    }

    function valuesEqual(left, right) {
        return Object.is(left, right) || (Number.isNaN(left) && Number.isNaN(right));
    }

    function compareLogicalRows(expectedRows, actualRows) {
        const expected = Array.isArray(expectedRows) ? expectedRows : [];
        const actual = Array.isArray(actualRows) ? actualRows : [];
        const mismatches = [];
        const maxLength = Math.max(expected.length, actual.length);

        for (let rowIndex = 0; rowIndex < maxLength; rowIndex += 1) {
            const expectedRow = expected[rowIndex];
            const actualRow = actual[rowIndex];

            if (!expectedRow || !actualRow) {
                mismatches.push({ rowIndex, reason: 'missing-row', expected: expectedRow, actual: actualRow });
                continue;
            }

            const maxColumns = Math.max(expectedRow.length, actualRow.length);
            for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
                if (!valuesEqual(expectedRow[columnIndex], actualRow[columnIndex])) {
                    mismatches.push({
                        rowIndex,
                        columnIndex,
                        column: ORIGINAL_COLUMNS[columnIndex] ? ORIGINAL_COLUMNS[columnIndex].legacyLabel : columnIndex,
                        expected: expectedRow[columnIndex],
                        actual: actualRow[columnIndex]
                    });
                }
            }
        }

        return {
            equivalent: expected.length === actual.length && mismatches.length === 0,
            expectedRowCount: expected.length,
            actualRowCount: actual.length,
            mismatches
        };
    }

    function buildEquivalenceReport(input) {
        const legacyRows = buildLegacyLogicalRows(input || {});
        const baseRows = buildBaseRows(input || {}).map(toOriginalColumnValues);
        return compareLogicalRows(legacyRows, baseRows);
    }

    function summarizeRows(rows, groupKey, labelKey) {
        const groups = new Map();

        rows.forEach(row => {
            const key = row[groupKey] || '-';
            const label = row[labelKey] || key;
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    label,
                    totalConsolidadas: 0,
                    aptas: 0,
                    inaptas: 0
                });
            }

            const group = groups.get(key);
            group.totalConsolidadas += 1;
            if (row.statusBonificacao === 'APTA') group.aptas += 1;
            if (row.statusBonificacao === 'INAPTA') group.inaptas += 1;
        });

        return Array.from(groups.values()).map(group => ({
            ...group,
            taxaAptidao: group.totalConsolidadas > 0
                ? group.aptas / group.totalConsolidadas
                : 0
        }));
    }

    function isMissingValue(value) {
        return value === undefined || value === null || value === '' || value === '-';
    }

    function buildDataQuality(rows) {
        const firstDataRow = WORKBOOK_LAYOUT.sheets.BONIFICACOES.firstDataRow;

        return rows.map((row, index) => {
            const missing = ORIGINAL_COLUMNS
                .filter(column => isMissingValue(row[column.key]))
                .map(column => column.label);

            return {
                linhaBase: firstDataRow + index,
                inep: row.inep,
                designacao: row.designacao,
                competencia: row.competencia,
                programa: row.programa,
                camposAusentes: missing.length,
                detalhamento: missing.join('; '),
                situacao: missing.length === 0 ? 'Completa' : 'Revisar'
            };
        });
    }

    function buildExportModel(input) {
        const rows = buildBaseRows(input || {});
        const equivalence = buildEquivalenceReport(input || {});

        return {
            version: EXPORT_MODEL_VERSION,
            sheetOrder: WORKBOOK_LAYOUT.sheetOrder,
            layout: WORKBOOK_LAYOUT,
            equivalence,
            base: {
                name: SHEET_NAMES.base,
                required: true,
                description: 'Reprodução integral do escopo do relatório CSV original.',
                columns: ORIGINAL_COLUMNS,
                rows
            },
            optional: {
                summary: {
                    name: SHEET_NAMES.summary,
                    required: false,
                    byCompetencia: summarizeRows(rows, 'competenciaKey', 'competenciaDisplay'),
                    byPrograma: summarizeRows(rows, 'programaId', 'programa')
                },
                dataQuality: {
                    name: SHEET_NAMES.dataQuality,
                    required: false,
                    columns: DATA_QUALITY_COLUMNS,
                    rows: buildDataQuality(rows)
                },
                metadata: {
                    name: SHEET_NAMES.metadata,
                    required: false,
                    values: {
                        modelVersion: EXPORT_MODEL_VERSION,
                        inclusionRule: 'Somente registros com resultadoBonif consolidado.',
                        granularity: 'Uma linha por escola, competência e programa.',
                        competenceScope: 'Todas as competências disponíveis, como no relatório original.',
                        originalColumnsPreserved: ORIGINAL_COLUMNS.map(column => column.legacyLabel),
                        approvedWorkbookStructure: WORKBOOK_LAYOUT.sheetOrder
                    }
                }
            }
        };
    }

    return Object.freeze({
        BASE_SHEET_NAME,
        DATA_QUALITY_COLUMNS,
        EXPORT_MODEL_VERSION,
        ORIGINAL_COLUMNS,
        SHEET_NAMES,
        WORKBOOK_LAYOUT,
        buildBaseRows,
        buildDataQuality,
        buildEquivalenceReport,
        buildExportModel,
        buildLegacyLogicalRows,
        compareLogicalRows,
        formatCompetenciaDisplay,
        formatCompetenciaLegacy,
        toOriginalColumnValues
    });
}));
