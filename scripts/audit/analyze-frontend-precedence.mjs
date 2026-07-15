import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import * as walk from 'acorn-walk';

const DEFAULT_EXCEL_LOADER = 'src/integration/load-excel-export.js';
const DEFAULT_OUTPUT = 'docs/evidence/frontend-precedence/manifest.json';
const GROUPING_AT_RULES = new Set(['@media', '@supports', '@container', '@layer', '@document', '@scope']);
const SKIPPED_AT_RULES = new Set(['@keyframes', '@-webkit-keyframes']);
const GLOBAL_ROOT_NAMES = new Set(['root', 'window', 'globalThis']);

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\//, '');
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function attributeValue(tag, attributeName) {
  const escaped = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const quoted = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  if (quoted) return quoted[2];
  const unquoted = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*([^\\s>]+)`, 'i'));
  return unquoted ? unquoted[1] : null;
}

export function extractStaticAssets(indexSource) {
  const styles = [];
  const scripts = [];

  for (const match of indexSource.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attributeValue(match[0], 'rel');
    const href = attributeValue(match[0], 'href');
    if (href && rel?.toLowerCase().split(/\s+/).includes('stylesheet')) styles.push(normalizePath(href));
  }

  for (const match of indexSource.matchAll(/<script\b[^>]*>/gi)) {
    const src = attributeValue(match[0], 'src');
    if (!src) continue;
    scripts.push({
      src: normalizePath(src),
      extensionMarker: attributeValue(match[0], 'data-radar-extension')
        ? normalizePath(attributeValue(match[0], 'data-radar-extension'))
        : null
    });
  }

  return { styles, scripts };
}

export function extractConfigExtensions(configSource) {
  const styles = [...configSource.matchAll(/loadStylesheet\(\s*(["'])(.*?)\1\s*\)/g)]
    .map(match => normalizePath(match[2]));
  const scripts = [...configSource.matchAll(/loadScript\(\s*(["'])(.*?)\1\s*,\s*(true|false)\s*\)/g)]
    .map(match => ({ src: normalizePath(match[2]), async: match[3] === 'true' }));
  return { styles, scripts };
}

export function extractChainedScripts(loaderSource) {
  const arrayMatch = loaderSource.match(/\bconst\s+scripts\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!arrayMatch) return [];
  return [...arrayMatch[1].matchAll(/(["'])(.*?\.js)\1/g)].map(match => normalizePath(match[2]));
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\r\n]/g, ' '));
}

function findMatchingBrace(source, openIndex, end) {
  let depth = 1;
  let quote = null;
  let escaped = false;
  for (let index = openIndex + 1; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error(`Bloco CSS sem fechamento a partir do índice ${openIndex}`);
}

function splitTopLevel(source, separator) {
  const values = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let parentheses = 0;
  let brackets = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (character === separator && parentheses === 0 && brackets === 0) {
      values.push(source.slice(start, index));
      start = index + 1;
    }
  }
  values.push(source.slice(start));
  return values;
}

function topLevelColon(source) {
  let quote = null;
  let escaped = false;
  let parentheses = 0;
  let brackets = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (character === ':' && parentheses === 0 && brackets === 0) return index;
  }
  return -1;
}

function parseDeclarations(source) {
  const raw = [];
  for (const part of splitTopLevel(source, ';')) {
    const declaration = part.trim();
    if (!declaration) continue;
    const colon = topLevelColon(declaration);
    if (colon < 1) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    let value = normalizeWhitespace(declaration.slice(colon + 1));
    const important = /\s*!important\s*$/i.test(value);
    if (important) value = value.replace(/\s*!important\s*$/i, '').trim();
    raw.push({ property, value, important });
  }

  const effective = new Map();
  for (const declaration of raw) effective.set(declaration.property, declaration);
  return { raw, effective: [...effective.values()] };
}

function atRuleName(prelude) {
  return prelude.toLowerCase().match(/^@[a-z-]+/)?.[0] || '';
}

export function parseCssStylesheet(source, filePath, sheetOrder = 0) {
  const css = stripCssComments(source);
  const occurrences = [];
  const metrics = {
    path: normalizePath(filePath),
    sheetOrder,
    styleRuleBlocks: 0,
    selectorOccurrences: 0,
    declarations: 0,
    importantDeclarations: 0,
    contexts: []
  };
  const contextsSeen = new Set(['global']);
  let localRuleOrder = 0;

  function visit(start, end, contexts) {
    let cursor = start;
    while (cursor < end) {
      while (cursor < end && /\s/.test(css[cursor])) cursor += 1;
      if (cursor >= end) break;

      const preludeStart = cursor;
      let quote = null;
      let escaped = false;
      let parentheses = 0;
      let brackets = 0;
      let boundary = -1;
      let boundaryType = null;

      for (let index = cursor; index < end; index += 1) {
        const character = css[index];
        if (quote) {
          if (escaped) escaped = false;
          else if (character === '\\') escaped = true;
          else if (character === quote) quote = null;
          continue;
        }
        if (character === '"' || character === "'") quote = character;
        else if (character === '(') parentheses += 1;
        else if (character === ')') parentheses = Math.max(0, parentheses - 1);
        else if (character === '[') brackets += 1;
        else if (character === ']') brackets = Math.max(0, brackets - 1);
        else if (parentheses === 0 && brackets === 0 && (character === '{' || character === ';')) {
          boundary = index;
          boundaryType = character;
          break;
        }
      }

      if (boundary < 0) break;
      if (boundaryType === ';') {
        cursor = boundary + 1;
        continue;
      }

      const prelude = normalizeWhitespace(css.slice(preludeStart, boundary));
      const close = findMatchingBrace(css, boundary, end);
      const body = css.slice(boundary + 1, close);
      const name = atRuleName(prelude);

      if (name) {
        if (GROUPING_AT_RULES.has(name)) {
          const context = normalizeWhitespace(prelude);
          contextsSeen.add([...contexts, context].join(' > '));
          visit(boundary + 1, close, [...contexts, context]);
        } else if (!SKIPPED_AT_RULES.has(name)) {
          if (body.includes('{')) visit(boundary + 1, close, contexts);
          else {
            const declarations = parseDeclarations(body).raw;
            metrics.declarations += declarations.length;
            metrics.importantDeclarations += declarations.filter(item => item.important).length;
          }
        }
        cursor = close + 1;
        continue;
      }

      const selectors = splitTopLevel(prelude, ',').map(normalizeWhitespace).filter(Boolean);
      const declarations = parseDeclarations(body);
      metrics.styleRuleBlocks += 1;
      metrics.selectorOccurrences += selectors.length;
      metrics.declarations += declarations.raw.length;
      metrics.importantDeclarations += declarations.raw.filter(item => item.important).length;
      localRuleOrder += 1;
      const context = contexts.length ? contexts.join(' > ') : 'global';
      contextsSeen.add(context);

      for (const selector of selectors) {
        occurrences.push({
          path: normalizePath(filePath),
          sheetOrder,
          ruleOrder: localRuleOrder,
          context,
          selector,
          declarations: declarations.effective
        });
      }
      cursor = close + 1;
    }
  }

  visit(0, css.length, []);
  metrics.contexts = [...contextsSeen].sort(compareText);
  return { metrics, occurrences };
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function summarizeCss(parsedStylesheets) {
  const files = parsedStylesheets.map(item => item.metrics);
  const occurrences = parsedStylesheets.flatMap(item => item.occurrences)
    .map((item, index) => ({ ...item, cascadeOrder: index + 1 }));
  const bySelector = groupBy(occurrences, item => item.selector);
  const crossContextSelectors = [];
  let duplicatedSelectorsAnyContext = 0;

  for (const [selector, items] of bySelector) {
    if (items.length > 1) duplicatedSelectorsAnyContext += 1;
    const contexts = [...new Set(items.map(item => item.context))].sort(compareText);
    if (contexts.length > 1) crossContextSelectors.push({ selector, contexts });
  }
  crossContextSelectors.sort((left, right) => compareText(left.selector, right.selector));

  const byContextAndSelector = groupBy(occurrences, item => `${item.context}\u0000${item.selector}`);
  const sameContextDuplicates = [];
  const sameContextCollisions = [];

  for (const items of byContextAndSelector.values()) {
    if (items.length < 2) continue;
    const { selector, context } = items[0];
    const propertyValues = new Map();
    for (const item of items) {
      for (const declaration of item.declarations) {
        if (!propertyValues.has(declaration.property)) propertyValues.set(declaration.property, []);
        propertyValues.get(declaration.property).push({
          path: item.path,
          sheetOrder: item.sheetOrder,
          ruleOrder: item.ruleOrder,
          cascadeOrder: item.cascadeOrder,
          value: declaration.value,
          important: declaration.important
        });
      }
    }

    const conflictingProperties = [];
    for (const [property, values] of propertyValues) {
      if (values.length < 2) continue;
      const signatures = new Set(values.map(value => `${value.important ? 'important' : 'normal'}\u0000${value.value}`));
      if (signatures.size > 1) conflictingProperties.push({ property, values });
    }
    conflictingProperties.sort((left, right) => compareText(left.property, right.property));

    const duplicate = {
      selector,
      context,
      occurrences: items.map(item => ({
        path: item.path,
        sheetOrder: item.sheetOrder,
        ruleOrder: item.ruleOrder,
        cascadeOrder: item.cascadeOrder
      }))
    };
    sameContextDuplicates.push(duplicate);
    if (conflictingProperties.length) sameContextCollisions.push({ ...duplicate, conflictingProperties });
  }

  const byContextThenSelector = (left, right) => compareText(left.context, right.context) || compareText(left.selector, right.selector);
  sameContextDuplicates.sort(byContextThenSelector);
  sameContextCollisions.sort(byContextThenSelector);

  return {
    summary: {
      stylesheetCount: files.length,
      styleRuleBlocks: files.reduce((total, file) => total + file.styleRuleBlocks, 0),
      selectorOccurrences: files.reduce((total, file) => total + file.selectorOccurrences, 0),
      declarations: files.reduce((total, file) => total + file.declarations, 0),
      importantDeclarations: files.reduce((total, file) => total + file.importantDeclarations, 0),
      duplicatedSelectorsAnyContext,
      crossContextSelectorCount: crossContextSelectors.length,
      sameContextDuplicateCount: sameContextDuplicates.length,
      sameContextCollisionCount: sameContextCollisions.length
    },
    files,
    crossContextSelectors,
    sameContextDuplicates,
    sameContextCollisions
  };
}

function memberGlobalName(node) {
  if (!node || node.type !== 'MemberExpression') return null;
  if (node.object?.type !== 'Identifier' || !GLOBAL_ROOT_NAMES.has(node.object.name)) return null;
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name;
  if (node.computed && node.property?.type === 'Literal' && typeof node.property.value === 'string') return node.property.value;
  return null;
}

export function analyzeJavascriptSource(source, filePath) {
  const tree = parse(source, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  const requiresGlobals = new Set();
  const writesGlobals = new Set();
  let pollingCalls = 0;
  let observers = 0;

  walk.simple(tree, {
    UnaryExpression(node) {
      if (node.operator !== 'typeof') return;
      const name = memberGlobalName(node.argument);
      if (name) requiresGlobals.add(name);
    },
    AssignmentExpression(node) {
      const name = memberGlobalName(node.left);
      if (name) writesGlobals.add(name);
    },
    UpdateExpression(node) {
      const name = memberGlobalName(node.argument);
      if (name) writesGlobals.add(name);
    },
    CallExpression(node) {
      const memberName = memberGlobalName(node.callee);
      if (memberName === 'setInterval') pollingCalls += 1;
    },
    NewExpression(node) {
      if (node.callee?.type === 'Identifier' && node.callee.name === 'MutationObserver') observers += 1;
    }
  });

  return {
    path: normalizePath(filePath),
    requiresGlobals: [...requiresGlobals].sort(compareText),
    writesGlobals: [...writesGlobals].sort(compareText),
    pollingCalls,
    mutationObservers: observers
  };
}

function summarizeJavascript(extensions) {
  const writers = new Map();
  for (const extension of extensions) {
    for (const globalName of extension.writesGlobals) {
      if (!writers.has(globalName)) writers.set(globalName, []);
      writers.get(globalName).push(extension.path);
    }
  }

  const sharedWriters = [...writers.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([global, paths]) => ({ global, writers: paths }))
    .sort((left, right) => compareText(left.global, right.global));

  return { extensions, sharedWriters };
}

async function readUtf8(rootDir, relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

export async function analyzeFrontendPrecedence(rootDir, options = {}) {
  const indexPath = normalizePath(options.indexPath || 'index.html');
  const configPath = normalizePath(options.configPath || 'config.js');
  const excelLoaderPath = normalizePath(options.excelLoaderPath || DEFAULT_EXCEL_LOADER);
  const [indexSource, configSource, excelLoaderSource] = await Promise.all([
    readUtf8(rootDir, indexPath),
    readUtf8(rootDir, configPath),
    readUtf8(rootDir, excelLoaderPath)
  ]);

  const staticAssets = extractStaticAssets(indexSource);
  const declared = extractConfigExtensions(configSource);
  const extensionMarkers = new Set(staticAssets.scripts.map(item => item.extensionMarker).filter(Boolean));
  const deduplicated = declared.scripts.filter(item => extensionMarkers.has(item.src)).map(item => item.src);
  const effectiveExtensions = declared.scripts.filter(item => !extensionMarkers.has(item.src)).map(item => item.src);
  const chainedScripts = extractChainedScripts(excelLoaderSource);
  const staticScripts = staticAssets.scripts.map(item => item.src);
  const styleLoadOrder = [...staticAssets.styles, ...declared.styles];

  const parsedStylesheets = [];
  for (const [sheetOrder, stylePath] of styleLoadOrder.entries()) {
    parsedStylesheets.push(parseCssStylesheet(await readUtf8(rootDir, stylePath), stylePath, sheetOrder));
  }

  const javascriptExtensions = [];
  for (const extensionPath of [...effectiveExtensions, ...chainedScripts]) {
    javascriptExtensions.push(analyzeJavascriptSource(await readUtf8(rootDir, extensionPath), extensionPath));
  }

  return {
    schemaVersion: 1,
    sourceFiles: { index: indexPath, config: configPath, excelLoader: excelLoaderPath },
    styles: {
      static: staticAssets.styles,
      declaredExtensions: declared.styles,
      loadOrder: styleLoadOrder
    },
    scripts: {
      staticOrder: staticScripts,
      declaredExtensions: declared.scripts,
      deduplicated,
      effectiveExtensions,
      chainedScripts,
      expectedExecutionOrder: [...staticScripts, ...effectiveExtensions, ...chainedScripts]
    },
    css: summarizeCss(parsedStylesheets),
    javascript: summarizeJavascript(javascriptExtensions)
  };
}

export function formatManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outputPath = path.join(rootDir, DEFAULT_OUTPUT);
  const expected = formatManifest(await analyzeFrontendPrecedence(rootDir));
  const checkOnly = process.argv.includes('--check');

  if (checkOnly) {
    const current = await readFile(outputPath, 'utf8').catch(() => '');
    if (current !== expected) {
      console.error(`Manifesto divergente: ${DEFAULT_OUTPUT}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Manifesto reproduzível: ${DEFAULT_OUTPUT}`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expected, 'utf8');
  console.log(`Manifesto gravado em ${DEFAULT_OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
