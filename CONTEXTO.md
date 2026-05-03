# Contexto do Projeto: JR Acessórios / Lumina Tech

## 1. Visão Geral do Domínio
O projeto é uma plataforma premium de e-commerce e CRM desenvolvida para a **JR Acessórios** e gerenciada/suportada pela **Lumina Tech**. O sistema é focado no mercado de luxo e possui a **Lumina**, uma inteligência artificial (Concierge Virtual) integrada tanto para o autoatendimento dos clientes quanto para suporte estratégico aos administradores (geração de abordagens de vendas personalizadas).

## 2. Stack Tecnológica
- **Frontend**: React (construído e empacotado via Vite).
- **Estilização**: Tailwind CSS.
- **Ícones**: Lucide React.
- **Datas**: `date-fns` (configurado para locale `pt-BR`).
- **Backend & BaaS**: Supabase.
  - **Autenticação**: Supabase Auth.
  - **Banco de Dados**: PostgreSQL com RLS (Row Level Security).
  - **Serverless**: Supabase Edge Functions (ex: função `ai-assistant` para integrar com IA).

## 3. Identidade Visual e UI/UX (Design System)
- **Estilo**: Tema *Luxury* (luxo, exclusivo, elegante).
- **Cores Principais**:
  - Fundos predominantemente pretos/escuros (`#000000`, `#050505`, `#0a0a0a`, `#0f0f0f`).
  - Textos secundários acinzentados/brancos opacos (`#e2e2e2`, `text-white/40`).
  - Destaques em **Dourado** (`#d4af37`, `#f2ca50`).
- **Efeitos Comuns**: Glassmorphism (`backdrop-blur`), bordas sutis com transparência (`border-white/5`), glows e blurs animados para dar sensação premium.
- **Tipografia**: Uso mesclado de fontes sem serifa (textos base) e fontes serifadas (`font-serif`) para cabeçalhos e destaques.

## 4. Estrutura de Funcionalidades
### Área do Cliente (B2C)
- **Auth**: Registro, Login e Recuperação de senha customizados.
- **Atendimento**: Chat com o Concierge Virtual Lumina (IA) e encaminhamento para o WhatsApp humano.

### Área Administrativa (CRM e Logística - B2B)
- **Visão 360 / CRM**:
  - Gestão de clientes com cálculo automático de **LTV (Lifetime Value)**, ticket médio e contagem de pedidos.
  - **Segmentação Automática**: Clientes marcados com badges dinâmicas (VIP, Recorrente, Novo, Esfriando).
  - **Lumina CRM AI**: Geração de mensagens de WhatsApp persuasivas e exclusivas baseadas nos dados e histórico do cliente.
- **Logística**: Fila de despacho de pedidos, inserção de código de rastreio, atualização de status e comunicação com o cliente via WhatsApp com mensagens pré-formatadas.
- **Carrinhos Abandonados**: Tabela e fluxo para acompanhamento/recuperação de carrinhos (`abandoned_carts`).

## 5. Diretrizes de Código
- **Idioma**: A interface é estritamente em **Português do Brasil (pt-BR)**.
- **Comunicações**: O tom de voz da plataforma e da IA deve ser sempre sofisticado, polido, focado em alta conversão e atendimento VIP.
- **Boas Práticas**: Usar utilitários do Tailwind para toda a estilização e sempre realizar os tratamentos de erro nas interações com o Supabase antes de exibir `toasts` ao usuário.