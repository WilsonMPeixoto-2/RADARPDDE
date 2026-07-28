-- Gestão SME consulta somente registros administrativos produzidos pelo
-- próprio usuário autenticado. O administrador técnico preserva a visão
-- integral e os demais perfis mantêm o escopo escolar anterior.
drop policy if exists administrative_logs_read on public.administrative_logs;

create policy administrative_logs_read
on public.administrative_logs
for select
to authenticated
using (
    (select public.current_app_role()) = 'technical_admin'
    or (
        (select public.current_app_role()) = 'sme_management'
        and actor_user_id = (select auth.uid())
    )
    or (
        (select public.current_app_role()) not in ('technical_admin', 'sme_management')
        and (
            school_id is null
            or public.can_access_school(school_id)
        )
    )
);

-- Toda gravação comum passa a declarar o próprio UUID autenticado. Operações
-- administrativas de restauração continuam disponíveis somente ao papel
-- técnico, que já possui acesso integral por RLS.
drop policy if exists administrative_logs_insert on public.administrative_logs;

create policy administrative_logs_insert
on public.administrative_logs
for insert
to authenticated
with check (
    (select public.current_app_role()) = 'technical_admin'
    or (
        actor_user_id = (select auth.uid())
        and (
            school_id is null
            or public.can_access_school(school_id)
        )
    )
);
