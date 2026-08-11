-- Individualiza, no payload de cada NF de serviço, o envio e a análise da
-- consulta à Assessoria Contábil. Os campos agregados da verificação mensal
-- permanecem apenas como projeção de compatibilidade para painéis e exportações.
--
-- Regra de transição:
-- - uma única NF de serviço no contexto: o estado agregado anterior é 1:1 e
--   pode ser preservado;
-- - duas ou mais NFs de serviço no contexto: o estado agregado anterior é
--   ambíguo e NÃO é replicado. Cada NF volta para envio não confirmado e
--   análise "Não analisado";
-- - estados individuais já válidos são preservados para tornar a migration
--   idempotente e não apagar avaliações feitas após a correção.

with service_invoice_context as (
    select
        invoice.id,
        invoice.payload,
        verification.bonification,
        verification.analysis,
        count(*) over (
            partition by coalesce(
                invoice.verification_id,
                concat_ws(
                    '::',
                    invoice.school_id,
                    invoice.competence_id,
                    invoice.program_id,
                    invoice.source_context_key
                )
            )
        ) as service_invoice_count
    from public.registered_invoices invoice
    left join public.verifications verification
        on verification.id = invoice.verification_id
        or (
            invoice.verification_id is null
            and verification.school_id = invoice.school_id
            and verification.competence_id = invoice.competence_id
            and verification.program_id = invoice.program_id
        )
    where invoice.expense_type = 'servico'
), normalized_service_invoice as (
    select
        context.id,
        case
            when jsonb_typeof(context.payload -> 'consultaAssessoriaEnviada') = 'boolean'
                then (context.payload ->> 'consultaAssessoriaEnviada')::boolean
            when context.service_invoice_count = 1
                and jsonb_typeof(context.bonification -> 'consEnviada') = 'boolean'
                then (context.bonification ->> 'consEnviada')::boolean
            when context.service_invoice_count = 1
                and context.bonification ->> 'consAssessoria' = 'Sim'
                then true
            else false
        end as advisory_sent,
        case
            when context.payload ->> 'analiseConsultaAssessoria' = 'Correto após o prazo'
                then 'Correto (Atrasado)'
            when context.payload ->> 'analiseConsultaAssessoria' in (
                'Não analisado',
                'Correto',
                'Correto (Atrasado)',
                'Incorreto'
            ) then context.payload ->> 'analiseConsultaAssessoria'
            when context.service_invoice_count = 1
                and context.analysis ->> 'consAssessoria' = 'Correto após o prazo'
                then 'Correto (Atrasado)'
            when context.service_invoice_count = 1
                and context.analysis ->> 'consAssessoria' in (
                    'Não analisado',
                    'Correto',
                    'Correto (Atrasado)',
                    'Incorreto'
                ) then context.analysis ->> 'consAssessoria'
            else 'Não analisado'
        end as advisory_analysis
    from service_invoice_context context
)
update public.registered_invoices invoice
set payload = jsonb_set(
    jsonb_set(
        coalesce(invoice.payload, '{}'::jsonb),
        '{consultaAssessoriaEnviada}',
        to_jsonb(normalized.advisory_sent),
        true
    ),
    '{analiseConsultaAssessoria}',
    to_jsonb(normalized.advisory_analysis),
    true
)
from normalized_service_invoice normalized
where invoice.id = normalized.id
  and (
      invoice.payload -> 'consultaAssessoriaEnviada'
          is distinct from to_jsonb(normalized.advisory_sent)
      or invoice.payload -> 'analiseConsultaAssessoria'
          is distinct from to_jsonb(normalized.advisory_analysis)
  );

with service_advisory_state as (
    select
        verification.id as verification_id,
        coalesce(
            (invoice.payload ->> 'consultaAssessoriaEnviada')::boolean,
            false
        ) as advisory_sent,
        coalesce(
            nullif(invoice.payload ->> 'analiseConsultaAssessoria', ''),
            'Não analisado'
        ) as advisory_analysis
    from public.registered_invoices invoice
    join public.verifications verification
        on verification.id = invoice.verification_id
        or (
            invoice.verification_id is null
            and verification.school_id = invoice.school_id
            and verification.competence_id = invoice.competence_id
            and verification.program_id = invoice.program_id
        )
    where invoice.expense_type = 'servico'
), service_advisory_aggregate as (
    select
        verification_id,
        bool_and(advisory_sent) as all_advisories_sent,
        case
            when bool_or(advisory_analysis = 'Incorreto') then 'Incorreto'
            when bool_or(advisory_analysis = 'Não analisado') then 'Não analisado'
            when bool_or(advisory_analysis = 'Correto (Atrasado)') then 'Correto (Atrasado)'
            else 'Correto'
        end as aggregate_analysis
    from service_advisory_state
    group by verification_id
)
update public.verifications verification
set
    bonification = jsonb_set(
        jsonb_set(
            coalesce(verification.bonification, '{}'::jsonb),
            '{consAssessoria}',
            to_jsonb(
                case
                    when aggregate.all_advisories_sent then 'Sim'::text
                    else 'Não'::text
                end
            ),
            true
        ),
        '{consEnviada}',
        to_jsonb(aggregate.all_advisories_sent),
        true
    ),
    analysis = jsonb_set(
        coalesce(verification.analysis, '{}'::jsonb),
        '{consAssessoria}',
        to_jsonb(aggregate.aggregate_analysis),
        true
    )
from service_advisory_aggregate aggregate
where verification.id = aggregate.verification_id
  and (
      verification.bonification ->> 'consAssessoria'
          is distinct from case
              when aggregate.all_advisories_sent then 'Sim'
              else 'Não'
          end
      or verification.bonification -> 'consEnviada'
          is distinct from to_jsonb(aggregate.all_advisories_sent)
      or verification.analysis ->> 'consAssessoria'
          is distinct from aggregate.aggregate_analysis
  );

comment on column public.registered_invoices.payload is
    'Payload compatível da NF. Para expense_type=servico, consultaAssessoriaEnviada (boolean) e analiseConsultaAssessoria (Não analisado, Correto, Correto (Atrasado) ou Incorreto) registram a consulta contábil individual da nota.';
