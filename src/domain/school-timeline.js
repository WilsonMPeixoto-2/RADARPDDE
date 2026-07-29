(function installRadarSchoolTimeline(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarSchoolTimeline = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createSchoolTimelineApi() {
    'use strict';

    const ACTIVE_PENDENCY_STATUSES = new Set(['Aberta', 'Aguardando reanálise']);
    const TECHNICAL_ACTIONS = new Set([
        'Análise Técnica Alterada',
        'Pendência Reanalisada',
        'Reanálise de Pendência'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function validIso(value) {
        const candidate = text(value);
        if (!candidate) return '';
        const date = new Date(candidate);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }

    function competenceFromCompoundKey(value) {
        const candidate = text(value);
        const match = /^(\d{4}-\d{2})(?:_|$)/.exec(candidate);
        return match ? match[1] : '';
    }

    function programFromCompoundKey(value) {
        const candidate = text(value);
        const separator = candidate.indexOf('_');
        return separator >= 0 ? candidate.slice(separator + 1) : '';
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR');
        if (normalized === 'sme_management' || normalized === 'gestão sme') return 'sme';
        return normalized;
    }

    function eventOf(input = {}) {
        const sourceEntity = text(input.sourceEntity) || 'unknown';
        const sourceId = text(input.sourceId) || 'unknown';
        const type = text(input.type) || 'administrative_event';
        const occurredAt = validIso(input.occurredAt);
        if (!occurredAt) return null;

        return Object.freeze({
            id: text(input.id) || `${sourceEntity}:${sourceId}:${type}`,
            occurredAt,
            type,
            title: text(input.title) || 'Evento registrado',
            description: text(input.description),
            actor: text(input.actor) || 'Sistema',
            status: text(input.status),
            competenceKey: text(input.competenceKey),
            programId: text(input.programId),
            pendencyId: text(input.pendencyId),
            visibility: text(input.visibility) || 'operational',
            sourceEntity,
            sourceId
        });
    }

    function pushEvent(events, input) {
        const event = eventOf(input);
        if (event) events.push(event);
    }

    function programName(programs, programId) {
        return text(list(programs).find(program => text(program?.id) === text(programId))?.name)
            || text(programId)
            || 'programa';
    }

    function findConsolidatedResult(verifications, schoolId, competenceKey) {
        const schoolVerifications = verifications?.[schoolId] || {};
        const entry = Object.entries(schoolVerifications).find(([compoundKey, verification]) => (
            competenceFromCompoundKey(compoundKey) === competenceKey
            && text(verification?.resultadoBonif || verification?.bonus_result)
        ));
        return entry ? text(entry[1]?.resultadoBonif || entry[1]?.bonus_result).toLowerCase() : '';
    }

    function appendVerificationEvents(events, input) {
        const schoolVerifications = input.verifications?.[input.schoolId] || {};
        Object.entries(schoolVerifications).forEach(([compoundKey, verification]) => {
            const competenceKey = competenceFromCompoundKey(compoundKey);
            if (competenceKey !== input.competenceKey) return;
            const result = text(verification?.resultadoBonif || verification?.bonus_result).toLowerCase();
            if (!result) return;
            const programId = programFromCompoundKey(compoundKey);
            pushEvent(events, {
                type: 'verification_consolidated',
                title: `Bonificação ${result.toUpperCase()}`,
                description: `Resultado consolidado para ${programName(input.programs, programId)}.`,
                actor: verification?.updatedByName || verification?.updated_by_name || verification?.usuario,
                status: result,
                occurredAt: verification?.consolidatedAt
                    || verification?.consolidated_at
                    || verification?.updatedAt
                    || verification?.updated_at,
                competenceKey,
                programId,
                visibility: 'managerial',
                sourceEntity: 'verifications',
                sourceId: compoundKey
            });
        });
    }

    function appendPendencyEvents(events, input) {
        const matchingPendencies = list(input.pendencies).filter(pendency => (
            text(pendency?.escolaId || pendency?.school_id) === input.schoolId
            && text(
                pendency?.competenciaOrigem
                || pendency?.competencia
                || pendency?.competence_origin
                || pendency?.competence_id
            ) === input.competenceKey
        ));

        matchingPendencies.forEach(pendency => {
            const pendencyId = text(pendency?.id);
            const programId = text(pendency?.programaId || pendency?.program_id);
            const item = text(pendency?.item || pendency?.documentoNome || pendency?.document_name || pendency?.documentoKey);
            const status = text(pendency?.status);

            pushEvent(events, {
                type: 'pendency_opened',
                title: 'Pendência aberta',
                description: text(pendency?.motivo || pendency?.observacao || item),
                actor: pendency?.usuarioAbertura || pendency?.createdByName || pendency?.usuario,
                status,
                occurredAt: pendency?.dataAbertura || pendency?.created_at,
                competenceKey: input.competenceKey,
                programId,
                pendencyId,
                visibility: 'managerial',
                sourceEntity: 'pendencies',
                sourceId: pendencyId
            });

            if (status === 'Resolvida' || pendency?.dataResolucao || pendency?.resolved_at) {
                pushEvent(events, {
                    type: 'pendency_resolved',
                    title: 'Pendência resolvida',
                    description: text(pendency?.justificativaResolucao || pendency?.resolution_reason || pendency?.observacao),
                    actor: pendency?.resolvidoPorNome || pendency?.resolved_by_name || pendency?.usuario,
                    status: 'Resolvida',
                    occurredAt: pendency?.dataResolucao || pendency?.resolved_at,
                    competenceKey: input.competenceKey,
                    programId,
                    pendencyId,
                    visibility: 'managerial',
                    sourceEntity: 'pendencies',
                    sourceId: pendencyId
                });
            } else if (status === 'Cancelada' || pendency?.dataCancelamento || pendency?.cancelled_at) {
                pushEvent(events, {
                    type: 'pendency_cancelled',
                    title: 'Pendência cancelada',
                    description: text(pendency?.justificativaCancelamento || pendency?.cancellation_reason),
                    actor: pendency?.canceladoPorNome || pendency?.cancelled_by_name || pendency?.usuario,
                    status: 'Cancelada',
                    occurredAt: pendency?.dataCancelamento || pendency?.cancelled_at,
                    competenceKey: input.competenceKey,
                    programId,
                    pendencyId,
                    visibility: 'managerial',
                    sourceEntity: 'pendencies',
                    sourceId: pendencyId
                });
            }

            list(pendency?.tentativas || pendency?.attempts).forEach(attempt => {
                const reviewedAt = attempt?.dataAnalise || attempt?.reviewed_at;
                const registeredAt = attempt?.dataRegistro || attempt?.created_at;
                const reviewed = Boolean(validIso(reviewedAt));
                pushEvent(events, {
                    type: reviewed ? 'pendency_attempt_reviewed' : 'pendency_attempt_registered',
                    title: reviewed ? 'Reanálise concluída' : 'Novo envio registrado',
                    description: text(attempt?.observacao || attempt?.notes || attempt?.resultado || attempt?.result),
                    actor: reviewed
                        ? (attempt?.analisadoPorNome || attempt?.reviewed_by_name)
                        : (attempt?.registradoPorNome || attempt?.created_by_name),
                    status: text(attempt?.resultado || attempt?.result || attempt?.status),
                    occurredAt: reviewedAt || registeredAt,
                    competenceKey: input.competenceKey,
                    programId,
                    pendencyId,
                    visibility: reviewed ? 'technical' : 'managerial',
                    sourceEntity: 'pendency_attempts',
                    sourceId: attempt?.id
                });
            });
        });

        return matchingPendencies;
    }

    function appendContactEvents(events, input, matchingPendencies) {
        const pendencyIds = new Set(matchingPendencies.map(pendency => text(pendency?.id)).filter(Boolean));
        list(input.contacts).forEach(contact => {
            if (text(contact?.escolaId || contact?.school_id) !== input.schoolId) return;
            const pendencyId = text(contact?.pendenciaId || contact?.pendency_id);
            const explicitCompetence = text(contact?.competencia || contact?.competence_id);
            if (explicitCompetence && explicitCompetence !== input.competenceKey) return;
            if (pendencyId && !pendencyIds.has(pendencyId)) return;
            pushEvent(events, {
                type: 'pendency_contact',
                title: `Contato registrado${text(contact?.tipo) ? ` — ${text(contact.tipo)}` : ''}`,
                description: text(contact?.descricao || contact?.desc || contact?.observacao),
                actor: contact?.responsavel || contact?.usuario || contact?.created_by_name,
                status: 'Registrado',
                occurredAt: contact?.dataHora || contact?.dataAtendimento || contact?.dataRegistro || contact?.created_at,
                competenceKey: input.competenceKey,
                pendencyId,
                visibility: 'managerial',
                sourceEntity: 'contacts',
                sourceId: contact?.id
            });
        });
    }

    function appendInvoiceEvents(events, input) {
        list(input.invoices).forEach(invoice => {
            if (text(invoice?.escolaId || invoice?.school_id) !== input.schoolId) return;
            const compoundKey = text(invoice?.compKey || invoice?.comp_key);
            const competenceKey = text(invoice?.competencia || invoice?.competence_id)
                || competenceFromCompoundKey(compoundKey);
            if (competenceKey !== input.competenceKey) return;
            pushEvent(events, {
                type: 'invoice_registered',
                title: `Nota fiscal ${text(invoice?.numero || invoice?.number) || 'registrada'}`,
                description: text(invoice?.desc || invoice?.descricao || invoice?.description),
                actor: invoice?.usuario || invoice?.created_by_name,
                status: text(invoice?.status) || 'Registrada',
                occurredAt: invoice?.dataRegistro || invoice?.created_at,
                competenceKey,
                programId: text(invoice?.programaId || invoice?.program_id) || programFromCompoundKey(compoundKey),
                visibility: 'managerial',
                sourceEntity: 'invoices',
                sourceId: invoice?.id
            });
        });
    }

    function appendAssetEvents(events, input) {
        list(input.assets).forEach(asset => {
            if (text(asset?.escolaId || asset?.school_id) !== input.schoolId) return;
            const competenceKey = text(asset?.competencia || asset?.competence_id)
                || competenceFromCompoundKey(asset?.compKey || asset?.comp_key);
            if (competenceKey !== input.competenceKey) return;
            const inventoriedAt = asset?.dataInventariacao || asset?.inventoried_at;
            const inventoried = Boolean(validIso(inventoriedAt));
            pushEvent(events, {
                type: inventoried ? 'asset_inventoried' : 'asset_registered',
                title: inventoried ? 'Bem inventariado' : 'Bem permanente registrado',
                description: text(asset?.item || asset?.descricao || asset?.description),
                actor: inventoried
                    ? (asset?.responsavelInventario || asset?.inventoried_by_name)
                    : (asset?.usuario || asset?.created_by_name),
                status: text(asset?.status),
                occurredAt: inventoriedAt || asset?.dataRegistro || asset?.created_at,
                competenceKey,
                programId: text(asset?.programaId || asset?.program_id),
                visibility: 'managerial',
                sourceEntity: 'assets',
                sourceId: asset?.id
            });
        });
    }

    function appendAdministrativeEvents(events, input) {
        const consolidatedResult = findConsolidatedResult(
            input.verifications,
            input.schoolId,
            input.competenceKey
        );
        list(input.logs).forEach(log => {
            if (text(log?.escolaId || log?.school_id) !== input.schoolId) return;
            const action = text(log?.acao || log?.action);
            const details = text(log?.detalhes || log?.details);
            const explicitCompetence = text(log?.competencia || log?.competence_id);
            if (explicitCompetence && explicitCompetence !== input.competenceKey) return;
            const mentionedCompetence = details.match(/\b\d{4}-\d{2}\b/)?.[0] || '';
            if (mentionedCompetence && mentionedCompetence !== input.competenceKey) return;

            const isConsolidation = action === 'Bonificação Consolidada';
            const technical = TECHNICAL_ACTIONS.has(action) || /análise técnica|reanálise/i.test(action);
            pushEvent(events, {
                type: isConsolidation
                    ? 'verification_consolidated'
                    : technical
                        ? 'technical_analysis_changed'
                        : 'administrative_event',
                title: isConsolidation && consolidatedResult
                    ? `Bonificação ${consolidatedResult.toUpperCase()}`
                    : action || 'Registro administrativo',
                description: details,
                actor: log?.usuario || log?.user_identifier || log?.actor_name,
                status: isConsolidation ? consolidatedResult : '',
                occurredAt: log?.dataHora || log?.event_at || log?.created_at,
                competenceKey: input.competenceKey,
                programId: text(log?.programaId || log?.program_id),
                pendencyId: text(log?.pendenciaId || log?.pendency_id),
                visibility: technical ? 'technical' : 'managerial',
                sourceEntity: 'administrative_logs',
                sourceId: log?.id
            });
        });
    }

    function deduplicate(events) {
        const byId = new Map();
        events.forEach(event => {
            if (!event) return;
            if (!byId.has(event.id)) byId.set(event.id, event);
        });
        return [...byId.values()];
    }

    function buildSchoolTimeline(input = {}) {
        const schoolId = text(input.schoolId);
        const competenceKey = text(input.competenceKey);
        if (!schoolId || !competenceKey) return Object.freeze([]);

        const context = {
            ...input,
            schoolId,
            competenceKey,
            programs: list(input.programs),
            verifications: input.verifications || {},
            pendencies: list(input.pendencies),
            contacts: list(input.contacts),
            invoices: list(input.invoices),
            assets: list(input.assets),
            logs: list(input.logs)
        };
        const events = [];
        appendVerificationEvents(events, context);
        const matchingPendencies = appendPendencyEvents(events, context);
        appendContactEvents(events, context, matchingPendencies);
        appendInvoiceEvents(events, context);
        appendAssetEvents(events, context);
        appendAdministrativeEvents(events, context);

        const profile = normalizeProfile(input.accessProfile);
        const visible = deduplicate(events).filter(event => (
            profile !== 'sme' || event.visibility !== 'technical'
        ));
        visible.sort((left, right) => (
            new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
            || left.id.localeCompare(right.id, 'pt-BR')
        ));
        return Object.freeze(visible);
    }

    return Object.freeze({
        ACTIVE_PENDENCY_STATUSES,
        buildSchoolTimeline,
        competenceFromCompoundKey,
        eventOf
    });
}));