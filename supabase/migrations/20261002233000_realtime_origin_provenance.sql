-- RADAR PDDE — proveniência e relevância mínima da invalidação operacional.
-- O Broadcast continua sem transportar dados de negócio: informa apenas entidade,
-- operação, origem e a escola afetada. A escola permite evitar que uma alteração
-- em B obrigue quem está trabalhando no Prontuário de A a baixar e reconstruir
-- imediatamente todo o contexto. Payload sem escola continua conservador/global.
begin;

create or replace function radar_private.broadcast_operational_invalidation()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'realtime'
as $function$
declare
    v_headers jsonb := '{}'::jsonb;
    v_origin_client_instance text := null;
    v_row jsonb := '{}'::jsonb;
    v_school_id text := null;
    v_pendency_id text := null;
begin
    begin
        v_headers := coalesce(
            nullif(current_setting('request.headers', true), '')::jsonb,
            '{}'::jsonb
        );
    exception
        when others then
            v_headers := '{}'::jsonb;
    end;

    v_origin_client_instance := nullif(
        btrim(coalesce(v_headers ->> 'x-radar-client-instance', '')),
        ''
    );

    v_row := case
        when TG_OP = 'DELETE' then coalesce(to_jsonb(OLD), '{}'::jsonb)
        else coalesce(to_jsonb(NEW), '{}'::jsonb)
    end;
    v_school_id := nullif(btrim(coalesce(v_row ->> 'school_id', '')), '');

    -- pendency_attempts não possui school_id próprio. Derivamos a escola pela
    -- Pendência enquanto ela ainda existe. Se a relação não puder ser resolvida
    -- (por exemplo, em um cascade de exclusão), schoolId fica ausente e o cliente
    -- usa o caminho global conservador, nunca ignorando a mudança.
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
            'schoolId', v_school_id,
            'originUserId', auth.uid(),
            'originClientInstanceId', v_origin_client_instance
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
    'Emite invalidação operacional privada com proveniência, escola afetada quando determinável e sem transportar dados de negócio.';

commit;