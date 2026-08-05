#!/usr/bin/env node

import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  parseProductionSmokeArguments,
  verifyProductionSystemWithRetries
} from './lib/production-system-smoke.mjs';

const PLACEHOLDER_COMMIT = '0000000000000000000000000000000000000001';

function parseCheckProductionSystemArguments(argv) {
  const argumentsList = Array.from(argv || [], value => String(value));
  const allowAnyCommitCount = argumentsList.filter(argument => argument === '--allow-any-commit').length;

  if (allowAnyCommitCount === 0) {
    return parseProductionSmokeArguments(argumentsList);
  }
  if (allowAnyCommitCount > 1 || argumentsList.includes('--expected-commit')) {
    throw new Error('--allow-any-commit não pode ser repetido nem combinado com --expected-commit.');
  }

  const strictArguments = argumentsList.filter(argument => argument !== '--allow-any-commit');
  const parsed = parseProductionSmokeArguments([
    ...strictArguments,
    '--expected-commit', PLACEHOLDER_COMMIT
  ]);

  return Object.freeze({
    ...parsed,
    expectedCommitSha: ''
  });
}

async function main(argv = process.argv.slice(2)) {
  const options = parseCheckProductionSystemArguments(argv);
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

export { main, parseCheckProductionSystemArguments };
