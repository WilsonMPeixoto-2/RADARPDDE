(function installRadarStatePort(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const defaultBridge = typeof module !== 'undefined' && module.exports
        ? require('../data/state-bridge-metadata.js')
        : root.RadarStateBridge;
    const api = factory(contract, defaultBridge);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarStatePort = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarStatePortApi(
    contract,
    defaultBridge
) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes da porta de estado.');
    }

    const { RepositoryError, cloneValue } = contract;
    const RADAR_PREFIX = 'radar_pdde_';
    const INCREMENTAL_MEMORY_ENTITY_MAP = Object.freeze({
        appConfig: 'config',
        programs: 'programs',
        controllers: 'controllers',
        inventoryTeamMembers: 'inventoryTeamMembers',
        schools: 'schools',
        schoolPrograms: 'schools',
        competences: 'config',
        verifications: 'verifications',
        pendencies: 'pendencies',
        pendencyAttempts: 'pendencies',
        pendencyContacts: 'contacts',
        assets: 'assets',
        registeredInvoices: 'registeredInvoices',
        administrativeLogs: 'logs'
    });
    const MEMORY_ENTITY_BUNDLES = Object.freeze({
        config: Object.freeze(['appConfig', 'competences']),
        programs: Object.freeze(['programs']),
        controllers: Object.freeze(['controllers']),
        inventoryTeamMembers: Object.freeze(['inventoryTeamMembers']),
        schools: Object.freeze(['schools', 'schoolPrograms']),
        verifications: Object.freeze(['verifications']),
        pendencies: Object.freeze(['pendencies', 'pendencyAttempts']),
        contacts: Object.freeze(['pendencyContacts']),
        assets: Object.freeze(['assets']),
        registeredInvoices: Object.freeze(['registeredInvoices']),
        logs: Object.freeze(['administrativeLogs'])
    });

    function memoryKeysForEntities(entities = []) {
        return [...new Set((Array.isArray(entities) ? entities : [])
            .map(entity => INCREMENTAL_MEMORY_ENTITY_MAP[entity])
            .filter(Boolean))];
    }

    function canonicalBundleForMemoryKeys(memoryKeys = []) {
        return [...new Set(memoryKeys.flatMap(key => MEMORY_ENTITY_BUNDLES[key] || []))];
    }

    function createBrowserMemoryRead() {
        if (typeof document === 'undefined') return null;
        return function readBrowserMemoryKeys(memoryKeys = []) {
            const keys = new Set(memoryKeys);
            const result = {};
            if (keys.has('config') && typeof config !== 'undefined') result.config = cloneValue(config || {});
            if (keys.has('programs') && typeof programas !== 'undefined') result.programs = cloneValue(programas || []);
            if (keys.has('controllers') && typeof controladores !== 'undefined') result.controllers = cloneValue(controladores || []);
            if (keys.has('inventoryTeamMembers') && typeof equipeInventario !== 'undefined') {
                result.inventoryTeamMembers = cloneValue(equipeInventario || []);
            }
            if (keys.has('schools') && typeof escolas !== 'undefined') result.schools = cloneValue(escolas || []);
            if (keys.has('verifications') && typeof verificacoes !== 'undefined') {
                result.verifications = cloneValue(verificacoes || {});
            }
            if (keys.has('pendencies') && typeof pendencias !== 'undefined') result.pendencies = cloneValue(pendencias || []);
            if (keys.has('contacts') && typeof contatos !== 'undefined') result.contacts = cloneValue(contatos || []);
            if (keys.has('assets') && typeof bens !== 'undefined') result.assets = cloneValue(bens || []);
            if (keys.has('registeredInvoices') && typeof notasRegistradas !== 'undefined') {
                result.registeredInvoices = cloneValue(notasRegistradas || []);
            }
            if (keys.has('logs') && typeof logs !== 'undefined') result.logs = cloneValue(logs || []);
            return result;
        };
    }

    function createBrowserMemoryPatch() {
        if (typeof document === 'undefined') return null;
        return function patchBrowserMemory(patch = {}) {
            if (Object.prototype.hasOwnProperty.call(patch, 'config')
                && typeof config !== 'undefined') {
                config = cloneValue(patch.config || {});
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'programs')
                && typeof programas !== 'undefined') {
                programas = cloneValue(patch.programs || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'controllers')
                && typeof controladores !== 'undefined') {
                controladores = cloneValue(patch.controllers || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'inventoryTeamMembers')
                && typeof equipeInventario !== 'undefined') {
                equipeInventario = cloneValue(patch.inventoryTeamMembers || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'schools')
                && typeof escolas !== 'undefined') {
                escolas = cloneValue(patch.schools || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'verifications')
                && typeof verificacoes !== 'undefined') {
                verificacoes = cloneValue(patch.verifications || {});
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'pendencies')
                && typeof pendencias !== 'undefined') {
                pendencias = cloneValue(patch.pendencies || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'contacts')
                && typeof contatos !== 'undefined') {
                contatos = cloneValue(patch.contacts || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'assets')
                && typeof bens !== 'undefined') {
                bens = cloneValue(patch.assets || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'registeredInvoices')
                && typeof notasRegistradas !== 'undefined') {
                notasRegistradas = cloneValue(patch.registeredInvoices || []);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'logs')
                && typeof logs !== 'undefined') {
                logs = cloneValue(patch.logs || [])
                    .sort((left, right) => (right.dataHora || '').localeCompare(left.dataHora || ''));
            }
            if ((Object.prototype.hasOwnProperty.call(patch, 'pendencies')
                || Object.prototype.hasOwnProperty.call(patch, 'assets'))
                && typeof rebuildOperationalIndexes === 'function') {
                rebuildOperationalIndexes();
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'config')
                && typeof COMPETENCIAS !== 'undefined') {
                const restored = (patch.config?.competencias || []).filter(item => (
                    /^\d{4}-(0[1-9]|1[0-2])$/.test(String(item?.key || ''))
                ));
                if (restored.length) COMPETENCIAS.splice(0, COMPETENCIAS.length, ...cloneValue(restored));
                globalThis.RadarGlobalCompetenceSelector?.refreshContext?.({ source: 'remote-config' });
            }
            return true;
        };
    }

    function assertStorage(storage) {
        if (!storage
            || typeof storage.getItem !== 'function'
            || typeof storage.setItem !== 'function'
            || typeof storage.removeItem !== 'function') {
            throw new RepositoryError(
                'INVALID_STORAGE',
                'Armazenamento compatível com Storage é obrigatório para a porta de estado.',
                { operation: 'createStatePort' }
            );
        }
    }

    function knownRadarKeys(bridge) {
        const keys = Object.values(bridge.LEGACY_STORAGE_MAP || {})
            .map(descriptor => descriptor?.key)
            .filter(Boolean);
        keys.push(
            'radar_pdde_data_version',
            'radar_pdde_pendency_schema_version',
            bridge.BRIDGE_METADATA_STORAGE_KEY || 'radar_pdde_bridge_metadata'
        );
        return [...new Set(keys)];
    }

    function listRadarKeys(storage, bridge) {
        const keys = new Set(knownRadarKeys(bridge));
        if (Number.isInteger(storage.length) && typeof storage.key === 'function') {
            for (let index = 0; index < storage.length; index += 1) {
                const key = storage.key(index);
                if (String(key || '').startsWith(RADAR_PREFIX)) keys.add(key);
            }
        } else if (typeof storage.dump === 'function') {
            Object.keys(storage.dump()).forEach(key => {
                if (key.startsWith(RADAR_PREFIX)) keys.add(key);
            });
        }
        return [...keys].sort();
    }

    function captureStorage(storage, bridge) {
        const entries = {};
        listRadarKeys(storage, bridge).forEach(key => {
            const value = storage.getItem(key);
            if (value !== null) entries[key] = value;
        });
        return entries;
    }

    function createMemoryStorage(seed = {}) {
        const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
        return {
            get length() {
                return values.size;
            },
            key(index) {
                return [...values.keys()][index] ?? null;
            },
            getItem(key) {
                return values.has(key) ? values.get(key) : null;
            },
            setItem(key, value) {
                values.set(key, String(value));
            },
            removeItem(key) {
                values.delete(key);
            }
        };
    }

    function createStatePort(options = {}) {
        const storage = options.storage
            || (typeof localStorage !== 'undefined' ? localStorage : null);
        const bridge = options.bridge || defaultBridge;
        assertStorage(storage);
        if (!bridge
            || typeof bridge.exportLegacySnapshot !== 'function'
            || typeof bridge.restoreCanonicalSnapshotToLegacyStorage !== 'function') {
            throw new RepositoryError(
                'INVALID_STATE_BRIDGE',
                'RadarStateBridge completo é obrigatório para a porta de estado.',
                { operation: 'createStatePort' }
            );
        }

        const readMemory = typeof options.readMemory === 'function'
            ? options.readMemory
            : () => bridge.readLegacyState(storage);
        const writeMemory = typeof options.writeMemory === 'function'
            ? options.writeMemory
            : () => undefined;
        const browserMemoryRead = createBrowserMemoryRead();
        const readMemoryKeys = typeof options.readMemoryEntities === 'function'
            ? options.readMemoryEntities
            : (browserMemoryRead || (async memoryKeys => {
                const memory = cloneValue(await readMemory()) || {};
                return Object.fromEntries(memoryKeys
                    .filter(key => Object.prototype.hasOwnProperty.call(memory, key))
                    .map(key => [key, cloneValue(memory[key])])
                );
            }));
        const patchMemory = typeof options.patchMemory === 'function'
            ? options.patchMemory
            : createBrowserMemoryPatch();
        const configuredDataVersion = String(options.dataVersion || '').trim();
        const configuredPendencyVersion = String(options.pendencySchemaVersion || '').trim();

        function assertSynchronous(value, operation) {
            if (value && typeof value.then === 'function') {
                throw new RepositoryError(
                    'ASYNC_STATE_PORT_UNSUPPORTED',
                    `A operação ${operation} exige uma porta de memória síncrona.`,
                    { operation }
                );
            }
            return value;
        }

        function captureSync() {
            return {
                memory: cloneValue(assertSynchronous(readMemory(), 'captureSync')),
                storage: captureStorage(storage, bridge)
            };
        }

        async function capture() {
            return {
                memory: cloneValue(await readMemory()),
                storage: captureStorage(storage, bridge)
            };
        }

        async function captureEntities(entities = []) {
            const memoryKeys = memoryKeysForEntities(entities);
            if (memoryKeys.length === 0 || !patchMemory) {
                throw new RepositoryError(
                    'SCOPED_STATE_UNAVAILABLE',
                    'A porta de estado não consegue capturar projeções operacionais de forma isolada.',
                    { operation: 'captureEntities' }
                );
            }
            return cloneValue(await readMemoryKeys(memoryKeys));
        }

        function exportFromMemory(memoryValue, exportOptions = {}) {
            const stage = createMemoryStorage(captureStorage(storage, bridge));
            const memory = cloneValue(memoryValue) || {};

            Object.entries(bridge.LEGACY_STORAGE_MAP || {}).forEach(([stateKey, descriptor]) => {
                if (Object.prototype.hasOwnProperty.call(memory, stateKey)) {
                    stage.setItem(descriptor.key, JSON.stringify(memory[stateKey]));
                }
            });

            const dataVersion = String(
                memory.dataVersion
                || exportOptions.dataVersion
                || configuredDataVersion
                || storage.getItem('radar_pdde_data_version')
                || ''
            );
            const pendencySchemaVersion = String(
                memory.pendencySchemaVersion
                || exportOptions.pendencySchemaVersion
                || configuredPendencyVersion
                || storage.getItem('radar_pdde_pendency_schema_version')
                || ''
            );
            if (dataVersion) stage.setItem('radar_pdde_data_version', dataVersion);
            if (pendencySchemaVersion) {
                stage.setItem('radar_pdde_pendency_schema_version', pendencySchemaVersion);
            }

            return bridge.exportLegacySnapshot(stage, exportOptions).snapshot;
        }

        function exportScopedFromMemory(memoryValue, canonicalEntities, exportOptions = {}) {
            const stage = createMemoryStorage();
            const memory = cloneValue(memoryValue) || {};
            Object.entries(bridge.LEGACY_STORAGE_MAP || {}).forEach(([stateKey, descriptor]) => {
                if (Object.prototype.hasOwnProperty.call(memory, stateKey)) {
                    stage.setItem(descriptor.key, JSON.stringify(memory[stateKey]));
                }
            });
            const dataVersion = String(
                exportOptions.dataVersion
                || configuredDataVersion
                || ''
            );
            const pendencySchemaVersion = String(
                exportOptions.pendencySchemaVersion
                || configuredPendencyVersion
                || ''
            );
            if (dataVersion) stage.setItem('radar_pdde_data_version', dataVersion);
            if (pendencySchemaVersion) stage.setItem('radar_pdde_pendency_schema_version', pendencySchemaVersion);
            const full = bridge.exportLegacySnapshot(stage, exportOptions).snapshot;
            full.entities = Object.fromEntries(canonicalEntities.map(entity => [
                entity,
                cloneValue(full.entities?.[entity] || [])
            ]));
            return full;
        }

        function exportCanonicalSync(exportOptions = {}) {
            return exportFromMemory(
                assertSynchronous(readMemory(), 'exportCanonicalSync'),
                exportOptions
            );
        }

        async function exportCanonical(exportOptions = {}) {
            return exportFromMemory(await readMemory(), exportOptions);
        }

        async function exportCanonicalEntities(entities = [], exportOptions = {}) {
            const memoryKeys = memoryKeysForEntities(entities);
            if (memoryKeys.length === 0) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'A exportação incremental exige entidades operacionais conhecidas.',
                    { operation: 'exportCanonicalEntities' }
                );
            }
            const canonicalEntities = canonicalBundleForMemoryKeys(memoryKeys);
            const memory = await readMemoryKeys(memoryKeys);
            return exportScopedFromMemory(memory, canonicalEntities, exportOptions);
        }

        function commitCurrent(snapshot, commitOptions = {}) {
            const memory = cloneValue(assertSynchronous(readMemory(), 'commitCurrent')) || {};
            Object.entries(bridge.LEGACY_STORAGE_MAP || {}).forEach(([stateKey, descriptor]) => {
                if (Object.prototype.hasOwnProperty.call(memory, stateKey)) {
                    storage.setItem(descriptor.key, JSON.stringify(memory[stateKey]));
                }
            });

            const dataVersion = String(
                memory.dataVersion
                || commitOptions.dataVersion
                || configuredDataVersion
                || ''
            );
            const pendencySchemaVersion = String(
                memory.pendencySchemaVersion
                || commitOptions.pendencySchemaVersion
                || configuredPendencyVersion
                || ''
            );
            if (dataVersion) storage.setItem('radar_pdde_data_version', dataVersion);
            if (pendencySchemaVersion) {
                storage.setItem('radar_pdde_pendency_schema_version', pendencySchemaVersion);
            }
            if (snapshot?.entities
                && typeof bridge.buildMetadata === 'function'
                && bridge.BRIDGE_METADATA_STORAGE_KEY) {
                const metadata = bridge.buildMetadata(snapshot.entities, memory, { dataVersion });
                storage.setItem(bridge.BRIDGE_METADATA_STORAGE_KEY, JSON.stringify(metadata));
            }
            return cloneValue(memory);
        }

        async function applyCanonical(snapshot, applyOptions = {}) {
            const persistStorage = applyOptions.persistStorage !== false;
            const result = bridge.restoreCanonicalSnapshotToLegacyStorage(snapshot, storage, {
                dataVersion: applyOptions.dataVersion || configuredDataVersion,
                pendencySchemaVersion: applyOptions.pendencySchemaVersion
                    || configuredPendencyVersion,
                dryRun: !persistStorage
            });
            await writeMemory(cloneValue(result.state));
            return cloneValue(result.state);
        }

        async function applyEntities(snapshot, entities = [], applyOptions = {}) {
            const requested = [...new Set(Array.isArray(entities) ? entities : [])];
            const canPatch = applyOptions.persistStorage === false
                && patchMemory
                && typeof bridge.canonicalEntitiesToLegacyState === 'function'
                && requested.length > 0
                && requested.every(entity => INCREMENTAL_MEMORY_ENTITY_MAP[entity]);
            if (!canPatch) return applyCanonical(snapshot, applyOptions);

            const memoryKeys = memoryKeysForEntities(requested);
            const canonicalBundle = canonicalBundleForMemoryKeys(memoryKeys);
            const sourceEntities = snapshot?.entities || {};
            const bundleEntities = {};
            canonicalBundle.forEach(entity => {
                bundleEntities[entity] = cloneValue(sourceEntities[entity] || []);
            });
            const projectedState = bridge.canonicalEntitiesToLegacyState(bundleEntities, {
                dataVersion: applyOptions.dataVersion || configuredDataVersion,
                pendencySchemaVersion: applyOptions.pendencySchemaVersion
                    || configuredPendencyVersion
            });
            const memoryPatch = {};
            memoryKeys.forEach(memoryKey => {
                memoryPatch[memoryKey] = cloneValue(projectedState[memoryKey]);
            });
            await patchMemory(cloneValue(memoryPatch));
            return cloneValue(memoryPatch);
        }

        function validateCapture(captured) {
            if (!captured || typeof captured !== 'object' || !captured.storage) {
                throw new RepositoryError(
                    'INVALID_STATE_CAPTURE',
                    'Captura de estado inválida para rollback.',
                    { operation: 'restore' }
                );
            }
        }

        function restoreStorage(captured) {
            validateCapture(captured);
            listRadarKeys(storage, bridge).forEach(key => storage.removeItem(key));
            Object.entries(captured.storage).forEach(([key, value]) => storage.setItem(key, value));
        }

        function restoreSync(captured) {
            restoreStorage(captured);
            assertSynchronous(writeMemory(cloneValue(captured.memory)), 'restoreSync');
            return cloneValue(captured.memory);
        }

        async function restore(captured) {
            restoreStorage(captured);
            await writeMemory(cloneValue(captured.memory));
            return cloneValue(captured.memory);
        }

        async function restoreEntities(captured = {}) {
            if (!patchMemory || !captured || typeof captured !== 'object' || Array.isArray(captured)) {
                throw new RepositoryError(
                    'INVALID_STATE_CAPTURE',
                    'Captura incremental inválida para rollback.',
                    { operation: 'restoreEntities' }
                );
            }
            await patchMemory(cloneValue(captured));
            return cloneValue(captured);
        }

        return Object.freeze({
            capture,
            captureSync,
            captureEntities,
            exportCanonical,
            exportCanonicalSync,
            exportCanonicalEntities,
            applyCanonical,
            applyEntities,
            commitCurrent,
            restore,
            restoreSync,
            restoreEntities
        });
    }

    return Object.freeze({
        INCREMENTAL_MEMORY_ENTITY_MAP,
        MEMORY_ENTITY_BUNDLES,
        createStatePort
    });
}));
