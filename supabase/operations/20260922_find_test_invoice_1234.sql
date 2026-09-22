-- Limpeza autorizada do lançamento de teste em Production.
-- Fail-closed: qualquer divergência de identidade, contexto, versão ou histórico aborta a transação.
begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select up.user_id::text
    from public.user_profiles up
    where up.profile_id = 'technical_admin'
      and up.active = true
    order by up.created_at
    limit 1
  ),
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('request.jwt.claim.sub', true),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  v_invoice public.registered_invoices%rowtype;
  v_pendency public.pendencies%rowtype;
  v_verification public.verifications%rowtype;
  v_after public.verifications%rowtype;
  v_result jsonb;
begin
  if public.current_app_role() <> 'technical_admin'
     or not public.can_write_school('04.10.001') then
    raise exception 'AUTHORIZATION_PRECHECK_FAILED';
  end if;

  select * into v_invoice
  from public.registered_invoices
  where id = 'nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd'
  for update;

  if not found
     or v_invoice.school_id <> '04.10.001'
     or v_invoice.competence_id <> '2026-09'
     or v_invoice.program_id <> 'BASIC'
     or v_invoice.expense_type <> 'servico'
     or v_invoice.invoice_number <> 'NF 1234 teste'
     or v_invoice.description <> 'Nota fiscal de limpeza de caixa d''agua'
     or v_invoice.amount <> 190.00
     or v_invoice.linked_asset_id is not null
     or v_invoice.row_version <> 2 then
    raise exception 'INVOICE_GUARD_FAILED';
  end if;

  if (select count(*) from public.registered_invoices
      where school_id='04.10.001' and competence_id='2026-09' and program_id='BASIC') <> 1 then
    raise exception 'CONTEXT_INVOICE_COUNT_CHANGED';
  end if;

  select * into v_pendency
  from public.pendencies
  where id = 'pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde'
  for update;

  if not found
     or v_pendency.registered_invoice_id <> v_invoice.id
     or v_pendency.document_key <> 'notaFiscal'
     or v_pendency.status <> 'Aguardando reanálise'
     or v_pendency.reason <> 'Documento ausente'
     or v_pendency.row_version <> 3 then
    raise exception 'PENDENCY_GUARD_FAILED';
  end if;

  if (select count(*) from public.pendencies where registered_invoice_id=v_invoice.id) <> 1
     or (select count(*) from public.pendency_attempts where pendency_id=v_pendency.id) <> 1
     or (select count(*) from public.pendency_contacts where pendency_id=v_pendency.id) <> 0 then
    raise exception 'PENDENCY_HISTORY_GUARD_FAILED';
  end if;

  select * into v_verification
  from public.verifications
  where id = '04.10.001::2026-09::BASIC'
  for update;

  if not found or v_verification.row_version <> 3 then
    raise exception 'VERIFICATION_GUARD_FAILED';
  end if;

  delete from public.pendencies
  where id = v_pendency.id and row_version = v_pendency.row_version;

  if not found then
    raise exception 'PENDENCY_DELETE_FAILED';
  end if;

  v_result := public.delete_invoice_with_effects(
    p_invoice_id => v_invoice.id,
    p_expected_invoice_version => v_invoice.row_version,
    p_delete_linked_asset => true,
    p_expected_asset_version => null,
    p_verification_patch => jsonb_build_object(
      'analysis',
        coalesce(v_verification.analysis, '{}'::jsonb)
          || jsonb_build_object(
               'consAssessoria', 'Correto',
               'notaFiscal', 'Não analisado'
             ),
      'bonification',
        coalesce(v_verification.bonification, '{}'::jsonb)
          || jsonb_build_object(
               'consAssessoria', 'Não se aplica',
               'consEnviada', false
             )
    ),
    p_expected_verification_version => v_verification.row_version,
    p_administrative_log => jsonb_build_object(
      'id', 'log-cleanup-test-invoice-1234-20260922',
      'user_identifier', 'Operação técnica autorizada pelo usuário',
      'profile_name', 'technical_admin',
      'action', 'Lançamento de Teste Removido',
      'details', jsonb_build_object(
        'invoiceId', v_invoice.id,
        'pendencyId', v_pendency.id,
        'invoiceNumber', v_invoice.invoice_number,
        'amount', v_invoice.amount,
        'reason', 'Limpeza do lançamento de teste solicitado pelo usuário'
      ),
      'event_at', now()
    )
  );

  if coalesce(v_result ->> 'deleted_invoice_id', '') <> v_invoice.id then
    raise exception 'RPC_RESULT_MISMATCH: %', v_result;
  end if;

  if exists(select 1 from public.registered_invoices where id=v_invoice.id)
     or exists(select 1 from public.pendencies where id=v_pendency.id)
     or exists(select 1 from public.pendency_attempts where pendency_id=v_pendency.id) then
    raise exception 'POST_DELETE_RESIDUE';
  end if;

  select * into v_after
  from public.verifications
  where id = v_verification.id;

  if v_after.bonification ->> 'consAssessoria' <> 'Não se aplica'
     or coalesce((v_after.bonification ->> 'consEnviada')::boolean, true) <> false
     or v_after.analysis ->> 'consAssessoria' <> 'Correto'
     or v_after.analysis ->> 'notaFiscal' <> 'Não analisado' then
    raise exception 'VERIFICATION_PROJECTION_MISMATCH';
  end if;
end
$$;

commit;

select
  (select count(*) from public.registered_invoices where id='nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd') as invoice_remaining,
  (select count(*) from public.pendencies where id='pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde') as pendency_remaining,
  (select count(*) from public.pendency_attempts where pendency_id='pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde') as attempts_remaining,
  (select count(*) from public.administrative_logs where id='log-cleanup-test-invoice-1234-20260922') as cleanup_log_count,
  (select row_version from public.verifications where id='04.10.001::2026-09::BASIC') as verification_row_version,
  (select analysis ->> 'consAssessoria' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_analysis,
  (select bonification ->> 'consAssessoria' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_bonification,
  (select bonification ->> 'consEnviada' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_sent;
