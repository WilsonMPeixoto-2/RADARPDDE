#!/usr/bin/env node

import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  parseProductionSmokeArguments,
  verifyProductionSystemWithRetries
} from './lib/production-system-smoke.mjs';

async function main(argv = process.argv.slice(2)) {
  const options = parseProductionSmokeArguments(argv);
  const result = await verifyProductionSystemWithRetries({
    ...options,
    timeoutMs: 20_000
  });
  console.log(JSON.stringify({
    check: 'production-system-smoke',
    status: 'approved',
    ...result
  }, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    const diagnostic = {
      check: 'production-system-smoke',
      status: 'failed',
      code: String(error?.code || 'PRODUCTION_SMOKE_FAILED'),
      message: String(error?.message || 'Falha desconhecida no smoke de Production.'),
      details: error?.details || null
    };
    console.error(JSON.stringify(diagnostic, null, 2));
    process.exitCode = 1;
  });
}

export { main };
