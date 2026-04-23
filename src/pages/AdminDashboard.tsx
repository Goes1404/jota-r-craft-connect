import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  LogOut, 
  Settings, 
  PiggyBank, 
  CalendarIcon, 
  AlertTriangle, 
  Trophy,
  Diamond,
  ArrowRight,
  ShieldCheck,
  Eye,
  ShoppingBag,
  MessageCircle,
  LayoutGrid
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useAppSettings } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { DashboardCharts } from '@/components/DashboardCharts';

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const queryClient = useQueryClient();
  const [profitStartDate, setProfitStartDate] = useState('');
  const [profitEndDate, setProfitEndDate] = useState('');
  const navigate = useNavigate();

  const { data: settingsSettings } = useAppSettings();
  const { data: allSales = [] } = useSales();

  React.useEffect(() => {
    // 1. Subscribe to new orders
    const ordersSubscription = supabase
      .channel('admin-orders-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // Trigger a notification
          toast.success('Novo Pedido Recebido! 🛍️', {
            description: `Um novo pedido de R$ ${Number(payload.new.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi realizado.`,
            action: {
              label: 'Ver Pedido',
              onClick: () => navigate('/admin/orders')
            },
            duration: 10000,
          });

          // Invalidate analytics query to update numbers in real-time
          queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [queryClient, navigate]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data: visitsData } = await supabase.from('site_visits').select('id');
      const { data: productsData } = await supabase.from('products').select('id, name, stock');
      const lowStockProducts = productsData?.filter(p => p.stock < 5) || [];
      const { data: ordersData } = await supabase.from('orders').select('id, total_amount');
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const { data: salesData } = await supabase.from('sales').select('*, product:products(name, cost)');
      const totalSalesRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;
      const totalItemsSold = salesData?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;

      const allProductQuantities = salesData?.reduce((acc, sale) => {
        const productId = sale.product_id;
        if (!acc[productId]) acc[productId] = { name: sale.product?.name || 'Unknown', quantity: 0, revenue: 0, profit: 0, cost: Number(sale.product?.cost || 0) };
        acc[productId].quantity += sale.quantity;
        acc[productId].revenue += Number(sale.total_price);
        acc[productId].profit += (Number(sale.unit_price) - acc[productId].cost) * sale.quantity;
        return acc;
      }, {} as Record<string, any>) || {};

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
    await supabase.from('settings').upsert({ key, value });
  };

  if (loading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.01] blur-[150px]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <Diamond className="h-6 w-6 text-[#d4af37]" />
              <span className="text-xl font-serif font-black text-[#d4af37] uppercase tracking-[0.2em]">
                JR <span className="text-white italic lowercase font-light tracking-normal opacity-80">admin</span>
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">LUMINA CONTROL</Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 mr-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sistema Online</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-white/40 hover:text-[#d4af37] hover:bg-[#d4af37]/5 rounded-full p-2">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-screen-2xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.4em]">Visão Geral</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Intelligence <span className="text-white/20 italic">Dashboard</span></h1>
            <p className="text-white/40 text-sm font-medium">Bem-vindo, {user.email?.split('@')[0]}. Aqui está o status atual do seu império.</p>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={() => navigate('/admin/products')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-8 h-14 rounded-2xl transition-all">
              <Package className="w-4 h-4 mr-3 text-[#d4af37]" /> Coleção
            </Button>
            <Button onClick={() => navigate('/admin/orders')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-8 h-14 rounded-2xl transition-all">
              <ShoppingBag className="w-4 h-4 mr-3 text-[#d4af37]" /> Pedidos
            </Button>
            <Button onClick={() => navigate('/admin/sales')} className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-8 h-14 rounded-2xl transition-all hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10 group">
              <DollarSign className="w-4 h-4 mr-3" /> Vendas <ArrowRight className="ml-2 w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Cinematic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-16">
          {[
            { label: 'Visitas', value: analytics?.totalVisits || 0, icon: Eye, color: 'text-blue-400' },
            { label: 'Itens', value: analytics?.totalProducts || 0, icon: Package, color: 'text-purple-400' },
            { label: 'Pedidos', value: analytics?.totalOrders || 0, icon: ShoppingBag, color: 'text-orange-400' },
            { 
              label: 'Receita Bruta', 
              value: `R$ ${analytics?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
              icon: DollarSign, 
              color: 'text-green-400',
              highlight: true 
            },
            { 
              label: 'Lucro Líquido', 
              value: `R$ ${profitData?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
              icon: PiggyBank, 
              color: 'text-[#d4af37]',
              gold: true 
            }
          ].map((stat, idx) => (
            <div key={idx} className={`relative overflow-hidden p-8 rounded-[32px] border transition-all duration-500 group hover:scale-[1.02] ${stat.gold ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-[#0f0f0f]/40 border-white/5 hover:border-white/10'}`}>
              <div className="relative z-10 space-y-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.gold ? 'bg-[#d4af37] text-black' : 'bg-black border border-white/5 ' + stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{stat.label}</p>
                  <h3 className={`text-2xl font-serif font-bold tracking-tight mt-1 ${stat.gold ? 'text-[#d4af37]' : 'text-white'}`}>{stat.value}</h3>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <stat.icon className="w-24 h-24 rotate-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Notifications & Alerts */}
        {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
          <div className="mb-16 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">Gestão de Inventário Requerida</h3>
                  <p className="text-white/40 text-sm">Existem {analytics.lowStockProducts.length} produtos com estoque abaixo do limite de segurança.</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
                {analytics.lowStockProducts.slice(0, 3).map(p => (
                  <Badge key={p.id} className="bg-black/40 border border-white/10 text-orange-400 font-bold px-4 py-2 rounded-xl whitespace-nowrap">
                    {p.name} ({p.stock})
                  </Badge>
                ))}
                {analytics.lowStockProducts.length > 3 && (
                  <Badge className="bg-black/40 border border-white/10 text-white/40 px-4 py-2 rounded-xl">+{analytics.lowStockProducts.length - 3} mais</Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Main Charts */}
          <div className="lg:col-span-8 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">Trajetória de Crescimento</h3>
                <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">ANÁLISE TEMPORAL DE VENDAS</p>
              </div>
              <TrendingUp className="w-6 h-6 text-[#d4af37]/40" />
            </div>
            <div className="h-[400px]">
              <DashboardCharts sales={allSales} />
            </div>
          </div>

          {/* Top Performance Side */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
              <Trophy className="w-8 h-8 text-[#d4af37] mb-8" />
              <h3 className="text-xl font-serif font-bold text-white mb-8">Performance d'Elite</h3>
              
              <div className="space-y-10">
                {analytics?.topSellingProduct && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Mais Vendido</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white line-clamp-1 flex-1 mr-4">{analytics.topSellingProduct.name}</span>
                      <span className="text-2xl font-serif font-black text-[#d4af37]">{analytics.topSellingProduct.quantity} <span className="text-[10px] uppercase tracking-widest font-bold">un</span></span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#d4af37] w-[80%] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)]"></div>
                    </div>
                  </div>
                )}
                
                {analytics?.mostProfitableProduct && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Maior Rentabilidade</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white line-clamp-1 flex-1 mr-4">{analytics.mostProfitableProduct.name}</span>
                      <span className="text-xl font-serif font-bold text-green-400">R$ {analytics.mostProfitableProduct.profit?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 w-[65%] rounded-full shadow-[0_0_10px_rgba(74,222,128,0.4)]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#d4af37] rounded-[40px] p-8 md:p-12 shadow-2xl group hover:shadow-[#d4af37]/10 transition-all cursor-pointer">
              <PiggyBank className="w-8 h-8 text-black mb-8" />
              <h3 className="text-xl font-serif font-bold text-black mb-2">Ticket Médio</h3>
              <p className="text-black/60 text-sm font-medium mb-8">Eficiência operacional por pedido</p>
              <div className="text-4xl font-serif font-black text-black">
                R$ {analytics?.totalOrders ? (analytics.totalRevenue / analytics.totalOrders).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </div>
            </div>
          </div>
        </div>

        {/* Global Settings Section */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white">Configurações de Identidade</h3>
              <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">PERSONALIZAÇÃO DA LUMINA EXPERIENCE</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-[#d4af37]/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <Label className="text-sm font-bold uppercase tracking-widest text-white/60">WhatsApp Business</Label>
              </div>
              <Input
                placeholder="Ex: 5511999999999"
                defaultValue={settingsSettings?.whatsapp_number || ''}
                onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
                className="bg-black/40 border-white/10 focus:border-[#d4af37]/40 h-14 rounded-2xl text-white outline-none"
              />
              <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">Apenas números, incluindo o código do país (55)</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <Label className="text-sm font-bold uppercase tracking-widest text-white/60">Cenário Hero Principal</Label>
              </div>
              <div className="rounded-[32px] overflow-hidden border border-white/5 bg-black/40 group relative aspect-video">
                <ImageUpload
                  currentImage={settingsSettings?.hero_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                  onImageUpload={(url) => updateSetting('hero_image', url)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                  <Diamond className="w-5 h-5" />
                </div>
                <Label className="text-sm font-bold uppercase tracking-widest text-white/60">Narrativa "Nossa História"</Label>
              </div>
              <div className="rounded-[32px] overflow-hidden border border-white/5 bg-black/40 group relative aspect-video">
                <ImageUpload
                  currentImage={settingsSettings?.story_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                  onImageUpload={(url) => updateSetting('story_image', url)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-white/5 mt-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">LUMINA TECH — EXCLUSIVE OPERATIONAL CONTROL</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;