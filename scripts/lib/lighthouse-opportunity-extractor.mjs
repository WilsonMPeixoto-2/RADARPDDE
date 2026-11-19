/**
 * Extrai oportunidades com economia estimada dos relatórios Lighthouse.
 *
 * Lighthouse 13.6 publica numericValue/numericUnit em insights. As métricas de
 * duração real da página (FCP/LCP/TBT) também possuem numericValue: nunca
 * confundir essas durações com uma economia estimada.
 *
 * @param {object} report Lighthouse Result (LHR).
 * @returns {Array<object>} Oportunidades ordenadas, limitadas a oito itens.
 */
export function extractPerformanceOpportunities(report) {
    const references = report?.categories?.performance?.auditRefs || [];
    const positiveFinite = value => (
        typeof value === 'number' && Number.isFinite(value) && value > 0
            ? value : null
    );

    return references
        .map(reference => {
            const audit = report?.audits?.[reference?.id];
            if (!audit || typeof audit.score !== 'number' || audit.score >= 1) {
                return null;
            }

            const isInsight = reference.group === 'insights'
                && String(reference.id).endsWith('-insight');
            const estimated = isInsight ? positiveFinite(audit.numericValue) : null;
            const savingsMs = positiveFinite(audit.details?.overallSavingsMs)
                ?? (audit.numericUnit === 'millisecond' ? estimated : null);
            const savingsBytes = positiveFinite(audit.details?.overallSavingsBytes)
                ?? (audit.numericUnit === 'byte' ? estimated : null);
            const displayValue = audit.displayValue || null;

            if (!savingsMs && !savingsBytes
                && !/economia estimada|estimated savings/i.test(displayValue || '')) {
                return null;
            }

            return {
                id: reference.id,
                title: audit.title || reference.id,
                score: audit.score,
                displayValue,
                savingsMs,
                savingsBytes
            };
        })
        .filter(Boolean)
        .sort((left, right) => (
            (right.savingsMs || 0) - (left.savingsMs || 0)
            || (right.savingsBytes || 0) - (left.savingsBytes || 0)
            || left.score - right.score
        ))
        .slice(0, 8);
}
