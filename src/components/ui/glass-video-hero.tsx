import { useState, useEffect } from "react";
import { Maximize2, Minimize2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4";

// Frame estático mostrado enquanto o vídeo carrega — e como fallback
// permanente para quem ativou economia de dados / reduzir movimento.
const POSTER_URL = "/placeholder.svg";

const HeroSection = () => {
  const [fullBleed, setFullBleed] = useState(true);
  const navigate = useNavigate();

  // Respeita preferências de sistema: não roda vídeo pesado se o usuário
  // pediu menos movimento ou está economizando dados (rede móvel).
  const [playVideo, setPlayVideo] = useState(false);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // @ts-expect-error — Save-Data não está no lib.dom padrão
    const saveData = navigator.connection?.saveData === true;
    setPlayVideo(!reduceMotion && !saveData);
  }, []);

  return (
    <section
      className={`relative w-full overflow-hidden bg-black transition-[min-height] duration-500 ease-in-out
        ${fullBleed ? "min-h-[100svh]" : "min-h-[72svh] py-24 lg:py-32"}`}
    >
      {/* ── Mídia de fundo ── */}
      {playVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={POSTER_URL}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      ) : (
        <img
          src={POSTER_URL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* ── Scrim: garante contraste do texto em qualquer frame / sob sol ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/45 to-black/85"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]"
      />

      {/* ── Toggle de altura (safe-area aware, alvo ≥44px) ── */}
      <button
        onClick={() => setFullBleed((v) => !v)}
        aria-label={fullBleed ? "Reduzir altura" : "Tela cheia"}
        className="absolute z-20 grid place-items-center w-11 h-11 rounded-xl
          backdrop-blur-xl border border-[#d4af37]/30 bg-black/40 text-[#d4af37]
          hover:bg-black/60 active:scale-90 transition-all
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {fullBleed ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* ── Conteúdo: centralizado verticalmente, CTA sempre na dobra ── */}
      <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center
        text-center px-5 sm:px-6"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >

        {/* Pill */}
        <div className="inline-flex items-center gap-2 h-9 pl-1.5 pr-3.5 rounded-full
          backdrop-blur-xl border border-[#d4af37]/30 bg-[#d4af37]/[0.08]">
          <span className="inline-flex items-center gap-1 bg-[#d4af37] text-black font-black
            text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> Novo
          </span>
          <span className="font-sans font-medium text-xs sm:text-sm text-white/80 tracking-wide">
            Coleção Lumina 2026 chegou
          </span>
        </div>

        {/* Headline — tipografia fluida, não estoura em 320px */}
        <h1 className="font-serif font-bold text-white mt-6 max-w-4xl
          text-[clamp(2rem,9vw,5.5rem)] leading-[1.05] tracking-[-0.02em]">
          Tecnologia que
          <br className="hidden sm:block" />
          <span className="text-[#d4af37] italic font-light"> veste você</span>
        </h1>

        {/* Subtexto */}
        <p className="font-sans text-base sm:text-lg text-white/55 mt-5 max-w-md sm:max-w-xl leading-relaxed">
          Acessórios premium com curadoria por IA, entrega no mesmo dia em Osasco/SP
          e garantia total. Eleve seu setup.
        </p>

        {/* CTAs — full-width na thumb zone do mobile, lado a lado no desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8
          w-full max-w-sm sm:max-w-none sm:w-auto">
          <button
            onClick={() => navigate("/produtos")}
            className="group flex items-center justify-center gap-2 h-14 px-8 rounded-full
              bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
              shadow-[0_8px_40px_-8px_rgba(212,175,55,0.5)]
              hover:bg-[#f2ca50] active:scale-[0.98] transition-all"
          >
            Explorar Coleção
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => navigate("/contato")}
            className="flex items-center justify-center h-14 px-8 rounded-full
              backdrop-blur-xl border border-white/15 bg-white/[0.04] text-white
              font-black text-[11px] uppercase tracking-[0.2em]
              hover:bg-white/[0.1] hover:border-white/30 active:scale-[0.98] transition-all"
          >
            Falar com Curadoria
          </button>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };
