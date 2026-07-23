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

        function exportCanonicalSync(exportOptions = {}) {
            return exportFromMemory(
                assertSynchronous(readMemory(), 'exportCanonicalSync'),
                exportOptions
            );
        }

        async function exportCanonical(exportOptions = {}) {
            return exportFromMemory(await readMemory(), exportOptions);
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

        return Object.freeze({
            capture,
            captureSync,
            exportCanonical,
            exportCanonicalSync,
            applyCanonical,
            commitCurrent,
            restore,
            restoreSync
        });
    }

    return Object.freeze({ createStatePort });
}));
