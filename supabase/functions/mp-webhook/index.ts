import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();

    // Mercado Pago sends a 'type' field to identify the event
    const { type, data } = body;

    if (type !== "payment") {
      return new Response("Ignored event type", { status: 200 });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Fetch the actual payment from MP to verify
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: {
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    const payment = await mpResponse.json();

    if (payment.status === "approved") {
      // Use service role key to bypass RLS and update the order
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const orderId = payment.external_reference;

      await supabase
        .from("orders")
        .update({
          status: "Pago",
          payment_intent_id: String(payment.id),
        })
        .eq("id", orderId);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
