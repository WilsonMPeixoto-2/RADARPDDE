(function (root, factory) {
    const modelApi = typeof module === 'object' && module.exports
        ? require('./excel-sme-export-model.js')
        : root && root.RadarExcelSmeExportModel;
    const zipApi = typeof module === 'object' && module.exports
        ? require('./excel-sme-zip.js')
        : root && root.RadarExcelSmeZip;
    const api = factory(root, modelApi, zipApi);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarExcelSmeTemplateRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, modelApi, zipApi) {
    'use strict';

    if (!modelApi) throw new Error('Modelo Excel SME não foi carregado.');
    if (!zipApi) throw new Error('Suporte ZIP do Excel SME não foi carregado.');

    const VERSION = '0.1.0';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');

    function xmlEscape(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function xmlDecode(value) {
        return String(value == null ? '' : value)
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function findCellMatch(xml, ref) {
        const escaped = escapeRegExp(ref);
        const selfClosing = new RegExp(`<c\\b(?=[^>]*\\br="${escaped}")[^>]*?\\/>`);
        const expanded = new RegExp(`<c\\b(?=[^>]*\\br="${escaped}")[^>]*>[\\s\\S]*?<\\/c>`);
        return selfClosing.exec(xml) || expanded.exec(xml);
    }

    function extractAttributes(cellXml) {
        const opening = /^<c\b([^>]*?)(?:\/?>)/.exec(cellXml);
        if (!opening) throw new Error('Célula XML inválida.');
        const attrs = opening[1]
            .replace(/\s+t="[^"]*"/g, '')
            .replace(/\s*\/$/, '')
            .trim();
        return attrs ? ` ${attrs}` : '';
    }

    function setCellText(xml, ref, value) {
        const match = findCellMatch(xml, ref);
        if (!match) {
            const error = new Error(`A célula ${ref} não existe no modelo SME.`);
            error.code = 'MISSING_TEMPLATE_CELL';
            throw error;
        }
        const attrs = extractAttributes(match[0]);
        const replacement = value === ''
            ? `<c${attrs}/>`
            : `<c${attrs} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
        return xml.slice(0, match.index) + replacement + xml.slice(match.index + match[0].length);
    }

    function readSharedStrings(xml) {
        if (!xml) return [];
        const values = [];
        const itemRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
        let item;
        while ((item = itemRegex.exec(xml))) {
            const texts = [];
            const textRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
            let textMatch;
            while ((textMatch = textRegex.exec(item[1]))) texts.push(xmlDecode(textMatch[1]));
            values.push(texts.join(''));
        }
        return values;
    }

    function readCellValue(xml, ref, sharedStrings = []) {
        const match = findCellMatch(xml, ref);
        if (!match) return '';
        const cell = match[0];
        const typeMatch = /\bt="([^"]+)"/.exec(cell);
        const type = typeMatch ? typeMatch[1] : '';
        if (type === 'inlineStr') {
            const texts = [];
            const textRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
            let textMatch;
            while ((textMatch = textRegex.exec(cell))) texts.push(xmlDecode(textMatch[1]));
            return texts.join('');
        }
        const valueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cell);
        if (!valueMatch) return '';
        const raw = xmlDecode(valueMatch[1]);
        return type === 's' ? (sharedStrings[Number(raw)] || '') : raw;
    }

    function parseSheetTargets(workbookXml, relationshipsXml) {
        const relationMap = new Map();
        const relationRegex = /<Relationship\b([^>]*?)\/>/g;
        let relation;
        while ((relation = relationRegex.exec(relationshipsXml))) {
            const attrs = relation[1];
            const id = /\bId="([^"]+)"/.exec(attrs)?.[1];
            const target = /\bTarget="([^"]+)"/.exec(attrs)?.[1];
            if (id && target) relationMap.set(id, target);
        }

        const map = new Map();
        const order = [];
        const sheetRegex = /<sheet\b([^>]*?)\/>/g;
        let sheet;
        while ((sheet = sheetRegex.exec(workbookXml))) {
            const attrs = sheet[1];
            const name = xmlDecode(/\bname="([^"]+)"/.exec(attrs)?.[1] || '');
            const relationId = /\br:id="([^"]+)"/.exec(attrs)?.[1];
            const target = relationMap.get(relationId);
            if (!name || !target) continue;
            const normalized = target.startsWith('/')
                ? target.slice(1)
                : `xl/${target.replace(/^\.\//, '')}`;
            map.set(name, normalized);
            order.push(name);
        }
        return { map, order };
    }

    function countFormulas(xml) {
        return (xml.match(/<f(?:\s|>)/g) || []).length;
    }

    function forceWorkbookRecalculation(workbookXml) {
        const calcRegex = /<calcPr\b([^>]*?)\/>/;
        const match = calcRegex.exec(workbookXml);
        const required = { calcMode: 'auto', fullCalcOnLoad: '1', forceFullCalc: '1' };
        if (!match) {
            return workbookXml.replace(
                '</workbook>',
                '<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>'
            );
        }
        let attrs = match[1];
        Object.entries(required).forEach(([name, value]) => {
            const regex = new RegExp(`\\s${name}="[^"]*"`);
            if (regex.test(attrs)) attrs = attrs.replace(regex, ` ${name}="${value}"`);
            else attrs += ` ${name}="${value}"`;
        });
        return workbookXml.slice(0, match.index)
            + `<calcPr${attrs}/>`
            + workbookXml.slice(match.index + match[0].length);
    }

    function validateTemplateStructure(model, entriesByName, sharedStrings, sheetTargets) {
        const expectedOrder = model.template.expectedSheetOrder || [];
        if (JSON.stringify(sheetTargets.order) !== JSON.stringify(expectedOrder)) {
            const error = new Error('A ordem ou os nomes das abas do modelo SME foram alterados.');
            error.code = 'SME_TEMPLATE_SHEETS_CHANGED';
            error.details = { expected: expectedOrder, actual: sheetTargets.order };
            throw error;
        }

        expectedOrder.forEach(name => {
            const target = sheetTargets.map.get(name);
            if (!target || !entriesByName.has(target)) {
                const error = new Error(`A aba ${name} não foi localizada no arquivo modelo.`);
                error.code = 'SME_TEMPLATE_SHEET_MISSING';
                throw error;
            }
        });

        expectedOrder.slice(0, 12).forEach(name => {
            const xml = decoder.decode(entriesByName.get(sheetTargets.map.get(name)).bytes);
            const designationValues = new Set();
            for (let row = model.template.firstDataRow; row <= model.template.lastDataRow; row += 1) {
                const designation = modelApi.normalizeDesignation(readCellValue(xml, `C${row}`, sharedStrings));
                if (!designation || designationValues.has(designation)) {
                    const error = new Error(`A coluna de designação da aba ${name} não corresponde ao modelo esperado.`);
                    error.code = 'SME_TEMPLATE_DESIGNATIONS_CHANGED';
                    error.details = { sheetName: name, row, designation };
                    throw error;
                }
                designationValues.add(designation);
            }
            if (countFormulas(xml) !== 163) {
                const error = new Error(`As fórmulas da aba ${name} foram alteradas no modelo SME.`);
                error.code = 'SME_TEMPLATE_FORMULAS_CHANGED';
                throw error;
            }
        });

        const consolidated = decoder.decode(entriesByName.get(sheetTargets.map.get('CONSOLIDADO')).bytes);
        if (countFormulas(consolidated) !== 1956) {
            const error = new Error('As fórmulas da aba CONSOLIDADO foram alteradas no modelo SME.');
            error.code = 'SME_TEMPLATE_FORMULAS_CHANGED';
            throw error;
        }
    }

    function applyRecordsToSheet(xml, sheetName, records, sharedStrings, model) {
        const rowByDesignation = new Map();
        for (let row = model.template.firstDataRow; row <= model.template.lastDataRow; row += 1) {
            const designation = modelApi.normalizeDesignation(readCellValue(xml, `C${row}`, sharedStrings));
            rowByDesignation.set(designation, row);
        }

        let result = xml;
        const unmatched = [];
        records.forEach(record => {
            const row = rowByDesignation.get(record.designationKey);
            if (!row) {
                unmatched.push({
                    sheetName,
                    designation: record.designation,
                    denomination: record.denomination
                });
                return;
            }
            const columns = modelApi.getProgramColumns(sheetName, record.programKey);
            record.values.forEach((value, index) => {
                result = setCellText(result, `${columns[index]}${row}`, value);
            });
        });
        if (unmatched.length > 0) {
            const error = new Error('Há escolas consolidadas no RADAR que não existem no modelo Excel da SME.');
            error.code = 'SCHOOL_NOT_IN_SME_TEMPLATE';
            error.details = unmatched;
            throw error;
        }
        return result;
    }

    async function loadTemplateBytes(model, options = {}) {
        if (options.templateBytes) return zipApi.asUint8Array(options.templateBytes);
        const fetchImpl = options.fetch || root?.fetch;
        if (typeof fetchImpl !== 'function') throw new Error('Não foi possível carregar o modelo Excel SME.');
        const parts = Array.isArray(model.template.parts) ? model.template.parts : [];
        if (!parts.length) throw new Error('As partes do arquivo-base Excel SME não foram configuradas.');
        const responses = await Promise.all(parts.map(url => fetchImpl(url, { cache: 'no-store' })));
        const failed = responses.find(response => !response || !response.ok);
        if (failed) {
            const error = new Error(`Falha ao carregar o modelo Excel SME (${failed?.status || 'sem resposta'}).`);
            error.code = 'SME_TEMPLATE_DOWNLOAD_FAILED';
            throw error;
        }
        const texts = await Promise.all(responses.map(response => response.text()));
        return zipApi.decodeBase64Text(texts.join(''));
    }

    async function renderWorkbook(model, options = {}) {
        if (!model || !Array.isArray(model.records)) throw new Error('Modelo de exportação Excel SME inválido.');
        const templateBytes = await loadTemplateBytes(model, options);
        const actualHash = await zipApi.sha256Hex(templateBytes);
        if (actualHash && model.template.sha256 && actualHash !== model.template.sha256) {
            const error = new Error('O arquivo-base do Excel SME não corresponde ao modelo aprovado.');
            error.code = 'SME_TEMPLATE_HASH_MISMATCH';
            error.details = { expected: model.template.sha256, actual: actualHash };
            throw error;
        }

        const entries = await zipApi.readZipEntries(templateBytes);
        const entriesByName = new Map(entries.map(entry => [entry.name, entry]));
        const workbookEntry = entriesByName.get('xl/workbook.xml');
        const relationshipsEntry = entriesByName.get('xl/_rels/workbook.xml.rels');
        if (!workbookEntry || !relationshipsEntry) throw new Error('Estrutura do workbook SME incompleta.');

        const workbookXml = decoder.decode(workbookEntry.bytes);
        const relationshipsXml = decoder.decode(relationshipsEntry.bytes);
        const sharedStringsEntry = entriesByName.get('xl/sharedStrings.xml');
        const sharedStrings = readSharedStrings(sharedStringsEntry ? decoder.decode(sharedStringsEntry.bytes) : '');
        const sheetTargets = parseSheetTargets(workbookXml, relationshipsXml);
        validateTemplateStructure(model, entriesByName, sharedStrings, sheetTargets);

        const recordsBySheet = new Map();
        model.records.forEach(record => {
            if (!recordsBySheet.has(record.sheetName)) recordsBySheet.set(record.sheetName, []);
            recordsBySheet.get(record.sheetName).push(record);
        });

        model.template.expectedSheetOrder.slice(0, 12).forEach(sheetName => {
            const target = sheetTargets.map.get(sheetName);
            const entry = entriesByName.get(target);
            const originalXml = decoder.decode(entry.bytes);
            const originalFormulaCount = countFormulas(originalXml);
            const patchedXml = applyRecordsToSheet(
                originalXml,
                sheetName,
                recordsBySheet.get(sheetName) || [],
                sharedStrings,
                model
            );
            if (countFormulas(patchedXml) !== originalFormulaCount) {
                const error = new Error(`A geração tentou alterar fórmulas da aba ${sheetName}.`);
                error.code = 'SME_FORMULA_PRESERVATION_FAILED';
                throw error;
            }
            entry.bytes = encoder.encode(patchedXml);
        });

        workbookEntry.bytes = encoder.encode(forceWorkbookRecalculation(workbookXml));
        return zipApi.buildStoredZip(entries);
    }

    async function downloadWorkbook(model, options = {}) {
        const bytes = await renderWorkbook(model, options);
        if (!root?.document || typeof root.URL?.createObjectURL !== 'function') {
            return { bytes, fileName: model.fileName };
        }
        const blob = new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = root.URL.createObjectURL(blob);
        const link = root.document.createElement('a');
        link.href = url;
        link.download = options.fileName || model.fileName;
        link.style.display = 'none';
        root.document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => root.URL.revokeObjectURL(url), 1000);
        return { bytes, blob, url, fileName: link.download };
    }

    return Object.freeze({
        VERSION,
        applyRecordsToSheet,
        countFormulas,
        downloadWorkbook,
        forceWorkbookRecalculation,
        parseSheetTargets,
        readCellValue,
        readSharedStrings,
        renderWorkbook,
        setCellText,
        validateTemplateStructure
    });
}));
