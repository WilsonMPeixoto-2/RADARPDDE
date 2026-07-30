(function (root, factory) {
    const baseRenderer = typeof module === 'object' && module.exports
        ? require('./excel-xlsx-renderer.js')
        : root && root.RadarExcelXlsxRenderer;
    const api = factory(root, baseRenderer);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeMonthlyRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, baseRenderer) {
    'use strict';

    if (!baseRenderer || typeof baseRenderer.createZip !== 'function') {
        throw new Error('Motor XLSX institucional não foi carregado.');
    }

    const VERSION = '1.1.2';
    const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const STYLE = Object.freeze({
        default: 0,
        headerIdentity: 1,
        headerBasic: 2,
        headerQuality: 3,
        headerEquity: 4,
        headerAdministrative: 5,
        bodyCenter: 6,
        bodyCenterAlternate: 7,
        bodyLeft: 8,
        bodyLeftAlternate: 9
    });

    function xmlEscape(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function columnLetter(number) {
        let current = Number(number);
        let result = '';
        while (current > 0) {
            current -= 1;
            result = String.fromCharCode(65 + (current % 26)) + result;
            current = Math.floor(current / 26);
        }
        return result;
    }

    function inlineCell(ref, value, styleId) {
        return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }

    function numberCell(ref, value, styleId) {
        const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
        return `<c r="${ref}" s="${styleId}"><v>${safe}</v></c>`;
    }

    function validateModel(model) {
        if (!model || !Array.isArray(model.columns) || model.columns.length !== 26) {
            throw new TypeError('Modelo mensal do Excel SME inválido.');
        }
        if (!Array.isArray(model.rows) || !model.sheetName || !model.fileName) {
            throw new TypeError('Modelo mensal do Excel SME incompleto.');
        }
    }

    function headerStyle(column) {
        if (column.group === 'IDENTIFICAÇÃO') return STYLE.headerIdentity;
        if (column.group === 'PDDE BÁSICO') return STYLE.headerBasic;
        if (column.group === 'PDDE QUALIDADE') return STYLE.headerQuality;
        if (column.group === 'PDDE EQUIDADE') return STYLE.headerEquity;
        return STYLE.headerAdministrative;
    }

    function bodyStyle(column, alternate) {
        const left = column.alignment === 'left';
        if (left) return alternate ? STYLE.bodyLeftAlternate : STYLE.bodyLeft;
        return alternate ? STYLE.bodyCenterAlternate : STYLE.bodyCenter;
    }

    function columnsXml(columns) {
        return `<cols>${columns.map((column, index) => (
            `<col min="${index + 1}" max="${index + 1}" width="${Number(column.width) || 12}" customWidth="1"/>`
        )).join('')}</cols>`;
    }

    function worksheetXml(model) {
        const lastRow = Math.max(2, model.rows.length + 1);
        const rows = [];
        rows.push(`<row r="1" ht="72" customHeight="1">${model.columns.map((column, index) => (
            inlineCell(`${columnLetter(index + 1)}1`, column.label, headerStyle(column))
        )).join('')}</row>`);

        model.rows.forEach((source, index) => {
            const rowNumber = index + 2;
            const alternate = index % 2 === 1;
            const cells = model.columns.map((column, columnIndex) => {
                const ref = `${columnLetter(columnIndex + 1)}${rowNumber}`;
                const styleId = bodyStyle(column, alternate);
                return column.key === 'order'
                    ? numberCell(ref, source[column.key], styleId)
                    : inlineCell(ref, source[column.key] || '', styleId);
            });
            rows.push(`<row r="${rowNumber}" ht="24" customHeight="1">${cells.join('')}</row>`);
        });

        return XML_HEADER + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
            + '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
            + `<dimension ref="A1:Z${lastRow}"/>`
            + '<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane xSplit="4" ySplit="1" topLeftCell="E2" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="E2" sqref="E2"/></sheetView></sheetViews>'
            + '<sheetFormatPr defaultRowHeight="20"/>'
            + columnsXml(model.columns)
            + `<sheetData>${rows.join('')}</sheetData>`
            + `<autoFilter ref="A1:Z${lastRow}"/>`
            + '<printOptions horizontalCentered="1"/>'
            + '<pageMargins left="0.2" right="0.2" top="0.35" bottom="0.35" header="0.15" footer="0.15"/>'
            + '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
            + `<headerFooter><oddHeader>${xmlEscape(`&C&BCONTROLE DE BONIFICAÇÃO — ${model.sheetName} ${model.competence.year}`)}</oddHeader><oddFooter>${xmlEscape('&L4ª CRE&C&P de &N&RGerado pelo RADAR PDDE')}</oddFooter></headerFooter>`
            + '</worksheet>';
    }

    function stylesXml() {
        return XML_HEADER + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + '<fonts count="2">'
            + '<font><sz val="9"/><color rgb="FF1F2937"/><name val="Arial"/><family val="2"/></font>'
            + '<font><b/><sz val="9"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>'
            + '</fonts>'
            + '<fills count="8">'
            + '<fill><patternFill patternType="none"/></fill>'
            + '<fill><patternFill patternType="gray125"/></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FF17365D"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FF4F81BD"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FF70AD47"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FFED7D31"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FF7F8C8D"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FFF3F6F9"/><bgColor indexed="64"/></patternFill></fill>'
            + '</fills>'
            + '<borders count="2">'
            + '<border><left/><right/><top/><bottom/><diagonal/></border>'
            + '<border><left style="thin"><color rgb="FFB7C3D0"/></left><right style="thin"><color rgb="FFB7C3D0"/></right><top style="thin"><color rgb="FFB7C3D0"/></top><bottom style="thin"><color rgb="FFB7C3D0"/></bottom><diagonal/></border>'
            + '</borders>'
            + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            + '<cellXfs count="10">'
            + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            + [2, 3, 4, 5, 6].map(fillId => `<xf numFmtId="0" fontId="1" fillId="${fillId}" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`).join('')
            + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            + '<xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>'
            + '<xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>'
            + '</cellXfs>'
            + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            + '</styleSheet>';
    }

    function workbookXml(model) {
        const sheetName = xmlEscape(model.sheetName);
        const printName = model.sheetName.replace(/'/g, "''");
        const lastRow = Math.max(2, model.rows.length + 1);
        return XML_HEADER + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            + '<fileVersion appName="xl"/>'
            + '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000" activeTab="0"/></bookViews>'
            + `<sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>`
            + `<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'${printName}'!$A$1:$Z$${lastRow}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'${printName}'!$1:$1</definedName></definedNames>`
            + '<calcPr calcId="191029" calcMode="auto"/>'
            + '</workbook>';
    }

    function buildPackageEntries(model) {
        validateModel(model);
        const createdAt = new Date().toISOString();
        return [
            {
                name: '[Content_Types].xml',
                data: XML_HEADER + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'
            },
            {
                name: '_rels/.rels',
                data: XML_HEADER + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'
            },
            {
                name: 'docProps/core.xml',
                data: XML_HEADER + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Excel SME ${xmlEscape(model.sheetName)}</dc:title><dc:creator>RADAR PDDE</dc:creator><cp:lastModifiedBy>RADAR PDDE</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified></cp:coreProperties>`
            },
            {
                name: 'docProps/app.xml',
                data: XML_HEADER + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>RADAR PDDE</Application><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Planilhas</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${xmlEscape(model.sheetName)}</vt:lpstr></vt:vector></TitlesOfParts></Properties>`
            },
            { name: 'xl/workbook.xml', data: workbookXml(model) },
            {
                name: 'xl/_rels/workbook.xml.rels',
                data: XML_HEADER + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
            },
            { name: 'xl/styles.xml', data: stylesXml() },
            { name: 'xl/worksheets/sheet1.xml', data: worksheetXml(model) }
        ];
    }

    function renderWorkbook(model) {
        return baseRenderer.createZip(buildPackageEntries(model));
    }

    function downloadWorkbook(model, options = {}) {
        const bytes = renderWorkbook(model);
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
        STYLE,
        VERSION,
        buildPackageEntries,
        downloadWorkbook,
        renderWorkbook
    });
}));
