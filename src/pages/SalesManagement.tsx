import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Trophy, 
  ArrowLeft, 
  Trash2, 
  Download,
  Diamond,
  History,
  Filter,
  Search,
  ShoppingCart,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useProducts } from '@/hooks/useProducts';
import { useSales, useSalesSummary, useSalesMutations } from '@/hooks/useSales';

const SalesManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costAtSale, setCostAtSale] = useState('');
  const [saleType, setSaleType] = useState<'manual' | 'automatic'>('manual');
  const [notes, setNotes] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales({ date: dateFilter, productId: productFilter, category: categoryFilter });
  const { data: salesSummary } = useSalesSummary({ date: dateFilter, productId: productFilter, category: categoryFilter });
  const { createSale, deleteSale, isCreating, isDeleting } = useSalesMutations();

  const resetForm = () => {
    setSelectedProduct(''); setQuantity(''); setUnitPrice(''); setCostAtSale(''); setSaleType('manual'); setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !unitPrice) {
      toast.error('Campos obrigatórios ausentes');
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const quantityNum = parseInt(quantity);
    if (quantityNum > product.stock) {
      toast.error(`Estoque insuficiente: ${product.stock} disponíveis`);
      return;
    }
    const unitPriceNum = parseFloat(unitPrice);
    const costNum = parseFloat(costAtSale || '0');

    createSale({
      product_id: selectedProduct,
      quantity: quantityNum,
      unit_price: unitPriceNum,
      cost_at_sale: costNum,
      total_price: quantityNum * unitPriceNum,
      category: product.category || '',
      sale_type: saleType,
      notes,
      responsible_user_id: user?.id || '',
    }).then(() => {
      setIsDialogOpen(false);
      resetForm();
    });
  };

  const handleExportCSV = () => {
    if (sales.length === 0) { toast.error('Sem dados para exportação'); return; }
    const headers = ['Data', 'Peça', 'Categoria', 'Qtd', 'Preço', 'Custo', 'Total', 'Lucro'];
    const rows = sales.map(sale => {
      const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
      const profit = (sale.unit_price - cost) * sale.quantity;
      return [
        format(new Date(sale.sale_date), 'dd/MM/yyyy'),
        sale.product?.name || '?',
        sale.category || 'Geral',
        sale.quantity,
        sale.unit_price.toFixed(2),
        cost.toFixed(2),
        sale.total_price.toFixed(2),
        profit.toFixed(2)
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `relatorio_vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
    toast.success('Relatório exportado com sucesso');
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) { setUnitPrice(product.price.toString()); setCostAtSale((product.cost ?? 0).toString()); }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white/40 uppercase tracking-widest font-black">Acesso Restrito</p></div>;

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
            <h1 className="text-xl font-serif font-black text-white uppercase tracking-[0.2em]">Fluxo de <span className="text-[#d4af37]">Caixa</span></h1>
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleExportCSV} className="text-white/40 hover:text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-full">
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-full transition-all hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10">
                  <Plus className="h-4 w-4 mr-2" /> Registrar Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white rounded-[32px] overflow-hidden p-0">
                <div className="p-8 border-b border-white/5 bg-black/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold text-white">Novo Registro</DialogTitle>
                    <DialogDescription className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">Insira os detalhes da transação comercial.</DialogDescription>
                  </DialogHeader>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* Seleção de Produto */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                        <Diamond className="w-3.5 h-3.5" />
                      </div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Peça Exclusiva</Label>
                    </div>
                    <Select value={selectedProduct} onValueChange={handleProductChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-[#d4af37]/20 transition-all">
                        <SelectValue placeholder="Selecione uma peça" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f0f] border-white/10 text-white rounded-2xl">
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer">
                            <div className="flex justify-between w-full items-center gap-12">
                              <span>{p.name}</span>
                              <span className="text-[#d4af37] font-serif font-black">R$ {p.price.toFixed(2)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade e Preço */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Quantidade</Label>
                      </div>
                      <Input 
                        type="number" 
                        min="1" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-blue-500/20" 
                        placeholder="1" 
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Preço Venda</Label>
                      </div>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={unitPrice} 
                        onChange={(e) => setUnitPrice(e.target.value)} 
                        className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-green-500/20" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Custo Operacional */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Custo Operacional (un)</Label>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={costAtSale} 
                      onChange={(e) => setCostAtSale(e.target.value)} 
                      className="bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-red-500/20" 
                      placeholder="0.00" 
                    />
                  </div>

                  {/* Notas Internas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Filter className="w-3.5 h-3.5" />
                      </div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Notas Internas</Label>
                    </div>
                    <Textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      className="bg-white/5 border-white/10 rounded-2xl min-h-[80px] focus:ring-purple-500/20 resize-none" 
                      placeholder="Opcional: detalhes da transação..." 
                    />
                  </div>

                  {/* Resumo de Profitability */}
                  {quantity && unitPrice && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Volume Total</span>
                        <span className="text-lg font-serif font-black text-white">R$ {(parseInt(quantity) * parseFloat(unitPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className={`p-5 rounded-2xl border ${
                        (parseFloat(unitPrice) - parseFloat(costAtSale || '0')) > 0 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-red-500/5 border-red-500/20"
                      }`}>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Lucro Estimado</span>
                        <span className={`text-lg font-serif font-black ${
                          (parseFloat(unitPrice) - parseFloat(costAtSale || '0')) > 0 
                            ? "text-green-400" 
                            : "text-red-400"
                        }`}>
                          R$ {(parseInt(quantity) * (parseFloat(unitPrice) - parseFloat(costAtSale || '0'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsDialogOpen(false)} 
                      className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px] h-12 px-6 rounded-xl transition-all"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isCreating} 
                      className="bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-10 h-12 rounded-full hover:bg-[#f2ca50] transition-all shadow-xl shadow-[#d4af37]/10"
                    >
                      {isCreating ? "Registrando..." : "Confirmar Registro"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-8 py-12">
        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Volume Bruto', value: `R$ ${salesSummary?.total_sales_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: `${salesSummary?.total_transactions || 0} Operações`, icon: DollarSign, color: 'text-green-400' },
            { label: 'Itens Distribuídos', value: salesSummary?.total_quantity_sold || 0, sub: 'Unidades totais', icon: Package, color: 'text-blue-400' },
            { label: 'Líder de Vendas', value: salesSummary?.best_selling_quantity || 0, sub: salesSummary?.best_selling_product_name || 'Nenhum', icon: TrendingUp, color: 'text-orange-400' },
            { label: 'Alpha Profit', value: `R$ ${salesSummary?.most_profitable_profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: salesSummary?.most_profitable_product_name || 'Nenhum', icon: Trophy, color: 'text-[#d4af37]' }
          ].map((card, i) => (
            <div key={i} className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 group hover:border-[#d4af37]/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5" /></div>
                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-[#d4af37] transition-colors" />
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{card.label}</p>
              <h3 className="text-2xl font-serif font-black text-white mt-1">{card.value}</h3>
              <p className="text-xs text-white/40 mt-2 font-medium line-clamp-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Intelligence Filters */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 mb-12 flex flex-wrap items-end gap-8">
          <div className="flex-1 min-w-[200px] space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><CalendarIcon className="w-3 h-3" /> Período</Label>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none" />
          </div>
          <div className="flex-1 min-w-[200px] space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><Diamond className="w-3 h-3" /> Peça</Label>
            <Select value={productFilter} onValueChange={(v) => setProductFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-2xl text-white">
                <SelectValue placeholder="Todas as peças" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
                <SelectItem value="all">Todas as peças</SelectItem>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px] space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><Filter className="w-3 h-3" /> Categoria</Label>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-2xl text-white">
                <SelectValue placeholder="Geral" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(dateFilter || productFilter || categoryFilter) && (
            <Button variant="ghost" onClick={() => { setDateFilter(''); setProductFilter(''); setCategoryFilter(''); }} className="h-14 px-8 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/5 rounded-2xl">Resetar</Button>
          )}
        </div>

        {/* Transaction Ledger */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]"><History className="w-5 h-5" /></div>
              <h3 className="text-xl font-serif font-bold text-white">Livro de Operações</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{sales.length} Entradas Registradas</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Timestamp</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ativo Comercial</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Volume</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Preço Unit.</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Total Bruto</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Lucro Líquido</TableHead>
                  <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
                  const profit = (sale.unit_price - cost) * sale.quantity;
                  return (
                    <TableRow key={sale.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <TableCell className="py-6 px-8 text-xs font-bold text-white/40 uppercase tracking-tighter">
                        {format(new Date(sale.sale_date), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white uppercase tracking-tight">{sale.product?.name || 'Item Removido'}</span>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{sale.category || 'Geral'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-center">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black">{sale.quantity}x</Badge>
                      </TableCell>
                      <TableCell className="py-6 text-right text-sm font-medium text-white/60">R$ {sale.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="py-6 text-right text-sm font-serif font-black text-white">R$ {sale.total_price.toFixed(2)}</TableCell>
                      <TableCell className={`py-6 text-right text-sm font-serif font-black ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        R$ {profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-6 px-8 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteSale(sale.id)} disabled={isDeleting} className="text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">LUMINA TECH — EXCLUSIVE SALES LEDGER</p>
      </footer>
    </div>
  );
};

export default SalesManagement;