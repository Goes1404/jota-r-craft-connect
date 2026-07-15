import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
  const corsHeaders = makeCors(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task, productName, category, prompt, message, history, context } = await req.json()

    // Configuração da API da OpenAI
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave de API OPENAI_API_KEY não configurada no Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // ── Descrição de produto: busca especificações técnicas REAIS na web ──
    if (task === 'generate_description') {
      const instructions =
        `Você é um copywriter técnico de elite para a loja ${STORE_NAME} (e-commerce brasileiro de acessórios). ` +
        `Pesquise na web as especificações técnicas REAIS do produto informado (fabricante, site oficial, fichas técnicas). ` +
        `Não invente especificações: se não encontrar um dado, omita-o. Escreva em português do Brasil.`

      const searchPrompt =
        `Produto: "${productName}"${category ? ` (categoria: ${category})` : ''}.\n\n` +
        `1) Pesquise as especificações técnicas reais deste produto.\n` +
        `2) Responda APENAS com um JSON válido (sem cercas de código) no formato:\n` +
        `{\n` +
        `  "description": "descrição curta de vitrine (2-3 frases, persuasiva, citando 1-2 diferenciais técnicos reais)",\n` +
        `  "detailed_description": "descrição completa em markdown: 1 parágrafo de apresentação + seção '### Ficha Técnica' com lista de especificações reais encontradas (material, dimensões, compatibilidade, bateria, conectividade, etc.)"\n` +
        `}`

      const resp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          tools: [{ type: 'web_search_preview' }],
          instructions,
          input: searchPrompt,
        }),
      })

      const data = await resp.json()
      if (!resp.ok || data.error) {
        throw new Error(data?.error?.message || `OpenAI ${resp.status}`)
      }

      // Extrai o texto da resposta (Responses API)
      let text: string = data.output_text
        || (data.output || [])
          .filter((o: any) => o.type === 'message')
          .flatMap((o: any) => o.content || [])
          .filter((c: any) => c.type === 'output_text')
          .map((c: any) => c.text)
          .join('\n')
        || ''

      // Tenta parsear o JSON pedido; se falhar, usa o texto inteiro como descrição
      let description = text
      let detailed = ''
      try {
        const cleaned = text.replace(/```json|```/g, '').trim()
        const jsonStart = cleaned.indexOf('{')
        const jsonEnd = cleaned.lastIndexOf('}')
        const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))
        description = parsed.description || text
        detailed = parsed.detailed_description || ''
      } catch (_) { /* mantém texto bruto */ }

      return new Response(
        JSON.stringify({ description, detailed_description: detailed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let systemPrompt = `Você é o Lumina AI, o assistente inteligente da ${STORE_NAME}. Sua missão é ajudar na gestão da loja com foco em luxo, eficiência e inteligência de negócios.`
    let userPrompt = prompt || message || ""

    systemPrompt += ` Contexto atual: ${JSON.stringify(context)}. Responda de forma executiva e use markdown.`

    // Preparar mensagens incluindo histórico
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: userPrompt }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
      }),
    })

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message)
    }

    const aiText = result.choices[0].message.content

    return new Response(
      JSON.stringify({ text: aiText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
