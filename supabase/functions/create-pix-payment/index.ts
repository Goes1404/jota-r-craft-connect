import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, totalAmount, description, payerEmail } = await req.json();

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured in Supabase secrets.");
    }

    // Create a PIX payment via Mercado Pago API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        transaction_amount: totalAmount,
        description: description || "Compra JR Acessórios - Lumina Tech",
        payment_method_id: "pix",
        payer: {
          email: payerEmail || "cliente@jracessorios.com.br",
        },
        external_reference: orderId,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      }),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.json();
      throw new Error(`MercadoPago API error: ${JSON.stringify(errorBody)}`);
    }

    const mpData = await mpResponse.json();

    // Extract PIX data from response
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
    console.error("PIX generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
