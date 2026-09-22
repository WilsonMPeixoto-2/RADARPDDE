select
  (select count(*) from public.registered_invoices where id='nota-8f25ad3a-da84-4867-a1cf-e2acbfbd2fdd') as invoice_by_id,
  (select count(*) from public.registered_invoices
     where lower(invoice_number) like '%1234%teste%'
        or lower(description) like '%limpeza%caixa%') as similar_invoices,
  (select count(*) from public.pendencies where id='pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde') as pendency_by_id,
  (select count(*) from public.pendency_attempts where pendency_id='pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde') as attempts_by_pendency,
  (select count(*) from public.pendency_contacts where pendency_id='pend-4c35085f-3b5a-4077-bc23-bf5ceecfafde') as contacts_by_pendency,
  (select count(*) from public.administrative_logs where id='log-cleanup-test-invoice-1234-20260922') as cleanup_log_count,
  (select row_version from public.verifications where id='04.10.001::2026-09::BASIC') as verification_row_version,
  (select analysis ->> 'notaFiscal' from public.verifications where id='04.10.001::2026-09::BASIC') as nota_fiscal_analysis,
  (select analysis ->> 'consAssessoria' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_analysis,
  (select bonification ->> 'notaFiscal' from public.verifications where id='04.10.001::2026-09::BASIC') as nota_fiscal_bonification,
  (select bonification ->> 'consAssessoria' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_bonification,
  (select bonification ->> 'consEnviada' from public.verifications where id='04.10.001::2026-09::BASIC') as assessoria_sent;
