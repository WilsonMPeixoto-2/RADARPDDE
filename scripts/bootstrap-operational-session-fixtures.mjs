import { createClient } from '@supabase/supabase-js';

// A preparação usa Admin apenas fora da jornada. O teste entra pela UI como
// Controlador real e toda mutação da jornada passa pelos controles do produto.
const url = new URL(process.env.RADAR_SUPABASE_URL || '');
if (process.env.RADAR_ALLOW_LOCAL_AUTH_BOOTSTRAP !== 'true'
    || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  throw new Error('Fixtures de sessão exigem Supabase local descartável.');
}
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (password.length < 24 || !process.env.RADAR_SUPABASE_ADMIN_KEY) {
  throw new Error('Credenciais efêmeras de teste incompletas.');
}
const client = createClient(url.href, process.env.RADAR_SUPABASE_ADMIN_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
async function requireResult(operation, label) {
  const result = await operation;
  if (result.error) throw new Error(`${label}: ${result.error.code || 'falha'}`);
  return result.data;
}
const existing = await requireResult(client.auth.admin.listUsers(), 'Consultar identidades locais');
for (let index = 1; index <= 4; index += 1) {
  const email = `operational-${index}@radar.local`;
  const user = existing.users.find(item => item.email === email);
  const attrs = { email, password, email_confirm: true };
  const data = await requireResult(user
    ? client.auth.admin.updateUserById(user.id, attrs)
    : client.auth.admin.createUser(attrs), 'Preparar identidade local');
  const controllerId = `operational-controller-${index}`;
  const linked = await requireResult(client.from('controllers').update({ user_id: data.user.id })
    .eq('id', controllerId).select('id').single(), 'Vincular Controlador');
  if (linked.id !== controllerId) throw new Error('Contexto institucional local ausente.');
  await requireResult(client.from('user_profiles').upsert({
    user_id: data.user.id, profile_id: 'controller', controller_id: controllerId,
    cre_scope: '4ª CRE', active: true
  }, { onConflict: 'user_id,profile_id' }), 'Vincular perfil');
  // A avaliação vazia será materializada pela própria operação de negócio.
}
console.log('Quatro Controladores e três contextos isolados preparados para jornadas concorrentes.');
