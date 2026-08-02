(function installRadarGlobalSearchIndex(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarGlobalSearchIndex = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createGlobalSearchIndexApi() {
    'use strict';

    const DEFAULT_LIMIT = 8;
    const MIN_QUERY_LENGTH = 2;

    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeRoute(route = {}) {
        return {
            view: String(route.view || 'dashboard'),
            param: route.param === undefined || route.param === null || route.param === ''
                ? null
                : String(route.param),
            filters: route.filters && typeof route.filters === 'object'
                ? { ...route.filters }
                : {}
        };
    }

    function uniqueStrings(values) {
        return [...new Set((values || [])
            .map(value => String(value || '').trim())
            .filter(Boolean))];
    }

    function createSchoolItem(school) {
        const id = String(school.id || school.designação || school.designacao || '').trim();
        const title = String(school.denominação || school.denominacao || school.nome || id).trim();
        const designation = String(school.designação || school.designacao || id).trim();
        return {
            id: `school:${id}`,
            type: 'school',
            title,
            subtitle: designation,
            keywords: uniqueStrings([
                id,
                designation,
                school.sici,
                school.inep,
                school.email,
                school.diretor,
                school.diretorAdjunto
            ]),
            route: normalizeRoute({ view: 'prontuario', param: id }),
            priority: 10
        };
    }

    function createModuleItem(module) {
        const id = String(module.id || module.view || '').trim();
        const title = String(module.title || module.label || id).trim();
        return {
            id: `module:${id}`,
            type: 'module',
            title,
            subtitle: 'Área do RADAR PDDE',
            keywords: uniqueStrings([id, ...(module.keywords || [])]),
            route: normalizeRoute({ view: module.view || id }),
            priority: 20
        };
    }

    function createProgramItem(program, visibleSchools) {
        const id = String(program.id || '').trim();
        const linkedSchools = visibleSchools.filter(school => (
            Array.isArray(school.programasIds) && school.programasIds.map(String).includes(id)
        ));
        return {
            id: `program:${id}`,
            type: 'program',
            title: String(program.name || program.nome || id).trim(),
            subtitle: `${linkedSchools.length} unidade(s) vinculada(s)`,
            keywords: uniqueStrings([
                id,
                program.desc,
                program.descricao,
                ...linkedSchools.map(school => school.denominação || school.denominacao || school.id)
            ]),
            route: normalizeRoute({ view: 'escolas' }),
            priority: 30
        };
    }

    function createCompetenceItem(competence) {
        const id = String(competence.id || competence.value || competence.competencia || '').trim();
        const title = String(competence.label || competence.nome || competence.title || id).trim();
        return {
            id: `competence:${id}`,
            type: 'competence',
            title,
            subtitle: id,
            keywords: uniqueStrings([id, competence.exercicio, competence.year]),
            route: normalizeRoute({ view: 'competencias' }),
            priority: 40
        };
    }

    function createPendencyItem(pendency, schoolsById) {
        const id = String(pendency.id || '').trim();
        const schoolId = String(pendency.escolaId || pendency.schoolId || '').trim();
        const school = schoolsById.get(schoolId);
        const documentName = String(
            pendency.documento
            || pendency.documentoNome
            || pendency.tipo
            || pendency.descricao
            || 'Pendência operacional'
        ).trim();
        return {
            id: `pendency:${id}`,
            type: 'pendency',
            title: documentName,
            subtitle: school
                ? String(school.denominação || school.denominacao || school.id)
                : schoolId,
            keywords: uniqueStrings([
                id,
                schoolId,
                pendency.status,
                pendency.programaId,
                pendency.competencia,
                school?.denominação,
                school?.denominacao,
                school?.designação,
                school?.designacao
            ]),
            route: normalizeRoute({
                view: 'pendencias',
                filters: schoolId ? { escola: schoolId } : {}
            }),
            priority: 50
        };
    }

    function createSearchCatalog(context = {}) {
        const schools = Array.isArray(context.schools) ? context.schools : [];
        const allowedIds = Array.isArray(context.allowedSchoolIds)
            ? new Set(context.allowedSchoolIds.map(String))
            : null;
        const visibleSchools = schools.filter(school => {
            const id = String(school?.id || school?.designação || school?.designacao || '');
            return id && (!allowedIds || allowedIds.has(id));
        });
        const schoolsById = new Map(visibleSchools.map(school => [String(school.id), school]));
        const modules = (Array.isArray(context.modules) ? context.modules : [])
            .filter(module => module && module.visible !== false);
        const linkedProgramIds = new Set(visibleSchools.flatMap(school => (
            Array.isArray(school.programasIds) ? school.programasIds.map(String) : []
        )));
        const programs = (Array.isArray(context.programs) ? context.programs : [])
            .filter(program => program && linkedProgramIds.has(String(program.id || '')));
        const competencies = (Array.isArray(context.competencies) ? context.competencies : [])
            .filter(competence => competence && (competence.id || competence.value || competence.competencia));
        const pendencies = (Array.isArray(context.pendencies) ? context.pendencies : [])
            .filter(pendency => {
                const schoolId = String(pendency?.escolaId || pendency?.schoolId || '');
                return pendency?.id && (!schoolId || schoolsById.has(schoolId));
            });

        const catalog = [
            ...visibleSchools.map(createSchoolItem),
            ...modules.map(createModuleItem),
            ...programs.map(program => createProgramItem(program, visibleSchools)),
            ...competencies.map(createCompetenceItem),
            ...pendencies.map(pendency => createPendencyItem(pendency, schoolsById))
        ];

        const byId = new Map();
        catalog.forEach(item => {
            if (item.id && !byId.has(item.id)) byId.set(item.id, item);
        });
        return [...byId.values()].sort((left, right) => (
            left.priority - right.priority
            || left.title.localeCompare(right.title, 'pt-BR')
        ));
    }

    function createSearchEngine(FuseCtor, items = []) {
        if (typeof FuseCtor !== 'function') {
            throw new TypeError('Construtor Fuse.js indisponível.');
        }
        return new FuseCtor(items, {
            includeScore: true,
            shouldSort: true,
            ignoreLocation: true,
            threshold: 0.36,
            minMatchCharLength: MIN_QUERY_LENGTH,
            keys: [
                { name: 'title', weight: 0.5 },
                { name: 'subtitle', weight: 0.25 },
                { name: 'keywords', weight: 0.25 }
            ]
        });
    }

    function searchCatalog(engine, query, limit = DEFAULT_LIMIT) {
        const normalized = normalizeSearchText(query);
        if (normalized.length < MIN_QUERY_LENGTH || !engine || typeof engine.search !== 'function') {
            return [];
        }
        const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
        return engine.search(normalized, { limit: safeLimit })
            .map(result => result?.item || result)
            .filter(Boolean);
    }

    return Object.freeze({
        DEFAULT_LIMIT,
        MIN_QUERY_LENGTH,
        normalizeSearchText,
        createSearchCatalog,
        createSearchEngine,
        searchCatalog
    });
}));
