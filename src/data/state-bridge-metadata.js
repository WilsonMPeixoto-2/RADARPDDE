(function installRadarStateBridgeMetadata(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const snapshotTools = typeof module !== 'undefined' && module.exports
        ? require('./snapshot-tools.js')
        : root.RadarSnapshotTools;
    const baseBridge = typeof module !== 'undefined' && module.exports
        ? require('./state-bridge.js')
        : root.RadarStateBridge;
    const api = factory(contract, snapshotTools, baseBridge);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarStateBridge = Object.freeze(api);
        root.RadarLegacyStateAdapter = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createMetadataAwareBridge(
    contract,
    snapshotTools,
    baseBridge
) {
    'use strict';

    if (!contract || !snapshotTools || !baseBridge) {
        throw new Error('Contrato, snapshots e ponte base são obrigatórios.');
    }

    const { RepositoryError, cloneValue } = contract;
    const BRIDGE_METADATA_STORAGE_KEY = 'radar_pdde_bridge_metadata';
    const METADATA_VERSION = '1';
    const TRACKED_ENTITIES = Object.freeze([
        'pendencies',
        'pendencyAttempts',
        'pendencyContacts',
        'assets',
        'registeredInvoices'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function stableStringify(value) {
        if (snapshotTools && typeof snapshotTools.stableStringify === 'function') {
            return snapshotTools.stableStringify(value);
        }
        return JSON.stringify(value);
    }

    function assertStorage(storage) {
        if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
            throw new RepositoryError(
                'INVALID_STORAGE',
                'Armazenamento compatível com Storage é obrigatório.',
                { operation: 'metadataBridge' }
            );
        }
    }

    function readMetadata(storage) {
        assertStorage(storage);
        const raw = storage.getItem(BRIDGE_METADATA_STORAGE_KEY);
        if (!raw) return null;
        try {
            const metadata = JSON.parse(raw);
            if (!metadata || metadata.version !== METADATA_VERSION || !metadata.records) {
                return null;
            }
            return metadata;
        } catch (error) {
            throw new RepositoryError(
                'BRIDGE_METADATA_INVALID',
                'Os metadados técnicos de reconciliação estão corrompidos.',
                {
                    operation: 'readMetadata',
                    cause: error,
                    details: { storageKey: BRIDGE_METADATA_STORAGE_KEY }
                }
            );
        }
    }

    function indexLegacyState(state = {}) {
        const result = {
            pendencies: new Map(),
            pendencyAttempts: new Map(),
            pendencyContacts: new Map(),
            assets: new Map(),
            registeredInvoices: new Map()
        };

        (Array.isArray(state.pendencies) ? state.pendencies : []).forEach(pendency => {
            if (pendency && pendency.id != null) {
                result.pendencies.set(String(pendency.id), pendency);
            }
            (Array.isArray(pendency?.tentativas) ? pendency.tentativas : []).forEach(attempt => {
                if (attempt && attempt.id != null) {
                    result.pendencyAttempts.set(String(attempt.id), attempt);
                }
            });
        });
        (Array.isArray(state.contacts) ? state.contacts : []).forEach(contact => {
            if (contact && contact.id != null) {
                result.pendencyContacts.set(String(contact.id), contact);
            }
        });
        (Array.isArray(state.assets) ? state.assets : []).forEach(asset => {
            if (asset && asset.id != null) result.assets.set(String(asset.id), asset);
        });
        (Array.isArray(state.registeredInvoices) ? state.registeredInvoices : []).forEach(invoice => {
            if (invoice && invoice.id != null) {
                result.registeredInvoices.set(String(invoice.id), invoice);
            }
        });

        return result;
    }

    function buildMetadata(entities = {}, legacyState = {}, options = {}) {
        const legacyIndex = indexLegacyState(legacyState);
        const records = {};

        TRACKED_ENTITIES.forEach(entity => {
            records[entity] = {};
            const sourceRecords = Array.isArray(entities[entity]) ? entities[entity] : [];
            sourceRecords.forEach(record => {
                const id = text(record?.id);
                const legacyRecord = legacyIndex[entity].get(id);
                if (!id || !legacyRecord) return;
                records[entity][id] = {
                    legacyFingerprint: stableStringify(legacyRecord),
                    canonicalRecord: cloneValue(record)
                };
            });
        });

        return {
            version: METADATA_VERSION,
            dataVersion: text(options.dataVersion || legacyState.dataVersion),
            createdAt: options.createdAt || new Date().toISOString(),
            records
        };
    }

    function applyLiveLegacyFields(transformed, state) {
        const legacyIndex = indexLegacyState(state);

        transformed.entities.pendencyContacts = transformed.entities.pendencyContacts.map(record => {
            const legacy = legacyIndex.pendencyContacts.get(text(record.id));
            if (!legacy) return record;
            return {
                ...record,
                description: text(legacy.desc || legacy.descricao || legacy.description || record.description),
                official_charge: legacy.cobrancaOficial === true
                    || legacy.cobrancaEnvioRegistro === true
                    || legacy.official_charge === true
            };
        });

        transformed.entities.assets = transformed.entities.assets.map(record => {
            const legacy = legacyIndex.assets.get(text(record.id));
            if (!legacy) return record;
            return {
                ...record,
                description: text(legacy.item || legacy.descricao || legacy.description || record.description),
                inventoried_by_member_id: text(
                    legacy.inventariadorId
                    || legacy.responsavelInventario
                    || legacy.inventoried_by_member_id
                    || record.inventoried_by_member_id
                ) || null,
                inventoried_at: legacy.dataInventariacao
                    || legacy.inventoried_at
                    || record.inventoried_at
                    || null
            };
        });

        transformed.entities.registeredInvoices = transformed.entities.registeredInvoices.map(record => {
            const legacy = legacyIndex.registeredInvoices.get(text(record.id));
            if (!legacy) return record;
            const context = baseBridge.contextFromValue(
                legacy.compKey
                || legacy.contextKey
                || legacy.source_context_key
                || record.source_context_key
            );
            const competenceId = text(legacy.competencia || context?.competenceId || record.competence_id) || null;
            const programId = text(legacy.programaId || context?.programId || record.program_id) || null;
            return {
                ...record,
                competence_id: competenceId,
                program_id: programId,
                verification_id: competenceId && programId
                    ? `${record.school_id}::${competenceId}::${programId}`
                    : (record.verification_id || null),
                source_context_key: text(legacy.compKey || record.source_context_key),
                description: text(legacy.desc || legacy.descricao || legacy.description || record.description),
                linked_asset_id: text(legacy.bemId || legacy.linked_asset_id || record.linked_asset_id) || null,
                registered_at: legacy.dataRegistro || legacy.registered_at || record.registered_at || null
            };
        });

        transformed.entities.pendencies = transformed.entities.pendencies.map(record => {
            const legacy = legacyIndex.pendencies.get(text(record.id));
            if (!legacy) return record;
            return {
                ...record,
                next_actor: text(
                    legacy.proximoAtor
                    || legacy.nextActor
                    || legacy.next_actor
                    || record.next_actor
                    || record.responsible_area
                )
            };
        });

        return transformed;
    }

    function applyMetadata(transformed, state, metadata) {
        if (!metadata || metadata.dataVersion !== text(state.dataVersion)) return transformed;
        const legacyIndex = indexLegacyState(state);

        TRACKED_ENTITIES.forEach(entity => {
            const metadataRecords = metadata.records?.[entity] || {};
            const canonicalById = new Map(
                (Array.isArray(transformed.entities[entity]) ? transformed.entities[entity] : [])
                    .map(record => [text(record.id), record])
            );

            Object.entries(metadataRecords).forEach(([id, entry]) => {
                const legacyRecord = legacyIndex[entity].get(String(id));
                if (!legacyRecord || !entry?.canonicalRecord) return;
                if (stableStringify(legacyRecord) !== entry.legacyFingerprint) return;
                canonicalById.set(String(id), cloneValue(entry.canonicalRecord));
            });

            transformed.entities[entity] = [...canonicalById.values()]
                .sort((left, right) => text(left.id).localeCompare(text(right.id), 'pt-BR'));
        });

        return transformed;
    }

    function transformLegacyState(state = {}) {
        const transformed = applyLiveLegacyFields(
            baseBridge.enhanceLegacyTransformation(state),
            state
        );
        return applyMetadata(transformed, state, state.bridgeMetadata || null);
    }

    function exportLegacySnapshot(storage, options = {}) {
        assertStorage(storage);
        const state = baseBridge.readLegacyState(storage);
        state.bridgeMetadata = readMetadata(storage);
        const transformed = transformLegacyState(state);
        const snapshot = snapshotTools.createSnapshot(transformed.entities, options);
        const validation = snapshotTools.validateSnapshot(snapshot);
        if (!validation.ok) {
            throw new RepositoryError(
                'LEGACY_SNAPSHOT_INVALID',
                `Snapshot legado inválido: ${validation.errors.join(' ')}`,
                {
                    operation: 'exportLegacySnapshot',
                    details: { errors: validation.errors }
                }
            );
        }
        return {
            snapshot,
            warnings: transformed.warnings,
            rejected: transformed.rejected,
            sourceDataVersion: state.dataVersion
        };
    }

    function buildLegacyStorageWrites(state, entities = {}, options = {}) {
        const writes = baseBridge.buildLegacyStorageWrites(state);
        const metadata = buildMetadata(entities, state, options);
        writes.push({
            key: BRIDGE_METADATA_STORAGE_KEY,
            value: JSON.stringify(metadata)
        });
        return writes;
    }

    function restoreCanonicalSnapshotToLegacyStorage(snapshot, storage, options = {}) {
        assertStorage(storage);
        const validation = snapshotTools.validateSnapshot(snapshot);
        if (!validation.ok) {
            throw new RepositoryError(
                'INVALID_SNAPSHOT',
                `Snapshot inválido: ${validation.errors.join(' ')}`,
                {
                    operation: 'restoreCanonicalSnapshotToLegacyStorage',
                    details: { errors: validation.errors }
                }
            );
        }

        const baseResult = baseBridge.restoreCanonicalSnapshotToLegacyStorage(
            snapshot,
            storage,
            { ...options, dryRun: true }
        );
        const dataVersion = text(
            options.dataVersion
            || options.sourceDataVersion
            || baseResult.state.dataVersion
            || 'supabase-bridge-v1'
        );
        baseResult.state.dataVersion = dataVersion;
        const writes = buildLegacyStorageWrites(baseResult.state, snapshot.entities, {
            dataVersion,
            createdAt: options.createdAt
        });

        if (options.dryRun !== true) {
            writes.forEach(write => storage.setItem(write.key, write.value));
            if (dataVersion) storage.setItem('radar_pdde_data_version', dataVersion);
            if (baseResult.state.pendencySchemaVersion) {
                storage.setItem(
                    'radar_pdde_pendency_schema_version',
                    baseResult.state.pendencySchemaVersion
                );
            }
        }

        return {
            dryRun: options.dryRun === true,
            state: baseResult.state,
            writes,
            dataVersion,
            metadataKey: BRIDGE_METADATA_STORAGE_KEY
        };
    }

    return Object.freeze({
        ...baseBridge,
        BRIDGE_METADATA_STORAGE_KEY,
        METADATA_VERSION,
        TRACKED_ENTITIES,
        readMetadata,
        buildMetadata,
        applyLiveLegacyFields,
        applyMetadata,
        transformLegacyState,
        exportLegacySnapshot,
        buildLegacyStorageWrites,
        restoreCanonicalSnapshotToLegacyStorage
    });
}));
