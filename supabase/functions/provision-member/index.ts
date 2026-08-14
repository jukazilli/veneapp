import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.111.0"

type InviteBody = {
  action: "invite"
  email: string
  password: string
  fullName: string
  role: "admin" | "agent" | "attendant"
}

type CompleteFirstAccessBody = { action: "complete_first_access" }
type CleanupBody = { action: "cleanup_invite"; userId: string }
type RequestBody = InviteBody | CompleteFirstAccessBody | CleanupBody

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405)

  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sessão ausente." }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Função não configurada." }, 500)

  const token = authorization.slice("Bearer ".length)
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error: userError } = await userClient.auth.getUser(token)
  if (userError || !user) return json({ error: "Sessão inválida." }, 401)

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("id,organization_id,role,active,must_change_password")
    .eq("id", user.id)
    .single()
  if (profileError || !profile?.active) return json({ error: "Perfil ativo não encontrado." }, 403)

  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return json({ error: "Requisição inválida." }, 400)
  }

  if (body.action === "complete_first_access") {
    if (!profile.must_change_password) return json({ ok: true })
    const { error } = await adminClient
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id)
      .eq("must_change_password", true)
    return error ? json({ error: "Não foi possível concluir o primeiro acesso." }, 500) : json({ ok: true })
  }

  if (profile.role !== "owner" && profile.role !== "admin") {
    return json({ error: "Seu perfil não pode gerenciar convites." }, 403)
  }

  if (body.action === "cleanup_invite") {
    const { data: invited } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", body.userId)
      .eq("organization_id", profile.organization_id)
      .eq("invited_by", user.id)
      .maybeSingle()
    if (!invited) return json({ error: "Convite não encontrado." }, 404)
    const { error } = await adminClient.auth.admin.deleteUser(body.userId)
    return error ? json({ error: "Não foi possível desfazer o convite." }, 500) : json({ ok: true })
  }

  if (body.action !== "invite"
      || !body.email
      || !body.password
      || !body.fullName
      || !["admin", "agent", "attendant"].includes(body.role)) {
    return json({ error: "Dados de convite inválidos." }, 400)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.fullName },
    app_metadata: {
      veneapp_invitation: true,
      organization_id: profile.organization_id,
      organization_role: body.role,
      invited_by: user.id,
    },
  })

  if (createError || !created.user) {
    const alreadyExists = createError?.message.toLowerCase().includes("already")
      || createError?.message.toLowerCase().includes("registered")
    return json({
      error: alreadyExists ? "Este e-mail já possui uma conta." : "Não foi possível criar o acesso convidado.",
      code: alreadyExists ? "already_exists" : "provision_failed",
    }, alreadyExists ? 409 : 500)
  }

  return json({ userId: created.user.id }, 201)
})
