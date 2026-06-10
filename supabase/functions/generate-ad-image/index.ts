import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORE_URL = Deno.env.get('STORE_URL') || "https://jracessorios.com";
const STORE_NAME = Deno.env.get('STORE_NAME') || "JR Acessórios";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === STORE_URL || origin === STORE_URL.replace('https://', 'https://www.')) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function makeCors(origin: string | null): Record<string, string> {
  const allowed = (origin && isAllowedOrigin(origin)) ? origin : STORE_URL;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

// Presets de estilo de comercial — viram parte do prompt enviado à IA.
const STYLE_PRESETS: Record<string, string> = {
  luxo: "fundo escuro elegante com iluminação dramática dourada, estética de joalheria de luxo, reflexos suaves, profundidade de campo cinematográfica, premium e sofisticado",
  minimalista: "fundo limpo e minimalista em tons neutros, muito espaço negativo, iluminação suave de estúdio, estética de catálogo premium da Apple",
  vibrante: "fundo colorido vibrante e moderno, iluminação energética, estética de campanha publicitária jovem e chamativa, alto contraste",
  natural: "ambiente lifestyle natural, luz do dia suave, contexto de uso real, estética aspiracional e autêntica",
  festivo: "ambiente festivo e luxuoso, luzes douradas desfocadas (bokeh), clima de celebração e presente especial",
};

serve(async (req) => {
  const corsHeaders = makeCors(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Autorização: apenas admins ───────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Autorização real via app_metadata (is_admin lê app_metadata, não user_metadata).
    const { data: isAdmin } = await authedClient.rpc("is_admin");
    if (isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

    const { imageUrl, imageBase64, description, style, headline } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(JSON.stringify({ error: "Envie uma imagem (imageUrl ou imageBase64)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega a imagem de origem como blob
    let imageBlob: Blob;
    if (imageBase64) {
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      imageBlob = new Blob([bytes], { type: "image/png" });
    } else {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) {
        return new Response(JSON.stringify({ error: "Não foi possível carregar a imagem enviada" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      imageBlob = await imgResp.blob();
    }

    const stylePrompt = STYLE_PRESETS[style as string] || STYLE_PRESETS.luxo;

    const prompt = [
      `Crie uma imagem publicitária profissional de alta qualidade para e-commerce da marca '${STORE_NAME}'.`,
      `Produto/contexto: ${description || "produto em destaque"}.`,
      `Estilo visual desejado: ${stylePrompt}.`,
      headline ? `Se fizer sentido, deixe espaço de composição para um texto de chamada como: "${headline}".` : "",
      "Mantenha o produto da imagem original como protagonista, com proporções e características fiéis. Resultado pronto para anúncio, qualidade fotográfica de estúdio, sem marcas d'água.",
    ].filter(Boolean).join(" ");

    // Monta multipart para o endpoint de edição de imagem do gpt-image-1
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("image", imageBlob, "source.png");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("n", "1");

    const openaiResp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    const data = await openaiResp.json();

    if (!openaiResp.ok) {
      console.error("OpenAI image error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data?.error?.message || `OpenAI ${openaiResp.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "A IA não retornou imagem" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Salva o resultado no Storage para histórico/reuso (best-effort)
    let publicUrl: string | null = null;
    try {
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `ads/${user.id}/${Date.now()}.png`;
      const { error: upErr } = await adminClient.storage
        .from("product-images")
        .upload(path, bytes, { contentType: "image/png", upsert: false });
      if (!upErr) {
        publicUrl = adminClient.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
    } catch (_) { /* histórico é opcional */ }

    return new Response(
      JSON.stringify({ success: true, imageBase64: `data:image/png;base64,${b64}`, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-ad-image error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
