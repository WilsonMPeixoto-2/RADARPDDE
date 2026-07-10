(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarCsv = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const FORMULA_PREFIX_PATTERN = /^[\t\r ]*[=+\-@]/;
    const DEFAULT_DELIMITER = ';';
    const DEFAULT_LINE_ENDING = '\r\n';
    const UTF8_BOM = '\uFEFF';

    function validateDelimiter(delimiter) {
        if (typeof delimiter !== 'string' || delimiter.length !== 1) {
            throw new TypeError('O delimitador do CSV deve conter exatamente um caractere.');
        }

        if (delimiter === '"' || delimiter === '\r' || delimiter === '\n') {
            throw new RangeError('O delimitador do CSV não pode ser aspas ou quebra de linha.');
        }

        return delimiter;
    }

    function normalizeLineEnding(lineEnding) {
        if (lineEnding !== '\n' && lineEnding !== '\r\n') {
            throw new RangeError('A quebra de linha deve ser LF ou CRLF.');
        }

        return lineEnding;
    }

    function normalizeCellValue(value) {
        if (value === null || value === undefined) {
            return '';
        }

        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                return '';
            }

            return value.toISOString();
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (error) {
                return String(value);
            }
        }

        return String(value);
    }

    function protectSpreadsheetFormula(value, options = {}) {
        const enabled = options.enabled !== false;
        const originalType = options.originalType || typeof value;
        const normalized = normalizeCellValue(value);

        if (!enabled || originalType !== 'string') {
            return normalized;
        }

        return FORMULA_PREFIX_PATTERN.test(normalized)
            ? `'${normalized}`
            : normalized;
    }

    function escapeCsvCell(value, options = {}) {
        const delimiter = validateDelimiter(options.delimiter || DEFAULT_DELIMITER);
        const normalized = protectSpreadsheetFormula(value, {
            enabled: options.protectFormulas !== false,
            originalType: typeof value
        });
        const escaped = normalized.replace(/"/g, '""');
        const requiresQuotes = options.alwaysQuote === true
            || escaped.includes(delimiter)
            || escaped.includes('"')
            || escaped.includes('\r')
            || escaped.includes('\n');

        return requiresQuotes ? `"${escaped}"` : escaped;
    }

    function normalizeColumns(columns) {
        if (columns === undefined || columns === null) {
            return null;
        }

        if (!Array.isArray(columns) || columns.length === 0) {
            throw new TypeError('As colunas do CSV devem ser informadas em uma lista não vazia.');
        }

        return columns.map((column, index) => {
            if (typeof column === 'string' && column.trim()) {
                return Object.freeze({
                    key: column,
                    label: column,
                    getValue: null,
                    format: null
                });
            }

            if (!column || typeof column !== 'object') {
                throw new TypeError(`Coluna inválida na posição ${index}.`);
            }

            const key = typeof column.key === 'string' ? column.key.trim() : '';
            const getValue = typeof column.getValue === 'function' ? column.getValue : null;

            if (!key && !getValue) {
                throw new TypeError(`A coluna ${index} deve possuir key ou getValue.`);
            }

            return Object.freeze({
                key,
                label: column.label !== undefined ? String(column.label) : key,
                getValue,
                format: typeof column.format === 'function' ? column.format : null
            });
        });
    }

    function resolveObjectRow(row, columns, rowIndex) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            throw new TypeError(`A linha ${rowIndex} deve ser um objeto quando columns é utilizado.`);
        }

        return columns.map(column => {
            const rawValue = column.getValue
                ? column.getValue(row, rowIndex)
                : row[column.key];

            return column.format
                ? column.format(rawValue, row, rowIndex)
                : rawValue;
        });
    }

    function serializeCsv(rows, options = {}) {
        if (!Array.isArray(rows)) {
            throw new TypeError('As linhas do CSV devem ser informadas em uma lista.');
        }

        const delimiter = validateDelimiter(options.delimiter || DEFAULT_DELIMITER);
        const lineEnding = normalizeLineEnding(options.lineEnding || DEFAULT_LINE_ENDING);
        const columns = normalizeColumns(options.columns);
        const includeHeader = columns && options.includeHeader !== false;
        const serializedRows = [];
        const cellOptions = {
            delimiter,
            protectFormulas: options.protectFormulas !== false,
            alwaysQuote: options.alwaysQuote === true
        };

        if (includeHeader) {
            serializedRows.push(columns.map(column => escapeCsvCell(column.label, cellOptions)).join(delimiter));
        }

        rows.forEach((row, rowIndex) => {
            const values = columns
                ? resolveObjectRow(row, columns, rowIndex)
                : row;

            if (!Array.isArray(values)) {
                throw new TypeError(`A linha ${rowIndex} deve ser uma lista quando columns não é utilizado.`);
            }

            serializedRows.push(values.map(value => escapeCsvCell(value, cellOptions)).join(delimiter));
        });

        let content = serializedRows.join(lineEnding);

        if (options.finalLineBreak === true && serializedRows.length > 0) {
            content += lineEnding;
        }

        return options.includeBom === false ? content : `${UTF8_BOM}${content}`;
    }

    return Object.freeze({
        DEFAULT_DELIMITER,
        DEFAULT_LINE_ENDING,
        FORMULA_PREFIX_PATTERN,
        UTF8_BOM,
        escapeCsvCell,
        normalizeCellValue,
        protectSpreadsheetFormula,
        serializeCsv,
        validateDelimiter
    });
}));
