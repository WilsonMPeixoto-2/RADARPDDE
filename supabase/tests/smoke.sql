-- Smoke test executado após todas as migrations no PostgreSQL efêmero.

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000001', 'controller@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2026-01', 'Janeiro de 2026', 2026, '2026-02-15');

insert into public.programs (id, name)
values ('BASIC', 'PDDE Básico');

insert into public.controllers (id, name, user_id)
values (
    'controller-test',
    'Controlador de teste',
    '00000000-0000-0000-0000-000000000001'
);

insert into public.controllers (id, name)
values ('other-controller', 'Outro controlador');

insert into public.inventory_team_members (id, name)
values ('inventory-test', 'Inventariador de teste');

insert into public.schools (
    id,
    designation,
    denomination,
    cre,
    controller_id,
    initial_competence
) values
(
    '04.00.001',
    '04.00.001',
    'Escola da carteira',
    '4ª CRE',
    'controller-test',
    '2026-01'
),
(
    '04.00.002',
    '04.00.002',
    'Escola com exceção',
    '4ª CRE',
    'other-controller',
    '2026-01'
);

insert into public.user_profiles (
    user_id,
    profile_id,
    controller_id
) values (
    '00000000-0000-0000-0000-000000000001',
    'controller',
    'controller-test'
);

insert into public.user_school_scopes (user_id, school_id, can_write)
values (
    '00000000-0000-0000-0000-000000000001',
    '04.00.002',
    false
);

insert into public.verifications (
    id,
    school_id,
    competence_id,
    program_id,
    bonification,
    analysis
) values (
    '04.00.001::2026-01::BASIC',
    '04.00.001',
    '2026-01',
    'BASIC',
    '{}'::jsonb,
    '{}'::jsonb
);

insert into public.assets (
    id,
    school_id,
    competence_id,
    description,
    expense_type,
    invoice_number,
    amount,
    status,
    inventoried_by_member_id,
    inventoried_at
) values (
    'asset-test',
    '04.00.001',
    '2026-01',
    'Computador',
    'permanente',
    'NF-TEST',
    2500,
    'Inventariada',
    'inventory-test',
    '2026-01-20T12:00:00Z'
);

insert into public.registered_invoices (
    id,
    school_id,
    competence_id,
    program_id,
    verification_id,
    source_context_key,
    linked_asset_id,
    description,
    expense_type,
    invoice_number,
    amount,
    registered_at
) values (
    'invoice-test',
    '04.00.001',
    '2026-01',
    'BASIC',
    '04.00.001::2026-01::BASIC',
    '2026-01_BASIC',
    'asset-test',
    'Computador',
    'permanente',
    'NF-TEST',
    2500,
    '2026-01-10T12:00:00Z'
);

update public.schools
set denomination = 'Escola da carteira atualizada'
where id = '04.00.001';

update public.programs
set name = 'PDDE Básico atualizado'
where id = 'BASIC';

do $$
declare
    version_value integer;
    audit_count integer;
    program_audit_count integer;
    invoice_context text;
    inventoried_member text;
begin
    perform set_config(
        'request.jwt.claim.sub',
        '00000000-0000-0000-0000-000000000001',
        true
    );

    if public.current_app_role() <> 'controller' then
        raise exception 'perfil ativo incorreto: %', public.current_app_role();
    end if;

    if public.can_write_school('04.00.001') is not true then
        raise exception 'controlador não escreve na própria carteira';
    end if;

    if public.can_access_school('04.00.002') is not true then
        raise exception 'exceção somente leitura não concedeu leitura';
    end if;

    if public.can_write_school('04.00.002') is not false then
        raise exception 'exceção somente leitura concedeu escrita indevida';
    end if;

    update public.user_school_scopes
    set can_write = true
    where user_id = '00000000-0000-0000-0000-000000000001'
      and school_id = '04.00.002';

    if public.can_write_school('04.00.002') is not true then
        raise exception 'exceção com escrita não foi respeitada';
    end if;

    begin
        insert into public.user_profiles (user_id, profile_id)
        values (
            '00000000-0000-0000-0000-000000000001',
            'federal_assistant'
        );
        raise exception 'segundo perfil ativo foi aceito indevidamente';
    exception
        when unique_violation then null;
    end;

    select row_version into version_value
    from public.schools
    where id = '04.00.001';

    if version_value <> 2 then
        raise exception 'row_version esperado 2, encontrado %', version_value;
    end if;

    select count(*) into audit_count
    from public.audit_events
    where table_name = 'schools'
      and record_id = '04.00.001';

    if audit_count < 2 then
        raise exception 'auditoria de schools incompleta: % eventos', audit_count;
    end if;

    select count(*) into program_audit_count
    from public.audit_events
    where table_name = 'programs'
      and record_id = 'BASIC';

    if program_audit_count < 2 then
        raise exception 'auditoria de programs incompleta: % eventos', program_audit_count;
    end if;

    select source_context_key into invoice_context
    from public.registered_invoices
    where id = 'invoice-test';

    if invoice_context <> '2026-01_BASIC' then
        raise exception 'contexto da nota não preservado: %', invoice_context;
    end if;

    select inventoried_by_member_id into inventoried_member
    from public.assets
    where id = 'asset-test';

    if inventoried_member <> 'inventory-test' then
        raise exception 'responsável da inventariação não preservado: %', inventoried_member;
    end if;
end
$$;
