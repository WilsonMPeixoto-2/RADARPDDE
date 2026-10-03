-- Massa sintética de performance baseada SOMENTE em agregados de Production observados em 2026-10-02.
-- Não contém nomes, documentos, identificadores ou payloads copiados de usuários/unidades reais.
--
-- Totais-alvo das entidades lidas por read_operational_context:
-- verifications 1077; registered_invoices 239; pendencies 366;
-- pendency_attempts 83; pendency_contacts 99; assets 22.
--
-- Forma-alvo da leitura de 2026-08 sem histórico resolvido/cancelado:
-- 473 verificações; 193 NFs; 329 Pendências; 48 tentativas; 5 contatos; 21 bens.

begin;

-- A carga é preparação de fixture, não uma jornada Realtime. Evita gerar quase duas
-- mil mensagens durante o seed e restaura os triggers antes do commit.
alter table public.verifications disable trigger verifications_operational_invalidation;
alter table public.registered_invoices disable trigger registered_invoices_operational_invalidation;
alter table public.pendencies disable trigger pendencies_operational_invalidation;
alter table public.pendency_attempts disable trigger pendency_attempts_operational_invalidation;
alter table public.pendency_contacts disable trigger pendency_contacts_operational_invalidation;
alter table public.assets disable trigger assets_operational_invalidation;

insert into public.competences (id, label, exercise, starts_on, ends_on)
select
    format('2026-%s', lpad(month_no::text, 2, '0')),
    format('Competência sintética %s/2026', lpad(month_no::text, 2, '0')),
    2026,
    make_date(2026, month_no, 1),
    (make_date(2026, month_no, 1) + interval '1 month - 1 day')::date
from generate_series(1, 10) as month_no
on conflict (id) do nothing;

insert into public.programs (id, name, description)
values
    ('PERF-P2', 'Programa Sintético 2', 'Fixture de volume operacional.'),
    ('PERF-P3', 'Programa Sintético 3', 'Fixture de volume operacional.')
on conflict (id) do nothing;

insert into public.schools (
    id, designation, denomination, inep, cnpj, sici, cre, ra,
    controller_id, initial_competence, inventory_process
)
select
    format('PERF-ESC-%s', lpad(n::text, 3, '0')),
    format('04.90.%s', lpad(n::text, 3, '0')),
    format('Unidade Sintética %s', lpad(n::text, 3, '0')),
    format('PERFINEP%s', lpad(n::text, 5, '0')),
    format('PERFCNPJ%s', lpad(n::text, 5, '0')),
    format('PERFSICI%s', lpad(n::text, 5, '0')),
    '4ª CRE',
    format('P%s', lpad(n::text, 3, '0')),
    'controller-local',
    '2026-01',
    format('PERF-PROC-%s', lpad(n::text, 3, '0'))
from generate_series(1, 161) as n
on conflict (id) do nothing;

create temporary table perf_school_order on commit drop as
select id, row_number() over (order by id)::integer as rn
from public.schools
where id in ('ESC-LOCAL', 'ESC-OTHER') or id like 'PERF-ESC-%';

-- 163 vínculos BASIC + 163 P2 + 104 P3 = 430 school_programs, como Production.
insert into public.school_programs (id, school_id, program_id, active, starts_on)
select format('PERF-SP-BASIC-%s', s.rn), s.id, 'BASIC', true, '2026-01-01'::date
from perf_school_order s
where not exists (
    select 1 from public.school_programs sp
    where sp.school_id = s.id and sp.program_id = 'BASIC'
)
on conflict (school_id, program_id) do nothing;

insert into public.school_programs (id, school_id, program_id, active, starts_on)
select format('PERF-SP-P2-%s', s.rn), s.id, 'PERF-P2', true, '2026-01-01'::date
from perf_school_order s
on conflict (school_id, program_id) do nothing;

insert into public.school_programs (id, school_id, program_id, active, starts_on)
select format('PERF-SP-P3-%s', s.rn), s.id, 'PERF-P3', true, '2026-01-01'::date
from perf_school_order s
where s.rn <= 104
on conflict (school_id, program_id) do nothing;

create temporary table perf_verification_targets (
    competence_id text primary key,
    row_count integer not null
) on commit drop;
insert into perf_verification_targets values
    ('2026-01',118), ('2026-02',111), ('2026-03',112), ('2026-04',113),
    ('2026-05',103), ('2026-06',100), ('2026-07',103), ('2026-08',293),
    ('2026-09',23), ('2026-10',1);

insert into public.verifications (
    id, school_id, competence_id, program_id,
    bonification, analysis, bonus_result, payload
)
select
    format('PERF-V-%s-%s', replace(t.competence_id, '-', ''), lpad(n::text, 3, '0')),
    s.id,
    t.competence_id,
    case when n <= 163 then 'BASIC' else 'PERF-P2' end,
    jsonb_build_object('extCC','Sim','planejamento','Sim','pesquisaPrecos','Sim'),
    jsonb_build_object('status','Não analisado','source','synthetic'),
    'nao-lancada',
    jsonb_build_object('synthetic', true, 'padding', repeat('v', 260))
from perf_verification_targets t
cross join lateral generate_series(1, t.row_count) as n
join perf_school_order s on s.rn = ((n - 1) % 163) + 1
on conflict (id) do nothing;

create temporary table perf_verification_order on commit drop as
select
    v.id,
    v.school_id,
    v.competence_id,
    v.program_id,
    row_number() over (partition by v.competence_id order by v.id)::integer as competence_rn
from public.verifications v
where v.id like 'PERF-V-%';

create temporary table perf_invoice_targets (
    competence_id text primary key,
    row_count integer not null
) on commit drop;
insert into perf_invoice_targets values
    ('2026-01',16), ('2026-02',14), ('2026-03',12), ('2026-04',13),
    ('2026-05',13), ('2026-06',21), ('2026-07',23), ('2026-08',112),
    ('2026-09',14), ('2026-10',1);

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id,
    description, expense_type, invoice_number, amount, source_context_key,
    registered_at, payload
)
select
    format('PERF-I-%s-%s', replace(t.competence_id, '-', ''), lpad(n::text, 3, '0')),
    v.school_id,
    t.competence_id,
    v.program_id,
    v.id,
    format('Despesa sintética %s/%s', t.competence_id, n),
    'consumo',
    format('PERF-NF-%s-%s', replace(t.competence_id, '-', ''), lpad(n::text, 3, '0')),
    (100 + n)::numeric(14,2),
    format('%s|%s|%s', v.school_id, t.competence_id, v.program_id),
    now() - ((240 - n) || ' minutes')::interval,
    jsonb_build_object('synthetic', true, 'padding', repeat('i', 610))
from perf_invoice_targets t
cross join lateral generate_series(1, t.row_count) as n
join perf_verification_order v
  on v.competence_id = t.competence_id
 and v.competence_rn = n
on conflict (id) do nothing;

-- Os 81 primeiros contextos históricos com NF devem ser puxados pela leitura de Agosto.
create temporary table perf_selected_invoice_contexts on commit drop as
select school_id, competence_id, program_id, verification_id,
       row_number() over (order by competence_id, id)::integer as selected_rn
from public.registered_invoices
where id like 'PERF-I-%'
  and competence_id <> '2026-08'
order by competence_id, id
limit 81;

-- Completa 180 contextos históricos distintos; 81 possuem NF e 99 são apenas de verificação.
create temporary table perf_selected_historical_contexts on commit drop as
with invoice_contexts as (
    select school_id, competence_id, program_id, verification_id
    from perf_selected_invoice_contexts
), verification_only as (
    select v.school_id, v.competence_id, v.program_id, v.id as verification_id
    from perf_verification_order v
    where v.competence_id <> '2026-08'
      and not exists (
        select 1
        from public.registered_invoices ri
        where ri.id like 'PERF-I-%'
          and ri.competence_id <> '2026-08'
          and ri.school_id = v.school_id
          and ri.competence_id = v.competence_id
          and ri.program_id = v.program_id
      )
    order by v.competence_id, v.id
    limit 99
), combined as (
    select * from invoice_contexts
    union all
    select * from verification_only
)
select *, row_number() over (order by competence_id, school_id, program_id)::integer as rn
from combined;

create temporary table perf_pendency_targets (
    competence_id text primary key,
    aberta integer not null,
    aguardando integer not null,
    resolvida integer not null,
    cancelada integer not null
) on commit drop;
insert into perf_pendency_targets values
    ('2026-01',28,2,4,1),
    ('2026-02',23,1,3,1),
    ('2026-03',25,1,3,1),
    ('2026-04',24,1,3,1),
    ('2026-05',25,1,4,1),
    ('2026-06',31,1,4,1),
    ('2026-07',37,1,4,1),
    ('2026-08',80,12,19,4),
    ('2026-09',11,1,5,0),
    ('2026-10',0,1,0,0);

create temporary table perf_pendency_rows on commit drop as
select
    t.competence_id,
    n,
    case
      when n <= t.aberta then 'Aberta'
      when n <= t.aberta + t.aguardando then 'Aguardando reanálise'
      when n <= t.aberta + t.aguardando + t.resolvida then 'Resolvida'
      else 'Cancelada'
    end as status,
    (n <= t.aberta + t.aguardando) as is_active
from perf_pendency_targets t
cross join lateral generate_series(1, t.aberta + t.aguardando + t.resolvida + t.cancelada) as n;

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    responsible_area, next_actor, reason, notes, opened_at,
    resolved_at, canceled_at, payload
)
select
    format('PERF-P-%s-%s', replace(r.competence_id, '-', ''), lpad(r.n::text, 3, '0')),
    ctx.school_id,
    r.competence_id,
    ctx.program_id,
    'extCC',
    r.status,
    'Unidade Escolar',
    case when r.status in ('Aberta','Aguardando reanálise') then 'Controlador' else '' end,
    'Pendência sintética para ensaio de volume operacional.',
    repeat('n', 120),
    now() - ((r.n + 30) || ' days')::interval,
    case when r.status = 'Resolvida' then now() - interval '1 day' end,
    case when r.status = 'Cancelada' then now() - interval '1 day' end,
    jsonb_build_object('synthetic', true, 'padding', repeat('p', 1320))
from perf_pendency_rows r
cross join lateral (
    select school_id, program_id
    from (
        select
            r2.school_id,
            r2.program_id,
            1 as priority
        from perf_verification_order r2
        where r.competence_id = '2026-08'
          and r2.competence_id = '2026-08'
          and r2.competence_rn = ((r.n - 1) % 115) + 1

        union all

        select
            h.school_id,
            h.program_id,
            2 as priority
        from perf_selected_historical_contexts h
        where r.competence_id <> '2026-08'
          and r.is_active
          and h.rn = ((
            (select coalesce(sum(t2.aberta + t2.aguardando),0)
             from perf_pendency_targets t2
             where t2.competence_id < r.competence_id and t2.competence_id <> '2026-08')
            + r.n - 1
          ) % 180) + 1

        union all

        select
            v.school_id,
            v.program_id,
            3 as priority
        from perf_verification_order v
        where r.competence_id <> '2026-08'
          and not r.is_active
          and v.competence_id = r.competence_id
          and v.competence_rn = ((r.n - 1) % (
            select row_count from perf_verification_targets vt where vt.competence_id = r.competence_id
          )) + 1
    ) candidates
    order by priority
    limit 1
) ctx
on conflict (id) do nothing;

create temporary table perf_selected_pendencies on commit drop as
select *, row_number() over (order by id)::integer as rn
from public.pendencies
where id like 'PERF-P-%'
  and (competence_origin = '2026-08' or status in ('Aberta','Aguardando reanálise'));

create temporary table perf_nonselected_pendencies on commit drop as
select *, row_number() over (order by id)::integer as rn
from public.pendencies
where id like 'PERF-P-%'
  and competence_origin <> '2026-08'
  and status in ('Resolvida','Cancelada');

insert into public.pendency_attempts (
    id, pendency_id, attempt_number, submitted_at, available_at,
    result, observation, drive_url, errors, payload
)
select
    format('PERF-A-S-%s', lpad(n::text,3,'0')),
    p.id,
    1,
    now() - interval '2 days',
    now() - interval '3 days',
    null,
    repeat('o', 160),
    'https://example.invalid/synthetic',
    '[]'::jsonb,
    jsonb_build_object('synthetic', true, 'padding', repeat('a', 560))
from generate_series(1,48) n
join perf_selected_pendencies p on p.rn = n
on conflict (id) do nothing;

insert into public.pendency_attempts (
    id, pendency_id, attempt_number, submitted_at, available_at,
    result, observation, drive_url, errors, payload
)
select
    format('PERF-A-H-%s', lpad(n::text,3,'0')),
    p.id,
    1,
    now() - interval '15 days',
    now() - interval '16 days',
    'correto',
    repeat('o', 160),
    'https://example.invalid/synthetic-history',
    '[]'::jsonb,
    jsonb_build_object('synthetic', true, 'padding', repeat('a', 560))
from generate_series(1,35) n
join perf_nonselected_pendencies p on p.rn = n
on conflict (id) do nothing;

insert into public.pendency_contacts (
    id, school_id, pendency_id, contact_type, contact_date,
    description, official_charge, payload
)
select
    format('PERF-C-S-%s', lpad(n::text,3,'0')),
    p.school_id,
    p.id,
    'e-mail',
    current_date - n,
    repeat('Contato sintético. ', 18),
    false,
    jsonb_build_object('synthetic', true, 'padding', repeat('c', 1480))
from generate_series(1,5) n
join perf_selected_pendencies p on p.rn = n
on conflict (id) do nothing;

insert into public.pendency_contacts (
    id, school_id, pendency_id, contact_type, contact_date,
    description, official_charge, payload
)
select
    format('PERF-C-H-%s', lpad(n::text,3,'0')),
    p.school_id,
    p.id,
    'e-mail',
    current_date - (n % 30),
    repeat('Contato sintético histórico. ', 16),
    false,
    jsonb_build_object('synthetic', true, 'padding', repeat('c', 1480))
from generate_series(1,94) n
join perf_nonselected_pendencies p on p.rn = ((n - 1) % 37) + 1
on conflict (id) do nothing;

insert into public.assets (
    id, school_id, competence_id, description, expense_type,
    invoice_number, amount, status, inventory_process, notes, payload
)
select
    format('PERF-ASSET-%s', lpad(n::text,3,'0')),
    s.id,
    format('2026-%s', lpad((((n - 1) % 7) + 1)::text,2,'0')),
    format('Bem sintético %s', n),
    'permanente',
    format('PERF-ASSET-NF-%s', lpad(n::text,3,'0')),
    (500 + n)::numeric(14,2),
    case when n <= 21 then 'Encaminhada' else 'Inventariada' end,
    format('PERF-PROC-ASSET-%s', n),
    repeat('nota ', 35),
    jsonb_build_object('synthetic', true, 'padding', repeat('b', 330))
from generate_series(1,22) n
join perf_school_order s on s.rn = ((n - 1) % 163) + 1
on conflict (id) do nothing;

alter table public.verifications enable trigger verifications_operational_invalidation;
alter table public.registered_invoices enable trigger registered_invoices_operational_invalidation;
alter table public.pendencies enable trigger pendencies_operational_invalidation;
alter table public.pendency_attempts enable trigger pendency_attempts_operational_invalidation;
alter table public.pendency_contacts enable trigger pendency_contacts_operational_invalidation;
alter table public.assets enable trigger assets_operational_invalidation;

-- Falha cedo se a massa deixar de refletir os agregados que motivaram o gate.
do $shape$
declare
    v_context jsonb;
    v_payload_bytes integer;
begin
    if (select count(*) from public.schools) <> 163 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH schools=%', (select count(*) from public.schools);
    end if;
    if (select count(*) from public.school_programs) <> 430 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH school_programs=%', (select count(*) from public.school_programs);
    end if;
    if (select count(*) from public.verifications) <> 1077 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH verifications=%', (select count(*) from public.verifications);
    end if;
    if (select count(*) from public.registered_invoices) <> 239 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH registered_invoices=%', (select count(*) from public.registered_invoices);
    end if;
    if (select count(*) from public.pendencies) <> 366 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH pendencies=%', (select count(*) from public.pendencies);
    end if;
    if (select count(*) from public.pendency_attempts) <> 83 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH pendency_attempts=%', (select count(*) from public.pendency_attempts);
    end if;
    if (select count(*) from public.pendency_contacts) <> 99 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH pendency_contacts=%', (select count(*) from public.pendency_contacts);
    end if;
    if (select count(*) from public.assets) <> 22 then
        raise exception 'PRODUCTION_SHAPE_MISMATCH assets=%', (select count(*) from public.assets);
    end if;

    v_context := public.read_operational_context('2026-08', array[]::text[]);
    v_payload_bytes := pg_column_size(v_context);

    if jsonb_array_length(v_context->'entities'->'verifications') <> 473
       or jsonb_array_length(v_context->'entities'->'registeredInvoices') <> 193
       or jsonb_array_length(v_context->'entities'->'pendencies') <> 329
       or jsonb_array_length(v_context->'entities'->'pendencyAttempts') <> 48
       or jsonb_array_length(v_context->'entities'->'pendencyContacts') <> 5
       or jsonb_array_length(v_context->'entities'->'assets') <> 21 then
        raise exception 'PRODUCTION_SHAPE_CONTEXT_MISMATCH %', jsonb_build_object(
            'verifications', jsonb_array_length(v_context->'entities'->'verifications'),
            'registeredInvoices', jsonb_array_length(v_context->'entities'->'registeredInvoices'),
            'pendencies', jsonb_array_length(v_context->'entities'->'pendencies'),
            'pendencyAttempts', jsonb_array_length(v_context->'entities'->'pendencyAttempts'),
            'pendencyContacts', jsonb_array_length(v_context->'entities'->'pendencyContacts'),
            'assets', jsonb_array_length(v_context->'entities'->'assets')
        );
    end if;

    if v_payload_bytes < 900000 or v_payload_bytes > 1700000 then
        raise exception 'PRODUCTION_SHAPE_PAYLOAD_OUT_OF_RANGE bytes=%', v_payload_bytes;
    end if;

    raise notice 'PRODUCTION_SHAPE_OK payload_bytes=%', v_payload_bytes;
end
$shape$;

commit;
