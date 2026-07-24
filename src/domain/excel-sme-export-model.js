(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeExportModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.1.0';
    const DOCUMENT_KEYS = Object.freeze([
        'extCC',
        'extINV',
        'notaFiscal',
        'consAssessoria',
        'declBBAgil',
        'encampInventario'
    ]);
    const DOCUMENT_LABELS = Object.freeze([
        'EXTRATO CONTA CORRENTE',
        'EXTRATO INVESTIMENTO',
        'NOTAS FISCAIS',
        'CONSULTA ASSESSORIA',
        'DECLARAÇÃO BB ÁGIL',
        'ENCAMINHADO PARA INVENTARIAÇÃO'
    ]);
    const MONTH_NAMES = Object.freeze([
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]);
    const PROGRAM_KEYS = Object.freeze(['BASIC', 'QUALIDADE', 'EQUIDADE']);
    const ACCOUNT_PROGRAM_IDS = Object.freeze({
        BASIC: Object.freeze(['BASIC']),
        QUALIDADE: Object.freeze([
            'CONECTADA',
            'PROEC',
            'ED_FAMILIA',
            'ADOLESCENCIAS',
            'LEITURA',
            'TEMPO_APRENDER'
        ]),
        EQUIDADE: Object.freeze(['RECURSOS'])
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

    function createError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    function parseCompetence(value) {
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(text(value));
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const monthText = String(month).padStart(2, '0');
        return Object.freeze({
            key: `${year}-${monthText}`,
            year,
            month,
            monthText,
            sheetName: MONTH_NAMES[month - 1],
            fileName: `RADAR_PDDE_EXCEL_SME_${monthText}-${year}.xlsx`
        });
    }

    function resolveProgramKey(program = {}) {
        const id = normalizeToken(program.id).replace(/\s+/g, '_');
        for (const programKey of PROGRAM_KEYS) {
            if (ACCOUNT_PROGRAM_IDS[programKey].includes(id)) return programKey;
        }
        const token = normalizeToken([
            program.id,
            program.name,
            program.nome,
            program.label,
            program.description,
            program.desc
        ].filter(Boolean).join(' '));
        if (/\b(BASIC|BASICO)\b/.test(token)) return 'BASIC';
        if (/\b(EQUIDADE|SALA DE RECURSOS|RECURSOS MULTIFUNCIONAIS|DIVERSIDADES|AGUA E ESGOTAMENTO)\b/.test(token)) {
            return 'EQUIDADE';
        }
        if (/\b(QUALIDADE|CONECTADA|ESCOLA E COMUNIDADE|PROEC|LEITURA|ADOLESCENCIAS|TEMPO DE APRENDER|EDUCACAO E FAMILIA)\b/.test(token)) {
            return 'QUALIDADE';
        }
        return '';
    }

    function normalizeSmeValue(value) {
        const token = normalizeToken(value);
        if (token === 'SIM') return 'SIM';
        if (token === 'NAO') return 'NÃO';
        if (['NAO SE APLICA', 'N A', 'NA'].includes(token)) return 'NÃO SE APLICA';
        return '';
    }

    function aggregateSmeValues(values = []) {
        const normalized = values.map(normalizeSmeValue).filter(Boolean);
        if (!normalized.length) return '';
        if (normalized.includes('NÃO')) return 'NÃO';
        if (normalized.includes('SIM')) return 'SIM';
        return 'NÃO SE APLICA';
    }

    function designationSortKey(value) {
        const digits = text(value).replace(/\D/g, '');
        return digits ? Number.parseInt(digits, 10) : Number.MAX_SAFE_INTEGER;
    }

    function getSchoolDesignation(school = {}) {
        return text(school.designação || school.designacao || school.id);
    }

    function getSchoolDenomination(school = {}) {
        return text(school.denominação || school.denominacao || school.name || school.nome);
    }

    function getSchoolCre(school = {}) {
        return text(school.cre || school.coordenadoria || school.regional || '4ª CRE');
    }

    function buildColumns() {
        const identity = [
            { key: 'order', label: 'Nº', group: 'IDENTIFICAÇÃO', width: 7, alignment: 'center' },
            { key: 'cre', label: 'CRE', group: 'IDENTIFICAÇÃO', width: 10, alignment: 'center' },
            { key: 'designation', label: 'DESIGNAÇÃO', group: 'IDENTIFICAÇÃO', width: 17, alignment: 'center' },
            { key: 'denomination', label: 'UNIDADE ESCOLAR', group: 'IDENTIFICAÇÃO', width: 42, alignment: 'left' }
        ];
        const programLabels = {
            BASIC: 'PDDE BÁSICO',
            QUALIDADE: 'PDDE QUALIDADE',
            EQUIDADE: 'PDDE EQUIDADE'
        };
        const programs = PROGRAM_KEYS.flatMap(programKey => DOCUMENT_LABELS.map((label, index) => ({
            key: `${programKey.toLowerCase()}_${DOCUMENT_KEYS[index]}`,
            label,
            group: programLabels[programKey],
            programKey,
            documentKey: DOCUMENT_KEYS[index],
            width: index === 5 ? 23 : 18,
            alignment: 'center'
        })));
        const administrative = [
            { key: 'deliveryDate', label: 'DATA DE ENTREGA', group: 'INFORMAÇÕES COMPLEMENTARES', width: 16, alignment: 'center' },
            { key: 'correctionDate', label: 'DATA DE CORREÇÃO', group: 'INFORMAÇÕES COMPLEMENTARES', width: 16, alignment: 'center' },
            { key: 'opinion', label: 'PARECER', group: 'INFORMAÇÕES COMPLEMENTARES', width: 20, alignment: 'left' },
            { key: 'notes', label: 'OBSERVAÇÕES', group: 'INFORMAÇÕES COMPLEMENTARES', width: 34, alignment: 'left' }
        ];
        return Object.freeze([...identity, ...programs, ...administrative].map(Object.freeze));
    }

    function findProgramIdsByKey(programs = []) {
        const map = new Map(PROGRAM_KEYS.map(key => [key, new Set(ACCOUNT_PROGRAM_IDS[key])]));
        programs.forEach(program => {
            const key = resolveProgramKey(program);
            if (key) map.get(key).add(String(program.id));
        });
        return new Map([...map.entries()].map(([key, ids]) => [key, [...ids]]));
    }

    function findConsolidatedVerifications(state, school, competenceKey, programKey, programIdsByKey) {
        const schoolVerifications = state.verificacoes?.[school.id] || {};
        const linkedIds = Array.isArray(school.programasIds)
            ? school.programasIds.map(String)
            : [];
        const candidates = programIdsByKey.get(programKey) || [];
        const eligibleIds = linkedIds.length
            ? candidates.filter(id => linkedIds.includes(id))
            : candidates;
        return eligibleIds
            .map(programId => ({
                programId,
                verification: schoolVerifications[`${competenceKey}_${programId}`]
            }))
            .filter(item => item.verification && text(item.verification.resultadoBonif));
    }

    function buildProgramValues(items = []) {
        return Object.freeze(Object.fromEntries(DOCUMENT_KEYS.map(key => [
            key,
            aggregateSmeValues(items.map(item => item.verification?.bonificacao?.[key]))
        ])));
    }

    function buildSmeMonthlyModel(input = {}) {
        const competence = parseCompetence(input.activeCompetenciaKey);
        if (!competence) {
            throw createError(
                'INVALID_SME_COMPETENCE',
                'Selecione uma competência mensal antes de gerar o Excel SME.'
            );
        }
        const schools = Array.isArray(input.escolas) ? [...input.escolas] : [];
        if (!schools.length) {
            throw createError('NO_SME_SCHOOLS', 'Não há unidades escolares carregadas para gerar o Excel SME.');
        }
        const programs = Array.isArray(input.programas) ? input.programas : [];
        const state = {
            verificacoes: input.verificacoes && typeof input.verificacoes === 'object'
                ? input.verificacoes
                : {}
        };
        const programIdsByKey = findProgramIdsByKey(programs);
        schools.sort((left, right) => (
            designationSortKey(getSchoolDesignation(left)) - designationSortKey(getSchoolDesignation(right))
            || getSchoolDesignation(left).localeCompare(getSchoolDesignation(right), 'pt-BR')
            || getSchoolDenomination(left).localeCompare(getSchoolDenomination(right), 'pt-BR')
        ));

        const rows = schools.map((school, index) => {
            const sourcePrograms = Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                programKey,
                findConsolidatedVerifications(state, school, competence.key, programKey, programIdsByKey)
            ]));
            const valuesByProgram = Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                programKey,
                buildProgramValues(sourcePrograms[programKey])
            ]));
            const row = {
                order: index + 1,
                cre: getSchoolCre(school),
                designation: getSchoolDesignation(school),
                denomination: getSchoolDenomination(school),
                deliveryDate: '',
                correctionDate: '',
                opinion: '',
                notes: '',
                sourcePrograms: Object.freeze(Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                    programKey,
                    Object.freeze(sourcePrograms[programKey].map(item => item.programId))
                ])))
            };
            PROGRAM_KEYS.forEach(programKey => {
                DOCUMENT_KEYS.forEach(documentKey => {
                    row[`${programKey.toLowerCase()}_${documentKey}`] = valuesByProgram[programKey][documentKey];
                });
            });
            return Object.freeze(row);
        });

        return Object.freeze({
            version: VERSION,
            competenceKey: competence.key,
            competence,
            sheetName: competence.sheetName,
            fileName: competence.fileName,
            columns: buildColumns(),
            rows: Object.freeze(rows),
            diagnostics: Object.freeze({
                schoolCount: rows.length,
                consolidatedCells: rows.reduce((sum, row) => (
                    sum + PROGRAM_KEYS.reduce((programSum, programKey) => (
                        programSum + DOCUMENT_KEYS.filter(key => row[`${programKey.toLowerCase()}_${key}`]).length
                    ), 0)
                ), 0)
            })
        });
    }

    return Object.freeze({
        ACCOUNT_PROGRAM_IDS,
        DOCUMENT_KEYS,
        DOCUMENT_LABELS,
        MONTH_NAMES,
        PROGRAM_KEYS,
        VERSION,
        aggregateSmeValues,
        buildColumns,
        buildSmeMonthlyModel,
        designationSortKey,
        normalizeSmeValue,
        parseCompetence,
        resolveProgramKey
    });
}));
