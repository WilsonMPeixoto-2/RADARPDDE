-- Preparação institucional exclusiva do banco local descartável, via psql.
-- A Data API concede ao bootstrap Auth somente UPDATE em controllers.
-- Não ampliar grants do produto para criar a massa de teste.
begin;
insert into public.controllers (id, name, email, active)
select format('operational-controller-%s', n),
       format('Controlador operacional %s', n),
       format('operational-%s@radar.local', n), true
from generate_series(1,4) n
on conflict (id) do nothing;

insert into public.schools (
    id, designation, denomination, inep, cnpj, sici, cre, ra,
    controller_id, initial_competence, inventory_process
)
select format('OPS-SESSION-%s', n), format('04.99.00%s', n),
       format('Jornada operacional %s', n), format('OPSINEP%s', n),
       format('OPSCNPJ%s', n), format('OPSSICI%s', n), '4ª CRE', 'OPS',
       format('operational-controller-%s', n), '2026-08', format('OPS-PROC-%s', n)
from generate_series(1,3) n
on conflict (id) do nothing;

insert into public.school_programs (id, school_id, program_id, active, starts_on)
select format('OPS-SP-%s', n), format('OPS-SESSION-%s', n), 'BASIC', true, '2026-01-01'::date
from generate_series(1,3) n
on conflict (school_id, program_id) do nothing;
commit;
