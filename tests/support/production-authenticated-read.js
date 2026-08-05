'use strict';

const REQUIRED_PROFILES = Object.freeze([
  'controller',
  'federal_assistant',
  'inventory',
  'sme_management',
  'technical_admin'
]);

function text(value) {
  return value == null ? '' : String(value).trim();
}

function validateAccountsDocument(document) {
  const accounts = Array.isArray(document)
    ? document
    : (Array.isArray(document?.accounts) ? document.accounts : []);
  const errors = [];
  const normalized = [];
  const seenProfiles = new Set();
  const seenEmails = new Set();

  if (accounts.length !== REQUIRED_PROFILES.length) {
    errors.push(`São exigidas ${REQUIRED_PROFILES.length} contas técnicas.`);
  }

  for (const account of accounts) {
    const profileId = text(account?.profileId);
    const email = text(account?.email).toLowerCase();
    const password = text(account?.password);

    if (!REQUIRED_PROFILES.includes(profileId)) {
      errors.push(`Perfil técnico inválido: ${profileId || '(vazio)'}.`);
      continue;
    }
    if (seenProfiles.has(profileId)) {
      errors.push(`Perfil técnico duplicado: ${profileId}.`);
    }
    seenProfiles.add(profileId);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`E-mail técnico inválido para ${profileId}.`);
    }
    if (seenEmails.has(email)) {
      errors.push(`E-mail técnico duplicado para ${profileId}.`);
    }
    seenEmails.add(email);

    if (password.length < 24) {
      errors.push(`Senha técnica insuficiente para ${profileId}.`);
    }

    normalized.push(Object.freeze({ profileId, email, password }));
  }

  for (const requiredProfile of REQUIRED_PROFILES) {
    if (!seenProfiles.has(requiredProfile)) {
      errors.push(`Conta técnica ausente para ${requiredProfile}.`);
    }
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
    pathname = text(rawUrl);
  }

  if (pathname.includes('/auth/v1/token')) return false;
  if (pathname.includes('/rest/v1/rpc/')) return false;
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
  REQUIRED_PROFILES,
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
});
