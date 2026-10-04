import { createClient } from '@supabase/supabase-js';

// A preparação usa Admin apenas fora da jornada. Os testes entram pela UI com
// perfis reais e toda mutação da jornada passa pelos controles do produto.
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
async function ensureUser(existingUsers, email) {
  const user = existingUsers.find(item => item.email === email);
  const attrs = { email, password, email_confirm: true };
  const data = await requireResult(user
    ? client.auth.admin.updateUserById(user.id, attrs)
    : client.auth.admin.createUser(attrs), `Preparar identidade ${email}`);
  return data.user;
}

const existing = await requireResult(client.auth.admin.listUsers(), 'Consultar identidades locais');
for (let index = 1; index <= 6; index += 1) {
  const email = `operational-${index}@radar.local`;
  const user = await ensureUser(existing.users, email);
  const controllerId = `operational-controller-${index}`;
  const linked = await requireResult(client.from('controllers').update({ user_id: user.id })
    .eq('id', controllerId).select('id').single(), 'Vincular Controlador');
  if (linked.id !== controllerId) throw new Error('Contexto institucional local ausente.');
  await requireResult(client.from('user_profiles').upsert({
    user_id: user.id, profile_id: 'controller', controller_id: controllerId,
    cre_scope: '4ª CRE', active: true
  }, { onConflict: 'user_id,profile_id' }), 'Vincular perfil de Controlador');
}

const assistant = await ensureUser(existing.users, 'operational-assistant@radar.local');
await requireResult(client.from('user_profiles').upsert({
  user_id: assistant.id,
  profile_id: 'federal_assistant',
  controller_id: null,
  inventory_member_id: null,
  cre_scope: '4ª CRE',
  active: true
}, { onConflict: 'user_id,profile_id' }), 'Vincular perfil de Assistente de Verbas Federais');

console.log('Seis Controladores, seis escolas distintas e uma Assistente de Verbas Federais preparados para jornadas concorrentes.');