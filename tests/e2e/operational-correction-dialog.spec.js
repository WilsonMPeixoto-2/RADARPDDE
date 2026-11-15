'use strict';
const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

async function controlledDialog(page, options = {}) {
    await page.evaluate(async ({ failFirst, failRefresh }) => {
        await window.RadarProductExtensionsReady;
        window.__auditRpc = [];
        window.__auditRefresh = 0;
        window.__auditRendered = false;
        let failNext = Boolean(failFirst);
        const repository = {
            capabilities: () => ({ remote: true }),
            async executeRpc(name, args) {
                window.__auditRpc.push({ name, args });
                if (name === 'preview_operational_change') {
                    return {
                        action: 'correct_analysis', planDigest: 'a'.repeat(64),
                        effects: { update: [{ entity: 'verifications', field: 'analysis.extCC',
                            before: 'Incorreto', after: args.p_request.changes.analysis }] },
                        blockers: [], warnings: [], preserved: { bonusResult: 'apta' }
                    };
                }
                if (name === 'apply_operational_change') {
                    if (failNext) {
                        failNext = false;
                        throw new Error('Falha de rede controlada');
                    }
                    return { committed: true, operationKey: args.p_operation_key };
                }
                throw new Error('RPC ¶»§q«^