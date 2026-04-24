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
    console.log(`MP Webhook — Payment ${data.id}: status=${payment.status}, external_reference=${payment.external_reference}`);

    if (payment.status === "approved") {
      // Use service role key to bypass RLS and update the order
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const orderId = payment.external_reference;

      if (!orderId) {
        console.error("MP Webhook: No external_reference found on payment", data.id);
        return new Response("Missing external_reference", { status: 200 });
      }

      // 1. Mark order as "Pago"
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "Pago",
          payment_intent_id: String(payment.id),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError.message);
        return new Response("DB error", { status: 500 });
      }

      // 2. Deduct stock for each item in the order
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          await supabase.rpc("decrement_stock", {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
        console.log(`Stock decremented for order ${orderId} — ${orderItems.length} items`);
      }

      console.log(`Order ${orderId} marked as Pago via MP webhook`);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
