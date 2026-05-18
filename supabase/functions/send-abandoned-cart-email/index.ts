import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND = "JR Acessórios";
const FROM = `${BRAND} <notificacoes@jracessorios.com>`;
const STORE_URL = "https://jracessorios.com";

function formatBRL(value: number) {
  return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function abandonedCartHtml(name: string, items: any[], total: number) {
  const firstName = name?.split(" ")[0] || "Cliente";

  const itemsHtml = (items || []).map((item: any) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1a">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="56">
            <img src="${item.image || ""}" width="48" height="48"
              style="border-radius:8px;background:#1a1a1a;object-fit:cover;display:block" />
          </td>
          <td style="padding-left:12px">
            <p style="margin:0;font-size:13px;font-weight:700;color:#e2e2e2">${item.name}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#666">Qtd: ${item.quantity || 1}</p>
          </td>
          <td align="right" style="white-space:nowrap">
            <p style="margin:0;font-size:14px;font-weight:900;color:#d4af37;font-family:Georgia,serif">
              ${formatBRL(Number(item.price) * (item.quantity || 1))}
            </p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#e2e2e2">
<div style="max-width:580px;margin:40px auto;background:#111;border:1px solid #222;border-radius:24px;overflow:hidden">

  <div style="background:linear-gradient(135deg,#1a1a0a,#0a0a0a);padding:40px 48px;border-bottom:1px solid #222;text-align:center">
    <div style="font-size:22px;font-weight:900;letter-spacing:.3em;color:#d4af37;text-transform:uppercase">${BRAND}</div>
  </div>

  <div style="padding:40px 48px">
    <div style="display:inline-block;padding:4px 14px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;background:#2a1a00;color:#d4af37;border:1px solid #3d2500">
      ⏰ Carrinho Aguardando
    </div>

    <h1 style="margin:20px 0 8px;font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px">
      Olá, ${firstName}!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#aaa">
      Você deixou alguns itens no seu carrinho. Eles ainda estão disponíveis, mas o estoque é limitado — não perca essa oportunidade!
    </p>

    <div style="background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;padding:24px 28px;margin:0 0 28px">
      <p style="margin:0 0 16px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#555">
        Itens no Carrinho
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
        <tr>
          <td style="padding-top:16px">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#555">Total</td>
              <td align="right" style="font-size:20px;font-weight:900;color:#d4af37;font-family:Georgia,serif">
                ${formatBRL(total)}
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#aaa">
      Volte agora e finalize sua compra com total segurança e praticidade.
    </p>

    <a href="${STORE_URL}/checkout"
      style="display:inline-block;padding:14px 36px;background:#d4af37;color:#000;font-weight:900;font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border-radius:100px">
      Recuperar Meu Carrinho →
    </a>
  </div>

  <div style="padding:24px 48px;border-top:1px solid #1a1a1a;text-align:center;font-size:11px;color:#444;letter-spacing:.1em">
    © ${new Date().getFullYear()} ${BRAND} · Todos os direitos reservados<br>
    Você recebeu este e-mail pois iniciou uma compra conosco.
  </div>
</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: carts, error } = await adminClient
      .from("abandoned_carts")
      .select("id, email, name, cart_items, total_amount")
      .in("status", ["pending", "abandoned"])
      .is("recovery_email_sent_at", null)
      .not("email", "is", null)
      .lt("last_active_at", thirtyMinutesAgo);

    if (error) throw error;

    if (!carts || carts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const cart of carts) {
      try {
        const html = abandonedCartHtml(
          cart.name || "",
          cart.cart_items || [],
          Number(cart.total_amount),
        );

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM,
            to: [cart.email],
            subject: `⏰ Seus itens estão esperando — ${BRAND}`,
            html,
          }),
        });

        if (res.ok) {
          await adminClient
            .from("abandoned_carts")
            .update({ recovery_email_sent_at: new Date().toISOString() })
            .eq("id", cart.id);
          sent++;
        } else {
          const err = await res.json();
          console.error(`Failed to send recovery email to ${cart.email}:`, err);
        }
      } catch (e) {
        console.error(`Error processing cart ${cart.id}:`, e);
      }
    }

    console.log(`Abandoned cart recovery: sent ${sent}/${carts.length}`);
    return new Response(JSON.stringify({ processed: sent, total: carts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-abandoned-cart-email error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
