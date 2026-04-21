import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, TrendingUp, DollarSign, Package, Trophy, ArrowLeft, Trash2, Download } from 'lucide-react';
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

  // Fetch products
  const { data: products = [] } = useProducts();

  // Fetch sales with filters
  const { data: sales = [] } = useSales({
    date: dateFilter,
    productId: productFilter,
    category: categoryFilter,
  });

  // Fetch sales summary
  const { data: salesSummary } = useSalesSummary({
    date: dateFilter,
    productId: productFilter,
    category: categoryFilter,
  });

  // Mutations
  const { createSale, deleteSale, isCreating, isDeleting } = useSalesMutations();

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity('');
    setUnitPrice('');
    setCostAtSale('');
    setSaleType('manual');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !unitPrice) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    const quantityNum = parseInt(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    
    // Check stock availability
    if (quantityNum > product.stock) {
      toast.error(`Estoque insuficiente! Disponível: ${product.stock} unidades`);
      return;
    }

    const totalPrice = quantityNum * unitPriceNum;
    const costNum = parseFloat(costAtSale || '0');

    createSale({
      product_id: selectedProduct,
      quantity: quantityNum,
      unit_price: unitPriceNum,
      cost_at_sale: costNum,
      total_price: totalPrice,
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
    if (sales.length === 0) {
      toast.error('Nenhuma venda para exportar');
      return;
    }

    const headers = [
      'Data/Hora',
      'Produto',
      'Categoria',
      'Quantidade',
      'Preço Unitario',
      'Custo Unitario',
      'Total',
      'Lucro',
      'Tipo',
      'Notas'
    ];

    const rows = sales.map(sale => {
      const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
      const profit = (sale.unit_price - cost) * sale.quantity;
      return [
        format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm'),
        sale.product?.name || '?',
        sale.category || 'Geral',
        sale.quantity,
        sale.unit_price.toFixed(2),
        cost.toFixed(2),
        sale.total_price.toFixed(2),
        profit.toFixed(2),
        sale.sale_type,
        (sale.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_jracessorios_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Arquivo exportado com sucesso!');
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setUnitPrice(product.price.toString());
      setCostAtSale((product.cost ?? 0).toString());
    }
  };

  // Categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Acesso negado. Faça login como administrador.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Vendas</h1>
            <p className="text-muted-foreground">Registre e acompanhe as vendas em tempo real</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Plus className="h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Venda</DialogTitle>
              <DialogDescription>
                Preencha os dados da venda para registrar no sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto *</Label>
                <Select value={selectedProduct} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço Unitário *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costAtSale">Custo Unitário (Despesa)</Label>
                <Input
                  id="costAtSale"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costAtSale}
                  onChange={(e) => setCostAtSale(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleType">Tipo de Baixa</Label>
                <Select value={saleType} onValueChange={(value: 'manual' | 'automatic') => setSaleType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automática</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre a venda..."
                  rows={3}
                />
              </div>

              {quantity && unitPrice && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Total: R$ {(parseInt(quantity || '0') * parseFloat(unitPrice || '0')).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Registrando...' : 'Registrar Venda'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Dashboard Cards */}
      {salesSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {salesSummary.total_sales_value?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">{salesSummary.total_transactions} transações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesSummary.total_quantity_sold}</div>
              <p className="text-xs text-muted-foreground">unidades totais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Vendido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesSummary.best_selling_quantity || 0}</div>
              <p className="text-xs text-muted-foreground">{salesSummary.best_selling_product_name || 'Nenhum'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Rentável</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {salesSummary.most_profitable_profit?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">{salesSummary.most_profitable_product_name || 'Nenhum'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as vendas por data, produto ou categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateFilter">Data</Label>
              <Input
                id="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productFilter">Produto</Label>
              <Select value={productFilter} onValueChange={(value) => setProductFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Categoria</Label>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todas as categorias</SelectItem>
                   {categories.filter(category => category && category.trim() !== '').map((category) => (
                     <SelectItem key={category} value={category}>
                       {category}
                     </SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(dateFilter || productFilter || categoryFilter) && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  setProductFilter('');
                  setCategoryFilter('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
          <CardDescription>Lista de todas as vendas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
                  const profit = (sale.unit_price - cost) * sale.quantity;
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.product?.name || 'Produto não encontrado'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{sale.category || 'Sem categoria'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{sale.quantity}</TableCell>
                      <TableCell className="whitespace-nowrap">R$ {sale.unit_price.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="whitespace-nowrap">R$ {cost.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">R$ {sale.total_price.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className={profit >= 0 ? "font-bold text-green-500" : "font-bold text-red-500"}>
                        R$ {profit.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.sale_type === 'manual' ? 'default' : 'outline'} className="font-normal">
                          {sale.sale_type === 'manual' ? 'Manual' : 'Automática'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {sale.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSale(sale.id)}
                          disabled={isDeleting}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {sales.map((sale) => {
              const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0);
              const profit = (sale.unit_price - cost) * sale.quantity;
              return (
                <div key={sale.id} className="border border-border rounded-xl p-4 bg-card/50 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.sale_date), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                      <h4 className="font-bold text-foreground">{sale.product?.name || 'Produto'}</h4>
                    </div>
                    <Badge variant={sale.sale_type === 'manual' ? 'default' : 'outline'}>
                      {sale.sale_type === 'manual' ? 'M' : 'A'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Qtd / Unit</span>
                      <span>{sale.quantity}x R$ {sale.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total / Lucro</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold">R$ {sale.total_price.toFixed(2)}</span>
                        <span className={profit >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                          (R$ {profit.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                      {sale.category || 'Geral'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSale(sale.id)}
                      disabled={isDeleting}
                      className="text-destructive h-8 px-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {sales.length === 0 && (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium">Nenhuma venda encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManagement;