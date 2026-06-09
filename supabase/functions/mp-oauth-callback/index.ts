import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function htmlPage(title: string, body: string, color: string): Response {
  return new Response(
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa}.box{background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1)}h1{color:${color};margin-top:0}p{color:#555;line-height:1.6}a{display:inline-block;margin-top:20px;padding:12px 28px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600}</style></head><body><div class="box">${body}</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

Deno.serve(async (req) => {
  const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://jracessorios.com";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return htmlPage("Erro OAuth", `<h1>❌ Erro ao conectar</h1><p>MercadoPago retornou: <strong>${error}</strong></p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
    }
    if (!code || !state) {
      return htmlPage("Erro OAuth", `<h1>❌ Parâmetros ausentes</h1><p>code ou state não recebidos.</p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
    const MP_REDIRECT_URI = Deno.env.get("MP_REDIRECT_URI");

    if (!MP_CLIENT_ID || !MP_CLIENT_SECRET || !MP_REDIRECT_URI) {
      return htmlPage("Erro de configuração", `<h1>❌ App não configurado</h1><p>Secrets MP_CLIENT_ID, MP_CLIENT_SECRET ou MP_REDIRECT_URI não encontrados no Supabase.</p>`, "#e53e3e");
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: stateRow } = await admin
      .from("mp_oauth_state")
      .select("state")
      .eq("state", state)
      .maybeSingle();
    if (!stateRow) {
      return htmlPage("Erro de segurança", `<h1>❌ State inválido</h1><p>Este link de autorização já foi usado ou expirou. Gere um novo link no painel.</p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
    }
    await admin.from("mp_oauth_state").delete().eq("state", state);

    const tokenResp = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: MP_REDIRECT_URI,
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      console.error("MP token exchange failed:", tokenResp.status, errText);
      return htmlPage("Erro no exchange", `<h1>❌ Falha ao obter token</h1><p>MercadoPago retornou HTTP ${tokenResp.status}:</p><pre style="background:#f0f0f0;padding:12px;border-radius:6px;text-align:left;font-size:13px;overflow:auto">${errText.slice(0, 600)}</pre><p>Verifique se MP_CLIENT_SECRET e MP_REDIRECT_URI no Supabase estão corretos.</p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
    }

    const token = await tokenResp.json();
    const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000).toISOString();

    const { error: upsertErr } = await admin
      .from("mp_marketplace_credentials")
      .upsert({
        id: true,
        mp_user_id: String(token.user_id ?? ""),
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        public_key: token.public_key ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (upsertErr) {
      console.error("MP creds upsert failed:", upsertErr.message);
      return htmlPage("Erro ao salvar", `<h1>❌ Erro ao salvar credenciais</h1><p>${upsertErr.message}</p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
    }

    console.log(`MP marketplace conectado: user_id=${token.user_id}`);
    return htmlPage("Conectado!", `<h1>✅ MercadoPago conectado!</h1><p>Split automático 10/90 ativo. O lojista (user_id: ${token.user_id}) está vinculado.</p><a href="${APP_BASE_URL}/admin/commissions">Ver painel de comissões</a>`, "#38a169");
  } catch (err) {
    console.error("mp-oauth-callback error:", err);
    return htmlPage("Erro inesperado", `<h1>❌ Erro inesperado</h1><p>${String(err)}</p><a href="${APP_BASE_URL}/admin/commissions">Voltar ao painel</a>`, "#e53e3e");
  }
});
