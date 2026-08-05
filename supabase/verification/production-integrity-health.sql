-- Verificação periódica, agregada e somente leitura da integridade de Production.
do $$
declare
    v_result jsonb;
    v_status text;
    v_total_issues bigint;
    v_schema_version integer;
begin
    v_result := public.production_integrity_check();
    v_status := v_result ->> 'status';
    v_total_issues := coalesce((v_result ->> 'totalIssues')::bigint, -1);
    v_schema_version := coalesce((v_result ->> 'schemaVersion')::integer, -1);

    if v_schema_version <> 1 then
        raise exception 'PRODUCTION_INTEGRITY_SCHEMA_INVALID: %', v_schema_version;
    end if;

    if v_status is distinct from 'healthy' or v_total_issues <> 0 then
        raise exception 'PRODUCTION_INTEGRITY_FAILED: status=%, totalIssues=%',
            coalesce(v_status, 'null'),
            v_total_issues;
    end if;

    raise notice 'PRODUCTION_INTEGRITY_HEALTHY: schemaVersion=%, totalIssues=%',
        v_schema_version,
        v_total_issues;
end
$$;
