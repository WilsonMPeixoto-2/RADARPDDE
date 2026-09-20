-- Invalidação operacional entre sessões via Supabase Realtime Broadcast.
-- O canal não transporta dados de negócio; apenas sinaliza que o contexto canônico mudou.
begin;

create or replace function radar_private.broadcast_operational_invalidation()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'realtime'
as $function$
begin
    perform realtime.send(
        jsonb_build_object(
            'entity', TG_TABLE_NAME,
            'operation', lower(TG_OP)
        ),
        'operational-change',
        'radar:operational',
        true
    );
    return null;
end;
$function$;

revoke all on function radar_private.broadcast_operational_invalidation() from public, anon, authenticated;

drop policy if exists radar_operational_invalidations_receive on realtime.messages;
create policy radar_operational_invalidations_receive
on realtime.messages
for select
to authenticated
using (
    (select realtime.topic()) = 'radar:operational'
    and realtime.messages.extension = 'broadcast'
    and (select public.current_app_role()) is not null
);

drop trigger if exists verifications_operational_invalidation on public.verifications;
create trigger verifications_operational_invalidation
after insert or update or delete on public.verifications
for each row execute function radar_private.broadcast_operational_invalidation();

drop trigger if exists registered_invoices_operational_invalidation on public.registered_invoices;
create trigger registered_invoices_operational_invalidation
after insert or update or delete on public.registered_invoices
for each row execute function radar_private.broadcast_operational_invalidation();

drop trigger if exists pendencies_operational_invalidation on public.pendencies;
create trigger pendencies_operational_invalidation
after insert or update or delete on public.pendencies
for each row execute function radar_private.broadcast_operational_invalidation();

drop trigger if exists pendency_attempts_operational_invalidation on public.pendency_attempts;
create trigger pendency_attempts_operational_invalidation
after insert or update or delete on public.pendency_attempts
for each row execute function radar_private.broadcast_operational_invalidation();

drop trigger if exists pendency_contacts_operational_invalidation on public.pendency_contacts;
create trigger pendency_contacts_operational_invalidation
after insert or update or delete on public.pendency_contacts
for each row execute function radar_private.broadcast_operational_invalidation();

drop trigger if exists assets_operational_invalidation on public.assets;
create trigger assets_operational_invalidation
after insert or update or delete on public.assets
for each row execute function radar_private.broadcast_operational_invalidation();

commit;
