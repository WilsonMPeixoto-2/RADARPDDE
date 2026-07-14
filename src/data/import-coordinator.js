(function installRadarImportCoordinator(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const snapshotTools = typeof module !== 'undefined' && module.exports
        ? require('./snapshot-tools.js')
        : root.RadarSnapshotTools;
    const api = factory(contract, snapshotTools);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarImportCoordinator = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createRadarImportCoordinator(contract, snapshotTools) {
    'use strict';

    if (!contract || !snapshotTools) throw new Error('Contrato e ferramentas de snapshot são obrigatórios.');
    const { RepositoryError, assertRepositoryContract, cloneValue, createSnapshotEnvelope } = contract;
    const MIGRATABLE_ENTITIES = Object.freeze([
        'competences', 'programs', 'appConfig', 'controllers', 'inventoryTeamMembers',
        'schools', 'schoolPrograms', 'verifications', 'pendencies', 'pendencyAttempts',
        'pendencyContacts', 'assets', 'registeredInvoices', 'administrativeLogs'
    ]);
    const MIGRATABLE_SET = new Set(MIGRATABLE_ENTITIES);
    const {
        IMPORT_ENTITY_ORDER,
        validateSnapshot,
        validateSnapshotReferences,
        entityCounts,
        buildImportBatches,
        reconcileSnapshots,
        summarizeReconciliation,
        hashSnapshot
    } = snapshotTools;

    function createMemoryCheckpointStore() {
        const values = new Map();
        return Object.freeze({
            async load(importId) { return cloneValue(values.get(String(importId)) || null); },
            async save(importId, value) { values.set(String(importId), cloneValue(value)); return cloneValue(value); },
            async remove(importId) { values.delete(String(importId)); }
        });
    }

    function sanitizeReferenceErrors(errors) {
        return (errors || []).map(error => ({ relation: error.relation, message: error.message || null }));
    }

    function batchKey(batch) {
        return `${batch.entity}:${batch.batchIndex}`;
    }

    function migrationSnapshot(snapshot) {
        const entities = Object.entries(snapshot?.entities || {}).reduce((result, [entity, records]) => {
            if (MIGRATABLE_SET.has(entity)) result[entity] = cloneValue(records || []);
            return result;
        }, {});
        return createSnapshotEnvelope(entities, {
            version: snapshot?.version,
            importId: snapshot?.importId,
            exportedAt: snapshot?.exportedAt
        });
    }

    function snapshotFromStaged(source, stagedEntities) {
        return createSnapshotEnvelope(stagedEntities, {
            version: source.version,
            importId: source.importId,
            exportedAt: source.exportedAt
        });
    }

    class ImportCoordinator {
        constructor(options = {}) {
            this.targetRepository = assertRepositoryContract(options.targetRepository);
            this.checkpointStore = options.checkpointStore || createMemoryCheckpointStore();
            this.batchSize = Number.isInteger(options.batchSize) && options.batchSize > 0 ? options.batchSize : 250;
            this.now = options.now || (() => new Date().toISOString());
            if (typeof this.checkpointStore.load !== 'function'
                || typeof this.checkpointStore.save !== 'function') {
                throw new RepositoryError('INVALID_CHECKPOINT_STORE', 'Armazenamento de checkpoint inválido.', {
                    operation: 'constructImportCoordinator'
                });
            }
        }

        async plan(snapshot) {
            const candidate = migrationSnapshot(snapshot);
            const structural = validateSnapshot(candidate);
            const references = validateSnapshotReferences(candidate);
            const counts = structural.ok ? entityCounts(candidate) : {};
            const hash = structural.ok ? await hashSnapshot(candidate) : '';
            return {
                ok: structural.ok && references.ok,
                importId: String(snapshot?.importId || ''),
                version: String(snapshot?.version || ''),
                hash,
                counts,
                entityOrder: [...IMPORT_ENTITY_ORDER],
                structuralErrors: [...structural.errors],
                referenceErrors: sanitizeReferenceErrors(references.errors),
                batchSize: this.batchSize,
                batchCount: structural.ok ? buildImportBatches(candidate, this.batchSize).length : 0
            };
        }

        async validate(snapshot) {
            const plan = await this.plan(snapshot);
            if (!plan.ok) {
                throw new RepositoryError('VALIDATION_FAILED', 'O snapshot não está apto para migração.', {
                    operation: 'migration:validate',
                    details: {
                        structuralErrors: plan.structuralErrors,
                        referenceErrors: plan.referenceErrors
                    }
                });
            }
            return plan;
        }

        async dryRun(snapshot) {
            const plan = await this.validate(snapshot);
            return { ...plan, dryRun: true, writes: 0 };
        }

        async createCheckpoint(snapshot, plan) {
            const beforeSnapshot = await this.targetRepository.exportSnapshot({
                includeEmpty: true,
                importId: `${snapshot.importId}:rollback`,
                exportedAt: this.now()
            });
            const checkpoint = {
                importId: snapshot.importId,
                sourceHash: plan.hash,
                status: 'staging',
                startedAt: this.now(),
                updatedAt: this.now(),
                completedBatches: [],
                stagedEntities: {},
                counts: plan.counts,
                beforeSnapshot,
                report: null
            };
            await this.checkpointStore.save(snapshot.importId, checkpoint);
            if (typeof this.targetRepository.beginImport === 'function') {
                await this.targetRepository.beginImport({
                    importId: snapshot.importId,
                    format: snapshot.format,
                    version: snapshot.version,
                    sourceHash: plan.hash,
                    counts: plan.counts
                });
            }
            return checkpoint;
        }

        async import(snapshot, options = {}) {
            snapshot = migrationSnapshot(snapshot);
            const plan = await this.validate(snapshot);
            let checkpoint = await this.checkpointStore.load(snapshot.importId);
            if (checkpoint?.status === 'reconciled' && checkpoint.sourceHash === plan.hash) {
                return { ...cloneValue(checkpoint.report), report: cloneValue(checkpoint.report), resumed: true, idempotent: true };
            }
            if (checkpoint && checkpoint.sourceHash !== plan.hash) {
                throw new RepositoryError('IMPORT_ID_CONFLICT', 'O importId já está associado a outro conteúdo.', {
                    operation: 'migration:import',
                    details: { importId: snapshot.importId }
                });
            }
            const resumed = Boolean(checkpoint);
            if (!checkpoint) checkpoint = await this.createCheckpoint(snapshot, plan);

            const completed = new Set(checkpoint.completedBatches || []);
            let executedThisRun = 0;
            for (const batch of buildImportBatches(snapshot, this.batchSize)) {
                const key = batchKey(batch);
                if (completed.has(key)) continue;
                if (typeof this.targetRepository.stageImportBatch === 'function') {
                    await this.targetRepository.stageImportBatch({
                        importId: snapshot.importId,
                        entity: batch.entity,
                        batchIndex: batch.batchIndex,
                        records: batch.records,
                        sourceHash: plan.hash
                    });
                } else {
                    const current = checkpoint.stagedEntities[batch.entity] || [];
                    const byId = new Map(current.map(record => [String(record.id), record]));
                    for (const record of batch.records) byId.set(String(record.id), cloneValue(record));
                    checkpoint.stagedEntities[batch.entity] = [...byId.values()];
                }
                completed.add(key);
                checkpoint.completedBatches = [...completed];
                checkpoint.updatedAt = this.now();
                await this.checkpointStore.save(snapshot.importId, checkpoint);
                executedThisRun += 1;
                if (Number.isInteger(options.failAfterBatches)
                    && options.failAfterBatches > 0
                    && executedThisRun >= options.failAfterBatches) {
                    throw new RepositoryError('IMPORT_INTERRUPTED', 'Importação interrompida após checkpoint seguro.', {
                        operation: 'migration:import',
                        details: { importId: snapshot.importId, completedBatches: completed.size }
                    });
                }
            }

            const stagedSnapshot = typeof this.targetRepository.loadStagedSnapshot === 'function'
                ? await this.targetRepository.loadStagedSnapshot(snapshot.importId, snapshot)
                : snapshotFromStaged(snapshot, checkpoint.stagedEntities);
            const stagingReconciliation = reconcileSnapshots(snapshot, migrationSnapshot(stagedSnapshot));
            if (!stagingReconciliation.ok) {
                checkpoint.status = 'reconciliation_failed';
                checkpoint.report = this.buildReport(plan, checkpoint, stagingReconciliation, 'staging');
                await this.checkpointStore.save(snapshot.importId, checkpoint);
                throw new RepositoryError(
                    'IMPORT_RECONCILIATION_FAILED',
                    'A reconciliação do staging falhou; a promoção não foi executada.',
                    {
                        operation: 'migration:promote',
                        details: { report: checkpoint.report }
                    }
                );
            }

            try {
                if (typeof this.targetRepository.promoteImportSnapshot === 'function') {
                    await this.targetRepository.promoteImportSnapshot({
                        importId: snapshot.importId,
                        sourceHash: plan.hash,
                        counts: plan.counts,
                        snapshot
                    });
                } else {
                    await this.targetRepository.restoreSnapshot(snapshot, { replace: true });
                }
            } catch (error) {
                await this.rollback(snapshot.importId, { preserveFailure: true });
                throw error;
            }

            const target = await this.targetRepository.exportSnapshot({
                includeEmpty: true,
                version: snapshot.version,
                importId: snapshot.importId,
                exportedAt: snapshot.exportedAt
            });
            const reconciliation = reconcileSnapshots(snapshot, migrationSnapshot(target));
            if (!reconciliation.ok) {
                await this.rollback(snapshot.importId, { preserveFailure: true });
                throw new RepositoryError(
                    'IMPORT_RECONCILIATION_FAILED',
                    'A reconciliação posterior à promoção falhou e o rollback foi executado.',
                    {
                        operation: 'migration:reconcile',
                        details: { report: this.buildReport(plan, checkpoint, reconciliation, 'target') }
                    }
                );
            }

            checkpoint.status = 'reconciled';
            checkpoint.completedAt = this.now();
            checkpoint.updatedAt = this.now();
            checkpoint.report = this.buildReport(plan, checkpoint, reconciliation, 'target');
            await this.checkpointStore.save(snapshot.importId, checkpoint);
            if (typeof this.targetRepository.completeImport === 'function') {
                await this.targetRepository.completeImport({
                    importId: snapshot.importId,
                    sourceHash: plan.hash,
                    reconciliation: checkpoint.report.reconciliation
                });
            }
            return { ...cloneValue(checkpoint.report), report: cloneValue(checkpoint.report), resumed, idempotent: false };
        }

        buildReport(plan, checkpoint, reconciliation, phase) {
            return {
                status: reconciliation.ok ? 'reconciled' : 'reconciliation_failed',
                importId: plan.importId,
                version: plan.version,
                sourceHash: plan.hash,
                counts: cloneValue(plan.counts),
                batchSize: plan.batchSize,
                batchCount: plan.batchCount,
                completedBatchCount: checkpoint.completedBatches.length,
                phase,
                startedAt: checkpoint.startedAt,
                completedAt: reconciliation.ok ? this.now() : null,
                reconciliation: summarizeReconciliation(reconciliation)
            };
        }

        async reconcile(snapshot) {
            snapshot = migrationSnapshot(snapshot);
            const plan = await this.validate(snapshot);
            const target = await this.targetRepository.exportSnapshot({
                includeEmpty: true,
                version: snapshot.version,
                importId: snapshot.importId,
                exportedAt: snapshot.exportedAt
            });
            const reconciliation = reconcileSnapshots(snapshot, migrationSnapshot(target));
            if (!reconciliation.ok) {
                throw new RepositoryError(
                    'IMPORT_RECONCILIATION_FAILED',
                    'A reconciliação encontrou divergências.',
                    {
                        operation: 'migration:reconcile',
                        details: { report: summarizeReconciliation(reconciliation), sourceHash: plan.hash }
                    }
                );
            }
            return summarizeReconciliation(reconciliation);
        }

        async rollback(importId, options = {}) {
            const checkpoint = await this.checkpointStore.load(importId);
            if (!checkpoint?.beforeSnapshot) {
                throw new RepositoryError('IMPORT_ROLLBACK_UNAVAILABLE', 'Não existe snapshot de rollback para este importId.', {
                    operation: 'migration:rollback',
                    details: { importId }
                });
            }
            if (typeof this.targetRepository.rollbackImport === 'function') {
                await this.targetRepository.rollbackImport({ importId });
            } else {
                await this.targetRepository.restoreSnapshot(checkpoint.beforeSnapshot, { replace: true });
            }
            checkpoint.status = options.preserveFailure ? 'failed_rolled_back' : 'rolled_back';
            checkpoint.rolledBackAt = this.now();
            checkpoint.updatedAt = this.now();
            await this.checkpointStore.save(importId, checkpoint);
            return { status: 'rolled_back', importId: String(importId), rolledBackAt: checkpoint.rolledBackAt };
        }
    }

    return Object.freeze({ MIGRATABLE_ENTITIES, ImportCoordinator, createMemoryCheckpointStore });
}));
