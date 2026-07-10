(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelXlsxRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '0.1.0';
    const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const encoder = new TextEncoder();

    const STYLE = Object.freeze({
        default: 0,
        title: 1,
        description: 2,
        metaLabel: 3,
        metaValue: 4,
        header: 5,
        bodyLeft: 6,
        bodyCenter: 7,
        bodyInteger: 8,
        dateTime: 9,
        kpiInformational: 10,
        kpiPositive: 11,
        kpiCritical: 12,
        kpiAnalytical: 13,
        section: 14,
        percent: 15,
        metadataKey: 16,
        statusPositive: 17,
        statusCritical: 18,
        statusAttention: 19
    });

    function xmlEscape(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function formulaEscape(value) {
        return String(value == null ? '' : value).replace(/^=/, '');
    }

    function colToNumber(col) {
        let result = 0;
        for (const char of String(col)) result = result * 26 + char.charCodeAt(0) - 64;
        return result;
    }

    function numberToCol(number) {
        let n = number;
        let result = '';
        while (n > 0) {
            n -= 1;
            result = String.fromCharCode(65 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    function parseCell(ref) {
        const match = /^([A-Z]+)(\d+)$/.exec(ref);
        if (!match) throw new Error(`Referência de célula inválida: ${ref}`);
        return { col: colToNumber(match[1]), row: Number(match[2]) };
    }

    function parseRange(range) {
        const [startRef, endRef = startRef] = String(range).split(':');
        return { start: parseCell(startRef), end: parseCell(endRef) };
    }

    function excelSerial(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.getTime() / 86400000 + 25569;
    }

    function inlineCell(ref, value, styleId = STYLE.default) {
        return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }

    function numberCell(ref, value, styleId = STYLE.default) {
        const number = Number(value);
        const safe = Number.isFinite(number) ? number : 0;
        return `<c r="${ref}" s="${styleId}"><v>${safe}</v></c>`;
    }

    function formulaCell(ref, formula, cachedValue, styleId = STYLE.default) {
        const cached = Number.isFinite(Number(cachedValue)) ? Number(cachedValue) : 0;
        return `<c r="${ref}" s="${styleId}"><f>${xmlEscape(formulaEscape(formula))}</f><v>${cached}</v></c>`;
    }

    function rowXml(rowNumber, cells, options = {}) {
        const attrs = [`r="${rowNumber}"`];
        if (options.height) attrs.push(`ht="${options.height}" customHeight="1"`);
        return `<row ${attrs.join(' ')}>${cells.join('')}</row>`;
    }

    function columnsXml(columns) {
        return `<cols>${columns.map((column, index) => {
            const number = index + 1;
            const width = Number(column.width) || 12;
            return `<col min="${number}" max="${number}" width="${width}" customWidth="1"/>`;
        }).join('')}</cols>`;
    }

    function paneXml(freeze) {
        if (!freeze || (!freeze.rows && !freeze.columns)) return '';
        const x = Number(freeze.columns) || 0;
        const y = Number(freeze.rows) || 0;
        const topLeft = `${numberToCol(x + 1)}${y + 1}`;
        const pane = x && y ? 'bottomRight' : (x ? 'topRight' : 'bottomLeft');
        return `<pane${x ? ` xSplit="${x}"` : ''}${y ? ` ySplit="${y}"` : ''} topLeftCell="${topLeft}" activePane="${pane}" state="frozen"/>`;
    }

    function mergeCellsXml(merges) {
        if (!merges || merges.length === 0) return '';
        return `<mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`;
    }

    function conditionalFormattingXml(items) {
        if (!items || items.length === 0) return '';
        const dxfByStyle = { statusPositive: 0, statusCritical: 1, statusAttention: 2 };
        return items.map((item, index) => {
            const dxfId = dxfByStyle[item.style];
            if (dxfId == null) return '';
            return `<conditionalFormatting sqref="${item.range}"><cfRule type="expression" dxfId="${dxfId}" priority="${index + 1}"><formula>${xmlEscape(formulaEscape(item.formula))}</formula></cfRule></conditionalFormatting>`;
        }).join('');
    }

    function worksheetEnvelope(content) {
        return XML_HEADER + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${content}</worksheet>`;
    }

    function buildBaseSheet(sheet) {
        const table = sheet.table;
        const rows = [];
        rows.push(rowXml(1, [inlineCell('A1', sheet.title.value, STYLE.title)], { height: 30 }));
        rows.push(rowXml(2, [inlineCell('A2', sheet.description.value, STYLE.description)], { height: 28 }));

        const metadataSlots = [
            { label: 'A4', value: 'A5', item: sheet.metadata[0] },
            { label: 'C4', value: 'C5', item: sheet.metadata[1] },
            { label: 'E4', value: 'E5', item: sheet.metadata[2] },
            { label: 'G4', value: 'G5', item: sheet.metadata[3] }
        ];
        rows.push(rowXml(4, metadataSlots.map(slot => inlineCell(slot.label, slot.item[0], STYLE.metaLabel)), { height: 18 }));
        rows.push(rowXml(5, metadataSlots.map(slot => {
            const isDate = slot.item[3] && excelSerial(slot.item[1]) != null;
            return isDate
                ? numberCell(slot.value, excelSerial(slot.item[1]), STYLE.dateTime)
                : inlineCell(slot.value, slot.item[1], STYLE.metaValue);
        }), { height: 22 }));

        rows.push(rowXml(table.headerRow, table.headers.map((value, index) => inlineCell(`${numberToCol(index + 1)}${table.headerRow}`, value, STYLE.header)), { height: 34 }));

        const dataRows = table.rows.length ? table.rows : [new Array(table.headers.length).fill('')];
        dataRows.forEach((values, rowIndex) => {
            const rowNumber = table.firstDataRow + rowIndex;
            const cells = values.map((value, colIndex) => {
                const column = table.columns[colIndex] || {};
                const ref = `${numberToCol(colIndex + 1)}${rowNumber}`;
                const style = column.alignment === 'left' ? STYLE.bodyLeft : STYLE.bodyCenter;
                return inlineCell(ref, value, style);
            });
            rows.push(rowXml(rowNumber, cells, { height: 32 }));
        });

        const dimensionEnd = `L${Math.max(table.firstDataRow, table.lastDataRow)}`;
        const content = [
            `<dimension ref="A1:${dimensionEnd}"/>`,
            `<sheetViews><sheetView workbookViewId="0">${paneXml(sheet.freeze)}</sheetView></sheetViews>`,
            '<sheetFormatPr defaultRowHeight="15"/>',
            columnsXml(table.columns),
            `<sheetData>${rows.join('')}</sheetData>`,
            mergeCellsXml(sheet.merges),
            conditionalFormattingXml(sheet.conditionalFormats),
            '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>',
            '<tableParts count="1"><tablePart r:id="rId1"/></tableParts>'
        ].join('');
        return worksheetEnvelope(content);
    }

    function buildSummarySheet(sheet) {
        const rowsByNumber = new Map();
        const add = (row, cell) => {
            if (!rowsByNumber.has(row)) rowsByNumber.set(row, []);
            rowsByNumber.get(row).push(cell);
        };
        add(1, inlineCell('A1', sheet.title.value, STYLE.title));
        add(2, inlineCell('A2', sheet.description.value, STYLE.description));

        const kpiStats = [
            sheet.competenceTable.rows.reduce((sum, row) => sum + Number(row[1] || 0), 0),
            sheet.competenceTable.rows.reduce((sum, row) => sum + Number(row[2] || 0), 0),
            sheet.competenceTable.rows.reduce((sum, row) => sum + Number(row[3] || 0), 0)
        ];
        kpiStats.push(kpiStats[0] ? kpiStats[1] / kpiStats[0] : 0);
        const kpiStyleMap = {
            kpiInformational: STYLE.kpiInformational,
            kpiPositive: STYLE.kpiPositive,
            kpiCritical: STYLE.kpiCritical,
            kpiAnalytical: STYLE.kpiAnalytical
        };
        sheet.kpis.forEach((kpi, index) => {
            const range = parseRange(kpi[1]);
            const startCol = numberToCol(range.start.col);
            add(range.start.row, inlineCell(`${startCol}${range.start.row}`, kpi[0], kpiStyleMap[kpi[3]]));
            const valueStyle = kpi[4] === '0.0%' ? STYLE.percent : kpiStyleMap[kpi[3]];
            add(range.end.row, formulaCell(`${startCol}${range.end.row}`, kpi[2], kpiStats[index], valueStyle));
        });

        const writeTable = table => {
            const start = parseRange(table.range).start;
            table.headers.forEach((value, index) => add(start.row, inlineCell(`${numberToCol(start.col + index)}${start.row}`, value, STYLE.header)));
            const dataRows = table.rows.length ? table.rows : [new Array(table.headers.length).fill('')];
            dataRows.forEach((values, index) => {
                const rowNumber = start.row + 1 + index;
                values.forEach((value, colIndex) => {
                    const ref = `${numberToCol(start.col + colIndex)}${rowNumber}`;
                    const column = table.columns[colIndex] || {};
                    if (typeof value === 'number') add(rowNumber, numberCell(ref, value, STYLE.bodyInteger));
                    else add(rowNumber, inlineCell(ref, value, column.alignment === 'left' ? STYLE.bodyLeft : STYLE.bodyCenter));
                });
            });
        };
        writeTable(sheet.competenceTable);
        writeTable(sheet.programTable);

        const rows = Array.from(rowsByNumber.entries()).sort((a, b) => a[0] - b[0]).map(([number, cells]) => {
            const height = number === 1 ? 28 : (number === 2 ? 24 : (number === 5 ? 18 : (number === 6 ? 28 : undefined)));
            return rowXml(number, cells, height ? { height } : {});
        });

        const compEnd = parseRange(sheet.competenceTable.range).end.row;
        const progEnd = parseRange(sheet.programTable.range).end.row;
        const merges = ['A1:I1', 'A2:I2'];
        sheet.kpis.forEach(kpi => {
            const range = parseRange(kpi[1]);
            const startCol = numberToCol(range.start.col);
            const endCol = numberToCol(range.end.col);
            merges.push(`${startCol}${range.start.row}:${endCol}${range.start.row}`);
            merges.push(`${startCol}${range.end.row}:${endCol}${range.end.row}`);
        });
        const cols = [
            { width: 20 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 3 },
            { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }
        ];
        const hasChart = Array.isArray(sheet.charts) && sheet.charts.length > 0;
        const content = [
            `<dimension ref="A1:I${Math.max(32, compEnd, progEnd)}"/>`,
            `<sheetViews><sheetView workbookViewId="0">${paneXml(sheet.freeze)}</sheetView></sheetViews>`,
            '<sheetFormatPr defaultRowHeight="15"/>',
            columnsXml(cols),
            `<sheetData>${rows.join('')}</sheetData>`,
            mergeCellsXml(merges),
            '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>',
            hasChart ? '<drawing r:id="rId1"/>' : ''
        ].join('');
        return worksheetEnvelope(content);
    }

    function buildQualitySheet(sheet) {
        const table = sheet.table;
        const rows = [
            rowXml(1, [inlineCell('A1', sheet.title.value, STYLE.title)], { height: 28 }),
            rowXml(2, [inlineCell('A2', sheet.description.value, STYLE.description)], { height: 24 }),
            rowXml(table.headerRow, table.headers.map((value, index) => inlineCell(`${numberToCol(index + 1)}${table.headerRow}`, value, STYLE.header)), { height: 30 })
        ];
        const dataRows = table.rows.length ? table.rows : [new Array(table.headers.length).fill('')];
        dataRows.forEach((values, rowIndex) => {
            const rowNumber = table.firstDataRow + rowIndex;
            const cells = values.map((value, colIndex) => {
                const column = table.columns[colIndex] || {};
                const ref = `${numberToCol(colIndex + 1)}${rowNumber}`;
                if (column.dataType === 'integer') return numberCell(ref, value, STYLE.bodyInteger);
                return inlineCell(ref, value, column.alignment === 'left' ? STYLE.bodyLeft : STYLE.bodyCenter);
            });
            rows.push(rowXml(rowNumber, cells, { height: 27 }));
        });
        const content = [
            `<dimension ref="A1:H${Math.max(table.firstDataRow, table.lastDataRow)}"/>`,
            `<sheetViews><sheetView workbookViewId="0">${paneXml(sheet.freeze)}</sheetView></sheetViews>`,
            '<sheetFormatPr defaultRowHeight="15"/>',
            columnsXml(table.columns),
            `<sheetData>${rows.join('')}</sheetData>`,
            mergeCellsXml(['A1:H1', 'A2:H2']),
            conditionalFormattingXml(sheet.conditionalFormats),
            '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>',
            '<tableParts count="1"><tablePart r:id="rId1"/></tableParts>'
        ].join('');
        return worksheetEnvelope(content);
    }

    function buildMetadataSheet(sheet) {
        const rows = [];
        rows.push(rowXml(1, [inlineCell('A1', sheet.title.value, STYLE.title)], { height: 28 }));
        rows.push(rowXml(3, [inlineCell('A3', 'Metadado', STYLE.header), inlineCell('B3', 'Valor', STYLE.header)]));
        sheet.properties.forEach((property, index) => {
            const rowNumber = 4 + index;
            const isDate = property[0] === 'Data de geração' && excelSerial(property[1]) != null;
            rows.push(rowXml(rowNumber, [
                inlineCell(`A${rowNumber}`, property[0], STYLE.metadataKey),
                isDate ? numberCell(`B${rowNumber}`, excelSerial(property[1]), STYLE.dateTime) : inlineCell(`B${rowNumber}`, property[1], STYLE.bodyLeft)
            ], { height: 22 }));
        });
        const dictStart = parseRange(sheet.dictionary.range).start;
        rows.push(rowXml(dictStart.row, sheet.dictionary.headers.map((value, index) => inlineCell(`${numberToCol(index + 1)}${dictStart.row}`, value, STYLE.section)), { height: 28 }));
        sheet.dictionary.rows.forEach((values, index) => {
            const rowNumber = dictStart.row + 1 + index;
            rows.push(rowXml(rowNumber, values.map((value, colIndex) => inlineCell(`${numberToCol(colIndex + 1)}${rowNumber}`, value, STYLE.bodyLeft)), { height: 30 }));
        });
        const content = [
            `<dimension ref="A1:D${dictStart.row + Math.max(1, sheet.dictionary.rows.length)}"/>`,
            `<sheetViews><sheetView workbookViewId="0">${paneXml(sheet.freeze)}</sheetView></sheetViews>`,
            '<sheetFormatPr defaultRowHeight="15"/>',
            columnsXml(sheet.dictionary.columns),
            `<sheetData>${rows.join('')}</sheetData>`,
            mergeCellsXml(['A1:D1']),
            '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'
        ].join('');
        return worksheetEnvelope(content);
    }

    function tableXml(id, name, range, headers) {
        return XML_HEADER + `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="${id}" name="${xmlEscape(name)}" displayName="${xmlEscape(name)}" ref="${range}" totalsRowShown="0"><autoFilter ref="${range}"/><tableColumns count="${headers.length}">${headers.map((header, index) => `<tableColumn id="${index + 1}" name="${xmlEscape(header)}"/>`).join('')}</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`;
    }

    function sheetRelationships(target) {
        return XML_HEADER + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${target.type}" Target="${target.path}"/></Relationships>`;
    }

    function chartXml(sheet) {
        const table = sheet.competenceTable;
        const start = parseRange(table.range).start;
        const firstData = start.row + 1;
        const sheetName = sheet.name.replace(/'/g, "''");
        const rows = table.rows.length ? table.rows : [['-', 0, 0, 0]];
        const lastData = firstData + rows.length - 1;
        const categories = `'${sheetName}'!$A$${firstData}:$A$${lastData}`;
        const categoryCache = `<c:strCache><c:ptCount val="${rows.length}"/>${rows.map((row, index) => `<c:pt idx="${index}"><c:v>${xmlEscape(row[0])}</c:v></c:pt>`).join('')}</c:strCache>`;
        const series = [
            { title: table.headers[1], column: 'B', values: rows.map(row => Number(row[1] || 0)) },
            { title: table.headers[2], column: 'C', values: rows.map(row => Number(row[2] || 0)) },
            { title: table.headers[3], column: 'D', values: rows.map(row => Number(row[3] || 0)) }
        ];
        const seriesXml = series.map((item, index) => {
            const valuesRef = `'${sheetName}'!$${item.column}$${firstData}:$${item.column}$${lastData}`;
            const valueCache = `<c:numCache><c:formatCode>0</c:formatCode><c:ptCount val="${item.values.length}"/>${item.values.map((value, valueIndex) => `<c:pt idx="${valueIndex}"><c:v>${value}</c:v></c:pt>`).join('')}</c:numCache>`;
            return `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:v>${xmlEscape(item.title)}</c:v></c:tx><c:cat><c:strRef><c:f>${categories}</c:f>${categoryCache}</c:strRef></c:cat><c:val><c:numRef><c:f>${valuesRef}</c:f>${valueCache}</c:numRef></c:val></c:ser>`;
        }).join('');
        return XML_HEADER + `<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="1200" b="1"/><a:t>${xmlEscape(sheet.charts[0].title)}</a:t></a:r></a:p></c:rich></c:tx><c:layout/><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${seriesXml}<c:dLbls><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:gapWidth val="150"/><c:axId val="123456"/><c:axId val="654321"/></c:barChart><c:catAx><c:axId val="123456"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="654321"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx><c:valAx><c:axId val="654321"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="0" sourceLinked="0"/><c:majorGridlines/><c:tickLblPos val="nextTo"/><c:crossAx val="123456"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:layout/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="zero"/></c:chart></c:chartSpace>`;
    }

    function drawingXml() {
        return XML_HEADER + `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>15</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>9</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>32</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Resultados consolidados por competência"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;
    }

    function stylesXml() {
        return XML_HEADER + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts><fonts count="11"><font><sz val="11"/><color rgb="FF243447"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF243447"/><name val="Calibri"/></font><font><b/><sz val="9"/><color rgb="FF17324D"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><sz val="9"/><color rgb="FF243447"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="9"/><color rgb="FF195C4F"/><name val="Calibri"/></font><font><b/><sz val="9"/><color rgb="FF842929"/><name val="Calibri"/></font><font><b/><sz val="9"/><color rgb="FF85580D"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="13"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17324D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF0F5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDFE8F0"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F6FA5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF287B78"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFB43A3A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6658A6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEFE8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5DEDE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8EBCF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC98512"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD8DEE6"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="20"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="5" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="7" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="8" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="10" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf><xf numFmtId="165" fontId="6" fillId="8" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="7" fillId="9" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="8" fillId="10" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="9" fillId="11" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="3"><dxf><font><b/><color rgb="FF195C4F"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFDCEFE8"/><bgColor indexed="64"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF842929"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFF5DEDE"/><bgColor indexed="64"/></patternFill></fill></dxf><dxf><font><b/><color rgb="FF85580D"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFF8EBCF"/><bgColor indexed="64"/></patternFill></fill></dxf></dxfs><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>`;
    }

    function workbookXml(plan) {
        return XML_HEADER + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl"/><workbookPr/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000" activeTab="0"/></bookViews><sheets>${plan.sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
    }

    function workbookRelsXml() {
        return XML_HEADER + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    }

    function contentTypesXml(hasChart) {
        const chartOverrides = hasChart ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' : '';
        return XML_HEADER + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/><Override PartName="/xl/tables/table2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>${chartOverrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
    }

    function rootRelsXml() {
        return XML_HEADER + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
    }

    function corePropsXml(plan) {
        const date = xmlEscape(plan.workbook.generatedAt || new Date().toISOString());
        return XML_HEADER + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(plan.workbook.title)}</dc:title><dc:creator>${xmlEscape(plan.workbook.creator)}</dc:creator><cp:lastModifiedBy>${xmlEscape(plan.workbook.creator)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${date}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${date}</dcterms:modified></cp:coreProperties>`;
    }

    function appPropsXml(plan) {
        return XML_HEADER + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>RADAR PDDE</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Planilhas</vt:lpstr></vt:variant><vt:variant><vt:i4>${plan.sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="${plan.sheets.length}" baseType="lpstr">${plan.sheets.map(sheet => `<vt:lpstr>${xmlEscape(sheet.name)}</vt:lpstr>`).join('')}</vt:vector></TitlesOfParts><Company>SME-Rio</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>1.0</AppVersion></Properties>`;
    }

    const CRC_TABLE = (() => {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n += 1) {
            let c = n;
            for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        return table;
    })();

    function crc32(bytes) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function writeU16(view, offset, value) { view.setUint16(offset, value, true); }
    function writeU32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

    function concatBytes(parts) {
        const length = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(length);
        let offset = 0;
        parts.forEach(part => { out.set(part, offset); offset += part.length; });
        return out;
    }

    function dosTimeDate(date = new Date()) {
        const year = Math.max(1980, date.getFullYear());
        const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const dosDate = ((year - 1980) << 9) | (month << 5) | day;
        return { time, date: dosDate };
    }

    function createZip(entries) {
        const localParts = [];
        const centralParts = [];
        let localOffset = 0;
        const stamp = dosTimeDate();

        entries.forEach(entry => {
            const nameBytes = encoder.encode(entry.name);
            const dataBytes = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
            const crc = crc32(dataBytes);

            const local = new Uint8Array(30 + nameBytes.length);
            const localView = new DataView(local.buffer);
            writeU32(localView, 0, 0x04034B50);
            writeU16(localView, 4, 20);
            writeU16(localView, 6, 0x0800);
            writeU16(localView, 8, 0);
            writeU16(localView, 10, stamp.time);
            writeU16(localView, 12, stamp.date);
            writeU32(localView, 14, crc);
            writeU32(localView, 18, dataBytes.length);
            writeU32(localView, 22, dataBytes.length);
            writeU16(localView, 26, nameBytes.length);
            writeU16(localView, 28, 0);
            local.set(nameBytes, 30);
            localParts.push(local, dataBytes);

            const central = new Uint8Array(46 + nameBytes.length);
            const centralView = new DataView(central.buffer);
            writeU32(centralView, 0, 0x02014B50);
            writeU16(centralView, 4, 20);
            writeU16(centralView, 6, 20);
            writeU16(centralView, 8, 0x0800);
            writeU16(centralView, 10, 0);
            writeU16(centralView, 12, stamp.time);
            writeU16(centralView, 14, stamp.date);
            writeU32(centralView, 16, crc);
            writeU32(centralView, 20, dataBytes.length);
            writeU32(centralView, 24, dataBytes.length);
            writeU16(centralView, 28, nameBytes.length);
            writeU16(centralView, 30, 0);
            writeU16(centralView, 32, 0);
            writeU16(centralView, 34, 0);
            writeU16(centralView, 36, 0);
            writeU32(centralView, 38, 0);
            writeU32(centralView, 42, localOffset);
            central.set(nameBytes, 46);
            centralParts.push(central);
            localOffset += local.length + dataBytes.length;
        });

        const centralDirectory = concatBytes(centralParts);
        const end = new Uint8Array(22);
        const endView = new DataView(end.buffer);
        writeU32(endView, 0, 0x06054B50);
        writeU16(endView, 4, 0);
        writeU16(endView, 6, 0);
        writeU16(endView, 8, entries.length);
        writeU16(endView, 10, entries.length);
        writeU32(endView, 12, centralDirectory.length);
        writeU32(endView, 16, localOffset);
        writeU16(endView, 20, 0);
        return concatBytes([...localParts, centralDirectory, end]);
    }

    function validatePlan(plan) {
        if (!plan || !Array.isArray(plan.sheets) || plan.sheets.length !== 4) throw new TypeError('Plano de workbook inválido.');
        const names = plan.sheets.map(sheet => sheet.name).join('|');
        if (names !== 'BONIFICACOES|SINTESE|QUALIDADE_DADOS|METADADOS') throw new Error('A ordem das abas aprovadas não foi preservada.');
        const base = plan.sheets[0];
        if (!base.table || base.table.headers.length !== 12) throw new Error('A aba BONIFICACOES deve conter os 12 campos originais.');
    }

    function buildPackageEntries(plan) {
        validatePlan(plan);
        const [base, summary, quality, metadata] = plan.sheets;
        const hasChart = Array.isArray(summary.charts) && summary.charts.length > 0;
        const entries = [
            { name: '[Content_Types].xml', data: contentTypesXml(hasChart) },
            { name: '_rels/.rels', data: rootRelsXml() },
            { name: 'docProps/core.xml', data: corePropsXml(plan) },
            { name: 'docProps/app.xml', data: appPropsXml(plan) },
            { name: 'xl/workbook.xml', data: workbookXml(plan) },
            { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml() },
            { name: 'xl/styles.xml', data: stylesXml() },
            { name: 'xl/worksheets/sheet1.xml', data: buildBaseSheet(base) },
            { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: sheetRelationships({ type: 'table', path: '../tables/table1.xml' }) },
            { name: 'xl/worksheets/sheet2.xml', data: buildSummarySheet(summary) },
            { name: 'xl/worksheets/sheet3.xml', data: buildQualitySheet(quality) },
            { name: 'xl/worksheets/_rels/sheet3.xml.rels', data: sheetRelationships({ type: 'table', path: '../tables/table2.xml' }) },
            { name: 'xl/worksheets/sheet4.xml', data: buildMetadataSheet(metadata) },
            { name: 'xl/tables/table1.xml', data: tableXml(1, base.table.name, base.table.range, base.table.headers) },
            { name: 'xl/tables/table2.xml', data: tableXml(2, quality.table.name, quality.table.range, quality.table.headers) }
        ];
        if (hasChart) {
            entries.push(
                { name: 'xl/worksheets/_rels/sheet2.xml.rels', data: sheetRelationships({ type: 'drawing', path: '../drawings/drawing1.xml' }) },
                { name: 'xl/drawings/drawing1.xml', data: drawingXml() },
                { name: 'xl/drawings/_rels/drawing1.xml.rels', data: sheetRelationships({ type: 'chart', path: '../charts/chart1.xml' }) },
                { name: 'xl/charts/chart1.xml', data: chartXml(summary) }
            );
        }
        return entries;
    }

    function renderWorkbook(plan) {
        return createZip(buildPackageEntries(plan));
    }

    function downloadWorkbook(plan) {
        if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
            throw new Error('Download disponível apenas no navegador.');
        }
        const bytes = renderWorkbook(plan);
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = plan.fileName || 'RADAR_PDDE_BONIFICACOES_CONSOLIDADAS.xlsx';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return { fileName: link.download, size: bytes.length };
    }

    function inspectStoredZip(bytes) {
        const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        const entries = {};
        let offset = 0;
        while (offset + 4 <= data.length) {
            const view = new DataView(data.buffer, data.byteOffset + offset);
            const signature = view.getUint32(0, true);
            if (signature !== 0x04034B50) break;
            const compressedSize = view.getUint32(18, true);
            const nameLength = view.getUint16(26, true);
            const extraLength = view.getUint16(28, true);
            const nameStart = offset + 30;
            const dataStart = nameStart + nameLength + extraLength;
            const name = new TextDecoder().decode(data.slice(nameStart, nameStart + nameLength));
            entries[name] = data.slice(dataStart, dataStart + compressedSize);
            offset = dataStart + compressedSize;
        }
        return entries;
    }

    return Object.freeze({ VERSION, buildPackageEntries, createZip, downloadWorkbook, inspectStoredZip, renderWorkbook });
}));
