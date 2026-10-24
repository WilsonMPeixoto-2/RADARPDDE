---
name: radar-quality
description: Route substantive RADAR PDDE analysis, fixes, frontend changes and reviews through the repository's canonical engineering, user-journey and evidence gates without creating parallel business rules.
---

# RADAR Quality Router

This skill adds **no new product rule**. It routes agent work to the canonical RADAR PDDE sources and enforces evidence-based completion.

## Read first

Follow the mandatory order in root `AGENTS.md`. For substantive engineering work, the core references include:

- `docs/reference/SYSTEM_CANONICAL_MODEL.md`
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`
- `docs/CURRENT_STAGE.md`
- current handoff explicitly linked by `CURRENT_STAGE.md`, when any
- `docs/reference/ENGINEERING_METHOD.md`
- `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
- task-specific contracts/ADRs

Do not promote this skill into a second source of functional truth.

## Execution protocol

1. **Ground in current state.** Revalidate branch/SHA, current code, data authority and relevant environment before relying on plans or historical chat context.
2. **Keep the active goal intact.** Do not redefine success around the easiest subset already implemented.
3. **Discover before asking.** Resolve facts from code, tests, schema, docs and runtime evidence; ask the user only for real preferences, trade-offs or unavailable information.
4. **Debug systematically.** Reproduce, trace cause, test one hypothesis at a time and apply the smallest coherent fix. Do not stack speculative hotfixes.
5. **Stop thrashing.** After two unsuccessful fix attempts, pause and re-run root-cause analysis before a third. Repeated moving symptoms require architectural review, not another patch layer.
6. **Test the invariant.** Prefer real composition and integration evidence over call counts or isolated mocks when the behavior crosses boundaries.
7. **Review adversarially.** After GREEN, ask how the change can still produce incorrect state through neighboring flows, ordering, reload, shared state, remote ambiguity or visual composition.
8. **Frontend means browser evidence.** Apply `FRONTEND_USER_VALIDATION_GATE.md` whenever user-perceived behavior can change. CI green alone is insufficient.
9. **Visual work needs rendered proof.** Inspect the actual surface for clipping, overlap, wrapping, visibility, hierarchy, responsiveness and errors; use screenshots/traces when material.
10. **Prefer reviewable stages.** If a non-mechanical diff becomes very large, look for the smallest coherent independently testable stage instead of maximizing one PR.

## Completion audit

Before any claim such as “fixed”, “complete”, “ready”, “published”, “reverted” or “green”:

1. derive the explicit requirements from the user request and applicable canonical sources;
2. identify the authoritative evidence that proves each requirement;
3. inspect that evidence on the current SHA/environment;
4. classify each requirement as proven, contradicted, incomplete, weak/indirect evidence, or unverified;
5. claim completion only when every required item is proven.

A test or document counts as evidence only for the scope it actually covers. Missing or indirect evidence is **unverified**, not success.
