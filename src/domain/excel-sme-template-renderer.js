(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeTemplateRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '2.0.0';
    const FIRST_DATA_ROW = 2;
    const FIRST_MONTHLY_COLUMN = 5;
    const LAST_COLUMN = 30;
    const LAST_COLUMN_LETTER = 'AD';
    const TEMPLATE_SHEET_NAME = 'DEZEMBRO';

    function validateModel(model) {
        if (!model || !Array.isArray(model.columns) || model.columns.length !== LAST_COLUMN) {
            throw new TypeError('Modelo mensal do Excel SME inválido: são esperadas 30 colunas.');
        }
        if (!Array.isArray(model.rows) || !model.sheetName || !model.fileName) {
            throw new TypeError('Modelo mensal do Excel SME incompleto.');
        }
    }

    function resolveExcelJs(options = {}) {
        if (options.ExcelJS && typeof options.ExcelJS.Workbook === 'function') return options.ExcelJS;
        if (root?.ExcelJS && typeof root.ExcelJS.Workbook === 'function') return root.ExcelJS;
        if (typeof module === 'object' && module.exports) {
            const candidate = require('exceljs');
            if (candidate && typeof candidate.Workbook === 'function') return candidate;
        }
        throw new Error('ExcelJS não foi carregado para gerar o Excel SME.');
    }

    function normalizeBytes(value) {
        if (value instanceof Uint8Array) return value;
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value)) {
            return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        }
        throw new TypeError('O template do Excel SME não foi fornecido em formato binário válido.');
    }

    function normalizeDesignation(value) {
        const digits = String(value == null ? '' : value).replace(/\D/g, '');
        if (!digits) return '';
        const numeric = Number.parseInt(digits, 10);
        return Number.isSafeInteger(numeric) ? String(numeric) : digits.replace(/^0+/, '');
    }

    function cloneValue(value) {
        if (value == null || typeof value !== 'object') return value;
        return JSON.parse(JSON.stringify(value));
    }

    function copyCellPresentation(source, target) {
        target.style = cloneValue(source.style) || {};
        target.numFmt = source.numFmt;
        target.alignment = cloneValue(source.alignment) || {};
        target.border = cloneValue(source.border) || {};
        target.fill = cloneValue(source.fill) || {};
        target.font = cloneValue(source.font) || {};
        target.protection = cloneValue(source.protection) || {};
        target.dataValidation = cloneValue(source.dataValidation) || {};
    }

    function copyRowPresentation(sourceRow, targetRow) {
        targetRow.height = sourceRow.height;
        targetRow.hidden = sourceRow.hidden;
        targetRow.outlineLevel = sourceRow.outlineLevel;
        for (let column = 1; column <= LAST_COLUMN; column += 1) {
            copyCellPresentation(sourceRow.getCell(column), targetRow.getCell(column));
        }
    }

    function findTemplateSheet(workbook) {
        return workbook.getWorksheet(TEMPLATE_SHEET_NAME) || workbook.worksheets[0] || null;
    }

    function keepOnlySheet(workbook, worksheet) {
        for (const candidate of [...workbook.worksheets]) {
            if (candidate.id !== worksheet.id) workbook.removeWorksheet(candidate.id);
        }
    }

    function verifyHeaderContract(worksheet, model) {
        const actual = model.columns.map((_, index) => (
            worksheet.getRow(1).getCell(index + 1).value || ''
        ));
        const expected = model.columns.map(column => column.label);
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error('O template do Excel SME diverge dos 30 textos canônicos do documento original.');
        }
        if (!worksheet.getCell('A1').isMerged || !worksheet.getCell('B1').isMerged) {
            throw new Error('O template do Excel SME perdeu a mesclagem canônica CRE em A1:B1.');
        }
    }

    function buildTemplateRowMap(worksheet) {
        const rows = new Map();
        for (let rowNumber = FIRST_DATA_ROW; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const designation = normalizeDesignation(worksheet.getRow(rowNumber).getCell(3).value);
            if (designation && !rows.has(designation)) rows.set(designation, rowNumber);
        }
        return rows;
    }

    function clearMonthlyValues(worksheet) {
        for (let rowNumber = FIRST_DATA_ROW; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const row = worksheet.getRow(rowNumber);
            for (let column = FIRST_MONTHLY_COLUMN; column <= LAST_COLUMN; column += 1) {
                row.getCell(column).value = null;
            }
        }
    }

    function formatFallbackDesignation(value) {
        const digits = String(value == null ? '' : value).replace(/\D/g, '');
        if (!digits) return String(value == null ? '' : value);
        const numeric = Number.parseInt(digits, 10);
        return Number.isSafeInteger(numeric) ? numeric : digits;
    }

    function formatFallbackCre(value) {
        const text = String(value == null ? '' : value).trim();
        return text.replace(/\s*CRE$/i, '').trim();
    }

    function appendFallbackRow(worksheet, modelRow, presentationRowNumber) {
        const rowNumber = worksheet.rowCount + 1;
        const row = worksheet.getRow(rowNumber);
        const source = worksheet.getRow(presentationRowNumber);
        copyRowPresentation(source, row);
        row.getCell(1).value = modelRow.order;
        row.getCell(2).value = formatFallbackCre(modelRow.cre);
        row.getCell(3).value = formatFallbackDesignation(modelRow.designation);
        row.getCell(4).value = modelRow.denomination;
        row.commit?.();
        return rowNumber;
    }

    function writeModelRow(worksheet, rowNumber, model, modelRow) {
        const target = worksheet.getRow(rowNumber);
        for (let index = FIRST_MONTHLY_COLUMN - 1; index < model.columns.length; index += 1) {
            const column = model.columns[index];
            const value = modelRow[column.key];
            target.getCell(index + 1).value = value == null || value === '' ? null : value;
        }
    }

    function configureWorksheet(worksheet, model) {
        worksheet.name = model.sheetName;
        worksheet.views = [{
            state: 'frozen',
            xSplit: 4,
            ySplit: 1,
            topLeftCell: 'E2',
            activeCell: 'E2'
        }];
        const finalRow = Math.max(FIRST_DATA_ROW, worksheet.rowCount);
        worksheet.autoFilter = `A1:${LAST_COLUMN_LETTER}${finalRow}`;
        worksheet.pageSetup = {
            ...worksheet.pageSetup,
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            printArea: `A1:${LAST_COLUMN_LETTER}${finalRow}`,
            printTitlesRow: '1:1',
            margins: {
                left: 0.25,
                right: 0.25,
                top: 0.5,
                bottom: 0.5,
                header: 0.2,
                footer: 0.2
            }
        };
    }

    async function buildWorkbook(model, options = {}) {
        validateModel(model);
        const ExcelJS = resolveExcelJs(options);
        const templateBytes = normalizeBytes(options.templateBytes);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(templateBytes);
        const worksheet = findTemplateSheet(workbook);
        if (!worksheet) throw new Error('O template do Excel SME não possui uma planilha utilizável.');

        keepOnlySheet(workbook, worksheet);
        verifyHeaderContract(worksheet, model);
        const templateRows = buildTemplateRowMap(worksheet);
        clearMonthlyValues(worksheet);
        const presentationRowNumber = templateRows.values().next().value || FIRST_DATA_ROW;

        for (const modelRow of model.rows) {
            const designation = normalizeDesignation(modelRow.designation);
            const rowNumber = templateRows.get(designation)
                || appendFallbackRow(worksheet, modelRow, presentationRowNumber);
            writeModelRow(worksheet, rowNumber, model, modelRow);
        }

        configureWorksheet(worksheet, model);
        workbook.creator = 'RADAR PDDE';
        workbook.lastModifiedBy = 'RADAR PDDE';
        const referenceDate = new Date(Date.UTC(model.competence.year, model.competence.month - 1, 1));
        workbook.created = referenceDate;
        workbook.modified = referenceDate;
        return workbook;
    }

    async function renderWorkbook(model, options = {}) {
        const workbook = await buildWorkbook(model, options);
        const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
        return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    }

    async function downloadWorkbook(model, options = {}) {
        const bytes = await renderWorkbook(model, options);
        const fileName = options.fileName || model.fileName;
        if (!root?.document || typeof root.URL?.createObjectURL !== 'function') {
            return { bytes, fileName, size: bytes.length };
        }
        const blob = new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = root.URL.createObjectURL(blob);
        const link = root.document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        root.document.body.appendChild(link);
        link.click();
        link.remove();
        root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
        return { bytes, blob, url, fileName, size: bytes.length };
    }

    return Object.freeze({
        FIRST_DATA_ROW,
        FIRST_MONTHLY_COLUMN,
        LAST_COLUMN,
        LAST_COLUMN_LETTER,
        VERSION,
        buildWorkbook,
        downloadWorkbook,
        normalizeDesignation,
        renderWorkbook
    });
}));
