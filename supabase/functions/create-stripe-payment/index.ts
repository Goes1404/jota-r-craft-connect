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
    const { orderId, totalAmount, description } = await req.json();

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured in Supabase secrets.");
    }

    // Create a Stripe Payment Intent for credit card processing
    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: Math.round(totalAmount * 100).toString(), // Stripe uses cents
        currency: "brl",
        description: description || "Compra JR Acessórios - Lumina Tech",
        metadata: JSON.stringify({ orderId }),
        "payment_method_types[]": "card",
        automatic_payment_methods: "false",
      }),
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stripe PaymentIntent error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
