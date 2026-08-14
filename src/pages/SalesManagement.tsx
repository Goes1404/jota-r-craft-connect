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
  ArrowUpRight,
  Camera,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SalePhotoImport from '@/components/SalePhotoImport';
import { AdminShell } from '@/components/admin/AdminShell';

import { useProducts } from '@/hooks/useProducts';
import { useSales, useSalesSummary, useSalesMutations } from '@/hooks/useSales';

const SalesManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
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
    <AdminShell
      eyebrow="Financeiro"
      title="Fluxo de Caixa"
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">
            <Button variant="ghost" onClick={handleExportCSV} className="text-white/40 hover:text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest px-4 sm:px-6 h-11 sm:h-12 rounded-full">
              <Download className="h-4 w-4 mr-2 shrink-0" /> Exportar
            </Button>
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-[#d4af37]/40 font-bold text-[10px] uppercase tracking-widest px-4 sm:px-6 h-11 sm:h-12 rounded-full transition-all">
                  <Camera className="h-4 w-4 mr-2 shrink-0" /> Lançar por Foto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white rounded-[24px] sm:rounded-[32px] overflow-hidden p-0">
                <div className="p-5 sm:p-8 border-b border-white/5 bg-black/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-white">Lançar por Foto</DialogTitle>
                    <DialogDescription className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold mt-1 break-words">
                      Fotografe a página do caderno e confira antes de lançar.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="min-w-0 max-h-[70vh] overflow-y-auto">
                  <SalePhotoImport onImportComplete={() => setIsPhotoDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-5 sm:px-8 h-11 sm:h-12 rounded-full transition-all hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10">
                  <Plus className="h-4 w-4 mr-2 shrink-0" /> Registrar Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white rounded-[24px] sm:rounded-[32px] overflow-hidden p-0">
                <div className="p-5 sm:p-8 border-b border-white/5 bg-black/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-white">Novo Registro</DialogTitle>
                    <DialogDescription className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold mt-1 break-words">Insira os detalhes da transação comercial.</DialogDescription>
                  </DialogHeader>
                </div>
                <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Seleção de Produto */}
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                        <Diamond className="w-3.5 h-3.5" />
                      </div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Peça Exclusiva</Label>
                    </div>
                    <Select value={selectedProduct} onValueChange={handleProductChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 sm:h-14 rounded-2xl focus:ring-[#d4af37]/20 transition-all">
                        <SelectValue placeholder="Selecione uma peça" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)] bg-[#0f0f0f] border-white/10 text-white rounded-2xl">
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer">
                            <div className="flex w-full min-w-0 items-center justify-between gap-4 sm:gap-12">
                              <span className="min-w-0 truncate">{p.name}</span>
                              <span className="shrink-0 whitespace-nowrap text-[#d4af37] font-serif font-black tabular-nums">R$ {p.price.toFixed(2)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade e Preço */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="min-w-0 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
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
                    <div className="min-w-0 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
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
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
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
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="min-w-0 p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Volume Total</span>
                        <span className="block text-base sm:text-lg font-serif font-black text-white tabular-nums break-words">R$ {(parseInt(quantity) * parseFloat(unitPrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className={`min-w-0 p-4 sm:p-5 rounded-2xl border ${
                        (parseFloat(unitPrice) - parseFloat(costAtSale || '0')) > 0
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-1">Lucro Estimado</span>
                        <span className={`block text-base sm:text-lg font-serif font-black tabular-nums break-words ${
                          (parseFloat(unitPrice) - parseFloat(costAtSale || '0')) > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}>
                          R$ {(parseInt(quantity) * (parseFloat(unitPrice) - parseFloat(costAtSale || '0'))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto text-white/40 hover:text-white font-bold uppercase tracking-widest text-[10px] h-12 px-6 rounded-xl transition-all"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="w-full sm:w-auto bg-[#d4af37] text-black font-black uppercase tracking-widest text-[10px] px-10 h-12 rounded-full hover:bg-[#f2ca50] transition-all shadow-xl shadow-[#d4af37]/10"
                    >
                      {isCreating ? "Registrando..." : "Confirmar Registro"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      }
    >
        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
          {[
            { label: 'Volume Bruto', value: `R$ ${salesSummary?.total_sales_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: `${salesSummary?.total_transactions || 0} Operações`, icon: DollarSign, color: 'text-green-400' },
            { label: 'Itens Distribuídos', value: salesSummary?.total_quantity_sold || 0, sub: 'Unidades totais', icon: Package, color: 'text-blue-400' },
            { label: 'Líder de Vendas', value: salesSummary?.best_selling_quantity || 0, sub: salesSummary?.best_selling_product_name || 'Nenhum', icon: TrendingUp, color: 'text-orange-400' },
            { label: 'Alpha Profit', value: `R$ ${salesSummary?.most_profitable_profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, sub: salesSummary?.most_profitable_product_name || 'Nenhum', icon: Trophy, color: 'text-[#d4af37]' }
          ].map((card, i) => (
            <div key={i} className="min-w-0 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 group hover:border-[#d4af37]/20 transition-all">
              <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <div className={`w-10 h-10 shrink-0 rounded-xl bg-black border border-white/5 flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5" /></div>
                <ArrowUpRight className="w-4 h-4 shrink-0 text-white/10 group-hover:text-[#d4af37] transition-colors" />
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] break-words">{card.label}</p>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white mt-1 tabular-nums break-words">{card.value}</h3>
              <p className="text-xs text-white/40 mt-2 font-medium line-clamp-1 break-all">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Intelligence Filters */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[24px] sm:rounded-[40px] p-5 sm:p-8 mb-8 sm:mb-12 flex flex-wrap items-end gap-5 sm:gap-8">
          <div className="w-full min-w-0 space-y-3 sm:w-auto sm:flex-1 sm:min-w-[200px] sm:space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><CalendarIcon className="w-3 h-3 shrink-0" /> Período</Label>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-black/40 border-white/10 h-12 sm:h-14 rounded-2xl text-white outline-none" />
          </div>
          <div className="w-full min-w-0 space-y-3 sm:w-auto sm:flex-1 sm:min-w-[200px] sm:space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><Diamond className="w-3 h-3 shrink-0" /> Peça</Label>
            <Select value={productFilter} onValueChange={(v) => setProductFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full bg-black/40 border-white/10 h-12 sm:h-14 rounded-2xl text-white">
                <SelectValue placeholder="Todas as peças" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)] bg-[#0f0f0f] border-white/10 text-white">
                <SelectItem value="all">Todas as peças</SelectItem>
                {products.map(p => <SelectItem key={p.id} value={p.id}><span className="block truncate">{p.name}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full min-w-0 space-y-3 sm:w-auto sm:flex-1 sm:min-w-[200px] sm:space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-2"><Filter className="w-3 h-3 shrink-0" /> Categoria</Label>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full bg-black/40 border-white/10 h-12 sm:h-14 rounded-2xl text-white">
                <SelectValue placeholder="Geral" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)] bg-[#0f0f0f] border-white/10 text-white">
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(dateFilter || productFilter || categoryFilter) && (
            <Button variant="ghost" onClick={() => { setDateFilter(''); setProductFilter(''); setCategoryFilter(''); }} className="w-full sm:w-auto h-12 sm:h-14 px-8 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/5 rounded-2xl">Resetar</Button>
          )}
        </div>

        {/* Transaction Ledger */}
        <div className="min-w-0 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[24px] sm:rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-8 border-b border-white/5 bg-black/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]"><History className="w-5 h-5" /></div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white break-words">Livro de Operações</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{sales.length} Entradas Registradas</span>
          </div>
          <div className="w-full min-w-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-4 sm:py-6 px-5 sm:px-8 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Timestamp</TableHead>
                  <TableHead className="py-4 sm:py-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ativo Comercial</TableHead>
                  <TableHead className="py-4 sm:py-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Volume</TableHead>
                  <TableHead className="py-4 sm:py-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Preço Unit.</TableHead>
                  <TableHead className="py-4 sm:py-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Total Bruto</TableHead>
                  <TableHead className="py-4 sm:py-6 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Lucro Líquido</TableHead>
                  <TableHead className="py-4 sm:py-6 px-5 sm:px-8 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
                  const profit = (sale.unit_price - cost) * sale.quantity;
                  return (
                    <TableRow key={sale.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <TableCell className="py-4 sm:py-6 px-5 sm:px-8 whitespace-nowrap text-xs font-bold text-white/40 uppercase tracking-tighter tabular-nums">
                        {format(new Date(sale.sale_date), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 max-w-[220px]">
                        <div className="flex min-w-0 flex-col">
                          <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-white uppercase tracking-tight">
                            <span className="truncate">{sale.product?.name || 'Item Removido'}</span>
                            {sale.notes?.startsWith('Lançado por foto') && (
                              <Camera className="h-3 w-3 text-[#d4af37]/70 shrink-0" aria-label="Lançada por foto do caderno" />
                            )}
                          </span>
                          <span className="truncate text-[9px] font-black text-white/20 uppercase tracking-widest">{sale.category || 'Geral'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 text-center">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black tabular-nums">{sale.quantity}x</Badge>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 whitespace-nowrap text-right text-sm font-medium text-white/60 tabular-nums">R$ {sale.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="py-4 sm:py-6 whitespace-nowrap text-right text-sm font-serif font-black text-white tabular-nums">R$ {sale.total_price.toFixed(2)}</TableCell>
                      <TableCell className={`py-4 sm:py-6 whitespace-nowrap text-right text-sm font-serif font-black tabular-nums ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        R$ {profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-5 sm:px-8 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteSale(sale.id)} disabled={isDeleting} className="text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-full p-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
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
    </AdminShell>
  );
};

export default SalesManagement;