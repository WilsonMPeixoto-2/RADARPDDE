-- Massa da jornada autenticada de correção na pilha descartável.
\ir quality-provisional.sql

-- A competência de fechamento continua em maio. Junho permite observar
-- uma Pendência de maio no Passivo da competência seguinte.
insert into public.competences (id, label, exercise, starts_on, ends_on, bonus_deadline)
values ('2026-06', 'Junho 2026', 2026, '2026-06-01', '2026-06-30', '2026-07-15')
on conflict (id) do nothing;
