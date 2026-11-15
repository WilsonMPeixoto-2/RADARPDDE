'use strict';

(function installOperationalCorrectionService(root) {
    const CONTRACT_VERSION = 1;
    const SUPPORTED_ACTIONS = new Set([
        'correct_analysis',
        'clear_analysis',
        'delete_pendency',
        'delete_invoice',
        'undo_quality_identification',
        'delete_quality_movement',
        'correct_bonification',
        'clear_item_history',
        'delete_context',
        'delete_attempt',
        'delete_review',
        'correct_attempt',
        'correct_review',
        'delete_contact',
        'correct_contact',
        'correct_inventory',
        'delete_asset'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function clone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function canonicalize(value) {
        if (value === null || typeof value !== 'object') {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return '[' + value.map(canonicalize).join(',') + ']';
        }
        const keys = Object.keys(value).sort();
        return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
    }

    function computeDigest(payload) {
        const serialized = canonicalize(payload);
        if (typeof require === 'function') {
            try {
                const crypto = require('crypto');
                return 'sha256:' + crypto.createHash('sha256').update(serialized).digest('hex');
            } catch (_) {
                // fallback below
            }
        }
        let h1 = 0x811c9dc5;
        for (let i = 0; i < serialized.length; i += 1) {
            h1 ^= serialized.charCodeAt(i);
            h1 = Math.imul(h1, 0x01000193) >>> 0;
        }
        return 'fnv1a:' + h1.toString(16).padStart(8, '0');
    }

    function resolvePendencyCorrection(deps) {
        if (deps && deps.pendencyCorrection) return deps.pendencyCorrection;
        if (root && root.RadarPendencyCorrection) return root.RadarPendencyCorrection;
        if (typeof require === 'function') {
            return require('../domain/pendency-correction');
        }
        return null;
    }

    function isSameScope(record, target) {
        if (!record || !target) return false;
        const schoolMatch = !target.schoolId || text(record.schoolId) === text(target.schoolId);
        const compMatch = !target.competence || text(record.competence) === text(target.competence);
        const progMatch = !target.programId || text(record.programId) === text(target.programId);
        return schoolMatch && compMatch && progMatch;
    }

    function hasValidInvoicesInScope(state, target) {
        const invoices = Array.isArray(state?.invoices) ? state.invoices : [];
        return invoices.some(inv => isSameScope(inv, target) && text(inv.status) !== 'deleted' && !inv.cancelled);
    }

    function createOperationalCorrectionService(deps = {}) {
        const getState = typeof deps.getState === 'function' ? deps.getState : () => deps.state || {};
        const commitState = typeof deps.commitState === 'function' ? deps.commitState : async () => {};
        const appliedOperations = deps.appliedOperations instanceof Map ? deps.appliedOperations : new Map();
        const pendencyCorrection = resolvePendencyCorrection(deps);

        function buildPlan(request = {}, stateSnapshot = {}) {
            const action = text(request.action);
            const target = clone(request.target || {});
            const changes = clone(request.changes || {});
            const selectedPendencyIds = Array.isArray(request.selectedPendencyIds)
                ? request.selectedPendencyIds.map(text).filter(Boolean)
                : [];

            if (!SUPPORTED_ACTIONS.has(action)) {
                return {
                    contractVersion: CONTRACT_VERSION,
                    action,
                    target,
                    changes,
                    valid: false,
                    ambiguity: {
                        code: 'UNSUPPORTED_ACTION',
                        message: `Ação não suportada: ${action}`
                    },
                    conflicts: [],
                    impacts: [],
                    planDigest: null
                };
            }

            const state = clone(stateSnapshot || {});
            const conflicts = [];
            const impacts = [];
            let ambiguity = null;
            let nextState = clone(state);

            const invoices = Array.isArray(nextState.invoices) ? nextState.invoices : [];
            const pendencies = Array.isArray(nextState.pendencies) ? nextState.pendencies : [];
            const bonifications = Array.isArray(nextState.bonifications) ? nextState.bonifications : [];
            const qualityMovements = Array.isArray(nextState.qualityMovements) ? nextState.qualityMovements : [];

            if (action === 'delete_invoice') {
                const targetInv = invoices.find(inv => text(inv.id) === text(target.id) && isSameScope(inv, target));
                if (!targetInv) {
                    conflicts.push({ code: 'TARGET_NOT_FOUND', message: 'Nota fiscal não encontrada no escopo informado.' });
                } else {
                    const legacyWithoutFk = !targetInv.documentKey && !targetInv.programId;
                    if (legacyWithoutFk && !request.allowLegacyWithoutFk) {
                        conflicts.push({
                            code: 'LEGACY_WITHOUT_FK_PROTECTED',
                            message: 'Registro legado sem chave estrangeira protegido contra exclusão em cascata.'
                        });
                    }
                    const linkedPendencies = pendencies.filter(p =>
                        isSameScope(p, target)
                        && (text(p.invoiceId) === text(targetInv.id) || (target.documentKey && text(p.documentKey) === text(target.documentKey)))
                    );
                    nextState.invoices = invoices.filter(inv => text(inv.id) !== text(targetInv.id));
                    impacts.push({ kind: 'invoice', id: targetInv.id, operation: 'delete' });
                    if (linkedPendencies.length > 0 && selectedPendencyIds.length === 0) {
                        impacts.push({ kind: 'pendency', ids: linkedPendencies.map(p => p.id), operation: 'preserved_unless_selected' });
                    } else if (selectedPendencyIds.length > 0) {
                        const selectedSet = new Set(selectedPendencyIds);
                        nextState.pendencies = pendencies.filter(p => !(isSameScope(p, target) && selectedSet.has(text(p.id))));
                        impacts.push({ kind: 'pendency', ids: selectedPendencyIds, operation: 'delete' });
                    }
                }
            } else if (action === 'correct_bonification') {
                const targetBonus = bonifications.find(b => text(b.id) === text(target.id) && isSameScope(b, target));
                if (!targetBonus) {
                    conflicts.push({ code: 'TARGET_NOT_FOUND', message: 'Bonificação não encontrada no escopo.' });
                } else if (
                    (text(changes.status) === 'NA' || text(changes.mode) === 'na-bonus-with-valid-invoices')
                    && hasValidInvoicesInScope(nextState, target)
                ) {
                    conflicts.push({
                        code: 'NA_BONUS_WITH_VALID_INVOICES',
                        message: 'Não é permitido marcar bonificação como N/A enquanto houver notas fiscais válidas no escopo.'
                    });
                } else {
                    Object.assign(targetBonus, changes);
                    impacts.push({ kind: 'bonification', id: targetBonus.id, operation: 'update' });
                }
            } else if (
                action === 'correct_attempt'
                || action === 'correct_review'
                || action === 'delete_review'
                || action === 'delete_attempt'
            ) {
                const targetPendency = pendencies.find(p => text(p.id) === text(target.pendencyId || target.parentId) && isSameScope(p, target));
                if (!targetPendency) {
                    conflicts.push({ code: 'TARGET_NOT_FOUND', message: 'Pendência alvo não encontrada no escopo.' });
                } else if (!pendencyCorrection) {
                    conflicts.push({ code: 'DEPENDENCY_MISSING', message: 'RadarPendencyCorrection indisponível.' });
                } else {
                    const result = pendencyCorrection.rebuildPendencyAfterCorrection({
                        pendency: targetPendency,
                        attempts: Array.isArray(targetPendency.attempts) ? targetPendency.attempts : [],
                        action,
                        targetId: target.id,
                        changes
                    });
                    if (result.ambiguity) {
                        ambiguity = result.ambiguity;
                    } else {
                        const idx = pendencies.findIndex(p => text(p.id) === text(targetPendency.id));
                        nextState.pendencies[idx] = Object.assign({}, result.pendency, { attempts: result.attempts });
                        impacts.push({ kind: 'pendency', id: targetPendency.id, operation: action, affectedAnalysis: result.affectedAnalysis });
                    }
                }
            } else if (action === 'undo_quality_identification' || action === 'delete_quality_movement') {
                const idx = qualityMovements.findIndex(m => text(m.id) === text(target.id) && isSameScope(m, target));
                if (idx === -1) {
                    conflicts.push({ code: 'TARGET_NOT_FOUND', message: 'Movimento de qualidade não encontrado no escopo.' });
                } else {
                    qualityMovements.splice(idx, 1);
                    impacts.push({ kind: action, id: target.id, operation: 'delete' });
                }
            } else {
                impacts.push({ kind: text(target.kind || 'record'), id: text(target.id), operation: action });
            }

            const scopeDigestInput = {
                contractVersion: CONTRACT_VERSION,
                action,
                target,
                changes,
                selectedPendencyIds,
                scopedRecords: {
                    invoices: invoices.filter(r => isSameScope(r, target)),
                    pendencies: pendencies.filter(r => isSameScope(r, target)),
                    bonifications: bonifications.filter(r => isSameScope(r, target)),
                    qualityMovements: qualityMovements.filter(r => isSameScope(r, target))
                }
            };
            const planDigest = computeDigest(scopeDigestInput);

            return {
                contractVersion: CONTRACT_VERSION,
                action,
                target,
                changes,
                selectedPendencyIds,
                valid: conflicts.length === 0 && !ambiguity,
                ambiguity,
                conflicts,
                impacts,
                planDigest,
                _nextState: nextState
            };
        }

        async function preview(request = {}) {
            const stateSnapshot = await getState(request.target || {});
            const plan = buildPlan(request, stateSnapshot);
            const publicPlan = clone(plan);
            delete publicPlan._nextState;
            return publicPlan;
        }

        async function apply({ request = {}, planDigest = '', operationKey = '' } = {}) {
            const opKey = text(operationKey);
            if (opKey && appliedOperations.has(opKey)) {
                const cached = clone(appliedOperations.get(opKey));
                cached.idempotentReplay = true;
                return cached;
            }

            const currentState = await getState(request.target || {});
            const freshPlan = buildPlan(request, currentState);

            if (text(planDigest) && freshPlan.planDigest !== text(planDigest)) {
                return {
                    contractVersion: CONTRACT_VERSION,
                    applied: false,
                    error: {
                        code: 'CONCURRENT_SCOPE_CHANGED',
                        message: 'O estado do escopo mudou desde a geração do plano. Gere um novo preview antes de aplicar.'
                    },
                    planDigest: freshPlan.planDigest,
                    operationKey: opKey || null
                };
            }

            if (!freshPlan.valid) {
                return {
                    contractVersion: CONTRACT_VERSION,
                    applied: false,
                    error: freshPlan.ambiguity || freshPlan.conflicts[0] || {
                        code: 'CORRECTION_PLAN_INVALID',
                        message: 'O plano de correção possui conflitos ou ambiguidades.'
                    },
                    planDigest: freshPlan.planDigest,
                    operationKey: opKey || null
                };
            }

            await commitState(freshPlan._nextState, {
                action: freshPlan.action,
                target: freshPlan.target,
                planDigest: freshPlan.planDigest,
                operationKey: opKey || null
            });

            const receipt = {
                contractVersion: CONTRACT_VERSION,
                applied: true,
                idempotentReplay: false,
                action: freshPlan.action,
                target: freshPlan.target,
                impacts: freshPlan.impacts,
                planDigest: freshPlan.planDigest,
                operationKey: opKey || null
            };

            if (opKey) {
                appliedOperations.set(opKey, clone(receipt));
            }
            return receipt;
        }

        return Object.freeze({
            preview,
            apply
        });
    }

    const exported = Object.freeze({
        CONTRACT_VERSION,
        createOperationalCorrectionService,
        computeDigest
    });

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }
    if (root) {
        root.RadarOperationalCorrectionService = exported;
    }
}(typeof window !== 'undefined' ? window : globalThis));
