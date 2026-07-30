(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeMonthlyRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '2.1.0';
    const COLORS = Object.freeze({
        identity: '#8DB4E2',
        basic: '#F4CCCC',
        quality: '#D9EAD3',
        equity: '#E4DFEC',
        administrative: '#8DB4E2',
        status: '#F4CCCC',
        border: '#7F8C8D',
        alternate: '#F7F9FC',
        text: '#1F2937',
        positive: '#E2F0D9',
        positiveText: '#2E6B2E',
        negative: '#F4CCCC',
        negativeText: '#9C0006'
    });

    let nodeWriterPromise = null;

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

    function commonCellStyle(column, rowIndex) {
        return {
            fontFamily: 'Arial',
            fontSize: 9,
            textColor: COLORS.text,
            align: column.alignment === 'left' ? 'left' : 'center',
            alignVertical: 'center',
            wrap: true,
            borderColor: COLORS.border,
            borderStyle: 'thin',
            height: 24,
            ...(rowIndex % 2 === 0 ? { backgroundColor: COLORS.alternate } : {})
        };
    }

    function headerCell(column, columnIndex) {
        return {
            value: column.label,
            type: String,
            fontFamily: 'Arial',
            fontSize: 8,
            fontWeight: 'bold',
            textColor: COLORS.text,
            backgroundColor: groupFill(column, columnIndex),
            align: 'center',
            alignVertical: 'center',
            wrap: true,
            borderColor: COLORS.border,
            borderStyle: 'thin',
            height: 105,
            ...(column.mergeAcross ? { columnSpan: column.mergeAcross } : {})
        };
    }

    function bodyCell(column, value, rowIndex) {
        const safeValue = value == null ? '' : value;
        const cell = {
            value: safeValue,
            type: typeof safeValue === 'number' ? Number : String,
            ...commonCellStyle(column, rowIndex)
        };
        if (column.key === 'designation' && typeof safeValue === 'number') cell.format = '0';
        if (column.key === 'status') {
            const status = String(safeValue).toUpperCase();
            if (status === 'APTA') {
                cell.backgroundColor = COLORS.positive;
                cell.textColor = COLORS.positiveText;
                cell.fontWeight = 'bold';
            } else if (status === 'INAPTA') {
                cell.backgroundColor = COLORS.negative;
                cell.textColor = COLORS.negativeText;
                cell.fontWeight = 'bold';
            }
        }
        return cell;
    }

    function buildSheetData(model) {
        validateModel(model);
        const header = model.columns.map((column, index) => (
            column.mergedHeader ? null : headerCell(column, index)
        ));
        const body = model.rows.map((source, rowIndex) => (
            model.columns.map(column => bodyCell(column, source[column.key], rowIndex))
        ));
        return Object.freeze([Object.freeze(header), ...body.map(Object.freeze)]);
    }

    function buildSheetOptions(model) {
        validateModel(model);
        return Object.freeze({
            sheet: model.sheetName,
            columns: Object.freeze(model.columns.map(column => Object.freeze({ width: column.width }))),
            orientation: 'landscape',
            stickyRowsCount: 1,
            stickyColumnsCount: 4,
            showGridLines: false,
            zoomScale: 0.85
        });
    }

    async function resolveWriter() {
        if (root && typeof root.writeXlsxFile === 'function') return root.writeXlsxFile;
        if (typeof module === 'object' && module.exports) {
            if (!nodeWriterPromise) {
                nodeWriterPromise = import('write-excel-file/node').then(imported => imported.default || imported);
            }
            return nodeWriterPromise;
        }
        throw new Error('O gerador write-excel-file não foi carregado.');
    }

    async function createOutput(model) {
        const writeExcelFile = await resolveWriter();
        return writeExcelFile(
            buildSheetData(model),
            buildSheetOptions(model),
            { fontFamily: 'Arial', fontSize: 9 }
        );
    }

    async function renderWorkbook(model) {
        const output = await createOutput(model);
        if (typeof output.toBuffer === 'function') {
            const buffer = await output.toBuffer();
            return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        }
        if (typeof output.toBlob === 'function') {
            const blob = await output.toBlob();
            return new Uint8Array(await blob.arrayBuffer());
        }
        throw new Error('O gerador Excel não disponibilizou saída binária compatível.');
    }

    async function downloadWorkbook(model, options = {}) {
        const fileName = options.fileName || model.fileName;
        const output = await createOutput(model);
        if (root?.document && typeof output.toFile === 'function') {
            await output.toFile(fileName);
            return { fileName };
        }
        const bytes = typeof output.toBuffer === 'function'
            ? new Uint8Array(await output.toBuffer())
            : new Uint8Array(await (await output.toBlob()).arrayBuffer());
        return { bytes, fileName, size: bytes.length };
    }

    return Object.freeze({
        COLORS,
        VERSION,
        buildSheetData,
        buildSheetOptions,
        downloadWorkbook,
        renderWorkbook
    });
}));
