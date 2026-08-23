-- Vincula pendências de Consulta à Assessoria à NF de serviço específica.
-- Mantém a unicidade documental histórica para os demais casos e permite
-- pendências simultâneas de Assessoria somente quando pertencem a NFs distintas.

alter table public.pendencies
    add column registered_invoice_id text
        references public.registered_invoices (id)
        on update cascade
        on delete restrict;

alter table public.pendencies
    add constraint pendencies_registered_invoice_advisory_chk
    check (
        registered_invoice_id is null
        or document_key = 'consAssessoria'
    );

drop index if exists public.pendencies_active_document_uidx;

create unique index pendencies_active_document_uidx
    on public.pendencies (school_id, competence_origin, program_id, document_key)
    where status in ('Aberta', 'Aguardando reanálise')
      and program_id is not null
      and btrim(document_key) <> ''
      and registered_invoice_id is null;

create unique index pendencies_active_invoice_document_uidx
    on public.pendencies (
        school_id,
        competence_origin,
        program_id,
        document_key,
        registered_invoice_id
    )
    where status in ('Aberta', 'Aguardando reanálise')
      and program_id is not null
      and btrim(document_key) <> ''
      and registered_invoice_id is not null;

create index pendencies_registered_invoice_idx
    on public.pendencies (registered_invoice_id)
    where registered_invoice_id is not null;

comment on column public.pendencies.registered_invoice_id is
    'NF de serviço de origem da pendência individual de Consulta à Assessoria. Nulo para os demais documentos e pendências legadas.';
