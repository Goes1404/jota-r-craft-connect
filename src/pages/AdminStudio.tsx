import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Upload, Wand2, Download, Loader2, ImageIcon, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '@/lib/imageCompression';

const STYLES = [
  { id: 'luxo', label: 'Luxo', emoji: '✨', desc: 'Fundo escuro, luz dourada dramática' },
  { id: 'minimalista', label: 'Minimalista', emoji: '⚪', desc: 'Limpo, neutro, estilo Apple' },
  { id: 'vibrante', label: 'Vibrante', emoji: '🎨', desc: 'Colorido, jovem, chamativo' },
  { id: 'natural', label: 'Lifestyle', emoji: '🌿', desc: 'Ambiente real, luz natural' },
  { id: 'festivo', label: 'Festivo', emoji: '🎁', desc: 'Clima de presente, bokeh dourado' },
] as const;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AdminStudio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceBase64, setSourceBase64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [headline, setHeadline] = useState('');
  const [style, setStyle] = useState<string>('luxo');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!user || user.app_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  const handleFile = async (rawFile?: File) => {
    if (!rawFile) return;
    if (!rawFile.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Envie uma imagem.', variant: 'destructive' });
      return;
    }
    let file: File;
    try {
      // Comprime no navegador — fotos de câmera (>4MB) passam a funcionar
      file = await compressImage(rawFile, { maxDimension: 1536 });
    } catch (err: any) {
      toast({ title: 'Imagem inválida', description: err.message, variant: 'destructive' });
      return;
    }
    const b64 = await fileToBase64(file);
    setSourceBase64(b64);
    setSourcePreview(b64);
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!sourceBase64) {
      toast({ title: 'Envie uma foto primeiro', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Escreva uma breve descrição', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-image', {
        body: { imageBase64: sourceBase64, description, style, headline },
      });
      if (error) throw error;
      if (!data?.success || !data?.imageBase64) {
        throw new Error(data?.error || 'Falha ao gerar a imagem');
      }
      setResult(data.imageBase64);
      toast({ title: 'Imagem gerada! 🎉', description: 'Sua peça comercial está pronta.' });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `jr-comercial-${Date.now()}.png`;
    a.click();
  };

  return (
    <AdminShell eyebrow="IA" title="Estúdio de IA" subtitle="Gerador de imagens comerciais">
        <p className="text-[13px] sm:text-sm text-white/50 max-w-2xl mb-6 sm:mb-10 leading-relaxed break-words">
          Envie a foto de um produto, escreva uma breve descrição e a IA gera uma imagem
          de comercial profissional pronta para anúncios e redes sociais.
        </p>

        <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {/* ─── Painel de entrada ─── */}
          <div className="min-w-0 space-y-6">
            {/* Upload */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2.5 sm:mb-3 block break-words">1. Foto do produto</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                className="relative aspect-square w-full rounded-2xl sm:rounded-3xl border-2 border-dashed border-white/10 hover:border-[#d4af37]/40 bg-white/[0.02] cursor-pointer transition-all flex items-center justify-center overflow-hidden group"
              >
                {sourcePreview ? (
                  <>
                    <img src={sourcePreview} alt="Origem" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-2 text-white text-[11px] sm:text-xs font-bold uppercase tracking-widest"><RefreshCw className="w-4 h-4 shrink-0" /> Trocar foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-4 sm:px-6">
                    <Upload className="w-9 h-9 sm:w-10 sm:h-10 text-[#d4af37]/40 mx-auto mb-3" />
                    <p className="text-white/60 text-[13px] sm:text-sm font-bold break-words">Clique ou arraste uma imagem</p>
                    <p className="text-white/20 text-[10px] mt-1 uppercase tracking-wider break-words">PNG / JPG · até 25MB (compressão automática)</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0] || undefined)} />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2.5 sm:mb-3 block break-words">2. Breve descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Fone de ouvido sem fio premium, dourado, para quem busca som de alta qualidade no dia a dia."
                rows={3}
                className="w-full max-w-full bg-white/[0.03] border border-white/10 focus:border-[#d4af37]/40 rounded-2xl p-3.5 sm:p-4 text-white placeholder:text-white/20 outline-none transition-all text-sm resize-none"
              />
            </div>

            {/* Headline opcional */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2.5 sm:mb-3 block break-words">3. Chamada (opcional)</label>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Black Friday · 30% OFF"
                className="w-full max-w-full bg-white/[0.03] border border-white/10 focus:border-[#d4af37]/40 rounded-2xl px-4 h-12 text-white placeholder:text-white/20 outline-none transition-all text-sm"
              />
            </div>

            {/* Estilos */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2.5 sm:mb-3 block break-words">4. Estilo do comercial</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`min-w-0 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all ${
                      style === s.id
                        ? 'border-[#d4af37]/50 bg-[#d4af37]/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{s.emoji}</span>
                    <p className={`text-[11px] sm:text-xs font-bold mt-1 break-words ${style === s.id ? 'text-[#d4af37]' : 'text-white'}`}>{s.label}</p>
                    <p className="text-[9px] text-white/30 leading-tight mt-0.5 break-words">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-[#d4af37] text-black font-black uppercase tracking-widest text-[11px] sm:text-xs h-12 sm:h-14 px-4 rounded-full hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10 transition-all disabled:opacity-60"
            >
              {generating ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0 animate-spin" /> Gerando comercial…</> : <><Wand2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" /> Gerar comercial</>}
            </Button>
          </div>

          {/* ─── Resultado ─── */}
          <div className="min-w-0">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2.5 sm:mb-3 block break-words">Resultado</label>
            <div className="aspect-square w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center px-5 sm:px-8">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5">
                      <div className="absolute inset-0 rounded-full border-2 border-[#d4af37]/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#d4af37] animate-pulse" />
                    </div>
                    <p className="text-white/60 text-[13px] sm:text-sm font-bold break-words">A IA está criando seu comercial…</p>
                    <p className="text-white/20 text-[10px] mt-1 uppercase tracking-wider break-words">Pode levar até 30 segundos</p>
                  </motion.div>
                ) : result ? (
                  <motion.img key="result" src={result} alt="Comercial gerado" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full object-contain" />
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-5 sm:px-8">
                    <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 text-[13px] sm:text-sm break-words">Seu comercial aparecerá aqui</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {result && !generating && (
              <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-4">
                <Button onClick={handleDownload} className="min-w-0 flex-1 basis-[45%] px-3 bg-white/5 border border-white/10 hover:border-[#d4af37]/40 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl">
                  <Download className="w-4 h-4 mr-2 shrink-0" /> Baixar PNG
                </Button>
                <Button onClick={handleGenerate} className="min-w-0 flex-1 basis-[45%] px-3 bg-white/5 border border-white/10 hover:border-[#d4af37]/40 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2 shrink-0" /> Gerar outra
                </Button>
              </div>
            )}
          </div>
        </div>
    </AdminShell>
  );
};

export default AdminStudio;
