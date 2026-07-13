(function installRadarSnapshotTools(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarSnapshotTools = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSnapshotToolsApi(contract) {
    'use strict';

    const cloneValue = contract && contract.cloneValue
        ? contract.cloneValue
        : value => JSON.parse(JSON.stringify(value));

    const SNAPSHOT_FORMAT = 'radar-pdde-snapshot';

    function sortObjectKeys(value) {
        if (Array.isArray(value)) return value.map(sortObjectKeys);
        if (!value || typeof value !== 'object') return value;
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
                accumulator[key] = sortObjectKeys(value[key]);
                return accumulator;
            }, {});
    }

    function stableStringify(value) {
        return JSON.stringify(sortObjectKeys(value));
    }

    function canonicalizeRecords(records) {
        return cloneValue(records || [])
            .map(sortObjectKeys)
            .sort((left, right) => String(left.id).localeCompare(String(right.id), 'pt-BR'));
    }

    function createSnapshot(entities = {}, options = {}) {
        const canonicalEntities = Object.keys(entities)
            .sort()
            .reduce((accumulator, entity) => {
                accumulator[entity] = canonicalizeRecords(entities[entity]);
                return accumulator;
            }, {});

        return {
            format: SNAPSHOT_FORMAT,
            version: String(options.version || '1'),
            importId: String(options.importId || `import-${Date.now()}`),
            exportedAt: options.exportedAt || new Date().toISOString(),
            entities: canonicalEntities
        };
    }

    function validateSnapshot(snapshot) {
        const errors = [];
        if (!snapshot || typeof snapshot !== 'object') {
            return { ok: false, errors: ['Snapshot ausente ou inválido.'] };
        }
        if (snapshot.format !== SNAPSHOT_FORMAT) {
            errors.push(`Formato inválido: esperado ${SNAPSHOT_FORMAT}.`);
        }
        if (!String(snapshot.version || '').trim()) {
            errors.push('Versão do snapshot não informada.');
        }
        if (!String(snapshot.importId || '').trim()) {
            errors.push('importId do snapshot não informado.');
        }
        if (!String(snapshot.exportedAt || '').trim()
            || Number.isNaN(Date.parse(snapshot.exportedAt))) {
            errors.push('Data de exportação inválida.');
        }
        if (!snapshot.entities || typeof snapshot.entities !== 'object' || Array.isArray(snapshot.entities)) {
            errors.push('Coleção de entidades inválida.');
            return { ok: false, errors };
        }

        Object.entries(snapshot.entities).forEach(([entity, records]) => {
            if (!Array.isArray(records)) {
                errors.push(`A entidade ${entity} não é uma coleção.`);
                return;
            }
            const ids = new Set();
            records.forEach((record, index) => {
                if (!record || typeof record !== 'object' || Array.isArray(record)) {
                    errors.push(`Registro ${index} de ${entity} é inválido.`);
                    return;
                }
                const id = String(record.id || '').trim();
                if (!id) {
                    errors.push(`Registro ${index} de ${entity} não possui id.`);
                    return;
                }
                if (ids.has(id)) {
                    errors.push(`ID duplicado em ${entity}: ${id}.`);
                }
                ids.add(id);
            });
        });

        return { ok: errors.length === 0, errors };
    }

    function assertValidSnapshot(snapshot) {
        const validation = validateSnapshot(snapshot);
        if (!validation.ok) {
            throw new Error(`Snapshot inválido: ${validation.errors.join(' ')}`);
        }
    }

    function buildImportBatches(snapshot, batchSize = 250) {
        assertValidSnapshot(snapshot);
        if (!Number.isInteger(batchSize) || batchSize <= 0) {
            throw new Error('O tamanho do lote deve ser um inteiro positivo.');
        }

        const batches = [];
        Object.keys(snapshot.entities).sort().forEach(entity => {
            const records = canonicalizeRecords(snapshot.entities[entity]);
            for (let offset = 0; offset < records.length; offset += batchSize) {
                batches.push({
                    entity,
                    batchIndex: Math.floor(offset / batchSize),
                    records: records.slice(offset, offset + batchSize)
                });
            }
        });
        return batches;
    }

    function indexById(records) {
        return new Map((records || []).map(record => [String(record.id), record]));
    }

    function reconcileSnapshots(source, target) {
        assertValidSnapshot(source);
        assertValidSnapshot(target);

        const entityNames = [...new Set([
            ...Object.keys(source.entities),
            ...Object.keys(target.entities)
        ])].sort();
        const entities = {};
        let ok = true;

        entityNames.forEach(entity => {
            const sourceRecords = canonicalizeRecords(source.entities[entity] || []);
            const targetRecords = canonicalizeRecords(target.entities[entity] || []);
            const sourceIndex = indexById(sourceRecords);
            const targetIndex = indexById(targetRecords);
            const missingInTarget = [...sourceIndex.keys()]
                .filter(id => !targetIndex.has(id))
                .sort();
            const unexpectedInTarget = [...targetIndex.keys()]
                .filter(id => !sourceIndex.has(id))
                .sort();
            const changed = [...sourceIndex.keys()]
                .filter(id => targetIndex.has(id)
                    && stableStringify(sourceIndex.get(id)) !== stableStringify(targetIndex.get(id)))
                .sort();
            const entityOk = missingInTarget.length === 0
                && unexpectedInTarget.length === 0
                && changed.length === 0;
            ok = ok && entityOk;

            entities[entity] = {
                ok: entityOk,
                sourceCount: sourceRecords.length,
                targetCount: targetRecords.length,
                missingInTarget,
                unexpectedInTarget,
                changed
            };
        });

        return {
            ok,
            sourceImportId: source.importId,
            targetImportId: target.importId,
            entities
        };
    }

    return Object.freeze({
        SNAPSHOT_FORMAT,
        createSnapshot,
        validateSnapshot,
        buildImportBatches,
        reconcileSnapshots,
        stableStringify
    });
}));
