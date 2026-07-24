(function (root, factory) {
    const ExcelJS = typeof module === 'object' && module.exports
        ? require('exceljs')
        : root && root.ExcelJS;
    const api = factory(root, ExcelJS);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeMonthlyRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, ExcelJS) {
    'use strict';

    const VERSION = '1.0.0';
    const HEADER_COLORS = Object.freeze({
        IDENTIFICAÇÃO: 'FF17365D',
        'PDDE BÁSICO': 'FF4F81BD',
        'PDDE QUALIDADE': 'FF70AD47',
        'PDDE EQUIDADE': 'FFED7D31',
        'INFORMAÇÕES COMPLEMENTARES': 'FF7F8C8D'
    });
    const BORDER_COLOR = 'FFB7C3D0';
    const ALTERNATE_FILL = 'FFF3F6F9';

    function requireExcelJs() {
        if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
            const error = new Error('ExcelJS não está disponível para gerar o Excel SME.');
            error.code = 'EXCELJS_UNAVAILABLE';
            throw error;
        }
        return ExcelJS;
    }

    function validateModel(model) {
        if (!model || !Array.isArray(model.columns) || model.columns.length !== 26) {
            throw new TypeError('Modelo mensal do Excel SME inválido.');
        }
        if (!Array.isArray(model.rows) || !model.sheetName || !model.fileName) {
            throw new TypeError('Modelo mensal do Excel SME incompleto.');
        }
    }

    function thinBorder() {
        const side = { style: 'thin', color: { argb: BORDER_COLOR } };
        return { top: side, left: side, bottom: side, right: side };
    }

    function headerColor(column) {
        return HEADER_COLORS[column.group] || HEADER_COLORS['INFORMAÇÕES COMPLEMENTARES'];
    }

    function styleHeaderCell(cell, column) {
        cell.font = {
            name: 'Arial',
            size: 9,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: headerColor(column) }
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true
        };
        cell.border = thinBorder();
    }

    function styleDataCell(cell, column, rowIndex) {
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
        cell.alignment = {
            horizontal: column.alignment || 'center',
            vertical: 'middle',
            wrapText: ['denomination', 'opinion', 'notes'].includes(column.key)
        };
        cell.border = thinBorder();
        if (rowIndex % 2 === 1) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: ALTERNATE_FILL }
            };
        }
    }

    function addDocumentValidations(worksheet, model) {
        const documentColumns = model.columns
            .map((column, index) => ({ column, index: index + 1 }))
            .filter(item => item.column.programKey);
        const firstDataRow = 2;
        const lastDataRow = Math.max(firstDataRow, model.rows.length + 1);
        documentColumns.forEach(({ index }) => {
            for (let row = firstDataRow; row <= lastDataRow; row += 1) {
                worksheet.getCell(row, index).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"SIM,NÃO,NÃO SE APLICA"']
                };
            }
        });
    }

    function createWorkbook(model, options = {}) {
        validateModel(model);
        const Excel = options.ExcelJS || requireExcelJs();
        const workbook = new Excel.Workbook();
        workbook.creator = options.creator || 'RADAR PDDE';
        workbook.lastModifiedBy = options.lastModifiedBy || 'RADAR PDDE';
        workbook.created = options.generatedAt ? new Date(options.generatedAt) : new Date();
        workbook.modified = workbook.created;
        workbook.calcProperties.fullCalcOnLoad = false;

        const worksheet = workbook.addWorksheet(model.sheetName, {
            properties: {
                defaultRowHeight: 20,
                tabColor: { argb: 'FF17365D' }
            },
            views: [{ state: 'frozen', xSplit: 4, ySplit: 1, showGridLines: false }],
            pageSetup: {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: {
                    left: 0.2,
                    right: 0.2,
                    top: 0.35,
                    bottom: 0.35,
                    header: 0.15,
                    footer: 0.15
                }
            }
        });
        worksheet.pageSetup.printTitlesRow = '1:1';
        worksheet.headerFooter.oddHeader = `&C&BCONTROLE DE BONIFICAÇÃO — ${model.sheetName} ${model.competence.year}`;
        worksheet.headerFooter.oddFooter = '&L4ª CRE&C&P de &N&RGerado pelo RADAR PDDE';

        worksheet.columns = model.columns.map(column => ({
            key: column.key,
            header: column.label,
            width: column.width
        }));

        const headerRow = worksheet.getRow(1);
        headerRow.height = 72;
        model.columns.forEach((column, index) => {
            styleHeaderCell(headerRow.getCell(index + 1), column);
        });

        model.rows.forEach((sourceRow, index) => {
            const row = worksheet.addRow(sourceRow);
            row.height = 24;
            model.columns.forEach((column, columnIndex) => {
                styleDataCell(row.getCell(columnIndex + 1), column, index);
            });
        });

        const lastRow = Math.max(1, model.rows.length + 1);
        worksheet.autoFilter = { from: 'A1', to: `Z${lastRow}` };
        worksheet.pageSetup.printArea = `A1:Z${lastRow}`;
        addDocumentValidations(worksheet, model);

        worksheet.getColumn('A').numFmt = '0';
        ['A', 'B', 'C'].forEach(letter => {
            worksheet.getColumn(letter).alignment = { horizontal: 'center', vertical: 'middle' };
        });

        return workbook;
    }

    async function renderWorkbook(model, options = {}) {
        const workbook = createWorkbook(model, options);
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    }

    async function downloadWorkbook(model, options = {}) {
        const bytes = await renderWorkbook(model, options);
        const fileName = options.fileName || model.fileName;
        if (!root?.document || typeof root.URL?.createObjectURL !== 'function') {
            return { bytes, fileName };
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
        return { bytes, blob, url, fileName };
    }

    return Object.freeze({
        HEADER_COLORS,
        VERSION,
        createWorkbook,
        downloadWorkbook,
        renderWorkbook
    });
}));
