import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // ── Validação de assinatura do Mercado Pago ──────────────────────────────
    // Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET");

    if (MP_WEBHOOK_SECRET) {
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
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
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

      if (computedHash !== v1) {
        console.warn("MP Webhook: signature mismatch — rejecting");
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.warn("MP Webhook: MP_WEBHOOK_SECRET not configured — skipping signature check");
    }
    // ────────────────────────────────────────────────────────────────────────

    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment") {
      return new Response("Ignored event type", { status: 200 });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Busca o pagamento real na API do MP para verificar status
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });

    if (!mpResponse.ok) {
      console.error("MP Webhook: falha ao buscar pagamento", data.id);
      return new Response("Payment fetch failed", { status: 200 });
    }

    const payment = await mpResponse.json();

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const orderId = payment.external_reference;

    if (!orderId) {
      console.error("MP Webhook: external_reference ausente no pagamento", data.id);
      return new Response("Missing external_reference", { status: 200 });
    }

    // ── Idempotência: não reprocessar se já está Pago ───────────────────────
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("status, payment_intent_id")
      .eq("id", orderId)
      .single();

    if (existingOrder?.status === "Pago") {
      return new Response("Already processed", { status: 200 });
    }
    // ────────────────────────────────────────────────────────────────────────

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "Pago", payment_intent_id: String(payment.id) })
      .eq("id", orderId);

    if (updateError) {
      console.error("MP Webhook: erro ao atualizar pedido", updateError.message);
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

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("MP Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
