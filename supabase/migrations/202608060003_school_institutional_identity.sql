-- RADAR PDDE — integridade da identidade institucional das unidades escolares.
-- Impede valores vazios e duplicidades concorrentes de INEP, CNPJ e SICI.

begin;

alter table public.schools
    drop constraint if exists schools_institutional_identity_nonempty;

alter table public.schools
    add constraint schools_institutional_identity_nonempty
    check (
        btrim(designation) <> ''
        and btrim(denomination) <> ''
        and btrim(inep) <> ''
        and btrim(cnpj) <> ''
        and btrim(sici) <> ''
    );

create unique index if not exists schools_inep_normalized_key
    on public.schools (
        regexp_replace(lower(btrim(inep)), '[^0-9a-z]+', '', 'g')
    );

create unique index if not exists schools_cnpj_normalized_key
    on public.schools (
        regexp_replace(lower(btrim(cnpj)), '[^0-9a-z]+', '', 'g')
    );

create unique index if not exists schools_sici_normalized_key
    on public.schools (
        regexp_replace(lower(btrim(sici)), '[^0-9a-z]+', '', 'g')
    );

commit;
