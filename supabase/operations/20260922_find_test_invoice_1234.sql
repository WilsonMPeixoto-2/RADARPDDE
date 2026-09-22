-- Preflight sem escrita: simula contexto Auth técnico e reverte a transação.
begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select up.user_id::text
    from public.user_profiles up
    where up.profile_id = 'technical_admin'
      and up.active = true
    order by up.created_at
    limit 1
  ),
  true
);

select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('request.jwt.claim.sub', true),
    'role', 'authenticated'
  )::text,
  true
);

select
  (auth.uid() is not null) as auth_uid_present,
  public.current_app_role() as app_role,
  public.can_write_school('04.10.001') as can_write_target_school;

rollback;
