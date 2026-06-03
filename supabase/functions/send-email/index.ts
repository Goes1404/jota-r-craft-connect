import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND = "JR Acessórios";
const FROM = `${BRAND} <notificacoes@jracessorios.com>`;

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#e2e2e2}
  .wrap{max-width:580px;margin:40px auto;background:#111;border:1px solid #222;border-radius:24px;overflow:hidden}
  .header{background:linear-gradient(135deg,#1a1a0a,#0a0a0a);padding:40px 48px;border-bottom:1px solid #222;text-align:center}
  .logo{font-size:22px;font-weight:900;letter-spacing:.3em;color:#d4af37;text-transform:uppercase}
  .body{padding:40px 48px}
  .footer{padding:24px 48px;border-top:1px solid #1a1a1a;text-align:center;font-size:11px;color:#444;letter-spacing:.1em}
  h1{margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px}
  p{margin:0 0 16px;font-size:14px;line-height:1.7;color:#aaa}
  .highlight{color:#d4af37;font-weight:700}
  .box{background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;padding:24px 28px;margin:24px 0}
  .box p{margin:4px 0;font-size:13px}
  .label{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#555;margin-bottom:2px!important}
  .btn{display:inline-block;margin-top:24px;padding:14px 32px;background:#d4af37;color:#000;font-weight:900;font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border-radius:100px}
  .tag{display:inline-block;padding:4px 12px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}
  .tag-green{background:#0d2e1a;color:#4ade80;border:1px solid #166534}
  .tag-blue{background:#0d1f2e;color:#60a5fa;border:1px solid #1d4ed8}
</style>
</head>
<body><div class="wrap">
  <div class="header"><div class="logo">${BRAND}</div></div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} ${BRAND} · Todos os direitos reservados<br>Você recebeu este e-mail pois realizou uma compra conosco.</div>
</div></body></html>`;
}

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function orderConfirmedHtml(name: string, orderId: string, total: number, address: string) {
  const firstName = name?.split(" ")[0] || "Cliente";
  return baseTemplate(`
    <span class="tag tag-green">✓ Pagamento Confirmado</span>
    <h1 style="margin-top:20px">Obrigado, ${firstName}!</h1>
    <p>Seu pagamento foi recebido e seu pedido está sendo preparado com todo o cuidado que você merece.</p>
    <div class="box">
      <p class="label">Número do Pedido</p>
      <p class="highlight">#${orderId.slice(0, 8).toUpperCase()}</p>
      <p class="label" style="margin-top:16px!important">Valor Total</p>
      <p class="highlight">${formatBRL(total)}</p>
      <p class="label" style="margin-top:16px!important">Endereço de Entrega</p>
      <p>${address}</p>
    </div>
    <p>Você pode acompanhar o status do seu pedido a qualquer momento clicando no botão abaixo.</p>
    <a href="https://jracessorios.com/pedidos" class="btn">Acompanhar Pedido</a>
  `);
}

function orderShippedHtml(name: string, orderId: string, trackingCode: string) {
  const firstName = name?.split(" ")[0] || "Cliente";
  return baseTemplate(`
    <span class="tag tag-blue">🚚 Pedido Enviado</span>
    <h1 style="margin-top:20px">Seu pedido está a caminho!</h1>
    <p>Olá, ${firstName}! Sua peça saiu para entrega e está em transporte seguro até você.</p>
    <div class="box">
      <p class="label">Número do Pedido</p>
      <p class="highlight">#${orderId.slice(0, 8).toUpperCase()}</p>
      <p class="label" style="margin-top:16px!important">Código de Rastreio</p>
      <p class="highlight" style="font-size:18px;letter-spacing:.1em">${trackingCode}</p>
    </div>
    <p>Use o código acima para rastrear sua encomenda no site dos Correios ou na transportadora responsável.</p>
    <a href="https://jracessorios.com/pedidos" class="btn">Ver Status do Pedido</a>
  `);
}

function adminNewOrderHtml(customerName: string, customerEmail: string, orderId: string, total: number, shippingAddress: string) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  return baseTemplate(`
    <span class="tag" style="background:#1a0d2e;color:#c084fc;border:1px solid #7c3aed">🔔 Novo Pedido Pago</span>
    <h1 style="margin-top:20px">Novo pedido recebido!</h1>
    <p>Um pagamento foi confirmado e o pedido precisa ser preparado.</p>
    <div class="box">
      <p class="label">Número do Pedido</p>
      <p class="highlight">#${shortId}</p>
      <p class="label" style="margin-top:16px!important">Cliente</p>
      <p>${customerName} — ${customerEmail}</p>
      <p class="label" style="margin-top:16px!important">Valor Total</p>
      <p class="highlight">${formatBRL(total)}</p>
      <p class="label" style="margin-top:16px!important">Endereço de Entrega</p>
      <p>${shippingAddress}</p>
    </div>
    <a href="https://jracessorios.com/admin/orders" class="btn">Gerenciar Pedido</a>
  `);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, to, customerName, customerEmail, orderId, totalAmount, shippingAddress, trackingCode } = await req.json();

    let subject = "";
    let html = "";

    if (type === "order_confirmed") {
      subject = `✓ Pedido #${orderId?.slice(0, 8).toUpperCase()} confirmado — ${BRAND}`;
      html = orderConfirmedHtml(customerName, orderId, totalAmount, shippingAddress);
    } else if (type === "order_shipped") {
      subject = `🚚 Seu pedido #${orderId?.slice(0, 8).toUpperCase()} foi enviado — ${BRAND}`;
      html = orderShippedHtml(customerName, orderId, trackingCode);
    } else if (type === "admin_new_order") {
      subject = `🔔 Novo pedido #${orderId?.slice(0, 8).toUpperCase()} — ${formatBRL(totalAmount)}`;
      html = adminNewOrderHtml(customerName, customerEmail || "—", orderId, totalAmount, shippingAddress);
    } else {
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent (${type}) to ${to} — id: ${result.id}`);
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
