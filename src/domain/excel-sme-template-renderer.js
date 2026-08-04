(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeTemplateRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '3.0.0';
    const FIRST_DATA_ROW = 2;
    const FIRST_MONTHLY_COLUMN = 5;
    const LAST_COLUMN = 30;
    const LAST_COLUMN_LETTER = 'AD';
    const TEMPLATE_SHEET_NAME = 'DEZEMBRO';

    function createRendererError(code, message, details = null, cause = null) {
        const error = new Error(message);
        error.code = code;
        if (details) error.details = details;
        if (cause) error.cause = cause;
        return error;
    }

    function validateModel(model) {
        if (!model || !Array.isArray(model.columns) || model.columns.length !== LAST_COLUMN) {
            throw createRendererError(
                'SME_MODEL_INVALID',
                'Modelo mensal do Excel SME inválido: são esperadas 30 colunas.'
            );
        }
        if (!Array.isArray(model.rows) || !model.sheetName || !model.fileName || !model.competenceKey) {
            throw createRendererError(
                'SME_MODEL_INVALID',
                'Modelo mensal do Excel SME incompleto.'
            );
        }
        if (model.competence?.sheetName && model.competence.sheetName !== model.sheetName) {
            throw createRendererError(
                'SME_COMPETENCE_MISMATCH',
                'A competência do modelo não corresponde ao nome da aba do Excel SME.'
            );
        }
    }

    function resolveExcelJs(options = {}) {
        if (options.ExcelJS && typeof options.ExcelJS.Workbook === 'function') return options.ExcelJS;
        if (root?.ExcelJS && typeof root.ExcelJS.Workbook === 'function') return root.ExcelJS;
        if (typeof module === 'object' && module.exports) {
            const candidate = require('exceljs');
            if (candidate && typeof candidate.Workbook === 'function') return candidate;
        }
        throw createRendererError(
            'SME_EXCELJS_CONTRACT_INVALID',
            'ExcelJS não foi carregado para gerar o Excel SME.'
        );
    }

    function normalizeBytes(value) {
        if (value instanceof Uint8Array) return value;
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value)) {
            return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        }
        throw createRendererError(
            'SME_TEMPLATE_INVALID',
            'O template do Excel SME não foi fornecido em formato binário válido.'
        );
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

    function captureCellPresentation(cell) {
        return Object.freeze({
            style: cloneValue(cell.style) || {},
            numFmt: cell.numFmt,
            alignment: cloneValue(cell.alignment) || {},
            border: cloneValue(cell.border) || {},
            fill: cloneValue(cell.fill) || {},
            font: cloneValue(cell.font) || {},
            protection: cloneValue(cell.protection) || {}
        });
    }

    function applyCellPresentation(presentation, target) {
        target.style = cloneValue(presentation?.style) || {};
        target.numFmt = presentation?.numFmt;
        target.alignment = cloneValue(presentation?.alignment) || {};
        target.border = cloneValue(presentation?.border) || {};
        target.fill = cloneValue(presentation?.fill) || {};
        target.font = cloneValue(presentation?.font) || {};
        target.protection = cloneValue(presentation?.protection) || {};
    }

    function applyCellAlignment(cell, alignment) {
        cell.style = cloneValue(cell.style) || {};
        cell.alignment = cloneValue(alignment) || {};
    }

    function captureRowPresentation(row) {
        const cells = [];
        for (let column = 1; column <= LAST_COLUMN; column += 1) {
            cells.push(captureCellPresentation(row.getCell(column)));
        }
        return Object.freeze({
            height: row.height,
            hidden: row.hidden,
            outlineLevel: row.outlineLevel,
            cells: Object.freeze(cells)
        });
    }

    function applyRowPresentation(presentation, targetRow) {
        targetRow.height = presentation?.height;
        targetRow.hidden = presentation?.hidden;
        targetRow.outlineLevel = presentation?.outlineLevel || 0;
        for (let column = 1; column <= LAST_COLUMN; column += 1) {
            applyCellPresentation(presentation?.cells?.[column - 1], targetRow.getCell(column));
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
        const actual = model.columns.map((column, index) => (
            column.mergedHeader ? '' : (worksheet.getRow(1).getCell(index + 1).value || '')
        ));
        const expected = model.columns.map(column => column.label);
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw createRendererError(
                'SME_TEMPLATE_CONTRACT_MISMATCH',
                'O template do Excel SME diverge dos 30 textos canônicos do documento original.'
            );
        }
        if (!worksheet.getCell('A1').isMerged || !worksheet.getCell('B1').isMerged) {
            throw createRendererError(
                'SME_TEMPLATE_CONTRACT_MISMATCH',
                'O template do Excel SME perdeu a mesclagem canônica CRE em A1:B1.'
            );
        }
    }

    function assertUniqueTemplateDesignations(worksheet) {
        const rows = new Map();
        for (let rowNumber = FIRST_DATA_ROW; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const designation = normalizeDesignation(worksheet.getRow(rowNumber).getCell(3).value);
            if (!designation) continue;
            const previousRow = rows.get(designation);
            if (previousRow) {
                throw createRendererError(
                    'SME_TEMPLATE_DUPLICATE_DESIGNATION',
                    `O template do Excel SME contém a designação ${designation} em mais de uma linha.`,
                    { designation, firstRow: previousRow, secondRow: rowNumber }
                );
            }
            rows.set(designation, rowNumber);
        }
        return rows;
    }

    function formatDesignation(value) {
        const digits = String(value == null ? '' : value).replace(/\D/g, '');
        if (!digits) return String(value == null ? '' : value).trim();
        const numeric = Number.parseInt(digits, 10);
        return Number.isSafeInteger(numeric) ? numeric : digits;
    }

    function formatCre(value) {
        const text = String(value == null ? '' : value).trim();
        return text.replace(/\s*CRE$/i, '').trim();
    }

    function formatDenomination(value) {
        const text = String(value == null ? '' : value).trim();
        return text
            .replace(/^Escola Municipal\s+/i, 'EM ')
            .replace(/^Espaço de Desenvolvimento Infantil\s+/i, 'EDI ')
            .replace(/^Centro Integrado de Educação Pública\s+/i, 'CIEP ')
            .toUpperCase();
    }

    function writeModelRow(worksheet, rowNumber, model, modelRow, presentation) {
        const target = worksheet.getRow(rowNumber);
        applyRowPresentation(presentation, target);
        target.getCell(1).value = modelRow.order;
        target.getCell(2).value = formatCre(modelRow.cre);
        target.getCell(3).value = formatDesignation(modelRow.designation);
        target.getCell(4).value = formatDenomination(modelRow.denomination);

        for (let index = FIRST_MONTHLY_COLUMN - 1; index < model.columns.length; index += 1) {
            const column = model.columns[index];
            const value = modelRow[column.key];
            target.getCell(index + 1).value = value == null || value === '' ? null : value;
        }
        target.commit?.();
    }

    function rebuildDataRows(worksheet, model) {
        const sourceRow = worksheet.getRow(FIRST_DATA_ROW);
        const presentation = captureRowPresentation(sourceRow);
        const rowsToRemove = Math.max(0, worksheet.rowCount - FIRST_DATA_ROW + 1);
        if (rowsToRemove) worksheet.spliceRows(FIRST_DATA_ROW, rowsToRemove);

        model.rows.forEach((modelRow, index) => {
            writeModelRow(worksheet, FIRST_DATA_ROW + index, model, modelRow, presentation);
        });
    }

    function configureWorksheet(worksheet, model) {
        worksheet.name = model.sheetName;
        worksheet.state = 'visible';
        worksheet.dataValidations.model = {};
        delete worksheet.properties.outlineProperties;
        worksheet.views = [{
            state: 'frozen',
            xSplit: 4,
            ySplit: 1,
            topLeftCell: 'E2',
            activeCell: 'E2'
        }];
        const finalRow = Math.max(FIRST_DATA_ROW, FIRST_DATA_ROW + model.rows.length - 1);
        const descriptiveAlignment = {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true,
            indent: 1
        };
        const categoricalAlignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
        };
        for (let rowNumber = FIRST_DATA_ROW; rowNumber <= finalRow; rowNumber += 1) {
            applyCellAlignment(worksheet.getCell(rowNumber, 4), descriptiveAlignment);
            applyCellAlignment(worksheet.getCell(rowNumber, 29), categoricalAlignment);
            applyCellAlignment(worksheet.getCell(rowNumber, 30), descriptiveAlignment);
        }
        worksheet.autoFilter = `A1:${LAST_COLUMN_LETTER}${finalRow}`;
        worksheet.pageSetup = {
            ...worksheet.pageSetup,
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            printArea: `A$1:${LAST_COLUMN_LETTER}$${finalRow}`,
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

    function configureWorkbook(workbook) {
        workbook.views = [{
            x: 0,
            y: 0,
            width: 24000,
            height: 12000,
            firstSheet: 0,
            activeTab: 0,
            visibility: 'visible'
        }];
    }

    async function buildWorkbook(model, options = {}) {
        validateModel(model);
        const ExcelJS = resolveExcelJs(options);
        const templateBytes = normalizeBytes(options.templateBytes);
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(templateBytes);
        } catch (error) {
            throw createRendererError(
                'SME_TEMPLATE_PARSE_FAILED',
                'O template Excel SME não pôde ser aberto.',
                { bytes: templateBytes.length },
                error
            );
        }
        const worksheet = findTemplateSheet(workbook);
        if (!worksheet) {
            throw createRendererError(
                'SME_TEMPLATE_CONTRACT_MISMATCH',
                'O template do Excel SME não possui uma planilha utilizável.'
            );
        }

        keepOnlySheet(workbook, worksheet);
        verifyHeaderContract(worksheet, model);
        assertUniqueTemplateDesignations(worksheet);
        rebuildDataRows(worksheet, model);
        configureWorksheet(worksheet, model);
        configureWorkbook(workbook);
        workbook.creator = 'RADAR PDDE';
        workbook.lastModifiedBy = 'RADAR PDDE';
        const referenceDate = new Date(Date.UTC(model.competence.year, model.competence.month - 1, 1));
        workbook.created = referenceDate;
        workbook.modified = referenceDate;
        return workbook;
    }

    async function renderWorkbook(model, options = {}) {
        const workbook = await buildWorkbook(model, options);
        try {
            const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
            return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        } catch (error) {
            throw createRendererError(
                'SME_SERIALIZATION_FAILED',
                'O arquivo Excel SME não pôde ser finalizado.',
                null,
                error
            );
        }
    }

    async function downloadWorkbook(model, options = {}) {
        const bytes = await renderWorkbook(model, options);
        const fileName = options.fileName || model.fileName;
        if (!root?.document || typeof root.URL?.createObjectURL !== 'function') {
            return { bytes, fileName, size: bytes.length };
        }

        let url = null;
        try {
            const blob = new Blob([bytes], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            url = root.URL.createObjectURL(blob);
            const link = root.document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            root.document.body.appendChild(link);
            link.click();
            link.remove();
            root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
            return { bytes, blob, url, fileName, size: bytes.length };
        } catch (error) {
            if (url) root.URL.revokeObjectURL?.(url);
            throw createRendererError(
                'SME_DOWNLOAD_FAILED',
                'O download do arquivo Excel SME não pôde ser iniciado.',
                { fileName },
                error
            );
        }
    }

    return Object.freeze({
        FIRST_DATA_ROW,
        FIRST_MONTHLY_COLUMN,
        LAST_COLUMN,
        LAST_COLUMN_LETTER,
        VERSION,
        assertUniqueTemplateDesignations,
        buildWorkbook,
        createRendererError,
        downloadWorkbook,
        formatCre,
        formatDenomination,
        formatDesignation,
        normalizeDesignation,
        renderWorkbook
    });
}));
