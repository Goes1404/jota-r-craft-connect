import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2, Wand2, CheckCircle2 } from 'lucide-react';

/**
 * Estúdio de IA embutido no formulário de produto.
 * Seleciona uma ou mais fotos já enviadas na galeria e gera, para cada uma,
 * uma imagem comercial no MESMO estilo. As imagens geradas são salvas no
 * Storage pela edge function e adicionadas automaticamente à galeria.
 */

const STYLES = [
  { id: 'luxo', label: 'Luxo', emoji: '✨' },
  { id: 'minimalista', label: 'Minimalista', emoji: '⚪' },
  { id: 'vibrante', label: 'Vibrante', emoji: '🎨' },
  { id: 'natural', label: 'Lifestyle', emoji: '🌿' },
  { id: 'festivo', label: 'Festivo', emoji: '🎁' },
] as const;

interface ProductAdGeneratorProps {
  images: string[];
  productName: string;
  description?: string;
  onGenerated: (newUrls: string[]) => void;
}

export const ProductAdGenerator: React.FC<ProductAdGeneratorProps> = ({
  images,
  productName,
  description,
  onGenerated,
}) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('luxo');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const toggle = (url: string) =>
    setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));

  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast({ title: 'Selecione ao menos uma foto da galeria', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    const generated: string[] = [];
    const failures: string[] = [];

    // Sequencial para não estourar rate limit da API de imagens
    for (let i = 0; i < selected.length; i++) {
      setProgress({ done: i, total: selected.length });
      try {
        const { data, error } = await supabase.functions.invoke('generate-ad-image', {
          body: {
            imageUrl: selected[i],
            description: description || productName,
            style,
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Falha ao gerar');
        if (data.publicUrl) {
          generated.push(data.publicUrl);
        } else {
          failures.push(`Foto ${i + 1}: imagem gerada mas não foi salva no Storage`);
        }
      } catch (err: any) {
        failures.push(`Foto ${i + 1}: ${err.message}`);
      }
    }

    setProgress(null);
    setGenerating(false);

    if (generated.length > 0) {
      onGenerated(generated);
      setSelected([]);
      toast({
        title: `${generated.length} imagem(ns) comercial(is) gerada(s)! 🎉`,
        description: 'Elas foram adicionadas à galeria do produto.',
      });
    }
    if (failures.length > 0) {
      toast({ title: 'Algumas gerações falharam', description: failures.join(' · '), variant: 'destructive' });
    }
  };

  if (images.length === 0) {
    return (
      <p className="text-xs text-white/30">
        Envie fotos na galeria acima para poder gerar imagens comerciais com IA.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#d4af37]" />
        <p className="text-xs text-white/50">
          Selecione as fotos e a IA gera imagens comerciais profissionais no mesmo estilo.
        </p>
      </div>

      {/* Seleção de fotos */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((url, i) => {
          const isSelected = selected.includes(url);
          return (
            <button
              key={url + i}
              type="button"
              onClick={() => toggle(url)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                isSelected ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <img src={url} alt={`Foto ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
              {isSelected && (
                <span className="absolute top-1 right-1 bg-[#d4af37] text-black rounded-full p-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Estilo */}
      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyle(s.id)}
            className={`px-3 h-9 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
              style === s.id
                ? 'border-[#d4af37]/60 bg-[#d4af37]/10 text-[#d4af37]'
                : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/25'
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={generating || selected.length === 0}
        className="w-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/25 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl transition-all disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando {progress ? `${progress.done + 1}/${progress.total}` : ''}… (até 30s por foto)
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Gerar {selected.length > 0 ? `${selected.length} ` : ''}imagem(ns) comercial(is)
          </>
        )}
      </Button>
    </div>
  );
};

export default ProductAdGenerator;
