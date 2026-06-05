import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://jracessorios.com", "https://www.jracessorios.com"];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Permite guest checkout: o usuário pode ser anônimo (publishable/anon key).
    // A autorização para chegar aqui já é feita pelo gateway (apikey válida) e a
    // segurança real vem da validação do pedido no banco (existe + não pago).
    await supabase.auth.getUser().catch(() => null);
    // ────────────────────────────────────────────────────────────────────────

    const { orderId, payerEmail, payerCpf, payerName } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId obrigatório" }), {
        status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
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

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured.");
    }

    // Monta o payer com nome e CPF quando disponíveis (o MP exige p/ PIX em muitos casos)
    const cleanCpf = (payerCpf || "").replace(/\D/g, "");
    const nameParts = (payerName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "JR";

    const payer: Record<string, unknown> = {
      email: payerEmail || "cliente@jracessorios.com",
      first_name: firstName,
      last_name: lastName,
    };
    if (cleanCpf.length === 11) {
      payer.identification = { type: "CPF", number: cleanCpf };
    }

    // notification_url tells MP where to POST the payment approval event.
    // Without it, the webhook never fires and orders stay "Aguardando Pagamento".
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    const paymentBody = {
      transaction_amount: Number(totalAmount),
      description: `Pedido JR Acessórios #${orderId.slice(0, 8)}`,
      payment_method_id: "pix",
      external_reference: orderId,
      notification_url: notificationUrl,
      payer,
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
