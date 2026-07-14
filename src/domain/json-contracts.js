(function installRadarJsonContracts(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const AjvModule = typeof module !== 'undefined' && module.exports
        ? require('ajv')
        : root.RadarAjv;
    const AjvCtor = AjvModule?.default || AjvModule;
    const api = factory(contract, AjvCtor);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarJsonContracts = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createRadarJsonContracts(contract, AjvCtor) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract é obrigatório para contratos JSON.');
    if (typeof AjvCtor !== 'function') throw new Error('Ajv deve ser carregado antes dos contratos JSON.');

    const { RepositoryError, cloneValue } = contract;
    const scalar = Object.freeze({ type: ['string', 'number', 'boolean', 'null'] });
    const flexibleObject = Object.freeze({
        type: 'object',
        additionalProperties: true
    });
    const errorItem = Object.freeze({
        anyOf: [
            { type: 'string', minLength: 1 },
            {
                type: 'object',
                minProperties: 1,
                additionalProperties: true,
                properties: {
                    codigo: { type: 'string' },
                    code: { type: 'string' },
                    mensagem: { type: 'string' },
                    message: { type: 'string' },
                    item: { type: 'string' }
                }
            }
        ]
    });

    const JSON_SCHEMAS = Object.freeze({
        bonification: {
            $id: 'radar://contracts/bonification',
            type: 'object',
            additionalProperties: {
                anyOf: [scalar, { type: 'array' }, flexibleObject]
            }
        },
        analysis: {
            $id: 'radar://contracts/analysis',
            type: 'object',
            additionalProperties: {
                anyOf: [scalar, { type: 'array' }, flexibleObject]
            }
        },
        errors: {
            $id: 'radar://contracts/errors',
            type: 'array',
            items: errorItem
        },
        attempt: {
            $id: 'radar://contracts/attempt',
            type: 'object',
            additionalProperties: true,
            properties: {
                id: { type: 'string', minLength: 1 },
                numero: { type: 'integer', minimum: 1 },
                attempt_number: { type: 'integer', minimum: 1 },
                status: { type: 'string' },
                resultado: { type: ['string', 'null'] },
                result: { type: ['string', 'null'] },
                errosEncontrados: { $ref: 'radar://contracts/errors' },
                errors: { $ref: 'radar://contracts/errors' }
            },
            anyOf: [
                { required: ['numero'] },
                { required: ['attempt_number'] }
            ]
        },
        cancellation: {
            $id: 'radar://contracts/cancellation',
            type: 'object',
            additionalProperties: true,
            properties: {
                justificativa: { type: 'string' },
                reason: { type: 'string' },
                dataHora: { type: 'string' },
                canceled_at: { type: ['string', 'null'] }
            }
        },
        resolution: {
            $id: 'radar://contracts/resolution',
            type: 'object',
            additionalProperties: true,
            properties: {
                observacao: { type: 'string' },
                notes: { type: 'string' },
                dataHora: { type: 'string' },
                resolved_at: { type: ['string', 'null'] }
            }
        },
        rectification: {
            $id: 'radar://contracts/rectification',
            type: 'object',
            additionalProperties: true,
            required: ['antes', 'depois'],
            properties: {
                antes: flexibleObject,
                depois: flexibleObject,
                justificativa: { type: 'string' },
                reason: { type: 'string' }
            }
        },
        auditDetails: {
            $id: 'radar://contracts/auditDetails',
            type: 'object',
            additionalProperties: true
        },
        compatibilityPayload: {
            $id: 'radar://contracts/compatibilityPayload',
            type: 'object',
            additionalProperties: true
        },
        entityCounts: {
            $id: 'radar://contracts/entityCounts',
            type: 'object',
            additionalProperties: { type: 'integer', minimum: 0 }
        },
        reconciliationReport: {
            $id: 'radar://contracts/reconciliationReport',
            type: 'object',
            additionalProperties: true,
            properties: {
                ok: { type: 'boolean' },
                entities: { type: 'object' },
                hash: { type: 'string' }
            }
        }
    });

    const CONTRACT_NAMES = Object.freeze(Object.keys(JSON_SCHEMAS));
    const ajv = new AjvCtor({ allErrors: true, strict: false, allowUnionTypes: true });
    for (const schema of Object.values(JSON_SCHEMAS)) ajv.addSchema(schema);
    const validators = new Map(CONTRACT_NAMES.map(name => [name, ajv.getSchema(JSON_SCHEMAS[name].$id)]));

    const ENTITY_JSON_FIELDS = Object.freeze({
        appConfig: Object.freeze({ exercises: null, settings: 'compatibilityPayload' }),
        verifications: Object.freeze({
            bonification: 'bonification',
            analysis: 'analysis',
            payload: 'compatibilityPayload'
        }),
        pendencies: Object.freeze({ payload: 'compatibilityPayload' }),
        pendencyAttempts: Object.freeze({ errors: 'errors', payload: 'compatibilityPayload' }),
        pendencyContacts: Object.freeze({ payload: 'compatibilityPayload' }),
        assets: Object.freeze({ payload: 'compatibilityPayload' }),
        registeredInvoices: Object.freeze({ payload: 'compatibilityPayload' }),
        administrativeLogs: Object.freeze({ details: 'auditDetails' }),
        dataImportRuns: Object.freeze({
            entity_counts: 'entityCounts',
            reconciliation_report: 'reconciliationReport'
        }),
        auditEvents: Object.freeze({
            old_record: 'compatibilityPayload',
            new_record: 'compatibilityPayload'
        })
    });

    function normalizeErrors(errors) {
        return (errors || []).map(error => ({
            instancePath: error.instancePath || '',
            schemaPath: error.schemaPath || '',
            keyword: error.keyword || '',
            message: error.message || 'valor inválido',
            params: cloneValue(error.params || {})
        }));
    }

    function validatorFor(name) {
        const validator = validators.get(name);
        if (!validator) {
            throw new RepositoryError('UNKNOWN_JSON_CONTRACT', `Contrato JSON desconhecido: ${String(name)}.`, {
                operation: 'validateContract',
                details: { contract: String(name) }
            });
        }
        return validator;
    }

    function validateContract(name, value) {
        const validator = validatorFor(name);
        const ok = Boolean(validator(value));
        return { ok, errors: ok ? [] : normalizeErrors(validator.errors) };
    }

    function assertContract(name, value, options = {}) {
        const validation = validateContract(name, value);
        if (!validation.ok) {
            throw new RepositoryError(
                'VALIDATION_FAILED',
                options.message || `O conteúdo de ${name} não atende ao contrato de dados.`,
                {
                    operation: options.operation || 'assertContract',
                    entity: options.entity || null,
                    details: { contract: name, errors: validation.errors }
                }
            );
        }
        return value;
    }

    function validateCanonicalRecord(entity, record) {
        const errors = [];
        const fields = ENTITY_JSON_FIELDS[entity] || {};
        for (const [field, contractName] of Object.entries(fields)) {
            const value = record?.[field];
            if (value == null || contractName == null) continue;
            const validation = validateContract(contractName, value);
            if (!validation.ok) errors.push({ field, contract: contractName, errors: validation.errors });
        }
        return { ok: errors.length === 0, errors };
    }

    function assertCanonicalRecords(entity, records, options = {}) {
        for (const [index, record] of (records || []).entries()) {
            const validation = validateCanonicalRecord(entity, record);
            if (!validation.ok) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    options.message || `Registro ${index} de ${entity} contém JSON incompatível.`,
                    {
                        operation: options.operation || 'assertCanonicalRecords',
                        entity,
                        details: { index, fields: validation.errors }
                    }
                );
            }
        }
        return records;
    }

    return Object.freeze({
        CONTRACT_NAMES,
        JSON_SCHEMAS,
        ENTITY_JSON_FIELDS,
        validateContract,
        assertContract,
        validateCanonicalRecord,
        assertCanonicalRecords
    });
}));
