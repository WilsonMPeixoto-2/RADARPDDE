-- RADAR PDDE — relevância mínima por escola para invalidação operacional.
-- O Broadcast continua sem transportar dados de negócio. A escola afetada permite
-- evitar releitura completa imediata em sessões que trabalham em outro Prontuário.
begin;

create or replace function radar_private.broadcast_operational_invalidation()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'realtime'
as $function$
declare
    v_row jsonb := '{}'::jsonb;
    v_school_id text := null;
    v_pendency_id text := null;
begin
    v_row := case
        when TG_OP = 'DELETE' then coalesce(to_jsonb(OLD), '{}'::jsonb)
        else coalesce(to_jsonb(NEW), '{}'::jsonb)
    end;
    v_school_id := nullif(btrim(coalesce(v_row ->> 'school_id', '')), '');

    -- pendency_attempts não possui school_id próprio. Derivamos a escola pela
    -- Pendência quando possível. Se não for possível, omitimos schoolId e o
    -- cliente usa o caminho global conservador, nunca ignorando a alteração.
    if v_school_id is null and TG_TABLE_NAME = 'pendency_attempts' then
        v_pendency_id := nullif(btrim(coalesce(v_row ->> 'pendency_id', '')), '');
        if v_pendency_id is not null then
            select p.school_id
              into v_school_id
              from public.pendencies p
             where p.id = v_pendency_id;
        end if;
    end if;

    perform realtime.send(
        jsonb_strip_nulls(jsonb_build_object(
            'entity', TG_TABLE_NAME,
            'operation', lower(TG_OP),
            'schoolId', v_school_id
        )),
        'operational-change',
        'radar:operational',
        true
    );
    return null;
end;
$function$;

revoke all on function radar_private.broadcast_operational_invalidation()
    from public, anon, authenticated;

comment on function radar_private.broadcast_operational_invalidation() is
    'Emite invalidação operacional privada com entidade, operação e escola afetada quando determinável, sem transportar dados de negócio.';

commit;