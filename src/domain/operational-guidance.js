(function installOperationalGuidance(root, factory) {
    'use strict';
    const node = typeof module === 'object' && module.exports;
    const api = factory(
        node ? require('./operational-projection.js') : () => root.RadarOperationalProjection,
        node ? require('./invoice-document-analysis.js') : () => root.RadarInvoiceDocumentAnalysis,
        node ? require('./fluxo-operacional.js') : () => root.RadarFluxoOperacional
    );
    if (node) module.exports = api;
    if (root) root.RadarOperationalGuidance = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalGuidance(projectionSource, invoiceSource, flowSource) {
    'use strict';

    const text = value => value == null ? '' : String(value).trim();
    const list = value => Array.isArray(value) ? value : [];
    const GROUPS = Object.freeze([
        { id: 'review', label: 'Reanálises prontas', unit: 'Pendências' },
        { id: 'analysis', label: 'Análise fiscal a conferir', unit: 'Notas' },
        { id: 'identify', label: 'Despesas a identificar', unit: 'Despesas' },
        { id: 'inventory', label: 'Inventário por etapa', unit: 'Bens' },
        { id: 'bonus', label: 'Bonificação a concluir', unit: 'Contextos' },
        { id: 'follow_up', label: 'Acompanhamento em aberto', unit: 'Pendências' }
    ]);
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    const resolve = value => typeof value === 'function' ? value() : value;
    function dependenciesReady() {
        return typeof resolve(projectionSource)?.getOperationalBaseDate === 'function'
            && typeof resolve(invoiceSource)?.getInvoiceDocumentAnalysisInContext === 'function'
            && typeof resolve(flowSource)?.evaluateMonthlyEvaluation === 'function';
    }

    function contextOf(record = {}) {
        const source = text(record.compKey || record.source_context_key || record.contextKey);
        const parsed = /^(\d{4}-(?:0[1-9]|1[0-2]))_(.+)$/.exec(source);
        return {
            competence: text(record.competenciaOrigem || record.competencia || record.competence_id || parsed?.[1]),
            programId: text(record.programaId || record.program_id || parsed?.[2])
        };
    }
    function daysSince(value, now) {
        if (!value) return null;
        const instant = new Date(value).getTime();
        const reference = new Date(now).getTime();
        if (!Number.isFinite(instant) || !Number.isFinite(reference) || instant > reference) return null;
        return Math.floor((reference - instant) / 86400000);
    }
    function summarizeDays(values) {
        const valid = values.filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
        const midpoint = Math.floor(valid.length / 2);
        return {
            total: values.length, valid: valid.length, missing: values.length - valid.length,
            median: valid.length ? (valid.length % 2 ? valid[midpoint] : (valid[midpoint - 1] + valid[midpoint]) / 2) : null,
            p90: valid.length ? valid[Math.max(0, Math.ceil(valid.length * 0.9) - 1)] : null
        };
    }
    function buildGuidance(input = {}) {
        const projection = resolve(projectionSource);
        const invoiceAnalysis = resolve(invoiceSource);
        const flow = resolve(flowSource);
        if (!dependenciesReady()) throw new Error('Projeções operacionais ainda não estão disponíveis.');
        const now = input.now || new Date().toISOString();
        const competence = text(input.competence);
        const schools = list(input.schools);
        const schoolById = new Map(schools.map(school => [text(school.id), school]));
        const programs = new Map(list(input.programs).map(program => [text(program.id), text(program.name || program.nome)]));
        const scope = {
            competence, schoolCount: schoolById.size, activePendencies: 0,
            invoices: 0, assets: 0, existingContexts: 0, consolidatedContexts: 0,
            undatedAssets: 0, duplicateIdentities: 0
        };
        const items = [];
        const historyDays = [];
        const stageDays = [];
        const reviewDays = [];
        const capabilities = input.capabilities || {};
        const fiscal = capabilities.fiscal === true;
        const inventory = capabilities.inventory === true || fiscal;
        const inScope = record => schoolById.has(text(record.escolaId || record.school_id))
            && (!competence || contextOf(record).competence === competence);
        const seen = new Map();
        const duplicateIds = new Set();
        for (const [entity, records] of [['pendency', input.pendencies], ['invoice', input.invoices], ['asset', input.assets]]) {
            for (const record of list(records)) {
                const key = `${entity}:${text(record.id)}`;
                if (!text(record.id) || seen.has(key)) duplicateIds.add(key);
                seen.set(key, true);
            }
        }
        scope.duplicateIdentities = duplicateIds.size;
        function add(entity, record, group, title, reason, target, extra = {}) {
            const id = text(record.id);
            if (!id || duplicateIds.has(`${entity}:${id}`)) return;
            const schoolId = text(record.escolaId || record.school_id);
            const school = schoolById.get(schoolId);
            if (!school) return;
            const context = contextOf(record);
            items.push({
                key: `${entity}:${schoolId}:${id}:${group}`, group, title, reason,
                schoolId, schoolName: text(school.denominação || school.denominacao || school.name || school.id),
                schoolDesignation: text(school.designação || school.designacao),
                competence: context.competence, programId: context.programId,
                programName: programs.get(context.programId) || context.programId,
                target: { ...target, schoolId, competence: context.competence, programId: context.programId },
                ...extra
            });
        }
        const activeInvoicePendencies = new Map();
        if (fiscal) {
            for (const pendency of list(input.pendencies)) {
                if (!inScope(pendency) || !['Aberta', 'Aguardando reanálise'].includes(pendency.status)) continue;
                scope.activePendencies += 1;
                const invoiceId = text(pendency.registeredInvoiceId || pendency.registered_invoice_id);
                if (invoiceId && pendency.documentoKey === 'notaFiscal') activeInvoicePendencies.set(invoiceId, pendency);
                const historicAge = daysSince(pendency.dataAbertura || pendency.opened_at, now);
                const awaiting = pendency.status === 'Aguardando reanálise';
                const awaitingHasDate = list(pendency.tentativas).some(attempt => attempt.status === 'aguardando'
                    && (attempt.dataRegistro || attempt.dataDisponibilizacao));
                const base = projection?.getOperationalBaseDate?.(pendency);
                const stageAge = awaiting && !awaitingHasDate ? null : daysSince(base, now);
                historyDays.push(historicAge);
                stageDays.push(stageAge);
                if (awaiting) reviewDays.push(stageAge);
                const document = projection?.DOCUMENT_LABELS?.[pendency.documentoKey] || text(pendency.item) || 'Documento';
                const actor = awaiting ? 'Equipe de análise' : text(pendency.responsavel || pendency.responsible_area)
                    || (pendency.programaId && pendency.documentoKey ? 'Escola' : 'Responsável a conferir');
                const canonicalAction = projection?.getConcreteNextAction?.({ pendency });
                const title = awaiting ? `Reanalisar ${document}`
                    : pendency.programaId && pendency.documentoKey && actor === 'Escola'
                        ? canonicalAction?.label || `Acompanhar ${document}` : `Acompanhar ${document}`;
                add('pendency', pendency, awaiting ? 'review' : 'follow_up',
                    title,
                    awaiting ? 'A Pendência está aguardando reanálise. Confira o envio já registrado antes de decidir o resultado.'
                        : `A Pendência está aberta e aguarda providência de ${actor}. Confira o histórico antes de registrar um novo contato ou envio.`,
                    { entity: 'pendency', id: pendency.id },
                    { actor, stageDays: stageAge, historicDays: historicAge });
            }
        }
        const invoiceGroups = new Map();
        for (const invoice of list(input.invoices)) {
            if (!inScope(invoice) || !invoiceAnalysis?.isInvoiceDocument?.(invoice)) continue;
            const context = contextOf(invoice);
            const key = `${text(invoice.escolaId || invoice.school_id)}:${context.competence}_${context.programId}`;
            const group = invoiceGroups.get(key) || [];
            group.push(invoice);
            invoiceGroups.set(key, group);
        }
        if (fiscal) for (const group of invoiceGroups.values()) {
            for (const invoice of group) {
                scope.invoices += 1;
                const context = contextOf(invoice);
                const schoolId = text(invoice.escolaId || invoice.school_id);
                const verification = input.verifications?.[schoolId]?.[`${context.competence}_${context.programId}`] || {};
                const identity = text(invoice.numero || invoice.invoice_number);
                if (invoiceAnalysis.isUnidentifiedExpense(invoice)) {
                    const pendency = activeInvoicePendencies.get(text(invoice.id));
                    add('invoice', invoice, 'identify', `Identificar a natureza da despesa${identity ? ` · ${identity}` : ''}`,
                        'A despesa está cadastrada como A identificar. Esse registro provisório não confirma uma natureza de gasto nem uma análise fiscal concluída.',
                        pendency ? { entity: 'pendency', id: pendency.id } : { entity: 'invoice', id: invoice.id },
                        { actor: 'Equipe de análise' });
                    continue;
                }
                const analysis = invoiceAnalysis.getInvoiceDocumentAnalysisInContext(invoice, group.length,
                    verification.analise?.notaFiscal || verification.analysis?.notaFiscal);
                if (analysis !== 'Não analisado' || activeInvoicePendencies.has(text(invoice.id))) continue;
                add('invoice', invoice, 'analysis', `Conferir análise fiscal${identity ? ` · NF ${identity}` : ''}`,
                    invoiceAnalysis.hasExplicitInvoiceDocumentAnalysis(invoice)
                        ? 'A nota cadastrada está marcada como Não analisado. A análise fiscal é independente da consulta à Assessoria e da bonificação.'
                        : 'Não há uma conclusão fiscal individual aplicável a esta nota. Confira o documento e o contexto; um campo sem análise não prova ausência do arquivo.',
                    { entity: 'invoice', id: invoice.id }, { actor: 'Equipe de análise' });
            }
        }
        if (inventory) for (const asset of list(input.assets)) {
            const schoolId = text(asset.escolaId || asset.school_id);
            if (!schoolById.has(schoolId)) continue;
            if (competence && !contextOf(asset).competence) scope.undatedAssets += 1;
            if (!inScope(asset)) continue;
            scope.assets += 1;
            const status = text(asset.status);
            if (!['Não encaminhada', 'Encaminhada'].includes(status)) continue;
            const description = text(asset.item || asset.descricao || asset.description) || 'Bem patrimonial';
            add('asset', asset, 'inventory', status === 'Encaminhada'
                ? `Conferir inventariação · ${description}` : `Conferir encaminhamento · ${description}`,
                status === 'Encaminhada'
                    ? 'O registro consta como Encaminhada e aguarda a etapa do Inventário. Confira o bem e os documentos antes de registrar a conclusão.'
                    : 'O registro consta como Não encaminhada. Confira a documentação e a despesa de origem antes de encaminhar.',
                { entity: 'asset', id: asset.id },
                { actor: status === 'Encaminhada' ? 'Inventário' : 'Verbas Federais', inventoryStatus: status });
        }
        if (fiscal) for (const [schoolId, verifications] of Object.entries(input.verifications || {})) {
            if (!schoolById.has(schoolId)) continue;
            for (const [key, verification] of Object.entries(verifications || {})) {
                const parsed = /^(\d{4}-(?:0[1-9]|1[0-2]))_(.+)$/.exec(key);
                if (!parsed || (competence && parsed[1] !== competence) || !verification) continue;
                scope.existingContexts += 1;
                const recordedResult = text(verification.resultadoBonif || verification.bonus_result);
                const consolidated = ['apta', 'inapta'].includes(recordedResult);
                const pending = verification.bonificacaoPendenteConsolidacao === true;
                if (consolidated) {
                    scope.consolidatedContexts += 1;
                    if (!pending) continue;
                }
                const programId = parsed[2];
                const status = flow?.getProgramBonificationStatus?.(verification, programId);
                if (!pending && status !== 'em-apuracao') continue;
                const evaluation = flow?.evaluateMonthlyEvaluation?.({
                    bonification: verification.bonificacao || verification.bonification || {},
                    analysis: verification.analise || verification.analysis || {}, programId
                });
                if (!evaluation) continue;
                const missing = list(evaluation.missingFields).map(field => projection.DOCUMENT_LABELS[field] || field);
                const title = pending ? 'Consolidar alterações da bonificação'
                    : evaluation.canConsolidate ? 'Conferir consolidação da bonificação' : 'Completar avaliações de entrega';
                const reason = pending
                    ? `Há alterações explicitamente pendentes de consolidação neste programa e mês.${consolidated
                        ? ` O resultado histórico ${recordedResult === 'apta' ? 'Apta' : 'Inapta'} continua registrado.` : ''} ${evaluation.canConsolidate
                        ? 'Confira as avaliações antes de consolidar as alterações.'
                        : `Confira primeiro as respostas de entrega ainda faltantes: ${missing.join(', ')}.`} A análise fiscal permanece independente.`
                    : evaluation.canConsolidate
                        ? 'As respostas exigidas estão preenchidas, mas este contexto registrado ainda não tem resultado consolidado. Confira as avaliações antes de consolidar.'
                        : `Este contexto já está em apuração. Faltam respostas de entrega: ${missing.join(', ')}. A análise fiscal permanece independente.`;
                add('context', { id: key, escolaId: schoolId, competencia: parsed[1], programaId: programId }, 'bonus',
                    title, reason,
                    { entity: 'verification', contextKey: key },
                    { actor: 'Equipe de análise', canConsolidate: evaluation.canConsolidate,
                        consolidationPending: pending, recordedResult });
            }
        }
        const order = new Map(GROUPS.map((group, index) => [group.id, index]));
        items.sort((left, right) => (order.get(left.group) - order.get(right.group))
            || ((right.stageDays ?? -1) - (left.stageDays ?? -1))
            || collator.compare(left.schoolDesignation || left.schoolName, right.schoolDesignation || right.schoolName)
            || collator.compare(left.title, right.title) || collator.compare(left.key, right.key));
        const groups = GROUPS.map(group => ({ ...group,
            count: items.filter(item => item.group === group.id).length,
            schools: new Set(items.filter(item => item.group === group.id).map(item => item.schoolId)).size
        }));
        return {
            asOf: now, scope, items, groups,
            ages: { historical: summarizeDays(historyDays), stage: summarizeDays(stageDays), review: summarizeDays(reviewDays) }
        };
    }
    return Object.freeze({ GROUPS, buildGuidance, contextOf, daysSince, summarizeDays, dependenciesReady });
}));
