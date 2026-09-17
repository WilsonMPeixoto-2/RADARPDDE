begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(2);

select has_index(
    'public',
    'administrative_logs',
    'administrative_logs_event_cursor_idx',
    'índice de paginação cronológica dos registros administrativos existe'
);

select has_index(
    'public',
    'administrative_logs',
    'administrative_logs_event_cursor_idx',
    array['event_at', 'id']::name[],
    'índice de paginação usa event_at e id na ordem do cursor'
);

select * from finish();
rollback;
