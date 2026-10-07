'use strict';

const SUPPORTED_PROFILES = Object.freeze([
  'controller',
  'federal_assistant',
  'inventory',
  'sme_management',
  'technical_admin'
]);
const WRITE_PROFILES = Object.freeze([
  'controller',
  'federal_assistant'
]);
const ALLOWED_READ_RPC_PATHS = Object.freeze(new Set([
  '/rest/v1/rpc/current_app_role'
]));

function text(value) {
  return value == null ? '' : String(value).trim();
}

function validateAccountsDocument(document, options = {}) {
  const accounts = Array.isArray(document)
    ? document
    : (Array.isArray(document?.accounts) ? document.accounts : []);
  const errors = [];
  const normalized = [];
  const seenProfiles = new Set();
  const seenEmails = new Set();
  const writeProfiles = [];
  const requireWrite = options.requireWrite === true;

  if (accounts.length < 1 || accounts.length > SUPPORTED_PROFILES.length) {
    errors.push(`São aceitas de 1 a ${SUPPORTED_PROFILES.length} contas reais, uma por perfil.`);
  }

  for (const account of accounts) {
    const profileId = text(account?.profileId);
    const email = text(account?.email).toLowerCase();
    const password = text(account?.password);
    const allowWrite = account?.allowWrite === true;

    if (!SUPPORTED_PROFILES.includes(profileId)) {
      errors.push(`Perfil inválido: ${profileId || '(vazio)'}.`);
      continue;
    }
    if (seenProfiles.has(profileId)) {
      errors.push(`Perfil duplicado: ${profileId}.`);
    }
    seenProfiles.add(profileId);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`E-mail inválido para ${profileId}.`);
    }
    if (seenEmails.has(email)) {
      errors.push(`E-mail duplicado para ${profileId}.`);
    }
    seenEmails.add(email);

    if (!password) {
      errors.push(`Senha ausente para ${profileId}.`);
    }

    if (allowWrite) {
      if (!WRITE_PROFILES.includes(profileId)) {
        errors.push(`O perfil ${profileId} não pode ser escolhido para o ciclo reversível de escrita.`);
      } else {
        writeProfiles.push(profileId);
      }
    }

    normalized.push(Object.freeze({ profileId, email, password, allowWrite }));
  }

  if (writeProfiles.length > 1) {
    errors.push('Apenas uma conta deve executar o ciclo reversível de escrita em cada execução.');
  }
  if (requireWrite && writeProfiles.length !== 1) {
    errors.push('É exigida exatamente uma conta Controlador ou Assistente com allowWrite=true.');
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    accounts: Object.freeze(normalized)
  });
}

function isSuspiciousMutationRequest(method, rawUrl) {
  const normalizedMethod = text(method).toUpperCase();
  if (['PATCH', 'PUT', 'DELETE'].includes(normalizedMethod)) return true;
  if (normalizedMethod !== 'POST') return false;

  let pathname = '';
  try {
    pathname = new URL(rawUrl).pathname;
  } catch (_error) {
    pathname = text(rawUrl).split('?')[0];
  }

  if (pathname.includes('/auth/v1/token')) return false;
  if (pathname.startsWith('/rest/v1/rpc/')) {
    return !ALLOWED_READ_RPC_PATHS.has(pathname);
  }
  if (pathname.includes('/rest/v1/')) return true;
  if (pathname.includes('/functions/v1/')) return true;
  return false;
}

function sanitizeObservedError(value) {
  return text(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email oculto]')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [token oculto]')
    .slice(0, 500);
}

module.exports = Object.freeze({
  SUPPORTED_PROFILES,
  WRITE_PROFILES,
  ALLOWED_READ_RPC_PATHS,
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
});
