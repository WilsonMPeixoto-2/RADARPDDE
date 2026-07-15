#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ImportCoordinator } = require('../src/data/import-coordinator.js');
const { LocalStorageRepository } = require('../src/data/local-storage-repository.js');

function parseArgs(argv) {
    const [command = '', ...rest] = argv;
    const options = {};
    for (let index = 0; index < rest.length; index += 1) {
        const token = rest[index];
        if (!token.startsWith('--')) continue;
        const name = token.slice(2);
        const next = rest[index + 1];
        if (!next || next.startsWith('--')) options[name] = true;
        else {
            options[name] = next;
            index += 1;
        }
    }
    return { command, options };
}

function readJson(filePath, label) {
    if (!filePath) throw new Error(`${label} não informado.`);
    const absolute = path.resolve(filePath);
    return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function writeJson(filePath, value) {
    const absolute = path.resolve(filePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function createFileStorage(filePath) {
    const absolute = path.resolve(filePath || '.radar-migration/target-state.json');
    let values = {};
    if (fs.existsSync(absolute)) values = JSON.parse(fs.readFileSync(absolute, 'utf8'));
    const persist = () => writeJson(absolute, values);
    return {
        getItem(key) { return Object.hasOwn(values, key) ? String(values[key]) : null; },
        setItem(key, value) { values[key] = String(value); persist(); },
        removeItem(key) { delete values[key]; persist(); }
    };
}

function createFileCheckpointStore(directory) {
    const root = path.resolve(directory || '.radar-migration/checkpoints');
    const fileFor = importId => path.join(root, `${encodeURIComponent(String(importId))}.json`);
    return {
        async load(importId) {
            const file = fileFor(importId);
            return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
        },
        async save(importId, value) {
            writeJson(fileFor(importId), value);
            return value;
        },
        async remove(importId) {
            const file = fileFor(importId);
            if (fs.existsSync(file)) fs.rmSync(file);
        }
    };
}

function safeOutput(value) {
    const output = JSON.stringify(value, null, 2);
    if (/service_role|sb_secret_|password|publishable[_-]?key|access[_-]?token/i.test(output)) {
        throw new Error('O relatório contém material com aparência de credencial.');
    }
    process.stdout.write(`${output}\n`);
}

function usage() {
    return {
        commands: {
            plan: '--snapshot <arquivo>',
            validate: '--snapshot <arquivo>',
            'dry-run': '--snapshot <arquivo>',
            'import:local': '--snapshot <arquivo> --state <arquivo> [--checkpoints <diretório>]',
            reconcile: '--snapshot <arquivo> --state <arquivo> [--checkpoints <diretório>]',
            rollback: '--import-id <id> --state <arquivo> [--checkpoints <diretório>]'
        }
    };
}

async function main() {
    const { command, options } = parseArgs(process.argv.slice(2));
    if (!command || command === 'help' || options.help) {
        safeOutput(usage());
        return;
    }

    const target = new LocalStorageRepository({
        storage: createFileStorage(options.state),
        keyPrefix: 'radar_pdde_repository'
    });
    const coordinator = new ImportCoordinator({
        targetRepository: target,
        checkpointStore: createFileCheckpointStore(options.checkpoints),
        batchSize: Number.parseInt(options['batch-size'] || '250', 10)
    });

    if (command === 'rollback') {
        safeOutput(await coordinator.rollback(options['import-id']));
        return;
    }

    const snapshot = readJson(options.snapshot, 'Snapshot');
    if (command === 'plan') safeOutput(await coordinator.plan(snapshot));
    else if (command === 'validate') safeOutput(await coordinator.validate(snapshot));
    else if (command === 'dry-run') safeOutput(await coordinator.dryRun(snapshot));
    else if (command === 'import:local') safeOutput(await coordinator.import(snapshot));
    else if (command === 'reconcile') safeOutput(await coordinator.reconcile(snapshot));
    else throw new Error(`Comando desconhecido: ${command}.`);
}

main().catch(error => {
    const safe = {
        ok: false,
        code: error?.code || 'MIGRATION_CLI_FAILED',
        message: error?.message || 'Falha na operação de migração.',
        operation: error?.operation || null,
        details: error?.details?.report || null
    };
    process.stderr.write(`${JSON.stringify(safe, null, 2)}\n`);
    process.exitCode = 1;
});
