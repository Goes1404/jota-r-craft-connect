import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://jracessorios.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Autenticação obrigatória ─────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    // Permite guest checkout (user pode ser null), mas valida o token se presente
    if (authError && authHeader !== `Bearer ${SUPABASE_ANON_KEY}`) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ────────────────────────────────────────────────────────────────────────

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
      payer: { email: payerEmail || "cliente@jracessorios.com.br" },
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
