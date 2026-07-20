import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');
const {
    IMPORT_ENTITY_ORDER: IMPORT_ORDER,
    validateSnapshot,
    validateSnapshotReferences,
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
const GENERATED_METADATA_FIELDS = new Set([
    'row_version', 'rowVersion', 'created_at', 'createdAt', 'updated_at', 'updatedAt'
]);
const NULL_EQUIVALENT_DEFAULTS = Object.freeze({
    controllers: new Set(['user_id']),
    inventoryTeamMembers: new Set(['user_id'])
});
const PROFILE_BASELINE = Object.freeze([
    Object.freeze({ id: 'technical_admin', label: 'Administrador técnico', priority: 10, description: 'Administração técnica e segurança do ambiente.', active: true }),
    Object.freeze({ id: 'sme_management', label: 'Gestão SME', priority: 20, description: 'Leitura gerencial e administração institucional.', active: true }),
    Object.freeze({ id: 'federal_assistant', label: 'Assistente de Verbas Federais', priority: 30, description: 'Operação transversal de verbas federais.', active: true }),
    Object.freeze({ id: 'controller', label: 'Controlador', priority: 40, description: 'Operação da carteira de escolas vinculada.', active: true }),
    Object.freeze({ id: 'inventory', label: 'Equipe de Inventário', priority: 50, description: 'Operação patrimonial e de inventariação.', active: true })
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

function projectRecord(record, entity) {
    const projected = Object.fromEntries(
        Object.entries(record || {}).filter(([field]) => !GENERATED_METADATA_FIELDS.has(field))
    );
    for (const field of NULL_EQUIVALENT_DEFAULTS[entity] || []) {
        if (projected[field] === null) delete projected[field];
    }
    return projected;
}

function projectBootstrapSnapshot(snapshot) {
    const projected = clone(snapshot);
    projected.entities = Object.fromEntries(RADAR_ENTITIES.map(entity => [
        entity,
        (snapshot.entities[entity] || []).map(record => projectRecord(record, entity))
    ]));
    SANITIZED_ENTITIES.forEach(entity => {
        projected.entities[entity] = [];
    });
    return projected;
}

function assertValidSnapshot(snapshot) {
    const validation = validateSnapshot(snapshot);
    const hasAllCollections = RADAR_ENTITIES.every(entity => Object.hasOwn(snapshot?.entities || {}, entity));
    const references = validation.ok ? validateSnapshotReferences(snapshot) : { ok: false };
    if (!validation.ok
        || String(snapshot?.version || '') !== '1'
        || (snapshot?.schemaVersion !== undefined && String(snapshot.schemaVersion) !== '1')
        || !hasAllCollections
        || !references.ok) {
        throw bootstrapError('VALIDATION_FAILED', 'Snapshot de bootstrap invalido.');
    }
}

function sanitizeBootstrapSnapshot(snapshot) {
    const sanitized = clone(snapshot);
    sanitized.entities = { ...(sanitized.entities || {}) };
    SANITIZED_ENTITIES.forEach(entity => {
        sanitized.entities[entity] = [];
    });
    return sanitized;
}

function recordsMatch(left, right, entity) {
    return stableStringify(projectRecord(left, entity)) === stableStringify(projectRecord(right, entity));
}

function matchesProfileBaseline(records) {
    if (records.length !== PROFILE_BASELINE.length) return false;
    const byId = new Map(records.map(record => [String(record.id), record]));
    return PROFILE_BASELINE.every(profile => recordsMatch(byId.get(profile.id), profile, 'profiles'));
}

function assertDestinationCompatible(destination, source) {
    for (const entity of RADAR_ENTITIES) {
        if (SANITIZED_ENTITIES.includes(entity)) continue;
        const destinationRecords = destination.entities[entity] || [];
        if (entity === 'profiles' && (source.entities.profiles || []).length === 0) {
            if (destinationRecords.length > 0 && !matchesProfileBaseline(destinationRecords)) {
                throw bootstrapError('DESTINATION_CONFLICT', 'O destino remoto contem dados incompativeis com o snapshot canonico.');
            }
            continue;
        }
        const sourceById = new Map((source.entities[entity] || []).map(record => [String(record.id), record]));
        for (const record of destinationRecords) {
            const expected = sourceById.get(String(record.id));
            if (!expected || !recordsMatch(expected, record, entity)) {
                throw bootstrapError('DESTINATION_CONFLICT', 'O destino remoto contem dados incompativeis com o snapshot canonico.');
            }
        }
    }
}

function reconcileBootstrapSnapshots(source, destination) {
    const expected = projectBootstrapSnapshot(source);
    const actual = projectBootstrapSnapshot(destination);
    if (expected.entities.profiles.length === 0 && matchesProfileBaseline(destination.entities.profiles || [])) {
        actual.entities.profiles = [];
    }
    return reconcileSnapshots(expected, actual);
}

async function inspectDestination(repository, snapshot) {
    const destination = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(destination);
    if (snapshot) {
        assertValidSnapshot(snapshot);
        assertDestinationCompatible(destination, projectBootstrapSnapshot(sanitizeBootstrapSnapshot(snapshot)));
    }
    return Object.freeze({ compatible: true, entityCounts: entityCounts(destination) });
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
        (source.entities[entity] || [])
            .filter(record => !destinationIds[entity].has(String(record.id)))
            .map(record => projectRecord(record, entity))
    ]));
}

function createSanitizedReport({ mode, source, destination, writtenRows = 0, writtenBatches = 0, reconciliation = null }) {
    return Object.freeze({
        ok: reconciliation ? reconciliation.ok : true,
        mode,
        sourceCounts: entityCounts(source),
        destinationCounts: entityCounts(projectBootstrapSnapshot(destination)),
        writtenRows,
        writtenBatches,
        reconciliation: reconciliation ? summarizeReconciliation(reconciliation) : null
    });
}

async function bootstrapRemoteSnapshot({ repository, snapshot, mode = 'validate', batchSize = 250 } = {}) {
    assertValidSnapshot(snapshot);
    if (!repository || typeof repository.exportSnapshot !== 'function' || typeof repository.insertOnly !== 'function') {
        throw bootstrapError('INVALID_REPOSITORY', 'O repositorio remoto injetado e invalido.');
    }
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
        throw bootstrapError('INVALID_BATCH_SIZE', 'O tamanho do lote deve ser um inteiro positivo.');
    }

    const sanitized = projectBootstrapSnapshot(sanitizeBootstrapSnapshot(snapshot));
    const before = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(before);
    assertDestinationCompatible(before, sanitized);
    const rowsByEntity = plannedRows(sanitized, before);

    if (mode === 'validate' || mode === 'plan') {
        return createSanitizedReport({ mode, source: sanitized, destination: before });
    }
    if (mode === 'reconcile') {
        const reconciliation = reconcileBootstrapSnapshots(sanitized, before);
        if (!reconciliation.ok) throw bootstrapError('RECONCILIATION_FAILED', 'A reconciliacao do bootstrap remoto falhou.');
        return createSanitizedReport({ mode, source: sanitized, destination: before, reconciliation });
    }
    if (mode !== 'import') throw bootstrapError('INVALID_MODE', 'Modo de bootstrap invalido.');

    let writtenRows = 0;
    let writtenBatches = 0;
    for (const entity of IMPORT_ORDER) {
        for (const batch of createBatches(rowsByEntity[entity] || [], batchSize)) {
            try {
                await repository.insertOnly(entity, batch);
            } catch (error) {
                const cause = error?.cause || error;
                if (cause?.code === '23505' || /duplicate|unique/i.test(String(cause?.message || error?.message || ''))) {
                    throw bootstrapError('DESTINATION_CONFLICT', 'O destino remoto contem dados incompativeis com o snapshot canonico.');
                }
                throw error;
            }
            writtenRows += batch.length;
            writtenBatches += 1;
        }
    }

    const after = await repository.exportSnapshot({ includeEmpty: true });
    assertValidSnapshot(after);
    const reconciliation = reconcileBootstrapSnapshots(sanitized, after);
    if (!reconciliation.ok) throw bootstrapError('RECONCILIATION_FAILED', 'A reconciliacao do bootstrap remoto falhou.');
    return createSanitizedReport({ mode, source: sanitized, destination: after, writtenRows, writtenBatches, reconciliation });
}

export {
    IMPORT_ORDER,
    SANITIZED_ENTITIES,
    PROFILE_BASELINE,
    sanitizeBootstrapSnapshot,
    projectBootstrapSnapshot,
    assertDestinationCompatible,
    inspectDestination,
    bootstrapRemoteSnapshot
};
