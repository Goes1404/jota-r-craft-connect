import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSalesMutations } from '@/hooks/useSales';
import { compressImage, fileToBase64 } from '@/lib/imageCompression';
import { matchProduct, AUTO_ACCEPT_SCORE } from '@/lib/fuzzyMatch';
import { normalizeCategory } from '@/lib/categories';
import { AdminConfirmDialog } from '@/components/admin/ui';
import { Product } from '@/types/database';
import {
  Camera, ImageIcon, Loader2, Trash2, AlertTriangle, Check, Plus, RefreshCcw, NotebookPen,
} from 'lucide-react';

// ─── Contrato da edge function parse-sale-photo ──────────────────────────────
interface ApiLine {
  raw_text: string;
  product_id: string | null;
  product_name_guess: string;
  quantity: number | null;
  unit_price: number | null;
  confidence: number;
  warnings: string[];
}

interface ExtractedLine extends ApiLine {
  uid: string;
  selected: boolean;
  /** Produto veio do casamento aproximado local, não da IA — merece conferência. */
  suggested: boolean;
  candidates: { id: string; name: string }[];
  duplicate: boolean;
}

const WARNING_LABEL: Record<string, string> = {
  preco_ilegivel: 'preço ilegível',
  quantidade_ilegivel: 'qtd. ilegível',
  possivel_rasura: 'possível rasura',
  total_inconsistente: 'confira: valor pode ser o total',
  produto_ambiguo: 'produto ambíguo',
};

/** Alerta de preço bem fora do catálogo — pega erro de leitura (120 lido como 12). */
const PRICE_GAP_ALERT = 0.3;

const money = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const todayISO = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD local

interface Props {
  onImportComplete: () => void;
}

const SalePhotoImport: React.FC<Props> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { createSales, isCreatingBatch } = useSalesMutations();

  const [step, setStep] = useState<'idle' | 'analyzing' | 'review' | 'saving'>('idle');
  const [lines, setLines] = useState<ExtractedLine[]>([]);
  const [saleDate, setSaleDate] = useState<string>(todayISO());
  const [photoHash, setPhotoHash] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  /** Produtos criados durante esta revisão — evita corrida com o refetch do catálogo. */
  const [justCreated, setJustCreated] = useState<Product[]>([]);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    justCreated.forEach((p) => byId.set(p.id, p));
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [products, justCreated]);

  const productOf = (id: string | null) => (id ? catalog.find((p) => p.id === id) : undefined);

  // Estoque comprometido POR PRODUTO somando todas as linhas marcadas — uma
  // mesma página pode ter duas linhas do mesmo item.
  const allocated = useMemo(() => {
    const map = new Map<string, number>();
    lines.filter((l) => l.selected && l.product_id).forEach((l) => {
      map.set(l.product_id!, (map.get(l.product_id!) ?? 0) + (l.quantity ?? 0));
    });
    return map;
  }, [lines]);

  const lineIssue = (line: ExtractedLine): string | null => {
    if (!line.selected) return null;
    if (!line.product_id) return 'Escolha a peça';
    if (!line.quantity || line.quantity <= 0) return 'Informe a quantidade';
    if (line.unit_price === null || line.unit_price < 0) return 'Informe o preço';
    const product = productOf(line.product_id);
    const used = allocated.get(line.product_id) ?? 0;
    if (product && used > (product.stock ?? 0)) {
      return `Estoque insuficiente — ${product.stock ?? 0} disponíveis, ${used} nesta página`;
    }
    return null;
  };

  /**
   * Preço lido muito fora do catálogo — pega erro de leitura (120,00 virando
   * 12,00). Calculado com os números reais, não com julgamento da IA: desconto
   * de balcão é normal, então só destaca diferença grande.
   */
  const priceGap = (line: ExtractedLine): boolean => {
    const product = productOf(line.product_id);
    const catalogPrice = Number(product?.price ?? 0);
    if (!product || !catalogPrice || line.unit_price === null) return false;
    return Math.abs(line.unit_price - catalogPrice) / catalogPrice > PRICE_GAP_ALERT;
  };

  const selectedLines = lines.filter((l) => l.selected);
  const blockers = selectedLines.map(lineIssue).filter(Boolean) as string[];
  const totalValue = selectedLines.reduce(
    (sum, l) => sum + (l.quantity ?? 0) * (l.unit_price ?? 0), 0,
  );

  const reset = () => {
    setStep('idle');
    setLines([]);
    setErrorMsg(null);
    setPhotoHash('');
    setJustCreated([]);
    setSaleDate(todayISO());
  };

  // ── 1. Foto → IA ───────────────────────────────────────────────────────────
  const handleFile = async (rawFile?: File) => {
    if (!rawFile) return;
    setErrorMsg(null);

    let file: File;
    try {
      // 2000px preserva a legibilidade do manuscrito (o Estúdio usa 1536 porque
      // lá a imagem é só matéria-prima visual, não texto a ser lido).
      file = await compressImage(rawFile, { maxDimension: 2000, quality: 0.9 });
    } catch (err: any) {
      toast({ title: 'Imagem inválida', description: err.message, variant: 'destructive' });
      return;
    }

    setStep('analyzing');
    try {
      const [base64, hash] = await Promise.all([fileToBase64(file), hashFile(file)]);
      setPhotoHash(hash);

      const { data, error: fnError } = await supabase.functions.invoke('parse-sale-photo', {
        body: { imageBase64: base64 },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.unreadable) {
        setErrorMsg(
          data.reason ||
          'Não consegui ler esta foto. Fotografe a página inteira, de frente, com boa luz e sem sombra.',
        );
        setStep('idle');
        return;
      }

      const apiLines: ApiLine[] = Array.isArray(data?.lines) ? data.lines : [];
      if (apiLines.length === 0) {
        setErrorMsg('Nenhuma venda foi identificada nesta página.');
        setStep('idle');
        return;
      }

      const prepared = apiLines.map((line, i) => reconcile(line, i));
      const withDupes = await flagDuplicates(prepared, hash);

      setLines(withDupes);
      setSaleDate(typeof data?.page_date === 'string' ? data.page_date : todayISO());
      setStep('review');

      if (data?.catalog_truncated) {
        toast({
          title: 'Catálogo grande',
          description: 'Só os 400 primeiros produtos foram considerados no casamento automático.',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao ler a foto.');
      setStep('idle');
    }
  };

  /** Valida o match da IA e, quando ela não achou, tenta casamento aproximado local. */
  const reconcile = (line: ApiLine, index: number): ExtractedLine => {
    const base: ExtractedLine = {
      ...line,
      uid: `${Date.now()}-${index}`,
      selected: true,
      suggested: false,
      candidates: [],
      duplicate: false,
    };

    // A IA pode devolver um id que não existe mais (catálogo mudou) — não confiar.
    if (line.product_id && catalog.some((p) => p.id === line.product_id)) return base;

    const query = line.product_name_guess || line.raw_text;
    const match = matchProduct(query, catalog);
    return {
      ...base,
      product_id: match.best?.id ?? null,
      suggested: !!match.best,
      candidates: match.score >= AUTO_ACCEPT_SCORE
        ? []
        : match.candidates.map((c) => ({ id: c.item.id, name: c.item.name })),
    };
  };

  /** Marca linhas caso esta MESMA foto já tenha sido lançada antes (hash no notes). */
  const flagDuplicates = async (prepared: ExtractedLine[], hash: string) => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('id, sale_date')
        .ilike('notes', `%#${hash}%`)
        .limit(1);
      if (data && data.length > 0) {
        const when = new Date(data[0].sale_date).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
        setDupWarning(when);
        return prepared.map((l) => ({ ...l, duplicate: true }));
      }
    } catch {
      /* checagem best-effort — nunca bloqueia o fluxo */
    }
    return prepared;
  };

  // ── 2. Edição das linhas ───────────────────────────────────────────────────
  const patch = (uid: string, changes: Partial<ExtractedLine>) =>
    setLines((prev) => prev.map((l) => (l.uid === uid ? { ...l, ...changes } : l)));

  const handleProductChange = (uid: string, productId: string) => {
    const product = catalog.find((p) => p.id === productId);
    setLines((prev) => prev.map((l) => {
      if (l.uid !== uid) return l;
      // Preço do papel manda: só preenche se a IA não conseguiu ler nenhum.
      const unit_price = l.unit_price === null ? Number(product?.price ?? 0) : l.unit_price;
      return { ...l, product_id: productId, unit_price, suggested: false, candidates: [] };
    }));
  };

  /** Cadastra na hora um item que não existe no catálogo e vincula à linha. */
  const handleCreateProduct = async (line: ExtractedLine) => {
    const name = (line.product_name_guess || line.raw_text).trim().slice(0, 120);
    if (!name) {
      toast({ title: 'Sem nome para cadastrar', variant: 'destructive' });
      return;
    }
    setCreatingFor(line.uid);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          price: line.unit_price ?? 0,
          cost: 0,
          category: normalizeCategory(''),
          // A venda já aconteceu: nascendo com o estoque desta linha, o trigger
          // desconta em seguida e o produto termina zerado (em vez de negativo).
          stock: line.quantity ?? 1,
          image: '',
          images: [],
          is_featured: false,
        })
        .select()
        .single();
      if (error) throw error;

      setJustCreated((prev) => [...prev, data as Product]);
      patch(line.uid, { product_id: (data as Product).id, suggested: false, candidates: [] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Produto cadastrado', description: `${name} — ajuste o estoque depois em Produtos.` });
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar produto', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingFor(null);
    }
  };

  // ── 3. Salvar ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (selectedLines.length === 0 || blockers.length > 0) return;
    setStep('saving');
    try {
      const rows = selectedLines.map((l) => {
        const product = productOf(l.product_id)!;
        const qty = l.quantity!;
        const unit = l.unit_price!;
        return {
          product_id: l.product_id!,
          quantity: qty,
          unit_price: unit,
          cost_at_sale: Number(product.cost ?? 0),
          total_price: Math.round(qty * unit * 100) / 100,
          category: product.category || '',
          sale_type: 'manual' as const,
          notes: `Lançado por foto #${photoHash}: "${l.raw_text}"`,
          responsible_user_id: user?.id || '',
          sale_date: new Date(`${saleDate}T12:00:00`).toISOString(),
        };
      });

      await createSales(rows);
      reset();
      onImportComplete();
    } catch {
      // Erro já foi exibido pelo toast da mutation; mantém a revisão intacta.
      setStep('review');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="p-12 text-center space-y-5">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mx-auto" />
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-white">A IA está lendo sua página…</p>
          <p className="text-[11px] text-white/40">Pode levar até 40 segundos.</p>
        </div>
      </div>
    );
  }

  if (step === 'idle') {
    return (
      <div className="p-8 space-y-5">
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="border-2 border-dashed border-white/10 hover:border-[#d4af37]/40 rounded-3xl p-10 text-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] mx-auto mb-5">
            <NotebookPen className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-white mb-1.5">Fotografe a página do caderno</p>
          <p className="text-[11px] text-white/40 mb-7 max-w-xs mx-auto leading-relaxed">
            A IA lê as vendas escritas à mão e você confere antes de lançar. Página inteira,
            de frente e com boa luz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => cameraRef.current?.click()}
              className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-7 h-11 rounded-full hover:bg-[#f2ca50]"
            >
              <Camera className="w-4 h-4 mr-2" /> Tirar foto
            </Button>
            <Button
              variant="ghost"
              onClick={() => galleryRef.current?.click()}
              className="bg-white/5 border border-white/10 text-white/60 hover:text-white font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Escolher da galeria
            </Button>
          </div>
        </div>

        {/* capture="environment" abre a câmera traseira direto no celular */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    );
  }

  // step === 'review' | 'saving'
  const saving = step === 'saving' || isCreatingBatch;
  return (
    <div className="p-8 space-y-6">
      <AdminConfirmDialog
        open={!!dupWarning}
        onOpenChange={(open) => !open && setDupWarning(null)}
        title="Esta foto já foi lançada"
        description={`Encontramos vendas desta mesma foto em ${dupWarning}. Se lançar de novo, as vendas ficarão duplicadas.`}
        confirmLabel="Entendi, vou conferir"
        destructive={false}
        onConfirm={() => setDupWarning(null)}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="sale-photo-date" className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Data das vendas
          </Label>
          <Input
            id="sale-photo-date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="bg-white/5 border-white/10 h-11 rounded-xl w-44"
          />
        </div>
        <p className="text-[11px] text-white/40">
          {selectedLines.length} de {lines.length} {lines.length === 1 ? 'linha' : 'linhas'} ·{' '}
          <span className="text-[#d4af37] font-bold">R$ {money(totalValue)}</span>
        </p>
      </div>

      <div className="max-h-[46vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {lines.map((line) => {
          const issue = lineIssue(line);
          const missingProduct = line.selected && !line.product_id;
          return (
            <div
              key={line.uid}
              className={`p-4 rounded-2xl border transition-all ${
                !line.selected ? 'border-white/5 bg-black/30 opacity-50'
                  : issue && !missingProduct ? 'border-red-500/40 bg-red-500/[0.04]'
                  : missingProduct ? 'border-amber-500/40 bg-amber-500/[0.04]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => patch(line.uid, { selected: !line.selected })}
                  aria-label={line.selected ? 'Desmarcar linha' : 'Marcar linha'}
                  className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all ${
                    line.selected ? 'bg-[#d4af37] text-black' : 'bg-white/5 border border-white/15'
                  }`}
                >
                  {line.selected && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0 space-y-3">
                  {/* Transcrição — é o que o lojista usa para auditar a leitura */}
                  <p className="font-mono text-[11px] text-white/35 truncate" title={line.raw_text}>
                    {line.raw_text || '—'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_5rem_7rem] gap-2.5">
                    <Select value={line.product_id ?? ''} onValueChange={(v) => handleProductChange(line.uid, v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-xs">
                        <SelectValue placeholder="Escolha a peça" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f0f] border-white/10 text-white rounded-2xl max-h-64">
                        {catalog.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="rounded-xl cursor-pointer text-xs">
                            <span className="flex justify-between gap-8 w-full">
                              <span>{p.name}</span>
                              <span className="text-[#d4af37]">R$ {money(Number(p.price))}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number" min="1" step="1" placeholder="Qtd"
                      value={line.quantity ?? ''}
                      onChange={(e) => patch(line.uid, {
                        quantity: e.target.value === '' ? null : parseInt(e.target.value, 10),
                      })}
                      className="bg-white/5 border-white/10 h-11 rounded-xl text-xs"
                      aria-label="Quantidade"
                    />
                    <Input
                      type="number" min="0" step="0.01" placeholder="Preço un."
                      value={line.unit_price ?? ''}
                      onChange={(e) => patch(line.uid, {
                        unit_price: e.target.value === '' ? null : parseFloat(e.target.value),
                      })}
                      className="bg-white/5 border-white/10 h-11 rounded-xl text-xs"
                      aria-label="Preço unitário"
                    />
                  </div>

                  {/* Sugestões do casamento aproximado, quando ele não teve certeza */}
                  {missingProduct && line.candidates.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-white/25">Será que é:</span>
                      {line.candidates.map((c) => (
                        <button
                          key={c.id} type="button"
                          onClick={() => handleProductChange(line.uid, c.id)}
                          className="px-2.5 py-1 rounded-full text-[9px] font-bold border border-white/10 text-white/50 hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-colors"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    {line.suggested && (
                      <Badge tone="amber">sugerido — confira</Badge>
                    )}
                    {line.confidence < 0.6 && <Badge tone="amber">conferir leitura</Badge>}
                    {line.duplicate && <Badge tone="amber">possível duplicata</Badge>}
                    {line.warnings.map((w) => (
                      <Badge key={w} tone="amber">{WARNING_LABEL[w] ?? w}</Badge>
                    ))}
                    {priceGap(line) && (
                      <Badge tone="amber">
                        catálogo: R$ {money(Number(productOf(line.product_id)!.price))}
                      </Badge>
                    )}
                    {issue && <Badge tone={missingProduct ? 'amber' : 'red'}>{issue}</Badge>}
                  </div>

                  {missingProduct && (
                    <Button
                      type="button" variant="ghost" size="sm"
                      disabled={creatingFor === line.uid}
                      onClick={() => handleCreateProduct(line)}
                      className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg"
                    >
                      {creatingFor === line.uid
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                        : <Plus className="w-3 h-3 mr-1.5" />}
                      Cadastrar "{(line.product_name_guess || line.raw_text).slice(0, 24)}" no catálogo
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((l) => l.uid !== line.uid))}
                  aria-label="Descartar linha"
                  className="text-white/20 hover:text-red-400 transition-colors p-2 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {blockers.length > 0 && (
        <p className="text-[11px] text-amber-400/90 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {blockers.length} {blockers.length === 1 ? 'linha precisa' : 'linhas precisam'} de ajuste antes de lançar.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/5">
        <Button
          type="button" variant="ghost" onClick={reset} disabled={saving}
          className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px] h-11 px-5 rounded-xl"
        >
          <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Outra foto
        </Button>
        <Button
          type="button" onClick={handleSave}
          disabled={saving || selectedLines.length === 0 || blockers.length > 0}
          className="bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-8 h-11 rounded-full hover:bg-[#f2ca50] disabled:opacity-40"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Lançando…</>
            : `Lançar ${selectedLines.length} ${selectedLines.length === 1 ? 'venda' : 'vendas'}`}
        </Button>
      </div>
    </div>
  );
};

const Badge: React.FC<{ tone: 'amber' | 'red'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
    tone === 'red'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  }`}>
    {children}
  </span>
);

/** SHA-256 curto do arquivo — identifica a MESMA foto reenviada. */
async function hashFile(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 12);
  } catch {
    return Date.now().toString(36); // ambiente sem crypto.subtle (http) — segue sem dedupe
  }
}

export default SalePhotoImport;
