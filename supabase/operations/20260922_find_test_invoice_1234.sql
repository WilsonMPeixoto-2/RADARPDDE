select
  i.id,
  i.school_id,
  i.competence_id,
  i.program_id,
  i.verification_id,
  i.expense_type,
  i.invoice_number,
  i.description,
  i.amount,
  i.linked_asset_id,
  i.row_version,
  i.payload,
  (select count(*) from public.pendencies p where p.registered_invoice_id=i.id) as pendencias_vinculadas
from public.registered_invoices i
where i.id='nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd';

select
  count(*) as similar_count
from public.registered_invoices i
where lower(i.invoice_number) like '%1234%teste%'
   or lower(i.description) like '%limpeza%caixa%';
