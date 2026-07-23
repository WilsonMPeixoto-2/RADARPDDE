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
    const ASSET_FIELDS = new Set([
        'item',
        'descricao',
        'valor',
        'notaFiscal',
        'status',
        'processoInventario',
        'observacoes'
    ]);

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

        assertOperationalProfile(profile, operation) {
            const normalized = normalizeProfile(profile);
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
            if (typeof repository.saveAssetWithLog !== 'function') return defaultPersist();
            const asset = list(snapshot?.entities?.assets)
                .find(record => String(record.id) === String(persistence.assetId));
            const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            if (!asset || !administrativeLog) {
                fail(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'O bem ou o histórico da operação não foi produzido para persistência.',
                    'persistAsset',
                    { assetId: persistence.assetId, logId: persistence.logId }
                );
            }
            return repository.saveAssetWithLog({
                asset,
                expectedVersion: persistence.expectedVersion,
                administrativeLog
            });
        }

        async updateAsset(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:update-asset');
            const field = text(input.field);
            if (!ASSET_FIELDS.has(field)) {
                fail('VALIDATION_FAILED', 'Campo patrimonial não permitido.', 'inventory:update-asset', { field });
            }
            return this.dataService.execute({
                name: 'inventory:update-asset',
                changedEntities: ['assets'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:update-asset');
                    asset[field] = input.value;
                    return { asset: cloneValue(asset) };
                }
            });
        }

        async forward(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:forward');
            const persistence = {};
            return this.dataService.execute({
                name: 'inventory:forward',
                changedEntities: ['assets', 'administrativeLogs'],
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
                    const log = this.appendSchoolLog(
                        school.id,
                        'Capital Encaminhado',
                        `Aquisição ${asset.item} da escola ${school.denominação || ''} encaminhada ao inventariador com NF ${asset.notaFiscal} no processo ${school.processoInventario}.`
                    );
                    persistence.logId = text(log?.id);
                    return { asset: cloneValue(asset) };
                },
                persist: context => this.persistAsset(context, persistence)
            });
        }

        async inventory(input = {}) {
            const profile = normalizeProfile(input.profile);
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

