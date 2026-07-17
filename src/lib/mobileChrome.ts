/**
 * Rotas que já exibem uma barra de ação fixa na base no mobile
 * (checkout e detalhe do produto com "Comprar"). Nelas escondemos os
 * botões flutuantes (WhatsApp, IA) para não cobrir o CTA de compra.
 */
export function hasOwnFixedActionBar(pathname: string): boolean {
  return pathname === '/checkout' || pathname.startsWith('/produto/');
}
