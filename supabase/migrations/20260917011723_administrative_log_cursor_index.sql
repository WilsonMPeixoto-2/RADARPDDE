-- Optimiza a paginação cronológica dos registros administrativos.
-- A consulta queryAdministrativeLogs() ordena por event_at DESC, id DESC
-- e usa esse mesmo par como cursor estável entre páginas.
CREATE INDEX IF NOT EXISTS administrative_logs_event_cursor_idx
ON public.administrative_logs (event_at DESC, id DESC);
