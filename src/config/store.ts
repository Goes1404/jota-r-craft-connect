/**
 * STORE CONFIG — edite este arquivo ao clonar para uma nova loja.
 * Todas as referências de marca, domínio, contato e cores vêm daqui.
 */
export const STORE = {
  name: "JR Acessórios",
  shortName: "JR",
  segment: "semijoias de luxo",
  description: "Sua boutique online de semijoias de luxo. Peças exclusivas com qualidade premium.",

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
    defaultTitle: "JR Acessórios — Semijoias de Luxo",
    defaultDescription:
      "Sua boutique online de semijoias de luxo. Anéis, colares, pulseiras e brincos exclusivos com qualidade premium. Frete grátis e entrega rápida.",
    defaultImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
    priceRange: "$$",
  },

  pwa: {
    name: "JR Acessórios",
    shortName: "JR",
    description: "Sua boutique online de semijoias de luxo.",
  },
} as const;

export type StoreConfig = typeof STORE;
