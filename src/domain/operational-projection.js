(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarOperationalProjection = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DOCUMENT_LABELS = Object.freeze({
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    });

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

    function differenceInDays(startValue, endValue) {
        const start = parseDate(startValue);
        const end = parseDate(endValue);
        if (!start || !end) return null;
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
    }

    function getDocumentLabel(pendency) {
        const key = normalizeText(pendency && pendency.documentoKey);
        if (key && DOCUMENT_LABELS[key]) return DOCUMENT_LABELS[key];
        const item = normalizeText(pendency && pendency.item);
        if (!item) return key || 'Documento';
        const separator = item.lastIndexOf(' - ');
        return separator >= 0 ? item.slice(separator + 3) : item;
    }

    function getLatestAwaitingAttempt(pendency) {
        const attempts = Array.isArray(pendency && pendency.tentativas)
            ? pendency.tentativas
            : [];
        return [...attempts]
            .reverse()
            .find(attempt => attempt && attempt.status === 'aguardando') || null;
    }

    function getLatestHistoryEvent(pendency) {
        const events = Array.isArray(pendency && pendency.historico)
            ? pendency.historico
            : [];
        return [...events]
            .map(event => ({ event, timestamp: toTimestamp(event && event.dataHora) }))
            .filter(item => item.timestamp != null)
            .sort((left, right) => right.timestamp - left.timestamp)[0]?.event || null;
    }

    function getOperationalBaseDate(pendency = {}) {
        const status = normalizeText(pendency.status);
        if (status === 'Aguardando reanálise') {
            const attempt = getLatestAwaitingAttempt(pendency);
            return attempt && (
                attempt.dataRegistro || attempt.dataDisponibilizacao
            ) || pendency.dataAbertura || null;
        }
        if (status === 'Aberta') {
            const events = Array.isArray(pendency.historico) ? pendency.historico : [];
            const returnEvents = events
                .filter(event => ['reabertura', 'reanálise_incorreta', 'reanalise_incorreta', 'arquivo_indisponivel'].includes(event && event.tipo))
                .map(event => ({ at: event.dataHora, timestamp: toTimestamp(event.dataHora) }))
                .filter(item => item.timestamp != null)
                .sort((left, right) => right.timestamp - left.timestamp);
            return returnEvents[0]?.at || pendency.dataAbertura || null;
        }
        if (status === 'Resolvida') return pendency.dataResolucao || getLatestHistoryEvent(pendency)?.dataHora || null;
        if (status === 'Cancelada') return pendency.cancelamento?.dataHora || getLatestHistoryEvent(pendency)?.dataHora || null;
        return pendency.dataAbertura || null;
    }

    function getConcreteNextAction(context = {}) {
        const pendency = context.pendency || {};
        const status = normalizeText(pendency.status);
        const documentLabel = getDocumentLabel(pendency);
        const common = {
            pendencyId: pendency.id || null,
            schoolId: pendency.escolaId || context.schoolId || null,
            competence: pendency.competenciaOrigem || pendency.competencia || context.competence || null,
            programId: pendency.programaId || context.programId || null,
            documentKey: pendency.documentoKey || null,
            documentLabel
        };
        if (status === 'Aberta') {
            return { ...common, actor: 'Escola', label: `Registrar novo envio do ${documentLabel}`, priority: 2 };
        }
        if (status === 'Aguardando reanálise') {
            return { ...common, actor: 'Controlador', label: `Reanalisar ${documentLabel}`, priority: 3 };
        }
        if (context.bonificationStatus === 'nao-lancada') {
            return { ...common, actor: 'Controlador', label: `Iniciar lançamento de ${context.programName || 'programa'}`, priority: 1 };
        }
        if (context.bonificationStatus === 'em-apuracao') {
            return { ...common, actor: 'Controlador', label: `Concluir apuração de ${context.programName || 'programa'}`, priority: 1 };
        }
        if (['nao-analisado', 'em-analise'].includes(context.technicalStatus)) {
            return { ...common, actor: 'Controlador', label: 'Concluir análise documental', priority: 1 };
        }
        return { ...common, actor: null, label: 'Sem ação pendente', priority: 0 };
    }

    function latestMovementForSchool(input = {}) {
        const pendencies = Array.isArray(input.pendencies) ? input.pendencies : [];
        const contacts = Array.isArray(input.contacts) ? input.contacts : [];
        const candidates = [];
        pendencies.forEach(pendency => {
            const latest = getLatestHistoryEvent(pendency);
            if (latest) {
                candidates.push({
                    type: normalizeText(latest.tipo) || 'movimentação',
                    at: latest.dataHora,
                    detail: latest.detalhe || latest.detalhes || '',
                    pendencyId: pendency.id
                });
            } else if (pendency.dataAbertura) {
                candidates.push({ type: 'abertura', at: pendency.dataAbertura, detail: '', pendencyId: pendency.id });
            }
        });
        contacts.forEach(contact => candidates.push({
            type: 'contato',
            at: contact.dataHora || contact.data,
            detail: contact.descricao || contact.observacao || '',
            pendencyId: contact.pendenciaId || contact.pendencyId || null
        }));
        return candidates
            .map(item => ({ ...item, timestamp: toTimestamp(item.at) }))
            .filter(item => item.timestamp != null)
            .sort((left, right) => right.timestamp - left.timestamp)[0] || null;
    }

    function aggregateStatus(values, order, fallback) {
        for (const value of order) {
            if (values.includes(value)) return value;
        }
        return fallback;
    }

    function buildSchoolProjection(input = {}) {
        const school = input.school || {};
        const competence = normalizeText(input.competence);
        const pendencies = (Array.isArray(input.pendencias) ? input.pendencias : []).filter(pendency => {
            const pendencyCompetence = normalizeText(pendency.competenciaOrigem || pendency.competencia);
            return pendency.escolaId === school.id && (!competence || pendencyCompetence === competence);
        });
        const active = pendencies.filter(pendency => ['Aberta', 'Aguardando reanálise'].includes(normalizeText(pendency.status)));
        const open = active.filter(pendency => normalizeText(pendency.status) === 'Aberta');
        const awaiting = active.filter(pendency => normalizeText(pendency.status) === 'Aguardando reanálise');
        const contacts = (Array.isArray(input.contatos) ? input.contatos : []).filter(contact => contact.escolaId === school.id);
        const programs = Array.isArray(input.programas) ? input.programas : [];
        const programIds = Array.isArray(school.programasIds) ? school.programasIds : [];
        const programRows = programIds.map(programId => {
            const program = programs.find(item => item.id === programId);
            const programName = normalizeText(program && (program.name || program.nome)) || programId;
            return {
                programId,
                programName,
                bonificationStatus: typeof input.getProgramBonificationStatus === 'function'
                    ? input.getProgramBonificationStatus(school.id, competence, programId)
                    : 'nao-lancada',
                technicalStatus: typeof input.getProgramTechnicalStatus === 'function'
                    ? input.getProgramTechnicalStatus(school.id, competence, programId)
                    : 'nao-analisado'
            };
        });
        const bonificationStatus = aggregateStatus(
            programRows.map(row => row.bonificationStatus),
            ['inapta', 'em-apuracao', 'nao-lancada', 'apta'],
            'nao-lancada'
        );
        const technicalStatus = aggregateStatus(
            programRows.map(row => row.technicalStatus),
            ['incorreto', 'em-analise', 'nao-analisado', 'correto-atrasado', 'correto'],
            'nao-analisado'
        );
        const controller = (Array.isArray(input.controladores) ? input.controladores : [])
            .find(item => item.id === school.controladorId);
        const actionCandidates = active.map(pendency => {
            const action = getConcreteNextAction({ pendency });
            const baseDate = getOperationalBaseDate(pendency);
            return {
                ...action,
                status: pendency.status,
                baseDate,
                waitingDays: differenceInDays(baseDate, input.now),
                ra: school.ra || '',
                schoolDesignation: school.designação || school.designacao || school.id || '',
                schoolName: school.denominação || school.denominacao || school.id || '',
                controllerId: school.controladorId || '',
                controllerName: controller?.name || 'Não designado'
            };
        });
        let nextAction = sortOperationalActions(actionCandidates)[0] || null;
        if (!nextAction) {
            const row = programRows.find(item => item.bonificationStatus !== 'apta' || !['correto', 'correto-atrasado'].includes(item.technicalStatus)) || programRows[0] || {};
            nextAction = {
                ...getConcreteNextAction({
                    schoolId: school.id,
                    competence,
                    programId: row.programId,
                    programName: row.programName,
                    bonificationStatus: row.bonificationStatus,
                    technicalStatus: row.technicalStatus
                }),
                waitingDays: null,
                ra: school.ra || '',
                schoolDesignation: school.designação || school.designacao || school.id || '',
                schoolName: school.denominação || school.denominacao || school.id || '',
                controllerId: school.controladorId || '',
                controllerName: controller?.name || 'Não designado'
            };
        }
        const documentaryStatus = open.length && awaiting.length
            ? 'Ação da escola e reanálise pendentes'
            : open.length
                ? 'Pendência aberta'
                : awaiting.length
                    ? 'Aguardando reanálise'
                    : technicalStatus === 'incorreto'
                        ? 'Documento incorreto sem pendência ativa'
                        : 'Sem pendência ativa';
        return {
            schoolId: school.id,
            schoolName: school.denominação || school.denominacao || school.id || 'Unidade não identificada',
            schoolDesignation: school.designação || school.designacao || school.id || '',
            inep: school.inep || '',
            ra: school.ra || '',
            controllerId: school.controladorId || '',
            controllerName: controller?.name || 'Não designado',
            competence,
            programs: programRows,
            bonificationStatus,
            technicalStatus,
            documentaryStatus,
            openCount: open.length,
            awaitingCount: awaiting.length,
            activeCount: active.length,
            activePendencies: active,
            latestMovement: latestMovementForSchool({ pendencies, contacts }),
            nextAction
        };
    }

    function sortOperationalActions(records) {
        return [...(Array.isArray(records) ? records : [])].sort((left, right) => {
            const waiting = (right.waitingDays == null ? -1 : right.waitingDays)
                - (left.waitingDays == null ? -1 : left.waitingDays);
            if (waiting) return waiting;
            const priority = (right.priority || 0) - (left.priority || 0);
            if (priority) return priority;
            const ra = String(left.ra || '').localeCompare(String(right.ra || ''), 'pt-BR', { numeric: true, sensitivity: 'base' });
            if (ra) return ra;
            return String(left.schoolDesignation || '').localeCompare(String(right.schoolDesignation || ''), 'pt-BR', { numeric: true, sensitivity: 'base' });
        });
    }

    function buildOperationalProjection(input = {}) {
        const schools = (Array.isArray(input.escolas) ? input.escolas : []).map(school => buildSchoolProjection({
            ...input,
            school,
            competence: input.competencia
        }));
        const actions = sortOperationalActions(
            schools.map(school => school.nextAction).filter(action => action && action.label !== 'Sem ação pendente')
        );
        return {
            competence: input.competencia || '',
            schools,
            actions,
            totals: {
                schools: schools.length,
                schoolsWithOpen: schools.filter(school => school.openCount > 0).length,
                schoolsAwaitingReview: schools.filter(school => school.awaitingCount > 0).length,
                activePendencies: schools.reduce((sum, school) => sum + school.activeCount, 0),
                bonificationNotLaunched: schools.filter(school => school.bonificationStatus === 'nao-lancada').length
            }
        };
    }

    return Object.freeze({
        VERSION: '1.0.0',
        DOCUMENT_LABELS,
        buildOperationalProjection,
        buildSchoolProjection,
        getConcreteNextAction,
        getOperationalBaseDate,
        sortOperationalActions
    });
}));
