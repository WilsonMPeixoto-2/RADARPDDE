-- Registro de movimentacoes ainda sem programa definido na conta PDDE Qualidade.
-- Entidade distinta de NF, bonificacao e Pendencia. A identificacao usa a
-- mesma transacao da gravacao fiscal canonica, sem criar NF duplicada.
begin;

create table public.quality_provisional_movements (
    id uuid primary key default gen_random_uuid(),
    school_id text not null references public.schools(id) on update cascade on delete cascade,
    competence_id text not null references public.competences(id) on update cascade on delete restrict,
    debit_date date,
    description text check (char_length(description) <= 2000),
    document_reference text check (char_length(document_reference) <= 250),
    amount numeric(14,2) check (amount >= 0),
    observation text check (char_length(observation) <= 2000),
    status text not null default 'open' check (status in ('open', 'identified')),
    registered_invoice_id text unique references public.registered_invoices(id) on delete set null,
    identification_operation_key uuid,
    row_version integer not null default 1 check (row_version > 0),
    created_by uuid not null default auth.uid(),
    updated_by uuid not null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (status = 'identified' or (registered_invoice_id is null and identification_operation_key is null))
);

create index quality_provisional_school_competence_idx
    on public.quality_provisional_movements (school_id, competence_id, created_at desc);

alter table public.quality_provisional_movements enable row level security;
revoke all on public.quality_provisional_movements from public, anon, authenticated;
grant select on public.quality_provisional_movements to authenticated;
grant insert (school_id, competence_id, debit_date, description, document_reference, amount, observation)
    on public.quality_provisional_movements to authenticated;
grant update (debit_date, description, document_reference, amount, observation)
    on public.quality_provisional_movements to authenticated;
grant delete on public.quality_provisional_movements to authenticated;

create policy quality_provisional_read on public.quality_provisional_movements
    for select to authenticated
    using (public.can_access_school(school_id));

create policy quality_provisional_insert on public.quality_provisional_movements
    for insert to authenticated
    with check (
        (select public.current_app_role()) in ('controller', 'federal_assistant', 'technical_admin')
        and public.can_write_school(school_id)
        and exists (
            select 1 from public.school_programs sp
            where sp.school_id = quality_provisional_movements.school_id and sp.active
              and sp.program_id in ('CONECTADA', 'PROEC', 'ED_FAMILIA',
                  'ADOLESCENCIAS', 'LEITURA', 'TEMPO_APRENDER')
        )
    );

create policy quality_provisional_update on public.quality_provisional_movements
    for update to authenticated
    using (
        status = 'open'
        and (select public.current_app_role()) in ('controller', 'federal_assistant', 'technical_admin')
        and public.can_write_school(school_id)
    )
    with check (
        status = 'open'
        and (select public.current_app_role()) in ('controller', 'federal_assistant', 'technical_admin')
        and public.can_write_school(school_id)
    );

create policy quality_provisional_delete on public.quality_provisional_movements
    for delete to authenticated
    using (
        status = 'open'
        and (select public.current_app_role()) in ('controller', 'federal_assistant', 'technical_admin')
        and public.can_write_school(school_id)
    );

create or replace function radar_private.touch_quality_provisional_movement()
returns trigger language plpgsql security invoker
set search_path = pg_catalog, public
as $$
begin
    new.row_version := old.row_version + 1;
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
end;
$$;
revoke all on function radar_private.touch_quality_provisional_movement() from public, anon;
create trigger quality_provisional_movement_touch
before update on public.quality_provisional_movements
for each row execute function radar_private.touch_quality_provisional_movement();

-- Encapsula a gravacao de NF existente e a baixa do provisório na mesma
-- transacao. RLS e perfil sao revalidados no backend antes de chamar o
-- comando fiscal ja autorizado/idempotente.
create or replace function radar_private.identify_quality_provisional_movement_impl(
    p_provisional_id uuid,
    p_expected_provisional_version integer,
    p_operation_key uuid,
    p_invoice jsonb,
    p_asset jsonb default null,
    p_verification_patch jsonb default null,
    p_expected_invoice_version integer default null,
    p_expected_asset_version integer default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_movement public.quality_provisional_movements%rowtype;
    v_result jsonb;
    v_program text := nullif(p_invoice ->> 'program_id', '');
begin
    if auth.uid() is null
        or radar_private.current_app_role() not in ('controller','federal_assistant','technical_admin')
        or p_provisional_id is null or p_operation_key is null
        or p_expected_provisional_version is null
        or nullif(p_invoice ->> 'id', '') is null then
        raise exception 'AUTHORIZATION_DENIED: identificacao exige identidade, versao e operacao validas';
    end if;

    select * into v_movement
    from public.quality_provisional_movements
    where id = p_provisional_id
    for update;

    if not found then
        raise exception 'NOT_FOUND: movimentacao provisoria nao localizada';
    end if;
    if not radar_private.can_write_school(v_movement.school_id) then
        raise exception 'AUTHORIZATION_DENIED: escola fora do escopo de escrita';
    end if;

    if v_movement.school_id is distinct from p_invoice ->> 'school_id'
        or v_movement.competence_id is distinct from p_invoice ->> 'competence_id'
        or v_program not in ('CONECTADA', 'PROEC', 'ED_FAMILIA', 'ADOLESCENCIAS', 'LEITURA', 'TEMPO_APRENDER')
        or not exists (
            select 1 from public.school_programs sp
            where sp.school_id = v_movement.school_id
              and sp.program_id = v_program and sp.active
        )
        or p_invoice ->> 'expense_type' not in ('consumo', 'permanente', 'servico', 'boleto_internet')
    then
        raise exception 'VALIDATION_ERROR: identificacao incompatível com escola, competencia, programa ou tipo';
    end if;

    if v_movement.status = 'identified' then
        if v_movement.identification_operation_key is distinct from p_operation_key
            or v_movement.registered_invoice_id is distinct from p_invoice ->> 'id'
        then
            raise exception 'OPTIMISTIC_CONFLICT: movimentacao ja identificada';
        end if;
    elsif v_movement.row_version <> p_expected_provisional_version then
        raise exception 'OPTIMISTIC_CONFLICT: registro provisório modificado por outra sessao';
    end if;

    if v_movement.status = 'open' and (
        p_expected_invoice_version is not null
        or exists (select 1 from public.registered_invoices where id = p_invoice ->> 'id')
    ) then
        raise exception 'VALIDATION_ERROR: identificacao exige um novo documento fiscal';
    end if;

    v_result := radar_private.save_invoice_with_effects_v2_impl(
        p_operation_key, p_invoice, p_asset, p_verification_patch,
        p_expected_invoice_version, p_expected_asset_version,
        p_expected_verification_version, p_administrative_log
    );

    if v_movement.status = 'open' then
        update public.quality_provisional_movements
        set status = 'identified',
            registered_invoice_id = p_invoice ->> 'id',
            identification_operation_key = p_operation_key
        where id = p_provisional_id;
    end if;

    return v_result || jsonb_build_object(
        'quality_provisional_id', p_provisional_id,
        'quality_provisional_status', 'identified'
    );
end;
$$;

revoke all on function radar_private.identify_quality_provisional_movement_impl(
    uuid, integer, uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb
) from public, anon, authenticated;
grant execute on function radar_private.identify_quality_provisional_movement_impl(
    uuid, integer, uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb
) to authenticated, service_role;

create or replace function public.identify_quality_provisional_movement(
    p_provisional_id uuid,
    p_expected_provisional_version integer,
    p_operation_key uuid,
    p_invoice jsonb,
    p_asset jsonb default null,
    p_verification_patch jsonb default null,
    p_expected_invoice_version integer default null,
    p_expected_asset_version integer default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
) returns jsonb language sql security invoker
set search_path = pg_catalog, radar_private
as $$
    select radar_private.identify_quality_provisional_movement_impl(
        p_provisional_id, p_expected_provisional_version, p_operation_key,
        p_invoice, p_asset, p_verification_patch, p_expected_invoice_version,
        p_expected_asset_version, p_expected_verification_version, p_administrative_log
    )
$$;
revoke all on function public.identify_quality_provisional_movement(
    uuid, integer, uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb
) from public, anon;
grant execute on function public.identify_quality_provisional_movement(
    uuid, integer, uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb
) to authenticated, service_role;

commit;
