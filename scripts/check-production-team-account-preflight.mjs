#!/usr/bin/env node

const functionUrl = process.env.RADAR_TEAM_ACCOUNT_FUNCTION_URL
  || 'https://scnryinorqeucbfkioxo.supabase.co/functions/v1/team-account-management';
const allowedOrigin = process.env.RADAR_PRODUCTION_ORIGIN
  || 'https://radarpdde-fix.vercel.app';
const deniedOrigin = 'https://origem-nao-autorizada.invalid';

async function preflight(origin) {
  const response = await fetch(functionUrl, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info'
    }
  });
  return {
    status: response.status,
    body: await response.text(),
    allowOrigin: response.headers.get('access-control-allow-origin'),
    allowMethods: response.headers.get('access-control-allow-methods'),
    allowHeaders: response.headers.get('access-control-allow-headers'),
    maxAge: response.headers.get('access-control-max-age'),
    vary: response.headers.get('vary')
  };
}

const allowed = await preflight(allowedOrigin);
if (allowed.status !== 200
    || allowed.allowOrigin !== allowedOrigin
    || !String(allowed.allowMethods || '').includes('POST')
    || !String(allowed.allowMethods || '').includes('OPTIONS')
    || !String(allowed.allowHeaders || '').toLowerCase().includes('authorization')
    || allowed.maxAge !== '86400'
    || !String(allowed.vary || '').toLowerCase().includes('origin')) {
  throw new Error(`Preflight autorizado de produção inválido: ${JSON.stringify(allowed)}`);
}

const denied = await preflight(deniedOrigin);
let deniedPayload = {};
try {
  deniedPayload = JSON.parse(denied.body || '{}');
} catch (_error) {
  deniedPayload = {};
}
if (denied.status !== 403
    || deniedPayload.code !== 'ORIGIN_DENIED'
    || denied.allowOrigin) {
  throw new Error(`Origem indevida não foi bloqueada em produção: ${JSON.stringify({
    ...denied,
    body: deniedPayload
  })}`);
}

console.log(JSON.stringify({
  functionUrl,
  allowedOrigin,
  allowedStatus: allowed.status,
  deniedStatus: denied.status,
  cors: 'approved'
}));
