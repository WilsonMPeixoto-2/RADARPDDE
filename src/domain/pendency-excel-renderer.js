(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarPendencyExcelRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '1.0.0';
    const FONT_NAME = 'Segoe UI';
    const COLORS = Object.freeze({
        navy: '1B365D',
        navySoft: 'DCE6F1',
        text: '1A1A1A',
        muted: '667085',
        white: 'FFFFFF',
        border: 'D3D3D3',
        zebra: 'F8FAFC',
        ice: 'EBF1F5',
        blueFill: 'DDEBF7',
        blueText: '1B4F72',
        amberFill: 'FFF3CD',
        amberText: '664D03',
        greenFill: 'D1E7DD',
        greenText: '0F5132',
        redFill: 'F8D7DA',
        redText: '842029',
        grayFill: 'E9ECEF',
        grayText: '495057',
        purpleFill: 'EDE9FE',
        purpleText: '5B21B6'
    });

    const THIN_BORDER = Object.freeze({
        style: 'thin',
        color: { argb: COLORS.border }
    });

    function createRendererError(code, message, cause = null) {
        const error = new Error(message);
        error.code = code;
        if (cause) error.cause = cause;
        return error;
    }

    function resolveExcelJs(options = {}) {
        const ExcelJS = options.ExcelJS || root?.ExcelJS;
        if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
            throw createRendererError(
                'PENDENCY_EXCELJS_UNAVAILABLE',
                'O motor ExcelJS não está disponível para gerar a planilha de pendências.'
            );
        }
        return ExcelJS;
    }

    function argb(value) {
        return { argb: value };
    }

    function solidFill(color) {
        return { type: 'pattern', pattern: 'solid', fgColor: argb(color) };
    }

    function borderAll(color = COLORS.border) {
        const border = { style: 'thin', color: argb(color) };
        return { top: border, left: border, bottom: border, right: border };
    }

    function styleTitle(cell) {
        cell.font = { name: FONT_NAME, size: 16, bold: true, color: argb(COLORS.navy) };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    function styleSubtitle(cell) {
        cell.font = { name: FONT_NAME, size: 10, color: argb(COLORS.muted) };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }

    function styleSectionTitle(cell) {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: argb(COLORS.navy) };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    function setMergedText(worksheet, range, value, styleFn) {
        worksheet.mergeCells(range);
        const cell = worksheet.getCell(range.split(':')[0]);
        cell.value = value;
        if (styleFn) styleFn(cell);
        return cell;
    }

    function setMetadataRow(worksheet, rowNumber, label, value, lastColumn = 'L') {
        worksheet.mergeCells(`A${rowNumber}:B${rowNumber}`);
        worksheet.mergeCells(`C${rowNumber}:${lastColumn}${rowNumber}`);
        const labelCell = worksheet.getCell(`A${rowNumber}`);
        const valueCell = worksheet.getCell(`C${rowNumber}`);
        labelCell.value = label;
        valueCell.value = value;
        labelCell.font = { name: FONT_NAME, size: 9, bold: true, color: argb(COLORS.navy) };
        valueCell.font = { name: FONT_NAME, size: 9, color: argb(COLORS.text) };
        labelCell.fill = solidFill(COLORS.ice);
        valueCell.fill = solidFill(COLORS.white);
        labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
        valueCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        [labelCell, valueCell].forEach(cell => { cell.border = borderAll(); });
        worksheet.getRow(rowNumber).height = 22;
    }

    function kpiStyle(colorFill, colorText) {
        return {
            label: {
                font: { name: FONT_NAME, size: 9, bold: true, color: argb(colorText) },
                fill: solidFill(colorFill),
                alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
                border: borderAll()
            },
            value: {
                font: { name: FONT_NAME, size: 18, bold: true, color: argb(colorText) },
                fill: solidFill(colorFill),
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: borderAll()
            }
        };
    }

    function writeKpiCard(worksheet, startColumn, endColumn, startRow, label, value, fill, textColor) {
        const labelRange = `${startColumn}${startRow}:${endColumn}${startRow}`;
        const valueRange = `${startColumn}${startRow + 1}:${endColumn}${startRow + 2}`;
        worksheet.mergeCells(labelRange);
        worksheet.mergeCells(valueRange);
        const labelCell = worksheet.getCell(`${startColumn}${startRow}`);
        const valueCell = worksheet.getCell(`${startColumn}${startRow + 1}`);
        const styles = kpiStyle(fill, textColor);
        labelCell.value = label;
        valueCell.value = value;
        Object.assign(labelCell, styles.label);
        Object.assign(valueCell, styles.value);
        for (let row = startRow; row <= startRow + 2; row += 1) {
            for (let col = worksheet.getColumn(startColumn).number; col <= worksheet.getColumn(endColumn).number; col += 1) {
                const cell = worksheet.getCell(row, col);
                cell.fill = solidFill(fill);
                cell.border = borderAll();
            }
        }
    }

    function formatDateTime(value) {
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
        return value.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function statusColors(status) {
        if (status === 'Aberta') return { fill: COLORS.amberFill, text: COLORS.amberText };
        if (status === 'Aguardando reanálise') return { fill: COLORS.blueFill, text: COLORS.blueText };
        if (status === 'Resolvida') return { fill: COLORS.greenFill, text: COLORS.greenText };
        if (status === 'Cancelada') return { fill: COLORS.grayFill, text: COLORS.grayText };
        return { fill: COLORS.ice, text: COLORS.text };
    }

    function configureSummarySheet(worksheet, model) {
        worksheet.properties.defaultRowHeight = 18;
        worksheet.views = [{ state: 'frozen', ySplit: 3, topLeftCell: 'A4', activeCell: 'A4' }];
        for (let column = 1; column <= 12; column += 1) worksheet.getColumn(column).width = 14;

        setMergedText(worksheet, 'A1:L1', model.title, styleTitle);
        setMergedText(worksheet, 'A2:L2', model.subtitle, styleSubtitle);
        worksheet.getRow(1).height = 28;
        worksheet.getRow(2).height = 24;

        setMetadataRow(worksheet, 4, 'Data e hora', formatDateTime(model.generatedAt));
        setMetadataRow(worksheet, 5, 'Escopo', model.scope);
        setMetadataRow(
            worksheet,
            6,
            'Filtros',
            model.filterSummary.length
                ? model.filterSummary.map(item => `${item.label}: ${item.value}`).join(' • ')
                : 'Nenhum filtro aplicado'
        );

        writeKpiCard(worksheet, 'A', 'C', 8, 'Registros exportados', model.summary.exported, COLORS.ice, COLORS.navy);
        writeKpiCard(worksheet, 'D', 'F', 8, 'Abertas', model.summary.open, COLORS.amberFill, COLORS.amberText);
        writeKpiCard(worksheet, 'G', 'I', 8, 'Aguardando reanálise', model.summary.awaiting, COLORS.blueFill, COLORS.blueText);
        writeKpiCard(worksheet, 'J', 'L', 8, 'Resolvidas', model.summary.resolved, COLORS.greenFill, COLORS.greenText);

        setMergedText(worksheet, 'A12:L12', 'LEITURA GERENCIAL', styleSectionTitle);
        const metrics = [
            ['Pendências ativas', model.summary.active, COLORS.amberFill, COLORS.amberText],
            ['Ação da escola', model.summary.schoolAction, COLORS.purpleFill, COLORS.purpleText],
            ['Ação do controlador', model.summary.controllerAction, COLORS.blueFill, COLORS.blueText],
            ['Ativas há 30 dias ou mais', model.summary.overdue30, COLORS.redFill, COLORS.redText],
            ['Canceladas', model.summary.cancelled, COLORS.grayFill, COLORS.grayText]
        ];
        metrics.forEach((metric, index) => {
            const row = 13 + index;
            worksheet.mergeCells(`A${row}:H${row}`);
            worksheet.mergeCells(`I${row}:L${row}`);
            const label = worksheet.getCell(`A${row}`);
            const value = worksheet.getCell(`I${row}`);
            label.value = metric[0];
            value.value = metric[1];
            label.font = { name: FONT_NAME, size: 10, bold: true, color: argb(metric[3]) };
            value.font = { name: FONT_NAME, size: 12, bold: true, color: argb(metric[3]) };
            label.fill = value.fill = solidFill(metric[2]);
            label.alignment = { vertical: 'middle', horizontal: 'left' };
            value.alignment = { vertical: 'middle', horizontal: 'center' };
            for (let col = 1; col <= 12; col += 1) worksheet.getCell(row, col).border = borderAll();
            worksheet.getRow(row).height = 24;
        });

        setMergedText(worksheet, 'A20:L20', 'ORIENTAÇÃO DE LEITURA', styleSectionTitle);
        setMergedText(
            worksheet,
            'A21:L23',
            'A aba PENDÊNCIAS contém a base detalhada exportada. O relatório considera a busca e os filtros aplicados na tela, quando houver, e mantém todas as situações para permitir análise, classificação e prestação de contas.',
            cell => {
                cell.font = { name: FONT_NAME, size: 9, color: argb(COLORS.text) };
                cell.fill = solidFill(COLORS.zebra);
                cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                cell.border = borderAll();
            }
        );

        worksheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            horizontalCentered: true,
            printArea: 'A1:L23',
            margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
        };
    }

    function styleDataHeader(row, columns) {
        row.height = 30;
        columns.forEach((column, index) => {
            const cell = row.getCell(index + 1);
            cell.value = column.label;
            cell.font = { name: FONT_NAME, size: 11, bold: true, color: argb(COLORS.white) };
            cell.fill = solidFill(COLORS.navy);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = borderAll(COLORS.navy);
        });
    }

    function cellValue(rowData, column) {
        const value = rowData[column.key];
        if (column.type === 'date') return value instanceof Date ? value : null;
        if (column.type === 'number') return Number.isFinite(value) ? value : null;
        return value == null ? '' : String(value);
    }

    function applyBodyCellStyle(cell, column, rowNumber) {
        cell.font = { name: FONT_NAME, size: 10, color: argb(COLORS.text) };
        cell.alignment = {
            horizontal: column.align || 'left',
            vertical: 'middle',
            wrapText: true
        };
        cell.border = borderAll();
        cell.fill = solidFill(rowNumber % 2 === 0 ? COLORS.zebra : COLORS.white);
        if (column.type === 'date') cell.numFmt = 'dd/mm/yyyy';
        if (column.type === 'number') cell.numFmt = '0';
    }

    function configureDataSheet(worksheet, model) {
        const lastColumnNumber = model.columns.length;
        const lastColumnLetter = worksheet.getColumn(lastColumnNumber).letter;
        worksheet.properties.defaultRowHeight = 22;

        setMergedText(worksheet, `A1:${lastColumnLetter}1`, model.title, styleTitle);
        setMergedText(
            worksheet,
            `A2:${lastColumnLetter}2`,
            `${model.scope} • Gerado em ${formatDateTime(model.generatedAt)}`,
            styleSubtitle
        );
        worksheet.getRow(1).height = 28;
        worksheet.getRow(2).height = 24;

        const headerRowNumber = 4;
        styleDataHeader(worksheet.getRow(headerRowNumber), model.columns);

        model.columns.forEach((column, index) => {
            worksheet.getColumn(index + 1).width = column.width;
        });

        model.rows.forEach((rowData, rowIndex) => {
            const rowNumber = headerRowNumber + 1 + rowIndex;
            const row = worksheet.getRow(rowNumber);
            row.height = 22;
            model.columns.forEach((column, columnIndex) => {
                const cell = row.getCell(columnIndex + 1);
                cell.value = cellValue(rowData, column);
                applyBodyCellStyle(cell, column, rowNumber);
            });

            const statusCell = row.getCell(1);
            const statusStyle = statusColors(rowData.status);
            statusCell.fill = solidFill(statusStyle.fill);
            statusCell.font = { name: FONT_NAME, size: 10, bold: true, color: argb(statusStyle.text) };

            const ageColumnIndex = model.columns.findIndex(column => column.key === 'ageDays') + 1;
            if (ageColumnIndex > 0
                && ['Aberta', 'Aguardando reanálise'].includes(rowData.status)
                && Number.isFinite(rowData.ageDays)) {
                const ageCell = row.getCell(ageColumnIndex);
                if (rowData.ageDays >= 30) {
                    ageCell.fill = solidFill(COLORS.redFill);
                    ageCell.font = { name: FONT_NAME, size: 10, bold: true, color: argb(COLORS.redText) };
                } else if (rowData.ageDays >= 16) {
                    ageCell.fill = solidFill(COLORS.amberFill);
                    ageCell.font = { name: FONT_NAME, size: 10, bold: true, color: argb(COLORS.amberText) };
                }
            }
        });

        const finalRow = Math.max(headerRowNumber, headerRowNumber + model.rows.length);
        worksheet.autoFilter = `A${headerRowNumber}:${lastColumnLetter}${finalRow}`;
        worksheet.views = [{
            state: 'frozen',
            xSplit: 3,
            ySplit: headerRowNumber,
            topLeftCell: 'D5',
            activeCell: 'D5'
        }];

        worksheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 2,
            fitToHeight: 0,
            horizontalCentered: false,
            printArea: `A1:${lastColumnLetter}${finalRow}`,
            printTitlesRow: `${headerRowNumber}:${headerRowNumber}`,
            margins: { left: 0.25, right: 0.25, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 }
        };
    }

    function buildWorkbook(model, options = {}) {
        if (!model || !Array.isArray(model.rows) || !Array.isArray(model.columns)) {
            throw createRendererError('PENDENCY_MODEL_INVALID', 'O modelo da planilha de pendências é inválido.');
        }
        const ExcelJS = resolveExcelJs(options);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = '4ª CRE / SME-Rio';
        workbook.lastModifiedBy = '4ª CRE / SME-Rio';
        workbook.created = model.generatedAt instanceof Date ? model.generatedAt : new Date();
        workbook.modified = workbook.created;
        workbook.company = 'Secretaria Municipal de Educação do Rio de Janeiro';
        workbook.subject = 'Relatório de pendências do PDDE';

        const summarySheet = workbook.addWorksheet('RESUMO', { views: [{ showGridLines: false }] });
        const dataSheet = workbook.addWorksheet('PENDÊNCIAS', { views: [{ showGridLines: false }] });
        summarySheet.views = [{ showGridLines: false }];
        dataSheet.views = [{ showGridLines: false }];

        configureSummarySheet(summarySheet, model);
        configureDataSheet(dataSheet, model);
        workbook.views = [{ firstSheet: 0, activeTab: 0, visibility: 'visible' }];
        return workbook;
    }

    async function renderWorkbook(model, options = {}) {
        const workbook = buildWorkbook(model, options);
        try {
            const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
            return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        } catch (error) {
            throw createRendererError(
                'PENDENCY_SERIALIZATION_FAILED',
                'A planilha de pendências não pôde ser finalizada.',
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
                'PENDENCY_DOWNLOAD_FAILED',
                'O download da planilha de pendências não pôde ser iniciado.',
                error
            );
        }
    }

    return Object.freeze({
        COLORS,
        FONT_NAME,
        VERSION,
        buildWorkbook,
        configureDataSheet,
        configureSummarySheet,
        downloadWorkbook,
        renderWorkbook,
        statusColors
    });
}));
