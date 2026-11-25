import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { moneyToCents, reconcileBundle, reviewProposal } from './reconcile.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/synthetic-case.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(fixture);
const onlyFirst = () => ({ ...fresh(), invoices: [structuredClone(fixture.invoices[0])], payments: [structuredClone(fixture.payments[0])] });

test('money is exact and rejects ambiguous locale, nonfinite and unsafe amounts', () => {
  assert.equal(moneyToCents('1250.01'), 125001);
  assert.equal(moneyToCents('0.10'), 10);
  for (const value of ['1.250,00', '1250,00', '1e3', '-1.00', 'NaN', '10000000000000000000.00', 1250]) assert.equal(moneyToCents(value), null);
});

test('complete fixture separates correspondence, amount difference, ambiguity, absence and uncertain extraction', async () => {
  const result = await reconcileBundle(fresh());
  assert.deepEqual(result.proposals.map(item => item.outcome), ['compatible', 'amount-difference', 'ambiguous', 'no-correspondence', 'review-extraction']);
  assert.ok(result.proposals.every(item => item.requiresHumanReview && item.administrativeConclusion === null));
  assert.equal(result.proposals[1].invoiceAmountCents - result.proposals[1].paymentAmountCents, 2000);
});

test('equal amount alone never matches a different reference or creditor', async () => {
  const bundle = onlyFirst();
  bundle.payments[0].fields.reference = 'ANOTHER-REFERENCE';
  assert.equal((await reconcileBundle(bundle)).proposals[0].outcome, 'no-correspondence');
  bundle.payments[0].fields.reference = bundle.invoices[0].fields.number;
  bundle.payments[0].fields.partyKey = 'ANOTHER-PARTY';
  assert.equal((await reconcileBundle(bundle)).proposals[0].outcome, 'no-correspondence');
});

test('school, competence and program isolate the correspondence context', async () => {
  for (const field of ['schoolId', 'competenceId', 'programId']) {
    const bundle = onlyFirst();
    bundle.payments[0].context[field] = 'OTHER';
    assert.equal((await reconcileBundle(bundle)).proposals[0].outcome, 'no-correspondence');
  }
});

test('unconfirmed context, low confidence, missing provenance and AI inference require review', async () => {
  const changes = [
    bundle => { bundle.invoices[0].context.confirmed = false; },
    bundle => { bundle.invoices[0].confidence = 0.4; },
    bundle => { bundle.invoices[0].source.page = 0; },
    bundle => { bundle.invoices[0].origin = 'ai_inference'; }
  ];
  for (const change of changes) {
    const bundle = onlyFirst(); change(bundle);
    assert.equal((await reconcileBundle(bundle)).proposals[0].outcome, 'review-extraction');
  }
});

test('two invoices cannot independently claim the same payment, regardless of order', async () => {
  const bundle = onlyFirst();
  bundle.invoices.push({ ...structuredClone(bundle.invoices[0]), id: 'another-invoice' });
  for (const items of [bundle.invoices, [...bundle.invoices].reverse()]) {
    const result = await reconcileBundle({ ...bundle, invoices: items });
    assert.ok(result.proposals.every(item => item.outcome === 'ambiguous'));
  }
});

test('different currency or a credit does not become a confirmed payment', async () => {
  const currency = onlyFirst(); currency.payments[0].fields.currency = 'USD';
  assert.equal((await reconcileBundle(currency)).proposals[0].outcome, 'review-extraction');
  const credit = onlyFirst(); credit.payments[0].fields.direction = 'credit';
  assert.equal((await reconcileBundle(credit)).proposals[0].outcome, 'review-extraction');
});

test('modified document bytes are detected even when its declared hash and version are unchanged', async () => {
  const bundle = onlyFirst();
  bundle.documents[0].text += '\nChanged document';
  const proposal = (await reconcileBundle(bundle)).proposals[0];
  assert.equal(proposal.outcome, 'review-extraction');
  assert.ok(proposal.reasons.includes('source-integrity-mismatch'));
});

test('a human review preserves evidence and never creates an administrative conclusion or writes to RADAR', async () => {
  const bundle = onlyFirst();
  const proposal = (await reconcileBundle(bundle)).proposals[0];
  const decision = await reviewProposal(proposal, { action: 'confirm-correspondence', reviewer: 'Demo reviewer', note: 'Synthetic sources compared.' }, bundle.documents);
  assert.equal(decision.origin, 'human_decision');
  assert.equal(decision.persistedToRadar, false);
  assert.equal(decision.administrativeConclusion, null);
  assert.deepEqual(decision.evidence, proposal.evidence);
  assert.notEqual(decision.evidence, proposal.evidence);
});

test('a source changed after proposing prevents approval of stale evidence', async () => {
  const bundle = onlyFirst();
  const proposal = (await reconcileBundle(bundle)).proposals[0];
  bundle.documents[0].version = 'demo-v2';
  await assert.rejects(reviewProposal(proposal, { action: 'confirm-correspondence', reviewer: 'Demo reviewer', note: 'Review.' }, bundle.documents), /Source changed/);
});

test('ambiguity cannot be confirmed as a correspondence by the review function', async () => {
  const result = await reconcileBundle(fresh());
  await assert.rejects(reviewProposal(result.proposals[2], { action: 'confirm-correspondence', reviewer: 'Demo reviewer', note: 'Review.' }, fixture.documents), /Resolve the ambiguity/);
});

test('input must be explicitly synthetic and identifiers must be unique', async () => {
  await assert.rejects(reconcileBundle({ ...fresh(), synthetic: false }), /synthetic/);
  const bundle = onlyFirst(); bundle.invoices.push(bundle.invoices[0]);
  await assert.rejects(reconcileBundle(bundle), /duplicate ID/);
});
