#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const ROOT = path.resolve(__dirname, '..');

const STATE_ROOTS = Object.freeze({
    escolas: { storageKey: 'radar_pdde_escolas', entities: ['schools', 'schoolPrograms'] },
    pendencias: { storageKey: 'radar_pdde_pendencias', entities: ['pendencies', 'pendencyAttempts'] },
    contatos: { storageKey: 'radar_pdde_contatos', entities: ['pendencyContacts'] },
    logs: { storageKey: 'radar_pdde_logs', entities: ['administrativeLogs'] },
    bens: { storageKey: 'radar_pdde_bens', entities: ['assets'] },
    verificacoes: { storageKey: 'radar_pdde_verificacoes', entities: ['verifications'] },
    config: { storageKey: 'radar_pdde_config', entities: ['appConfig', 'competences'] },
    programas: { storageKey: 'radar_pdde_programas', entities: ['programs'] },
    controladores: { storageKey: 'radar_pdde_controladores', entities: ['controllers'] },
    equipeInventario: {
        storageKey: 'radar_pdde_equipe_inventario',
        entities: ['inventoryTeamMembers']
    },
    notasRegistradas: {
        storageKey: 'radar_pdde_notas_registradas',
        entities: ['registeredInvoices']
    }
});

const STORAGE_KEY_CLASSIFICATION = Object.freeze({
    radar_pdde_escolas: 'business',
    radar_pdde_pendencias: 'business',
    radar_pdde_contatos: 'business',
    radar_pdde_logs: 'business',
    radar_pdde_bens: 'business',
    radar_pdde_verificacoes: 'business',
    radar_pdde_config: 'business',
    radar_pdde_programas: 'business',
    radar_pdde_controladores: 'business',
    radar_pdde_equipe_inventario: 'business',
    radar_pdde_notas_registradas: 'business',
    radar_pdde_data_version: 'local-metadata',
    radar_pdde_pendency_schema_version: 'local-metadata',
    radar_pdde_theme: 'local-preference'
});

const PERSIST_TABLE_MAP = Object.freeze({
    escolas: ['schools', 'schoolPrograms'],
    pendencias: ['pendencies', 'pendencyAttempts'],
    contatos: ['pendencyContacts'],
    logs: ['administrativeLogs'],
    bens: ['assets'],
    verificacoes: ['verifications'],
    config: ['appConfig', 'competences'],
    programas: ['programs'],
    controladores: ['controllers'],
    equipe_inventario: ['inventoryTeamMembers'],
    notas_registradas: ['registeredInvoices']
});

const CONFIG_FIELD_MAP = Object.freeze({
    exercicios: ['app_config.exercises', 'competences.exercise'],
    competenciaFechamento: ['app_config.closing_competence'],
    prazoBonificacaoProrrogado: ['app_config.bonus_deadline_extended', 'app_config.settings'],
    competencias: ['competences']
});

const INITIALIZATION_MUTATORS = new Set([
    'initData',
    'loadLocalFallback',
    'seedLocalDataFromInitials'
]);

const MUTATING_METHODS = new Set([
    'push', 'pop', 'shift', 'unshift', 'splice', 'copyWithin', 'fill',
    'set', 'delete', 'clear'
]);

const INLINE_GLOBALS = new Set(['event', 'this', 'window', 'document', 'return']);

function listFilesRecursively(directory, predicate = () => true) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return listFilesRecursively(absolute, predicate);
        return predicate(absolute) ? [absolute] : [];
    });
}

function relative(filePath) {
    return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readSourceFiles() {
    const sourceFiles = [
        path.join(ROOT, 'app.js'),
        path.join(ROOT, 'config.js'),
        ...listFilesRecursively(path.join(ROOT, 'src'), filePath => filePath.endsWith('.js'))
    ].filter(fs.existsSync);

    return sourceFiles.map(filePath => ({
        filePath,
        file: relative(filePath),
        source: fs.readFileSync(filePath, 'utf8')
    }));
}

function parseJavaScript(source, file) {
    const options = {
        ecmaVersion: 'latest',
        allowHashBang: true,
        locations: true
    };
    try {
        return acorn.parse(source, { ...options, sourceType: 'script' });
    } catch (scriptError) {
        try {
            return acorn.parse(source, { ...options, sourceType: 'module' });
        } catch (moduleError) {
            moduleError.message = `${file}: ${moduleError.message}`;
            throw moduleError;
        }
    }
}

function propertyName(member) {
    if (!member || member.type !== 'MemberExpression') return '';
    if (!member.computed && member.property.type === 'Identifier') return member.property.name;
    if (member.computed && member.property.type === 'Literal') return String(member.property.value);
    return '';
}

function rootIdentifier(node) {
    let current = node;
    while (current && (current.type === 'MemberExpression' || current.type === 'ChainExpression')) {
        current = current.type === 'ChainExpression' ? current.expression : current.object;
    }
    return current && current.type === 'Identifier' ? current.name : '';
}

function assignedFunctionName(node, ancestors) {
    if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
    const parent = ancestors[ancestors.length - 2];
    if (!parent) return '';
    if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;
    if (parent.type === 'AssignmentExpression') {
        if (parent.left.type === 'Identifier') return parent.left.name;
        if (parent.left.type === 'MemberExpression') return propertyName(parent.left);
    }
    if (parent.type === 'Property') {
        if (parent.key.type === 'Identifier') return parent.key.name;
        if (parent.key.type === 'Literal') return String(parent.key.value);
    }
    return '';
}

function nearestFunctionName(ancestors, functionNames) {
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const ancestor = ancestors[index];
        if (/Function/.test(ancestor.type) || ancestor.type === 'ArrowFunctionExpression') {
            return functionNames.get(ancestor) || '<anonymous>';
        }
    }
    return '<top-level>';
}

function calleeName(callee) {
    if (!callee) return '';
    if (callee.type === 'Identifier') return callee.name;
    if (callee.type === 'MemberExpression') return propertyName(callee);
    if (callee.type === 'ChainExpression') return calleeName(callee.expression);
    return '';
}

function literalString(node, constants) {
    if (!node) return null;
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis.map(quasi => quasi.value.cooked).join('');
    }
    if (node.type === 'Identifier' && constants.has(node.name)) return constants.get(node.name);
    return null;
}

function ensureFunctionRecord(functions, name, file = '', line = null) {
    if (!functions.has(name)) {
        functions.set(name, {
            name,
            file,
            line,
            calls: new Set(),
            mutations: new Set(),
            storageReads: new Set(),
            storageWrites: new Set(),
            persistTables: new Set(),
            directPersistence: false
        });
    }
    const record = functions.get(name);
    if (!record.file && file) record.file = file;
    if (!record.line && line) record.line = line;
    return record;
}

function inspectJavaScript(files) {
    const functions = new Map();
    const functionNames = new WeakMap();
    const constants = new Map();
    const storageKeys = new Set();
    const persistTables = new Set();
    const configFields = new Set();
    const globalDefinitions = new Set();

    files.forEach(({ source, file }) => {
        const ast = parseJavaScript(source, file);

        walk.fullAncestor(ast, (node, _state, ancestors) => {
            if (node.type === 'VariableDeclarator'
                && node.id.type === 'Identifier'
                && node.init?.type === 'Literal'
                && typeof node.init.value === 'string') {
                constants.set(node.id.name, node.init.value);
            }

            if (node.type === 'FunctionDeclaration'
                || node.type === 'FunctionExpression'
                || node.type === 'ArrowFunctionExpression') {
                const name = assignedFunctionName(node, ancestors);
                if (name) {
                    functionNames.set(node, name);
                    globalDefinitions.add(name);
                    ensureFunctionRecord(functions, name, file, node.loc?.start.line || null);
                }
            }
        });

        walk.fullAncestor(ast, (node, _state, ancestors) => {
            const functionName = nearestFunctionName(ancestors, functionNames);
            const record = ensureFunctionRecord(functions, functionName, file, node.loc?.start.line || null);

            if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
                const left = node.type === 'AssignmentExpression' ? node.left : node.argument;
                const stateRoot = rootIdentifier(left);
                if (Object.prototype.hasOwnProperty.call(STATE_ROOTS, stateRoot)) {
                    record.mutations.add(stateRoot);
                }

                if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
                    const objectRoot = rootIdentifier(node.left);
                    if (['window', 'globalThis', 'root'].includes(objectRoot)) {
                        const name = propertyName(node.left);
                        if (name) globalDefinitions.add(name);
                    }
                }
            }

            if (node.type !== 'CallExpression') return;

            const called = calleeName(node.callee);
            if (called) record.calls.add(called);

            if (called === 'persist' || called === 'persistSingleTableSupabase') {
                record.directPersistence = true;
                const table = literalString(node.arguments[0], constants);
                if (table) {
                    record.persistTables.add(table);
                    persistTables.add(table);
                }
            } else if (called === 'registerLog') {
                // registerLog grava o log e invoca persist(); seu primeiro argumento é uma ação, não tabela.
                record.directPersistence = true;
            }

            if (node.callee.type === 'MemberExpression') {
                const objectRoot = rootIdentifier(node.callee.object);
                const method = propertyName(node.callee);

                if (Object.prototype.hasOwnProperty.call(STATE_ROOTS, objectRoot)
                    && MUTATING_METHODS.has(method)) {
                    record.mutations.add(objectRoot);
                }

                if (objectRoot === 'localStorage' && ['getItem', 'setItem', 'removeItem'].includes(method)) {
                    const key = literalString(node.arguments[0], constants);
                    if (key) {
                        storageKeys.add(key);
                        if (method === 'getItem') {
                            record.storageReads.add(key);
                        } else {
                            record.storageWrites.add(key);
                            record.directPersistence = true;
                        }
                    }
                }
            }

            if (called === 'assign'
                && node.callee.type === 'MemberExpression'
                && rootIdentifier(node.callee.object) === 'Object') {
                const stateRoot = rootIdentifier(node.arguments[0]);
                if (Object.prototype.hasOwnProperty.call(STATE_ROOTS, stateRoot)) {
                    record.mutations.add(stateRoot);
                }
            }
        });

        walk.full(ast, node => {
            if (node.type !== 'MemberExpression') return;
            if (node.object?.type !== 'Identifier' || node.object.name !== 'config') return;
            const field = propertyName(node);
            if (field) configFields.add(field);
        });
    });

    const reachesPersistenceMemo = new Map();
    function reachesPersistence(name, stack = new Set()) {
        if (reachesPersistenceMemo.has(name)) return reachesPersistenceMemo.get(name);
        if (stack.has(name)) return false;
        const record = functions.get(name);
        if (!record) return false;
        if (record.directPersistence) {
            reachesPersistenceMemo.set(name, true);
            return true;
        }
        const nextStack = new Set(stack).add(name);
        const result = [...record.calls].some(called => reachesPersistence(called, nextStack));
        reachesPersistenceMemo.set(name, result);
        return result;
    }

    const callers = new Map();
    functions.forEach(record => {
        record.calls.forEach(called => {
            if (!callers.has(called)) callers.set(called, new Set());
            callers.get(called).add(record.name);
        });
    });

    const hasPersistingCallerMemo = new Map();
    function hasPersistingCaller(name, stack = new Set()) {
        if (hasPersistingCallerMemo.has(name)) return hasPersistingCallerMemo.get(name);
        if (stack.has(name)) return false;
        const directCallers = [...(callers.get(name) || [])];
        const nextStack = new Set(stack).add(name);
        const result = directCallers.some(caller => (
            reachesPersistence(caller) || hasPersistingCaller(caller, nextStack)
        ));
        hasPersistingCallerMemo.set(name, result);
        return result;
    }

    const mutationFunctions = [...functions.values()]
        .filter(record => record.mutations.size > 0)
        .map(record => ({
            name: record.name,
            file: record.file,
            line: record.line,
            mutations: [...record.mutations].sort(),
            persistTables: [...record.persistTables].sort(),
            directOrTransitivePersistence: reachesPersistence(record.name),
            persistedByCaller: hasPersistingCaller(record.name),
            callers: [...(callers.get(record.name) || [])].sort()
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

    return {
        functions,
        globalDefinitions,
        storageKeys: [...storageKeys].sort(),
        persistTables: [...persistTables].sort(),
        configFields: [...configFields].sort(),
        mutationFunctions
    };
}

function extractInlineHandlers(text) {
    const handlers = [];
    const pattern = /\bon(?:click|submit|change|input|blur|keydown|keyup)\s*=\s*["']\s*([A-Za-z_$][\w$]*)/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (!INLINE_GLOBALS.has(match[1])) handlers.push(match[1]);
    }
    return handlers;
}

function extractFormControls(text) {
    const controls = [];
    const pattern = /<(input|select|textarea)\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (!match[2].includes('${')) {
            controls.push({ tag: match[1].toLowerCase(), id: match[2] });
        }
    }
    return controls;
}

function inspectMarkup(files) {
    const htmlPath = path.join(ROOT, 'index.html');
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
    const jsText = files.map(file => file.source).join('\n');
    const allText = `${html}\n${jsText}`;
    const handlers = [...new Set(extractInlineHandlers(allText))].sort();
    const controls = extractFormControls(allText)
        .filter((control, index, collection) => (
            collection.findIndex(candidate => candidate.id === control.id) === index
        ));

    const unusedControls = controls
        .filter(control => {
            const escaped = control.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const getById = new RegExp(`getElementById\\(\\s*['\"]${escaped}['\"]\\s*\\)`);
            const selector = new RegExp(`querySelector(?:All)?\\(\\s*['\"][^'\"]*#${escaped}(?:[^'\"]*)['\"]\\s*\\)`);
            const literalReference = new RegExp(`['\"]${escaped}['\"]`);
            return !getById.test(jsText) && !selector.test(jsText) && !literalReference.test(jsText);
        })
        .sort((left, right) => left.id.localeCompare(right.id));

    return { handlers, controls, unusedControls };
}

function buildFindings(jsInspection, markupInspection, files) {
    const findings = [];
    const adapterSource = files.find(file => file.file === 'src/data/legacy-state-adapter.js')?.source || '';

    jsInspection.storageKeys.forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(STORAGE_KEY_CLASSIFICATION, key)) {
            findings.push(`Chave de armazenamento sem classificação: ${key}.`);
        }
    });

    Object.entries(STORAGE_KEY_CLASSIFICATION)
        .filter(([, classification]) => classification === 'business')
        .forEach(([key]) => {
            if (!adapterSource.includes(key)) {
                findings.push(`Chave de negócio não coberta pelo adaptador legado: ${key}.`);
            }
        });

    jsInspection.persistTables.forEach(table => {
        if (!Object.prototype.hasOwnProperty.call(PERSIST_TABLE_MAP, table)) {
            findings.push(`Tabela usada por persistência sem tradução canônica: ${table}.`);
        }
    });

    jsInspection.configFields.forEach(field => {
        if (!Object.prototype.hasOwnProperty.call(CONFIG_FIELD_MAP, field)) {
            findings.push(`Campo de configuração sem tradução para Supabase: config.${field}.`);
        }
    });

    jsInspection.mutationFunctions.forEach(record => {
        if (record.name === '<top-level>' || INITIALIZATION_MUTATORS.has(record.name)) return;
        if (!record.directOrTransitivePersistence && !record.persistedByCaller) {
            findings.push(
                `Mutação sem caminho de persistência identificado: ${record.name} `
                + `(${record.file}:${record.line || '?'}) altera ${record.mutations.join(', ')}.`
            );
        }
    });

    markupInspection.handlers.forEach(handler => {
        if (!jsInspection.globalDefinitions.has(handler)) {
            findings.push(`Handler de interface sem definição global encontrada: ${handler}.`);
        }
    });

    markupInspection.unusedControls.forEach(control => {
        findings.push(`Campo de formulário aparentemente não consumido pelo JavaScript: #${control.id}.`);
    });

    return [...new Set(findings)].sort();
}

function runAudit() {
    const files = readSourceFiles();
    const jsInspection = inspectJavaScript(files);
    const markupInspection = inspectMarkup(files);
    const findings = buildFindings(jsInspection, markupInspection, files);

    return {
        generatedAt: new Date().toISOString(),
        sourceFiles: files.map(file => file.file),
        stateRoots: STATE_ROOTS,
        storageKeys: jsInspection.storageKeys.map(key => ({
            key,
            classification: STORAGE_KEY_CLASSIFICATION[key] || 'unclassified'
        })),
        persistTables: jsInspection.persistTables.map(table => ({
            table,
            entities: PERSIST_TABLE_MAP[table] || []
        })),
        configFields: jsInspection.configFields.map(field => ({
            field,
            targets: CONFIG_FIELD_MAP[field] || []
        })),
        mutationFunctions: jsInspection.mutationFunctions,
        inlineHandlers: markupInspection.handlers,
        formControls: markupInspection.controls,
        findings
    };
}

function main() {
    const report = runAudit();
    const asJson = process.argv.includes('--json');

    if (asJson) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        console.log('Auditoria funcional e de persistência do RADAR PDDE');
        console.log(`- arquivos JavaScript: ${report.sourceFiles.length}`);
        console.log(`- raízes de estado: ${Object.keys(report.stateRoots).length}`);
        console.log(`- chaves localStorage: ${report.storageKeys.length}`);
        console.log(`- funções com mutação de dados: ${report.mutationFunctions.length}`);
        console.log(`- handlers de interface: ${report.inlineHandlers.length}`);
        console.log(`- campos de formulário: ${report.formControls.length}`);
    }

    if (report.findings.length > 0) {
        console.error(`Auditoria reprovada com ${report.findings.length} achado(s):`);
        report.findings.forEach(finding => console.error(`- ${finding}`));
        process.exitCode = 1;
        return;
    }

    console.log('Auditoria aprovada: cobertura estrutural sem lacunas detectadas.');
}

if (require.main === module) main();

module.exports = Object.freeze({
    STATE_ROOTS,
    STORAGE_KEY_CLASSIFICATION,
    PERSIST_TABLE_MAP,
    CONFIG_FIELD_MAP,
    runAudit,
    inspectJavaScript,
    inspectMarkup
});
