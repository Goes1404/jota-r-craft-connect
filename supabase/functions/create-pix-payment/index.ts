import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORE_URL = Deno.env.get('STORE_URL') || "https://jracessorios.com";
const STORE_NAME = Deno.env.get('STORE_NAME') || "JR Acessórios";

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
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

// Busca o access_token OAuth do lojista (split automático 10/90).
// Retorna null se não houver credenciais — fallback para token estático.
async function getSellerToken(admin: ReturnType<typeof createClient>): Promise<string | null> {
  try {
    const { data, error } = await admin
      .from("mp_marketplace_credentials")
      .select("access_token, refresh_token, expires_at")
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const expiresAt = new Date(data.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt - Date.now() > 5 * 60 * 1000) {
      return data.access_token as string;
    }
    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
    if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) return data.access_token as string;
    const resp = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: MP_CLIENT_ID, client_secret: MP_CLIENT_SECRET, grant_type: "refresh_token", refresh_token: data.refresh_token }),
    });
    if (!resp.ok) return data.access_token as string;
    const token = await resp.json();
    const newExpiry = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000).toISOString();
    await admin.from("mp_marketplace_credentials").update({ access_token: token.access_token, refresh_token: token.refresh_token ?? data.refresh_token, expires_at: newExpiry, updated_at: new Date().toISOString() }).eq("id", true);
    return token.access_token as string;
  } catch { return null; }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });

  try {
    const { orderId, payerEmail, payerCpf, payerName } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId obrigatório" }), {
        status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, total_amount, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: "Pedido não encontrado" }), {
        status: 404, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    if (order.status !== "Aguardando Pagamento") {
      return new Response(JSON.stringify({ success: false, error: "Pedido já processado" }), {
        status: 409, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const totalAmount = order.total_amount; // fonte da verdade: banco
    const platformFeeAmount = Math.round(Number(totalAmount) * 0.10 * 100) / 100;

    // Salva a comissão do desenvolvedor (10%) logo na criação do PIX
    await adminClient
      .from("orders")
      .update({ platform_fee_amount: platformFeeAmount })
      .eq("id", orderId);
    // ────────────────────────────────────────────────────────────────────────

    const sellerToken = await getSellerToken(adminClient);
    const MERCADOPAGO_ACCESS_TOKEN = sellerToken || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const useSplit = !!sellerToken;
    if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured.");

    // Monta o payer com nome e CPF quando disponíveis (o MP exige p/ PIX em muitos casos)
    const cleanCpf = (payerCpf || "").replace(/\D/g, "");
    const nameParts = (payerName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "JR";

    const payer: Record<string, unknown> = {
      email: payerEmail || `cliente@${STORE_URL.replace(/^https?:\/\/(www\.)?/, '')}`,
      first_name: firstName,
      last_name: lastName,
    };
    if (cleanCpf.length === 11) {
      payer.identification = { type: "CPF", number: cleanCpf };
    }

    // notification_url tells MP where to POST the payment approval event.
    // Without it, the webhook never fires and orders stay "Aguardando Pagamento".
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    const paymentBody: Record<string, unknown> = {
      transaction_amount: Number(totalAmount),
      description: `Pedido ${STORE_NAME} #${orderId.slice(0, 8)}`,
      payment_method_id: "pix",
      external_reference: orderId,
      notification_url: notificationUrl,
      payer,
    };

    // Comissão da plataforma (10%) — só é aceita com token OAuth do lojista.
    if (useSplit) {
      paymentBody.application_fee = platformFeeAmount;
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${orderId}-pix`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      // MP's detailed error is usually in cause[0].description
      const cause = mpData.cause?.[0];
      const detail = cause?.description || cause?.code || mpData.message || JSON.stringify(mpData);
      console.error("MP PIX error:", mpResponse.status, JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ success: false, error: `MP ${mpResponse.status}: ${detail}` }),
        { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const pixData = {
      paymentId: mpData.id,
      status: mpData.status,
      qrCode: mpData.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: mpData.point_of_interaction?.transaction_data?.ticket_url,
      expiresAt: mpData.date_of_expiration,
    };

    return new Response(JSON.stringify({ success: true, pix: pixData }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("PIX function error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
