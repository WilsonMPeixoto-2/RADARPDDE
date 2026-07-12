(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarPendenciasViewModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.0.0';
    const STATUS_KEYS = Object.freeze({
        'Aberta': 'aberta',
        'Aguardando reanálise': 'aguardando',
        'Resolvida': 'resolvida',
        'Cancelada': 'cancelada'
    });
    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });
    const NEXT_ACTIONS = Object.freeze({
        'Aberta': Object.freeze({ actor: 'Escola', action: 'Entregar ou corrigir o documento' }),
        'Aguardando reanálise': Object.freeze({ actor: 'Controlador', action: 'Conferir o novo arquivo' }),
        'Resolvida': Object.freeze({ actor: null, action: 'Nenhuma ação pendente' }),
        'Cancelada': Object.freeze({ actor: null, action: 'Nenhuma ação pendente' })
    });

    function normalizeSearchText(value) {
        return String(value == null ? '' : value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function normalizeText(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function parseDate(value) {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function toTimestamp(value) {
        const parsed = parseDate(value);
        return parsed ? parsed.getTime() : null;
    }

    function compareNullableTimestamps(left, right, direction) {
        const l = left == null ? null : left;
        const r = right == null ? null : right;
        if (l == null && r == null) return 0;
        if (l == null) return 1;
        if (r == null) return -1;
        return direction === 'desc' ? r - l : l - r;
    }

    function differenceInDays(startValue, endValue) {
        const start = parseDate(startValue);
        const end = parseDate(endValue);
        if (!start || !end) return null;
        const milliseconds = end.getTime() - start.getTime();
        if (milliseconds < 0) return 0;
        return Math.floor(milliseconds / 86400000);
    }

    function getSchoolName(school) {
        if (!school) return 'Unidade não identificada';
        return normalizeText(
            school.denominação || school.denominacao || school.denominaçao || school.name
        ) || normalizeText(school.id) || 'Unidade não identificada';
    }

    function getSchoolDesignation(school, pendency) {
        return normalizeText(school && (school.designação || school.designacao))
            || normalizeText(pendency && pendency.escolaId);
    }

    function getSchoolRa(school) {
        return normalizeText(school && school.ra) || 'R.A. não informada';
    }

    function getProgramName(programsById, pendency) {
        const programId = normalizeText(pendency && pendency.programaId);
        if (!programId) return 'Programa não identificado';
        const program = programsById.get(programId);
        return normalizeText(program && (program.name || program.nome)) || programId;
    }

    function getDocumentName(pendency) {
        const documentKey = normalizeText(pendency && pendency.documentoKey);
        if (documentKey && DOCUMENT_LABELS[documentKey]) return DOCUMENT_LABELS[documentKey];
        if (documentKey) return documentKey;
        return normalizeText(pendency && pendency.item) || 'Documento não identificado';
    }

    function getErrors(pendency) {
        const current = Array.isArray(pendency && pendency.errosAtuais)
            ? pendency.errosAtuais.map(normalizeText).filter(Boolean)
            : [];
        if (current.length > 0) return [...new Set(current)];
        const legacy = normalizeText(pendency && pendency.motivo);
        return legacy ? [legacy] : [];
    }

    function getLatestAwaitingAttempt(pendency) {
        const attempts = Array.isArray(pendency && pendency.tentativas)
            ? pendency.tentativas
            : [];
        return [...attempts]
            .reverse()
            .find(attempt => attempt && attempt.status === 'aguardando') || null;
    }

    function getLatestMovement(recordLike) {
        const candidates = [];
        const pendency = recordLike.pendency || recordLike;
        const history = Array.isArray(pendency.historico) ? pendency.historico : [];
        const attempts = Array.isArray(pendency.tentativas) ? pendency.tentativas : [];
        const contacts = Array.isArray(recordLike.contacts) ? recordLike.contacts : [];

        history.forEach(event => candidates.push({
            at: event && event.dataHora,
            type: event && event.tipo,
            label: event && (event.detalhe || event.detalhes)
        }));
        attempts.forEach(attempt => {
            candidates.push({
                at: attempt && (attempt.dataAnalise || attempt.dataRegistro || attempt.dataDisponibilizacao),
                type: attempt && attempt.resultado ? 'reanálise' : 'novo_envio',
                label: attempt && attempt.observacao
            });
        });
        contacts.forEach(contact => candidates.push({
            at: contact && (contact.dataHora || contact.data),
            type: 'contato',
            label: contact && (contact.descricao || contact.observacao)
        }));
        candidates.push({ at: pendency.dataAbertura, type: 'abertura', label: 'Pendência aberta.' });
        if (pendency.dataResolucao) {
            candidates.push({ at: pendency.dataResolucao, type: 'resolução', label: 'Pendência resolvida.' });
        }
        if (pendency.cancelamento && pendency.cancelamento.dataHora) {
            candidates.push({
                at: pendency.cancelamento.dataHora,
                type: 'cancelamento',
                label: pendency.cancelamento.justificativa
            });
        }

        return candidates
            .map(candidate => ({ ...candidate, timestamp: toTimestamp(candidate.at) }))
            .filter(candidate => candidate.timestamp != null)
            .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
    }

    function buildSearchText(record) {
        return normalizeSearchText([
            record.schoolName,
            record.schoolDesignation,
            record.ra,
            record.competence,
            record.programId,
            record.programName,
            record.documentKey,
            record.documentName,
            record.item,
            record.status,
            record.errors.join(' '),
            record.observation,
            record.nextActor,
            record.nextAction,
            record.controllerName,
            record.cancelJustification,
            record.contacts.map(contact => [
                contact.tipo,
                contact.descricao,
                contact.observacao,
                contact.responsavel
            ].join(' ')).join(' ')
        ].join(' '));
    }

    function buildPendencyRecords(input = {}) {
        const pendencies = Array.isArray(input.pendencias) ? input.pendencias : [];
        const schools = Array.isArray(input.escolas) ? input.escolas : [];
        const programs = Array.isArray(input.programas) ? input.programas : [];
        const controllers = Array.isArray(input.controladores) ? input.controladores : [];
        const contacts = Array.isArray(input.contatos) ? input.contatos : [];
        const now = input.now || new Date().toISOString();

        const schoolsById = new Map(schools.map(school => [school.id, school]));
        const programsById = new Map(programs.map(program => [program.id, program]));
        const controllersById = new Map(controllers.map(controller => [controller.id, controller]));
        const contactsByPendencyId = new Map();
        contacts.forEach(contact => {
            const pendencyId = contact && (contact.pendenciaId || contact.pendencyId);
            if (!pendencyId) return;
            const current = contactsByPendencyId.get(pendencyId) || [];
            current.push(contact);
            contactsByPendencyId.set(pendencyId, current);
        });

        return pendencies.map((pendency, sourceIndex) => {
            const school = schoolsById.get(pendency.escolaId);
            const controllerId = normalizeText(school && school.controladorId);
            const controller = controllersById.get(controllerId);
            const status = normalizeText(pendency.status) || 'Aberta';
            const next = NEXT_ACTIONS[status] || NEXT_ACTIONS.Aberta;
            const attempts = Array.isArray(pendency.tentativas) ? pendency.tentativas : [];
            const history = Array.isArray(pendency.historico) ? pendency.historico : [];
            const linkedContacts = contactsByPendencyId.get(pendency.id) || [];
            const latestAwaitingAttempt = getLatestAwaitingAttempt(pendency);
            const waitingSince = status === 'Aguardando reanálise'
                ? (latestAwaitingAttempt && (
                    latestAwaitingAttempt.dataRegistro || latestAwaitingAttempt.dataDisponibilizacao
                ))
                : pendency.dataAbertura;
            const cancelAt = pendency.cancelamento && pendency.cancelamento.dataHora;
            const record = {
                id: pendency.id,
                sourceIndex,
                pendency,
                status,
                statusKey: STATUS_KEYS[status] || 'aberta',
                schoolId: pendency.escolaId,
                schoolName: getSchoolName(school),
                schoolDesignation: getSchoolDesignation(school, pendency),
                ra: getSchoolRa(school),
                controllerId,
                controllerName: normalizeText(controller && controller.name) || 'Não designado',
                competence: normalizeText(pendency.competenciaOrigem || pendency.competencia),
                programId: normalizeText(pendency.programaId),
                programName: getProgramName(programsById, pendency),
                documentKey: normalizeText(pendency.documentoKey),
                documentName: getDocumentName(pendency),
                item: normalizeText(pendency.item),
                errors: getErrors(pendency),
                observation: normalizeText(pendency.observacao),
                nextActor: next.actor,
                nextAction: next.action,
                openedAt: pendency.dataAbertura || null,
                resolvedAt: pendency.dataResolucao || null,
                cancelledAt: cancelAt || null,
                waitingSince: waitingSince || null,
                ageDays: differenceInDays(waitingSince, now),
                attempts: attempts.map(attempt => ({ ...attempt })),
                attemptCount: attempts.length,
                history: history.map(event => ({ ...event })),
                contacts: linkedContacts.map(contact => ({ ...contact })),
                cancelJustification: normalizeText(
                    pendency.cancelamento && pendency.cancelamento.justificativa
                ),
                contextIncomplete: Boolean(pendency.contextoIncompleto)
                    || !normalizeText(pendency.programaId)
                    || !normalizeText(pendency.documentoKey),
                latestAwaitingAttempt: latestAwaitingAttempt
                    ? { ...latestAwaitingAttempt }
                    : null
            };
            record.latestMovement = getLatestMovement(record);
            record.searchText = buildSearchText(record);
            return record;
        });
    }

    function matchesAge(ageDays, filter) {
        if (!filter) return true;
        if (ageDays == null) return false;
        if (filter === '0-7') return ageDays <= 7;
        if (filter === '8-15') return ageDays >= 8 && ageDays <= 15;
        if (filter === '16-30') return ageDays >= 16 && ageDays <= 30;
        if (filter === '30-plus') return ageDays >= 30;
        return true;
    }

    function applyPendencyFilters(records, filters = {}) {
        const query = normalizeSearchText(filters.query);
        const schoolId = normalizeText(filters.schoolId);
        const competence = normalizeText(filters.competence);
        const programId = normalizeText(filters.programId);
        const documentKey = normalizeText(filters.documentKey);
        const error = normalizeSearchText(filters.error);
        const nextActor = normalizeSearchText(filters.nextActor);
        const controllerId = normalizeText(filters.controllerId);
        const age = normalizeText(filters.age);

        return (Array.isArray(records) ? records : []).filter(record => {
            if (query && !record.searchText.includes(query)) return false;
            if (schoolId && record.schoolId !== schoolId) return false;
            if (competence && record.competence !== competence) return false;
            if (programId && record.programId !== programId) return false;
            if (documentKey && record.documentKey !== documentKey) return false;
            if (error && !normalizeSearchText(record.errors.join(' ')).includes(error)) return false;
            if (nextActor && normalizeSearchText(record.nextActor) !== nextActor) return false;
            if (controllerId && record.controllerId !== controllerId) return false;
            if (!matchesAge(record.ageDays, age)) return false;
            return true;
        });
    }

    function compareText(left, right) {
        return String(left || '').localeCompare(String(right || ''), 'pt-BR', {
            sensitivity: 'base',
            numeric: true
        });
    }

    function compareTieBreakers(left, right) {
        return compareText(left.ra, right.ra)
            || compareText(left.schoolDesignation, right.schoolDesignation)
            || compareText(left.id, right.id);
    }

    function sortPendencyRecords(records, status) {
        const normalizedStatus = normalizeText(status);
        return [...(Array.isArray(records) ? records : [])].sort((left, right) => {
            let comparison = 0;
            if (normalizedStatus === 'Aberta') {
                comparison = compareNullableTimestamps(
                    toTimestamp(left.openedAt),
                    toTimestamp(right.openedAt),
                    'asc'
                );
            } else if (normalizedStatus === 'Aguardando reanálise') {
                comparison = compareNullableTimestamps(
                    toTimestamp(left.waitingSince),
                    toTimestamp(right.waitingSince),
                    'asc'
                );
            } else if (normalizedStatus === 'Resolvida') {
                comparison = compareNullableTimestamps(
                    toTimestamp(left.resolvedAt),
                    toTimestamp(right.resolvedAt),
                    'desc'
                );
            } else if (normalizedStatus === 'Cancelada') {
                comparison = compareNullableTimestamps(
                    toTimestamp(left.cancelledAt),
                    toTimestamp(right.cancelledAt),
                    'desc'
                );
            }
            return comparison || compareTieBreakers(left, right);
        });
    }

    function groupPendencyRecords(records) {
        const source = Array.isArray(records) ? records : [];
        return {
            aberta: sortPendencyRecords(
                source.filter(record => record.status === 'Aberta'),
                'Aberta'
            ),
            aguardando: sortPendencyRecords(
                source.filter(record => record.status === 'Aguardando reanálise'),
                'Aguardando reanálise'
            ),
            resolvida: sortPendencyRecords(
                source.filter(record => record.status === 'Resolvida'),
                'Resolvida'
            ),
            cancelada: sortPendencyRecords(
                source.filter(record => record.status === 'Cancelada'),
                'Cancelada'
            )
        };
    }

    function buildPendencyTimeline(record = {}) {
        const history = Array.isArray(record.history)
            ? record.history
            : (Array.isArray(record.pendency && record.pendency.historico)
                ? record.pendency.historico
                : []);
        const contacts = Array.isArray(record.contacts) ? record.contacts : [];
        const historyItems = history.map(event => ({
            id: event.id,
            type: event.tipo || 'evento',
            at: event.dataHora || null,
            timestamp: toTimestamp(event.dataHora),
            user: event.usuario || null,
            profile: event.perfil || null,
            detail: event.detalhe || event.detalhes || '',
            errors: Array.isArray(event.erros) ? [...event.erros] : [],
            attemptId: event.tentativaId || null,
            source: 'history'
        }));
        const contactItems = contacts.map(contact => ({
            id: contact.id,
            type: 'contact',
            at: contact.dataHora || contact.data || null,
            timestamp: toTimestamp(contact.dataHora || contact.data),
            user: contact.responsavel || contact.usuario || null,
            profile: null,
            detail: contact.descricao || contact.observacao || '',
            errors: [],
            attemptId: null,
            contactType: contact.tipo || null,
            source: 'contact'
        }));

        return [...historyItems, ...contactItems]
            .sort((left, right) => {
                const byDate = compareNullableTimestamps(
                    left.timestamp,
                    right.timestamp,
                    'desc'
                );
                return byDate || compareText(left.id, right.id);
            });
    }

    function createGroupModel(totalRecords, filteredRecords, key, status) {
        return {
            key,
            status,
            records: sortPendencyRecords(filteredRecords, status),
            counts: {
                filtered: filteredRecords.length,
                total: totalRecords.length
            }
        };
    }

    function createPendencyPageModel(input = {}) {
        const records = buildPendencyRecords(input);
        const filteredRecords = applyPendencyFilters(records, input.filters || {});
        const totalGroups = groupPendencyRecords(records);
        const filteredGroups = groupPendencyRecords(filteredRecords);
        const groups = {
            aberta: createGroupModel(
                totalGroups.aberta,
                filteredGroups.aberta,
                'aberta',
                'Aberta'
            ),
            aguardando: createGroupModel(
                totalGroups.aguardando,
                filteredGroups.aguardando,
                'aguardando',
                'Aguardando reanálise'
            ),
            resolvida: createGroupModel(
                totalGroups.resolvida,
                filteredGroups.resolvida,
                'resolvida',
                'Resolvida'
            ),
            cancelada: createGroupModel(
                totalGroups.cancelada,
                filteredGroups.cancelada,
                'cancelada',
                'Cancelada'
            )
        };

        return {
            records,
            filteredRecords,
            groups,
            activeTotal: totalGroups.aberta.length + totalGroups.aguardando.length,
            filteredTotal: filteredRecords.length,
            total: records.length,
            filters: { ...(input.filters || {}) }
        };
    }

    return Object.freeze({
        VERSION,
        DOCUMENT_LABELS,
        STATUS_KEYS,
        applyPendencyFilters,
        buildPendencyRecords,
        buildPendencyTimeline,
        createPendencyPageModel,
        groupPendencyRecords,
        normalizeSearchText,
        sortPendencyRecords
    });
}));
