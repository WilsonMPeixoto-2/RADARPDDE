(function installRadarInventoryService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarInventoryService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createInventoryServiceApi(contract) {
    'use strict';

    if (!contract) throw new Error('Contrato de dados obrigatório para inventário.');
    const { RepositoryError, cloneValue } = contract;
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

    function invoiceType(invoice = {}) {
        return text(invoice.tipo || invoice.expenseType || invoice.expense_type)
            .toLocaleLowerCase('pt-BR');
    }

    function linkedAssetId(invoice = {}) {
        return text(invoice.bemId || invoice.linkedAssetId || invoice.linked_asset_id);
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

        findLinkedInvoice(state, assetId, operation) {
            const id = text(assetId);
            const matches = list(state.registeredInvoices).filter(invoice => linkedAssetId(invoice) === id);
            if (matches.length > 1) {
                fail(
                    'AMBIGUOUS_ASSET_LINK',
                    'O bem patrimonial está vinculado a mais de uma Nota Fiscal.',
                    operation,
                    { assetId: id, invoiceIds: matches.map(invoice => invoice.id) }
                );
            }
            return matches[0] || null;
        }

        linkedInventoryContext(state, asset, operation) {
            const invoice = this.findLinkedInvoice(state, asset.id, operation);
            if (!invoice || invoiceType(invoice) !== 'permanente') return null;
            const schoolId = text(invoice.escolaId || invoice.school_id);
            const compKey = text(invoice.compKey || invoice.sourceContextKey || invoice.source_context_key);
            if (!schoolId || !compKey) {
                fail(
                    'INCOMPLETE_INVOICE_CONTEXT',
                    'A Nota Fiscal vinculada ao bem não possui contexto mensal completo.',
                    operation,
                    { invoiceId: invoice.id, assetId: asset.id }
                );
            }
            const separator = compKey.indexOf('_');
            if (separator < 0) {
                fail(
                    'INCOMPLETE_INVOICE_CONTEXT',
                    'A Nota Fiscal vinculada ao bem não possui programa no contexto mensal.',
                    operation,
                    { invoiceId: invoice.id, compKey }
                );
            }
            const competence = compKey.slice(0, separator);
            const programId = compKey.slice(separator + 1);
            const verification = state.verifications?.[schoolId]?.[compKey] || null;
            if (!verification) {
                fail(
                    'VERIFICATION_NOT_FOUND',
                    'A verificação mensal vinculada ao bem patrimonial não foi localizada.',
                    operation,
                    { invoiceId: invoice.id, assetId: asset.id, compKey }
                );
            }
            const contextInvoices = list(state.registeredInvoices).filter(item => (
                text(item.escolaId || item.school_id) === schoolId
                && text(item.compKey || item.sourceContextKey || item.source_context_key) === compKey
                && invoiceType(item) === 'permanente'
            ));
            const contextAssetIds = new Set(contextInvoices.map(linkedAssetId).filter(Boolean));
            const contextAssets = list(state.assets).filter(item => contextAssetIds.has(text(item.id)));
            return {
                invoice,
                verification,
                contextInvoices,
                contextAssets,
                schoolId,
                compKey,
                competence,
                programId,
                verificationId: `${schoolId}::${competence}::${programId}`
            };
        }

        deriveInventoryDelivery(context) {
            if (!context || context.contextInvoices.length === 0) return 'Não se aplica';
            const assetsById = new Map(context.contextAssets.map(asset => [text(asset.id), asset]));
            const allForwarded = context.contextInvoices.every(invoice => {
                const asset = assetsById.get(linkedAssetId(invoice));
                return asset && ['Encaminhada', 'Inventariada'].includes(text(asset.status));
            });
            return allForwarded ? 'Sim' : 'Não';
        }

        synchronizeInventoryVerification(state, asset, persistence, operation) {
            const context = this.linkedInventoryContext(state, asset, operation);
            if (!context) return null;
            const delivery = this.deriveInventoryDelivery(context);
            const verification = context.verification;
            verification.bonificacao = verification.bonificacao || {};
            verification.analise = verification.analise || {};
            const previousDelivery = text(verification.bonificacao.encampInventario);
            const previousAnalysis = text(verification.analise.encampInventario);
            verification.bonificacao.encampInventario = delivery;
            if (delivery === 'Não se aplica') {
                verification.analise.encampInventario = 'Correto';
            } else if (!previousDelivery || previousDelivery !== delivery || !previousAnalysis) {
                verification.analise.encampInventario = 'Não analisado';
            }
            const changed = previousDelivery !== text(verification.bonificacao.encampInventario)
                || previousAnalysis !== text(verification.analise.encampInventario);
            if (changed) {
                persistence.verificationId = context.verificationId;
                persistence.expectedVerificationVersion = rowVersionOf(verification);
            }
            return {
                changed,
                delivery,
                verification: cloneValue(verification),
                verificationId: context.verificationId
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

            if (persistence.verificationId) {
                const verification = list(entities.verifications)
                    .find(record => String(record.id) === String(persistence.verificationId));
                if (!verification) {
                    fail(
                        'PERSISTENCE_CONTEXT_MISSING',
                        'A verificação mensal sincronizada não foi produzida para persistência.',
                        'persistAsset',
                        { verificationId: persistence.verificationId }
                    );
                }
                const capabilities = repository.capabilities?.() || {};
                if (capabilities.remote === true && typeof repository.executeRpc === 'function') {
                    return repository.executeRpc('save_asset_with_verification_and_log', {
                        p_asset: asset,
                        p_expected_asset_version: persistence.expectedVersion,
                        p_verification: verification,
                        p_expected_verification_version: persistence.expectedVerificationVersion,
                        p_administrative_log: administrativeLog
                    }, 'saveAssetWithVerificationAndLog');
                }
                return defaultPersist();
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
                    if (field === 'notaFiscal' && this.findLinkedInvoice(state, asset.id, 'inventory:update-asset')) {
                        fail(
                            'LINKED_INVOICE_FIELD_LOCKED',
                            'O número da Nota Fiscal deste bem deve ser alterado no cadastro da própria Nota Fiscal para manter as telas sincronizadas.',
                            'inventory:update-asset',
                            { assetId: asset.id }
                        );
                    }
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
            const hasLinkedContext = Boolean(this.linkedInventoryContext(
                initialState,
                initialAsset,
                'inventory:forward'
            ));
            const persistence = {};
            return this.dataService.execute({
                name: 'inventory:forward',
                changedEntities: hasLinkedContext
                    ? ['assets', 'verifications', 'administrativeLogs']
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
                    const synchronization = this.synchronizeInventoryVerification(
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
                        verification: synchronization?.verification || null,
                        inventoryDelivery: synchronization?.delivery || null
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
                    if (text(asset.status) !== 'Encaminhada') {
                        fail(
                            'ASSET_NOT_FORWARDED',
                            'O bem precisa ser encaminhado para inventariação antes de a inventariação ser concluída.',
                            'inventory:complete',
                            { assetId: asset.id, status: text(asset.status) }
                        );
                    }
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
