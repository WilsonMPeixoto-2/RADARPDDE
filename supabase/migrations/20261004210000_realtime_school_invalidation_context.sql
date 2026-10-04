-- Acrescenta contexto mínimo de escola às invalidações operacionais Realtime.
-- Continua proibido transportar registros de negócio pelo Broadcast.
-- Quando a escola não pode ser determinada com segurança, schoolId é omitido
-- para obrigar o cliente a usar a reconciliação global conservadora.
begin;

create or replace function radar_private.broadcast_operational_invalidation()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'realtime'
as $function$
declare
    v_old jsonb := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else '{}'::jsonb end;
    v_new jsonb := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else '{}'::jsonb end;
    v_source jsonb := case when TG_OP = 'DELETE' then v_old else v_new end;
    v_old_school_id text := nullif(btrim(coalesce(v_old->>'school_id', '')), '');
    v_new_school_id text := nullif(btrim(coalesce(v_new->>'school_id', '')), '');
    v_school_id text;
    v_old_pendency_id text;
    v_new_pendency_id text;
    v_old_parent_school_id text;
    v_new_parent_school_id text;
    v_payload jsonb;
begin
    -- Entidades que possuem school_id podem ser roteadas diretamente. Se um
    -- UPDATE mover a linha entre escolas, a invalidação deixa de ser precisa e
    -- cai no caminho global, porque ambas as escolas foram afetadas.
    if TG_OP = 'UPDATE'
       and v_old_school_id is not null
       and v_new_school_id is not null
       and v_old_school_id is distinct from v_new_school_id then
        v_school_id := null;
    else
        v_school_id := nullif(btrim(coalesce(v_source->>'school_id', '')), '');
    end if;

    -- pendency_attempts não possui school_id. A escola é derivada pela
    -- Pendência canônica. Mudança de pai entre escolas também vira invalidação
    -- global conservadora. O lookup é explicitamente qualificado porque o
    -- search_path da função não inclui public.
    if TG_TABLE_NAME = 'pendency_attempts' then
        v_old_pendency_id := nullif(btrim(coalesce(v_old->>'pendency_id', '')), '');
        v_new_pendency_id := nullif(btrim(coalesce(v_new->>'pendency_id', '')), '');

        if v_old_pendency_id is not null then
            select p.school_id
              into v_old_parent_school_id
              from public.pendencies p
             where p.id = v_old_pendency_id;
        end if;

        if v_new_pendency_id is not null then
            select p.school_id
              into v_new_parent_school_id
              from public.pendencies p
             where p.id = v_new_pendency_id;
        end if;

        if TG_OP = 'UPDATE'
           and v_old_parent_school_id is not null
           and v_new_parent_school_id is not null
           and v_old_parent_school_id is distinct from v_new_parent_school_id then
            v_school_id := null;
        elsif TG_OP = 'DELETE' then
            v_school_id := v_old_parent_school_id;
        else
            v_school_id := v_new_parent_school_id;
        end if;
    end if;

    v_payload := jsonb_build_object(
        'entity', TG_TABLE_NAME,
        'operation', lower(TG_OP)
    );

    if v_school_id is not null then
        v_payload := v_payload || jsonb_build_object('schoolId', v_school_id);
    end if;

    perform realtime.send(
        v_payload,
        'operational-change',
        'radar:operational',
        true
    );

    return null;
end;
$function$;

revoke all on function radar_private.broadcast_operational_invalidation()
from public, anon, authenticated;

commit;
