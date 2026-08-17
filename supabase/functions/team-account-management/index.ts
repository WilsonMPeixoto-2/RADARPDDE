import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2.112.3";
import {
  buildInviteMetadata,
  isTeamManagerRole,
  normalizeEmail,
  normalizeTeamCommand,
} from "../_shared/team-account-domain.mjs";
import { corsHeadersForOrigin } from "../_shared/cors-policy.mjs";

function configuredAllowedOrigins(): string {
  return [
    Deno.env.get("RADAR_ALLOWED_ORIGIN"),
    Deno.env.get("RADAR_ALLOWED_ORIGINS"),
  ].filter(Boolean).join(",");
}

function corsHeaders(req: Request): Record<string, string> {
  return corsHeadersForOrigin(
    req.headers.get("Origin") || "",
    configuredAllowedOrigins(),
  );
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function publicError(error: unknown): { code: string; message: string; status: number } {
  const message = String((error as { message?: string })?.message || "Falha na gestão de acesso da equipe.");
  if (message.includes("ORIGIN_DENIED")) {
    return { code: "ORIGIN_DENIED", message: "Origem não autorizada.", status: 403 };
  }
  if (message.includes("AUTHORIZATION_DENIED")) {
    return { code: "PERMISSION_DENIED", message: "Perfil sem permissão para gerir a equipe.", status: 403 };
  }
  if (message.includes("CONFIGURATION_ERROR")) {
    return { code: "CONFIGURATION_ERROR", message: "Serviço de gestão de equipe não configurado.", status: 503 };
  }
  if (message.includes("ALREADY_LINKED")) {
    return { code: "ACCOUNT_CONFLICT", message: "Esta conta já está vinculada a outro perfil ativo.", status: 409 };
  }
  if (message.includes("EMAIL_NOT_FOUND")) {
    return { code: "ACCOUNT_NOT_FOUND", message: "A conta informada não foi localizada.", status: 404 };
  }
  if (message.includes("PROFILE_CONFLICT")) {
    return { code: "ACCOUNT_CONFLICT", message: "A conta possui outro perfil ativo e não pode ser reutilizada.", status: 409 };
  }
  return { code: "TEAM_ACCOUNT_ERROR", message: "Não foi possível concluir a gestão da equipe.", status: 500 };
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("CONFIGURATION_ERROR: Supabase admin credentials ausentes");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function bearerToken(req: Request): string {
  const authorization = req.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new Error("AUTHORIZATION_DENIED: token ausente");
  return match[1];
}

async function requireTeamManager(req: Request, admin: ReturnType<typeof createAdminClient>): Promise<User> {
  const token = bearerToken(req);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new Error("AUTHORIZATION_DENIED: sessão inválida");

  const { data: role, error: roleError } = await admin.rpc("current_app_role", {
    p_user_id: userData.user.id,
  });
  if (roleError || !isTeamManagerRole(role)) {
    throw new Error("AUTHORIZATION_DENIED: perfil sem permissão");
  }
  return userData.user;
}

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string): Promise<User | null> {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => normalizeEmail(user.email) === email);
    if (match) return match;
    if (!data.nextPage) return null;
    page = data.nextPage;
  }
}

async function linkedActiveProfile(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from("user_profiles")
    .select("user_id, app_role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureReusableUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  metadata: Record<string, unknown>,
): Promise<{ user: User; invited: boolean }> {
  const existing = await findUserByEmail(admin, email);
  if (!existing) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: metadata });
    if (error || !data.user) throw error || new Error("ACCOUNT_NOT_FOUND: convite sem usuário");
    return { user: data.user, invited: true };
  }

  const activeProfile = await linkedActiveProfile(admin, existing.id);
  if (activeProfile) throw new Error("PROFILE_CONFLICT: usuário com perfil ativo");

  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    ban_duration: "none",
    user_metadata: { ...(existing.user_metadata || {}), ...metadata },
  });
  if (error || !data.user) throw error || new Error("ACCOUNT_NOT_FOUND: atualização sem usuário");
  return { user: data.user, invited: false };
}

async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }
  if (req.method !== "POST") {
    return json(405, { code: "METHOD_NOT_ALLOWED", message: "Método não permitido." }, headers);
  }

  try {
    const admin = createAdminClient();
    const actor = await requireTeamManager(req, admin);
    const command = normalizeTeamCommand(await req.json());

    if (command.action === "invite") {
      const reusable = await ensureReusableUser(
        admin,
        command.email,
        buildInviteMetadata(command),
      );
      return json(200, {
        ok: true,
        userId: reusable.user.id,
        invited: reusable.invited,
        actorUserId: actor.id,
      }, headers);
    }

    if (command.action === "disable") {
      const target = await findUserByEmail(admin, command.email);
      if (!target) throw new Error("EMAIL_NOT_FOUND: usuário ausente");
      const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: "876000h" });
      if (error) throw error;
      return json(200, { ok: true, userId: target.id, actorUserId: actor.id }, headers);
    }

    if (command.action === "enable") {
      const target = await findUserByEmail(admin, command.email);
      if (!target) throw new Error("EMAIL_NOT_FOUND: usuário ausente");
      const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: "none" });
      if (error) throw error;
      return json(200, { ok: true, userId: target.id, actorUserId: actor.id }, headers);
    }

    throw new Error("VALIDATION_ERROR: ação desconhecida");
  } catch (error) {
    const mapped = publicError(error);
    console.error(JSON.stringify({ code: mapped.code, message: String((error as Error)?.message || error) }));
    return json(mapped.status, { code: mapped.code, message: mapped.message }, headers);
  }
}

Deno.serve(handler);
