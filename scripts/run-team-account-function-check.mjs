#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function environmentFromLocalStatus() {
  const output = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return Object.fromEntries(
    output
      .split(/\r?\n/u)
      .map(line => line.match(/^([A-Z0-9_]+)="?([^"\r\n]+)"?$/u))
      .filter(Boolean)
      .map(match => [match[1], match[2]])
  );
}

function serviceRoleJwt(jwtSecret) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    role: 'service_role',
    iss: 'supabase',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', jwtSecret)
    .update(unsigned)
    .digest('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
  return `${unsigned}.${signature}`;
}

const configuredUrl = String(process.env.RADAR_SUPABASE_URL || '').trim();
const hostname = configuredUrl ? new URL(configuredUrl).hostname : '';
const isLocalStack = hostname === '127.0.0.1' || hostname === 'localhost';

if (isLocalStack) {
  const status = environmentFromLocalStatus();
  if (!status.JWT_SECRET) {
    throw new Error('JWT_SECRET local ausente; o ensaio não pode assumir service_role com segurança.');
  }
  process.env.RADAR_SUPABASE_SERVICE_ROLE_KEY = serviceRoleJwt(status.JWT_SECRET);
}

await import('./check-team-account-function.mjs');
