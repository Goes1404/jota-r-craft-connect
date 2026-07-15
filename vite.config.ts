import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      // Service worker autodestrutivo: desregistra qualquer SW antigo e limpa
      // todos os caches no navegador do visitante. Corrige o "app travado" causado
      // por SW antigo servindo index.html cacheado apontando p/ assets que sumiram.
      selfDestroying: true,
      registerType: 'autoUpdate',
      useCredentials: true,
      manifest: {
        // ⚠️ AO CLONAR: atualize estes campos (e src/config/store.ts)
        name: 'JR Acessórios',
        short_name: 'JR',
        description: 'Sua boutique online de acessórios premium.',
        theme_color: '#0a0a0a',
        icons: [
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Navegadores modernos: menos transpilação/polyfill = bundles menores
    target: 'es2020',
    rollupOptions: {
      output: {
        // Separa vendors pesados em chunks próprios: melhora cache do navegador
        // entre deploys e reduz o JS baixado na primeira visita.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
  },
}));
