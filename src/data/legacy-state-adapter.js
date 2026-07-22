(function installLegacyStateAdapter(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const snapshotTools = typeof module !== 'undefined' && module.exports
        ? require('./snapshot-tools.js')
        : root.RadarSnapshotTools;
    const api = factory(contract, snapshotTools);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarLegacyStateAdapter = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createLegacyStateAdapterApi(contract, snapshotTools) {
    'use strict';

    if (!contract || !snapshotTools) {
        throw new Error('Contrato de repositório e ferramentas de snapshot são obrigatórios.');
    }

    const {
        RADAR_ENTITIES,
        RepositoryError,
        cloneValue
    } = contract;

    const LEGACY_STORAGE_MAP = Object.freeze({
        config: { key: 'radar_pdde_config', entity: 'appConfig', fallback: {} },
        programs: { key: 'radar_pdde_programas', entity: 'programs', fallback: [] },
        controllers: { key: 'radar_pdde_controladores', entity: 'controllers', fallback: [] },
        inventoryTeamMembers: { key: 'radar_pdde_equipe_inventario', entity: 'inventoryTeamMembers', fallback: [] },
        schools: { key: 'radar_pdde_escolas', entity: 'schools', fallback: [] },
        verifications: { key: 'radar_pdde_verificacoes', entity: 'verifications', fallback: {} },
        pendencies: { key: 'radar_pdde_pendencias', entity: 'pendencies', fallback: [] },
        contacts: { key: 'radar_pdde_contatos', entity: 'pendencyContacts', fallback: [] },
        assets: { key: 'radar_pdde_bens', entity: 'assets', fallback: [] },
        registeredInvoices: { key: 'radar_pdde_notas_registradas', entity: 'registeredInvoices', fallback: [] },
        logs: { key: 'radar_pdde_logs', entity: 'administrativeLogs', fallback: [] }
    });

    const PENDENCY_STATUSES = new Set([
        'Aberta',
        'Aguardando reanálise',
        'Resolvida',
        'Cancelada'
    ]);
    const ASSET_STATUSES = new Set([
        'Não encaminhada',
        'Encaminhada',
        'Inventariada'
    ]);
    const EXPENSE_TYPES = new Set(['consumo', 'permanente', 'servico']);
    const MONTH_LABELS = Object.freeze([
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function array(value) {
        return Array.isArray(value) ? cloneValue(value) : [];
    }

    function object(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? cloneValue(value)
            : {};
    }

    function verificationPayload(verification) {
        const mappedKeys = new Set([
            'bonificacao',
            'bonification',
            'analise',
            'analysis',
            'resultadoBonif',
            'bonus_result',
            'payload'
        ]);
        const source = object(verification);
        const payload = object(source.payload);
        Object.entries(source).forEach(([key, value]) => {
            if (!mappedKeys.has(key)) payload[key] = cloneValue(value);
        });
        return payload;
    }

    function numeric(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        const normalized = text(value)
            .replace(/R\$/gi, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function normalizeTimestamp(value) {
        const normalized = text(value);
        if (!normalized) return null;
        const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(normalized)
            ? `${normalized}T00:00:00.000Z`
            : normalized);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    function normalizeDate(value) {
        const timestamp = normalizeTimestamp(value);
        return timestamp ? timestamp.slice(0, 10) : null;
    }

    function detailsJson(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return cloneValue(value);
        }
        const normalized = text(value);
        return normalized ? { text: normalized } : {};
    }

    function readJson(storage, descriptor) {
        const raw = storage.getItem(descriptor.key);
        if (raw == null || raw === '') return cloneValue(descriptor.fallback);
        try {
            return JSON.parse(raw);
        } catch (error) {
            throw new RepositoryError(
                'LEGACY_DESERIALIZATION_FAILED',
                `Não foi possível interpretar ${descriptor.key}.`,
                {
                    entity: descriptor.entity,
                    operation: 'readLegacyState',
                    cause: error,
                    details: { storageKey: descriptor.key }
                }
            );
        }
    }

    function readLegacyState(storage) {
        if (!storage || typeof storage.getItem !== 'function') {
            throw new RepositoryError(
                'INVALID_STORAGE',
                'Armazenamento local válido é obrigatório para exportar o estado legado.',
                { operation: 'readLegacyState' }
            );
        }

        const state = {};
        Object.entries(LEGACY_STORAGE_MAP).forEach(([name, descriptor]) => {
            state[name] = readJson(storage, descriptor);
        });
        state.dataVersion = text(storage.getItem('radar_pdde_data_version'));
        return state;
    }

    function createEmptyEntities() {
        return RADAR_ENTITIES.reduce((entities, entity) => {
            entities[entity] = [];
            return entities;
        }, {});
    }

    function deterministicId(prefix, parts) {
        return [prefix, ...parts.map(part => text(part)).filter(Boolean)].join('::');
    }

    function parseVerificationContext(key) {
        const match = text(key).match(/^(\d{4}-(?:0[1-9]|1[0-2]))_(.+)$/);
        if (!match) return null;
        return { competenceId: match[1], programId: match[2] };
    }

    function collectCompetenceIds(state) {
        const ids = new Set();
        const add = value => {
            const normalized = text(value);
            if (/^\d{4}-(0[1-9]|1[0-2])$/.test(normalized)) ids.add(normalized);
        };
        const addExercise = value => {
            const normalized = text(value);
            if (!/^\d{4}$/.test(normalized)) return;
            for (let month = 1; month <= 12; month += 1) {
                add(`${normalized}-${String(month).padStart(2, '0')}`);
            }
        };

        array(state.config?.exercicios).forEach(addExercise);
        add(state.config?.competenciaFechamento);
        array(state.schools).forEach(school => add(school.competenciaInicial));
        array(state.pendencies).forEach(pendency => add(pendency.competenciaOrigem || pendency.competencia));
        array(state.assets).forEach(asset => add(asset.competencia || asset.competenciaKey));
        array(state.registeredInvoices).forEach(invoice => add(invoice.competencia || invoice.competenciaKey));
        Object.values(object(state.verifications)).forEach(contexts => {
            Object.keys(object(contexts)).forEach(key => {
                const context = parseVerificationContext(key);
                if (context) add(context.competenceId);
            });
        });

        return [...ids].sort();
    }

    function competenceRow(id) {
        const [year, month] = id.split('-').map(Number);
        const startsOn = `${id}-01`;
        const endsOn = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
        const nextMonth = new Date(Date.UTC(year, month, 15));
        return {
            id,
            label: `${MONTH_LABELS[month - 1]} ${year}`,
            exercise: year,
            starts_on: startsOn,
            ends_on: endsOn,
            bonus_deadline: nextMonth.toISOString().slice(0, 10),
            closed_at: null
        };
    }

    function normalizeExpenseType(record) {
        const candidate = text(record.expense_type || record.tipoGasto || record.tipo).toLowerCase();
        if (candidate === 'serviço') return 'servico';
        return EXPENSE_TYPES.has(candidate) ? candidate : '';
    }

    function transformLegacyState(state = {}) {
        const entities = createEmptyEntities();
        const warnings = [];
        const rejected = [];

        const reject = (entity, index, reason, record) => {
            rejected.push({ entity, index, reason, record: cloneValue(record) });
            warnings.push(`${entity}[${index}]: ${reason}`);
        };

        const config = object(state.config);
        const extendedDeadline = normalizeDate(config.prazoBonificacaoProrrogado);
        entities.appConfig.push({
            id: 'global',
            exercises: array(config.exercicios),
            closing_competence: text(config.competenciaFechamento) || null,
            bonus_deadline_extended: extendedDeadline,
            settings: {
                prazoBonificacaoProrrogado: Object.prototype.hasOwnProperty.call(config, 'prazoBonificacaoProrrogado')
                    ? cloneValue(config.prazoBonificacaoProrrogado)
                    : false
            },
            ...(Number.isInteger(config.rowVersion || config.row_version)
                ? { row_version: config.rowVersion || config.row_version }
                : {})
        });

        entities.programs = array(state.programs).flatMap((program, index) => {
            const id = text(program?.id);
            if (!id) {
                reject('programs', index, 'Programa sem id.', program);
                return [];
            }
            return [{
                id,
                name: text(program.name) || id,
                description: text(program.description || program.desc),
                active: program.active !== false,
                ...(Number.isInteger(program.rowVersion || program.row_version)
                    ? { row_version: program.rowVersion || program.row_version }
                    : {})
            }];
        });

        entities.controllers = array(state.controllers).flatMap((controller, index) => {
            const id = text(controller?.id);
            if (!id) {
                reject('controllers', index, 'Controlador sem id.', controller);
                return [];
            }
            return [{
                id,
                name: text(controller.name) || id,
                email: text(controller.email),
                active: controller.active !== false
            }];
        });

        entities.inventoryTeamMembers = array(state.inventoryTeamMembers).flatMap((member, index) => {
            const id = text(member?.id);
            if (!id) {
                reject('inventoryTeamMembers', index, 'Integrante de inventário sem id.', member);
                return [];
            }
            return [{
                id,
                name: text(member.name) || id,
                email: text(member.email),
                active: member.active !== false
            }];
        });

        entities.competences = collectCompetenceIds(state).map(competenceRow);

        entities.schools = array(state.schools).flatMap((school, index) => {
            const id = text(school?.id || school?.designação || school?.designacao);
            if (!id) {
                reject('schools', index, 'Escola sem id ou designação.', school);
                return [];
            }
            const designation = text(school.designação || school.designacao) || id;
            return [{
                id,
                designation,
                denomination: text(school.denominação || school.denominacao),
                phone: text(school.telefone),
                institutional_mobile: text(school.telefoneCelularInstitucional),
                email: text(school.email),
                director_name: text(school.diretor),
                director_phone: text(school.telefoneDiretor),
                deputy_director_name: text(school.diretorAdjunto),
                deputy_director_phone: text(school.telefoneDiretorAdjunto),
                inep: text(school.inep),
                cnpj: text(school.cnpj),
                cre: text(school.cre),
                ra: text(school.ra),
                sici: text(school.sici),
                controller_id: text(school.controladorId) || null,
                inventory_process: text(school.processoInventario),
                initial_competence: text(school.competenciaInicial) || null,
                active: school.active !== false,
                ...(Number.isInteger(school.rowVersion || school.row_version)
                    ? { row_version: school.rowVersion || school.row_version }
                    : {})
            }];
        });

        entities.schoolPrograms = array(state.schools).flatMap(school => {
            const schoolId = text(school?.id || school?.designação || school?.designacao);
            if (!schoolId) return [];
            return array(school.programasIds).map(programId => ({
                id: deterministicId(schoolId, [programId]),
                school_id: schoolId,
                program_id: text(programId),
                active: true,
                starts_on: null,
                ends_on: null
            }));
        }).filter(record => record.program_id);

        Object.entries(object(state.verifications)).forEach(([schoolId, contexts]) => {
            Object.entries(object(contexts)).forEach(([key, value]) => {
                const context = parseVerificationContext(key);
                if (!context) {
                    reject('verifications', key, 'Chave de verificação sem competência e programa reconhecíveis.', value);
                    return;
                }
                const verification = object(value);
                entities.verifications.push({
                    id: deterministicId(schoolId, [context.competenceId, context.programId]),
                    school_id: text(schoolId),
                    competence_id: context.competenceId,
                    program_id: context.programId,
                    bonification: object(verification.bonificacao || verification.bonification),
                    analysis: object(verification.analise || verification.analysis),
                    bonus_result: text(verification.resultadoBonif || verification.bonus_result) || null,
                    payload: verificationPayload(verification),
                    ...(Number.isInteger(verification.rowVersion || verification.row_version)
                        ? { row_version: verification.rowVersion || verification.row_version }
                        : {})
                });
            });
        });

        array(state.pendencies).forEach((pendency, index) => {
            const id = text(pendency?.id);
            const schoolId = text(pendency?.escolaId || pendency?.school_id);
            const competence = text(pendency?.competenciaOrigem || pendency?.competencia || pendency?.competence_origin);
            const status = text(pendency?.status);
            if (!id || !schoolId || !competence || !PENDENCY_STATUSES.has(status)) {
                reject('pendencies', index, 'Pendência sem id, escola, competência ou status canônico.', pendency);
                return;
            }

            const cancellationAt = normalizeTimestamp(pendency.cancelamento?.dataHora || pendency.canceled_at);
            entities.pendencies.push({
                id,
                school_id: schoolId,
                competence_origin: competence,
                program_id: text(pendency.programaId || pendency.program_id) || null,
                document_key: text(pendency.documentoKey || pendency.document_key || pendency.item),
                status,
                responsible_area: text(pendency.responsavel || pendency.responsible_area),
                next_actor: text(pendency.responsavel || pendency.next_actor),
                reason: text(pendency.motivo || pendency.reason),
                notes: text(pendency.observacao || pendency.notes),
                opened_at: normalizeTimestamp(pendency.dataAbertura || pendency.opened_at) || '1970-01-01T00:00:00.000Z',
                resolved_at: normalizeTimestamp(pendency.dataResolucao || pendency.resolved_at),
                canceled_at: cancellationAt,
                payload: cloneValue(pendency)
            });

            array(pendency.tentativas).forEach((attempt, attemptIndex) => {
                const attemptId = text(attempt?.id)
                    || deterministicId(id, ['attempt', attempt.numero || attemptIndex + 1]);
                if (!text(attempt?.id)) {
                    warnings.push(`pendencyAttempts[${id}:${attemptIndex}]: id determinístico criado.`);
                }
                entities.pendencyAttempts.push({
                    id: attemptId,
                    pendency_id: id,
                    attempt_number: Number.isInteger(attempt.numero) && attempt.numero > 0
                        ? attempt.numero
                        : attemptIndex + 1,
                    submitted_at: normalizeTimestamp(attempt.dataRegistro || attempt.dataDisponibilizacao)
                        || '1970-01-01T00:00:00.000Z',
                    analyzed_at: normalizeTimestamp(attempt.dataAnalise),
                    result: text(attempt.resultado) || null,
                    observation: text(attempt.observacao),
                    drive_url: text(attempt.link),
                    errors: array(attempt.errosEncontrados),
                    payload: cloneValue(attempt)
                });
            });
        });

        entities.pendencyContacts = array(state.contacts).flatMap((contact, index) => {
            const schoolId = text(contact?.escolaId || contact?.school_id);
            if (!schoolId) {
                reject('pendencyContacts', index, 'Contato sem escola.', contact);
                return [];
            }
            const id = text(contact.id) || deterministicId('contact', [schoolId, contact.dataAtendimento || contact.data, index]);
            if (!text(contact.id)) warnings.push(`pendencyContacts[${index}]: id determinístico criado.`);
            return [{
                id,
                school_id: schoolId,
                pendency_id: text(contact.pendenciaId || contact.pendency_id) || null,
                contact_type: text(contact.tipo || contact.contact_type),
                contact_date: normalizeDate(contact.dataAtendimento || contact.data || contact.contact_date)
                    || '1970-01-01',
                description: text(contact.descricao || contact.description),
                official_charge: contact.cobrancaOficial === true
                    || contact.cobrancaEnvioRegistro === true
                    || contact.official_charge === true,
                payload: cloneValue(contact)
            }];
        });

        entities.assets = array(state.assets).flatMap((asset, index) => {
            const id = text(asset?.id);
            const schoolId = text(asset?.escolaId || asset?.school_id);
            const expenseType = normalizeExpenseType(asset || {});
            const status = text(asset?.status);
            if (!id || !schoolId || !expenseType || !ASSET_STATUSES.has(status)) {
                reject('assets', index, 'Bem sem id, escola, tipo de gasto ou status canônico.', asset);
                return [];
            }
            return [{
                id,
                school_id: schoolId,
                competence_id: text(asset.competencia || asset.competenciaKey || asset.competence_id) || null,
                description: text(asset.descricao || asset.description || asset.item),
                expense_type: expenseType,
                invoice_number: text(asset.notaFiscal || asset.numeroNota || asset.invoice_number),
                amount: numeric(asset.valor || asset.amount),
                status,
                inventory_process: text(asset.processoInventario || asset.inventory_process),
                notes: text(asset.observacoes || asset.observacao || asset.notes),
                inventoried_by_member_id: text(asset.inventariadorId || asset.inventoried_by_member_id) || null,
                inventoried_at: normalizeTimestamp(asset.dataInventariacao || asset.inventoried_at),
                payload: cloneValue(asset),
                ...(Number.isInteger(asset.rowVersion || asset.row_version)
                    ? { row_version: asset.rowVersion || asset.row_version }
                    : {})
            }];
        });

        entities.registeredInvoices = array(state.registeredInvoices).flatMap((invoice, index) => {
            const id = text(invoice?.id);
            const schoolId = text(invoice?.escolaId || invoice?.school_id);
            const expenseType = normalizeExpenseType(invoice || {});
            if (!id || !schoolId || !expenseType) {
                reject('registeredInvoices', index, 'Nota sem id, escola ou tipo de gasto canônico.', invoice);
                return [];
            }
            return [{
                id,
                school_id: schoolId,
                competence_id: text(invoice.competencia || invoice.competenciaKey || invoice.competence_id) || null,
                description: text(invoice.descricao || invoice.description),
                expense_type: expenseType,
                invoice_number: text(invoice.numero || invoice.notaFiscal || invoice.invoice_number),
                amount: numeric(invoice.valor || invoice.amount),
                payload: cloneValue(invoice),
                ...(Number.isInteger(invoice.rowVersion || invoice.row_version)
                    ? { row_version: invoice.rowVersion || invoice.row_version }
                    : {})
            }];
        });

        entities.administrativeLogs = array(state.logs).flatMap((log, index) => {
            const id = text(log?.id) || deterministicId('log', [log?.dataHora || log?.event_at, index]);
            if (!text(log?.id)) warnings.push(`administrativeLogs[${index}]: id determinístico criado.`);
            return [{
                id,
                school_id: text(log?.escolaId || log?.school_id) || null,
                actor_user_id: null,
                user_identifier: text(log?.usuario || log?.user_identifier),
                profile_name: text(log?.perfil || log?.profile_name),
                action: text(log?.acao || log?.action) || 'Registro legado',
                details: detailsJson(log?.detalhes || log?.details),
                event_at: normalizeTimestamp(log?.dataHora || log?.event_at)
                    || '1970-01-01T00:00:00.000Z'
            }];
        });

        Object.keys(entities).forEach(entity => {
            entities[entity] = entities[entity]
                .slice()
                .sort((left, right) => text(left.id).localeCompare(text(right.id), 'pt-BR'));
        });

        return { entities, warnings, rejected };
    }

    function exportLegacySnapshot(storage, options = {}) {
        const state = readLegacyState(storage);
        const transformed = transformLegacyState(state);
        const snapshot = snapshotTools.createSnapshot(transformed.entities, options);
        const validation = snapshotTools.validateSnapshot(snapshot);
        if (!validation.ok) {
            throw new RepositoryError(
                'LEGACY_SNAPSHOT_INVALID',
                `Snapshot legado inválido: ${validation.errors.join(' ')}`,
                {
                    operation: 'exportLegacySnapshot',
                    details: { errors: validation.errors }
                }
            );
        }
        return {
            snapshot,
            warnings: transformed.warnings,
            rejected: transformed.rejected,
            sourceDataVersion: state.dataVersion
        };
    }

    return Object.freeze({
        LEGACY_STORAGE_MAP,
        readLegacyState,
        transformLegacyState,
        exportLegacySnapshot,
        parseVerificationContext
    });
}));
