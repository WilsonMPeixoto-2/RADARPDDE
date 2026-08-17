const DISPOSABLE_UNSUPPORTED_ROLE_SETTING = /^\s*ALTER\s+ROLE\b[^;]*\bSET\s+"?log_min_messages"?\s+(?:TO|=)\s+[^;]+;\s*$/i;

function sanitizeSupabaseRoleDump(source) {
  const normalized = String(source || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const kept = lines.filter(line => !DISPOSABLE_UNSUPPORTED_ROLE_SETTING.test(line));
  const output = kept.join('\n');
  if (!output.trim()) return '';
  return output.endsWith('\n') ? output : `${output}\n`;
}

export {
  DISPOSABLE_UNSUPPORTED_ROLE_SETTING,
  sanitizeSupabaseRoleDump
};
