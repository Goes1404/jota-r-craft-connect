import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://jracessorios.com" || origin === "https://www.jracessorios.com") return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (origin && isAllowedOrigin(origin)) ? origin : "https://jracessorios.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    // ── Autenticação obrigatória ─────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const { orderId, description } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId obrigatório" }), {
        status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured.");
    }

    // ── Busca total real do pedido no banco ──────────────────────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, total_amount, status, payment_intent_id")
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
    // ────────────────────────────────────────────────────────────────────────

    const params = new URLSearchParams();
    params.append("amount", Math.round(Number(totalAmount) * 100).toString());
    params.append("currency", "brl");
    params.append("description", description || "Compra JR Acessórios");
    params.append("metadata[orderId]", orderId);
    params.append("payment_method_types[]", "card");

    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `pi-${orderId}`,
      },
      body: params,
    });

    if (!stripeResponse.ok) {
      const errorBody = await stripeResponse.json();
      throw new Error(`Stripe API error: ${JSON.stringify(errorBody)}`);
    }

    const stripeData = await stripeResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: stripeData.client_secret,
        paymentIntentId: stripeData.id,
      }),
      { headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stripe PaymentIntent error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
