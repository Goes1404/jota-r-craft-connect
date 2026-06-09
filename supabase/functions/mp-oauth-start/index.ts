import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// mp-oauth-start: gera o link de autorização do MercadoPago para o lojista
// conectar a conta dele ao marketplace do desenvolvedor. Somente admin.
//
// Fluxo: admin abre o link → autoriza no MP → MP redireciona para o
// mp-oauth-callback com ?code=... → callback troca por tokens e salva.
// ─────────────────────────────────────────────────────────────────────────────

const STORE_URL = Deno.env.get('STORE_URL') || "https://jracessorios.com";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === STORE_URL || origin === STORE_URL.replace('https://', 'https://www.')) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (origin && isAllowedOrigin(origin)) ? origin : STORE_URL;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Valida que quem chama é admin (a segurança real, já que verify_jwt=false).
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
    if (adminErr || isAdmin !== true) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_REDIRECT_URI = Deno.env.get("MP_REDIRECT_URI");
    if (!MP_CLIENT_ID || !MP_REDIRECT_URI) {
      return new Response(
        JSON.stringify({ success: false, error: "App marketplace não configurado (MP_CLIENT_ID / MP_REDIRECT_URI)." }),
        { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    // Gera e persiste um state para validar no callback (proteção CSRF).
    const state = crypto.randomUUID();
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Limpa states antigos (> 1h) e insere o novo.
    await admin.from("mp_oauth_state").delete().lt(
      "created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    );
    await admin.from("mp_oauth_state").insert({ state });

    const authUrl = new URL("https://auth.mercadopago.com/authorization");
    authUrl.searchParams.set("client_id", MP_CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("platform_id", "mp");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("redirect_uri", MP_REDIRECT_URI);

    return new Response(
      JSON.stringify({ success: true, authUrl: authUrl.toString() }),
      { headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("mp-oauth-start error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
    );
  }
});
