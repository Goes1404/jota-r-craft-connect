// Supabase Edge Function — sitemap
// Gera o sitemap.xml dinamicamente: rotas estáticas + página de cada produto.
// O vercel.json reescreve /sitemap.xml para esta função, então o Google
// sempre enxerga o catálogo atual sem ninguém precisar atualizar arquivo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE = Deno.env.get("STORE_URL") || "https://jracessorios.com";

const STATIC_ROUTES: Array<[path: string, changefreq: string, priority: string]> = [
  ["/", "weekly", "1.0"],
  ["/produtos", "daily", "0.9"],
  ["/contato", "monthly", "0.6"],
  ["/termos", "yearly", "0.3"],
  ["/privacidade", "yearly", "0.3"],
];

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls: string[] = [];
    for (const [path, freq, prio] of STATIC_ROUTES) {
      urls.push(
        `  <url>\n    <loc>${BASE}${path}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`,
      );
    }
    for (const p of products ?? []) {
      const lastmod = p.updated_at ? `\n    <lastmod>${new Date(p.updated_at).toISOString().slice(0, 10)}</lastmod>` : "";
      urls.push(
        `  <url>\n    <loc>${BASE}/produto/${p.id}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Cache de 1h na borda: alivia o banco e mantém o sitemap fresco
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("sitemap error:", err);
    return new Response("sitemap unavailable", { status: 500 });
  }
});
