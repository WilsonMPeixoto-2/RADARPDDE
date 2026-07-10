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

    const EXPORT_MODEL_VERSION = '0.1.0';

    const ORIGINAL_COLUMNS = Object.freeze([
        Object.freeze({ key: 'inep', legacyLabel: 'INEP', label: 'INEP' }),
        Object.freeze({ key: 'denominacao', legacyLabel: 'Denominacao', label: 'Denominação' }),
        Object.freeze({ key: 'designacao', legacyLabel: 'Designacao', label: 'Designação' }),
        Object.freeze({ key: 'competencia', legacyLabel: 'Competencia', label: 'Competência' }),
        Object.freeze({ key: 'programa', legacyLabel: 'Programa', label: 'Programa' }),
        Object.freeze({ key: 'contaCorrente', legacyLabel: 'CC', label: 'Conta corrente' }),
        Object.freeze({ key: 'investimento', legacyLabel: 'Investimento', label: 'Investimento' }),
        Object.freeze({ key: 'notaFiscal', legacyLabel: 'NF', label: 'Nota fiscal' }),
        Object.freeze({ key: 'assessoria', legacyLabel: 'Assessoria', label: 'Assessoria' }),
        Object.freeze({ key: 'bbAgil', legacyLabel: 'BBAgil', label: 'BB Ágil' }),
        Object.freeze({ key: 'encaminhadoInventario', legacyLabel: 'EncaminhadoInventario', label: 'Encaminhado ao inventário' }),
        Object.freeze({ key: 'statusBonificacao', legacyLabel: 'StatusBonificacao', label: 'Status da bonificação' })
    ]);

    const BASE_SHEET_NAME = 'BONIFICACOES';

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

    function normalizeOptionalValue(value, fallback = '-') {
        return value === undefined || value === null || value === '' ? fallback : value;
    }

    function buildBaseRows(input) {
        const escolas = input && Array.isArray(input.escolas) ? input.escolas : [];
        const competencias = input && Array.isArray(input.competencias) ? input.competencias : [];
        const programas = input && Array.isArray(input.programas) ? input.programas : [];
        const verificacoes = input && input.verificacoes ? input.verificacoes : {};
        const rows = [];

        escolas.forEach(escola => {
            competencias.forEach(competencia => {
                (escola.programasIds || []).forEach(programaId => {
                    const compoundKey = `${competencia.key}_${programaId}`;
                    const verification = verificacoes[escola.id] && verificacoes[escola.id][compoundKey];

                    // Regra original: somente resultados de bonificação já consolidados.
                    if (!verification || !verification.resultadoBonif) return;

                    const bonificacao = verification.bonificacao || {};
                    rows.push({
                        inep: normalizeOptionalValue(escola.inep),
                        denominacao: normalizeOptionalValue(escola.denominação || escola.denominacao),
                        designacao: normalizeOptionalValue(escola.designação || escola.designacao),
                        competencia: formatCompetenciaLegacy(competencia.key),
                        competenciaKey: competencia.key,
                        competenciaDisplay: formatCompetenciaDisplay(competencia.key),
                        programa: normalizeOptionalValue(findProgramaName(programas, programaId)),
                        programaId,
                        contaCorrente: normalizeOptionalValue(bonificacao.extCC),
                        investimento: normalizeOptionalValue(bonificacao.extINV),
                        notaFiscal: normalizeOptionalValue(bonificacao.notaFiscal),
                        assessoria: normalizeOptionalValue(bonificacao.consAssessoria),
                        bbAgil: normalizeOptionalValue(bonificacao.declBBAgil),
                        encaminhadoInventario: normalizeOptionalValue(bonificacao.encampInventario),
                        statusBonificacao: String(verification.resultadoBonif).toUpperCase()
                    });
                });
            });
        });

        return rows;
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

    function buildDataQuality(rows) {
        return rows.map((row, index) => {
            const missing = ORIGINAL_COLUMNS
                .filter(column => row[column.key] === '-' || row[column.key] === '')
                .map(column => column.label);

            return {
                linhaBase: index + 2,
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

        return {
            version: EXPORT_MODEL_VERSION,
            base: {
                name: BASE_SHEET_NAME,
                description: 'Reprodução integral do escopo do relatório CSV original.',
                columns: ORIGINAL_COLUMNS,
                rows
            },
            optional: {
                summaryByCompetencia: {
                    name: 'SINTESE_COMPETENCIA',
                    rows: summarizeRows(rows, 'competenciaKey', 'competenciaDisplay')
                },
                summaryByPrograma: {
                    name: 'SINTESE_PROGRAMA',
                    rows: summarizeRows(rows, 'programaId', 'programa')
                },
                dataQuality: {
                    name: 'QUALIDADE_DADOS',
                    rows: buildDataQuality(rows)
                },
                metadata: {
                    name: 'METADADOS',
                    values: {
                        modelVersion: EXPORT_MODEL_VERSION,
                        inclusionRule: 'Somente registros com resultadoBonif consolidado.',
                        granularity: 'Uma linha por escola, competência e programa.',
                        competenceScope: 'Todas as competências disponíveis, como no relatório original.',
                        originalColumnsPreserved: ORIGINAL_COLUMNS.map(column => column.legacyLabel)
                    }
                }
            }
        };
    }

    return Object.freeze({
        BASE_SHEET_NAME,
        EXPORT_MODEL_VERSION,
        ORIGINAL_COLUMNS,
        buildBaseRows,
        buildExportModel,
        formatCompetenciaDisplay,
        formatCompetenciaLegacy
    });
}));
