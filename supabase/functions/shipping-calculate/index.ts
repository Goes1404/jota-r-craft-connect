// Supabase Edge Function — shipping-calculate
// Runs server-side (Deno). Never exposes Melhor Envio token to the client.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────────

const STORE_URL = Deno.env.get('STORE_URL') || "https://jracessorios.com";
const STORE_DOMAIN = STORE_URL.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const STORE_EMAIL_FROM = Deno.env.get('STORE_EMAIL_FROM') || `contato@${STORE_DOMAIN}`;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === STORE_URL || origin === STORE_URL.replace('https://', 'https://www.')) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (origin && isAllowedOrigin(origin)) ? origin : STORE_URL;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

// ─── Flat-rate table (fallback when Melhor Envio is disabled) ─────────────────
// [PAC fee, Sedex fee, PAC days range, Sedex days range]
const STATE_RATES: Record<string, [number, number, string, string]> = {
  SP: [12.90, 22.90, "1-2 dias úteis", "Mesmo dia (Osasco/SP)"],
  RJ: [25.90, 38.90, "3-4 dias úteis", "2-3 dias úteis"],
  MG: [25.90, 36.90, "3-4 dias úteis", "2-3 dias úteis"],
  ES: [28.90, 40.90, "4-5 dias úteis", "3-4 dias úteis"],
  PR: [28.90, 40.90, "3-4 dias úteis", "2-3 dias úteis"],
  SC: [28.90, 42.90, "4-5 dias úteis", "3-4 dias úteis"],
  RS: [30.90, 44.90, "5-6 dias úteis", "3-4 dias úteis"],
  BA: [30.90, 46.90, "5-7 dias úteis", "3-5 dias úteis"],
  GO: [30.90, 44.90, "4-6 dias úteis", "3-4 dias úteis"],
  DF: [30.90, 44.90, "4-6 dias úteis", "3-4 dias úteis"],
};
const DEFAULT_RATE: [number, number, string, string] = [35.90, 52.90, "6-8 dias úteis", "4-6 dias úteis"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

function arrivalLabel(daysStr: string): string {
  if (daysStr.toLowerCase().includes("mesmo dia")) return "Chega hoje";
  const nums = daysStr.match(/\d+/g);
  if (!nums) return "";
  const maxDays = parseInt(nums[nums.length - 1]);
  const date = addBusinessDays(new Date(), maxDays + 1); // +1 for dispatch day
  return `Chega até ${date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })}`;
}

// ─── Melhor Envio (stub — swap comments when token is provisioned) ────────────
//
// Sandbox:    https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate
// Production: https://melhorenvio.com.br/api/v2/me/shipment/calculate
//
// Required request shape:
// {
//   "from": { "postal_code": "06233030" },
//   "to":   { "postal_code": "<user_cep>" },
//   "package": { "height": 10, "width": 15, "length": 20, "weight": 0.5 },
//   "options": { "insurance_value": 0, "receipt": false, "own_hand": false },
//   "services": "1,2"   // 1 = Sedex, 2 = PAC (Correios)
// }
//
interface PackageDims {
  height: number;
  width: number;
  length: number;
  weight: number;
}

async function fetchMelhorEnvioRates(
  originZip: string,
  destZip: string,
  token: string,
  pkg: PackageDims,
  insuranceValue: number,
): Promise<ShippingOption[]> {
  const useSandbox = token.startsWith("sandbox_");
  const base = useSandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";

  const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": `${STORE_DOMAIN}/1.0 (${STORE_EMAIL_FROM})`,
    },
    body: JSON.stringify({
      from: { postal_code: originZip.replace(/\D/g, "") },
      to:   { postal_code: destZip.replace(/\D/g, "") },
      package: pkg,
      options: { insurance_value: insuranceValue, receipt: false, own_hand: false },
      services: "1,2",
    }),
  });

  if (!res.ok) throw new Error(`melhor_envio_error:${res.status}`);
  const carriers: any[] = await res.json();

  return carriers
    .filter((c) => !c.error)
    .map((c) => ({
      name: c.name,
      price: Number(c.price),
      days: `${c.delivery_time} dias úteis`,
      arrivalLabel: arrivalLabel(`${c.delivery_time} dias úteis`),
      highlight: c.id === 1, // Sedex = 1
    }));
}

// ─── Flat-rate fallback ───────────────────────────────────────────────────────

interface ShippingOption {
  name: string;
  price: number;
  days: string;
  arrivalLabel: string;
  highlight?: boolean;
}

interface ShippingConfig {
  origin_zip: string;
  base_fee: number;
  per_km_rate: number;
  free_shipping_threshold: number;
  sedex_multiplier: number;
  melhor_envio_enabled: boolean;
  melhor_envio_token: string | null;
}

const DEFAULT_CONFIG: ShippingConfig = {
  origin_zip: "06233-030",
  base_fee: 12.90,
  per_km_rate: 0.15,
  free_shipping_threshold: 500,
  sedex_multiplier: 1.80,
  melhor_envio_enabled: false,
  melhor_envio_token: null,
};

function buildFlatRateOptions(uf: string, productValue: number, cfg: ShippingConfig): ShippingOption[] {
  if (productValue >= cfg.free_shipping_threshold) {
    return [{
      name: "Frete Cortesia",
      price: 0,
      days: "1-5 dias úteis",
      arrivalLabel: arrivalLabel("5 dias úteis"),
      highlight: true,
    }];
  }
  const [pacFee, , pacDays, sedexDays] = STATE_RATES[uf] ?? DEFAULT_RATE;
  return [
    {
      name: "PAC Correios",
      price: pacFee,
      days: pacDays,
      arrivalLabel: arrivalLabel(pacDays),
    },
    {
      name: "Sedex",
      price: Number((pacFee * cfg.sedex_multiplier).toFixed(2)),
      days: sedexDays,
      arrivalLabel: arrivalLabel(sedexDays),
      highlight: true,
    },
  ];
}

// ─── Montagem do pacote a partir dos itens do carrinho ───────────────────────
// Dimensões mínimas exigidas pelos Correios/Melhor Envio (evita erro da API).
const PKG_MIN = { height: 2, width: 11, length: 16, weight: 0.3 };
const DEFAULT_PACKAGE: PackageDims = { height: 10, width: 15, length: 20, weight: 0.3 };

interface CartLine { weight: number; height: number; width: number; length: number; quantity: number }

// Empilha os itens numa única caixa: maior largura/comprimento, soma das alturas
// e dos pesos. Conservador (não subdimensiona) e respeita os mínimos da transportadora.
function computePackage(lines: CartLine[]): PackageDims {
  if (!lines.length) return DEFAULT_PACKAGE;
  let height = 0, width = 0, length = 0, weight = 0;
  for (const l of lines) {
    const q = Math.max(1, Number(l.quantity) || 1);
    height += (Number(l.height) || DEFAULT_PACKAGE.height) * q;
    weight += (Number(l.weight) || DEFAULT_PACKAGE.weight) * q;
    width = Math.max(width, Number(l.width) || DEFAULT_PACKAGE.width);
    length = Math.max(length, Number(l.length) || DEFAULT_PACKAGE.length);
  }
  return {
    height: Math.max(PKG_MIN.height, Math.round(height * 10) / 10),
    width:  Math.max(PKG_MIN.width, Math.round(width * 10) / 10),
    length: Math.max(PKG_MIN.length, Math.round(length * 10) / 10),
    weight: Math.max(PKG_MIN.weight, Math.round(weight * 1000) / 1000),
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });

  try {
    // 1. Parse and validate input
    // `items` (opcional): [{ id, quantity }] — usados para buscar as dimensões
    // reais no banco e montar o pacote. Sem itens, usa um pacote padrão.
    const { cep, productValue = 0, items = [] } = await req.json();
    const rawCep = String(cep ?? "").replace(/\D/g, "");
    if (rawCep.length !== 8) {
      return json({ error: "CEP inválido. Informe os 8 dígitos." }, 400, origin);
    }

    // 2. Supabase service-role client (token never leaves this function)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Read active shipping config (includes sensitive melhor_envio_token)
    const { data: configRow } = await supabase
      .from("shipping_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();
    const cfg: ShippingConfig = configRow ?? DEFAULT_CONFIG;

    // 4. Validate CEP via ViaCEP (public API, no key needed)
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
    if (!viaCepRes.ok) return json({ error: "CEP não encontrado." }, 404, origin);
    const viaCepData = await viaCepRes.json();
    if (viaCepData.erro) return json({ error: "CEP não encontrado." }, 404, origin);

    const city: string = viaCepData.localidade;
    const state: string = viaCepData.uf;

    // 4b. Monta o pacote a partir das dimensões REAIS dos produtos (busca no
    // banco pelos ids enviados — não confia nas dimensões vindas do cliente).
    let pkg: PackageDims = DEFAULT_PACKAGE;
    const ids = Array.isArray(items)
      ? items.map((i: { id?: string }) => i?.id).filter((id): id is string => typeof id === "string")
      : [];
    if (ids.length) {
      const { data: prodRows } = await supabase
        .from("products")
        .select("id, weight, height, width, length")
        .in("id", ids);
      const byId = new Map((prodRows ?? []).map((p: { id: string }) => [p.id, p]));
      const lines: CartLine[] = items
        .map((i: { id?: string; quantity?: number }) => {
          const p = i?.id ? byId.get(i.id) : null;
          if (!p) return null;
          return { ...p, quantity: Math.max(1, Number(i.quantity) || 1) } as CartLine;
        })
        .filter(Boolean) as CartLine[];
      pkg = computePackage(lines);
    }

    // 5. Calculate shipping options
    let options: ShippingOption[];
    if (cfg.melhor_envio_enabled && cfg.melhor_envio_token) {
      // Live carrier rates — token stays server-side
      options = await fetchMelhorEnvioRates(cfg.origin_zip, rawCep, cfg.melhor_envio_token, pkg, productValue);
      // Fall back to flat-rate if Melhor Envio returns nothing
      if (options.length === 0) options = buildFlatRateOptions(state, productValue, cfg);
    } else {
      options = buildFlatRateOptions(state, productValue, cfg);
    }

    // 6. Log quote asynchronously (errors must not break response)
    supabase.from("shipping_quotes").insert({
      zip_code: rawCep,
      city,
      state,
      product_value: productValue,
      result_json: options,
      source: "web",
    }).then().catch((e: Error) => console.error("quote_log_error:", e.message));

    // 7. Return result
    return json({ city, state, options, freeThreshold: cfg.free_shipping_threshold }, 200, origin);

  } catch (err: any) {
    console.error("shipping-calculate error:", err?.message);
    return json({ error: "Erro ao calcular frete. Tente novamente." }, 500, origin);
  }
});
