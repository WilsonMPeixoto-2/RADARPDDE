-- RADAR PDDE — preserva o prazo de bonificação do calendário mensal vigente.

alter table public.competences
    add column bonus_deadline date;

alter table public.competences
    add constraint competences_bonus_deadline_check
    check (bonus_deadline is null or bonus_deadline >= starts_on);

create index competences_bonus_deadline_idx
    on public.competences (bonus_deadline)
    where bonus_deadline is not null;
