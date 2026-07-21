-- Consolida o escopo da seção Capital e Inventário diretamente nas políticas
-- RLS, evitando expor uma função auxiliar como parte da API tipada pública.

-- Leitura das escolas da própria CRE para compor o painel patrimonial.
drop policy if exists schools_read on public.schools;
create policy schools_read
on public.schools
for select
to authenticated
using (
    public.can_access_school(id)
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.user_profiles up
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where up.user_id = auth.uid()
              and up.profile_id = 'inventory'
              and up.active = true
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and schools.cre = up.cre_scope
        )
    )
);

-- Programas vinculados às escolas necessários à seção patrimonial.
drop policy if exists school_programs_read on public.school_programs;
create policy school_programs_read
on public.school_programs
for select
to authenticated
using (
    public.can_access_school(school_id)
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = school_programs.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

-- Bens patrimoniais: leitura e operação pela equipe da própria CRE.
drop policy if exists assets_read on public.assets;
create policy assets_read
on public.assets
for select
to authenticated
using (
    public.can_access_school(school_id)
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_insert on public.assets;
create policy assets_insert
on public.assets
for insert
to authenticated
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_update on public.assets;
create policy assets_update
on public.assets
for update
to authenticated
using (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
)
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

-- A helper deixou de ser necessária e não deve compor a API pública tipada.
drop function if exists public.inventory_can_access_cre_school(text);
