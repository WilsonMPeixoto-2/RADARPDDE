begin;

alter table public.verifications
    add column if not exists payload jsonb not null default '{}'::jsonb;

comment on column public.verifications.payload is
    'Extensões auditáveis da verificação preservadas pelo frontend, incluindo o histórico de retificações.';

commit;
