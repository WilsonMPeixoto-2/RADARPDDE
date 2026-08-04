#!/usr/bin/env node

import process from 'node:process';
import { pathToFileURL } from 'node:url';

const INCIDENT_TITLE = '[Incidente automático] Falha no monitoramento de Production';
const INCIDENT_MARKER = '<!-- radar-production-monitor-incident -->';
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

function stableText(value) {
  return value == null ? '' : String(value).trim();
}

function requireValue(value, name) {
  const normalized = stableText(value);
  if (!normalized) throw new Error(`${name} é obrigatório.`);
  return normalized;
}

function normalizedTimestamp(value, name) {
  const candidate = requireValue(value, name);
  const date = new Date(candidate);
  if (!Number.isFinite(date.getTime())) throw new Error(`${name} deve ser um instante ISO válido.`);
  return date.toISOString();
}

function normalizedExitStatus(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 255) {
    throw new Error(`${name} deve ser um código de saída entre 0 e 255.`);
  }
  return parsed;
}

function normalizedRepository(value) {
  const repository = requireValue(value, 'repository');
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new Error('repository deve usar o formato owner/name.');
  }
  return repository;
}

function normalizedCommitSha(value) {
  const commitSha = requireValue(value, 'commitSha').toLowerCase();
  if (!SHA_PATTERN.test(commitSha)) throw new Error('commitSha deve ser um SHA completo de 40 caracteres.');
  return commitSha;
}

function normalizedRunUrl(value) {
  const candidate = requireValue(value, 'runUrl');
  const url = new URL(candidate);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
    throw new Error('runUrl deve apontar para uma execução HTTPS do GitHub.');
  }
  return url.toString();
}

function normalizedStatus(value) {
  const status = requireValue(value, 'status').toLowerCase();
  if (!['success', 'failure'].includes(status)) {
    throw new Error('status deve ser success ou failure.');
  }
  return status;
}

function findProductionMonitorIncidents(issues) {
  if (!Array.isArray(issues)) return [];
  return issues
    .filter(issue => issue
      && !issue.pull_request
      && stableText(issue.title) === INCIDENT_TITLE
      && stableText(issue.body).includes(INCIDENT_MARKER)
      && Number.isSafeInteger(Number(issue.number)))
    .sort((left, right) => {
      const leftTime = Date.parse(stableText(left.created_at)) || 0;
      const rightTime = Date.parse(stableText(right.created_at)) || 0;
      return leftTime - rightTime || Number(left.number) - Number(right.number);
    });
}

function buildProductionIncidentBody({
  firstDetectedAt,
  observedAt,
  commitSha,
  eventName,
  coreStatus,
  preflightStatus,
  runUrl
}) {
  const first = normalizedTimestamp(firstDetectedAt, 'firstDetectedAt');
  const last = normalizedTimestamp(observedAt, 'observedAt');
  const commit = normalizedCommitSha(commitSha);
  const event = requireValue(eventName, 'eventName').replace(/[^A-Za-z0-9_.-]/gu, '');
  const core = normalizedExitStatus(coreStatus, 'coreStatus');
  const preflight = normalizedExitStatus(preflightStatus, 'preflightStatus');
  const executionUrl = normalizedRunUrl(runUrl);

  return [
    INCIDENT_MARKER,
    '# Falha detectada no monitoramento de Production',
    '',
    'O monitor automático identificou que uma ou mais verificações do ambiente publicado não foram aprovadas.',
    '',
    `- Estado atual: \`falha\``,
    `- Primeira detecção: \`${first}\``,
    `- Última detecção: \`${last}\``,
    `- Commit verificado: \`${commit}\``,
    `- Evento: \`${event}\``,
    `- Smoke geral: \`${core}\``,
    `- Preflight: \`${preflight}\``,
    `- Execução: ${executionUrl}`,
    '',
    'Consulte a execução vinculada para o diagnóstico detalhado. Esta issue é atualizada automaticamente enquanto a falha persistir.'
  ].join('\n');
}

function recoveryComment({ observedAt, commitSha, runUrl }) {
  const recoveredAt = normalizedTimestamp(observedAt, 'observedAt');
  const commit = normalizedCommitSha(commitSha);
  const executionUrl = normalizedRunUrl(runUrl);
  return [
    '## Recuperação confirmada',
    '',
    `- Instante: \`${recoveredAt}\``,
    `- Commit verificado: \`${commit}\``,
    `- Execução: ${executionUrl}`,
    '',
    'O monitor geral e o preflight foram aprovados. O incidente foi encerrado automaticamente.'
  ].join('\n');
}

async function reconcileProductionIncident({
  status,
  repository,
  commitSha,
  eventName,
  coreStatus,
  preflightStatus,
  runUrl,
  observedAt,
  api
}) {
  const normalized = {
    status: normalizedStatus(status),
    repository: normalizedRepository(repository),
    commitSha: normalizedCommitSha(commitSha),
    eventName: requireValue(eventName, 'eventName'),
    coreStatus: normalizedExitStatus(coreStatus, 'coreStatus'),
    preflightStatus: normalizedExitStatus(preflightStatus, 'preflightStatus'),
    runUrl: normalizedRunUrl(runUrl),
    observedAt: normalizedTimestamp(observedAt, 'observedAt')
  };
  if (typeof api !== 'function') throw new Error('api deve ser uma função.');

  const issuesPath = `/repos/${normalized.repository}/issues`;
  const openIssues = await api('GET', `${issuesPath}?state=open&per_page=100`, null);
  const incidents = findProductionMonitorIncidents(openIssues);

  if (normalized.status === 'success') {
    if (incidents.length === 0) return { action: 'noop', issueNumbers: [] };
    const comment = recoveryComment(normalized);
    for (const incident of incidents) {
      await api('POST', `${issuesPath}/${incident.number}/comments`, { body: comment });
      await api('PATCH', `${issuesPath}/${incident.number}`, {
        state: 'closed',
        state_reason: 'completed'
      });
    }
    return { action: 'closed', issueNumbers: incidents.map(issue => Number(issue.number)) };
  }

  const firstDetectedAt = incidents[0]?.created_at || normalized.observedAt;
  const body = buildProductionIncidentBody({
    ...normalized,
    firstDetectedAt
  });

  if (incidents.length === 0) {
    const created = await api('POST', issuesPath, {
      title: INCIDENT_TITLE,
      body
    });
    return { action: 'created', issueNumbers: [Number(created.number)] };
  }

  const primary = incidents[0];
  await api('PATCH', `${issuesPath}/${primary.number}`, { body });
  return { action: 'updated', issueNumbers: [Number(primary.number)] };
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) throw new Error(`Argumento inválido: ${argument}`);
    const value = argv[index + 1];
    if (value == null || value.startsWith('--')) throw new Error(`${argument} exige um valor.`);
    values[argument.slice(2)] = value;
    index += 1;
  }
  return {
    status: values.status,
    repository: values.repository,
    commitSha: values.commit,
    eventName: values.event,
    coreStatus: values['core-status'],
    preflightStatus: values['preflight-status'],
    runUrl: values['run-url'],
    observedAt: values['observed-at']
  };
}

function createGitHubApi({ token, apiUrl = 'https://api.github.com', fetchImpl = fetch }) {
  const credential = requireValue(token, 'GITHUB_TOKEN');
  const baseUrl = new URL(apiUrl);
  if (baseUrl.protocol !== 'https:') throw new Error('GITHUB_API_URL deve usar HTTPS.');

  return async (method, pathName, body) => {
    const url = new URL(pathName, baseUrl);
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${credential}`,
          'content-type': 'application/json',
          'user-agent': 'radar-pdde-production-monitor',
          'x-github-api-version': '2022-11-28'
        },
        body: body == null ? undefined : JSON.stringify(body)
      });
    } catch (error) {
      const failure = new Error(`Falha de rede ao acessar ${url.pathname}.`);
      failure.code = 'GITHUB_INCIDENT_NETWORK_FAILED';
      failure.cause = error;
      throw failure;
    }

    if (!response.ok) {
      const failure = new Error(`GitHub respondeu HTTP ${response.status} em ${url.pathname}.`);
      failure.code = 'GITHUB_INCIDENT_API_FAILED';
      failure.status = response.status;
      throw failure;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      const failure = new Error(`GitHub devolveu JSON inválido em ${url.pathname}.`);
      failure.code = 'GITHUB_INCIDENT_RESPONSE_INVALID';
      failure.cause = error;
      throw failure;
    }
  };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const api = createGitHubApi({
    token: process.env.GITHUB_TOKEN,
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
  });
  const result = await reconcileProductionIncident({ ...options, api });
  console.log(JSON.stringify(result));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({
      status: 'failed',
      code: stableText(error?.code) || 'PRODUCTION_INCIDENT_MANAGER_FAILED',
      message: stableText(error?.message) || 'Falha desconhecida na gestão do incidente.'
    }));
    process.exitCode = 1;
  });
}

export {
  INCIDENT_MARKER,
  INCIDENT_TITLE,
  buildProductionIncidentBody,
  createGitHubApi,
  findProductionMonitorIncidents,
  main,
  reconcileProductionIncident
};
