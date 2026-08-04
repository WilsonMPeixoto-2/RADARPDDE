const PRODUCTION_EXPECTATIONS = Object.freeze({
  vercelEnvironment: 'production',
  runtimeEnvironment: 'production',
  dataMode: 'supabase-production',
  supabaseRepositoryEnabled: true,
  productionActivationApproved: true
});

const ERROR_PAGE_PATTERN = /Application error|Internal Server Error|Unhandled Runtime Error|404:\s*NOT_FOUND|This page could not be found/iu;
const HTML_SAMPLE_PATTERN = /^\s*(?:<!doctype\s+html|<html\b)/iu;
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const PUBLIC_KEY_PATTERN = /^sb_publishable_[A-Za-z0-9._-]+$/u;
const ASSET_TAG_PATTERN = /<[^>]+>/gu;

function createProductionSmokeError(code, message, details = null, cause = null) {
  const error = new Error(message);
  error.code = code;
  if (details) error.details = details;
  if (cause) error.cause = cause;
  return error;
}

function attributeValue(tag, attributeName) {
  const pattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    'iu'
  );
  const match = String(tag || '').match(pattern);
  return match ? String(match[1] ?? match[2] ?? match[3] ?? '') : '';
}

function normalizeLocalAssetPath(value) {
  const candidate = String(value || '').trim();
  if (!candidate
      || candidate.startsWith('#')
      || candidate.startsWith('//')
      || /^(?:data|blob|javascript|mailto|tel):/iu.test(candidate)
      || /^https?:/iu.test(candidate)) {
    return '';
  }

  try {
    const url = new URL(candidate, 'https://radar.local/');
    if (url.origin !== 'https://radar.local') return '';
    return url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
  } catch (_error) {
    return '';
  }
}

function extractLocalAssetPaths(html) {
  const paths = [];
  const seen = new Set();
  for (const match of String(html || '').matchAll(ASSET_TAG_PATTERN)) {
    const tag = match[0];
    const isLink = /^<link\b/iu.test(tag);
    const rawValue = isLink ? attributeValue(tag, 'href') : attributeValue(tag, 'src');
    const assetPath = normalizeLocalAssetPath(rawValue);
    if (!assetPath || seen.has(assetPath)) continue;
    seen.add(assetPath);
    paths.push(assetPath);
  }
  return paths;
}

function validateProductionManifest(value, expectedCommitSha = '') {
  const manifest = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
  const commitSha = String(manifest?.commitSha || '').trim().toLowerCase();

  const invalid = !manifest
    || manifest.schemaVersion !== 1
    || !SHA_PATTERN.test(commitSha)
    || Object.entries(PRODUCTION_EXPECTATIONS).some(([key, expected]) => manifest[key] !== expected);

  if (invalid) {
    throw createProductionSmokeError(
      'PRODUCTION_MANIFEST_INVALID',
      'O manifesto publicado não representa o RADAR PDDE em Supabase Production.',
      {
        schemaVersion: manifest?.schemaVersion ?? null,
        commitSha: commitSha || null,
        vercelEnvironment: manifest?.vercelEnvironment ?? null,
        runtimeEnvironment: manifest?.runtimeEnvironment ?? null,
        dataMode: manifest?.dataMode ?? null,
        supabaseRepositoryEnabled: manifest?.supabaseRepositoryEnabled ?? null,
        productionActivationApproved: manifest?.productionActivationApproved ?? null
      }
    );
  }

  const expected = String(expectedCommitSha || '').trim().toLowerCase();
  if (expected && (!SHA_PATTERN.test(expected) || commitSha !== expected)) {
    throw createProductionSmokeError(
      'PRODUCTION_COMMIT_PENDING',
      `O alias oficial ainda expõe o commit ${commitSha}; aguardando ${expected}.`,
      { deployedCommitSha: commitSha, expectedCommitSha: expected }
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    commitSha,
    ...PRODUCTION_EXPECTATIONS
  });
}

function validateProductionShell(html) {
  const content = String(html || '');
  const requiredMarkers = [
    /<title>[^<]*RADAR PDDE[^<]*<\/title>/iu,
    /id=["']radar-auth-form["']/iu,
    /id=["']radar-auth-email["']/iu,
    /id=["']radar-auth-password["']/iu
  ];
  if (!content.trim()
      || ERROR_PAGE_PATTERN.test(content)
      || requiredMarkers.some(pattern => !pattern.test(content))) {
    throw createProductionSmokeError(
      'PRODUCTION_SHELL_INVALID',
      'O shell público de Production não contém o gate de login íntegro.'
    );
  }
}

function validateAssetResponse(assetPath, response) {
  const status = Number(response?.status || 0);
  const contentType = String(response?.contentType || '').toLowerCase();
  const bytes = Number(response?.bytes || 0);
  const textSample = String(response?.textSample || '');

  if (status < 200 || status >= 300) {
    throw createProductionSmokeError(
      'PRODUCTION_ASSET_HTTP_FAILED',
      `${assetPath}: HTTP ${status || '(ausente)'}.`,
      { assetPath, status }
    );
  }
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    throw createProductionSmokeError(
      'PRODUCTION_ASSET_EMPTY',
      `${assetPath}: recurso publicado vazio.`,
      { assetPath, bytes }
    );
  }
  if (contentType.includes('text/html') || HTML_SAMPLE_PATTERN.test(textSample)) {
    throw createProductionSmokeError(
      'PRODUCTION_ASSET_HTML_FALLBACK',
      `${assetPath}: o servidor devolveu HTML no lugar do asset.`,
      { assetPath, contentType }
    );
  }
}

function validateAnonymousRlsResponse({ status, value }) {
  const responseStatus = Number(status || 0);
  if (responseStatus === 401) return 'blocked-401';
  if (responseStatus === 403) return 'blocked-403';
  if (responseStatus === 200 && Array.isArray(value) && value.length === 0) {
    return 'empty-200';
  }

  throw createProductionSmokeError(
    'PRODUCTION_ANON_RLS_FAILED',
    'A consulta anônima de escolas não comprovou o bloqueio pela RLS.',
    {
      status: responseStatus,
      returnedRows: Array.isArray(value) ? value.length : null
    }
  );
}

function positiveInteger(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }
  return parsed;
}

function normalizedBaseUrl(value) {
  const url = new URL(String(value || ''));
  if (!['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password) {
    throw new Error('--base-url deve ser uma URL HTTP(S) sem credenciais.');
  }
  return new URL('/', url).toString();
}

function parseProductionSmokeArguments(argv) {
  const options = {
    baseUrl: '',
    expectedCommitSha: '',
    attempts: 1,
    intervalMs: 10_000
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (argument === '--base-url') {
      if (!next) throw new Error('--base-url exige uma URL.');
      options.baseUrl = normalizedBaseUrl(next);
      index += 1;
    } else if (argument === '--expected-commit') {
      if (!next) throw new Error('--expected-commit exige um SHA completo.');
      options.expectedCommitSha = String(next).trim().toLowerCase();
      index += 1;
    } else if (argument === '--attempts') {
      if (!next) throw new Error('--attempts exige um valor.');
      options.attempts = positiveInteger(next, '--attempts');
      index += 1;
    } else if (argument === '--interval-ms') {
      if (!next) throw new Error('--interval-ms exige um valor.');
      options.intervalMs = positiveInteger(next, '--interval-ms');
      index += 1;
    } else {
      throw new Error(`Argumento desconhecido: ${argument}`);
    }
  }

  if (!options.baseUrl || !SHA_PATTERN.test(options.expectedCommitSha)) {
    throw new Error('Informe --base-url e --expected-commit com SHA completo de 40 caracteres.');
  }
  return options;
}

function isRetryableProductionSmokeError(error) {
  return error?.code === 'PRODUCTION_COMMIT_PENDING';
}

function parseRuntimeConfigScript(script) {
  const source = String(script || '').trim();
  const match = source.match(
    /window\.RADAR_PDDE_RUNTIME_INPUT\s*=\s*Object\.freeze\(\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/u
  );
  let runtime = null;
  try {
    runtime = match ? JSON.parse(match[1]) : null;
  } catch (error) {
    throw createProductionSmokeError(
      'PRODUCTION_RUNTIME_INVALID',
      'A configuração pública de Production não contém JSON válido.',
      null,
      error
    );
  }

  const supabaseUrlValue = String(runtime?.supabase?.url || '').trim();
  const publishableKey = String(runtime?.supabase?.publishableKey || '').trim();
  let supabaseUrl = null;
  try {
    supabaseUrl = new URL('/', supabaseUrlValue);
  } catch (_error) {
    supabaseUrl = null;
  }

  const valid = runtime?.environment === 'production'
    && runtime?.dataMode === 'supabase-production'
    && runtime?.productionActivationApproved === true
    && runtime?.features?.supabaseRepositoryEnabled === true
    && supabaseUrl?.protocol === 'https:'
    && supabaseUrl.hostname.endsWith('.supabase.co')
    && PUBLIC_KEY_PATTERN.test(publishableKey);

  if (!valid) {
    throw createProductionSmokeError(
      'PRODUCTION_RUNTIME_INVALID',
      'A configuração pública não representa o Supabase Production aprovado.'
    );
  }

  return Object.freeze({
    supabaseUrl: supabaseUrl.toString(),
    publishableKey
  });
}

function cacheBustedUrl(baseUrl, path, now) {
  const url = new URL(path, baseUrl);
  url.searchParams.set('smoke', String(now()));
  return url.toString();
}

async function fetchBuffer(url, {
  fetchImpl,
  timeoutMs,
  headers = {}
}) {
  let response;
  try {
    response = await fetchImpl(url, {
      redirect: 'follow',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        ...headers
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    throw createProductionSmokeError(
      'PRODUCTION_NETWORK_FAILED',
      `${new URL(url).pathname}: falha de rede durante a verificação.`,
      { path: new URL(url).pathname },
      error
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return Object.freeze({
    status: response.status,
    contentType: String(response.headers.get('content-type') || ''),
    bytes: buffer.length,
    buffer,
    text: buffer.toString('utf8'),
    textSample: buffer.subarray(0, 512).toString('utf8')
  });
}

async function fetchJson(url, options, code) {
  const resource = await fetchBuffer(url, options);
  if (resource.status < 200 || resource.status >= 300) {
    throw createProductionSmokeError(
      'PRODUCTION_HTTP_FAILED',
      `${new URL(url).pathname}: HTTP ${resource.status}.`,
      { path: new URL(url).pathname, status: resource.status }
    );
  }
  try {
    return JSON.parse(resource.text);
  } catch (error) {
    throw createProductionSmokeError(
      code,
      `${new URL(url).pathname}: resposta JSON inválida.`,
      { path: new URL(url).pathname },
      error
    );
  }
}

async function runProductionSystemSmoke({
  baseUrl,
  expectedCommitSha,
  fetchImpl = fetch,
  timeoutMs = 20_000,
  now = Date.now
}) {
  const normalizedBase = normalizedBaseUrl(baseUrl);
  const startedAt = now();
  const requestOptions = { fetchImpl, timeoutMs };

  const manifestValue = await fetchJson(
    cacheBustedUrl(normalizedBase, '/radar-build-manifest.json', now),
    requestOptions,
    'PRODUCTION_MANIFEST_INVALID'
  );
  const manifest = validateProductionManifest(manifestValue, expectedCommitSha);

  const shellResource = await fetchBuffer(
    cacheBustedUrl(normalizedBase, '/', now),
    requestOptions
  );
  if (shellResource.status < 200 || shellResource.status >= 300) {
    throw createProductionSmokeError(
      'PRODUCTION_SHELL_HTTP_FAILED',
      `/: HTTP ${shellResource.status}.`,
      { status: shellResource.status }
    );
  }
  validateProductionShell(shellResource.text);

  const assetPaths = extractLocalAssetPaths(shellResource.text);
  if (!assetPaths.includes('/config.runtime.js')) {
    throw createProductionSmokeError(
      'PRODUCTION_RUNTIME_MISSING',
      'O shell publicado não referencia config.runtime.js.'
    );
  }

  let runtimeScript = '';
  for (const assetPath of assetPaths) {
    const resource = await fetchBuffer(
      cacheBustedUrl(normalizedBase, assetPath, now),
      requestOptions
    );
    validateAssetResponse(assetPath, resource);
    if (assetPath === '/config.runtime.js') runtimeScript = resource.text;
  }

  const runtime = parseRuntimeConfigScript(runtimeScript);
  const schoolsUrl = new URL('/rest/v1/schools', runtime.supabaseUrl);
  schoolsUrl.searchParams.set('select', 'id');
  schoolsUrl.searchParams.set('limit', '1');
  const anonymousResource = await fetchBuffer(
    schoolsUrl.toString(),
    {
      ...requestOptions,
      headers: {
        apikey: runtime.publishableKey,
        accept: 'application/json'
      }
    }
  );

  let anonymousValue = null;
  if (anonymousResource.status === 200) {
    try {
      anonymousValue = JSON.parse(anonymousResource.text);
    } catch (error) {
      throw createProductionSmokeError(
        'PRODUCTION_ANON_RLS_FAILED',
        'A resposta anônima de escolas não contém JSON válido.',
        { status: anonymousResource.status },
        error
      );
    }
  }
  const anonymousRlsEvidence = validateAnonymousRlsResponse({
    status: anonymousResource.status,
    value: anonymousValue
  });

  return Object.freeze({
    baseUrl: normalizedBase,
    commitSha: manifest.commitSha,
    assetCount: assetPaths.length,
    anonymousRls: 'approved',
    anonymousRlsEvidence,
    durationMs: Math.max(0, now() - startedAt)
  });
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function verifyProductionSystemWithRetries(options) {
  let lastError = null;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await runProductionSystemSmoke(options);
    } catch (error) {
      lastError = error;
      if (!isRetryableProductionSmokeError(error) || attempt >= options.attempts) break;
      console.log(`Tentativa ${attempt}/${options.attempts}: ${error.message}`);
      await delay(options.intervalMs);
    }
  }
  throw lastError;
}

export {
  createProductionSmokeError,
  extractLocalAssetPaths,
  isRetryableProductionSmokeError,
  parseProductionSmokeArguments,
  parseRuntimeConfigScript,
  runProductionSystemSmoke,
  validateAnonymousRlsResponse,
  validateAssetResponse,
  validateProductionManifest,
  validateProductionShell,
  verifyProductionSystemWithRetries
};
