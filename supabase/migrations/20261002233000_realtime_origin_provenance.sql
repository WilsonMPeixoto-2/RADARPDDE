-- RADAR PDDE — proveniência mínima de invalidação operacional.
-- Permite que somente a instância do navegador que originou a escrita elimine
-- o eco do próprio Broadcast. Outras abas/sessões continuam reconciliando.
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

    perform realtime.send(
        jsonb_strip_nulls(jsonb_build_object(
            'entity', TG_TABLE_NAME,
            'operation', lower(TG_OP),
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
    'Emite invalidação operacional privada com proveniência da identidade autenticada e da instância do cliente, sem transportar dados de negócio.';

commit;
