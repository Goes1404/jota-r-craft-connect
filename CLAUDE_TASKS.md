# Tarefas pendentes para o Claude (Otimizações Go-Live & LGPD)

Este arquivo contém as instruções e o código necessário para implementar as melhorias restantes no projeto **Jota R Craft Connect**.

---

## 🚀 Tarefa 1: Direito à Exportação de Dados (LGPD Art. 20)
**Objetivo:** Permitir que o usuário logado baixe seus dados cadastrais, pedidos e favoritos em um arquivo JSON diretamente na página de perfil.

### Arquivo a ser modificado: `src/pages/Profile.tsx`
Adicione um botão na seção de configurações do perfil para exportar os dados.

#### Código de Exemplo para a Função de Exportação:
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Dentro do componente Profile:
const { user } = useAuth();

const handleExportData = async () => {
  if (!user) return;
  
  try {
    toast.loading("Preparando seus dados...");
    
    // Busca dados cadastrais
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    // Busca pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id);

    const userData = {
      exportedAt: new Date().toISOString(),
      profile: profile || {},
      orders: orders || [],
      lawConsent: "LGPD Art. 20 - Direito de Portabilidade e Acesso"
    };

    // Cria e baixa o JSON
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jr-acessorios-dados-usuario-${user.id.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Dados exportados com sucesso!");
  } catch (error) {
    console.error(error);
    toast.error("Erro ao exportar dados. Tente novamente.");
  }
};
```

---

## 🧪 Tarefa 2: Adicionar Testes de Fluxo Crítico (Login → Checkout)
**Objetivo:** Implementar testes de integração/E2E usando o Vitest que já está configurado no projeto.

### Novo arquivo: `src/tests/checkout.test.tsx`
Crie um teste que verifique se o fluxo básico de adicionar produto ao carrinho e redirecionar ao checkout está funcionando.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '@/contexts/CartContext';
import { BrowserRouter } from 'react-router-dom';

describe('Fluxo Crítico de Compra', () => {
  it('deve permitir adicionar um item ao carrinho', () => {
    // Escreva o mock e renderização dos componentes principais aqui
    expect(true).toBe(true);
  });
});
```

---

## 🔑 Tarefa 3: Configuração de Chaves de Produção (Placeholders)
**Objetivo:** Substituir as chaves de teste por credenciais reais de produção antes do go-live.

### Ações:
1. **Google Analytics 4:** Substituir `'G-XXXXXXXXXX'` no arquivo `src/hooks/useAnalytics.tsx` pelo ID de Medição real gerado no painel do GA4.
2. **Mercado Pago:** Substituir o valor de `VITE_MP_PUBLIC_KEY` no arquivo `.env` pela chave pública de produção do Mercado Pago.
3. **Stripe:** Substituir o valor de `VITE_STRIPE_PUBLISHABLE_KEY` no `.env` pela chave pública de produção da Stripe.

---

## 📱 Tarefa 4: Método de Pagamento Mobile Express (Apple Pay / Google Pay)
**Objetivo:** Oferecer carteiras expressas no checkout móvel para aumentar as taxas de conversão de clientes iOS/Android.

### Ações:
- Integrar a carteira móvel utilizando a SDK da Stripe no checkout (`src/pages/Checkout.tsx`) para renderizar o botão expresso quando disponível no dispositivo móvel do usuário.

---

## 🛡️ Tarefa 5: Configuração de Produção do Mercado Pago (Webhooks, Secrets e Migrations)
**Objetivo:** Habilitar e configurar o webhook de pagamentos do Mercado Pago em produção para sincronização em tempo real de status de pedidos.

### Passos de Configuração:
- **[ ] A:** Adicionar o secret `MP_WEBHOOK_SECRET` nas Edge Functions do Supabase:
  - Acesse: *Supabase Dashboard → Project Settings → Edge Functions → Secrets*
- **[ ] B:** Adicionar o secret `ALLOWED_ORIGIN` com o seu domínio real de produção no mesmo local para segurança de requisições do checkout.
- **[ ] C:** Registrar a URL do webhook no painel do Mercado Pago:
  - Acesse: *Mercado Pago Dashboard → Suas integrações → Webhooks* e aponte para a Edge Function de notificação.
- **[ ] D:** Aplicar as 3 novas migrations pendentes no banco de dados para suportar a sincronização:
  - Execute no terminal local: `supabase db push` ou copie as queries das migrations e execute no *Supabase Dashboard → SQL Editor*.

---

## 📦 Instruções de Instalação de Dependências
Caso as dependências ainda não tenham sido instaladas localmente no ambiente de desenvolvimento, execute:
```bash
npm install react-ga4 web-vitals
npm install -D vite-plugin-pwa
```

---

## 📝 Status das Tarefas Concluídas
* `[x]` **Item 7:** Documentação do `.env.example` com instruções detalhadas.
* `[x]` **Item 8:** Rastreamento de erros no `ErrorBoundary.tsx` enviando os logs para o Supabase (`site_errors`).
* `[x]` **Item 9 & 16 & 20:** Configuração do Google Analytics 4 com consentimento categorizado LGPD e envio automático de Web Vitals.
* `[x]` **Item 10:** Hero image pré-carregada (`preload`) no `index.html`.
* `[x]` **Item 11:** Code splitting estruturado em chunks no `vite.config.ts`.
* `[x]` **Item 12:** Apple touch icon configurado.
* `[x]` **Item 14:** Suporte PWA adicionado.
* `[x]` **Item 15:** Scroll Restoration automático adicionado com o componente `ScrollToTop`.
* `[x]` **Item 19:** Verificação estrita de tipos (`tsc --noEmit`) injetada no script de build.
* `[x]` **Tarefa 1:** Direito à Exportação de Dados (LGPD Art. 20) — botão `Exportar Meus Dados` adicionado em `src/pages/Profile.tsx`.
* `[x]` **Tarefa 2:** Teste de Fluxo Crítico criado em `src/tests/checkout.test.tsx`.
* `[ ]` **Tarefa 3:** Configuração de Chaves de Produção (Placeholders).
* `[ ]` **Tarefa 4:** Método de Pagamento Mobile Express (Apple Pay / Google Pay).
* `[ ]` **Tarefa 5:** Configuração de Produção do Mercado Pago.

