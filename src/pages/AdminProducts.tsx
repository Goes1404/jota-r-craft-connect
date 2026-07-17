import React, { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MultiImageUpload from '@/components/MultiImageUpload';
import ProductAdGenerator from '@/components/ProductAdGenerator';
import { normalizeCategory } from '@/lib/categories';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  Hash,
  AlertTriangle,
  Diamond,
  Search,
  Filter,
  CheckCircle2,
  Star,
  TrendingDown,
  PieChart,
  Sparkles,
  Loader2,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAdminProducts, useProductMutations } from '@/hooks/useProducts';
import { Product } from '@/types/database';
import PdfBulkImport from '@/components/PdfBulkImport';

const AdminProducts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    description: '',
    detailed_description: '',
    image: '',
    images: [] as string[],
    category: '',
    stock: '',
    is_featured: false,
    weight: '',
    height: '',
    width: '',
    length: '',
  });

  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  const { data: allProducts = [], isLoading } = useAdminProducts();
  const { createProduct, updateProduct, deleteProduct, isCreating, isUpdating } = useProductMutations();
  const isSaving = isCreating || isUpdating;

  const products = useMemo(() => allProducts.filter(product => {
    const matchesName = product.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesCategory = !categoryFilter || product.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && product.stock > 0) ||
      (statusFilter === 'out-of-stock' && product.stock === 0) ||
      (statusFilter === 'featured' && product.is_featured);

    return matchesName && matchesCategory && matchesStatus;
  }), [allProducts, nameFilter, categoryFilter, statusFilter]);

  const categories = useMemo(
    () => [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [allProducts]
  );

  const { totalInventoryCost, totalInventoryRetail, highStockProducts } = useMemo(() => ({
    totalInventoryCost: allProducts.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0),
    totalInventoryRetail: allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0),
    highStockProducts: allProducts.filter(p => p.stock >= 20),
  }), [allProducts]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      cost: '',
      description: '',
      detailed_description: '',
      image: '',
      images: [],
      category: '',
      stock: '',
      is_featured: false,
      weight: '',
      height: '',
      width: '',
      length: '',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost?.toString() || '0',
      description: product.description || '',
      detailed_description: product.detailed_description || '',
      image: product.image,
      images: product.images || [product.image].filter(Boolean),
      category: product.category || '',
      stock: product.stock.toString(),
      is_featured: product.is_featured,
      weight: product.weight?.toString() || '',
      height: product.height?.toString() || '',
      width: product.width?.toString() || '',
      length: product.length?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // evita duplo clique criando produto duplicado
    if (!formData.image && formData.images.length === 0) {
      toast({ title: 'Atenção', description: 'O upload de imagem é obrigatório para curadoria.', variant: 'destructive' });
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: 'Preço inválido', description: 'Informe um preço de venda maior que zero.', variant: 'destructive' });
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast({ title: 'Estoque inválido', description: 'Informe uma quantidade de estoque válida (0 ou mais).', variant: 'destructive' });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      price,
      cost: parseFloat(formData.cost) || 0,
      description: formData.description,
      detailed_description: formData.detailed_description,
      image: formData.image || formData.images[0],
      images: formData.images,
      category: normalizeCategory(formData.category),
      stock,
      is_featured: formData.is_featured,
      weight: parseFloat(formData.weight) || 0.3,
      height: parseFloat(formData.height) || 10,
      width: parseFloat(formData.width) || 15,
      length: parseFloat(formData.length) || 20,
    };

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, product: productData });
      } else {
        await createProduct(productData);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch {
      // erro já exibido no toast da mutation; mantém o modal aberto
      // para o lojista corrigir sem perder o que preencheu
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast({ title: 'Informe o nome do produto primeiro', variant: 'destructive' });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          task: 'generate_description',
          productName: formData.name,
          category: formData.category
        }
      });

      if (error) throw error;
      setFormData(prev => ({
        ...prev,
        description: data.description || prev.description,
        detailed_description: data.detailed_description || prev.detailed_description,
      }));
      toast({
        title: 'Descrição gerada pela Lumina AI!',
        description: 'A IA pesquisou especificações técnicas reais na web e preencheu a descrição curta e a detalhada.',
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao conectar com a IA', variant: 'destructive' });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja remover este item da coleção definitiva?')) {
      await deleteProduct(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <AdminShell
      eyebrow="Catálogo"
      title="Curadoria de Peças"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
            {/* PDF Bulk Import */}
            <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="border border-white/10 text-white/50 hover:text-[#d4af37] hover:border-[#d4af37]/30 font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-full transition-all">
                  <FileText className="h-4 w-4 mr-2" /> Importar PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white rounded-[32px] overflow-hidden p-0">
                <div className="p-8 border-b border-white/5 bg-black/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold text-white">
                      Importar Produtos via PDF
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">
                      A IA extrai automaticamente os produtos do documento.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8">
                  <PdfBulkImport
                    onImportComplete={() => {
                      setIsPdfDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-full transition-all hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-white rounded-[32px] overflow-hidden p-0">
              <div className="p-8 border-b border-white/5 bg-black/50">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif font-bold text-white">
                    {editingProduct ? 'Refinar Peça' : 'Nova Obra Prima'}
                  </DialogTitle>
                  <DialogDescription className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">
                    Defina os detalhes da peça para a coleção Lumina Tech.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Nome do Produto</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" required />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Categoria</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      list="category-suggestions"
                      className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl"
                      placeholder="Ex: Fone via Bluetooth, Mouse"
                    />
                    {/* Sugestões das categorias já cadastradas — evita duplicatas por digitação */}
                    <datalist id="category-suggestions">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: c })}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                              formData.category === c
                                ? 'border-[#d4af37]/60 bg-[#d4af37]/10 text-[#d4af37]'
                                : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Preço Venda (R$)</Label>
                    <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" required />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Custo (R$)</Label>
                    <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Estoque Disponível</Label>
                    <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" required />
                  </div>
                </div>

                {/* Dimensões para cálculo de frete (Melhor Envio). Opcionais — se vazias, usa um padrão seguro. */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Dimensões para Frete <span className="text-white/20 normal-case tracking-normal">(opcional — usado no cálculo de envio)</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-white/20">Peso (kg)</Label>
                      <Input type="number" step="0.01" placeholder="0.3" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-white/20">Altura (cm)</Label>
                      <Input type="number" step="0.1" placeholder="10" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-white/20">Largura (cm)</Label>
                      <Input type="number" step="0.1" placeholder="15" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-white/20">Comprimento (cm)</Label>
                      <Input type="number" step="0.1" placeholder="20" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Galeria de Imagens</Label>
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                    <MultiImageUpload key={editingProduct?.id ?? 'new'} onImagesChange={(urls) => setFormData({...formData, images: urls})} currentImages={formData.images} />
                  </div>
                </div>

                {/* Estúdio de IA — gera imagens comerciais a partir das fotos da galeria */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Estúdio de IA — Imagens Comerciais</Label>
                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/[0.03] p-6">
                    <ProductAdGenerator
                      images={formData.images}
                      productName={formData.name}
                      description={formData.description}
                      onGenerated={(newUrls) => setFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls] }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Breve Descrição</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDescription}
                      className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg"
                    >
                      {isGeneratingDescription ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                      Sugerir com IA
                    </Button>
                  </div>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 rounded-2xl min-h-[100px]" />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Descrição Detalhada / Ficha Técnica <span className="text-white/20 normal-case tracking-normal">(aparece na página do produto — aceita markdown)</span>
                  </Label>
                  <Textarea value={formData.detailed_description} onChange={(e) => setFormData({...formData, detailed_description: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 rounded-2xl min-h-[160px]" placeholder="Use o botão 'Sugerir com IA' acima para preencher com especificações técnicas reais do produto." />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Destaque Exclusivo</Label>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-5 h-5 accent-[#d4af37] bg-transparent" />
                    <Label htmlFor="is_featured" className="text-xs font-bold text-white/60">Marcar como produto em destaque (Hero/Bento)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                  <Button type="submit" disabled={isSaving} className="bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-10 h-12 rounded-full hover:bg-[#f2ca50] transition-all disabled:opacity-60">
                    {isSaving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Salvando...</>) : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
        {/* Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] relative z-10">Custo Total de Estoque</p>
            <h3 className="text-2xl font-serif font-black text-white mt-1 relative z-10">R$ {totalInventoryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-white/40 mt-2 font-medium relative z-10">Capital imobilizado</p>
          </div>

          <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] relative z-10">Valor de Venda (VGV)</p>
            <h3 className="text-2xl font-serif font-black text-green-400 mt-1 relative z-10">R$ {totalInventoryRetail.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-white/40 mt-2 font-medium relative z-10">Lucro projetado: R$ {(totalInventoryRetail - totalInventoryCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] relative z-10">Estoque Encalhado / Alto</p>
            <h3 className="text-2xl font-serif font-black text-orange-400 mt-1 relative z-10">{highStockProducts.length} Peças</h3>
            <p className="text-xs text-white/40 mt-2 font-medium relative z-10">Acima de 20 unidades paradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-3 space-y-8">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-widest">Refinar Busca</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Termo de Busca</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Procurar..." className="bg-black/40 border-white/10 pl-12 h-12 rounded-xl text-white outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Categoria</Label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-sm text-white/60 outline-none focus:border-[#d4af37]/40">
                    <option value="">Todas as Peças</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Status de Inventário</Label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-4 text-sm text-white/60 outline-none focus:border-[#d4af37]/40">
                    <option value="all">Todo o Acervo</option>
                    <option value="available">Disponíveis</option>
                    <option value="out-of-stock">Esgotados</option>
                    <option value="featured">Destaques</option>
                  </select>
                </div>

                <Button variant="ghost" onClick={() => { setNameFilter(''); setCategoryFilter(''); setStatusFilter('all'); }} className="w-full text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/5 h-12 rounded-xl">Limpar Filtros</Button>
              </div>
            </div>
            
            <div className="p-8 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-[32px] space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Status da Coleção</span>
              </div>
              <p className="text-3xl font-serif font-black text-white">{products.length} <span className="text-sm font-sans font-bold text-white/40">Itens Exibidos</span></p>
            </div>
          </div>

          {/* Products List */}
          <div className="md:col-span-9">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-black/50 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Obra / Descrição</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Valor</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Inventário</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Status</TableHead>
                    <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="py-32 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af37] mx-auto"></div></TableCell></TableRow>
                  ) : products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-32 text-center text-white/20 uppercase tracking-[0.2em] font-bold">Nenhuma peça encontrada no acervo.</TableCell></TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="py-6 px-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black border border-white/10 group-hover:scale-105 transition-transform flex-shrink-0">
                              <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white uppercase tracking-tight">{product.name}</span>
                                {product.is_featured && <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />}
                              </div>
                              <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-black border-white/10 text-white/30">{product.category}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 text-right">
                          <div className="space-y-1">
                            <span className="text-sm font-serif font-black text-[#d4af37]">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Custo: R$ {product.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${product.stock < 5 ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' : 'border-white/5 bg-black text-white/40'}`}>
                            <span className="text-xs font-black">{product.stock}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">un</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <Badge className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            product.stock === 0 ? 'bg-red-500/10 text-red-500 border-none' :
                            product.stock < 5 ? 'bg-orange-500/10 text-orange-500 border-none' :
                            'bg-green-500/10 text-green-500 border-none'
                          }`}>
                            {product.stock === 0 ? 'Esgotado' : product.stock < 5 ? 'Crítico' : 'Ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-6 px-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="text-white/40 hover:text-white hover:bg-white/5 rounded-full p-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-white/40 hover:text-red-500 hover:bg-red-500/5 rounded-full p-2">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
    </AdminShell>
  );
};

export default AdminProducts;