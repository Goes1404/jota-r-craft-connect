# ROADMAP — JR Acessórios (jul/2026)

Roadmap de melhorias solicitadas. Itens marcados ✅ já foram implementados neste ciclo.

## 1. Modo Claro (leitura sob luz do sol)
- [x] Tokens de tema claro em `src/index.css` (`.light`)
- [x] Camada de overrides `src/light-theme.css` para as cores escuras hardcoded (bg-black, text-white, etc.)
- [x] Toggle funcional com `next-themes` (persistência em localStorage, padrão escuro)
- [x] Botão de alternância no Header do site e no AdminShell
- [ ] (Futuro) Migrar gradualmente classes hardcoded para tokens semânticos (`bg-background`, `text-foreground`)

## 2. Admin — Correções de front-end
- [x] Corrigir chamadas de toast quebradas em `AdminProducts.tsx` (`toast.error`/`toast.success` não existem no hook shadcn — quebrava a tela ao gerar descrição)
- [x] Adicionar campo "Descrição Detalhada" no formulário de produto (existia no estado mas não na UI)
- [x] Organizar o formulário do produto em seções mais claras

## 3. Upload de fotos > 5MB
- [x] Compressão/redimensionamento automático no navegador antes do upload (canvas → WebP/JPEG, máx. 1920px)
- [x] Aceitar arquivos de até 25MB (após compressão ficam pequenos)
- [x] Aplicado em `MultiImageUpload` (produtos) e no gerador de imagens

## 4. IA — Descrições técnicas reais
- [x] `ai-assistant` (edge function): tarefa `generate_description` agora usa a OpenAI Responses API com **web search** para buscar especificações técnicas reais do produto na internet
- [x] Retorna descrição curta (vitrine) + descrição detalhada com ficha técnica
- [x] Front preenche os dois campos automaticamente

## 5. Estúdio de IA no card de produto
- [x] Gerador de imagem comercial embutido no diálogo de adicionar/editar produto
- [x] Seleção de múltiplas fotos da galeria para gerar múltiplas imagens no mesmo estilo
- [x] Imagens geradas entram direto na galeria do produto (salvas no Storage)
- [x] Página `/admin/studio` continua disponível para uso avulso

## 6. SEO — Posicionamento em buscas
- [x] `public/robots.txt` com referência ao sitemap
- [x] `public/sitemap.xml` com as rotas públicas
- [x] JSON-LD melhorado (Store + Product já existiam; adicionado WebSite + SearchAction)
- [x] `og:image` com URL absoluta
- [ ] (Futuro) Pre-render/SSR das páginas de produto (Vercel prerender ou migração p/ framework SSR) — SPA pura limita indexação de conteúdo dinâmico
- [ ] (Futuro) Sitemap dinâmico com URLs de produtos (edge function agendada)
- [ ] (Futuro) Google Search Console: enviar sitemap e monitorar cobertura

## 7. Performance — Fluidez da aplicação
- [x] Code-splitting de vendors no Vite (`manualChunks`: react, ui, charts, motion, supabase, stripe)
- [x] React Query com `staleTime`/`gcTime` padrão (evita refetch a cada navegação)
- [x] `loading="lazy"` + `decoding="async"` nas imagens de produto
- [x] Fontes Google com carregamento otimizado
- [ ] (Futuro) Servir imagens redimensionadas via Supabase Image Transformations (`?width=`)
- [ ] (Futuro) Avaliar remoção do Lenis smooth-scroll em mobile (custo de main-thread)
- [ ] (Futuro) Lighthouse CI para evitar regressões
