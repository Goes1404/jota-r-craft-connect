import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, chunkIndex } = await req.json()

    if (!text || text.trim().length < 5) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada no Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 25-second hard timeout — well under Supabase's 60s limit
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    let result: any
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // gpt-4o-mini: ~5x faster than gpt-4o, resolves the 504 timeout
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 900,
          messages: [
            {
              role: 'system',
              content: `Você extrai produtos de textos e retorna SOMENTE um array JSON válido.
Cada item deve ter: { "name": string, "price": number, "cost": number, "description": string, "category": string, "stock": number }
Regras:
- price e cost: números em reais (ex: 99.90). Se custo não informado, use 0.
- stock: padrão 1 se não informado.
- category: infira pelo contexto (ex: "Colares", "Brincos", "Anéis", "Pulseiras").
- Retorne [] se não encontrar produtos.
- NENHUM texto fora do JSON. Nenhum markdown.`,
            },
            {
              role: 'user',
              content: `Parte ${chunkIndex ?? 1}. Extraia os produtos:\n\n${text}`,
            },
          ],
        }),
        signal: controller.signal,
      })

      result = await response.json()
    } finally {
      clearTimeout(timeoutId)
    }

    if (result.error) throw new Error(result.error.message)

    const raw = result.choices?.[0]?.message?.content?.trim() ?? '[]'
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let items: any[] = []
    try {
      const parsed = JSON.parse(clean)
      items = Array.isArray(parsed) ? parsed : []
    } catch {
      items = []
    }

    // Sanitize each item
    items = items.map((item) => ({
      name: String(item.name ?? '').trim(),
      price: Number(item.price) || 0,
      cost: Number(item.cost) || 0,
      description: String(item.description ?? '').trim(),
      category: String(item.category ?? '').trim(),
      stock: Number(item.stock) || 1,
    })).filter((item) => item.name.length > 0)

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    const isTimeout = error.name === 'AbortError'
    return new Response(
      JSON.stringify({
        error: isTimeout
          ? 'Tempo esgotado. O trecho enviado é muito longo — tente reduzir o tamanho do PDF.'
          : error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isTimeout ? 408 : 500,
      }
    )
  }
})
