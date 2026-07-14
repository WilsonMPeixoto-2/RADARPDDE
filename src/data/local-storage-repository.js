(function installLocalStorageRepository(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarLocalStorageRepository = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createLocalStorageRepositoryApi(contract) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes do repositório local.');
    }

    const {
        SNAPSHOT_FORMAT,
        RADAR_ENTITIES,
        RepositoryError,
        assertKnownEntity,
        cloneValue,
        normalizeCollection,
        createSnapshotEnvelope
    } = contract;

    class LocalStorageRepository {
        constructor(options = {}) {
            this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
            this.keyPrefix = options.keyPrefix || 'radar_pdde_repository';
            this.schemaVersion = String(options.schemaVersion || '1');

            if (!this.storage
                || typeof this.storage.getItem !== 'function'
                || typeof this.storage.setItem !== 'function'
                || typeof this.storage.removeItem !== 'function') {
                throw new RepositoryError(
                    'INVALID_STORAGE',
                    'Um armazenamento compatível com Storage é obrigatório.',
                    { operation: 'construct' }
                );
            }
        }

        keyFor(entity) {
            assertKnownEntity(entity);
            return `${this.keyPrefix}:${entity}`;
        }

        async load(entity) {
            const key = this.keyFor(entity);
            const raw = this.storage.getItem(key);
            if (raw == null || raw === '') return [];

            try {
                return normalizeCollection(JSON.parse(raw));
            } catch (error) {
                if (error instanceof RepositoryError) throw error;
                throw new RepositoryError(
                    'DESERIALIZATION_FAILED',
                    `Não foi possível interpretar os dados locais de ${entity}.`,
                    { entity, operation: 'load', cause: error }
                );
            }
        }

        async save(entity, records) {
            const key = this.keyFor(entity);
            const collection = normalizeCollection(records);
            try {
                this.storage.setItem(key, JSON.stringify(collection));
                return cloneValue(collection);
            } catch (error) {
                throw new RepositoryError(
                    'WRITE_FAILED',
                    `Não foi possível gravar os dados locais de ${entity}.`,
                    { entity, operation: 'save', cause: error }
                );
            }
        }

        async remove(entity, id) {
            const key = this.keyFor(entity);
            if (id === undefined || id === null) {
                this.storage.removeItem(key);
                return { removed: 'all' };
            }

            const current = await this.load(entity);
            const filtered = current.filter(record => record && record.id !== id);
            await this.save(entity, filtered);
            return { removed: current.length - filtered.length };
        }

        async exportSnapshot(options = {}) {
            const entities = {};
            for (const entity of RADAR_ENTITIES) {
                const records = await this.load(entity);
                if (records.length > 0 || options.includeEmpty === true) {
                    entities[entity] = records;
                }
            }

            return createSnapshotEnvelope(entities, {
                version: options.version || this.schemaVersion,
                importId: options.importId,
                exportedAt: options.exportedAt
            });
        }

        async restoreSnapshot(snapshot) {
            if (!snapshot
                || typeof snapshot !== 'object'
                || snapshot.format !== SNAPSHOT_FORMAT
                || !snapshot.entities
                || typeof snapshot.entities !== 'object') {
                throw new RepositoryError(
                    'INVALID_SNAPSHOT',
                    'Snapshot local inválido.',
                    { operation: 'restoreSnapshot' }
                );
            }

            const entries = Object.entries(snapshot.entities);
            for (const [entity, records] of entries) {
                assertKnownEntity(entity);
                await this.save(entity, records);
            }

            return {
                restoredEntities: entries.length,
                version: String(snapshot.version || this.schemaVersion),
                importId: String(snapshot.importId || '')
            };
        }


        async diagnoseCapacity(options = {}) {
            const probeBytes = Number.isInteger(options.probeBytes) && options.probeBytes > 0
                ? Math.min(options.probeBytes, 1024 * 1024)
                : 4096;
            let approximateBytes = 0;
            for (const entity of RADAR_ENTITIES) {
                const raw = this.storage.getItem(this.keyFor(entity)) || '';
                approximateBytes += raw.length * 2;
            }
            const probeKey = `${this.keyPrefix}:__capacity_probe__`;
            try {
                this.storage.setItem(probeKey, '0'.repeat(probeBytes));
                const writable = this.storage.getItem(probeKey)?.length === probeBytes;
                this.storage.removeItem(probeKey);
                return {
                    ok: writable,
                    mode: 'local',
                    writable,
                    trackedEntities: RADAR_ENTITIES.length,
                    approximateBytes,
                    probeBytes,
                    errorCode: null
                };
            } catch (error) {
                try { this.storage.removeItem(probeKey); } catch (_) { /* noop */ }
                const quota = error?.name === 'QuotaExceededError'
                    || error?.code === 22
                    || /quota/i.test(String(error?.message || ''));
                return {
                    ok: false,
                    mode: 'local',
                    writable: false,
                    trackedEntities: RADAR_ENTITIES.length,
                    approximateBytes,
                    probeBytes,
                    errorCode: quota ? 'LOCAL_STORAGE_QUOTA_EXCEEDED' : 'LOCAL_STORAGE_UNAVAILABLE'
                };
            }
        }

        async healthCheck() {
            const probeKey = `${this.keyPrefix}:__healthcheck__`;
            try {
                this.storage.setItem(probeKey, 'ok');
                const writable = this.storage.getItem(probeKey) === 'ok';
                this.storage.removeItem(probeKey);
                return { ok: writable, mode: 'local', writable };
            } catch (error) {
                return { ok: false, mode: 'local', writable: false };
            }
        }

        capabilities() {
            return Object.freeze({
                mode: 'local',
                remote: false,
                writable: true,
                canImportLegacy: true,
                atomicTransactions: true,
                optimisticConcurrency: false,
                capacityDiagnostics: true
            });
        }
    }

    return Object.freeze({ LocalStorageRepository });
}));
