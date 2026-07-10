(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarCompetencia = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const COMPETENCIA_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
    const MONTH_NAMES_PT_BR = Object.freeze([
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

    const FORMATTERS = Object.freeze({
        display: ({ year, month, monthName }) => `${monthName}/${year}`,
        numeric: ({ year, month }) => `${month}/${year}`,
        long: ({ year, monthName }) => `${monthName} de ${year}`,
        iso: ({ key }) => key,
        filename: ({ key }) => key,
        compactFilename: ({ year, month }) => `${year}_${month}`
    });

    function normalizeText(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function splitCompetenciaContext(value) {
        const normalized = normalizeText(value);
        const separatorIndex = normalized.indexOf('_');

        if (separatorIndex === -1) {
            return Object.freeze({
                raw: normalized,
                competenciaKey: normalized,
                contextId: ''
            });
        }

        return Object.freeze({
            raw: normalized,
            competenciaKey: normalized.slice(0, separatorIndex),
            contextId: normalized.slice(separatorIndex + 1)
        });
    }

    function getBaseCompetenciaKey(value) {
        return splitCompetenciaContext(value).competenciaKey;
    }

    function isValidCompetenciaKey(value) {
        return COMPETENCIA_KEY_PATTERN.test(getBaseCompetenciaKey(value));
    }

    function parseCompetencia(value) {
        const key = getBaseCompetenciaKey(value);
        const match = COMPETENCIA_KEY_PATTERN.exec(key);

        if (!match) {
            return null;
        }

        const year = Number(match[1]);
        const monthNumber = Number(match[2]);

        return Object.freeze({
            key,
            year,
            month: match[2],
            monthNumber,
            monthName: MONTH_NAMES_PT_BR[monthNumber - 1],
            sortValue: (year * 100) + monthNumber
        });
    }

    function formatCompetencia(value, format = 'display', options = {}) {
        const parsed = parseCompetencia(value);

        if (!parsed) {
            if (options.strict === true) {
                throw new TypeError(`Competência inválida: ${String(value ?? '')}`);
            }

            return options.fallback !== undefined
                ? String(options.fallback)
                : normalizeText(value);
        }

        const formatter = FORMATTERS[format];

        if (!formatter) {
            throw new RangeError(`Formato de competência desconhecido: ${format}`);
        }

        return formatter(parsed);
    }

    function formatCompetenciaContext(value, options = {}) {
        const context = splitCompetenciaContext(value);
        const formattedCompetencia = formatCompetencia(
            context.competenciaKey,
            options.format || 'display',
            options
        );

        if (!context.contextId) {
            return formattedCompetencia;
        }

        const resolveContextLabel = typeof options.resolveContextLabel === 'function'
            ? options.resolveContextLabel
            : null;
        const contextLabel = resolveContextLabel
            ? resolveContextLabel(context.contextId)
            : context.contextId;

        if (!contextLabel) {
            return formattedCompetencia;
        }

        return `${formattedCompetencia}${options.separator || ' - '}${contextLabel}`;
    }

    function compareCompetencias(left, right) {
        const leftParsed = parseCompetencia(left);
        const rightParsed = parseCompetencia(right);

        if (!leftParsed || !rightParsed) {
            throw new TypeError('As duas competências devem utilizar o padrão YYYY-MM.');
        }

        return Math.sign(leftParsed.sortValue - rightParsed.sortValue);
    }

    function isCompetenciaInRange(value, start, end) {
        const parsedValue = parseCompetencia(value);
        const parsedStart = start ? parseCompetencia(start) : null;
        const parsedEnd = end ? parseCompetencia(end) : null;

        if (!parsedValue) {
            throw new TypeError('A competência consultada deve utilizar o padrão YYYY-MM.');
        }

        if (start && !parsedStart) {
            throw new TypeError('A competência inicial deve utilizar o padrão YYYY-MM.');
        }

        if (end && !parsedEnd) {
            throw new TypeError('A competência final deve utilizar o padrão YYYY-MM.');
        }

        if (parsedStart && parsedEnd && parsedStart.sortValue > parsedEnd.sortValue) {
            throw new RangeError('A competência inicial não pode ser posterior à competência final.');
        }

        const afterStart = !parsedStart || parsedValue.sortValue >= parsedStart.sortValue;
        const beforeEnd = !parsedEnd || parsedValue.sortValue <= parsedEnd.sortValue;

        return afterStart && beforeEnd;
    }

    return Object.freeze({
        MONTH_NAMES_PT_BR,
        compareCompetencias,
        formatCompetencia,
        formatCompetenciaContext,
        getBaseCompetenciaKey,
        isCompetenciaInRange,
        isValidCompetenciaKey,
        parseCompetencia,
        splitCompetenciaContext
    });
}));
