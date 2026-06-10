import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STORE_NAME = Deno.env.get('STORE_NAME') || "JR Acessórios";

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

serve(async (req) => {
  // CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Autorização: apenas service-role (webhooks) ou admins ──────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    let authorized = bearer.length > 0 && bearer === SERVICE_ROLE_KEY;
    if (!authorized && bearer.length > 0) {
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: isAdmin } = await authClient.rpc("is_admin");
      authorized = isAdmin === true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

    const { to, customerName, orderId, totalAmount, trackingCode, type = "order_confirmed" } = await req.json();

    if (!to || !customerName || !orderId) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'to', 'customerName' e 'orderId' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limpa o número de telefone (apenas números)
    let cleanPhone = to.replace(/\D/g, "");

    // Garante código de país para números do Brasil (55)
    if (cleanPhone.length <= 11) {
      // Se não começa com 55 e tem tamanho de DDD + número
      if (!cleanPhone.startsWith("55") && cleanPhone.length >= 10) {
        cleanPhone = `55${cleanPhone}`;
      }
    }

    const firstName = customerName.split(" ")[0];
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    
    let textMessage = "";
    let templateName = "";
    let templateComponents: any[] = [];

    if (type === "order_shipped") {
      const tracking = trackingCode || "Em processamento";
      textMessage = `Olá, ${firstName}! 🚚 Seu pedido *#${shortOrderId}* acaba de ser enviado!\n\nEle está a caminho de forma totalmente segura até o seu endereço.\n\nCódigo de Rastreio: *${tracking}*\nVocê pode utilizá-lo para acompanhar a entrega no site dos Correios ou da transportadora.\n\nAgradecemos a sua preferência!\n*${STORE_NAME}*`;
      
      templateName = Deno.env.get("WHATSAPP_TEMPLATE_SHIPPED_NAME") || "order_shipped";
      templateComponents = [
        { type: "text", text: firstName },
        { type: "text", text: `#${shortOrderId}` },
        { type: "text", text: tracking },
      ];
    } else {
      const formattedAmount = formatBRL(Number(totalAmount || 0));
      textMessage = `Olá, ${firstName}! ✨\n\nConfirmamos o recebimento do seu pagamento para o pedido *#${shortOrderId}* no valor de *${formattedAmount}*.\n\nSua reserva foi garantida com sucesso e nossa equipe de curadoria já está preparando a sua peça sob os mais altos padrões de luxo. 💎\n\nAssim que seu pacote for despachado, você receberá o código de rastreamento por aqui e por e-mail.\n\nAgradecemos a sua preferência!\n*${STORE_NAME}*`;
      
      templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "order_confirmed";
      templateComponents = [
        { type: "text", text: firstName },
        { type: "text", text: `#${shortOrderId}` },
        { type: "text", text: formattedAmount },
      ];
    }

    // ── Provedores de API ────────────────────────────────────────────────────
    const PROVIDER = Deno.env.get("WHATSAPP_PROVIDER")?.toLowerCase() || "mock";
    const API_KEY = Deno.env.get("WHATSAPP_API_KEY") || Deno.env.get("WHATSAPP_API_TOKEN");
    const API_URL = Deno.env.get("WHATSAPP_API_URL");
    const INSTANCE_ID = Deno.env.get("WHATSAPP_INSTANCE_ID") || Deno.env.get("WHATSAPP_INSTANCE_NAME");

    console.log(`WhatsApp sender: enviando para ${cleanPhone} via provedor '${PROVIDER}' (tipo: ${type})`);

    let responseData: any = null;
    let status = 200;

    if (PROVIDER === "zapi" && INSTANCE_ID && API_KEY) {
      // Integração Z-API
      const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${API_KEY}/send-text`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, message: textMessage }),
      });
      responseData = await res.json().catch(() => ({}));
      status = res.status;
      if (!res.ok) throw new Error(`Erro Z-API (${res.status}): ${JSON.stringify(responseData)}`);

    } else if (PROVIDER === "evolution" && API_URL && INSTANCE_ID && API_KEY) {
      // Integração Evolution API
      const url = `${API_URL}/message/sendText/${INSTANCE_ID}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": API_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: textMessage,
          delay: 1200,
          linkPreview: false,
        }),
      });
      responseData = await res.json().catch(() => ({}));
      status = res.status;
      if (!res.ok) throw new Error(`Erro Evolution API (${res.status}): ${JSON.stringify(responseData)}`);

    } else if (PROVIDER === "meta" && API_KEY && Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")) {
      // Integração API Oficial da Meta (WhatsApp Business Cloud API)
      const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: templateComponents,
              },
            ],
          },
        }),
      });
      responseData = await res.json().catch(() => ({}));
      status = res.status;
      if (!res.ok) throw new Error(`Erro Meta API (${res.status}): ${JSON.stringify(responseData)}`);

    } else {
      // Fallback: Modo MOCK (simulado)
      console.log("=== MOCK WHATSAPP NOTIFICATION ===");
      console.log(`Para: ${cleanPhone}`);
      console.log(`Tipo: ${type}`);
      console.log(`Mensagem:\n${textMessage}`);
      console.log("==================================");
      responseData = { success: true, message: "Mensagem simulada enviada com sucesso (modo MOCK)." };
    }

    return new Response(JSON.stringify({ success: true, provider: PROVIDER, details: responseData }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro ao enviar WhatsApp:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
