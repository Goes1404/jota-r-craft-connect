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
      console.warn("Stripe webhook: no orderId in metadata");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Idempotência: só processa se ainda não está Pago ────────────────────
    const { data: order } = await supabase
      .from("orders")
      .select("status, customer_email, customer_phone, customer_name, total_amount, shipping_address")
      .eq("id", orderId)
      .single();

    if (order?.status === "Pago") {
      console.log(`Order ${orderId} already Pago — skipping duplicate webhook`);
      return new Response(JSON.stringify({ received: true, skipped: "already_paid" }), { status: 200 });
    }
    // ────────────────────────────────────────────────────────────────────────

    // 1. Mark order as Pago
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "Pago", payment_intent_id: paymentIntent.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Stripe webhook: erro ao atualizar pedido", updateError.message);
      return new Response("DB error", { status: 500 });
    }

    // 2. Decrement stock
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

    // 3. Send confirmation and notifications (await in parallel before responding to avoid serverless freeze)
    const notificationPromises = [];

    if (order?.customer_email) {
      notificationPromises.push(
        supabase.functions.invoke("send-email", {
          body: {
            type: "order_confirmed",
            to: order.customer_email,
            customerName: order.customer_name,
            orderId,
            totalAmount: order.total_amount,
            shippingAddress: order.shipping_address,
          },
        }).then((res) => {
          if (res.error) console.error("send-email customer error:", res.error);
          else console.log("send-email customer success:", res.data);
        }).catch((err) => console.error("send-email customer failed:", err))
      );
    }

    if (order?.customer_phone) {
      notificationPromises.push(
        supabase.functions.invoke("send-whatsapp", {
          body: {
            to: order.customer_phone,
            customerName: order.customer_name,
            orderId,
            totalAmount: order.total_amount,
          },
        }).then((res) => {
          if (res.error) console.error("send-whatsapp error:", res.error);
          else console.log("send-whatsapp success:", res.data);
        }).catch((err) => console.error("send-whatsapp failed:", err))
      );
    }

    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
    if (ADMIN_EMAIL) {
      notificationPromises.push(
        supabase.functions.invoke("send-email", {
          body: {
            type: "admin_new_order",
            to: ADMIN_EMAIL,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            orderId,
            totalAmount: order.total_amount,
            shippingAddress: order.shipping_address,
          },
        }).then((res) => {
          if (res.error) console.error("send-email admin error:", res.error);
          else console.log("send-email admin success:", res.data);
        }).catch((err) => console.error("send-email admin failed:", err))
      );
    }

    if (notificationPromises.length > 0) {
      console.log(`Awaiting ${notificationPromises.length} notification promises...`);
      await Promise.allSettled(notificationPromises);
    }

    console.log(`Order ${orderId} marked Pago via Stripe`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
