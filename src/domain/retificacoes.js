(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarRetificacoes = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function normalizeText(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeProfile(profile) {
        return normalizeText(profile).toLocaleLowerCase('pt-BR');
    }

    function canRetify(profile) {
        return normalizeProfile(profile) === 'assistente';
    }

    function normalizeTimestamp(value) {
        const text = normalizeText(value);
        const parsed = new Date(text);
        if (!text || Number.isNaN(parsed.getTime())) {
            throw new TypeError('Data e hora da retificação devem estar em formato válido.');
        }
        return parsed.toISOString();
    }

    function flatten(value, prefix = '', output = {}) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            output[prefix] = value;
            return output;
        }
        Object.keys(value).sort().forEach(key => {
            const nextPrefix = prefix ? `${prefix}.${key}` : key;
            const current = value[key];
            if (current && typeof current === 'object' && !Array.isArray(current)) {
                flatten(current, nextPrefix, output);
            } else {
                output[nextPrefix] = current;
            }
        });
        return output;
    }

    function listChangedFields(before, after) {
        const left = flatten(before || {});
        const right = flatten(after || {});
        return [...new Set([...Object.keys(left), ...Object.keys(right)])]
            .filter(key => JSON.stringify(left[key]) !== JSON.stringify(right[key]))
            .sort();
    }

    function createRetification(input = {}, audit = {}) {
        if (!canRetify(audit.perfil || audit.profile)) {
            throw new Error('Retificação permitida somente ao perfil Assistente nesta fase.');
        }
        const justification = normalizeText(input.justificativa);
        if (!justification) {
            throw new TypeError('Justificativa da retificação é obrigatória.');
        }
        const before = clone(input.before || {});
        const after = clone(input.after || {});
        const changedFields = listChangedFields(before, after);
        if (changedFields.length === 0) {
            throw new Error('A retificação não contém nenhuma alteração efetiva.');
        }
        return {
            id: normalizeText(audit.id) || `retificacao-${Date.now()}`,
            escolaId: normalizeText(audit.escolaId),
            competencia: normalizeText(audit.competencia),
            programaId: normalizeText(audit.programaId),
            usuario: normalizeText(audit.usuario || audit.user),
            perfil: 'assistente',
            dataHora: normalizeTimestamp(audit.at || audit.dataHora || audit.timestamp),
            justificativa: justification,
            before,
            after,
            changedFields,
            resultadoAnterior: before.resultadoBonif ?? null,
            resultadoPosterior: after.resultadoBonif ?? null
        };
    }

    function applyRetification(verification = {}, changes = {}, audit = {}) {
        if (!canRetify(audit.perfil || audit.profile)) {
            throw new Error('Retificação permitida somente ao perfil Assistente nesta fase.');
        }
        const before = clone({
            bonificacao: verification.bonificacao || {},
            resultadoBonif: Object.prototype.hasOwnProperty.call(verification, 'resultadoBonif')
                ? verification.resultadoBonif
                : null
        });
        const nextVerification = clone(verification);
        nextVerification.bonificacao = {
            ...(nextVerification.bonificacao || {}),
            ...(changes.bonificacao || {})
        };
        if (Object.prototype.hasOwnProperty.call(changes, 'resultadoBonif')) {
            nextVerification.resultadoBonif = changes.resultadoBonif;
        }
        const after = clone({
            bonificacao: nextVerification.bonificacao || {},
            resultadoBonif: Object.prototype.hasOwnProperty.call(nextVerification, 'resultadoBonif')
                ? nextVerification.resultadoBonif
                : null
        });
        const retification = createRetification({
            justificativa: changes.justificativa,
            before,
            after
        }, audit);
        nextVerification.retificacoes = Array.isArray(nextVerification.retificacoes)
            ? [...nextVerification.retificacoes, retification]
            : [retification];
        return {
            verification: nextVerification,
            retification
        };
    }

    return Object.freeze({
        VERSION: '1.0.0',
        applyRetification,
        canRetify,
        createRetification,
        listChangedFields
    });
}));
