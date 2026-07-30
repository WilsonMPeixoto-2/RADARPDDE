(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeExportModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '2.0.0';
    const DOCUMENT_KEYS = Object.freeze([
        'extCC',
        'extINV',
        'notaFiscal',
        'consAssessoria',
        'declBBAgil',
        'encampInventario'
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

    const ACCOUNT_HEADERS = Object.freeze({
        BASIC: Object.freeze([
            'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                 BÁSICO',
            ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               BÁSICO',
            'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)               BÁSICO',
            'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)           BÁSICO',
            'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 BÁSICO',
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               BÁSICO',
            'SISTEMÁTICA PREENCHIDA'
        ]),
        QUALIDADE: Object.freeze([
            'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                QUALIDADE',
            ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               QUALIDADE',
            'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              QUALIDADE',
            'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          QUALIDADE',
            'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 QUALIDADE',
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               QUALIDADE',
            'SISTEMÁTICA PREENCHIDA'
        ]),
        EQUIDADE: Object.freeze([
            'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                EQUIDADE',
            ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               EQUIDADE',
            'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              EQUIDADE',
            'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          EQUIDADE',
            'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 EQUIDADE',
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               EQUIDADE',
            'SISTEMÁTICA PREENCHIDA'
        ])
    });

    const ORIGINAL_HEADER_LABELS = Object.freeze([
        'CRE',
        '',
        'DESIGNAÇÃO',
        'ESCOLA',
        ...ACCOUNT_HEADERS.BASIC,
        ...ACCOUNT_HEADERS.QUALIDADE,
        ...ACCOUNT_HEADERS.EQUIDADE,
        'STATUS',
        'DATA DA ENTREGA DE DOCUMENTOS',
        'DATA DA CORREÇÃO DOS DOCUMENTOS ENVIADOS',
        'PARECER               (CORREÇÃO MENSAL DA PRESTAÇÃO DE CONTAS)',
        'OBSERVAÇÕES'
    ]);

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

    function normalizeResult(value) {
        const token = normalizeToken(value);
        if (token === 'APTA') return 'APTA';
        if (token === 'INAPTA') return 'INAPTA';
        return '';
    }

    function aggregateStatus(itemsByProgram = {}) {
        const values = PROGRAM_KEYS.flatMap(programKey => (
            Array.isArray(itemsByProgram[programKey])
                ? itemsByProgram[programKey].map(item => normalizeResult(item.verification?.resultadoBonif))
                : []
        )).filter(Boolean);
        if (values.includes('INAPTA')) return 'INAPTA';
        if (values.includes('APTA')) return 'APTA';
        return '';
    }

    function designationSortKey(value) {
        const digits = text(value).replace(/\D/g, '');
        return digits ? Number.parseInt(digits, 10) : Number.MAX_SAFE_INTEGER;
    }

    function getSchoolDesignation(school = {}) {
        return text(school.designação || school.designacao || school.id);
    }

    function formatSmeDesignation(value) {
        const digits = text(value).replace(/\D/g, '');
        if (!digits) return text(value);
        const numeric = Number.parseInt(digits, 10);
        return Number.isSafeInteger(numeric) ? numeric : digits;
    }

    function getSchoolDenomination(school = {}) {
        return text(school.denominação || school.denominacao || school.name || school.nome).toUpperCase();
    }

    function getSchoolCre(school = {}) {
        return text(school.cre || school.coordenadoria || school.regional || '4ª CRE')
            .replace(/\s*CRE$/i, '')
            .trim();
    }

    function accountColumns(programKey, startIndex) {
        const group = programKey;
        const documentColumns = DOCUMENT_KEYS.map((documentKey, index) => ({
            key: `${programKey.toLowerCase()}_${documentKey}`,
            label: ACCOUNT_HEADERS[programKey][index],
            group,
            programKey,
            documentKey,
            width: 19.43,
            alignment: 'center',
            sourceColumn: startIndex + index
        }));
        return [
            ...documentColumns,
            {
                key: `${programKey.toLowerCase()}_systematic`,
                label: ACCOUNT_HEADERS[programKey][6],
                group,
                programKey,
                systematic: true,
                width: 19.43,
                alignment: 'center',
                sourceColumn: startIndex + 6
            }
        ];
    }

    function buildColumns() {
        const columns = [
            { key: 'order', label: 'CRE', group: 'IDENTIFICAÇÃO', width: 5, alignment: 'center', mergeAcross: 2 },
            { key: 'cre', label: '', group: 'IDENTIFICAÇÃO', width: 3.86, alignment: 'center', mergedHeader: true },
            { key: 'designation', label: 'DESIGNAÇÃO', group: 'IDENTIFICAÇÃO', width: 12.86, alignment: 'center' },
            { key: 'denomination', label: 'ESCOLA', group: 'IDENTIFICAÇÃO', width: 60.29, alignment: 'left' },
            ...accountColumns('BASIC', 5),
            ...accountColumns('QUALIDADE', 12),
            ...accountColumns('EQUIDADE', 19),
            { key: 'status', label: 'STATUS', group: 'ADMINISTRATIVO', width: 15.29, alignment: 'center' },
            { key: 'deliveryDate', label: 'DATA DA ENTREGA DE DOCUMENTOS', group: 'ADMINISTRATIVO', width: 15.29, alignment: 'center' },
            { key: 'correctionDate', label: 'DATA DA CORREÇÃO DOS DOCUMENTOS ENVIADOS', group: 'ADMINISTRATIVO', width: 15.29, alignment: 'center' },
            { key: 'opinion', label: 'PARECER               (CORREÇÃO MENSAL DA PRESTAÇÃO DE CONTAS)', group: 'ADMINISTRATIVO', width: 22.29, alignment: 'left' },
            { key: 'notes', label: 'OBSERVAÇÕES', group: 'ADMINISTRATIVO', width: 52.71, alignment: 'left' }
        ];
        return Object.freeze(columns.map(Object.freeze));
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
                designation: formatSmeDesignation(getSchoolDesignation(school)),
                denomination: getSchoolDenomination(school),
                status: aggregateStatus(sourcePrograms),
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
                row[`${programKey.toLowerCase()}_systematic`] = sourcePrograms[programKey].length ? 'SIM' : '';
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
        ACCOUNT_HEADERS,
        ACCOUNT_PROGRAM_IDS,
        DOCUMENT_KEYS,
        MONTH_NAMES,
        ORIGINAL_HEADER_LABELS,
        PROGRAM_KEYS,
        VERSION,
        aggregateSmeValues,
        aggregateStatus,
        buildColumns,
        buildSmeMonthlyModel,
        designationSortKey,
        formatSmeDesignation,
        normalizeSmeValue,
        parseCompetence,
        resolveProgramKey
    });
}));
