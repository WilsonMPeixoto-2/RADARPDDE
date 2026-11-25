(function installGranularCorrectionUi(root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RadarGranularCorrectionUi = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createGranularCorrectionUi() {
    'use strict';

    const text = value => value == null ? '' : String(value).trim();
    const own = (value, field) => Object.prototype.hasOwnProperty.call(value || {}, field);
    const OPERATIONS = Object.freeze({
        correct_attempt: { kind: 'attempt', title: 'Corrigir envio', object: 'Envio selecionado', family: 'Histórico de envios' },
        delete_attempt: { kind: 'attempt', title: 'Excluir envio', object: 'Envio selecionado', family: 'Histórico de envios', deleting: true },
        correct_review: { kind: 'review', title: 'Corrigir reanálise', object: 'Reanálise selecionada', family: 'Histórico de reanálises' },
        delete_review: { kind: 'review', title: 'Excluir reanálise', object: 'Reanálise selecionada', family: 'Histórico de reanálises', deleting: true },
        correct_contact: { kind: 'contact', title: 'Corrigir contato', object: 'Contato selecionado', family: 'Registro de comunicação' },
        delete_contact: { kind: 'contact', title: 'Excluir contato', object: 'Contato selecionado', family: 'Registro de comunicação', deleting: true },
        correct_inventory: { kind: 'asset', title: 'Corrigir registro patrimonial', object: 'Registro patrimonial selecionado', family: 'Inventário' },
        delete_asset: { kind: 'asset', title: 'Excluir registro patrimonial', object: 'Registro patrimonial selecionado', family: 'Inventário', deleting: true }
    });
    const RESULT_LABELS = Object.freeze({
        correto: 'Documento correto', incorreto: 'Documento com apontamentos',
        arquivo_indisponivel: 'Arquivo não localizado ou inacessível'
    });
    const CONTACT_TYPES = Object.freeze([
        ['WhatsApp', 'WhatsApp'], ['Telefone', 'Telefone'], ['E-mail', 'E-mail'],
        ['Atendimento presencial', 'Atendimento presencial'], ['Reunião', 'Reunião']
    ]);
    const FIELD_LABELS = Object.freeze({
        available_at: 'Data de disponibilização', availableAt: 'Data de disponibilização',
        drive_url: 'Link do documento', driveUrl: 'Link do documento',
        observation: 'Observação do envio', result: 'Resultado da reanálise',
        analyzed_at: 'Data da reanálise', analyzedAt: 'Data da reanálise',
        errors: 'Apontamentos da reanálise', status: 'Situação',
        contact_type: 'Tipo de contato', contactType: 'Tipo de contato',
        contact_date: 'Data do contato', contactDate: 'Data do contato',
        description: 'Descrição', official_charge: 'Cobrança oficial', officialCharge: 'Cobrança oficial',
        pendency_id: 'Vínculo com Pendência', pendencyId: 'Vínculo com Pendência',
        inventory_process: 'Processo de inventário', inventoryProcess: 'Processo de inventário',
        inventoried_at: 'Data de inventariação', inventoriedAt: 'Data de inventariação',
        inventoried_by_member_id: 'Responsável pela inventariação', inventoriedByMemberId: 'Responsável pela inventariação',
        notes: 'Observação patrimonial', next_actor: 'Responsável pela próxima ação',
        responsible_area: 'Área responsável', reason: 'Motivo da Pendência',
        resolved_at: 'Data de resolução', cancelled_at: 'Data de cancelamento', canceled_at: 'Data de cancelamento',
        'payload.observacaoAnalise': 'Observação da reanálise',
        'payload.analysisObservation': 'Observação da reanálise',
        'payload.analiseDocumentoFiscal': 'Análise fiscal da nota',
        'payload.analiseConsultaAssessoria': 'Análise da consulta à Assessoria',
        'analysis.notaFiscal': 'Análise fiscal do programa',
        'analysis.consAssessoria': 'Análise da Assessoria do programa',
        'analysis.encampInventario': 'Análise do encaminhamento ao Inventário',
        'bonification.encampInventario': 'Avaliação de entrega do encaminhamento ao Inventário'
    });
    function element(doc, tag, className, value) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined) node.textContent = value;
        return node;
    }
    function effectiveCapability(root, capability) {
        const policy = root?.RadarAccessPolicy;
        const profile = root?.getRadarAccessProfile?.() || '';
        const role = root?.RadarAuthContext?.authorization?.role || '';
        const effectiveProfile = policy?.resolveEffectiveProfile?.(profile, role) || profile;
        return policy?.hasCapability?.(effectiveProfile, capability, role) === true;
    }
    function canUse(root, action) {
        if (!OPERATIONS[action] || !root?.RadarOperationalCorrectionDialog?.canUse?.(root)) return false;
        const features = root?.RADAR_PDDE_CONFIG?.features;
        const pilot = root.RADAR_T5_HISTORY_PILOT === true
            && root.RADAR_T4_ITEM_HISTORY_PILOT === true
            && features?.operationalCorrectionPilot === true
            && ['localhost', '127.0.0.1'].includes(root?.location?.hostname)
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget !== 'production';
        const release = features?.granularHistoryRelease === true && features?.itemHistoryRelease === true
            && root?.RADAR_PDDE_CONFIG?.deploymentTarget === 'production';
        if ((!pilot && !release) || root.RadarOperationalCorrectionDialog.canClearHistory?.(root) !== true) return false;
        const policy = root.RadarAccessPolicy;
        const fiscal = effectiveCapability(root, policy?.CAPABILITIES?.OPEN_PENDENCY);
        if (OPERATIONS[action].kind !== 'asset') return fiscal;
        const role = policy?.normalizeProfile?.(root.RadarAuthContext?.authorization?.role) || '';
        const profile = policy?.normalizeProfile?.(root.getRadarAccessProfile?.()) || '';
        return fiscal || role === 'inventario' || (!role && profile === 'inventario');
    }
    function recordValues(action, record = {}) {
        const payload = record.payload || {};
        const kind = OPERATIONS[action]?.kind;
        if (kind === 'attempt') return {
            availableAt: record.available_at || record.availableAt || record.dataDisponibilizacao || '',
            driveUrl: record.drive_url ?? record.driveUrl ?? record.link ?? '',
            observation: record.observation ?? record.observacao ?? ''
        };
        if (kind === 'review') return {
            result: record.result ?? record.resultado ?? '',
            analyzedAt: record.analyzed_at || record.analyzedAt || record.dataAnalise || '',
            errors: Array.isArray(record.errors) ? record.errors : (record.errosEncontrados || []),
            observation: record.observacaoAnalise ?? record.analysisObservation
                ?? payload.observacaoAnalise ?? payload.analysisObservation ?? ''
        };
        if (kind === 'contact') return {
            contactType: record.contact_type || record.contactType || record.tipo || '',
            contactDate: record.contact_date || record.contactDate || record.dataAtendimento || record.dataHora || record.data || '',
            description: record.description ?? record.descricao ?? record.desc ?? record.observacao ?? '',
            officialCharge: record.official_charge === true || record.officialCharge === true
                || record.cobrancaOficial === true || record.cobrancaEnvioRegistro === true,
            pendencyId: record.pendency_id || record.pendenciaId || record.pendencyId || null
        };
        if (kind === 'asset') return {
            status: record.status || '',
            inventoryProcess: record.inventory_process ?? record.inventoryProcess ?? record.processoInventario ?? '',
            inventoriedAt: record.inventoried_at || record.inventoriedAt || record.dataInventariacao || '',
            inventoriedByMemberId: record.inventoried_by_member_id || record.inventoriedByMemberId || record.inventariadorId || '',
            notes: record.notes ?? record.observacoes ?? record.observacao ?? ''
        };
        return {};
    }
    function localTimestamp(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    function dateLabel(value, withTime = false) {
        if (!value) return 'Não informada';
        const string = text(value);
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(string) ? `${string}T12:00:00` : string;
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return string;
        return date.toLocaleString('pt-BR', withTime
            ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
    }
    function describeRecord(action, record = {}) {
        const kind = OPERATIONS[action]?.kind;
        const values = recordValues(action, record);
        if (kind === 'attempt' || kind === 'review') {
            const number = record.numero ?? record.attempt_number;
            const attempt = Number.isInteger(Number(number)) && Number(number) > 0 ? `Envio ${number}` : 'Envio registrado';
            return kind === 'review'
                ? `${attempt} · reanálise em ${dateLabel(values.analyzedAt, true)}`
                : `${attempt} · disponibilizado em ${dateLabel(values.availableAt)}`;
        }
        if (kind === 'contact') {
            const type = CONTACT_TYPES.find(([value]) => value === values.contactType)?.[1] || values.contactType || 'Contato';
            return `${type} · ${dateLabel(values.contactDate)}`;
        }
        return text(record.item || record.descricao || record.description) || 'Bem patrimonial';
    }
    function recordAuthor(action, record = {}) {
        const payload = record.payload || {};
        if (OPERATIONS[action]?.kind === 'review') return text(record.analisadoPor || record.analyzedBy
            || payload.analisadoPor || payload.analyzedBy);
        if (OPERATIONS[action]?.kind === 'attempt') return text(record.registradoPorNome || record.registradoPor
            || payload.registradoPor || record.created_by_name);
        if (OPERATIONS[action]?.kind === 'contact') return text(record.responsavel || record.usuario
            || payload.responsavel || payload.usuario || record.created_by_name);
        return '';
    }
    function fieldDefinitions(root, action, values, context) {
        if (OPERATIONS[action]?.kind === 'attempt') return [
            { key: 'availableAt', label: 'Data de disponibilização', type: 'date', required: true },
            { key: 'driveUrl', label: 'Link do documento (opcional)', type: 'url', placeholder: 'https://…' },
            { key: 'observation', label: 'Observação do envio (opcional)', type: 'textarea' }
        ];
        if (OPERATIONS[action]?.kind === 'review') return [
            { key: 'result', label: 'Resultado da reanálise', type: 'select', choices: Object.entries(RESULT_LABELS), required: true },
            { key: 'analyzedAt', label: 'Data e horário da reanálise', type: 'datetime-local', required: true },
            { key: 'errors', label: 'Apontamentos encontrados', type: 'errors', choices: [...new Set([
                ...(root.RadarPendencias?.DOCUMENT_ERROR_TYPES || []), ...(values.errors || [])
            ])] },
            { key: 'observation', label: 'Observação da reanálise (opcional)', type: 'textarea' }
        ];
        if (OPERATIONS[action]?.kind === 'contact') return [
            { key: 'contactType', label: 'Tipo de contato', type: 'select', choices: CONTACT_TYPES, required: true },
            { key: 'contactDate', label: 'Data do contato', type: 'date', required: true },
            { key: 'description', label: 'Descrição do contato (opcional)', type: 'textarea' },
            { key: 'officialCharge', label: 'Contato registrado como cobrança oficial', type: 'checkbox' },
            ...(values.pendencyId || context.pendencyId ? [{
                key: 'pendencyId', label: 'Desvincular desta Pendência e manter no histórico da escola', type: 'unlink',
                help: 'Use esta opção quando o contato contém informação da escola independente desta Pendência. Os envios e a situação da Pendência serão preservados.'
            }] : [])
        ];
        const members = (context.inventoryMembers || []).map(member => [text(member.id), text(member.name)]);
        if (values.inventoriedByMemberId && !members.some(([id]) => id === values.inventoriedByMemberId)) {
            members.unshift([values.inventoriedByMemberId, context.inventoriedByName || 'Responsável registrado']);
        }
        return [
            { key: 'status', label: 'Situação do registro', type: 'select', choices: ['Não encaminhada', 'Encaminhada', 'Inventariada'].map(value => [value, value]), required: true },
            { key: 'inventoryProcess', label: 'Processo de inventário (opcional)', type: 'text' },
            { key: 'inventoriedAt', label: 'Data e horário da inventariação', type: 'datetime-local' },
            { key: 'inventoriedByMemberId', label: 'Responsável pela inventariação', type: 'select', choices: [['', 'Não informado'], ...members] },
            { key: 'notes', label: 'Observação patrimonial (opcional)', type: 'textarea' }
        ];
    }
    function createFields(root, action, record = {}, context = {}) {
        const doc = root.document;
        const values = recordValues(action, record);
        const container = element(doc, 'div', 'granular-correction-fields');
        const fields = new Map();
        for (const definition of fieldDefinitions(root, action, values, context)) {
            const { key, type } = definition;
            const group = element(doc, 'div', 'granular-correction-field');
            const id = `radar-granular-field-${key}`;
            const label = element(doc, 'label', '', definition.label);
            label.htmlFor = id;
            let control;
            if (type === 'errors') {
                control = element(doc, 'fieldset', 'granular-correction-errors');
                control.appendChild(element(doc, 'legend', '', definition.label));
                for (const choice of definition.choices) {
                    const row = element(doc, 'label', 'granular-correction-check');
                    const checkbox = element(doc, 'input', '');
                    checkbox.type = 'checkbox'; checkbox.value = choice;
                    checkbox.checked = values.errors.includes(choice);
                    row.append(checkbox, doc.createTextNode(choice));
                    control.appendChild(row);
                }
                group.appendChild(control);
            } else {
                control = element(doc, type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input', 'form-control');
                if (type === 'select') {
                    const choices = [...definition.choices];
                    if (values[key] && !choices.some(([value]) => value === values[key])) choices.unshift([values[key], values[key]]);
                    for (const [value, name] of choices) {
                        const option = element(doc, 'option', '', name);
                        option.value = value;
                        control.appendChild(option);
                    }
                } else if (type === 'textarea') control.rows = 3;
                else control.type = type === 'unlink' ? 'checkbox' : type;
                if (type === 'checkbox' || type === 'unlink') {
                    control.checked = type === 'checkbox' && values[key] === true;
                    group.classList.add('granular-correction-check');
                    group.append(control, label);
                } else {
                    control.value = type === 'date' ? text(values[key]).slice(0, 10)
                        : type === 'datetime-local' ? localTimestamp(values[key]) : text(values[key]);
                    group.append(label, control);
                }
                control.required = definition.required === true;
                if (definition.placeholder) control.placeholder = definition.placeholder;
            }
            if (definition.help) {
                const help = element(doc, 'p', 'granular-correction-field-help', definition.help);
                help.id = `${id}-help`;
                control.setAttribute('aria-describedby', help.id);
                group.appendChild(help);
            }
            control.id = id;
            control.dataset.correctionField = key;
            fields.set(key, { control, group, definition, original: values[key],
                display: type === 'checkbox' || type === 'unlink' ? control.checked : control.value });
            container.appendChild(group);
        }
        const syncVisibility = () => {
            if (fields.has('errors')) fields.get('errors').group.hidden = fields.get('result').control.value !== 'incorreto';
            if (fields.has('inventoriedAt')) {
                const inventoried = fields.get('status').control.value === 'Inventariada';
                fields.get('inventoriedAt').group.hidden = !inventoried;
                fields.get('inventoriedByMemberId').group.hidden = !inventoried;
            }
        };
        container.addEventListener('change', syncVisibility);
        syncVisibility();
        return { container, fields, action };
    }
    function readChanges(form) {
        const changes = {};
        for (const [key, field] of form.fields) {
            if (field.group?.hidden) continue;
            const { control, definition, original, display } = field;
            let value = definition.type === 'checkbox' || definition.type === 'unlink' ? control.checked
                : definition.type === 'errors'
                    ? Array.from(control.querySelectorAll('input:checked')).map(input => input.value)
                    : control.value;
            if (definition.type === 'errors') {
                if (JSON.stringify([...value].sort()) === JSON.stringify([...(original || [])].sort())) continue;
            } else if (value === display) continue;
            if (definition.type === 'unlink') value = null;
            else if (definition.type === 'datetime-local') value = value ? new Date(value).toISOString() : null;
            else if (!['checkbox', 'errors'].includes(definition.type)) value = text(value);
            if (key === 'inventoriedByMemberId' && !value) value = null;
            changes[key] = value;
        }
        return changes;
    }
    function setDisabled(form, disabled) {
        if (!form) return;
        for (const { control } of form.fields.values()) {
            control.disabled = disabled;
            control.querySelectorAll?.('input').forEach(input => { input.disabled = disabled; });
        }
    }
    function validate(form) {
        for (const { control, group, definition } of form.fields.values()) {
            if (group?.hidden) continue;
            if (definition.type !== 'errors' && typeof control.checkValidity === 'function' && !control.checkValidity()) {
                control.reportValidity?.();
                return false;
            }
        }
        return true;
    }
    function humanValue(field, value, context = {}) {
        if (['pendency_id', 'pendencyId'].includes(field)) return value ? 'Vinculado à Pendência' : 'Contato geral da escola';
        if (value === null || value === undefined || value === '') return field === 'result' ? 'Sem reanálise' : 'Não informado';
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        if (Array.isArray(value)) return value.length ? value.join('; ') : 'Nenhum apontamento';
        if (RESULT_LABELS[value]) return RESULT_LABELS[value];
        const statuses = { aguardando: 'Aguardando reanálise', analisada: 'Analisada', substituida_antes_da_analise: 'Substituído antes da reanálise' };
        if (field === 'status' && statuses[value]) return statuses[value];
        if (['inventoried_by_member_id', 'inventoriedByMemberId'].includes(field)) {
            return (context.inventoryMembers || []).find(member => text(member.id) === text(value))?.name
                || context.inventoriedByName || 'Responsável registrado';
        }
        if (['contact_type', 'contactType'].includes(field)) return CONTACT_TYPES.find(([key]) => key === value)?.[1] || text(value);
        if (/(?:_at|At)$/.test(field) || ['contact_date', 'contactDate'].includes(field)) return dateLabel(value, /analyz|inventori/.test(field));
        if (typeof value === 'object') return 'Informações relacionadas';
        return text(value);
    }
    function explanation(action, context = {}) {
        const kind = OPERATIONS[action]?.kind;
        if (kind === 'attempt') return action === 'delete_attempt'
            ? 'Este envio e a reanálise que depende dele serão retirados. Confira a situação resultante da Pendência.'
            : 'Texto e link não mudam o resultado da reanálise. Uma correção na data pode alterar o atraso da análise vinculada.';
        if (kind === 'review') return action === 'delete_review'
            ? 'O envio será preservado. A situação da Pendência será reconstruída a partir dos registros que permanecerem.'
            : 'Corrija a reanálise deste envio. A prévia mostra o efeito sobre a Pendência e a análise vinculada.';
        if (kind === 'contact') return context.pendencyId
            ? 'Este contato está vinculado à Pendência. A correção do registro de comunicação não resolve a Pendência nem apaga mensagens já enviadas.'
            : 'Este é um contato geral da escola. A correção não altera Pendências nem apaga mensagens já enviadas.';
        return 'A correção vale para o registro no RADAR. Ela não desfaz atos no SIGMA, SEI ou Processo.Rio. Confira os vínculos antes de confirmar.';
    }
    function renderPreview(root, container, action, view, context = {}, alternatives = {}) {
        const doc = root.document;
        const operation = OPERATIONS[action];
        const changes = (Array.isArray(view.changes) ? view.changes : []).flatMap(change => {
            if (change.field !== 'payload') return [change];
            const result = [];
            for (const key of ['observacaoAnalise', 'analysisObservation', 'analiseDocumentoFiscal', 'analiseConsultaAssessoria']) {
                if (own(change.before, key) || own(change.after, key)) {
                    const before = change.before?.[key] ?? null;
                    const after = change.after?.[key] ?? null;
                    if (before !== after) result.push({ ...change, field: `payload.${key}`, before, after });
                }
            }
            return result;
        });
        container.replaceChildren();
        const preservation = element(doc, 'section', 'correction-preservation-panel');
        preservation.append(element(doc, 'h4', 'correction-panel-heading', 'O que será preservado'));
        const preserveText = action === 'correct_inventory'
            ? 'O resultado da bonificação, as entregas e as avaliações fiscais. O encaminhamento ao Inventário será recalculado conforme os registros, com o efeito indicado nesta prévia.'
            : operation.kind === 'asset'
                ? 'Os demais bens e os registros fora desta seleção. A prévia informa se o encaminhamento deste programa precisa ser atualizado.'
            : operation.kind === 'contact'
                ? 'O estado da Pendência, os envios, as reanálises e os demais contatos.'
                : 'A bonificação, a avaliação de entrega e os registros independentes deste envio ou desta reanálise.';
        preservation.appendChild(element(doc, 'p', '', preserveText));
        container.appendChild(preservation);
        const removalItems = (view.removals || []).filter(item => (item.ids || []).length);
        if (removalItems.length) {
            const removals = element(doc, 'ul', 'context-deletion-impact-list correction-impact-tiles');
            removals.setAttribute('aria-label', 'Registros que serão excluídos');
            for (const item of removalItems) {
                const row = element(doc, 'li', 'correction-impact-tile');
                row.append(element(doc, 'strong', 'correction-impact-count', String(item.ids.length)),
                    element(doc, 'span', 'correction-impact-name', text(item.label).replace(/^\d+\s+/, '')));
                removals.appendChild(row);
            }
            container.appendChild(removals);
        }
        if (changes.length) {
            const list = element(doc, 'div', 'correction-before-after-list');
            for (const change of changes) {
                const field = text(change.field);
                const fieldLabel = FIELD_LABELS[field] || (field.startsWith('analysis.')
                    ? 'Análise técnica — ' + (context.documentLabel || 'Documento da Pendência') : null);
                if (!fieldLabel) continue;
                const row = element(doc, 'section', 'correction-before-after');
                row.dataset.correctionChange = field;
                const statusLabels = { pendency_attempts: 'Situação do envio', pendencies: 'Situação da Pendência', assets: 'Situação do bem' };
                const label = field === 'status' ? (statusLabels[change.entity] || 'Situação do registro')
                    : field === 'observation' && operation.kind === 'review' ? 'Observação da reanálise' : fieldLabel;
                row.appendChild(element(doc, 'h4', 'correction-panel-heading', label));
                for (const [side, name] of [['before', 'Antes'], ['after', 'Depois']]) {
                    const cell = element(doc, 'div', `correction-value is-${side}`);
                    cell.append(element(doc, 'span', 'correction-value-label', name),
                        element(doc, 'p', '', humanValue(field, change[side], context)));
                    row.appendChild(cell);
                }
                list.appendChild(row);
            }
            if (list.children.length) container.appendChild(list);
        } else if (!operation.deleting) {
            container.appendChild(element(doc, 'p', '', 'Altere os campos necessários e confira a prévia antes de confirmar.'));
        }
        for (const warning of [...(view.warnings || []), ...(view.blockers || [])]) {
            const notice = element(doc, 'p', 'correction-plan-notice', text(warning.message) || 'Confira o alcance desta correção antes de continuar.');
            notice.dataset.level = (view.blockers || []).includes(warning) ? 'blocker' : 'warning';
            container.appendChild(notice);
        }
        const alternativeLabels = {
            delete_pendency: 'Conferir exclusão da Pendência e do histórico vinculado',
            clear_item_history: 'Conferir exclusão da análise e das Pendências vinculadas',
            delete_invoice: 'Conferir exclusão da nota fiscal e dos registros vinculados',
            correct_inventory: 'Corrigir registro patrimonial'
        };
        for (const alternative of view.alternatives || []) {
            if (!alternativeLabels[alternative.action] || typeof alternatives.openAlternative !== 'function') continue;
            const option = element(doc, 'button', 'btn btn-secondary', alternativeLabels[alternative.action]);
            option.type = 'button';
            option.dataset.operationalCorrectionAlt = alternative.action;
            option.addEventListener('click', () => alternatives.openAlternative(alternative));
            container.appendChild(option);
        }
        container.appendChild(element(doc, 'p', 'correction-next-step', operation.kind === 'asset'
            ? 'Depois da confirmação, confira a situação do bem no Inventário. Os atos externos devem ser tratados no sistema correspondente.'
            : operation.kind === 'contact'
                ? 'Depois da confirmação, confira o contato no histórico da escola. A providência documental continua na Pendência.'
                : 'Depois da confirmação, siga a próxima ação indicada na Pendência. A prévia informa qual envio continua válido.'));
    }
    return {
        OPERATIONS, FIELD_LABELS, RESULT_LABELS, canUse, effectiveCapability,
        recordValues, describeRecord, recordAuthor, createFields, readChanges, setDisabled, validate,
        explanation, humanValue, renderPreview, own
    };
}));
