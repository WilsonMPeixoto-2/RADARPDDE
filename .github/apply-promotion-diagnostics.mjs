import fs from 'node:fs';

const coordinatorPath = 'src/data/import-coordinator.js';
const testPath = 'tests/unit/import-coordinator.test.js';

const source = fs.readFileSync(coordinatorPath, 'utf8');
const oldBlock = [
    '            } catch (error) {',
    '                await this.rollback(snapshot.importId, { preserveFailure: true });',
    '                throw error;',
    '            }',
    ''
].join('\n');
const newBlock = [
    '            } catch (error) {',
    '                let rollbackError = null;',
    '                try {',
    '                    await this.rollback(snapshot.importId, { preserveFailure: true });',
    '                } catch (candidate) {',
    '                    rollbackError = candidate;',
    '                }',
    '                if (rollbackError) {',
    '                    throw new RepositoryError(',
    "                        error?.code || 'TRANSACTION_FAILED',",
    "                        error?.message || 'A promoção da importação falhou.',",
    '                        {',
    '                            cause: error,',
    "                            operation: error?.operation || 'migration:promote',",
    '                            entity: error?.entity || null,',
    '                            details: cloneValue({',
    '                                ...(error?.details || {}),',
    "                                rollbackCode: rollbackError?.code || 'ROLLBACK_FAILED',",
    '                                rollbackMessage: rollbackError?.message || null',
    '                            })',
    '                        }',
    '                    );',
    '                }',
    '                throw error;',
    '            }',
    ''
].join('\n');

if (!source.includes(oldBlock)) {
    throw new Error('Bloco de promoção esperado não localizado.');
}
fs.writeFileSync(coordinatorPath, source.replace(oldBlock, newBlock));

let tests = fs.readFileSync(testPath, 'utf8');
if (!tests.includes('falha de promoção preserva a causa original')) {
    tests += `\n\ntest('falha de promoção preserva a causa original quando o rollback remoto não está disponível', async () => {\n    const target = new LocalStorageRepository({ storage: storage(), keyPrefix: 'target' });\n    target.promoteImportSnapshot = async () => {\n        const error = new Error('PROMOTION_FAILED: constraint violation');\n        error.code = 'PROMOTION_FAILED';\n        throw error;\n    };\n    target.rollbackImport = async () => {\n        const error = new Error('IMPORT_ROLLBACK_UNAVAILABLE: promotion-test');\n        error.code = 'IMPORT_ROLLBACK_UNAVAILABLE';\n        throw error;\n    };\n    const coordinator = new ImportCoordinator({\n        targetRepository: target,\n        checkpointStore: createMemoryCheckpointStore()\n    });\n\n    await assert.rejects(\n        coordinator.import(sourceSnapshot('promotion-test')),\n        error => error.code === 'PROMOTION_FAILED'\n            && error.message.includes('constraint violation')\n            && error.details?.rollbackCode === 'IMPORT_ROLLBACK_UNAVAILABLE'\n    );\n});\n`;
    fs.writeFileSync(testPath, tests);
}
