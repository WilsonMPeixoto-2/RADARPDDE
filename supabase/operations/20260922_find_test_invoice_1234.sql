-- Consulta somente leitura para localizar a NF de teste mostrada pelo usuário.
\pset pager off

select
    i.id,
    i.school_id,
    s.designation,
    s.denomination,
    i.competence_id,
    i.program_id,
    i.verification_id,
    i.expense_type,
    i.invoice_number,
    i.description,
    i.amount,
    i.linked_asset_id,
    i.row_version,
    coalesce(i.payload ->> 'consultaAssessoriaEnviada', '') as assessoria_enviada,
    coalesce(i.payload ->> 'analiseConsultaAssessoria', '') as assessoria_analise,
    coalesce(i.payload ->> 'analiseDocumentoFiscal', '') as documento_analise,
    (
      select count(*)
      from public.pendencies p
      where p.registered_invoice_id = i.id
    ) as pendencias_vinculadas
from public.registered_invoices i
join public.schools s on s.id = i.school_id
where lower(btrim(i.invoice_number)) = lower('1234 teste')
  and lower(i.description) like '%limpeza de caixa%'
order by i.created_at desc;

select count(*) as candidatos
from public.registered_invoices i
where lower(btrim(i.invoice_number)) = lower('1234 teste')
  and lower(i.description) like '%limpeza de caixa%';
