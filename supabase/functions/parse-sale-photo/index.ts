// Supabase Edge Function — parse-sale-photo
//
// Lê a foto de uma página de caderno onde o lojista anota vendas à mão e
// devolve as linhas estruturadas (produto, quantidade, preço) já casadas com
// o catálogo. Quem grava as vendas é o cliente, depois da revisão humana.
//
// Só admin (mesmo padrão de generate-ad-image). Não está em config.toml, então
// herda verify_jwt = true — o admin logado manda JWT real e a função nunca
// pode ser chamada anonimamente.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORE_URL = Deno.env.get("STORE_URL") || "https://jracessorios.com";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === STORE_URL || origin === STORE_URL.replace("https://", "https://www.")) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function makeCors(origin: string | null): Record<string, string> {
  const allowed = (origin && isAllowedOrigin(origin)) ? origin : STORE_URL;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Enum fechado — o cliente traduz cada código num badge da tela de revisão.
const ALLOWED_WARNINGS = new Set([
  "preco_ilegivel",
  "quantidade_ilegivel",
  "possivel_rasura",
  "total_inconsistente",
  "produto_ambiguo",
]);

const MAX_CATALOG = 400;
const MAX_PAYLOAD = 8_000_000; // ~8MB de base64
const OPENAI_TIMEOUT_MS = 50_000;

const SYSTEM_PROMPT = `Você lê a FOTO de uma página de caderno onde um lojista brasileiro anota vendas à mão (vendas de balcão e por WhatsApp). Devolva SOMENTE um objeto JSON válido, sem markdown e sem texto fora do JSON.

TRANSCREVA ANTES DE INTERPRETAR
Para cada linha de venda, primeiro copie o texto literal em "raw_text" (mantendo abreviações e erros de grafia). Só depois interprete os campos.

NÚMEROS (formato brasileiro)
- Vírgula é separador DECIMAL e ponto é separador de MILHAR: "45,00" → 45 | "1.200,00" → 1200 | "1.200" → 1200 | "45" → 45.
- "R$", "RS", "r$" são o mesmo símbolo: ignore.

QUANTIDADE
- Aceite "2x", "2 x", "x2", "2 un", "2 pç", "2 pçs", "2 -", "(2)".
- Sem indicação de quantidade → 1.

PREÇO UNITÁRIO x TOTAL
- Em "2x fone 45 = 90", unit_price = 45.
- Se quantity × unit_price não bater com o total escrito, prefira total ÷ quantity e adicione "total_inconsistente" em warnings.
- Se só houver o total ("2 fones — 90"), divida pela quantidade e adicione "total_inconsistente".

O QUE NÃO É VENDA (ignore por completo, não crie linha)
- Linhas de "TOTAL", "SOMA", "Total do dia", somas de coluna.
- Datas isoladas, cabeçalhos, numeração de página.
- Texto IMPRESSO da agenda (dias da semana, "JUEVES/THURSDAY", números como "121/244", feriados). Só interessa o que foi escrito à MÃO.
- Nomes de clientes sozinhos e recados.
- Formas de pagamento isoladas ("pix", "fiado", "cartão", "dinheiro"). Se a forma de pagamento estiver na mesma linha da venda, mantenha em raw_text mas não crie linha separada.

LINHAS RISCADAS
- Linha claramente riscada/rasurada foi CANCELADA: não devolva.
- Se houver dúvida entre rasura e sublinhado, devolva com confidence <= 0.4 e warnings ["possivel_rasura"].

QUANDO ESTIVER EM DÚVIDA (regra mais importante)
- NUNCA invente número. Se o preço está ilegível, devolva unit_price: null e warnings ["preco_ilegivel"]. Se a quantidade está ilegível, quantity: null e ["quantidade_ilegivel"]. Um campo nulo faz o lojista conferir; um valor chutado vira faturamento errado silencioso.
- NUNCA junte duas linhas nem divida uma linha em duas.
- NUNCA crie uma linha que não esteja na foto.
- Itens repetidos com valores diferentes são vendas SEPARADAS e legítimas (ex: duas linhas "PELICULA" com preços distintos). Devolva as duas.

CASAMENTO COM O CATÁLOGO
- Você recebe uma lista numerada "índice | nome | categoria | preço".
- Devolva "product_index" apenas quando for razoavelmente o mesmo item. Abreviações são esperadas: "fone bt" → Fone Bluetooth, "carreg tipo c" → Carregador USB-C, "capinha" → Capa, "pelicula" → Película.
- Se dois itens forem igualmente plausíveis, product_index: null e warnings ["produto_ambiguo"].
- NÃO escolha um item só porque é o único da categoria.
- Sempre preencha "product_name_guess" com sua melhor leitura do nome escrito, mesmo quando product_index for null.

DATA DA PÁGINA
- Se houver data no topo ("12/08", "12/08/26"), devolva em "page_date" no formato ISO (AAAA-MM-DD). Formato brasileiro é dd/mm.
- Sem ano → use o ano da data de hoje informada; se isso jogar a data no futuro, use o ano anterior.
- Sem data na página → page_date: null.

FOTO IMPRESTÁVEL
- Se não for um caderno de vendas, ou estiver ilegível/escura demais: {"unreadable": true, "reason": "...", "lines": [], "page_date": null}.

FORMATO DE SAÍDA
{"page_date": "AAAA-MM-DD"|null, "unreadable": false, "lines": [{"raw_text": string, "product_index": number|null, "product_name_guess": string, "quantity": number|null, "unit_price": number|null, "confidence": number 0..1, "warnings": string[]}]}`;

/**
 * Traduz a falha da OpenAI numa instrução acionável. Sem isso, um problema
 * permanente (crédito acabou) vira "tente de novo em instantes" e o lojista
 * fica tentando para sempre achando que é bug.
 */
function describeOpenAiFailure(status: number, body: string, org: string, project: string): string {
  let code = "";
  let type = "";
  try {
    const parsed = JSON.parse(body);
    code = String(parsed?.error?.code ?? "");
    type = String(parsed?.error?.type ?? "");
  } catch { /* corpo não-JSON: cai nas regras por status */ }

  if (type === "insufficient_quota" || code === "credit_balance_exhausted") {
    return `A conta da OpenAI usada por esta chave está sem crédito (organização: ${org}, projeto: ${project}). Se você acabou de adicionar saldo, confirme que foi NESTA organização e que o projeto não está com limite de gasto zerado. Enquanto isso, use 'Registrar Venda' para lançar manualmente.`;
  }
  if (status === 401 || code === "invalid_api_key") {
    return "A chave da OpenAI está inválida ou expirou. Atualize o secret OPENAI_API_KEY no painel do Supabase.";
  }
  if (status === 429) {
    return "Muitas leituras seguidas. Espere alguns segundos e tente de novo.";
  }
  if (status >= 500) {
    return "A OpenAI está instável agora. Tente de novo em alguns instantes.";
  }
  return "A IA não conseguiu processar a foto agora. Tente de novo em instantes.";
}

serve(async (req) => {
  const corsHeaders = makeCors(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Autorização: apenas admins ───────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) return json({ error: "Sessão inválida" }, 401);

    const { data: isAdmin } = await authedClient.rpc("is_admin");
    if (isAdmin !== true) return json({ error: "Apenas administradores" }, 403);
    // ─────────────────────────────────────────────────────────────────────────

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY não configurada" }, 500);

    const { imageBase64, diagnose } = await req.json();

    // Diagnóstico de conta (admin): consulta /v1/models, que NÃO consome
    // crédito, só para revelar se a chave é válida e de qual organização ela é.
    // Não devolve a chave — apenas prefixo mascarado e cabeçalhos da OpenAI.
    if (diagnose === true) {
      const probe = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      });
      const probeBody = await probe.text();
      return json({
        key_prefix: `${OPENAI_API_KEY.slice(0, 12)}…${OPENAI_API_KEY.slice(-4)}`,
        key_length: OPENAI_API_KEY.length,
        models_status: probe.status,
        openai_organization: probe.headers.get("openai-organization"),
        openai_project: probe.headers.get("openai-project"),
        body_preview: probeBody.slice(0, 400),
      });
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return json({ error: "Envie uma imagem (imageBase64)" }, 400);
    }
    if (imageBase64.length > MAX_PAYLOAD) {
      return json({ error: "Foto muito grande. Tente novamente com menos zoom." }, 413);
    }
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // ── Catálogo: lido no servidor (fonte da verdade, sempre atual) ──────────
    // Usa o client do próprio admin: products tem leitura pública, então não
    // precisamos de service_role — a função inteira roda sem privilégio elevado.
    const { data: products, error: prodErr } = await authedClient
      .from("products")
      .select("id, name, category, price, stock")
      .order("name");
    if (prodErr) {
      console.error("parse-sale-photo: falha ao ler catálogo", prodErr.message);
      return json({ error: "Não foi possível carregar o catálogo." });
    }

    const catalog = (products ?? []).slice(0, MAX_CATALOG);
    const catalogTruncated = (products ?? []).length > MAX_CATALOG;

    // Catálogo NUMERADO — o modelo devolve o índice, nunca o UUID. Isso torna
    // impossível alucinar um product_id e economiza ~14 tokens por produto.
    const catalogText = catalog
      .map((p, i) => `${i + 1} | ${p.name} | ${p.category ?? "-"} | ${Number(p.price).toFixed(2)}`)
      .join("\n");

    const hojeISO = new Date().toISOString().slice(0, 10);

    // ── Chamada de visão ─────────────────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let openaiResp: Response;
    try {
      openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // gpt-4o-mini erra muito mais em manuscrito
          temperature: 0,
          max_tokens: 2000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Data de hoje: ${hojeISO}.\n\nCATÁLOGO (índice | nome | categoria | preço):\n${catalogText || "(catálogo vazio)"}\n\nExtraia as vendas da foto.`,
                },
                // detail "high" é essencial para escrita à mão
                { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              ],
            },
          ],
        }),
      });
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error).name === "AbortError") {
        return json({ error: "A leitura demorou demais. Tente uma foto mais nítida ou com menos linhas." });
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!openaiResp.ok) {
      const detail = await openaiResp.text();
      // Loga a org/projeto dono da chave: quando o saldo é adicionado na conta
      // errada, é isto que mostra onde o crédito precisa entrar.
      const org = openaiResp.headers.get("openai-organization") ?? "?";
      const project = openaiResp.headers.get("openai-project") ?? "?";
      console.error("parse-sale-photo: OpenAI", openaiResp.status, "| org:", org, "| project:", project, detail);
      // 200 + { error }: functions.invoke opaca qualquer não-2xx e a mensagem se perde.
      return json({ error: describeOpenAiFailure(openaiResp.status, detail, org, project) });
    }

    const completion = await openaiResp.json();
    const raw: string = completion?.choices?.[0]?.message?.content ?? "";

    // ── Sanitização (nunca confiar direto na saída do modelo) ────────────────
    let parsed: any;
    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("parse-sale-photo: JSON inválido do modelo:", raw.slice(0, 400));
      return json({ success: true, unreadable: true, page_date: null, lines: [], catalog_truncated: catalogTruncated });
    }

    if (parsed?.unreadable === true) {
      return json({
        success: true,
        unreadable: true,
        reason: typeof parsed.reason === "string" ? parsed.reason : null,
        page_date: null,
        lines: [],
        catalog_truncated: catalogTruncated,
      });
    }

    const toNumberOrNull = (v: unknown): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const lines = (Array.isArray(parsed?.lines) ? parsed.lines : [])
      .map((line: any) => {
        const idx = Number(line?.product_index);
        // Índice → UUID: só aceita índice dentro do catálogo enviado.
        const product = Number.isInteger(idx) && idx >= 1 && idx <= catalog.length
          ? catalog[idx - 1]
          : null;

        const qty = toNumberOrNull(line?.quantity);
        const unit = toNumberOrNull(line?.unit_price);
        const confidence = toNumberOrNull(line?.confidence) ?? 0.5;

        return {
          raw_text: String(line?.raw_text ?? "").trim(),
          product_id: product?.id ?? null,
          product_name_guess: String(line?.product_name_guess ?? "").trim(),
          quantity: qty !== null && Number.isInteger(qty) && qty > 0 ? qty : null,
          unit_price: unit !== null && unit >= 0 ? Math.round(unit * 100) / 100 : null,
          confidence: Math.min(1, Math.max(0, confidence)),
          warnings: (Array.isArray(line?.warnings) ? line.warnings : [])
            .filter((w: unknown) => typeof w === "string" && ALLOWED_WARNINGS.has(w)),
        };
      })
      // Linha sem texto e sem nada aproveitável não serve para revisão.
      .filter((l: any) => l.raw_text || l.product_id || l.product_name_guess);

    const pageDate = typeof parsed?.page_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.page_date)
      ? parsed.page_date
      : null;

    console.log(`parse-sale-photo: ${lines.length} linha(s) extraída(s) por ${user.id}`);

    return json({
      success: true,
      unreadable: false,
      page_date: pageDate,
      catalog_truncated: catalogTruncated,
      lines,
    });
  } catch (err) {
    console.error("parse-sale-photo error:", err);
    return json({ error: "Erro inesperado ao ler a foto." }, 500);
  }
});
