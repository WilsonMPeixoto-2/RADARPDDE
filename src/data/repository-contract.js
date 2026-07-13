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

    const ENTITY_SET = new Set(RADAR_ENTITIES);

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

    function cloneValue(value) {
        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
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

    return Object.freeze({
        SNAPSHOT_FORMAT,
        RADAR_ENTITIES,
        RepositoryError,
        assertKnownEntity,
        cloneValue,
        normalizeCollection,
        createSnapshotEnvelope
    });
}));
