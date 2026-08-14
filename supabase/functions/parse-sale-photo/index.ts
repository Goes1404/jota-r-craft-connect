// Supabase Edge Function — parse-sale-photo
//
// Lê a foto de uma página de caderno onde o lojista anota vendas à mão e
// devolve as linhas estruturadas (produto, quantidade, preço) já casadas com
// o catálogo. Quem grava as vendas é o cliente, depois da revisão humana.
//
// Provedor de visão: usa GEMINI_API_KEY quando existir (camada gratuita do
// Google AI Studio), senão cai para OPENAI_API_KEY. Assim a loja não fica
// refém do saldo de uma única conta.
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
const TIMEOUT_MS = 50_000;

// gemini-2.5-flash lê manuscrito bem melhor; se a chave não tiver acesso,
// caímos para o 2.0-flash, que está na camada gratuita há mais tempo.
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.0-flash";

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
- SEMPRE que você dividir um valor pela quantidade para chegar no unitário, inclua "total_inconsistente" em warnings. Sem exceção — é esse aviso que faz o lojista conferir se o valor escrito era unitário ou total.

O QUE NÃO É VENDA (ignore por completo, não crie linha)
- Linhas de "TOTAL", "SOMA", "Total do dia", somas de coluna.
- Datas isoladas, cabeçalhos, numeração de página.
- Texto IMPRESSO da agenda (dias da semana, "JUEVES/THURSDAY", números como "121/244", feriados). Só interessa o que foi escrito à MÃO.
- Nomes de clientes sozinhos e recados.
- Formas de pagamento isoladas ("pix", "fiado", "cartão", "dinheiro"). Se a forma de pagamento estiver na mesma linha da venda, mantenha em raw_text mas não crie linha separada.

USE SOMENTE ESTES CÓDIGOS EM warnings (qualquer outro será descartado):
"preco_ilegivel", "quantidade_ilegivel", "possivel_rasura", "total_inconsistente", "produto_ambiguo"

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
- Se o preço lido for diferente do preço do produto no catálogo, MANTENHA o preço lido: o papel manda (venda de balcão costuma ter desconto). Não ajuste o valor para bater com o catálogo.
- NÃO escolha um item só porque é o único da categoria.
- Sempre preencha "product_name_guess" com sua melhor leitura do nome escrito, mesmo quando product_index for null.

DATA DA PÁGINA
- Se houver data escrita à mão ("12/08", "05/08"), devolva em "page_date" no formato ISO (AAAA-MM-DD). Formato brasileiro é dd/mm.
- Sem ano → use o ano da data de hoje informada. Só use o ano ANTERIOR se a data ficar mais de 7 dias no futuro: uma página de caderno costuma ser de hoje ou de poucos dias atrás, e adiantar um dia é normal.
- Sem data escrita à mão → page_date: null.

FOTO IMPRESTÁVEL
- Se não for um caderno de vendas, ou estiver ilegível/escura demais: {"unreadable": true, "reason": "...", "lines": [], "page_date": null}.

FORMATO DE SAÍDA
{"page_date": "AAAA-MM-DD"|null, "unreadable": false, "lines": [{"raw_text": string, "product_index": number|null, "product_name_guess": string, "quantity": number|null, "unit_price": number|null, "confidence": number 0..1, "warnings": string[]}]}`;

/** Resultado normalizado de qualquer provedor de visão. */
interface VisionResult {
  ok: boolean;
  text?: string;
  error?: string;
}

/** Separa "data:image/webp;base64,XXX" em mime + base64 puro (o Gemini exige separados). */
function splitDataUrl(value: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(value);
  if (match) return { mimeType: match[1], data: match[2] };
  return { mimeType: "image/jpeg", data: value };
}

// ─── Google Gemini (camada gratuita do AI Studio) ────────────────────────────
async function callGemini(
  apiKey: string,
  model: string,
  userText: string,
  dataUrl: string,
  signal: AbortSignal,
): Promise<VisionResult & { modelMissing?: boolean }> {
  const { mimeType, data } = splitDataUrl(dataUrl);

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: "user",
          parts: [
            { text: userText },
            { inline_data: { mime_type: mimeType, data } },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!resp.ok) {
    const detail = await resp.text();
    console.error(`parse-sale-photo: Gemini ${resp.status} (${model})`, detail.slice(0, 500));
    // 404 = modelo indisponível para esta chave → quem chamou tenta o fallback.
    if (resp.status === 404) return { ok: false, modelMissing: true, error: "modelo indisponível" };
    return { ok: false, error: describeGeminiFailure(resp.status, detail) };
  }

  const body = await resp.json();
  const text: string = body?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text ?? "")
    .join("") ?? "";

  if (!text) {
    // Sem texto normalmente é bloqueio de segurança do Gemini.
    const reason = body?.candidates?.[0]?.finishReason ?? body?.promptFeedback?.blockReason ?? "";
    console.error("parse-sale-photo: Gemini sem conteúdo. finishReason:", reason);
    return { ok: false, error: "A IA não retornou leitura para esta foto. Tente outra foto, mais nítida." };
  }
  return { ok: true, text };
}

function describeGeminiFailure(status: number, body: string): string {
  let reason = "";
  try {
    reason = String(JSON.parse(body)?.error?.status ?? "");
  } catch { /* corpo não-JSON */ }

  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(body)) {
    return "A chave do Gemini é inválida. Gere outra em aistudio.google.com e atualize o secret GEMINI_API_KEY no Supabase.";
  }
  if (status === 429 || reason === "RESOURCE_EXHAUSTED") {
    return "Limite gratuito do Gemini atingido por agora. Espere um minuto e tente de novo.";
  }
  if (status === 403) {
    return "A chave do Gemini não tem permissão para este modelo. Confira em aistudio.google.com se a API está habilitada.";
  }
  if (status >= 500) {
    return "O Gemini está instável agora. Tente de novo em alguns instantes.";
  }
  return "A IA não conseguiu processar a foto agora. Tente de novo em instantes.";
}

// ─── OpenAI (usado só quando não há GEMINI_API_KEY) ──────────────────────────
async function callOpenAI(
  apiKey: string,
  userText: string,
  dataUrl: string,
  signal: AbortSignal,
): Promise<VisionResult> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            // detail "high" é essencial para escrita à mão
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("parse-sale-photo: OpenAI", resp.status, detail.slice(0, 500));
    return { ok: false, error: describeOpenAiFailure(resp.status, detail) };
  }
  const body = await resp.json();
  return { ok: true, text: body?.choices?.[0]?.message?.content ?? "" };
}

/**
 * Traduz a falha da OpenAI numa instrução acionável. Sem isso, um problema
 * permanente (crédito acabou) vira "tente de novo em instantes" e o lojista
 * fica tentando para sempre achando que é bug.
 */
function describeOpenAiFailure(status: number, body: string): string {
  let code = "";
  let type = "";
  try {
    const parsed = JSON.parse(body);
    code = String(parsed?.error?.code ?? "");
    type = String(parsed?.error?.type ?? "");
  } catch { /* corpo não-JSON: cai nas regras por status */ }

  if (type === "insufficient_quota" || code === "credit_balance_exhausted") {
    return "A conta da OpenAI está sem crédito. Configure o secret GEMINI_API_KEY no Supabase (camada gratuita do Google AI Studio) ou adicione saldo na OpenAI. Enquanto isso, use 'Registrar Venda' para lançar manualmente.";
  }
  if (status === 401 || code === "invalid_api_key") {
    return "A chave da OpenAI está inválida ou expirou. Atualize o secret OPENAI_API_KEY no painel do Supabase.";
  }
  if (status === 429) return "Muitas leituras seguidas. Espere alguns segundos e tente de novo.";
  if (status >= 500) return "A OpenAI está instável agora. Tente de novo em alguns instantes.";
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const provider: "gemini" | "openai" | null =
      GEMINI_API_KEY ? "gemini" : (OPENAI_API_KEY ? "openai" : null);

    if (!provider) {
      return json({ error: "Nenhuma chave de IA configurada. Defina GEMINI_API_KEY (grátis) ou OPENAI_API_KEY no Supabase." }, 500);
    }

    const { imageBase64, diagnose } = await req.json();

    // Diagnóstico (admin): mostra qual provedor está ativo e se a chave responde.
    // Não devolve a chave — apenas prefixo mascarado e status HTTP.
    if (diagnose === true) {
      const mask = (k?: string) => (k ? `${k.slice(0, 8)}…${k.slice(-4)} (${k.length})` : null);
      let probeStatus: number | null = null;
      if (provider === "gemini") {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
        );
        probeStatus = r.status;
      } else {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        });
        probeStatus = r.status;
      }
      return json({
        provider,
        model: provider === "gemini" ? GEMINI_MODEL : "gpt-4o",
        gemini_key: mask(GEMINI_API_KEY),
        openai_key: mask(OPENAI_API_KEY),
        probe_status: probeStatus,
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
    // impossível alucinar um product_id e economiza tokens.
    const catalogText = catalog
      .map((p, i) => `${i + 1} | ${p.name} | ${p.category ?? "-"} | ${Number(p.price).toFixed(2)}`)
      .join("\n");

    const hojeISO = new Date().toISOString().slice(0, 10);
    const userText = `Data de hoje: ${hojeISO}.\n\nCATÁLOGO (índice | nome | categoria | preço):\n${catalogText || "(catálogo vazio)"}\n\nExtraia as vendas da foto.`;

    // ── Chamada de visão ─────────────────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let result: VisionResult;
    try {
      if (provider === "gemini") {
        result = await callGemini(GEMINI_API_KEY!, GEMINI_MODEL, userText, dataUrl, controller.signal);
        // Modelo não liberado para esta chave: tenta o da camada gratuita antiga.
        if ((result as any).modelMissing) {
          console.log(`parse-sale-photo: ${GEMINI_MODEL} indisponível, tentando ${GEMINI_FALLBACK_MODEL}`);
          result = await callGemini(GEMINI_API_KEY!, GEMINI_FALLBACK_MODEL, userText, dataUrl, controller.signal);
          if ((result as any).modelMissing) {
            result = { ok: false, error: "Nenhum modelo de visão do Gemini está disponível para esta chave." };
          }
        }
      } else {
        result = await callOpenAI(OPENAI_API_KEY!, userText, dataUrl, controller.signal);
      }
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error).name === "AbortError") {
        return json({ error: "A leitura demorou demais. Tente uma foto mais nítida ou com menos linhas." });
      }
      throw err;
    }
    clearTimeout(timeout);

    // 200 + { error }: functions.invoke opaca qualquer não-2xx e a mensagem se perde.
    if (!result.ok) return json({ error: result.error });

    // ── Sanitização (nunca confiar direto na saída do modelo) ────────────────
    let parsed: any;
    try {
      const cleaned = (result.text ?? "")
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("parse-sale-photo: JSON inválido do modelo:", (result.text ?? "").slice(0, 400));
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

    console.log(`parse-sale-photo: ${lines.length} linha(s) via ${provider} para ${user.id}`);

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
