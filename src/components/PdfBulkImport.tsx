import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Package,
} from 'lucide-react';

interface ExtractedProduct {
  name: string;
  price: number;
  cost: number;
  description: string;
  category: string;
  stock: number;
  selected: boolean;
}

// Load PDF.js from CDN once
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.id = 'pdfjs-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
    if (!document.getElementById('pdfjs-cdn')) {
      document.head.appendChild(script);
    }
  });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  return fullText.trim();
};

// Split text at paragraph/line boundaries, max 2000 chars per chunk
const chunkText = (text: string, maxSize = 2000): string[] => {
  const paragraphs = text.split(/\n{2,}|\r\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Force-split any chunk still too large
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxSize) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxSize) {
        result.push(chunk.slice(i, i + maxSize));
      }
    }
  }
  return result.filter((c) => c.length > 0);
};

interface Props {
  onImportComplete: () => void;
}

const PdfBulkImport: React.FC<Props> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'idle' | 'extracting' | 'analyzing' | 'review' | 'saving'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pre-load PDF.js in background
  useEffect(() => {
    loadPdfJs().catch(() => {});
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setProducts([]);

    try {
      // 1. Extract text
      setStep('extracting');
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }

      if (!text || text.trim().length < 20) {
        throw new Error('Não foi possível extrair texto do arquivo. Tente um PDF baseado em texto (não escaneado).');
      }

      // 2. Chunk and analyze
      const chunks = chunkText(text, 2000);
      setStep('analyzing');
      setProgress({ current: 0, total: chunks.length });

      const allItems: ExtractedProduct[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProgress({ current: i + 1, total: chunks.length });

        const { data, error: fnError } = await supabase.functions.invoke('pdf-import', {
          body: { text: chunks[i], chunkIndex: i + 1 },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        const items: ExtractedProduct[] = (data?.items ?? []).map((item: any) => ({
          ...item,
          selected: true,
        }));
        allItems.push(...items);
      }

      if (allItems.length === 0) {
        throw new Error('Nenhum produto foi identificado no arquivo. Verifique o formato do conteúdo.');
      }

      setProducts(allItems);
      setStep('review');
    } catch (err: any) {
      setError(err.message ?? 'Erro desconhecido');
      setStep('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    const toSave = products.filter((p) => p.selected);
    if (toSave.length === 0) {
      toast({ title: 'Selecione ao menos um produto', variant: 'destructive' });
      return;
    }

    setStep('saving');
    try {
      const rows = toSave.map(({ selected: _s, ...p }) => ({
        ...p,
        image: '',
        images: [],
        is_featured: false,
      }));

      const { error: dbError } = await supabase.from('products').insert(rows);
      if (dbError) throw new Error(dbError.message);

      toast({ title: `${toSave.length} produto(s) importado(s) com sucesso!` });
      onImportComplete();
      setStep('idle');
      setProducts([]);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
      setStep('review');
    }
  };

  const toggleAll = (checked: boolean) =>
    setProducts((prev) => prev.map((p) => ({ ...p, selected: checked })));

  const toggleOne = (idx: number) =>
    setProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
    );

  const selectedCount = products.filter((p) => p.selected).length;

  // ── Idle / Upload ────────────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-[#d4af37]/40 rounded-3xl p-12 text-center cursor-pointer transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#d4af37]/20 transition-colors">
            <Upload className="w-6 h-6 text-[#d4af37]" />
          </div>
          <p className="text-sm font-bold text-white/60">Arraste um PDF ou clique para selecionar</p>
          <p className="text-xs text-white/20 mt-1">PDF baseado em texto ou .TXT — máx. 20 MB</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  // ── Extracting / Analyzing ───────────────────────────────────────────────────
  if (step === 'extracting' || step === 'analyzing') {
    return (
      <div className="py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold text-white/80">
            {step === 'extracting' ? 'Extraindo texto do PDF...' : `Analisando parte ${progress.current} de ${progress.total}...`}
          </p>
          {step === 'analyzing' && progress.total > 0 && (
            <div className="w-64 mx-auto h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4af37] rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
            {step === 'analyzing' ? 'IA extraindo produtos — aguarde' : 'Processando arquivo'}
          </p>
        </div>
      </div>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────────
  if (step === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{products.length} produtos identificados</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">{selectedCount} selecionados para importar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(true)}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white h-8"
            >
              Todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(false)}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white h-8"
            >
              Nenhum
            </Button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {products.map((product, idx) => (
            <div
              key={idx}
              onClick={() => toggleOne(idx)}
              className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                product.selected
                  ? 'border-[#d4af37]/30 bg-[#d4af37]/5'
                  : 'border-white/5 bg-black/30 opacity-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                product.selected ? 'border-[#d4af37] bg-[#d4af37]' : 'border-white/20'
              }`}>
                {product.selected && <CheckCircle2 className="w-3 h-3 text-black" />}
              </div>

              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-white/20" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{product.name}</p>
                <p className="text-[10px] text-white/30 truncate">
                  {product.category} · Estoque: {product.stock}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-serif font-black text-[#d4af37]">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
                {product.cost > 0 && (
                  <p className="text-[9px] text-white/20">
                    Custo: R$ {product.cost.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProducts((prev) => prev.filter((_, i) => i !== idx));
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={() => { setStep('idle'); setProducts([]); }}
            className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedCount === 0}
            className="bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-8 h-11 rounded-full hover:bg-[#f2ca50] disabled:opacity-30"
          >
            Importar {selectedCount} produto{selectedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    );
  }

  // ── Saving ───────────────────────────────────────────────────────────────────
  return (
    <div className="py-16 text-center space-y-4">
      <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
      <p className="text-sm font-bold text-white/60">Salvando produtos...</p>
    </div>
  );
};

export default PdfBulkImport;
