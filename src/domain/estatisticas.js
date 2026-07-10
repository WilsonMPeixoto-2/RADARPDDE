(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarEstatisticas = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const STATUS_KEYS = Object.freeze([
        'apta',
        'inapta',
        'emAndamento',
        'naoAnalisada',
        'foraEscopo'
    ]);

    function createEmptyCounts() {
        return {
            apta: 0,
            inapta: 0,
            emAndamento: 0,
            naoAnalisada: 0,
            foraEscopo: 0,
            total: 0
        };
    }

    function normalizeStatus(value) {
        const normalized = String(value ?? '').trim();
        const aliases = {
            apto: 'apta',
            apta: 'apta',
            inapto: 'inapta',
            inapta: 'inapta',
            'em-andamento': 'emAndamento',
            emAndamento: 'emAndamento',
            naoAnalisado: 'naoAnalisada',
            naoAnalisada: 'naoAnalisada',
            'nao-analisado': 'naoAnalisada',
            foraEscopo: 'foraEscopo',
            'fora-escopo': 'foraEscopo'
        };

        return aliases[normalized] || null;
    }

    function calculateRate(part, total) {
        if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
            return 0;
        }

        return Number(((part / total) * 100).toFixed(2));
    }

    function summarizeStatuses(items, options = {}) {
        const counts = createEmptyCounts();
        const getStatus = typeof options.getStatus === 'function'
            ? options.getStatus
            : item => item && item.status;

        for (const item of Array.isArray(items) ? items : []) {
            const normalizedStatus = normalizeStatus(getStatus(item));

            if (!normalizedStatus) {
                continue;
            }

            counts[normalizedStatus] += 1;
            counts.total += 1;
        }

        const activeTotal = counts.total - counts.foraEscopo;

        return Object.freeze({
            ...counts,
            activeTotal,
            rates: Object.freeze({
                apta: calculateRate(counts.apta, activeTotal),
                inapta: calculateRate(counts.inapta, activeTotal),
                emAndamento: calculateRate(counts.emAndamento, activeTotal),
                naoAnalisada: calculateRate(counts.naoAnalisada, activeTotal),
                foraEscopo: calculateRate(counts.foraEscopo, counts.total)
            })
        });
    }

    function calculateSchoolStats(schools, options = {}) {
        return summarizeStatuses(schools, {
            getStatus: options.getStatus || (school => school && school.status)
        });
    }

    function calculateProgramStats(programRecords, options = {}) {
        return summarizeStatuses(programRecords, {
            getStatus: options.getStatus || (record => record && record.status)
        });
    }

    function buildStatisticsSnapshot({ schools = [], programRecords = [] } = {}, options = {}) {
        return Object.freeze({
            schools: calculateSchoolStats(schools, options.schools),
            programs: calculateProgramStats(programRecords, options.programs)
        });
    }

    return Object.freeze({
        STATUS_KEYS,
        buildStatisticsSnapshot,
        calculateProgramStats,
        calculateRate,
        calculateSchoolStats,
        normalizeStatus,
        summarizeStatuses
    });
}));
