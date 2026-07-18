/**
 * Pré-carrega os chunks das rotas mais navegadas no hover/touch dos CTAs.
 * Os dynamic imports são memoizados pelo navegador — chamadas repetidas são grátis.
 */
export const preloadProducts = () => import('@/pages/Products');
export const preloadProductDetails = () => import('@/pages/ProductDetails');
