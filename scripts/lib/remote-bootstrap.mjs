import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');
const {
    IMPORT_ENTITY_ORDER: IMPORT_ORDER,
    validateSnapshot,
    reconcileSnapshots,
    summarizeReconciliation,
    stableStringify
} = require('../../src/data/snapshot-tools.js');

const SANITIZED_ENTITIES = Object.freeze([
    'userProfiles',
    'userSchoolScopes',
    'auditEvents',
    'dataImportRuns'
]);

function bootstrapError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function clone(value) {
    return structuredClone(value);
}

function entityCounts(snapshot) {
    return Object.fromEntries(RADAR_ENTITIES.map(entity => [
        entity,
        Array.isArray(snapshot?.entities?.[entity]) ? snapshot.entities[entity].length : 0
    ]));
}

function assertValidSnapshot(snapshot) {
    const validation = validateSnapshot(snapshot);
    if (!validation.ok) throw bootstrapError('VALIDATION_FAILED', 'Snapshot de bootstrap inválido.');
}

function sanitizeBootstrapSnapshot(snapshot) {
    const sanitized = clone(snapshot);
    sanitized.entities = { ...(sanitized.entities || {}) };
    SANITIZED_ENTITIES.forEach(entity => {
        sanitized.entities[entity] = [];
    });
    return sanitized;
}

function assertDestinationCompatible(destination, source) {
    for (const entity of RADAR_ENTITIES) {
        const sourceById = new Map((source.entities[entity] || []).map(record => [String(record.id), record]));
        for (const record of destination.entities[entity] || []) {
            const expected = sourceById.get(String(record.id));
            if (!expected || stableStringify(expected) !== stableStringify(record)) {
                throw bootstrapError('DESTINATION_CONFLICT', 'O destino remoto contém dados incompatíveis com o snapshot canônico.');
            }
        }
    }
}

async function inspectDestination(repository, snapshot) {
    const destination = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(destination);
    if (snapshot) {
        assertValidSnapshot(snapshot);
        assertDestinationCompatible(destination, sanitizeBootstrapSnapshot(snapshot));
    }
    return Object.freeze({
        compatible: true,
        entityCounts: entityCounts(destination)
    });
}

function createBatches(records, batchSize) {
    const batches = [];
    for (let offset = 0; offset < records.length; offset += batchSize) {
        batches.push(records.slice(offset, offset + batchSize));
    }
    return batches;
}

function plannedRows(source, destination) {
    const destinationIds = Object.fromEntries(RADAR_ENTITIES.map(entity => [
        entity,
        new Set((destination.entities[entity] || []).map(record => String(record.id)))
    ]));
    return Object.fromEntries(IMPORT_ORDER.map(entity => [
        entity,
        (source.entities[entity] || []).filter(record => !destinationIds[entity].has(String(record.id)))
    ]));
}

function createSanitizedReport({ mode, source, destination, writtenRows = 0, writtenBatches = 0, reconciliation = null }) {
    return Object.freeze({
        ok: reconciliation ? reconciliation.ok : true,
        mode,
        sourceCounts: entityCounts(source),
        destinationCounts: entityCounts(destination),
        writtenRows,
        writtenBatches,
        reconciliation: reconciliation ? summarizeReconciliation(reconciliation) : null
    });
}

async function bootstrapRemoteSnapshot({ repository, snapshot, mode = 'validate', batchSize = 250 } = {}) {
    assertValidSnapshot(snapshot);
    if (!repository || typeof repository.exportSnapshot !== 'function' || typeof repository.save !== 'function') {
        throw bootstrapError('INVALID_REPOSITORY', 'O repositório remoto injetado é inválido.');
    }
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
        throw bootstrapError('INVALID_BATCH_SIZE', 'O tamanho do lote deve ser um inteiro positivo.');
    }

    const sanitized = sanitizeBootstrapSnapshot(snapshot);
    const before = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(before);
    assertDestinationCompatible(before, sanitized);
    const rowsByEntity = plannedRows(sanitized, before);

    if (mode === 'validate' || mode === 'plan') {
        return createSanitizedReport({ mode, source: sanitized, destination: before });
    }
    if (mode === 'reconcile') {
        const reconciliation = reconcileSnapshots(sanitized, before);
        return createSanitizedReport({ mode, source: sanitized, destination: before, reconciliation });
    }
    if (mode !== 'import') throw bootstrapError('INVALID_MODE', 'Modo de bootstrap inválido.');

    let writtenRows = 0;
    let writtenBatches = 0;
    for (const entity of IMPORT_ORDER) {
        for (const batch of createBatches(rowsByEntity[entity] || [], batchSize)) {
            await repository.save(entity, batch);
            writtenRows += batch.length;
            writtenBatches += 1;
        }
    }

    const after = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(after);
    const reconciliation = reconcileSnapshots(sanitized, after);
    if (!reconciliation.ok) throw bootstrapError('RECONCILIATION_FAILED', 'A reconciliação do bootstrap remoto falhou.');
    return createSanitizedReport({
        mode,
        source: sanitized,
        destination: after,
        writtenRows,
        writtenBatches,
        reconciliation
    });
}

export {
    IMPORT_ORDER,
    SANITIZED_ENTITIES,
    sanitizeBootstrapSnapshot,
    assertDestinationCompatible,
    inspectDestination,
    bootstrapRemoteSnapshot
};
