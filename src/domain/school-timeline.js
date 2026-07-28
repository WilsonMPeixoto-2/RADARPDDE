(function installSchoolTimeline(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarSchoolTimeline = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createSchoolTimelineApi() {
    'use strict';

    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function toIso(value) {
        const normalized = text(value);
        if (!normalized) return null;
        const parsed = new Date(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    function firstDate(...values) {
        for (const value of values) {
            const parsed = toIso(value);
            if (parsed) return parsed;
        }
        return null;
    }

    function normalizeProfile(value) {
        const profile = text(value).toLocaleLowerCase('pt-BR');
        if (profile === 'sme_management' || profile === 'sme (gestão)' || profile === 'gestão sme') return 'sme';
        if (profile === 'federal_assistant' || profile === 'assistente de verbas federais') return 'assistente';
        if (profile === 'inventory' || profile === 'equipe de inventário') return 'inventario';
        return profile;
    }

    function splitContext(value, explicitProgramId) {
        const raw = text(value);
        const explicit = text(explicitProgramId);
        if (explicit && raw.endsWith(`_${explicit}`)) {
            return { competenceKey: raw.slice(0, -(explicit.length + 1)), programId: explicit };
        }
        const match = /^(\d{4}-(?:0[1-9]|1[0-2]))(?:_(.+))?$/.exec(raw);
        return match
            ? { competenceKey: match[1], programId: text(match[2]) || explicit }
            : { competenceKey: raw, programId: explicit };
    }

    function actorName(record) {
        return text(
            record?.actorName
            || record?.actor_name
            || record?.usuario
            || record?.responsavel
            || record?.createdByName
            || record?.created_by_name
            || record?.updatedByName
            || record?.updated_by_name
            || record?.analisadoPorNome
            || record?.analyzed_by_name
            || record?.inventoriedByName
            || record?.inventoried_by_name
        ) || 'Não informado';
    }

    function createEvent(input = {}) {
        const occurredAt = toIso(input.occurredAt);
        if (!occurredAt) return null;
        const sourceEntity = text(input.sourceEntity) || 'unknown';
        const sourceId = text(input.sourceId) || 'unknown';
        const type = text(input.type) || 'event';
        const suffix = text(input.eventKey) || occurredAt;
        return Object.freeze({
            id: `${sourceEntity}:${sourceId}:${type}:${suffix}`,
            occurredAt,
            type,
            title: text(input.title) || 'Movimentação registrada',
            description: text(input.description),
            actor: text(input.actor) || 'Não informado',
            status: text(input.status) || null,
            competenceKey: text(input.competenceKey) || null,
            programId: text(input.programId) || null,
            pendencyId: text(input.pendencyId) || null,
            visibility: text(input.visibility) || 'all',
            sourceEntity,
            sourceId
        });
    }

    function eventAllowed(event, profile) {
        if (!event) return false;
        if (profile === 'sme' && event.visibility === 'technical') return false;
        if (profile === 'inventario' && event.visibility === 'control') return false;
        return true;
    }

    function matchesContext(recordSchoolId, recordCompetence, context) {
        if (text(recordSchoolId) !== context.schoolId) return false;
        const competence = text(recordCompetence);
        return !context.competenceKey || !competence || competence === context.competenceKey;
    }

    function programName(programsById, id) {
        const programId = text(id);
        const program = programsById.get(programId);
        return text(program?.name || program?.nome) || programId || 'Programa não informado';
    }

    function documentName(pendency) {
        const key = text(pendency?.documentoKey || pendency?.document_key);
        return DOCUMENT_LABELS[key] || text(pendency?.item) || key || 'Documento não informado';
    }

    function pushVerificationEvents(events, input, context, programsById) {
        const source = input.verifications || input.verificacoes || {};
        const entries = [];
        if (Array.isArray(source)) {
            source.forEach(record => entries.push({
                schoolId: text(record?.schoolId || record?.school_id),
                compKey: text(record?.compKey || record?.contextKey || record?.competence_id),
                programId: text(record?.programId || record?.program_id),
                record
            }));
        } else {
            Object.entries(source).forEach(([schoolId, byContext]) => {
                Object.entries(byContext || {}).forEach(([compKey, record]) => {
                    entries.push({ schoolId, compKey, programId: '', record });
                });
            });
        }

        entries.forEach(entry => {
            const split = splitContext(entry.compKey, entry.programId);
            if (!matchesContext(entry.schoolId, split.competenceKey, context)) return;
            const result = text(entry.record?.resultadoBonif || entry.record?.bonus_result);
            if (!result) return;
            const occurredAt = firstDate(
                entry.record?.consolidatedAt,
                entry.record?.consolidated_at,
                entry.record?.dataConsolidacao,
                entry.record?.updatedAt,
                entry.record?.updated_at
            );
            const event = createEvent({
                occurredAt,
                type: 'verification_consolidated',
                title: `Bonificação ${result.toUpperCase()}`,
                description: `${programName(programsById, split.programId)} consolidado como ${result.toUpperCase()}.`,
                actor: actorName(entry.record),
                status: result,
                competenceKey: split.competenceKey,
                programId: split.programId,
                visibility: 'all',
                sourceEntity: 'verifications',
                sourceId: `${entry.schoolId}:${entry.compKey}`,
                eventKey: 'consolidation'
            });
            if (event) events.push(event);
        });
    }

    function pushPendencyEvents(events, input, context, programsById, pendenciesById) {
        list(input.pendencies || input.pendencias).forEach(pendency => {
            const schoolId = text(pendency?.escolaId || pendency?.school_id);
            const competenceKey = text(
                pendency?.competenciaOrigem
                || pendency?.competencia
                || pendency?.competence_origin
                || pendency?.competence_id
            );
            if (!matchesContext(schoolId, competenceKey, context)) return;
            const pendencyId = text(pendency?.id);
            const programId = text(pendency?.programaId || pendency?.program_id);
            pendenciesById.set(pendencyId, { schoolId, competenceKey, programId, pendency });
            const item = documentName(pendency);
            const program = programName(programsById, programId);

            const opening = createEvent({
                occurredAt: pendency?.dataAbertura || pendency?.created_at,
                type: 'pendency_opened',
                title: `Pendência aberta — ${item}`,
                description: text(pendency?.observacao || pendency?.motivo) || `${program}: providência registrada.`,
                actor: actorName(pendency),
                status: 'Aberta',
                competenceKey,
                programId,
                pendencyId,
                visibility: 'all',
                sourceEntity: 'pendencies',
                sourceId: pendencyId,
                eventKey: 'opened'
            });
            if (opening) events.push(opening);

            list(pendency?.historico).forEach((history, index) => {
                const historyType = text(history?.tipo).toLocaleLowerCase('pt-BR');
                if (historyType === 'abertura' || historyType === 'aberta') return;
                const event = createEvent({
                    occurredAt: history?.dataHora || history?.created_at,
                    type: `pendency_history_${historyType || 'movement'}`,
                    title: text(history?.titulo) || 'Movimentação da pendência',
                    description: text(history?.detalhe || history?.detalhes),
                    actor: actorName(history),
                    status: text(history?.status) || text(pendency?.status),
                    competenceKey,
                    programId,
                    pendencyId,
                    visibility: historyType.includes('análise') || historyType.includes('analise')
                        ? 'technical'
                        : 'all',
                    sourceEntity: 'pendency_history',
                    sourceId: text(history?.id) || `${pendencyId}:${index}`
                });
                if (event) events.push(event);
            });

            list(pendency?.tentativas).forEach((attempt, index) => {
                const attemptId = text(attempt?.id) || `${pendencyId}:${index}`;
                const registered = createEvent({
                    occurredAt: attempt?.dataRegistro || attempt?.dataDisponibilizacao || attempt?.created_at,
                    type: 'pendency_submission_registered',
                    title: 'Novo envio registrado',
                    description: text(attempt?.observacao),
                    actor: actorName(attempt),
                    status: text(attempt?.status) || 'aguardando',
                    competenceKey,
                    programId,
                    pendencyId,
                    visibility: 'all',
                    sourceEntity: 'pendency_attempts',
                    sourceId: attemptId,
                    eventKey: 'registered'
                });
                if (registered) events.push(registered);

                if (attempt?.resultado || attempt?.dataAnalise || attempt?.analyzed_at) {
                    const reviewed = createEvent({
                        occurredAt: attempt?.dataAnalise || attempt?.analyzed_at,
                        type: 'pendency_attempt_reviewed',
                        title: 'Reanálise concluída',
                        description: text(attempt?.observacao),
                        actor: actorName(attempt),
                        status: text(attempt?.resultado),
                        competenceKey,
                        programId,
                        pendencyId,
                        visibility: 'all',
                        sourceEntity: 'pendency_attempts',
                        sourceId: attemptId,
                        eventKey: 'reviewed'
                    });
                    if (reviewed) events.push(reviewed);
                }
            });

            const resolved = createEvent({
                occurredAt: pendency?.dataResolucao || pendency?.resolved_at,
                type: 'pendency_resolved',
                title: `Pendência resolvida — ${item}`,
                description: text(pendency?.justificativaResolucao || pendency?.observacao),
                actor: actorName(pendency?.resolucao || pendency),
                status: 'Resolvida',
                competenceKey,
                programId,
                pendencyId,
                visibility: 'all',
                sourceEntity: 'pendencies',
                sourceId: pendencyId,
                eventKey: 'resolved'
            });
            if (resolved) events.push(resolved);

            const cancellation = pendency?.cancelamento || {};
            const cancelled = createEvent({
                occurredAt: cancellation?.dataHora || pendency?.cancelled_at,
                type: 'pendency_cancelled',
                title: `Pendência cancelada — ${item}`,
                description: text(cancellation?.justificativa),
                actor: actorName(cancellation),
                status: 'Cancelada',
                competenceKey,
                programId,
                pendencyId,
                visibility: 'all',
                sourceEntity: 'pendencies',
                sourceId: pendencyId,
                eventKey: 'cancelled'
            });
            if (cancelled) events.push(cancelled);
        });
    }

    function pushContactEvents(events, input, context, pendenciesById) {
        list(input.contacts || input.contatos).forEach(contact => {
            const pendencyId = text(contact?.pendenciaId || contact?.pendencyId || contact?.pendency_id);
            const linked = pendenciesById.get(pendencyId);
            const schoolId = text(contact?.escolaId || contact?.school_id) || linked?.schoolId || '';
            const competenceKey = text(contact?.competencia || contact?.competence_id) || linked?.competenceKey || '';
            if (!matchesContext(schoolId, competenceKey, context)) return;
            const event = createEvent({
                occurredAt: contact?.dataHora || contact?.data || contact?.serviceDate || contact?.created_at,
                type: 'pendency_contact',
                title: `Contato — ${text(contact?.tipo || contact?.channel) || 'atendimento'}`,
                description: text(contact?.descricao || contact?.description || contact?.observacao),
                actor: actorName(contact),
                status: null,
                competenceKey,
                programId: linked?.programId || text(contact?.programaId || contact?.program_id),
                pendencyId,
                visibility: 'all',
                sourceEntity: 'pendency_contacts',
                sourceId: text(contact?.id)
            });
            if (event) events.push(event);
        });
    }

    function pushInvoiceEvents(events, input, context) {
        list(input.invoices || input.registeredInvoices || input.notasRegistradas).forEach(invoice => {
            const schoolId = text(invoice?.escolaId || invoice?.school_id);
            const split = splitContext(
                invoice?.compKey || invoice?.source_context_key || invoice?.competence_id,
                invoice?.programaId || invoice?.program_id
            );
            if (!matchesContext(schoolId, split.competenceKey, context)) return;
            const event = createEvent({
                occurredAt: invoice?.dataRegistro || invoice?.registered_at || invoice?.created_at,
                type: 'invoice_registered',
                title: `Nota fiscal ${text(invoice?.numero || invoice?.invoice_number) || 'registrada'}`,
                description: text(invoice?.desc || invoice?.description),
                actor: actorName(invoice),
                status: text(invoice?.tipo || invoice?.expense_type),
                competenceKey: split.competenceKey,
                programId: split.programId,
                visibility: 'all',
                sourceEntity: 'registered_invoices',
                sourceId: text(invoice?.id)
            });
            if (event) events.push(event);
        });
    }

    function pushAssetEvents(events, input, context) {
        list(input.assets || input.bens).forEach(asset => {
            const schoolId = text(asset?.escolaId || asset?.school_id);
            const split = splitContext(
                asset?.compKey || asset?.source_context_key || asset?.competencia || asset?.competence_id,
                asset?.programaId || asset?.program_id
            );
            if (!matchesContext(schoolId, split.competenceKey, context)) return;
            const description = text(asset?.item || asset?.descricao || asset?.description) || 'Bem patrimonial';
            const registered = createEvent({
                occurredAt: asset?.dataRegistro || asset?.created_at,
                type: 'asset_registered',
                title: `Bem registrado — ${description}`,
                description,
                actor: actorName(asset),
                status: text(asset?.status),
                competenceKey: split.competenceKey,
                programId: split.programId,
                visibility: 'all',
                sourceEntity: 'assets',
                sourceId: text(asset?.id),
                eventKey: 'registered'
            });
            if (registered) events.push(registered);

            const inventoried = createEvent({
                occurredAt: asset?.dataInventariacao || asset?.inventoried_at,
                type: 'asset_inventoried',
                title: `Bem inventariado — ${description}`,
                description: text(asset?.observacoesInventario || asset?.inventory_notes),
                actor: text(asset?.responsavelInventario) || actorName(asset),
                status: 'Inventariado',
                competenceKey: split.competenceKey,
                programId: split.programId,
                visibility: 'all',
                sourceEntity: 'assets',
                sourceId: text(asset?.id),
                eventKey: 'inventoried'
            });
            if (inventoried) events.push(inventoried);
        });
    }

    function pushAdministrativeEvents(events, input, context) {
        list(input.logs || input.administrativeLogs).forEach(log => {
            const schoolId = text(log?.escolaId || log?.school_id);
            if (schoolId !== context.schoolId) return;
            const action = text(log?.acao || log?.action);
            const details = text(log?.detalhes || log?.details);
            const isTechnical = /an[aá]lise t[eé]cnica/i.test(action);
            const competenceMatch = details.match(/\b(\d{4}-(?:0[1-9]|1[0-2]))\b/);
            const competenceKey = text(log?.competencia || log?.competence_id)
                || text(competenceMatch?.[1]);
            if (context.competenceKey && competenceKey && competenceKey !== context.competenceKey) return;
            const event = createEvent({
                occurredAt: log?.dataHora || log?.created_at || log?.at,
                type: isTechnical ? 'technical_analysis_changed' : 'administrative_action',
                title: action || 'Ação administrativa',
                description: details,
                actor: actorName(log),
                status: text(log?.status),
                competenceKey,
                programId: text(log?.programaId || log?.program_id),
                pendencyId: text(log?.pendenciaId || log?.pendency_id),
                visibility: isTechnical ? 'technical' : 'all',
                sourceEntity: 'administrative_logs',
                sourceId: text(log?.id)
            });
            if (event) events.push(event);
        });
    }

    function deduplicate(events) {
        const byId = new Map();
        events.forEach(event => {
            if (!event || byId.has(event.id)) return;
            byId.set(event.id, event);
        });
        return [...byId.values()];
    }

    function sortEvents(events) {
        return [...events].sort((left, right) => {
            const timestampDifference = new Date(right.occurredAt).getTime()
                - new Date(left.occurredAt).getTime();
            if (timestampDifference !== 0) return timestampDifference;
            return left.id.localeCompare(right.id, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
    }

    function buildSchoolTimeline(input = {}) {
        const context = {
            schoolId: text(input.schoolId),
            competenceKey: text(input.competenceKey)
        };
        if (!context.schoolId) return Object.freeze([]);
        const profile = normalizeProfile(input.accessProfile);
        const programsById = new Map(list(input.programs || input.programas).map(program => [
            text(program?.id),
            program
        ]));
        const events = [];
        const pendenciesById = new Map();

        pushVerificationEvents(events, input, context, programsById);
        pushPendencyEvents(events, input, context, programsById, pendenciesById);
        pushContactEvents(events, input, context, pendenciesById);
        pushInvoiceEvents(events, input, context);
        pushAssetEvents(events, input, context);
        pushAdministrativeEvents(events, input, context);

        return Object.freeze(sortEvents(deduplicate(events)).filter(event => eventAllowed(event, profile)));
    }

    return Object.freeze({
        buildSchoolTimeline,
        createEvent,
        splitContext,
        toIso
    });
}));
