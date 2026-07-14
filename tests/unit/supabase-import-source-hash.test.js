'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

test('stageImportBatch encaminha o sourceHash canônico à RPC de staging', async () => {
    let captured = null;
    const repository = new SupabaseRepository({
        client: {
            from() { return {}; },
            async rpc(name, args) {
                captured = { name, args };
                return { data: { ok: true }, error: null };
            }
        }
    });

    await repository.stageImportBatch({
        importId: 'import-contract',
        entity: 'schools',
        batchIndex: 0,
        records: [{ id: 'school-1' }],
        sourceHash: 'sha256-contract'
    });

    assert.equal(captured.name, 'stage_data_import_batch');
    assert.equal(captured.args.p_source_hash, 'sha256-contract');
});
