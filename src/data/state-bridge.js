(function installRadarStateBridge(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const snapshotTools = typeof module !== 'undefined' && module.exports
        ? require('./snapshot-tools.js')
        : root.RadarSnapshotTools;
    const legacyAdapter = typeof module !== 'undefined' && module.exports
        ? require('./legacy-state-adapter.js')
        : root.RadarLegacyStateAdapter;
    const api = factory(contract, snapshotTools, legacyAdapter);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarStateBridge = Object.freeze(api);
        // A API aprimorada substitui a versão unidirecional sem ativar qualquer conexão.
        root.RadarLegacyStateAdapter = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarStateBridge(
    contract,
    snapshotTools,
    legacyAdapter
) {
    'use strict';

    if (!contract || !snapshotTools || !legacyAdapter) {
        throw new Error('Contrato, snapshots e adaptador legado são obrigatórios para a ponte de estado.');
    }

    const { RepositoryError, cloneValue } = contract;
    const LEGACY_STORAGE_MAP = legacyAdapter.LEGACY_STORAGE_MAP;

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

    function timestamp(value) {
        const normalized = text(value);
        if (!normalized) return null;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    function dateOnly(value) {
        const normalized = timestamp(value);
        return normalized ? normalized.slice(0, 10) : null;
    }

    function contextFromValue(value) {
        const raw = text(value);
        const context = legacyAdapter.parseVerificationContext(raw);
        if (context) return { key: raw, ...context };
        const match = raw.match(/^(\d{4}-(?:0[1-9]|1[0-2]))(?:_(.+))?$/);
        if (!match) return null;
        return {
            key: raw,
            competenceId: match[1],
            programId: text(match[2]) || null
        };
    }

    function canonicalCompetence(record) {
        const id = text(record?.id || record?.key);
        const match = id.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const nextMonth = new Date(Date.UTC(year, month, 15));
        return {
            id,
            label: text(record.label) || id,
            exercise: Number(record.exercise) || year,
            starts_on: dateOnly(record.starts_on) || `${id}-01`,
            ends_on: dateOnly(record.ends_on)
                || new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
            bonus_deadline: dateOnly(record.bonus_deadline || record.bonifPrazo)
                || nextMonth.toISOString().slice(0, 10),
            closed_at: timestamp(record.closed_at)
        };
    }

    function enhanceLegacyTransformation(state = {}) {
        const result = legacyAdapter.transformLegacyState(state);
        const entities = result.entities;

        const configuredCompetences = array(state.config?.competencias)
            .map(canonicalCompetence)
            .filter(Boolean);
        if (configuredCompetences.length > 0) {
            const byId = new Map(entities.competences.map(item => [item.id, item]));
            configuredCompetences.forEach(item => byId.set(item.id, item));
            entities.competences = [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
        }

        entities.pendencyContacts = entities.pendencyContacts.map(contact => {
            const payload = object(contact.payload);
            return {
                ...contact,
                description: text(contact.description || payload.descricao || payload.desc || payload.description),
                created_by: payload.createdBy || payload.created_by || contact.created_by || null
            };
        });

        entities.registeredInvoices = entities.registeredInvoices.map(invoice => {
            const payload = object(invoice.payload);
            const context = contextFromValue(
                payload.compKey
                || payload.contextKey
                || payload.source_context_key
                || invoice.source_context_key
                || invoice.competence_id
            );
            const programId = text(
                invoice.program_id
                || payload.programaId
                || payload.program_id
                || context?.programId
            ) || null;
            const competenceId = text(invoice.competence_id || context?.competenceId) || null;
            const sourceContextKey = text(invoice.source_context_key || context?.key)
                || (competenceId && programId ? `${competenceId}_${programId}` : competenceId || '');
            return {
                ...invoice,
                competence_id: competenceId,
                program_id: programId,
                verification_id: text(invoice.verification_id)
                    || (competenceId && programId
                        ? `${invoice.school_id}::${competenceId}::${programId}`
                        : null),
                source_context_key: sourceContextKey,
                description: text(invoice.description || payload.descricao || payload.desc || payload.description),
                linked_asset_id: text(invoice.linked_asset_id || payload.bemId || payload.linked_asset_id) || null,
                registered_at: timestamp(invoice.registered_at || payload.dataRegistro || payload.registered_at)
            };
        });

        entities.assets = entities.assets.map(asset => {
            const payload = object(asset.payload);
            return {
                ...asset,
                description: text(asset.description || payload.descricao || payload.item || payload.description),
                inventoried_by_member_id: text(
                    asset.inventoried_by_member_id
                    || payload.inventariadorId
                    || payload.responsavelInventario
                ) || null,
                inventoried_at: timestamp(
                    asset.inventoried_at
                    || payload.dataInventariacao
                    || payload.inventoried_at
                )
            };
        });

        entities.pendencies = entities.pendencies.map(pendency => {
            const payload = object(pendency.payload);
            return {
                ...pendency,
                next_actor: text(
                    payload.proximoAtor
                    || payload.nextActor
                    || payload.next_actor
                    || pendency.next_actor
                    || pendency.responsible_area
                )
            };
        });

        return result;
    }

    function exportLegacySnapshot(storage, options = {}) {
        const state = legacyAdapter.readLegacyState(storage);
        const transformed = enhanceLegacyTransformation(state);
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

    function detailsToLegacy(value) {
        const details = object(value);
        if (typeof value === 'string') return value;
        if (typeof details.text === 'string') return details.text;
        return Object.keys(details).length > 0 ? JSON.stringify(details) : '';
    }

    function competenceToLegacy(record) {
        const competence = canonicalCompetence(record);
        if (!competence) return null;
        return {
            key: competence.id,
            label: competence.label,
            bonifPrazo: competence.bonus_deadline,
            startsOn: competence.starts_on,
            endsOn: competence.ends_on,
            closedAt: competence.closed_at
        };
    }

    function canonicalEntitiesToLegacyState(entities = {}, options = {}) {
        const source = object(entities);
        const appConfig = array(source.appConfig).find(item => item.id === 'global')
            || array(source.appConfig)[0]
            || {};
        const competences = array(source.competences)
            .map(competenceToLegacy)
            .filter(Boolean)
            .sort((left, right) => left.key.localeCompare(right.key));
        const derivedExercises = [...new Set(competences.map(item => item.key.slice(0, 4)))].sort();
        const settings = object(appConfig.settings);

        const programLinksBySchool = new Map();
        array(source.schoolPrograms).forEach(link => {
            if (!programLinksBySchool.has(link.school_id)) programLinksBySchool.set(link.school_id, []);
            programLinksBySchool.get(link.school_id).push(link);
        });

        const attemptsByPendency = new Map();
        array(source.pendencyAttempts).forEach(attempt => {
            if (!attemptsByPendency.has(attempt.pendency_id)) attemptsByPendency.set(attempt.pendency_id, []);
            attemptsByPendency.get(attempt.pendency_id).push(attempt);
        });

        const state = {
            config: {
                ...settings,
                exercicios: array(appConfig.exercises).length > 0
                    ? array(appConfig.exercises).map(String).sort()
                    : derivedExercises,
                competenciaFechamento: text(appConfig.closing_competence) || null,
                prazoBonificacaoProrrogado: Object.prototype.hasOwnProperty.call(
                    settings,
                    'prazoBonificacaoProrrogado'
                )
                    ? cloneValue(settings.prazoBonificacaoProrrogado)
                    : (appConfig.bonus_deadline_extended || false),
                competencias: competences,
                ...(Number.isInteger(appConfig.row_version)
                    ? { rowVersion: appConfig.row_version }
                    : {})
            },
            programs: array(source.programs).map(program => ({
                id: program.id,
                name: program.name,
                desc: program.description || '',
                active: program.active !== false,
                ...(Number.isInteger(program.row_version) ? { rowVersion: program.row_version } : {})
            })),
            controllers: array(source.controllers).map(controller => ({
                id: controller.id,
                name: controller.name,
                email: controller.email || '',
                active: controller.active !== false,
                ...(Number.isInteger(controller.row_version) ? { rowVersion: controller.row_version } : {})
            })),
            inventoryTeamMembers: array(source.inventoryTeamMembers).map(member => ({
                id: member.id,
                name: member.name,
                email: member.email || '',
                active: member.active !== false,
                ...(Number.isInteger(member.row_version) ? { rowVersion: member.row_version } : {})
            })),
            schools: array(source.schools).map(school => {
                const links = (programLinksBySchool.get(school.id) || [])
                    .slice()
                    .sort((left, right) => text(left.program_id).localeCompare(text(right.program_id)));
                return {
                    id: school.id,
                    designação: school.designation || school.id,
                    denominação: school.denomination || '',
                    telefone: school.phone || '',
                    telefoneCelularInstitucional: school.institutional_mobile || '',
                    email: school.email || '',
                    diretor: school.director_name || '',
                    telefoneDiretor: school.director_phone || '',
                    diretorAdjunto: school.deputy_director_name || '',
                    telefoneDiretorAdjunto: school.deputy_director_phone || '',
                    inep: school.inep || '',
                    cnpj: school.cnpj || '',
                    cre: school.cre || '',
                    ra: school.ra || '',
                    sici: school.sici || '',
                    controladorId: school.controller_id || null,
                    processoInventario: school.inventory_process || '',
                    programasIds: links.filter(link => link.active !== false).map(link => link.program_id),
                    programasVinculos: links.map(link => ({
                        id: link.id,
                        programaId: link.program_id,
                        ativo: link.active !== false,
                        inicio: link.starts_on || null,
                        fim: link.ends_on || null,
                        ...(Number.isInteger(link.row_version) ? { rowVersion: link.row_version } : {})
                    })),
                    competenciaInicial: school.initial_competence || null,
                    active: school.active !== false,
                    ...(Number.isInteger(school.row_version) ? { rowVersion: school.row_version } : {})
                };
            }),
            verifications: {},
            pendencies: [],
            contacts: [],
            assets: [],
            registeredInvoices: [],
            logs: [],
            dataVersion: text(options.dataVersion || options.sourceDataVersion || 'supabase-bridge-v1'),
            pendencySchemaVersion: text(options.pendencySchemaVersion || '')
        };

        array(source.verifications).forEach(verification => {
            if (!state.verifications[verification.school_id]) {
                state.verifications[verification.school_id] = {};
            }
            const key = `${verification.competence_id}_${verification.program_id}`;
            state.verifications[verification.school_id][key] = {
                ...object(verification.payload),
                bonificacao: object(verification.bonification),
                analise: object(verification.analysis),
                resultadoBonif: verification.bonus_result || '',
                ...(Number.isInteger(verification.row_version)
                    ? { rowVersion: verification.row_version }
                    : {})
            };
        });

        state.pendencies = array(source.pendencies).map(pendency => {
            const payload = object(pendency.payload);
            const attempts = (attemptsByPendency.get(pendency.id) || [])
                .slice()
                .sort((left, right) => Number(left.attempt_number) - Number(right.attempt_number))
                .map(attempt => ({
                    ...object(attempt.payload),
                    id: attempt.id,
                    numero: attempt.attempt_number,
                    dataRegistro: attempt.submitted_at,
                    dataDisponibilizacao: dateOnly(attempt.submitted_at),
                    dataAnalise: attempt.analyzed_at,
                    resultado: attempt.result,
                    observacao: attempt.observation || '',
                    link: attempt.drive_url || '',
                    errosEncontrados: array(attempt.errors),
                    createdBy: attempt.created_by || null,
                    ...(Number.isInteger(attempt.row_version) ? { rowVersion: attempt.row_version } : {})
                }));
            return {
                ...payload,
                id: pendency.id,
                escolaId: pendency.school_id,
                competenciaOrigem: pendency.competence_origin,
                programaId: pendency.program_id || null,
                documentoKey: pendency.document_key,
                status: pendency.status,
                responsavel: pendency.responsible_area || '',
                proximoAtor: pendency.next_actor || '',
                motivo: pendency.reason || '',
                observacao: pendency.notes || '',
                dataAbertura: pendency.opened_at,
                dataResolucao: pendency.resolved_at,
                cancelamento: pendency.canceled_at
                    ? { ...(object(payload.cancelamento)), dataHora: pendency.canceled_at }
                    : (payload.cancelamento || null),
                tentativas: attempts,
                ...(Number.isInteger(pendency.row_version) ? { rowVersion: pendency.row_version } : {})
            };
        });

        state.contacts = array(source.pendencyContacts).map(contact => ({
            ...object(contact.payload),
            id: contact.id,
            escolaId: contact.school_id,
            pendenciaId: contact.pendency_id || null,
            tipo: contact.contact_type || '',
            dataAtendimento: contact.contact_date,
            desc: contact.description || '',
            descricao: contact.description || '',
            cobrancaOficial: contact.official_charge === true,
            createdBy: contact.created_by || null,
            ...(Number.isInteger(contact.row_version) ? { rowVersion: contact.row_version } : {})
        }));

        state.assets = array(source.assets).map(asset => ({
            ...object(asset.payload),
            id: asset.id,
            escolaId: asset.school_id,
            competencia: asset.competence_id || null,
            item: asset.description || '',
            descricao: asset.description || '',
            tipo: asset.expense_type,
            notaFiscal: asset.invoice_number || '',
            valor: Number(asset.amount || 0),
            status: asset.status,
            processoInventario: asset.inventory_process || '',
            observacoes: asset.notes || '',
            inventariadorId: asset.inventoried_by_member_id || null,
            dataInventariacao: asset.inventoried_at || null,
            ...(Number.isInteger(asset.row_version) ? { rowVersion: asset.row_version } : {})
        }));

        state.registeredInvoices = array(source.registeredInvoices).map(invoice => {
            const contextKey = text(invoice.source_context_key)
                || (invoice.competence_id && invoice.program_id
                    ? `${invoice.competence_id}_${invoice.program_id}`
                    : invoice.competence_id || '');
            return {
                ...object(invoice.payload),
                id: invoice.id,
                escolaId: invoice.school_id,
                compKey: contextKey,
                competencia: invoice.competence_id || null,
                programaId: invoice.program_id || null,
                desc: invoice.description || '',
                descricao: invoice.description || '',
                tipo: invoice.expense_type,
                numero: invoice.invoice_number,
                valor: Number(invoice.amount || 0),
                bemId: invoice.linked_asset_id || null,
                dataRegistro: invoice.registered_at || invoice.created_at || null,
                ...(Number.isInteger(invoice.row_version) ? { rowVersion: invoice.row_version } : {})
            };
        });

        state.logs = array(source.administrativeLogs).map(log => ({
            id: log.id,
            escolaId: log.school_id || null,
            actorUserId: log.actor_user_id || null,
            usuario: log.user_identifier || '',
            perfil: log.profile_name || '',
            acao: log.action || '',
            detalhes: detailsToLegacy(log.details),
            dataHora: log.event_at || log.created_at || null
        }));

        return state;
    }

    function assertStorage(storage) {
        if (!storage || typeof storage.setItem !== 'function') {
            throw new RepositoryError(
                'INVALID_STORAGE',
                'Armazenamento compatível com Storage é obrigatório.',
                { operation: 'restoreCanonicalSnapshotToLegacyStorage' }
            );
        }
    }

    function buildLegacyStorageWrites(state) {
        return Object.entries(LEGACY_STORAGE_MAP).map(([stateKey, descriptor]) => ({
            key: descriptor.key,
            value: JSON.stringify(state[stateKey] ?? cloneValue(descriptor.fallback))
        }));
    }

    function restoreCanonicalSnapshotToLegacyStorage(snapshot, storage, options = {}) {
        assertStorage(storage);
        const validation = snapshotTools.validateSnapshot(snapshot);
        if (!validation.ok) {
            throw new RepositoryError(
                'INVALID_SNAPSHOT',
                `Snapshot inválido: ${validation.errors.join(' ')}`,
                {
                    operation: 'restoreCanonicalSnapshotToLegacyStorage',
                    details: { errors: validation.errors }
                }
            );
        }

        const state = canonicalEntitiesToLegacyState(snapshot.entities, options);
        const writes = buildLegacyStorageWrites(state);
        if (options.dryRun !== true) {
            writes.forEach(write => storage.setItem(write.key, write.value));
            if (state.dataVersion) {
                storage.setItem('radar_pdde_data_version', state.dataVersion);
            }
            if (state.pendencySchemaVersion) {
                storage.setItem('radar_pdde_pendency_schema_version', state.pendencySchemaVersion);
            }
        }

        return {
            dryRun: options.dryRun === true,
            state,
            writes,
            dataVersion: state.dataVersion
        };
    }

    return Object.freeze({
        ...legacyAdapter,
        enhanceLegacyTransformation,
        transformLegacyState: enhanceLegacyTransformation,
        exportLegacySnapshot,
        canonicalEntitiesToLegacyState,
        restoreCanonicalSnapshotToLegacyStorage,
        buildLegacyStorageWrites,
        contextFromValue
    });
}));
