import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook: falha na verificação de assinatura");
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Idempotência: só processa se ainda não está Pago ────────────────────
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("status, payment_intent_id")
      .eq("id", orderId)
      .single();

    if (existingOrder?.status === "Pago") {
      return new Response(JSON.stringify({ received: true, skipped: "already_paid" }), { status: 200 });
    }
    // ────────────────────────────────────────────────────────────────────────

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "Pago", payment_intent_id: paymentIntent.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Stripe webhook: erro ao atualizar pedido", updateError.message);
      return new Response("DB error", { status: 500 });
    }

    // Decrementa estoque
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
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
