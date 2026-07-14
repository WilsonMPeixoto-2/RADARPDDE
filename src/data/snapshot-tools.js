(function installRadarSnapshotTools(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const nodeCrypto = typeof module !== 'undefined' && module.exports
        ? require('node:crypto')
        : null;
    const api = factory(contract, nodeCrypto, root);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarSnapshotTools = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSnapshotToolsApi(contract, nodeCrypto, root) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes das ferramentas de snapshot.');
    }

    const cloneValue = contract.cloneValue;
    const SNAPSHOT_FORMAT = contract.SNAPSHOT_FORMAT;
    const ENTITY_SET = new Set(contract.RADAR_ENTITIES);
    const IMPORT_ENTITY_ORDER = Object.freeze([
        'competences',
        'programs',
        'appConfig',
        'controllers',
        'inventoryTeamMembers',
        'profiles',
        'schools',
        'schoolPrograms',
        'verifications',
        'pendencies',
        'pendencyAttempts',
        'pendencyContacts',
        'assets',
        'registeredInvoices',
        'administrativeLogs',
        'userProfiles',
        'userSchoolScopes',
        'dataImportRuns',
        'auditEvents'
    ]);
    const ORDER_INDEX = new Map(IMPORT_ENTITY_ORDER.map((entity, index) => [entity, index]));

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
            if (!ENTITY_SET.has(entity)) {
                errors.push(`Entidade desconhecida no snapshot: ${entity}.`);
            }
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
        Object.keys(snapshot.entities)
            .sort((left, right) => (ORDER_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER)
                - (ORDER_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER)
                || left.localeCompare(right))
            .forEach(entity => {
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


    function entityCounts(snapshot) {
        assertValidSnapshot(snapshot);
        return Object.keys(snapshot.entities).sort().reduce((counts, entity) => {
            counts[entity] = snapshot.entities[entity].length;
            return counts;
        }, {});
    }

    function idSet(snapshot, entity) {
        return new Set((snapshot.entities[entity] || []).map(record => String(record.id)));
    }

    function validateSnapshotReferences(snapshot) {
        const structure = validateSnapshot(snapshot);
        if (!structure.ok) return { ok: false, errors: structure.errors.map(message => ({ relation: 'structure', message })) };
        const errors = [];
        const sets = new Map(contract.RADAR_ENTITIES.map(entity => [entity, idSet(snapshot, entity)]));
        const check = (entity, record, field, target, optional = false) => {
            const value = record?.[field];
            if ((value == null || value === '') && optional) return;
            if (value == null || value === '' || !sets.get(target).has(String(value))) {
                errors.push({
                    relation: `${entity}.${field}->${target}.id`,
                    recordId: String(record?.id || ''),
                    targetId: value == null ? null : String(value)
                });
            }
        };

        for (const record of snapshot.entities.appConfig || []) check('appConfig', record, 'closing_competence', 'competences', true);
        for (const record of snapshot.entities.schools || []) {
            check('schools', record, 'controller_id', 'controllers', true);
            check('schools', record, 'initial_competence', 'competences', true);
        }
        for (const record of snapshot.entities.schoolPrograms || []) {
            check('schoolPrograms', record, 'school_id', 'schools');
            check('schoolPrograms', record, 'program_id', 'programs');
        }
        for (const record of snapshot.entities.verifications || []) {
            check('verifications', record, 'school_id', 'schools');
            check('verifications', record, 'competence_id', 'competences');
            check('verifications', record, 'program_id', 'programs');
        }
        for (const record of snapshot.entities.pendencies || []) {
            check('pendencies', record, 'school_id', 'schools');
            check('pendencies', record, 'competence_origin', 'competences');
            check('pendencies', record, 'program_id', 'programs', true);
        }
        for (const record of snapshot.entities.pendencyAttempts || []) check('pendencyAttempts', record, 'pendency_id', 'pendencies');
        for (const record of snapshot.entities.pendencyContacts || []) {
            check('pendencyContacts', record, 'school_id', 'schools');
            check('pendencyContacts', record, 'pendency_id', 'pendencies', true);
        }
        for (const record of snapshot.entities.assets || []) {
            check('assets', record, 'school_id', 'schools');
            check('assets', record, 'competence_id', 'competences', true);
        }
        for (const record of snapshot.entities.registeredInvoices || []) {
            check('registeredInvoices', record, 'school_id', 'schools');
            check('registeredInvoices', record, 'competence_id', 'competences', true);
            check('registeredInvoices', record, 'program_id', 'programs', true);
            check('registeredInvoices', record, 'verification_id', 'verifications', true);
            check('registeredInvoices', record, 'linked_asset_id', 'assets', true);
        }
        for (const record of snapshot.entities.administrativeLogs || []) check('administrativeLogs', record, 'school_id', 'schools', true);
        for (const record of snapshot.entities.userProfiles || []) {
            check('userProfiles', record, 'profile_id', 'profiles');
            check('userProfiles', record, 'controller_id', 'controllers', true);
            check('userProfiles', record, 'inventory_member_id', 'inventoryTeamMembers', true);
        }
        for (const record of snapshot.entities.userSchoolScopes || []) check('userSchoolScopes', record, 'school_id', 'schools');
        return { ok: errors.length === 0, errors };
    }

    async function sha256(value) {
        const encoded = stableStringify(value);
        if (nodeCrypto?.createHash) return nodeCrypto.createHash('sha256').update(encoded).digest('hex');
        if (root?.crypto?.subtle && typeof TextEncoder !== 'undefined') {
            const digest = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(encoded));
            return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        }
        throw new Error('SHA-256 não está disponível neste ambiente.');
    }

    async function hashSnapshot(snapshot) {
        assertValidSnapshot(snapshot);
        return sha256({
            format: snapshot.format,
            version: snapshot.version,
            importId: snapshot.importId,
            entities: snapshot.entities
        });
    }

    function summarizeReconciliation(report) {
        return {
            ok: Boolean(report?.ok),
            sourceImportId: String(report?.sourceImportId || ''),
            targetImportId: String(report?.targetImportId || ''),
            entities: Object.fromEntries(Object.entries(report?.entities || {}).map(([entity, value]) => [entity, {
                ok: Boolean(value.ok),
                sourceCount: Number(value.sourceCount || 0),
                targetCount: Number(value.targetCount || 0),
                missingCount: value.missingInTarget?.length || 0,
                unexpectedCount: value.unexpectedInTarget?.length || 0,
                changedCount: value.changed?.length || 0
            }]))
        };
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
        IMPORT_ENTITY_ORDER,
        createSnapshot,
        validateSnapshot,
        validateSnapshotReferences,
        entityCounts,
        buildImportBatches,
        reconcileSnapshots,
        summarizeReconciliation,
        stableStringify,
        hashSnapshot
    });
}));
