-- Preflight remoto não destrutivo. Não cria extensões nem altera o schema.
do $$
declare
    v_missing text[];
    v_extension record;
begin
    select array_agg(required.name order by required.name)
      into v_missing
      from (values ('pgcrypto'), ('pg_jsonschema'), ('pgtap')) as required(name)
     where not exists (
        select 1
          from pg_available_extensions available
         where available.name = required.name
     );

    if v_missing is not null then
        raise exception 'CAPABILITY_MISSING: extensões indisponíveis: %', array_to_string(v_missing, ', ');
    end if;

    for v_extension in
        select name, default_version, installed_version
          from pg_available_extensions
         where name in ('pgcrypto', 'pg_jsonschema', 'pgtap')
         order by name
    loop
        raise notice 'CAPABILITY_OK: % default=% installed=%',
            v_extension.name,
            v_extension.default_version,
            coalesce(v_extension.installed_version, 'not-installed');
    end loop;
end
$$;
