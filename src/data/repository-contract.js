(function installRadarRepositoryContract(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarRepositoryContract = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRepositoryContract() {
    'use strict';

    const SNAPSHOT_FORMAT = 'radar-pdde-snapshot';

    const RADAR_ENTITIES = Object.freeze([
        'appConfig',
        'programs',
        'profiles',
        'userProfiles',
        'userSchoolScopes',
        'controllers',
        'inventoryTeamMembers',
        'schools',
        'schoolPrograms',
        'competences',
        'verifications',
        'pendencies',
        'pendencyAttempts',
        'pendencyContacts',
        'assets',
        'registeredInvoices',
        'administrativeLogs',
        'dataImportRuns',
        'auditEvents'
    ]);

    function lifecycle(growth, remoteLoad, scope) {
        return Object.freeze({
            growth,
            remoteLoad,
            scope: String(scope || ''),
            // Em modo Supabase o navegador nunca é fonte persistente de dados operacionais.
            remoteBrowserPersistence: false
        });
    }

    const ENTITY_LIFECYCLE = Object.freeze({
        appConfig: lifecycle('bounded', 'bootstrap', 'configuração singleton da aplicação'),
        programs: lifecycle('bounded', 'bootstrap', 'catálogo institucional de programas'),
        profiles: lifecycle('bounded', 'auth-only', 'catálogo de perfis de autorização'),
        userProfiles: lifecycle('bounded', 'auth-only', 'vínculo de perfil da conta autenticada'),
        userSchoolScopes: lifecycle('scoped', 'auth-only', 'escopo escolar atribuído à conta autenticada'),
        controllers: lifecycle('bounded', 'bootstrap', 'catálogo institucional de controladores'),
        inventoryTeamMembers: lifecycle('bounded', 'bootstrap', 'equipe institucional de inventário'),
        schools: lifecycle('bounded', 'bootstrap', 'carteira de unidades autorizada por RLS'),
        schoolPrograms: lifecycle('scoped', 'bootstrap', 'vínculos programa × unidade autorizados por RLS'),
        competences: lifecycle('scoped', 'bootstrap', 'calendário de competências dos exercícios configurados'),
        verifications: lifecycle('scoped', 'context', 'somente a competência operacional selecionada'),
        pendencies: lifecycle('workflow', 'context', 'competência selecionada mais pendências ainda ativas'),
        pendencyAttempts: lifecycle('workflow', 'context', 'somente tentativas das pendências presentes no contexto operacional'),
        pendencyContacts: lifecycle('workflow', 'context', 'somente contatos das pendências presentes no contexto operacional'),
        assets: lifecycle('workflow', 'context', 'competência selecionada mais bens ainda não inventariados'),
        registeredInvoices: lifecycle('scoped', 'context', 'somente despesas e documentos da competência operacional selecionada'),
        administrativeLogs: lifecycle('append-only', 'on-demand', 'histórico paginado e filtrado no servidor por superfície'),
        dataImportRuns: lifecycle('workflow', 'maintenance', 'execuções técnicas mutáveis enquanto a importação progride'),
        auditEvents: lifecycle('append-only', 'maintenance', 'trilha técnica de auditoria de dados')
    });

    const REMOTE_BOOTSTRAP_ENTITIES = Object.freeze(
        RADAR_ENTITIES.filter(entity => ENTITY_LIFECYCLE[entity]?.remoteLoad === 'bootstrap')
    );
    const REMOTE_CONTEXT_ENTITIES = Object.freeze(
        RADAR_ENTITIES.filter(entity => ENTITY_LIFECYCLE[entity]?.remoteLoad === 'context')
    );

    const ENTITY_SET = new Set(RADAR_ENTITIES);
    const REQUIRED_REPOSITORY_METHODS = Object.freeze([
        'load',
        'save',
        'remove',
        'exportSnapshot',
        'restoreSnapshot',
        'healthCheck',
        'capabilities'
    ]);

    class RepositoryError extends Error {
        constructor(code, message, options = {}) {
            super(message, options.cause ? { cause: options.cause } : undefined);
            this.name = 'RepositoryError';
            this.code = code;
            this.entity = options.entity || null;
            this.operation = options.operation || null;
            this.details = options.details || null;
        }
    }

    function assertKnownEntity(entity) {
        if (!ENTITY_SET.has(entity)) {
            throw new RepositoryError(
                'UNKNOWN_ENTITY',
                `Entidade de persistência desconhecida: ${String(entity)}`,
                { entity }
            );
        }
        return entity;
    }

    function jsonCloneValue(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    }

    function cloneValue(value) {
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(value);
            } catch (error) {
                if (String(error?.name || '') !== 'DataCloneError') throw error;
                return jsonCloneValue(value);
            }
        }
        return jsonCloneValue(value);
    }

    function normalizeCollection(value) {
        if (value == null) return [];
        if (!Array.isArray(value)) {
            throw new RepositoryError(
                'INVALID_COLLECTION',
                'O repositório exige coleções representadas por arrays.'
            );
        }
        return cloneValue(value);
    }

    function createSnapshotEnvelope(entities, options = {}) {
        return {
            format: SNAPSHOT_FORMAT,
            version: String(options.version || options.schemaVersion || '1'),
            importId: String(options.importId || `import-${Date.now()}`),
            exportedAt: options.exportedAt || new Date().toISOString(),
            entities: cloneValue(entities || {})
        };
    }

    function assertRepositoryContract(repository) {
        if (!repository || typeof repository !== 'object') {
            throw new RepositoryError(
                'INVALID_REPOSITORY',
                'Um repositório de dados é obrigatório.',
                { operation: 'assertRepositoryContract' }
            );
        }
        const missing = REQUIRED_REPOSITORY_METHODS.filter(
            method => typeof repository[method] !== 'function'
        );
        if (missing.length > 0) {
            throw new RepositoryError(
                'INVALID_REPOSITORY',
                `Repositório incompleto: ${missing.join(', ')}.`,
                {
                    operation: 'assertRepositoryContract',
                    details: { missing }
                }
            );
        }
        return repository;
    }

    function assertLocalPersistenceFallback(repository, operation) {
        if (repository?.capabilities?.().remote === true) {
            throw new RepositoryError(
                'MISSING_REMOTE_CAPABILITY',
                'Esta operação exige persistência atômica indisponível no serviço de dados. Nenhuma gravação alternativa será executada.',
                { operation }
            );
        }
    }

    function isSnapshotEmpty(snapshot) {
        if (!snapshot || !snapshot.entities || typeof snapshot.entities !== 'object') return true;
        return Object.values(snapshot.entities).every(
            records => !Array.isArray(records) || records.length === 0
        );
    }

    return Object.freeze({
        SNAPSHOT_FORMAT,
        RADAR_ENTITIES,
        ENTITY_LIFECYCLE,
        REMOTE_BOOTSTRAP_ENTITIES,
        REMOTE_CONTEXT_ENTITIES,
        REQUIRED_REPOSITORY_METHODS,
        RepositoryError,
        assertKnownEntity,
        cloneValue,
        normalizeCollection,
        createSnapshotEnvelope,
        assertRepositoryContract,
        assertLocalPersistenceFallback,
        isSnapshotEmpty
    });
}));
