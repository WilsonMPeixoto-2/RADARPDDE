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
    return {
      code: "REMOTE_UNAVAILABLE",
      message: "O serviço administrativo de contas está temporariamente indisponível.",
      status: 503,
    };
  }
  if (message.includes("COMPENSATION_FAILED")) {
    return {
      code: "COMPENSATION_FAILED",
      message: "A operação falhou e a restauração automática não foi concluída. Acione a administração técnica.",
      status: 500,
    };
  }
  if (message.includes("NOT_FOUND")) {
    return { code: "NOT_FOUND", message: message.replace(/^.*NOT_FOUND:\s*/i, ""), status: 404 };
  }
  if (message.includes("VALIDATION") || /obrigatóri|inválid/i.test(message)) {
    return { code: "VALIDATION_FAILED", message: message.replace(/^.*VALIDATION_ERROR:\s*/i, ""), status: 400 };
  }
  if (/already|registered|duplicate|unique|vinculad|ACCOUNT_CONFLICT/i.test(message)) {
    const activeBinding = message.match(/ACCOUNT_CONFLICT:\s*(desative o vínculo atual antes de alterar a função[^.]*)/i);
    return {
      code: "ACCOUNT_CONFLICT",
      message: activeBinding?.[1]
        ? `${activeBinding[1]}.`
        : "O e-mail ou a conta já está vinculado a outro integrante.",
      status: 409,
    };
  }
  return { code: "TEAM_ACCOUNT_OPERATION_FAILED", message: "Não foi possível concluir a gestão de acesso da equipe.", status: 500 };
}

async function requestCommand(req: Request) {
  try {
    return normalizeTeamCommand(await req.json());
  } catch (error) {
    const message = String((error as { message?: string })?.message || "Comando de Gestão de Equipe inválido.");
    if (message.includes("VALIDATION_ERROR")) throw error;
    throw new Error(`VALIDATION_ERROR: ${message}`);
  }
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`CONFIGURATION_ERROR: ${name} ausente`);
  return value;
}

async function authorizeRequest(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("AUTHORIZATION_DENIED: sessão ausente");
  }
  const url = requiredEnv("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!publicKey) throw new Error("CONFIGURATION_ERROR: chave publicável ausente");
  const userClient = createClient(url, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) throw new Error("AUTHORIZATION_DENIED: sessão inválida");
  const { data: role, error: roleError } = await userClient.rpc("current_app_role");
  if (roleError || !isTeamManagerRole(role)) {
    throw new Error("AUTHORIZATION_DENIED: perfil sem permissão");
  }
  return { user: userData.user, role: String(role), url };
}

function adminClient(url: string) {
  const secret = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("CONFIGURATION_ERROR: credencial administrativa ausente");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function currentEntity(admin: ReturnType<typeof createClient>, profileId: string, id: string) {
  const table = profileId === "controller" ? "controllers" : "inventory_team_members";
  const { data, error } = await admin
    .from(table)
    .select("id,user_id,name,email,active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; user_id: string | null; name: string; email: string; active: boolean } | null;
}

async function linkedProfileUserId(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  entityId: string,
): Promise<string> {
  const linkColumn = profileId === "controller" ? "controller_id" : "inventory_member_id";
  const { data, error } = await admin
    .from("user_profiles")
    .select("user_id,active")
    .eq("profile_id", profileId)
    .eq(linkColumn, entityId)
    .order("active", { ascending: false })
    .limit(2);
  if (error) throw error;

  const userIds = [...new Set(
    (data || [])
      .map((row: { user_id?: string | null }) => String(row.user_id || "").trim())
      .filter(Boolean),
  )];
  if (userIds.length > 1) {
    throw new Error("ACCOUNT_CONFLICT: integrante vinculado a mais de uma conta");
  }
  return userIds[0] || "";
}

async function resolveMemberUserId(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  entityId: string,
  entityUserId: string | null | undefined,
): Promise<string> {
  const directUserId = String(entityUserId || "").trim();
  const profileUserId = await linkedProfileUserId(admin, profileId, entityId);
  if (directUserId && profileUserId && directUserId !== profileUserId) {
    throw new Error("ACCOUNT_CONFLICT: diretório e perfil apontam para contas diferentes");
  }
  return directUserId || profileUserId;
}

async function authUser(admin: ReturnType<typeof createClient>, userId: string): Promise<User | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw error;
  return data.user || null;
}

async function authUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string> {
  const { data, error } = await admin.rpc("resolve_team_auth_user_id_by_email", {
    p_email: normalizeEmail(email),
  });
  if (error) throw error;
  return String(data || "").trim();
}

async function assertReusableAccount(
  admin: ReturnType<typeof createClient>,
  userId: string,
  targetProfileId: string,
  targetEntityId: string,
) {
  const { data, error } = await admin
    .from("user_profiles")
    .select("profile_id,controller_id,inventory_member_id,active")
    .eq("user_id", userId)
    .eq("active", true)
    .limit(2);
  if (error) throw error;

  const conflicting = (data || []).find((profile: {
    profile_id?: string | null;
    controller_id?: string | null;
    inventory_member_id?: string | null;
  }) => {
    const linkedEntityId = targetProfileId === "controller"
      ? profile.controller_id
      : profile.inventory_member_id;
    return profile.profile_id !== targetProfileId || linkedEntityId !== targetEntityId;
  });

  if (conflicting) {
    throw new Error("ACCOUNT_CONFLICT: desative o vínculo atual antes de alterar a função");
  }
}

function compensationFailure(action: string, cause: unknown): Error {
  const reason = String((cause as { message?: string })?.message || "erro não informado");
  return new Error(`COMPENSATION_FAILED: ${action}: ${reason}`);
}

async function removeInvitedUser(admin: ReturnType<typeof createClient>, userId: string) {
  try {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    throw compensationFailure("não foi possível remover a conta recém-criada", error);
  }
}

function restorationBanDuration(previousUser: User): string {
  const bannedUntil = Date.parse(String(previousUser.banned_until || ""));
  const remainingMs = bannedUntil - Date.now();
  if (!Number.isFinite(bannedUntil) || remainingMs <= 0) return "none";
  return `${Math.max(1, Math.ceil(remainingMs / 3_600_000))}h`;
}

async function restoreUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
  previousUser: User,
) {
  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email: previousUser.email,
      user_metadata: previousUser.user_metadata,
      ban_duration: restorationBanDuration(previousUser),
    });
    if (error) throw error;
  } catch (error) {
    throw compensationFailure("não foi possível restaurar os dados anteriores da conta", error);
  }
}

async function restoreAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
  previousUser: User,
) {
  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: restorationBanDuration(previousUser),
    });
    if (error) throw error;
  } catch (error) {
    throw compensationFailure("não foi possível restaurar o acesso da conta", error);
  }
}

async function saveMember(
  admin: ReturnType<typeof createClient>,
  actor: User,
  command: ReturnType<typeof normalizeTeamCommand>,
) {
  const entity = command.entity!;
  const existing = await currentEntity(admin, command.profileId, entity.id);
  const metadata = buildInviteMetadata(command);
  let userId = await resolveMemberUserId(
    admin,
    command.profileId,
    entity.id,
    existing?.user_id,
  );
  let createdUser = false;
  let reusedExistingAccount = false;
  let previousUser: User | null = null;

  try {
    if (!userId) {
      const existingAuthUserId = await authUserIdByEmail(admin, entity.email);
      if (existingAuthUserId) {
        userId = existingAuthUserId;
        previousUser = await authUser(admin, userId);
        if (!previousUser) throw new Error("NOT_FOUND: conta Auth vinculada não localizada");
        reusedExistingAccount = true;
      }
    }

    if (userId) {
      previousUser = previousUser || await authUser(admin, userId);
      if (!previousUser) throw new Error("NOT_FOUND: conta Auth vinculada não localizada");
      await assertReusableAccount(admin, userId, command.profileId, entity.id);
      const { error } = await admin.auth.admin.updateUserById(userId, {
        email: entity.email,
        user_metadata: metadata,
        ban_duration: "none",
      });
      if (error) throw error;
    } else {
      const options: { data: Record<string, string>; redirectTo?: string } = { data: metadata };
      const redirectTo = Deno.env.get("RADAR_INVITE_REDIRECT_URL");
      if (redirectTo) options.redirectTo = redirectTo;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(entity.email, options);
      if (error || !data.user?.id) throw error || new Error("ACCOUNT_CONFLICT: convite sem usuário");
      userId = data.user.id;
      createdUser = true;
    }

    const { data, error } = await admin.rpc("upsert_team_member_account", {
      p_member: entity,
      p_user_id: userId,
      p_profile_id: command.profileId,
      p_actor_user_id: actor.id,
      p_administrative_log: command.administrativeLog,
    });
    if (error) throw error;
    return {
      ok: true,
      userId,
      invited: createdUser,
      reusedExistingAccount,
      recoveredLink: Boolean(!existing?.user_id && !createdUser && userId),
      result: data,
    };
  } catch (error) {
    if (createdUser && userId) {
      await removeInvitedUser(admin, userId);
    } else if (previousUser && userId) {
      await restoreUser(admin, userId, previousUser);
    }
    throw error;
  }
}

async function deactivateMember(
  admin: ReturnType<typeof createClient>,
  actor: User,
  command: ReturnType<typeof normalizeTeamCommand>,
) {
  const existing = await currentEntity(admin, command.profileId, command.entityId!);
  if (!existing) throw new Error("NOT_FOUND: integrante ativo não localizado");
  const userId = await resolveMemberUserId(
    admin,
    command.profileId,
    command.entityId!,
    existing.user_id,
  );
  let previousUser: User | null = null;
  let banned = false;
  try {
    if (userId) {
      previousUser = await authUser(admin, userId);
      if (!previousUser) throw new Error("NOT_FOUND: conta Auth vinculada não localizada");
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: "876000h",
      });
      if (error) throw error;
      banned = true;
    }

    const rpc = command.profileId === "controller"
      ? "deactivate_controller_account"
      : "deactivate_inventory_member_account";
    const args = command.profileId === "controller"
      ? {
        p_controller_id: command.entityId,
        p_fallback_controller_id: command.fallbackControllerId,
        p_actor_user_id: actor.id,
        p_administrative_log: command.administrativeLog,
      }
      : {
        p_member_id: command.entityId,
        p_actor_user_id: actor.id,
        p_administrative_log: command.administrativeLog,
      };
    const { data, error } = await admin.rpc(rpc, args);
    if (error) throw error;
    return { ok: true, userId, accessDisabled: Boolean(userId), recoveredLink: Boolean(!existing.user_id && userId), result: data };
  } catch (error) {
    if (banned && userId && previousUser) {
      await restoreAccess(admin, userId, previousUser);
    }
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  let headers: Record<string, string> = {};
  try {
    headers = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST") {
      return json(405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Método não permitido." }, headers);
    }

    const { user, url } = await authorizeRequest(req);
    const command = await requestCommand(req);
    const admin = adminClient(url);
    const result = command.operation.startsWith("save_")
      ? await saveMember(admin, user, command)
      : await deactivateMember(admin, user, command);
    return json(200, result, headers);
  } catch (error) {
    const mapped = publicError(error);
    console.error("team-account-management", {
      code: mapped.code,
      status: mapped.status,
    });
    return json(mapped.status, { ok: false, code: mapped.code, message: mapped.message }, headers);
  }
});
