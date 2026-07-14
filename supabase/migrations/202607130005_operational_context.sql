-- RADAR PDDE — contexto operacional complementar para notas fiscais e inventário.
-- Mantém os atributos de interface pesquisáveis sem depender exclusivamente do payload JSONB.

alter table public.assets
    add column inventoried_by_member_id text
        references public.inventory_team_members (id)
        on update cascade
        on delete set null,
    add column inventoried_at timestamptz;

alter table public.registered_invoices
    add column program_id text
        references public.programs (id)
        on update cascade
        on delete set null,
    add column verification_id text
        references public.verifications (id)
        on update cascade
        on delete set null,
    add column source_context_key text not null default '',
    add column linked_asset_id text
        references public.assets (id)
        on update cascade
        on delete set null,
    add column registered_at timestamptz;

create index assets_inventoried_by_member_idx
    on public.assets (inventoried_by_member_id)
    where inventoried_by_member_id is not null;

create index assets_inventoried_at_idx
    on public.assets (inventoried_at desc)
    where inventoried_at is not null;

create index registered_invoices_program_idx
    on public.registered_invoices (program_id)
    where program_id is not null;

create index registered_invoices_verification_idx
    on public.registered_invoices (verification_id)
    where verification_id is not null;

create index registered_invoices_context_idx
    on public.registered_invoices (school_id, source_context_key);

create index registered_invoices_asset_idx
    on public.registered_invoices (linked_asset_id)
    where linked_asset_id is not null;
