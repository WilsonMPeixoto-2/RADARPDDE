-- Research only: one aggregate SELECT, no writes, no school/person identifiers.
-- Run with an explicitly authorized read-only connection. This file is not
-- imported by the application or executed by the prototype.
-- Values describe records in RADAR, not the complete financial execution.
with invoice_types as (
  select expense_type, count(*) as records, count(distinct school_id) as schools,
    coalesce(sum(amount),0) as recorded_amount,
    count(*) filter(where amount is null) as missing_amount,
    count(*) filter(where amount <= 0) as nonpositive_amount
  from public.registered_invoices group by expense_type
), monthly_invoices as (
  select competence_id, count(*) as records, count(distinct school_id) as schools,
    coalesce(sum(amount),0) as recorded_amount,
    count(*) filter(where expense_type='a_identificar') as unidentified,
    coalesce(sum(amount) filter(where expense_type='a_identificar'),0) as unidentified_amount
  from public.registered_invoices group by competence_id
), monthly_verifications as (
  select competence_id, count(*) as existing_contexts, count(distinct school_id) as schools,
    count(*) filter(where bonus_result is not null) as consolidated,
    count(*) filter(where bonus_result='apta') as apta,
    count(*) filter(where bonus_result='inapta') as inapta
  from public.verifications group by competence_id
), program_coverage as (
  select program_id,count(distinct school_id) as schools
  from public.registered_invoices group by program_id
), program_invoices as (
  select case when c.schools>=5 then p.name else 'Demais programas (agrupados)' end as program,
    count(*) as records,count(distinct i.school_id) as schools,sum(i.amount) as recorded_amount,
    coalesce(sum(i.amount) filter(where i.expense_type='a_identificar'),0) as unidentified_amount
  from public.registered_invoices i join program_coverage c using(program_id)
  left join public.programs p on p.id=i.program_id group by 1
), backlog_documents as (
  select document_key, count(*) filter(where status in ('Aberta','Aguardando reanálise')) as active,
    count(*) filter(where status='Aguardando reanálise') as awaiting,
    count(*) filter(where status='Resolvida') as resolved
  from public.pendencies group by document_key
), duplicate_candidates as (
  -- A screening signal only: no supplier/series key exists in the typed fields.
  select count(*) as records from public.registered_invoices
  where expense_type<>'a_identificar' and nullif(btrim(invoice_number),'') is not null
  group by school_id,competence_id,program_id,upper(btrim(invoice_number)),amount
  having count(*)>1
)
select jsonb_build_object(
  'observedAt',now(),
  'scope','Aggregated records in RADAR; not a compliance or budget-execution rate',
  'schools',(select jsonb_build_object(
    'total',count(*),'active',count(*) filter(where active),
    'withAnyVerification',count(*) filter(where exists(select 1 from public.verifications v where v.school_id=s.id)),
    'withAnyInvoice',count(*) filter(where exists(select 1 from public.registered_invoices i where i.school_id=s.id))
  ) from public.schools s),
  'invoiceTypes',(select jsonb_agg(to_jsonb(x) order by recorded_amount desc) from invoice_types x),
  'monthlyInvoices',(select jsonb_agg(to_jsonb(x) order by competence_id) from monthly_invoices x),
  'programInvoices',(select jsonb_agg(to_jsonb(x) order by recorded_amount desc) from program_invoices x),
  'monthlyVerifications',(select jsonb_agg(to_jsonb(x) order by competence_id) from monthly_verifications x),
  'invoiceAnalysis',(select jsonb_object_agg(state,records) from (
    select coalesce(nullif(payload->>'analiseDocumentoFiscal',''),'sem_campo_individual') as state,count(*) as records
    from public.registered_invoices group by 1
  ) x),
  'advisorySent',(select jsonb_object_agg(state,records) from (
    select coalesce(payload->>'consultaAssessoriaEnviada','sem_campo') as state,count(*) as records
    from public.registered_invoices where expense_type='servico' group by 1
  ) x),
  'advisoryAnalysis',(select jsonb_object_agg(state,records) from (
    select coalesce(nullif(payload->>'analiseConsultaAssessoria',''),'sem_campo_individual') as state,count(*) as records
    from public.registered_invoices where expense_type='servico' group by 1
  ) x),
  'sourceFieldCoverage',(select jsonb_build_object(
    'total',count(*),
    'documentSourcePresent',count(*) filter(where payload ? 'documentoFonte' and payload->'documentoFonte' not in ('null'::jsonb,'""'::jsonb)),
    'statementSourcePresent',count(*) filter(where payload ? 'extratoFonte' and payload->'extratoFonte' not in ('null'::jsonb,'""'::jsonb)),
    'invoiceDatePresent',count(*) filter(where nullif(payload->>'dataEmissao','') is not null),
    'paymentDatePresent',count(*) filter(where nullif(payload->>'dataPagamento','') is not null)
  ) from public.registered_invoices),
  'pendencyStatuses',(select jsonb_object_agg(status,records) from (
    select status,count(*) as records from public.pendencies group by status
  ) x),
  'activeActors',(select jsonb_object_agg(coalesce(next_actor,'sem_ator'),records) from (
    select next_actor,count(*) as records from public.pendencies
    where status in ('Aberta','Aguardando reanálise') group by next_actor
  ) x),
  'backlogDocuments',(select jsonb_agg(to_jsonb(x) order by active desc) from backlog_documents x),
  'backlogAge',(select jsonb_build_object(
    'total',count(*),'schools',count(distinct school_id),
    'missingOpenedAt',count(*) filter(where opened_at is null),
    'futureOpenedAt',count(*) filter(where opened_at>now()),
    'medianDays',round((percentile_cont(.5) within group(order by extract(epoch from(now()-opened_at))/86400)
      filter(where opened_at<=now()))::numeric,2),
    'p90Days',round((percentile_cont(.9) within group(order by extract(epoch from(now()-opened_at))/86400)
      filter(where opened_at<=now()))::numeric,2),
    'over90Days',count(*) filter(where opened_at<now()-interval '90 days')
  ) from public.pendencies where status in ('Aberta','Aguardando reanálise')),
  'attemptTiming',(select jsonb_build_object(
    'total',count(*),'pendenciesWithAttempts',count(distinct pendency_id),
    'withSourceUrl',count(*) filter(where nullif(btrim(drive_url),'') is not null),
    'withAvailableAt',count(*) filter(where available_at is not null),
    'analyzed',count(*) filter(where analyzed_at is not null),
    'unanalyzed',count(*) filter(where analyzed_at is null),
    'negativeLag',count(*) filter(where analyzed_at<submitted_at),
    'underOneMinute',count(*) filter(where analyzed_at>=submitted_at and analyzed_at-submitted_at<interval '1 minute'),
    'sameLocalDay',count(*) filter(where analyzed_at>=submitted_at and
      (analyzed_at at time zone 'America/Sao_Paulo')::date=(submitted_at at time zone 'America/Sao_Paulo')::date),
    'medianDays',round((percentile_cont(.5) within group(order by extract(epoch from(analyzed_at-submitted_at))/86400)
      filter(where analyzed_at>=submitted_at))::numeric,2),
    'p90Days',round((percentile_cont(.9) within group(order by extract(epoch from(analyzed_at-submitted_at))/86400)
      filter(where analyzed_at>=submitted_at))::numeric,2)
  ) from public.pendency_attempts),
  'resolutionTiming',(select jsonb_build_object(
    'total',count(*),'validIntervals',count(*) filter(where resolved_at>=opened_at),
    'resolvedBeforeOpened',count(*) filter(where resolved_at<opened_at),
    'medianDays',round((percentile_cont(.5) within group(order by extract(epoch from(resolved_at-opened_at))/86400)
      filter(where resolved_at>=opened_at))::numeric,2)
  ) from public.pendencies where status='Resolvida'),
  'assetPipeline',(select jsonb_object_agg(status,records) from (
    select status,count(*) as records from public.assets group by status
  ) x),
  'qualityProvisional',(select jsonb_agg(to_jsonb(x)) from (
    select status,count(*) as records,coalesce(sum(amount),0) as amount,
      count(*) filter(where amount is null) as missing_amount
    from public.quality_provisional_movements group by status
  ) x),
  'possibleDuplicateGroups',(select jsonb_build_object('groups',count(*),'records',coalesce(sum(records),0)) from duplicate_candidates),
  'unidentifiedWithoutActivePendency',(select jsonb_build_object(
    'total',count(*),
    'withoutAnyLinkedPendency',count(*) filter(where not exists(select 1 from public.pendencies p where p.registered_invoice_id=i.id)),
    'withoutIndividualAnalysis',count(*) filter(where not (payload ? 'analiseDocumentoFiscal')),
    'createdBeforeSeptember2026',count(*) filter(where created_at<'2026-09-01'::timestamptz)
  ) from public.registered_invoices i where expense_type='a_identificar' and not exists(
    select 1 from public.pendencies p where p.registered_invoice_id=i.id and p.status in ('Aberta','Aguardando reanálise')
  ))
) as indicators;
