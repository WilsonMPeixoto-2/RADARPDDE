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
            return this.dataService.execute({
                name: 'inventory:forward',
                changedEntities: ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:forward');
                    const school = this.findSchool(state, asset.escolaId, 'inventory:forward');
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
                    this.appendLog(
                        'Capital Encaminhado',
                        `Aquisição ${asset.item} da escola ${school.denominação || ''} encaminhada ao inventariador com NF ${asset.notaFiscal} no processo ${school.processoInventario}.`
                    );
                    return { asset: cloneValue(asset) };
                }
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
            return this.dataService.execute({
                name: 'inventory:complete',
                changedEntities: ['assets', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const asset = this.findAsset(state, input.assetId, 'inventory:complete');
                    const school = this.findSchool(state, asset.escolaId, 'inventory:complete');
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
                    this.appendLog(
                        'Inventariação Concluída',
                        `Bem patrimonial ${asset.item} da escola ${school.denominação || ''} foi registrado e inventariado por ${responsible}.`
                    );
                    return { asset: cloneValue(asset) };
                }
            });
        }

        async createAsset(input = {}) {
            this.assertOperationalProfile(input.profile, 'inventory:create');
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
                    this.appendLog(
                        'Bem Cadastrado',
                        `Gasto de capital de R$ ${amount} registrado para ${school.denominação || ''}: ${asset.item}.`
                    );
                    return { asset: cloneValue(asset) };
                }
            });
        }
    }

    return Object.freeze({ InventoryService });
}));

