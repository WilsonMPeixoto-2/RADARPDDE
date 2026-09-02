(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarPendencyExcelExportModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.0.0';
    const STATUS_ORDER = Object.freeze([
        'Aberta',
        'Aguardando reanálise',
        'Resolvida',
        'Cancelada'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function dateOrNull(value) {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatCompetence(value) {
        const source = text(value);
        const match = /^(\d{4})-(\d{2})$/.exec(source);
        return match ? `${match[2]}/${match[1]}` : source;
    }

    function formatMovement(record) {
        const movement = record?.latestMovement || null;
        if (!movement) return { date: null, label: '' };
        return {
            date: dateOrNull(movement.at),
            label: text(movement.label || movement.type)
        };
    }

    function formatLatestSubmission(record) {
        const attempt = record?.latestAwaitingAttempt || null;
        if (!attempt) return null;
        return dateOrNull(attempt.dataDisponibilizacao || attempt.dataRegistro);
    }

    function joinErrors(record) {
        return Array.isArray(record?.errors)
            ? record.errors.map(text).filter(Boolean).join(' | ')
            : '';
    }

    function normalizeFilterSummary(value) {
        if (!Array.isArray(value)) return [];
        return value
            .map(item => ({
                label: text(item?.label),
                value: text(item?.value)
            }))
            .filter(item => item.label && item.value);
    }

    function buildRows(pageModel = {}) {
        const groups = pageModel.groups || {};
        const byStatus = new Map(STATUS_ORDER.map(status => [status, []]));

        Object.values(groups).forEach(group => {
            (Array.isArray(group?.records) ? group.records : []).forEach(record => {
                const status = text(record?.status) || 'Aberta';
                if (!byStatus.has(status)) byStatus.set(status, []);
                byStatus.get(status).push(record);
            });
        });

        const orderedRecords = [];
        STATUS_ORDER.forEach(status => orderedRecords.push(...(byStatus.get(status) || [])));
        [...byStatus.entries()]
            .filter(([status]) => !STATUS_ORDER.includes(status))
            .forEach(([, records]) => orderedRecords.push(...records));

        return orderedRecords.map(record => {
            const movement = formatMovement(record);
            return Object.freeze({
                status: text(record.status),
                schoolName: text(record.schoolName),
                schoolDesignation: text(record.schoolDesignation),
                ra: text(record.ra),
                controllerName: text(record.controllerName),
                competence: formatCompetence(record.competence),
                programName: text(record.programName),
                documentName: text(record.documentName),
                item: text(record.item),
                errors: joinErrors(record),
                observation: text(record.observation),
                nextAction: text(record.nextAction),
                nextActor: text(record.nextActor),
                openedAt: dateOrNull(record.openedAt),
                waitingSince: dateOrNull(record.waitingSince),
                ageDays: Number.isFinite(record.ageDays) ? Number(record.ageDays) : null,
                latestSubmissionAt: formatLatestSubmission(record),
                latestMovementAt: movement.date,
                latestMovement: movement.label,
                attemptCount: Number.isFinite(record.attemptCount) ? Number(record.attemptCount) : 0,
                resolvedAt: dateOrNull(record.resolvedAt),
                cancelledAt: dateOrNull(record.cancelledAt),
                cancelJustification: text(record.cancelJustification)
            });
        });
    }

    function statusCount(pageModel, key) {
        const group = pageModel?.groups?.[key];
        return Number(group?.counts?.filtered || 0);
    }

    function buildSummary(pageModel = {}, rows = []) {
        const open = statusCount(pageModel, 'aberta');
        const awaiting = statusCount(pageModel, 'aguardando');
        const resolved = statusCount(pageModel, 'resolvida');
        const cancelled = statusCount(pageModel, 'cancelada');
        const overdue30 = rows.filter(row => (
            ['Aberta', 'Aguardando reanálise'].includes(row.status)
            && Number.isFinite(row.ageDays)
            && row.ageDays >= 30
        )).length;

        return Object.freeze({
            exported: rows.length,
            open,
            awaiting,
            resolved,
            cancelled,
            active: open + awaiting,
            schoolAction: rows.filter(row => (
                ['Aberta', 'Aguardando reanálise'].includes(row.status)
                && row.nextActor === 'Escola'
            )).length,
            controllerAction: rows.filter(row => (
                ['Aberta', 'Aguardando reanálise'].includes(row.status)
                && row.nextActor === 'Controlador'
            )).length,
            overdue30
        });
    }

    function buildWorkbookModel(input = {}) {
        const pageModel = input.pageModel || {};
        const rows = buildRows(pageModel);
        const generatedAt = input.generatedAt instanceof Date
            ? input.generatedAt
            : new Date(input.generatedAt || Date.now());
        const filterSummary = normalizeFilterSummary(input.filterSummary);
        const scope = filterSummary.length
            ? 'Pendências que correspondem à busca e aos filtros aplicados na tela'
            : 'Todas as pendências disponíveis no escopo autorizado';

        return Object.freeze({
            version: VERSION,
            title: 'RELATÓRIO DE PENDÊNCIAS DO PDDE',
            subtitle: 'Acompanhamento operacional por unidade escolar, competência, programa e documento',
            fileName: input.fileName || `RELATORIO_PENDENCIAS_PDDE_${generatedAt.toISOString().slice(0, 10)}.xlsx`,
            generatedAt,
            scope,
            filterSummary,
            summary: buildSummary(pageModel, rows),
            rows: Object.freeze(rows),
            columns: Object.freeze([
                { key: 'status', label: 'Situação', width: 22, align: 'center' },
                { key: 'schoolName', label: 'Unidade escolar', width: 34, align: 'left' },
                { key: 'schoolDesignation', label: 'Designação', width: 14, align: 'center' },
                { key: 'ra', label: 'R.A.', width: 12, align: 'center' },
                { key: 'controllerName', label: 'Controlador', width: 24, align: 'left' },
                { key: 'competence', label: 'Competência', width: 14, align: 'center' },
                { key: 'programName', label: 'Programa', width: 26, align: 'left' },
                { key: 'documentName', label: 'Documento', width: 28, align: 'left' },
                { key: 'item', label: 'Item', width: 28, align: 'left' },
                { key: 'errors', label: 'Pendência / erros atuais', width: 42, align: 'left' },
                { key: 'observation', label: 'Observação', width: 42, align: 'left' },
                { key: 'nextAction', label: 'Próxima ação', width: 32, align: 'left' },
                { key: 'nextActor', label: 'Responsável', width: 16, align: 'center' },
                { key: 'openedAt', label: 'Abertura', width: 14, align: 'center', type: 'date' },
                { key: 'waitingSince', label: 'Aguardando desde', width: 16, align: 'center', type: 'date' },
                { key: 'ageDays', label: 'Dias aguardando', width: 16, align: 'center', type: 'number' },
                { key: 'latestSubmissionAt', label: 'Último envio', width: 14, align: 'center', type: 'date' },
                { key: 'latestMovementAt', label: 'Última movimentação', width: 18, align: 'center', type: 'date' },
                { key: 'latestMovement', label: 'Movimentação mais recente', width: 32, align: 'left' },
                { key: 'attemptCount', label: 'Tentativas', width: 12, align: 'center', type: 'number' },
                { key: 'resolvedAt', label: 'Resolução', width: 14, align: 'center', type: 'date' },
                { key: 'cancelledAt', label: 'Cancelamento', width: 14, align: 'center', type: 'date' },
                { key: 'cancelJustification', label: 'Justificativa do cancelamento', width: 38, align: 'left' }
            ])
        });
    }

    return Object.freeze({
        STATUS_ORDER,
        VERSION,
        buildRows,
        buildWorkbookModel,
        formatCompetence
    });
}));
