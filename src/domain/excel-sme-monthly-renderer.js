(function (root, factory) {
    const ExcelJS = typeof module === 'object' && module.exports
        ? require('exceljs')
        : root && root.ExcelJS;
    const api = factory(root, ExcelJS);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeMonthlyRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, ExcelJS) {
    'use strict';

    if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
        throw new Error('ExcelJS não foi carregado para gerar o Excel SME.');
    }

    const VERSION = '2.0.0';
    const LAST_COLUMN = 'AD';
    const COLORS = Object.freeze({
        identity: 'FF8DB4E2',
        basic: 'FFF4CCCC',
        quality: 'FFD9EAD3',
        equity: 'FFE4DFEC',
        administrative: 'FF8DB4E2',
        status: 'FFF4CCCC',
        border: 'FF7F8C8D',
        alternate: 'FFF7F9FC',
        text: 'FF1F2937',
        positive: 'FFE2F0D9',
        positiveText: 'FF2E6B2E',
        negative: 'FFF4CCCC',
        negativeText: 'FF9C0006'
    });

    function validateModel(model) {
        if (!model || !Array.isArray(model.columns) || model.columns.length !== 30) {
            throw new TypeError('Modelo mensal do Excel SME inválido: são esperadas 30 colunas.');
        }
        if (!Array.isArray(model.rows) || !model.sheetName || !model.fileName) {
            throw new TypeError('Modelo mensal do Excel SME incompleto.');
        }
    }

    function groupFill(column, columnIndex) {
        if (columnIndex === 25) return COLORS.status;
        if (column.group === 'BASIC') return COLORS.basic;
        if (column.group === 'QUALIDADE') return COLORS.quality;
        if (column.group === 'EQUIDADE') return COLORS.equity;
        if (column.group === 'ADMINISTRATIVO') return COLORS.administrative;
        return COLORS.identity;
    }

    function borderStyle() {
        return {
            top: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
        };
    }

    function styleHeader(worksheet, model) {
        const row = worksheet.getRow(1);
        row.height = 105;
        model.columns.forEach((column, index) => {
            const cell = row.getCell(index + 1);
            cell.value = column.label;
            cell.font = {
                name: 'Arial',
                size: 8,
                bold: true,
                color: { argb: COLORS.text }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: groupFill(column, index) }
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
                shrinkToFit: true
            };
            cell.border = borderStyle();
        });
        worksheet.mergeCells('A1:B1');
        worksheet.getCell('A1').alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
        };
    }

    function styleBodyCell(cell, column, rowIndex) {
        cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } };
        cell.alignment = {
            horizontal: column.alignment === 'left' ? 'left' : 'center',
            vertical: 'middle',
            wrapText: true
        };
        cell.border = borderStyle();
        if (rowIndex % 2 === 0) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: COLORS.alternate }
            };
        }
    }

    function styleStatus(cell) {
        const value = String(cell.value || '').toUpperCase();
        if (value === 'APTA') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.positiveText } };
        } else if (value === 'INAPTA') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.negative } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.negativeText } };
        }
    }

    function buildWorkbook(model) {
        validateModel(model);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'RADAR PDDE';
        workbook.lastModifiedBy = 'RADAR PDDE';
        const referenceDate = new Date(Date.UTC(model.competence.year, model.competence.month - 1, 1));
        workbook.created = referenceDate;
        workbook.modified = referenceDate;
        workbook.calcProperties.fullCalcOnLoad = false;

        const worksheet = workbook.addWorksheet(model.sheetName, {
            properties: { defaultRowHeight: 20 },
            views: [{
                state: 'frozen',
                xSplit: 4,
                ySplit: 1,
                topLeftCell: 'E2',
                activeCell: 'E2'
            }],
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: {
                    left: 0.511811024,
                    right: 0.511811024,
                    top: 0.787401575,
                    bottom: 0.787401575,
                    header: 0.31496062,
                    footer: 0.31496062
                }
            }
        });

        worksheet.columns = model.columns.map(column => ({
            key: column.key,
            width: column.width,
            style: { font: { name: 'Arial', size: 9 } }
        }));

        styleHeader(worksheet, model);

        model.rows.forEach((source, index) => {
            const row = worksheet.getRow(index + 2);
            row.height = 24;
            model.columns.forEach((column, columnIndex) => {
                const cell = row.getCell(columnIndex + 1);
                const value = source[column.key];
                cell.value = value == null ? '' : value;
                styleBodyCell(cell, column, index);
                if (column.key === 'designation' && typeof cell.value === 'number') {
                    cell.numFmt = '0';
                }
                if (column.key === 'status') styleStatus(cell);
            });
        });

        const lastRow = Math.max(2, model.rows.length + 1);
        worksheet.autoFilter = `A1:${LAST_COLUMN}${lastRow}`;
        worksheet.pageSetup.printArea = `A1:${LAST_COLUMN}${lastRow}`;
        worksheet.pageSetup.printTitlesRow = '1:1';

        return workbook;
    }

    async function renderWorkbook(model) {
        const workbook = buildWorkbook(model);
        const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
        return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    }

    async function downloadWorkbook(model, options = {}) {
        const bytes = await renderWorkbook(model);
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
        COLORS,
        VERSION,
        buildWorkbook,
        downloadWorkbook,
        renderWorkbook
    });
}));
