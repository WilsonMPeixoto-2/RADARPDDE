(function (root, factory) {
    const flowApi = typeof module === 'object' && module.exports
        ? require('./fluxo-operacional.js')
        : root && root.RadarFluxoOperacional;
    const api = factory(flowApi);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeExportModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (flowApi) {
    'use strict';

    if (!flowApi || typeof flowApi.evaluateMonthlyEvaluation !== 'function') {
        throw new Error('As regras canônicas do fluxo operacional não foram carregadas.');
    }

    const VERSION = '2.2.0';
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
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               BÁSICO'
        ]),
        QUALIDADE: Object.freeze([
            'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                QUALIDADE',
            ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               QUALIDADE',
            'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              QUALIDADE',
            'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          QUALIDADE',
            'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 QUALIDADE',
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               QUALIDADE'
        ]),
        EQUIDADE: Object.freeze([
            'EXTRATO CONTA CORRENTE (DO MÊS FECHADO)                EQUIDADE',
            ' EXTRATO INVESTIMENTO (DO MÊS FECHADO)               EQUIDADE',
            'NOTAS FISCAIS     (CASO TENHA EFETUADO DESPESA)              EQUIDADE',
            'CONSULTA ASSESSORIA (NO CASO DE PRESTAÇÃO DE SERVIÇOS)          EQUIDADE',
            'DECLARAÇÃO BB ÁGIL (CASO TENHA DESPESAS A SEREM LANÇADAS)                 EQUIDADE',
            'ENCAMINHADO P/ INVENTARIAÇÃO (AQUISIÇÃO COM A NATUREZA DE CAPITAL)               EQUIDADE'
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

    function hasStartedValue(value) {
        return value !== undefined && value !== null && value !== '' && value !== false;
    }

    function hasStartedVerification(verification) {
        if (!verification || typeof verification !== 'object') return false;
        const bonification = verification.bonificacao || verification.bonification || {};
        return DOCUMENT_KEYS.some(key => hasStartedValue(bonification[key]));
    }

    function evaluateVerification(verification, programId = '') {
        const candidate = verification && typeof verification === 'object' ? verification : {};
        return flowApi.evaluateMonthlyEvaluation({
            bonificacao: candidate.bonificacao || candidate.bonification || {},
            analise: candidate.analise || candidate.analysis || {},
            resultadoBonif: candidate.resultadoBonif || candidate.bonus_result || '',
            programId,
            pendencias: []
        });
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

    function normalizeDesignationKey(value) {
        const digits = text(value).replace(/\D/g, '');
        if (digits) return digits;
        return normalizeToken(value).replace(/\s+/g, '');
    }

    function assertUniqueSchoolDesignations(schools = []) {
        const seen = new Map();
        schools.forEach(school => {
            const designation = getSchoolDesignation(school);
            const designationKey = normalizeDesignationKey(designation);
            if (!designationKey) {
                throw createError(
                    'SME_MISSING_DESIGNATION',
                    'Uma unidade escolar não possui designação válida para o Excel SME.',
                    { schoolId: text(school?.id) || null }
                );
            }
            const previous = seen.get(designationKey);
            if (previous) {
                throw createError(
                    'SME_DUPLICATE_DESIGNATION',
                    `A designação ${designation} aparece mais de uma vez no cadastro do Excel SME.`,
                    {
                        designationKey,
                        firstSchoolId: text(previous.id) || null,
                        secondSchoolId: text(school?.id) || null,
                        firstDesignation: getSchoolDesignation(previous),
                        secondDesignation: designation
                    }
                );
            }
            seen.set(designationKey, school);
        });
        return true;
    }

    function accountColumns(programKey, startColumn) {
        return DOCUMENT_KEYS.map((documentKey, index) => ({
            key: `${programKey.toLowerCase()}_${documentKey}`,
            label: ACCOUNT_HEADERS[programKey][index],
            group: programKey,
            programKey,
            documentKey,
            sourceColumn: startColumn + index,
            width: 19.43,
            alignment: 'center'
        }));
    }

    function buildColumns() {
        const columns = [
            { key: 'order', label: 'CRE', group: 'IDENTIFICAÇÃO', width: 5, alignment: 'center', mergeAcross: 2 },
            { key: 'cre', label: '', group: 'IDENTIFICAÇÃO', width: 3.86, alignment: 'center', mergedHeader: true },
            { key: 'designation', label: 'DESIGNAÇÃO', group: 'IDENTIFICAÇÃO', width: 12.86, alignment: 'center' },
            { key: 'denomination', label: 'ESCOLA', group: 'IDENTIFICAÇÃO', width: 60.29, alignment: 'left' },
            ...accountColumns('BASIC', 5),
            ...accountColumns('QUALIDADE', 11),
            ...accountColumns('EQUIDADE', 17),
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
            if (key && program.id != null) map.get(key).add(String(program.id));
        });
        return new Map([...map.entries()].map(([key, ids]) => [key, [...ids]]));
    }

    function collectProgramContexts(state, school, competenceKey, programKey, programIdsByKey) {
        const schoolVerifications = state.verificacoes?.[school.id] || {};
        const linkedIds = Array.isArray(school.programasIds)
            ? school.programasIds.map(String)
            : [];
        const candidates = programIdsByKey.get(programKey) || [];
        const eligibleIds = linkedIds.length
            ? candidates.filter(id => linkedIds.includes(id))
            : candidates.filter(id => schoolVerifications[`${competenceKey}_${id}`]);
        return eligibleIds.map(programId => {
            const verification = schoolVerifications[`${competenceKey}_${programId}`] || null;
            return Object.freeze({
                programId,
                verification,
                started: hasStartedVerification(verification),
                evaluation: evaluateVerification(verification, programId)
            });
        });
    }

    function buildProgramValues(contexts = []) {
        return Object.freeze(Object.fromEntries(DOCUMENT_KEYS.map(key => [
            key,
            aggregateSmeValues(contexts.map(context => (
                context.verification?.bonificacao?.[key]
                ?? context.verification?.bonification?.[key]
            )))
        ])));
    }

    function resolveSystematicStatus(contexts = []) {
        if (!contexts.length || !contexts.some(context => context.started)) return '';
        return contexts.every(context => context.started && context.evaluation.canConsolidate)
            ? 'SIM'
            : 'NÃO';
    }

    function resolveSchoolStatus(contextsByProgram = {}) {
        const contexts = PROGRAM_KEYS.flatMap(programKey => contextsByProgram[programKey] || []);
        if (!contexts.length || !contexts.some(context => context.started)) return '';
        if (contexts.some(context => context.evaluation.canConsolidate && context.evaluation.bonusResult === 'inapta')) {
            return 'INAPTA';
        }
        if (contexts.every(context => context.started
            && context.evaluation.canConsolidate
            && context.evaluation.bonusResult === 'apta')) {
            return 'APTA';
        }
        return '';
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
        assertUniqueSchoolDesignations(schools);
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
            const contextsByProgram = Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                programKey,
                collectProgramContexts(state, school, competence.key, programKey, programIdsByKey)
            ]));
            const valuesByProgram = Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                programKey,
                buildProgramValues(contextsByProgram[programKey])
            ]));
            const row = {
                order: index + 1,
                cre: getSchoolCre(school),
                designation: getSchoolDesignation(school),
                denomination: getSchoolDenomination(school),
                status: resolveSchoolStatus(contextsByProgram),
                deliveryDate: '',
                correctionDate: '',
                opinion: '',
                notes: '',
                sourcePrograms: Object.freeze(Object.fromEntries(PROGRAM_KEYS.map(programKey => [
                    programKey,
                    Object.freeze(contextsByProgram[programKey].map(context => context.programId))
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
                populatedCells: rows.reduce((sum, row) => (
                    sum + PROGRAM_KEYS.reduce((programSum, programKey) => (
                        programSum + DOCUMENT_KEYS.filter(key => row[`${programKey.toLowerCase()}_${key}`]).length
                    ), 0)
                ), 0),
                determinedStatuses: rows.filter(row => row.status).length
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
        assertUniqueSchoolDesignations,
        buildColumns,
        buildSmeMonthlyModel,
        collectProgramContexts,
        designationSortKey,
        normalizeDesignationKey,
        normalizeSmeValue,
        parseCompetence,
        resolveProgramKey,
        resolveSchoolStatus,
        resolveSystematicStatus
    });
}));
