import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Domínios permitidos (com e sem www). ALLOWED_ORIGIN pode adicionar outro.
const ALLOWED_ORIGINS = [
  "https://jracessorios.com",
  "https://www.jracessorios.com",
  Deno.env.get("ALLOWED_ORIGIN"),
].filter(Boolean) as string[];

function corsHeadersFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Sem checagem de JWT do usuário: a função aceita guest checkout.
    // Toda a segurança está no banco (lê total_amount do banco, exige status
    // "Aguardando Pagamento", usa service_role). verify_jwt=false na config.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    const { orderId, payerEmail } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Busca o total real do pedido no banco (não confia no frontend) ───────
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, total_amount, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: "Pedido não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "Aguardando Pagamento") {
      return new Response(JSON.stringify({ success: false, error: "Pedido já processado" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalAmount = order.total_amount; // fonte da verdade: banco
    // ────────────────────────────────────────────────────────────────────────

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured.");
    }

    const paymentBody = {
      transaction_amount: Number(totalAmount),
      description: `Pedido JR Acessórios #${orderId.slice(0, 8)}`,
      payment_method_id: "pix",
      external_reference: orderId,
      payer: { email: payerEmail || "cliente@jracessorios.com" },
    };

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
      return new Response(
        JSON.stringify({ success: false, error: `MP API ${mpResponse.status}: ${mpData.message}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("PIX function error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
