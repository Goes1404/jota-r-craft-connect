import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// mp-oauth-callback: o MercadoPago redireciona o navegador para cá com
// ?code=...&state=... após o lojista autorizar. Trocamos o code pelos tokens
// OAuth e salvamos. verify_jwt=false: é um redirect de navegador, sem JWT.
// A segurança vem da validação do `state` (gerado e guardado pelo mp-oauth-start).
// ─────────────────────────────────────────────────────────────────────────────

function redirect(base: string, status: "connected" | "error", detail?: string): Response {
  const url = new URL("/admin/commissions", base);
  url.searchParams.set("mp", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 140));
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://jracessorios.com";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) return redirect(APP_BASE_URL, "error", error);
    if (!code || !state) return redirect(APP_BASE_URL, "error", "missing_code_or_state");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
    const MP_REDIRECT_URI = Deno.env.get("MP_REDIRECT_URI");

    if (!MP_CLIENT_ID || !MP_CLIENT_SECRET || !MP_REDIRECT_URI) {
      return redirect(APP_BASE_URL, "error", "app_not_configured");
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Valida o state (CSRF) e o consome.
    const { data: stateRow } = await admin
      .from("mp_oauth_state")
      .select("state")
      .eq("state", state)
      .maybeSingle();
    if (!stateRow) return redirect(APP_BASE_URL, "error", "invalid_state");
    await admin.from("mp_oauth_state").delete().eq("state", state);

    // Troca o code pelos tokens OAuth do lojista.
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
      console.error("MP token exchange failed:", tokenResp.status, await tokenResp.text());
      return redirect(APP_BASE_URL, "error", "token_exchange_failed");
    }

    const token = await tokenResp.json();
    const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000).toISOString();

    // Upsert singleton (id=true): substitui qualquer credencial anterior.
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
      return redirect(APP_BASE_URL, "error", "save_failed");
    }

    console.log(`MP marketplace conectado: user_id=${token.user_id}`);
    return redirect(APP_BASE_URL, "connected");
  } catch (err) {
    console.error("mp-oauth-callback error:", err);
    return redirect(APP_BASE_URL, "error", "unexpected");
  }
});
