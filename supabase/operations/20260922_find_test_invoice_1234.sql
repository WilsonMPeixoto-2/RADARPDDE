with target as (
  select i.*
  from public.registered_invoices i
  where i.id = 'nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd'
    and i.school_id = '04.10.001'
    and i.competence_id = '2026-09'
    and i.program_id = 'BASIC'
    and i.invoice_number = 'NF 1234 teste'
    and i.description = 'Nota fiscal de limpeza de caixa d''agua'
    and i.amount = 190.00
)
select
  t.id as invoice_id,
  t.row_version as invoice_row_version,
  p.id as pendency_id,
  p.document_key,
  p.status,
  p.reason,
  p.notes,
  p.opened_at,
  p.row_version as pendency_row_version,
  (select count(*) from public.pendency_attempts a where a.pendency_id = p.id) as attempts,
  (select count(*) from public.pendency_contacts c where c.pendency_id = p.id) as contacts,
  p.payload
from target t
join public.pendencies p on p.registered_invoice_id = t.id;
