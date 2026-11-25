// Isolated research prototype. No network, credentials, database or RADAR commands.
export const RULE_VERSION = 'document-match-demo/1';
const MIN_CONFIDENCE = 0.90; // Demonstration threshold; not a production decision rule.
const text = value => typeof value === 'string' ? value.normalize('NFKC').trim() : '';
const key = value => text(value).toUpperCase();

export function moneyToCents(value) {
  // Require a decimal string, avoiding locale guesses and floating-point totals.
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)\.\d{2}$/.test(value)) return null;
  const [whole, fraction] = value.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction);
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}

function contextKey(record) {
  const context = record.context || {};
  if (context.confirmed !== true) return null;
  const parts = [context.schoolId, context.competenceId, context.programId].map(text);
  return parts.every(Boolean) ? JSON.stringify(parts) : null;
}

async function verifiedDocuments(values) {
  const entries = await Promise.all(values.map(async document => {
    const bytes = new TextEncoder().encode(document.text || '');
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const actual = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return [document.id, { ...document, contentVerified: !!document.text && actual === document.sha256 }];
  }));
  return new Map(entries);
}

function inspect(record, documents, type) {
  const problems = [];
  const source = record.source || {};
  const document = documents.get(source.documentId);
  if (!document || !/^[0-9a-f]{64}$/.test(source.sha256 || '') || !Number.isInteger(source.page) || source.page < 1 || !text(source.anchor)) {
    problems.push('source-incomplete');
  } else if (source.version !== document.version || source.sha256 !== document.sha256) {
    problems.push('source-changed');
  } else if (!document.contentVerified) {
    problems.push('source-integrity-mismatch');
  }
  if (record.origin !== 'document_extraction') problems.push('unsupported-origin');
  if (!Number.isFinite(record.confidence) || record.confidence < MIN_CONFIDENCE || record.confidence > 1) problems.push('extraction-needs-review');
  const context = contextKey(record);
  if (!context) problems.push('context-unconfirmed');
  const fields = record.fields || {};
  const reference = key(type === 'invoice' ? fields.number : fields.reference);
  const party = key(fields.partyKey);
  const cents = moneyToCents(fields.amountDecimal);
  if (!reference || !party || cents === null || cents <= 0) problems.push('fields-incomplete');
  if (fields.currency !== 'BRL') problems.push('currency-needs-review');
  if (type === 'payment' && fields.direction !== 'debit') problems.push('not-a-debit');
  return { record, problems, context, reference, party, cents };
}

function uniqueIds(values, label) {
  const ids = values.map(item => text(item?.id));
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) throw new TypeError(`${label}: missing or duplicate ID`);
}

export async function reconcileBundle(bundle) {
  if (bundle?.schemaVersion !== 1 || bundle.synthetic !== true) throw new TypeError('This prototype accepts explicitly synthetic fixtures only');
  for (const name of ['documents', 'invoices', 'payments']) {
    if (!Array.isArray(bundle[name])) throw new TypeError(`Missing ${name}`);
    uniqueIds(bundle[name], name);
  }
  const documents = await verifiedDocuments(bundle.documents);
  const invoices = bundle.invoices.map(record => inspect(record, documents, 'invoice'));
  const payments = bundle.payments.map(record => inspect(record, documents, 'payment'));
  const candidates = invoices.map(invoice => payments.filter(payment =>
    invoice.context && payment.context === invoice.context &&
    invoice.reference && payment.reference === invoice.reference &&
    invoice.party && payment.party === invoice.party
  ));
  // Check all claims before choosing a match. An order-dependent greedy match
  // could silently allocate one payment to two otherwise identical invoices.
  const claims = new Map();
  for (let index = 0; index < invoices.length; index += 1) {
    for (const payment of candidates[index]) {
      if (!claims.has(payment.record.id)) claims.set(payment.record.id, new Set());
      claims.get(payment.record.id).add(invoices[index].record.id);
    }
  }
  const proposals = invoices.map((invoice, index) => {
    const matching = candidates[index];
    const reasons = [...invoice.problems];
    let outcome;
    if (reasons.length) outcome = 'review-extraction';
    else if (matching.length === 0) outcome = 'no-correspondence';
    else if (matching.length > 1 || matching.some(payment => claims.get(payment.record.id).size > 1)) {
      outcome = 'ambiguous';
      reasons.push('multiple-possible-allocations');
    } else if (matching[0].problems.length) {
      outcome = 'review-extraction';
      reasons.push(...matching[0].problems);
    } else if (matching[0].cents !== invoice.cents) {
      outcome = 'amount-difference';
      reasons.push('different-document-and-payment-amount');
    } else outcome = 'compatible';
    return {
      id: `proposal:${invoice.record.id}`, invoiceId: invoice.record.id,
      ruleVersion: RULE_VERSION, origin: 'deterministic_rule', outcome,
      reasons: [...new Set(reasons)], paymentIds: matching.map(item => item.record.id),
      invoiceAmountCents: invoice.cents,
      paymentAmountCents: matching.length === 1 ? matching[0].cents : null,
      evidence: [invoice.record, ...matching.map(item => item.record)].map(record => ({
        recordId: record.id, origin: record.origin, source: { ...record.source }
      })),
      requiresHumanReview: true, administrativeConclusion: null
    };
  });
  return { schemaVersion: 1, synthetic: true, ruleVersion: RULE_VERSION, proposals };
}

export async function reviewProposal(proposal, decision, currentDocuments) {
  if (!proposal?.requiresHumanReview || !Array.isArray(proposal.evidence)) throw new TypeError('Invalid proposal');
  if (!['confirm-correspondence', 'request-document-review', 'dismiss'].includes(decision?.action)) throw new TypeError('Unknown human decision');
  if (!text(decision.reviewer) || !text(decision.note)) throw new TypeError('Reviewer and explanation are required in this demonstration');
  if (decision.action === 'confirm-correspondence' && proposal.outcome !== 'compatible') throw new TypeError('Resolve the ambiguity or divergence before confirming a correspondence');
  const documents = await verifiedDocuments(currentDocuments);
  for (const evidence of proposal.evidence) {
    const current = documents.get(evidence.source.documentId);
    if (!current?.contentVerified || current.version !== evidence.source.version || current.sha256 !== evidence.source.sha256) throw new TypeError('Source changed; rebuild the proposal before review');
  }
  return {
    proposalId: proposal.id, origin: 'human_decision', action: decision.action,
    reviewer: text(decision.reviewer), note: text(decision.note),
    ruleVersion: proposal.ruleVersion, evidence: structuredClone(proposal.evidence),
    synthetic: true, persistedToRadar: false, administrativeConclusion: null
  };
}
