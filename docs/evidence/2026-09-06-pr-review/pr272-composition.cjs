// Audit-only: node pr272-composition.cjs <checkout-of-PR272>
// No remote access. Uses the production modules with controlled I/O boundaries.
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const repo = path.resolve(process.argv[2]);
const feedback = require(path.join(repo, 'src/integration/operational-write-feedback.js'));
const performance = require(path.join(repo, 'src/integration/operational-write-performance.js'));
const { DataService } = require(path.join(repo, 'src/application/data-service.js'));
const { createSnapshotEnvelope } = require(path.join(repo, 'src/data/repository-contract.js'));

(async () => {
    async function composition(order) {
        let executions = 0;
        const notices = [];
        class FakeDataService {
            async execute() {
                executions++;
                return { ok: true, stateSync: { status: 'failed', remoteCommitConfirmed: true,
                    localStateApplied: false, refreshRequired: true }, refreshPending: true,
                    stateApplyErrorCode: 'LOCAL_STATE_APPLY_FAILED' };
            }
        }
        const service = new FakeDataService();
        const root = { RadarDataService: { DataService: FakeDataService } };
        for (const name of order) {
            if (name === 'performance') performance.patchDataService(service, root);
            else feedback.installDataServiceFeedback(root, item => notices.push(item));
        }
        // Duplicate installation must not add notifications or remote invocations.
        feedback.installDataServiceFeedback(root, item => notices.push(item));
        await service.execute({ name: 'invoice:save' });
        assert.equal(executions, 1);
        return { order, executions, notices };
    }
    const actual = await composition(['performance', 'feedback']);
    const inverse = await composition(['feedback', 'performance']);
    assert.equal(actual.notices.length, 0, 'Reproduces feedback bypass in bootstrap order');
    assert.equal(inverse.notices.length, 1);

    const notice = { hidden: true, dataset: {}, textContent: '' };
    let timer;
    const root = { document: { getElementById: () => notice },
        setTimeout(fn) { timer = fn; return 1; }, clearTimeout() {} };
    feedback.showSaveNotice(root, { kind: 'success', message: 'Salvo', persistent: false });
    const source = fs.readFileSync(path.join(repo, 'app.js'), 'utf8');
    const showPendencyNotice = source.slice(source.indexOf('function showPendencyNotice('),
        source.indexOf('function createPendencyClientId('));
    const context = vm.createContext({ document: root.document });
    vm.runInContext(showPendencyNotice, context);
    context.showPendencyNotice('Informe as observações da pendência.', 'error');
    const beforeTimer = structuredClone(notice);
    timer();
    assert.equal(notice.hidden, true, 'Timer from save hides newer pendency validation error');

    let applies = 0;
    let writes = 0;
    let reads = 0;
    const snapshot = createSnapshotEnvelope({ schools: [{ id: 's1', name: 'old', row_version: 1 }] });
    const statePort = { capture: async () => ({}), restore: async () => {},
        exportCanonical: async () => structuredClone(snapshot),
        applyCanonical: async () => { if (++applies === 2) throw new Error('refresh apply fails without code'); } };
    const repository = { capabilities: () => ({ remote: true, mode: 'supabase' }),
        load: async () => { reads++; return [{ id: 's1', name: 'new', row_version: 2 }]; },
        save: async () => [], remove: async () => ({}), exportSnapshot: async () => snapshot,
        restoreSnapshot: async () => {}, healthCheck: async () => ({ ok: true }) };
    const result = await new DataService({ repository, statePort }).execute({
        name: 'probe:non-authoritative', changedEntities: ['schools'], mutate: () => ({}),
        persist: async () => { writes++; return { schools: [{ id: 's1', name: 'new', row_version: 2 }] }; }
    });
    assert.equal(writes, 1);
    assert.equal(applies, 2);
    assert.equal(result.stateApplyErrorCode, null);
    assert.equal(result.stateSync.localStateApplied, true);
    assert.equal(result.refreshPending, true);
    console.log(JSON.stringify({ actualOrder: actual, inverseOrder: inverse,
        sharedNoticeTimer: { before: beforeTimer, after: notice },
        failureInsideRefresh: { writes, reads, applies, result } }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
