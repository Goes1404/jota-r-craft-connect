import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  PieChart
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

const AdminProducts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  });

  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: allProducts = [], isLoading } = useAdminProducts();
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const products = allProducts.filter(product => {
    const matchesName = product.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesCategory = !categoryFilter || product.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'available' && product.stock > 0) ||
      (statusFilter === 'out-of-stock' && product.stock === 0) ||
      (statusFilter === 'featured' && product.is_featured);
    
    return matchesName && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

  const totalInventoryCost = allProducts.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0);
  const totalInventoryRetail = allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const highStockProducts = allProducts.filter(p => p.stock >= 20);

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
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image && formData.images.length === 0) {
      toast({ title: 'Atenção', description: 'O upload de imagem é obrigatório para curadoria.', variant: 'destructive' });
      return;
    }
    
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      description: formData.description,
      detailed_description: formData.detailed_description,
      image: formData.image || formData.images[0],
      images: formData.images,
      category: formData.category,
      stock: parseInt(formData.stock),
      is_featured: formData.is_featured,
    };

    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, product: productData });
    } else {
      await createProduct(productData);
    }
    resetForm();
    setIsDialogOpen(false);
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
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="text-white/40 hover:text-[#d4af37] transition-colors p-0">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Painel</span>
            </Button>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <h1 className="text-xl font-serif font-black text-white uppercase tracking-[0.2em]">Curadoria <span className="text-[#d4af37]">Peças</span></h1>
          </div>
          
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
                    <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 h-12 rounded-xl" placeholder="Ex: Colares, Brincos" />
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

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Galeria de Imagens</Label>
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                    <MultiImageUpload onImagesChange={(urls) => setFormData({...formData, images: urls})} currentImages={formData.images} />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Breve Descrição</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 focus:border-[#d4af37]/40 rounded-2xl min-h-[100px]" />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Destaque Exclusivo</Label>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-5 h-5 accent-[#d4af37] bg-transparent" />
                    <Label htmlFor="is_featured" className="text-xs font-bold text-white/60">Marcar como produto em destaque (Hero/Bento)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                  <Button type="submit" className="bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-10 h-12 rounded-full hover:bg-[#f2ca50] transition-all">Salvar Alterações</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-8 py-12">
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
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
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
      </main>

      <footer className="py-12 text-center border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">LUMINA TECH — EXCLUSIVE CURATION PANEL</p>
      </footer>
    </div>
  );
};

export default AdminProducts;