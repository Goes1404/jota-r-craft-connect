import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Compara duas strings hex em tempo constante (evita timing attack). */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MERCADOPAGO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("MP Webhook: missing environment variables");
      return new Response("Missing env vars", { status: 500 });
    }

    // ── Validação de assinatura do Mercado Pago ──────────────────────────────
    // Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") || Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

    // Fail-closed: sem o secret configurado NÃO processamos o webhook. Antes,
    // a ausência do secret fazia a validação ser pulada (fail-open), permitindo
    // requisições forjadas. Agora rejeitamos explicitamente.
    if (!MP_WEBHOOK_SECRET) {
      console.error("MP Webhook: MP_WEBHOOK_SECRET not configured — rejecting (fail-closed)");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id");

    if (!xSignature) {
      console.warn("MP Webhook: missing x-signature header — rejecting");
      return new Response("Unauthorized", { status: 401 });
    }

    // Extrai ts e v1 do header x-signature
    const parts = Object.fromEntries(
      xSignature.split(",").map((p) => p.trim().split("=") as [string, string])
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];

    if (!ts || !v1) {
      return new Response("Invalid signature format", { status: 401 });
    }

    // Monta o manifest conforme documentação do MP
    const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(MP_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(manifest)
    );
    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparação em tempo constante para evitar timing side-channel.
    if (!timingSafeEqualHex(computedHash, v1)) {
      console.warn("MP Webhook: signature mismatch — rejecting");
      return new Response("Unauthorized", { status: 401 });
    }
    // ────────────────────────────────────────────────────────────────────────

    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment") {
      return new Response("Ignored event type", { status: 200 });
    }

    // Busca o pagamento real na API do MP para verificar status
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });

    if (!mpResponse.ok) {
      console.error("MP Webhook: falha ao buscar pagamento", data.id);
      return new Response("Payment fetch failed", { status: 200 });
    }

    const payment = await mpResponse.json();

    console.log(`MP Webhook — Payment ${data.id}: status=${payment.status}, ref=${payment.external_reference}`);

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      console.error("MP Webhook: no external_reference on payment", data.id);
      return new Response("Missing external_reference", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Idempotência: não reprocessar se já está Pago
    const { data: order } = await supabase
      .from("orders")
      .select("status, customer_email, customer_name, total_amount, shipping_address")
      .eq("id", orderId)
      .single();

    if (order?.status === "Pago") {
      console.log(`Order ${orderId} already Pago — skipping duplicate MP webhook`);
      return new Response("Already processed", { status: 200 });
    }

    // 1. Mark order as Pago
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "Pago", payment_intent_id: String(payment.id) })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError.message);
      return new Response("DB error", { status: 500 });
    }

    // 2. Deduct stock
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

    // 3. Send confirmation email (fire-and-forget)
    if (order?.customer_email) {
      supabase.functions.invoke("send-email", {
        body: {
          type: "order_confirmed",
          to: order.customer_email,
          customerName: order.customer_name,
          orderId,
          totalAmount: order.total_amount,
          shippingAddress: order.shipping_address,
        },
      }).catch((err) => console.error("send-email failed:", err));
    }

    console.log(`Order ${orderId} marked Pago via MP webhook`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("MP Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
