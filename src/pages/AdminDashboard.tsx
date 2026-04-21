import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Package, TrendingUp, DollarSign, LogOut, Settings, PiggyBank, CalendarIcon, AlertTriangle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '@/components/ImageUpload';

import { useAppSettings } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { DashboardCharts } from '@/components/DashboardCharts';

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const [profitStartDate, setProfitStartDate] = useState('');
  const [profitEndDate, setProfitEndDate] = useState('');
  const navigate = useNavigate();

  // Settings hook
  const { data: settingsSettings } = useAppSettings();

  // All sales for charts
  const { data: allSales = [] } = useSales();

  // Analytics queries
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Fetch total visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('site_visits')
        .select('id');
      
      if (visitsError) throw visitsError;

      // Fetch all products to get total and stock alerts
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock');
      
      if (productsError) throw productsError;

      const lowStockProducts = productsData?.filter(p => p.stock < 5) || [];

      // Fetch total orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount');
      
      if (ordersError) throw ordersError;

      // Calculate total revenue from orders
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Fetch sales data for real-time metrics
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          product:products(name, cost)
        `);
      
      if (salesError) throw salesError;

      // Calculate sales metrics
      const totalSalesRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;
      const totalItemsSold = salesData?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;

      // Calculate top selling products from sales
      const salesProductQuantities = salesData?.reduce((acc, sale) => {
        const productId = sale.product_id;
        const productName = sale.product?.name || 'Unknown';
        if (!acc[productId]) {
          acc[productId] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
            cost: Number(sale.product?.cost || 0)
          };
        }
        acc[productId].quantity += sale.quantity;
        acc[productId].revenue += Number(sale.total_price);
        acc[productId].profit += (Number(sale.unit_price) - acc[productId].cost) * sale.quantity;
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number; profit: number; cost: number }>) || {};

      // Fetch top selling product from order_items as fallback
      const { data: topSellingData, error: topSellingError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products (name, price, cost)
        `);
      
      if (topSellingError) throw topSellingError;

      // Calculate quantities by product from orders
      const orderProductQuantities = topSellingData?.reduce((acc, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            name: item.products?.name || 'Unknown',
            quantity: 0,
            revenue: 0,
            profit: 0,
            cost: Number(item.products?.cost || 0)
          };
        }
        acc[productId].quantity += item.quantity;
        const revenue = item.quantity * (item.products?.price || 0);
        acc[productId].revenue += revenue;
        acc[productId].profit += (Number(item.products?.price || 0) - acc[productId].cost) * item.quantity;
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number; profit: number; cost: number }>) || {};

      // Combine sales and orders data
      const allProductQuantities = { ...orderProductQuantities };
      Object.keys(salesProductQuantities).forEach(productId => {
        if (allProductQuantities[productId]) {
          allProductQuantities[productId].quantity += salesProductQuantities[productId].quantity;
          allProductQuantities[productId].revenue += salesProductQuantities[productId].revenue;
          allProductQuantities[productId].profit += salesProductQuantities[productId].profit;
        } else {
          allProductQuantities[productId] = salesProductQuantities[productId];
        }
      });

      const topSelling = Object.values(allProductQuantities).sort((a, b) => b.quantity - a.quantity)[0];
      const mostProfitable = Object.values(allProductQuantities).sort((a, b) => b.profit - a.profit)[0];

      return {
        totalVisits: visitsData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue: totalRevenue + totalSalesRevenue,
        totalSalesRevenue,
        totalItemsSold,
        topSellingProduct: topSelling || null,
        mostProfitableProduct: mostProfitable || null,
        lowStockProducts,
      };
    },
  });

  // Profit query
  const { data: profitData } = useQuery({
    queryKey: ['total-profit', profitStartDate, profitEndDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_total_profit', {
        start_date: profitStartDate ? new Date(profitStartDate).toISOString() : null,
        end_date: profitEndDate ? new Date(profitEndDate).toISOString() : null,
      });
      
      if (error) throw error;
      return data as number;
    },
  });

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });
    
    if (error) throw error;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:h-16 sm:py-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-primary">
                JR <span className="italic font-light">acessorios</span> Admin
              </h1>
              <Badge variant="secondary">Dashboard</Badge>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/products')}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                Gerenciar Produtos
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/admin/sales')}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Package className="h-4 w-4 mr-1 sm:mr-2" />
                Gestão de Vendas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard Administrativo</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visualize as estatísticas e gerencie sua loja online
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Totais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalVisits || 0}</div>
              <p className="text-xs text-muted-foreground">Acessos ao site</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">Itens cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Pedidos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {analytics?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
              <p className="text-xs text-muted-foreground">Faturamento acumulado</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary font-bold">Lucro Líquido</CardTitle>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {profitData?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
              <p className="text-xs text-primary/60">Resultado final</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Estoque Baixo */}
        {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-lg">Alerta de Estoque Baixo</CardTitle>
              </div>
              <CardDescription className="text-amber-600">
                Os seguintes itens estão com menos de 5 unidades em estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.lowStockProducts.map(product => (
                  <Badge key={product.id} variant="outline" className="bg-white border-amber-300 text-amber-700">
                    {product.name} ({product.stock})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="mb-8">
          <DashboardCharts sales={allSales} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Produtos de Destaque
              </CardTitle>
              <CardDescription>Performance por item individual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analytics?.topSellingProduct && (
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Mais Vendido (Qtd)</p>
                    <p className="font-bold text-lg">{analytics.topSellingProduct.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{analytics.topSellingProduct.quantity}</p>
                    <p className="text-xs text-muted-foreground">unidades</p>
                  </div>
                </div>
              )}
              {analytics?.mostProfitableProduct && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mais Lucrativo (R$)</p>
                    <p className="font-bold text-lg">{analytics.mostProfitableProduct.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {analytics.mostProfitableProduct.profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">de lucro</p>
                  </div>
                </div>
              )}
              {!analytics?.topSellingProduct && (
                <p className="text-center py-8 text-muted-foreground italic">
                  Dados insuficientes para calcular destaques
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Resumo de Eficiência
              </CardTitle>
              <CardDescription>Métricas de conversão e volume</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Itens Vendidos</span>
                    <span className="font-bold">{analytics?.totalItemsSold || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vendas Diretas</span>
                    <span className="font-bold">R$ {analytics?.totalSalesRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-medium text-primary">
                    <span className="text-sm">Ticket Médio</span>
                    <span>
                      R$ {analytics?.totalOrders ? (analytics.totalRevenue / analytics.totalOrders).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Settings */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="text-xl font-bold font-serif text-primary">Configurações do site</h3>
            <p className="text-sm text-muted-foreground">Personalize as informações e imagens principais</p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-bold">WhatsApp de Contato</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 11999999999"
                    defaultValue={settingsSettings?.whatsapp_number || ''}
                    onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Apenas números, com DDD</p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold">Banner Principal (Hero)</Label>
                <div className="rounded-lg overflow-hidden border border-border shadow-inner bg-muted/50">
                  <ImageUpload
                    currentImage={settingsSettings?.hero_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                    onImageUpload={(url) => updateSetting('hero_image', url)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold">Banner "Nossa História"</Label>
                <div className="rounded-lg overflow-hidden border border-border shadow-inner bg-muted/50">
                  <ImageUpload
                    currentImage={settingsSettings?.story_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                    onImageUpload={(url) => updateSetting('story_image', url)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;