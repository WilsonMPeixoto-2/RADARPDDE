-- Restringe a chamada direta da função trigger SECURITY DEFINER sem alterar sua lógica.
revoke execute on function public.capture_audit_event() from public, anon, authenticated;
grant execute on function public.capture_audit_event() to service_role;
