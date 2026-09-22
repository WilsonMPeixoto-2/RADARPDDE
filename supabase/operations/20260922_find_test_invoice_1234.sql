-- Consulta somente leitura do histórico vinculado à NF de teste identificada em Production.
select
    p.id as pendency_id,
    p.registered_invoice_id,
    p.document_key,
    p.status,
    p.reason,
    p.notes,
    p.opened_at,
    p.resolved_at,
    p.canceled_at,
    p.row_version,
    (
      select count(*)
      from public.pendency_attempts a
      where a.pendency_id = p.id
    ) as tentativas,
    (
      select count(*)
      from public.pendency_contacts c
      where c.pendency_id = p.id
    ) as contatos
from public.pendencies p
where p.registered_invoice_id = 'nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd'
order by p.opened_at;
