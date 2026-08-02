import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WORKFLOW_EXTENSIONS = new Set(['.yml', '.yaml']);
const NODE_OPTIONS_WITH_VALUE = new Set([
    '--conditions',
    '--env-file',
    '--import',
    '--inspect-port',
    '--loader',
    '--require',
    '--test-reporter',
    '--test-reporter-destination',
    '-r'
]);
const NODE_INLINE_OPTIONS = new Set(['--eval', '--print', '-e', '-p']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules']);

function toPosix(value) {
    return String(value || '').replaceAll('\\', '/');
}

function stripQuotes(value) {
    const text = String(value || '').trim();
    if (text.length >= 2) {
        const first = text[0];
        const last = text[text.length - 1];
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
            return text.slice(1, -1);
        }
    }
    return text;
}

function tokenizeShell(segment) {
    const tokens = [];
    const pattern = /"((?:\\.|[^"\\])*)"|'([^']*)'|([^\s]+)/g;
    let match;

    while ((match = pattern.exec(segment)) !== null) {
        tokens.push(match[1] ?? match[2] ?? match[3] ?? '');
    }

    return tokens;
}

function isDynamicReference(value) {
    const text = String(value || '').trim();
    return !text
        || text.includes('${{')
        || text.includes('$(')
        || text.startsWith('$')
        || text.startsWith('http://')
        || text.startsWith('https://')
        || text.startsWith('<<')
        || text === '-';
}

function cleanReference(value) {
    return toPosix(stripQuotes(value))
        .replace(/^\.\//, '')
        .replace(/[),]+$/, '')
        .trim();
}

function looksLikeLocalPath(value) {
    const text = cleanReference(value);
    if (isDynamicReference(text) || text.startsWith('-')) return false;

    return text.startsWith('../')
        || text.includes('/')
        || /\.(?:cjs|js|json|mjs|ts|tsx|yaml|yml)$/i.test(text);
}

function walkRepository(rootDir) {
    const entries = [];

    function visit(currentDir) {
        for (const item of fs.readdirSync(currentDir, { withFileTypes: true })) {
            if (item.isDirectory() && IGNORED_DIRECTORIES.has(item.name)) continue;
            const absolutePath = path.join(currentDir, item.name);
            const relativePath = toPosix(path.relative(rootDir, absolutePath));
            entries.push(relativePath);
            if (item.isDirectory()) visit(absolutePath);
        }
    }

    visit(rootDir);
    return entries;
}

function globToRegExp(pattern) {
    const source = toPosix(pattern);
    let regex = '^';

    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        const next = source[index + 1];

        if (character === '*' && next === '*') {
            regex += '.*';
            index += 1;
        } else if (character === '*') {
            regex += '[^/]*';
        } else if (character === '?') {
            regex += '[^/]';
        } else {
            regex += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }

    return new RegExp(`${regex}$`);
}

function referenceExists(rootDir, reference, repositoryEntries) {
    const normalized = cleanReference(reference);
    if (isDynamicReference(normalized)) return true;

    if (/[*?]/.test(normalized)) {
        const matcher = globToRegExp(normalized);
        return repositoryEntries.some(entry => matcher.test(entry));
    }

    return fs.existsSync(path.resolve(rootDir, normalized));
}

function addReference(target, workflow, kind, value, options = {}) {
    const reference = cleanReference(value);
    if (isDynamicReference(reference)) return;
    if (options.allowBare !== true && !looksLikeLocalPath(reference)) return;
    target.push({ workflow, kind, reference });
}

function extractNodeReferences(workflow, content, references) {
    const normalized = content.replace(/\\\r?\n[ \t]*/g, ' ');
    const pattern = /\bnode\b([^;&|\n]*)/g;
    let match;

    while ((match = pattern.exec(normalized)) !== null) {
        const tokens = tokenizeShell(match[1]);
        let testMode = false;

        for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];

            if (!token || token.startsWith('>') || token.startsWith('<<')) break;
            if (NODE_INLINE_OPTIONS.has(token) || NODE_INLINE_OPTIONS.has(token.split('=')[0])) break;

            if (token === '--test' || token.startsWith('--test=')) {
                testMode = true;
                continue;
            }

            if (token.startsWith('-')) {
                if (NODE_OPTIONS_WITH_VALUE.has(token) && index + 1 < tokens.length) index += 1;
                continue;
            }

            addReference(references, workflow, testMode ? 'node-test' : 'node-script', token);
            if (!testMode) break;
        }
    }
}

function extractNpmScriptReferences(workflow, content, references) {
    const pattern = /\bnpm\s+(?:--silent\s+)?run\s+([\w:-]+)/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        references.push({ workflow, kind: 'npm-script', reference: match[1] });
    }
}

function extractPlaywrightReferences(workflow, content, references) {
    const normalized = content.replace(/\\\r?\n[ \t]*/g, ' ');
    const pattern = /\b(?:npx\s+)?playwright\s+test\b([^;&|\n]*)/g;
    let match;

    while ((match = pattern.exec(normalized)) !== null) {
        const tokens = tokenizeShell(match[1]);

        for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];
            if (!token || token.startsWith('>')) break;

            if (token === '--config' && index + 1 < tokens.length) {
                addReference(references, workflow, 'playwright-config', tokens[index + 1]);
                index += 1;
                continue;
            }

            if (token.startsWith('--config=')) {
                addReference(references, workflow, 'playwright-config', token.slice('--config='.length));
                continue;
            }

            if (token.startsWith('-')) continue;
            addReference(references, workflow, 'playwright-test', token);
        }
    }
}

function extractYamlPathReferences(workflow, content, references) {
    const keyPattern = /^\s*(?:-\s*)?(cache-dependency-path|working-directory):\s*([^#\r\n]+?)\s*$/gm;
    let match;

    while ((match = keyPattern.exec(content)) !== null) {
        addReference(references, workflow, match[1], match[2], { allowBare: true });
    }

    const actionPattern = /^\s*(?:-\s*)?uses:\s*['"]?(\.[^'"\s#]+)['"]?\s*(?:#.*)?$/gm;
    while ((match = actionPattern.exec(content)) !== null) {
        addReference(references, workflow, 'local-action', match[1], { allowBare: true });
    }
}

export function listWorkflowFiles(rootDir = process.cwd()) {
    const workflowDir = path.join(rootDir, '.github', 'workflows');
    if (!fs.existsSync(workflowDir)) return [];

    return fs.readdirSync(workflowDir, { withFileTypes: true })
        .filter(item => item.isFile() && WORKFLOW_EXTENSIONS.has(path.extname(item.name)))
        .map(item => path.join(workflowDir, item.name))
        .sort();
}

export function analyzeWorkflowReferences(rootDir = process.cwd()) {
    const packagePath = path.join(rootDir, 'package.json');
    const packageScripts = fs.existsSync(packagePath)
        ? JSON.parse(fs.readFileSync(packagePath, 'utf8')).scripts || {}
        : {};
    const repositoryEntries = walkRepository(rootDir);
    const references = [];

    for (const workflowPath of listWorkflowFiles(rootDir)) {
        const workflow = toPosix(path.relative(rootDir, workflowPath));
        const content = fs.readFileSync(workflowPath, 'utf8');
        extractNodeReferences(workflow, content, references);
        extractNpmScriptReferences(workflow, content, references);
        extractPlaywrightReferences(workflow, content, references);
        extractYamlPathReferences(workflow, content, references);
    }

    const uniqueReferences = [...new Map(
        references.map(item => [`${item.workflow}|${item.kind}|${item.reference}`, item])
    ).values()];

    const violations = uniqueReferences.flatMap(item => {
        if (item.kind === 'npm-script') {
            return Object.prototype.hasOwnProperty.call(packageScripts, item.reference)
                ? []
                : [{ ...item, code: 'MISSING_NPM_SCRIPT' }];
        }

        return referenceExists(rootDir, item.reference, repositoryEntries)
            ? []
            : [{ ...item, code: 'MISSING_LOCAL_REFERENCE' }];
    });

    return {
        passed: violations.length === 0,
        workflowCount: listWorkflowFiles(rootDir).length,
        referenceCount: uniqueReferences.length,
        references: uniqueReferences,
        violations
    };
}

export function formatViolation(violation) {
    return `${violation.workflow}: ${violation.kind} aponta para "${violation.reference}" (${violation.code})`;
}

export function run(rootDir = process.cwd()) {
    const result = analyzeWorkflowReferences(rootDir);

    process.stdout.write(
        `Workflows verificados: ${result.workflowCount}; referências locais: ${result.referenceCount}.\n`
    );

    if (!result.passed) {
        for (const violation of result.violations) {
            process.stderr.write(`- ${formatViolation(violation)}\n`);
        }
        process.exitCode = 1;
    } else {
        process.stdout.write('Todas as referências locais verificáveis estão válidas.\n');
    }

    return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) run();
