(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeExportModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '0.1.0';
    const TEMPLATE_YEAR = 2026;
    const TEMPLATE_PART_URLS = Object.freeze([
        '/src/assets/templates/cre-04-controle-onedrive-2026.part01.b64',
        '/src/assets/templates/cre-04-controle-onedrive-2026.part02.b64',
        '/src/assets/templates/cre-04-controle-onedrive-2026.part03.b64',
        '/src/assets/templates/cre-04-controle-onedrive-2026.part04.b64',
        '/src/assets/templates/cre-04-controle-onedrive-2026.part05.b64',
        '/src/assets/templates/cre-04-controle-onedrive-2026.part06.b64'
    ]);
    const TEMPLATE_SHA256 = '0276cf8e7292c9bfbc7e521e5b44bc9bf8f641d34ae052b39ab12c19558f9bdd';
    const TEMPLATE_FILE_NAME = 'CRE 04 - CONTROLE ONEDRIVE2026.xlsx';
    const OUTPUT_FILE_NAME = 'RADAR_PDDE_EXCEL_SME_2026.xlsx';

    const DOCUMENT_KEYS = Object.freeze([
        'extCC',
        'extINV',
        'notaFiscal',
        'consAssessoria',
        'declBBAgil',
        'encampInventario'
    ]);

    const SHEET_BY_MONTH = Object.freeze({
        '01': 'JANEIRO',
        '02': 'FEVEREIRO',
        '03': 'MARÇO',
        '04': 'ABRIL',
        '05': 'MAIO',
        '06': 'JUNHO',
        '07': 'JANEIRO A JULHO',
        '08': 'AGOSTO',
        '09': 'SETEMBRO',
        '10': 'OUTUBRO',
        '11': 'NOVEMBRO',
        '12': 'DEZEMBRO'
    });

    const EXPECTED_SHEET_ORDER = Object.freeze([
        'JANEIRO',
        'FEVEREIRO',
        'MARÇO',
        'ABRIL',
        'MAIO',
        'JUNHO',
        'JANEIRO A JULHO',
        'AGOSTO',
        'SETEMBRO',
        'OUTUBRO',
        'NOVEMBRO',
        'DEZEMBRO',
        'CONSOLIDADO'
    ]);

    const STANDARD_PROGRAM_COLUMNS = Object.freeze({
        BASIC: Object.freeze(['E', 'F', 'G', 'H', 'I', 'J']),
        QUALIDADE: Object.freeze(['K', 'L', 'M', 'N', 'O', 'P']),
        EQUIDADE: Object.freeze(['Q', 'R', 'S', 'T', 'U', 'V'])
    });

    const DECEMBER_PROGRAM_COLUMNS = Object.freeze({
        BASIC: Object.freeze(['E', 'F', 'G', 'H', 'I', 'J']),
        QUALIDADE: Object.freeze(['L', 'M', 'N', 'O', 'P', 'Q']),
        EQUIDADE: Object.freeze(['S', 'T', 'U', 'V', 'W', 'X'])
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeToken(value) {
        return text(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, ' ')
            .trim();
    }

    function normalizeDesignation(value) {
        const digits = text(value).replace(/\D/g, '');
        if (!digits) return '';
        return String(Number.parseInt(digits, 10));
    }

    function normalizeSmeValue(value) {
        const normalized = normalizeToken(value);
        if (normalized === 'SIM') return 'SIM';
        if (normalized === 'NAO') return 'NÃO';
        if (normalized === 'NAO SE APLICA' || normalized === 'N A' || normalized === 'NA') {
            return 'NÃO SE APLICA';
        }
        return '';
    }

    function resolveProgramKey(program = {}) {
        const token = normalizeToken([program.id, program.name, program.nome, program.label].filter(Boolean).join(' '));
        if (/\b(BASIC|BASICO)\b/.test(token)) return 'BASIC';
        if (/\bQUALIDADE\b/.test(token)) return 'QUALIDADE';
        if (/\bEQUIDADE\b/.test(token)) return 'EQUIDADE';
        return '';
    }

    function getProgramColumns(sheetName, programKey) {
        const layout = sheetName === 'DEZEMBRO' ? DECEMBER_PROGRAM_COLUMNS : STANDARD_PROGRAM_COLUMNS;
        return layout[programKey] || null;
    }

    function parseCompetence(value) {
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(text(value));
        if (!match) return null;
        return {
            year: Number(match[1]),
            month: match[2],
            key: `${match[1]}-${match[2]}`,
            sheetName: Number(match[1]) === TEMPLATE_YEAR ? SHEET_BY_MONTH[match[2]] : ''
        };
    }

    function createError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    function getCollections(input = {}) {
        return {
            escolas: Array.isArray(input.escolas) ? input.escolas : [],
            competencias: Array.isArray(input.competencias) ? input.competencias : [],
            programas: Array.isArray(input.programas) ? input.programas : [],
            verificacoes: input.verificacoes && typeof input.verificacoes === 'object' ? input.verificacoes : {}
        };
    }

    function buildSmeExportModel(input = {}) {
        const { escolas, competencias, programas, verificacoes } = getCollections(input);
        const programById = new Map(programas.map(program => [String(program.id), program]));
        const records = [];
        const ignoredPrograms = new Map();
        const ignoredExercises = new Set();
        const invalidRecords = [];
        const duplicateTargets = [];
        const targetKeys = new Set();

        escolas.forEach(escola => {
            const designationKey = normalizeDesignation(escola.designação || escola.designacao || escola.id);
            (competencias || []).forEach(competencia => {
                const parsed = parseCompetence(competencia && (competencia.key || competencia.id));
                if (!parsed) return;
                if (parsed.year !== TEMPLATE_YEAR) {
                    ignoredExercises.add(parsed.year);
                    return;
                }

                (Array.isArray(escola.programasIds) ? escola.programasIds : []).forEach(programId => {
                    const verification = verificacoes[escola.id]
                        && verificacoes[escola.id][`${parsed.key}_${programId}`];
                    if (!verification || !text(verification.resultadoBonif)) return;

                    const program = programById.get(String(programId)) || { id: programId, name: programId };
                    const programKey = resolveProgramKey(program);
                    if (!programKey) {
                        const label = text(program.name || program.nome || program.id || programId) || String(programId);
                        ignoredPrograms.set(label, (ignoredPrograms.get(label) || 0) + 1);
                        return;
                    }
                    if (!designationKey) {
                        invalidRecords.push({
                            schoolId: escola.id,
                            competence: parsed.key,
                            programId,
                            reason: 'designação ausente ou inválida'
                        });
                        return;
                    }

                    const bonification = verification.bonificacao || {};
                    const values = DOCUMENT_KEYS.map(key => normalizeSmeValue(bonification[key]));
                    const missing = DOCUMENT_KEYS.filter((key, index) => !values[index]);
                    if (missing.length > 0) {
                        invalidRecords.push({
                            schoolId: escola.id,
                            designation: escola.designação || escola.designacao,
                            competence: parsed.key,
                            programId,
                            missing
                        });
                        return;
                    }

                    const targetKey = `${parsed.sheetName}|${designationKey}|${programKey}`;
                    if (targetKeys.has(targetKey)) {
                        duplicateTargets.push({
                            sheetName: parsed.sheetName,
                            designationKey,
                            programKey
                        });
                        return;
                    }
                    targetKeys.add(targetKey);

                    records.push(Object.freeze({
                        schoolId: String(escola.id),
                        designation: text(escola.designação || escola.designacao),
                        designationKey,
                        denomination: text(escola.denominação || escola.denominacao),
                        competenceKey: parsed.key,
                        sheetName: parsed.sheetName,
                        programId: String(programId),
                        programKey,
                        values: Object.freeze(values),
                        result: text(verification.resultadoBonif).toUpperCase()
                    }));
                });
            });
        });

        if (invalidRecords.length > 0) {
            throw createError(
                'INVALID_SME_DATA',
                'A exportação Excel SME foi bloqueada porque há registros consolidados incompletos ou sem designação válida.',
                invalidRecords
            );
        }
        if (duplicateTargets.length > 0) {
            throw createError(
                'DUPLICATE_SME_TARGET',
                'A exportação Excel SME encontrou mais de um registro para a mesma escola, competência e programa.',
                duplicateTargets
            );
        }
        if (records.length === 0) {
            throw createError(
                'NO_SME_ROWS',
                'Não há bonificações consolidadas de 2026 para os programas Básico, Qualidade ou Equidade.'
            );
        }

        records.sort((left, right) => (
            left.competenceKey.localeCompare(right.competenceKey)
            || left.designationKey.localeCompare(right.designationKey, 'pt-BR', { numeric: true })
            || left.programKey.localeCompare(right.programKey)
        ));

        return Object.freeze({
            version: VERSION,
            template: Object.freeze({
                year: TEMPLATE_YEAR,
                parts: TEMPLATE_PART_URLS,
                sha256: TEMPLATE_SHA256,
                fileName: TEMPLATE_FILE_NAME,
                expectedSheetOrder: EXPECTED_SHEET_ORDER,
                firstDataRow: 2,
                lastDataRow: 164
            }),
            fileName: OUTPUT_FILE_NAME,
            records: Object.freeze(records),
            diagnostics: Object.freeze({
                exportedRecords: records.length,
                ignoredPrograms: Object.freeze(Array.from(ignoredPrograms.entries()).map(([name, count]) => ({ name, count }))),
                ignoredExercises: Object.freeze(Array.from(ignoredExercises).sort((a, b) => a - b))
            })
        });
    }

    return Object.freeze({
        DECEMBER_PROGRAM_COLUMNS,
        DOCUMENT_KEYS,
        EXPECTED_SHEET_ORDER,
        OUTPUT_FILE_NAME,
        SHEET_BY_MONTH,
        STANDARD_PROGRAM_COLUMNS,
        TEMPLATE_FILE_NAME,
        TEMPLATE_SHA256,
        TEMPLATE_PART_URLS,
        TEMPLATE_YEAR,
        VERSION,
        buildSmeExportModel,
        getProgramColumns,
        normalizeDesignation,
        normalizeSmeValue,
        parseCompetence,
        resolveProgramKey
    });
}));
