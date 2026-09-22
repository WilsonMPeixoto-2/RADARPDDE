-- Consulta somente leitura do contexto mensal da NF de teste.
select
    v.id as verification_id,
    v.row_version as verification_row_version,
    v.bonus_result,
    v.analysis,
    v.bonification,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id,
        'expense_type', i.expense_type,
        'invoice_number', i.invoice_number,
        'description', i.description,
        'row_version', i.row_version,
        'analiseDocumentoFiscal', coalesce(i.payload ->> 'analiseDocumentoFiscal', ''),
        'consultaAssessoriaEnviada', coalesce(i.payload ->> 'consultaAssessoriaEnviada', ''),
        'analiseConsultaAssessoria', coalesce(i.payload ->> 'analiseConsultaAssessoria', '')
      ) order by i.created_at), '[]'::jsonb)
      from public.registered_invoices i
      where i.school_id = '04.10.001'
        and i.competence_id = '2026-09'
        and i.program_id = 'BASIC'
    ) as invoices_contexto
from public.verifications v
where v.id = '04.10.001::2026-09::BASIC';
