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
  }
}));
