/**
 * STORE CONFIG — edite este arquivo ao clonar para uma nova loja.
 * Todas as referências de marca, domínio, contato e cores vêm daqui.
 */
export const STORE = {
  name: "JR Acessórios",
  shortName: "JR",
  segment: "acessórios e produtos variados",
  description: "Sua loja de acessórios e produtos variados. Ótimos preços, pagamento fácil e entrega rápida.",

  domain: "https://jracessorios.com",

  contact: {
    email: "contato@jracessorios.com",
    emailNotificacoes: "notificacoes@jracessorios.com",
    emailPrivacidade: "privacidade@jracessorios.com",
    phone: "+55-11-99999-9999",
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || "5511954129039",
    instagram: import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/jota.r_acessorios",
  },

  address: {
    street: "Rua Martim Afonso, 431",
    city: "Osasco",
    state: "SP",
    zip: "06233-130",
    country: "BR",
    full: "Rua Martim Afonso, 431 – Osasco/SP",
  },

  /**
   * TEMA — mude aqui para trocar as cores de toda a loja de uma vez.
   * primary     = cor principal (botões, destaques, badges, gold)
   * primaryLight = hover / versão clara
   * background  = fundo da página
   * surface     = cards e painéis
   */
  theme: {
    primary: "#d4af37",
    primaryLight: "#f2ca50",
    primaryDark: "#b8960d",
    background: "#050505",
    surface: "#0f0f0f",
    surfaceAlt: "#0a0a0a",
    pwaTheme: "#0a0a0a",
  },

  seo: {
    defaultTitle: "JR Acessórios — Produtos e Acessórios | Entrega Rápida",
    defaultDescription:
      "JR Acessórios — sua loja de acessórios e produtos variados. Ótimos preços, pagamento com PIX e cartão, entrega no mesmo dia em Osasco/SP e para todo o Brasil.",
    defaultImage: "/hero-bg.png",
    priceRange: "$$",
  },

  pwa: {
    name: "JR Acessórios",
    shortName: "JR",
    description: "Sua loja de acessórios e produtos variados.",
  },
} as const;

export type StoreConfig = typeof STORE;
