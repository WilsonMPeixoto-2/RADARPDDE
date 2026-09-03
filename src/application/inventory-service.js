(function installRadarInventoryService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const invoiceEffects = typeof module !== 'undefined' && module.exports
        ? require('../domain/invoice-effects.js')
        : root.RadarInvoiceEffects;
    const api = factory(contract, invoiceEffects);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInventoryService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInventoryServiceApi(contract, invoiceEffects) {
    'use strict';

    if (!contract || !invoiceEffects) {
        throw new Error('Contrato de dados e projeção canônica de inventariação são obrigatórios para inventário.');
    }
    const { RepositoryError, cloneValue } = contract;
    const {
        deriveInventoryForwarding,
        applyInventoryForwardingProjection
    } = invoiceEffects;
    const DIRECT_EDIT_FIELDS = new Set(['notaFiscal']);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function normalizeProfile(value) {
        const profile = text(value).toLocaleLowerCase('pt-BR');
        if (profile === 'assistente cre' || profile === 'assistente de verbas federais') return 'assistente';
        if (profile === 'equipe de inventário') return 'inventario';
        return profile;
    }

    function fail(code, message, operation, details = null) {
        throw new RepositoryError(code, message, { operation, details });
    }

    class InventoryService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            this.getCurrentProfile = options.getCurrentProfile || (() => '');
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.now = options.now || (() => new Date());
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_INVENTORY_SERVICE', 'Dependências do serviço de inventário inválidas.', 'construct');
            }
        }

        findAsset(state, assetId, operation) {
            const asset = state.assets.find(item => item.id === text(assetId));
            if (!asset) fail('ASSET_NOT_FOUND', 'Bem patrimonial não localizado.', operation, { assetId });
            return asset;
        }

        findSchool(state, schoolId, operation) {
            const school = state.schools.find(item => item.id === text(schoolId));
            if (!school) fail('SCHOOL_NOT_FOUND', 'Unidade escolar não localizada.', operation, { schoolId });
            return school;
        }

        linkedInvoiceContext(state, asset, operation) {
            const assetId = text(asset?.id);
            const matches = list(state.registeredInvoices).filter(invoice => (
                text(invoice.bemId || invoice.linkedAssetId || invoice.linked_asset_id) === assetId
            ));
            if (matches.length > 1) {
                fail(
                    'ASSET_LINK_AMBIGUOUS',
                    'O bem patrimonial está vinculado a mais de uma despesa fiscal.',
                    operation,
                    { assetId, invoiceIds: matches.map(invoice => invoice.id) }
                );
            }
            const invoice = matches[0] || null;
            if (!invoice || text(invoice.tipo || invoice.expenseType || invoice.expense_type) !== 'permanente') {
                return null;
            }
            const compKey = text(invoice.compKey || invoice.sourceContextKey || invoice.source_context_key);
            if (!compKey) return null;
            const verification = state.verifications?.[asset.escolaId]?.[compKey] || null;
            if (!verification) return null;

            const contextInvoices = list(state.registeredInvoices).filter(item => (
                text(item.escolaId) === text(asset.escolaId)
                && text(item.compKey || item.sourceContextKey || item.source_context_key) === compKey
            ));
            const contextAssetIds = new Set(
                contextInvoices
                    .map(item => text(item.bemId || item.linkedAssetId || item.linked_asset_id))
                    .filter(Boolean)
            );
            const contextAssets = list(state.assets).filter(item => (
                contextAssetIds.has(text(item.id))
            ));
            const separator = compKey.indexOf('_');
            const competence = separator >= 0 ? compKey.slice(0, separator) : text(invoice.competencia);
            const programId = separator >= 0 ? compKey.slice(separator + 1) : text(invoice.programaId);
            return {
                invoice,
                verification,
                contextInvoices,
                contextAssets,
                compKey,
                competence,
                programId,
                verificationId: `${asset.escolaId}::${competence}::${programId}`
            };
        }

        syncLinkedInventoryProjection(state, asset, persistence, operation) {
            const linked = this.linkedInvoiceContext(state, asset, operation);
            if (!linked) return null;
            const delivery = deriveInventoryForwarding(
                linked.contextInvoices,
                linked.contextAssets,
                asset
            );
            applyInventoryForwardingProjection(linked.verification, delivery);
            persistence.invoiceId = linked.invoice.id;
            persistence.expectedInvoiceVersion = rowVersionOf(linked.invoice);
            persistence.verificationId = linked.verificationId;
            persistence.expectedVerificationVersion = rowVersionOf(linked.verification);
            return {
                invoice: cloneValue(linked.invoice),
                verification: cloneValue(linked.verification),
                delivery
            };
        }

        assertOperationalProfile(profile, operation) {
            const normalized = normalizeProfile(this.getCurrentProfile() || profile);
            if (!['controlador', 'assistente'].includes(normalized)) {
                fail('FORBIDDEN', 'O perfil atual não pode alterar este registro patrimonial.', operation);
            }
            return normalized;
        }

        appendSchoolLog(schoolId, action, details) {
            const log = this.appendLog(action, details, { escolaId: schoolId, schoolId });
            if (log && typeof log === 'object' && !text(log.escolaId) && !text(log.school_id)) {
                log.escolaId = schoolId;
            }
            return log || null;
        }

        persistAsset(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            const entities = snapshot?.entities || {};
            const asset = list(entities.assets)
                .find(record => String(record.id) === String(persistence.assetId));
            const administrativeLog = list(entities.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            if (!asset || !administrativeLog) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'O bem ou o histórico da operação não foi produzido para persistência.',
                    'persistAsset',
                    { assetId: persistence.assetId, logId: persistence.logId }
                );
            }

            const capabilities = repository.capabilities?.() || {};
            if (
                persistence.invoiceId
                && persistence.verificationId
                && capabilities.atomicInvoiceEffects === true
                && typeof repository.saveInvoiceWithEffects === 'function'
            ) {
                const invoice = list(entities.registeredInvoices)
                    .find(record => String(record.id) === String(persistence.invoiceId));
                const verificationPatch = list(entities.verifications)
                    .find(record => String(record.id) === String(persistence.verificationId));
                if (!invoice || !verificationPatch) {
                    fail(
                        'PERSISTENCE_CONTEXT_MISSING',
                        'A NF vinculada ou a verificação mensal não foi produzida para persistência patrimonial atômica.',
                        'persistAsset',
                        {
                            assetId: persistence.assetId,
                            invoiceId: persistence.invoiceId,
                            verificationId: persistence.verificationId
                        }
                    );
                }
                return repository.saveInvoiceWithEffects({
                    invoice,
                    asset,
                    verificationPatch,
                    administrativeLog,
                    expectedInvoiceVersion: persistence.expectedInvoiceVersion,
                    expectedAssetVersion: persistence.expectedVersion,
                    expectedVerificationVersion: persistence.expectedVerificationVersion
                });
            }

            if (typeof repository.saveAssetWithLog !== 'function') return defaultPersist();
            return repository.saveAssetWithLog({
                asset,
                expectedVersion: persistence.expectedVersion,
                administrativeLog
            });
        }

        async updateAsset(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:update-asset');
            const field = text(input.field);
            if (!DIRECT_EDIT_FIELDS.has(field)) {
                fail(
                    'VALIDATION_FAILED',
                    'Este campo exige um fluxo patrimonial específico e não pode ser alterado pela edição rápida.',
                    'inventory:update-asset',
                    { field }
                );
            }
            const persistence = {};
            return this.dataService.execute({
                name: 'inventory:update-asset',
                changedEntities: ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:update-asset');
                    persistence.assetId = asset.id;
                    persistence.expectedVersion = rowVersionOf(asset);
                    const previousValue = text(asset[field]);
                    asset[field] = text(input.value);
                    const log = this.appendSchoolLog(
                        asset.escolaId,
                        'Bem Patrimonial Atualizado',
                        `Nota fiscal do bem ${asset.item || asset.descricao || asset.id} alterada de ${previousValue || 'não informada'} para ${asset[field] || 'não informada'}.`
                    );
                    persistence.logId = text(log?.id);
                    return { asset: cloneValue(asset) };
                },
                persist: context => this.persistAsset(context, persistence)
            });
        }

        async forward(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:forward');
            const initialState = this.getState();
            const initialAsset = this.findAsset(initialState, input.assetId, 'inventory:forward');
            const linkedContext = this.linkedInvoiceContext(
                initialState,
                initialAsset,
                'inventory:forward'
            );
            const persistence = {};
            return this.dataService.execute({
                name: 'inventory:forward',
                changedEntities: linkedContext
                    ? ['registeredInvoices', 'assets', 'verifications', 'administrativeLogs']
                    : ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:forward');
                    const school = this.findSchool(state, asset.escolaId, 'inventory:forward');
                    persistence.assetId = asset.id;
                    persistence.expectedVersion = rowVersionOf(asset);
                    if (!text(asset.notaFiscal)) {
                        fail(
                            'INVOICE_NUMBER_REQUIRED',
                            'Erro de Validação: Não é possível encaminhar bens patrimoniais sem preencher o Número da Nota Fiscal.',
                            'inventory:forward'
                        );
                    }
                    if (!text(school.processoInventario)) {
                        fail(
                            'INVENTORY_PROCESS_REQUIRED',
                            'Erro de Validação: A unidade escolar não possui um Processo de Inventário cadastrado para o exercício. Por favor, atualize os dados cadastrais da escola primeiro.',
                            'inventory:forward'
                        );
                    }
                    asset.status = 'Encaminhada';
                    asset.processoInventario = text(school.processoInventario);
                    const linkedProjection = this.syncLinkedInventoryProjection(
                        state,
                        asset,
                        persistence,
                        'inventory:forward'
                    );
                    const log = this.appendSchoolLog(
                        school.id,
                        'Capital Encaminhado',
                        `Aquisição ${asset.item} da escola ${school.denominação || ''} encaminhada ao inventariador com NF ${asset.notaFiscal} no processo ${school.processoInventario}.`
                    );
                    persistence.logId = text(log?.id);
                    return {
                        asset: cloneValue(asset),
                        invoice: linkedProjection?.invoice || null,
                        verification: linkedProjection?.verification || null,
                        inventoryDelivery: linkedProjection?.delivery || null
                    };
                },
                persist: context => this.persistAsset(context, persistence)
            });
        }

        async inventory(input = {}) {
            const profile = normalizeProfile(this.getCurrentProfile() || input.profile);
            if (!['inventario', 'assistente', 'controlador'].includes(profile)) {
                fail('FORBIDDEN', 'O perfil atual não pode concluir a inventariação.', 'inventory:complete');
            }
            const responsible = text(input.responsible);
            if (!responsible) {
                fail('VALIDATION_FAILED', 'O responsável pela inventariação é obrigatório.', 'inventory:complete');
            }
            const persistence = {};
            return this.dataService.execute({
                name: 'inventory:complete',
                changedEntities: ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:complete');
                    const school = this.findSchool(state, asset.escolaId, 'inventory:complete');
                    persistence.assetId = asset.id;
                    persistence.expectedVersion = rowVersionOf(asset);
                    const instant = this.now();
                    const iso = instant instanceof Date ? instant.toISOString() : new Date(instant).toISOString();
                    const formatted = new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        + ' '
                        + new Date(iso).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC'
                        });
                    asset.status = 'Inventariada';
                    asset.inventariadoPor = responsible;
                    asset.inventariadorId = text(input.responsibleId) || null;
                    asset.observacoes = text(input.notes);
                    asset.inventariadoEm = formatted;
                    asset.dataInventariacao = iso;
                    const log = this.appendSchoolLog(
                        school.id,
                        'Inventariação Concluída',
                        `Bem patrimonial ${asset.item} da escola ${school.denominação || ''} foi registrado e inventariado por ${responsible}.`
                    );
                    persistence.logId = text(log?.id);
                    return { asset: cloneValue(asset) };
                },
                persist: context => this.persistAsset(context, persistence)
            });
        }

        async createAsset(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:create');
            const persistence = { expectedVersion: null };
            const amount = Number(input.amount);
            if (!text(input.description) || !Number.isFinite(amount) || amount < 0) {
                fail('VALIDATION_FAILED', 'Descrição e valor válido são obrigatórios.', 'inventory:create');
            }
            return this.dataService.execute({
                name: 'inventory:create',
                changedEntities: ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const school = this.findSchool(state, input.schoolId, 'inventory:create');
                    const invoiceNumber = text(input.invoiceNumber);
                    const asset = {
                        id: this.createId('bem'),
                        escolaId: school.id,
                        competencia: text(input.competence),
                        item: text(input.description),
                        descricao: text(input.description),
                        tipo: 'permanente',
                        valor: amount,
                        notaFiscal: invoiceNumber,
                        processoInventario: text(school.processoInventario),
                        status: invoiceNumber && text(school.processoInventario)
                            ? 'Encaminhada'
                            : 'Não encaminhada'
                    };
                    state.assets.push(asset);
                    const log = this.appendSchoolLog(
                        school.id,
                        'Bem Cadastrado',
                        `Gasto de capital de R$ ${amount} registrado para ${school.denominação || ''}: ${asset.item}.`
                    );
                    persistence.assetId = asset.id;
                    persistence.logId = text(log?.id);
                    return { asset: cloneValue(asset) };
                },
                persist: context => this.persistAsset(context, persistence)
            });
        }
    }

    return Object.freeze({ InventoryService });
}));
