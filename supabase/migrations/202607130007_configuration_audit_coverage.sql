-- RADAR PDDE — cobertura complementar da auditoria institucional.
-- Inclui parâmetros e cadastros que alteram o comportamento do sistema.

create trigger app_config_capture_audit
after insert or update or delete on public.app_config
for each row execute function public.capture_audit_event();

create trigger programs_capture_audit
after insert or update or delete on public.programs
for each row execute function public.capture_audit_event();

create trigger controllers_capture_audit
after insert or update or delete on public.controllers
for each row execute function public.capture_audit_event();

create trigger inventory_team_members_capture_audit
after insert or update or delete on public.inventory_team_members
for each row execute function public.capture_audit_event();

create trigger competences_capture_audit
after insert or update or delete on public.competences
for each row execute function public.capture_audit_event();

create trigger school_programs_capture_audit
after insert or update or delete on public.school_programs
for each row execute function public.capture_audit_event();

comment on trigger app_config_capture_audit on public.app_config is
    'Registra alterações dos parâmetros globais e exercícios.';
comment on trigger competences_capture_audit on public.competences is
    'Registra alterações de competências, janelas e prazos.';
comment on trigger school_programs_capture_audit on public.school_programs is
    'Registra inclusão, vigência e desativação de programas por escola.';
