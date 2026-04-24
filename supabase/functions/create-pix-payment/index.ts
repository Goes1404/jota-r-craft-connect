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
    const { orderId, totalAmount, payerEmail } = await req.json();

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured.");
    }

    console.log("Creating PIX payment for order:", orderId, "amount:", totalAmount);

    const paymentBody = {
      transaction_amount: Number(totalAmount),
      description: `Pedido JR Acessórios #${orderId?.slice(0, 8) || 'N/A'}`,
      payment_method_id: "pix",
      external_reference: orderId, // CRITICAL: Links the MP payment back to our order for webhook confirmation
      payer: {
        email: payerEmail || "test_user@testuser.com",
      },
    };

    console.log("Request body:", JSON.stringify(paymentBody));

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MercadoPago API error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `MP API ${mpResponse.status}: ${mpData.message || JSON.stringify(mpData)}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PIX payment created successfully. ID:", mpData.id, "external_reference:", orderId);

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
    console.error("PIX function error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
