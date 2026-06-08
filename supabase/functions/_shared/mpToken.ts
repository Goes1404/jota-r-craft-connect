// ─────────────────────────────────────────────────────────────────────────────
// Helper de credenciais OAuth do MercadoPago (marketplace / split).
//
// getSellerAccessToken(): devolve um access_token válido do lojista para criar
// pagamentos com application_fee (split 10/90). Se faltarem credenciais ou o
// app marketplace não estiver configurado, devolve null — e quem chama faz
// fallback para o MERCADOPAGO_ACCESS_TOKEN estático (sem split).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Renova o token alguns minutos antes de expirar para evitar corrida.
const REFRESH_SKEW_MS = 5 * 60 * 1000;

interface MpCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Retorna o access_token OAuth do lojista, renovando-o se estiver perto de
 * expirar. Retorna null quando não há credenciais conectadas ou faltam os
 * secrets do app marketplace (MP_CLIENT_ID / MP_CLIENT_SECRET).
 */
export async function getSellerAccessToken(
  admin: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await admin
    .from("mp_marketplace_credentials")
    .select("access_token, refresh_token, expires_at")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const creds = data as MpCredentials;
  const expiresAt = new Date(creds.expires_at).getTime();

  // Token ainda válido com folga: usa direto.
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > REFRESH_SKEW_MS) {
    return creds.access_token;
  }

  // Token expirado/perto de expirar: tenta renovar.
  const refreshed = await refreshToken(admin, creds.refresh_token);
  // Se a renovação falhar mas o token ainda não expirou de fato, usa o atual.
  if (!refreshed && Number.isFinite(expiresAt) && expiresAt > Date.now()) {
    return creds.access_token;
  }
  return refreshed;
}

async function refreshToken(
  admin: SupabaseClient,
  refresh_token: string,
): Promise<string | null> {
  const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
  const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
  if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) return null;

  const resp = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  if (!resp.ok) {
    console.error("MP token refresh failed:", resp.status, await resp.text());
    return null;
  }

  const token = await resp.json();
  const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000).toISOString();

  await admin
    .from("mp_marketplace_credentials")
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  return token.access_token as string;
}

/** Cria um client admin (service_role) — atalho usado pelas edge functions. */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
