(function installRadarQualityProvisional(root) {
  'use strict';
  const PROGRAMS = new Set(['CONECTADA','PROEC','ED_FAMILIA','ADOLESCENCIAS','LEITURA','TEMPO_APRENDER']);
  const TABLE = 'quality_provisional_movements';
  let context = null, records = [], generation = 0, saving = false;
  const doc = root.document;
  const byId = id => doc.getElementById(id);
  const node = (tag, cls, value) => {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (value !== undefined) e.textContent = value;
    return e;
  };
  const client = () => root.RadarApplicationServices?.data?.repository?.capabilities?.().remote === true
    ? root.RadarSessionContext?.service?.client : null;
  const problem = error => error?.message || 'Não foi possível realizar a operação.';
  function announce(message) {
    const target = byId('quality-provisional-feedback');
    if (target) target.textContent = message;
  }
  function editor() {
    let dialog = byId('quality-provisional-dialog');
    if (dialog) return dialog;
    dialog = node('dialog', 'quality-provisional-dialog');
    dialog.id = 'quality-provisional-dialog';
    dialog.setAttribute('aria-labelledby','quality-provisional-dialog-title');
    dialog.innerHTML = [
      '<form id="quality-provisional-form">',
      '<header><h2 id="quality-provisional-dialog-title">Registrar saída sem programa definido</h2>',
      '<p>Conta PDDE Qualidade. Preencha somente os dados disponíveis.</p></header>',
      '<input type="hidden" id="quality-provisional-id">',
      '<div class="quality-provisional-form-grid">',
      '<label>Data do débito (opcional)<input id="quality-provisional-date" class="form-control" type="date"></label>',
      '<label>Valor em R$ (opcional)<input id="quality-provisional-amount" class="form-control" type="number" step="0.01" min="0"></label>',
      '<label>Referência (opcional)<input id="quality-provisional-reference" class="form-control" maxlength="250"></label>',
      '<label>Descrição (opcional)<input id="quality-provisional-description" class="form-control" maxlength="2000"></label>',
      '</div>',
      '<label>Observação (opcional)<textarea class="form-control" id="quality-provisional-observation" rows="3" maxlength="2000"></textarea></label>',
      '<p id="quality-provisional-message" role="status" aria-live="polite"></p>',
      '<footer><button type="button" class="btn btn-secondary" id="quality-provisional-cancel">Cancelar</button>',
      '<button type="submit" class="btn btn-primary" id="quality-provisional-submit">Salvar movimentação</button></footer>',
      '</form>'
    ].join('');
    byId('quality-provisional-dialog');
    dialog.querySelector('form').addEventListener('submit', save);
    dialog.querySelector('#quality-provisional-cancel').addEventListener('click', () => {
      if (!saving) dialog.close();
    });
    doc.body.appendChild(dialog);
    return dialog;
  }
  function openEditor(record) {
    if (!context || !client()) return;
    const dialog = editor();
    byId('quality-provisional-dialog-title').textContent = record
      ? 'Editar movimentação provisória' : 'Registrar saída sem programa definido';
    for (const [id, value] of Object.entries({
      'quality-provisional-id': record?.id || '',
      'quality-provisional-date': record?.debit_date || '',
      'quality-provisional-amount': record?.amount ?? '',
      'quality-provisional-reference': record?.document_reference || '',
      'quality-provisional-description': record?.description || '',
      'quality-provisional-observation': record?.observation || ''
    })) byId(id).value = value;
    byId('quality-provisional-message').textContent = '';
    dialog.showModal();
  }
  async function save(event) {
    event.preventDefault();
    if (saving || !context || !client()) return;
    const id = byId('quality-provisional-id').value;
    const previous = records.find(item => item.id === id);
    const number = byId('quality-provisional-amount').value;
    const values = {
      debit_date: byId('quality-provisional-date').value || null,
      amount: number === '' ? null : Number(number),
      description: byId('quality-provisional-description').value.trim() || null,
      document_reference: byId('quality-provisional-reference').value.trim() || null,
      observation: byId('quality-provisional-observation').value.trim() || null
    };
    if (number !== '' && (!Number.isFinite(values.amount) || values.amount < 0)) {
      byId('quality-provisional-message').textContent = 'Valor inválido.';
      return;
    }
    saving = true;
    byId('quality-provisional-submit').disabled = true;
    byId('quality-provisional-message').textContent = 'Salvando…';
    try {
      let query;
      if (!id) query = client().from(TABLE).insert({
        ...values, school_id: context.schoolId, competence_id: context.competence
      });
      else {
        if (previous?.status !== 'open') throw new Error('Registro indisponível para edição.');
        query = client().from(TABLE).update(values).eq('id', id)
          .eq('row_version',previous.row_version).eq('status','open');
      }
      const { data, error } = await query.select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Registro alterado em outra sessão. Atualize para continuar.');
      byId('quality-provisional-dialog').close();
      await hydrate(context);
    } catch (error) {
      byId('quality-provisional-message').textContent = problem(error);
    } finally {
      saving = false;
      byId('quality-provisional-submit').disabled = false;
    }
  }
  async function remove(record) {
    if (!context || record.status !== 'open' || !client()) return;
    if (!root.confirm('Excluir esta movimentação provisória? Nenhuma Nota Fiscal será excluída.')) return;
    try {
      const { data, error } = await client().from(TABLE).delete()
        .eq('id',record.id).eq('row_version',record.row_version)
        .eq('status','open').select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Registro atualizado em outra sessão.');
      await hydrate(context);
    } catch (error) { announce(problem(error)); }
  }
  function identify(record, programId) {
    if (!context || record.status !== 'open' || !PROGRAMS.has(programId)
      || !context.programs.some(p => p.id === programId)) return;
    if (typeof root.openModalDadosNota !== 'function') {
      announce('Formulário fiscal indisponível.');
      return;
    }
    if (root.openModalDadosNota(context.schoolId, context.competence + '_' + programId) === false) return;
    byId('nota-quality-provisional-id').value = record.id;
    byId('nota-quality-provisional-version').value = record.row_version;
    byId('nota-desc').value = record.description || '';
    byId('nota-numero').value = record.document_reference || '';
    byId('nota-valor').value = record.amount ?? '';
    byId('nota-modal-intro').textContent =
      'Identifique a despesa. Ao salvar, a movimentação provisória será vinculada na mesma transação.';
  }
  function render(panel) {
    const list = panel.querySelector('[data-quality-list]');
    list.replaceChildren();
    if (!records.length) {
      list.append(node('p','quality-provisional-empty','Nenhuma movimentação provisória nesta competência.'));
      return;
    }
    const money = amount => amount == null ? 'Valor não informado'
      : new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL' }).format(amount);
    for (const record of records) {
      const card = node('article','quality-provisional-item');
      const heading = node('div','quality-provisional-item-title');
      heading.append(
        node('strong','',record.description || 'Saída sem descrição'),
        node('span','quality-provisional-status',record.status === 'identified' ? 'Identificada' : 'Programa a identificar')
      );
      card.append(heading);
      const details = [
        money(record.amount),
        record.debit_date ? new Date(record.debit_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada',
        record.document_reference ? 'Referência: ' + record.document_reference : null
      ].filter(Boolean);
      card.append(node('p','quality-provisional-details',details.join(' · ')));
      if (record.observation) card.append(node('p','quality-provisional-observation',record.observation));
      const actions = node('div','quality-provisional-actions');
      if (record.status === 'open') {
        const selection = node('label','','Ação Integrada');
        const dropdown = node('select','form-control');
        dropdown.setAttribute('aria-label','Selecionar programa para identificar a movimentação');
        dropdown.append(new Option('Selecione', ''));
        context.programs.forEach(p => dropdown.append(new Option(p.name,p.id)));
        selection.append(dropdown);
        const identifyButton = node('button','btn btn-primary btn-sm','Identificar despesa');
        identifyButton.type = 'button';
        identifyButton.addEventListener('click', () => {
          if (!dropdown.value) { dropdown.focus(); announce('Selecione a Ação Integrada.'); return; }
          identify(record,dropdown.value);
        });
        const editButton = node('button','btn btn-secondary btn-sm','Editar');
        editButton.type = 'button';
        editButton.addEventListener('click', () => openEditor(record));
        const deleteButton = node('button','btn btn-secondary btn-sm','Excluir');
        deleteButton.type = 'button';
        deleteButton.addEventListener('click', () => remove(record));
        actions.append(selection,identifyButton,editButton,deleteButton);
      } else actions.append(node('span','quality-provisional-linked','Despesa identificada no Prontuário.'));
      card.append(actions);
      list.append(card);
    }
  }
  async function hydrate(input = {}) {
    const panel = byId('quality-provisional-panel');
    if (!panel || !input.schoolId || !input.competence) return;
    const programs = (input.programs || []).filter(p => PROGRAMS.has(p.id));
    if (!programs.length || !input.canEdit) { panel.hidden = true; return; }
    panel.hidden = false;
    context = { schoolId: input.schoolId, competence: input.competence, programs, canEdit: true };
    const id = ++generation;
    panel.querySelector('[data-quality-new]').onclick = () => openEditor(null);
    const list = panel.querySelector('[data-quality-list]');
    if (!client()) {
      list.textContent = 'Disponível quando o RADAR estiver conectado ao Supabase.';
      return;
    }
    list.textContent = 'Consultando movimentações…';
    try {
      const { data, error } = await client().from(TABLE)
        .select('id,school_id,competence_id,debit_date,amount,description,document_reference,observation,status,registered_invoice_id,row_version,created_at')
        .eq('school_id',input.schoolId).eq('competence_id',input.competence)
        .order('created_at',{ ascending:false }).limit(200);
      if (error) throw error;
      if (id !== generation || !panel.isConnected) return;
      records = data || [];
      render(panel);
    } catch (error) {
      if (id === generation) list.textContent = 'Erro ao consultar registros: ' + problem(error);
    }
  }
  root.RadarQualityProvisional = Object.freeze({ hydrate });
})(window);
