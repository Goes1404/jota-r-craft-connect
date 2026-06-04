import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

export function DemoSmoke() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Render a custom gold smoke background */}
        <SmokeBackground smokeColor="#d4af37" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-black/60 backdrop-blur-xl border border-[#d4af37]/20 p-8 rounded-3xl text-center space-y-6">
        <h1 className="text-3xl font-serif font-black text-[#d4af37] uppercase tracking-[0.25em]">
          Efeito Fumaça
        </h1>
        <p className="text-white/60 text-sm leading-relaxed">
          Este é o fundo interativo WebGL2 rodando de forma ultra-otimizada diretamente no canvas da GPU.
        </p>
      </div>
    </div>
  );
}

export default DemoSmoke;
