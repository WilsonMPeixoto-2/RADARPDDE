// Audit-only: execute the candidate's original state-sync tests against a supplied main checkout.
// Expected exit at main 3135d4c6: 1 (two failures). At candidate 32055e2b: 0.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const candidate = path.resolve(process.argv[2]);
const target = path.resolve(process.argv[3]);
const filename = path.join(candidate, 'tests/unit/data-service-state-sync-status.test.js');
const source = fs.readFileSync(filename, 'utf8').replace(/require\('\.\.\/\.\.\/src\/([^']+)'\)/g,
    (_, file) => `require(${JSON.stringify(path.join(target, 'src', file))})`);
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(source, filename);
