import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://jracessorios.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task, productName, category, prompt, history, context } = await req.json()

    // Configuração da API da OpenAI
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave de API OPENAI_API_KEY não configurada no Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let systemPrompt = "Você é o Lumina AI, o assistente inteligente da JR Acessórios. Sua missão é ajudar na gestão da loja com foco em luxo, eficiência e inteligência de negócios."
    let userPrompt = prompt

    if (task === 'generate_description') {
      systemPrompt = "Você é um copywriter de elite para a marca de semijoias de luxo 'JR Acessórios'."
      userPrompt = `Crie uma descrição sofisticada para o produto "${productName}" da categoria "${category}". Use gatilhos mentais de exclusividade e qualidade. Seja breve (máximo 3 parágrafos).`
    } else {
      systemPrompt += ` Contexto atual: ${JSON.stringify(context)}. Responda de forma executiva e use markdown.`
    }

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
      JSON.stringify(task === 'generate_description' ? { description: aiText } : { text: aiText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
