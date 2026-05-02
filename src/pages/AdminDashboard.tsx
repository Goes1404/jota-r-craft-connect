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
  LayoutGrid,
  Target,
  ChevronRight,
  Layers,
  Star,
  Sparkles,
  Bot,
  Zap
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useAppSettings } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { DashboardCharts } from '@/components/DashboardCharts';

interface ProductStats {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const queryClient = useQueryClient();
  const [profitStartDate, setProfitStartDate] = useState('');
  const [profitEndDate, setProfitEndDate] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'all' | 'manual' | 'automatic'>('all');
  const navigate = useNavigate();
  
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const { data: settingsSettings } = useAppSettings();
  const { data: allSales = [] } = useSales({ saleType: saleTypeFilter === 'all' ? undefined : saleTypeFilter });

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
    queryKey: ['admin-analytics', profitStartDate, profitEndDate, saleTypeFilter],
    queryFn: async () => {
      let ordersQuery = supabase.from('orders').select('id, total_amount, created_at');
      let salesQuery = supabase.from('sales').select('*, product:products(name, cost)');
      let visitsQuery = supabase.from('site_visits').select('id, created_at');

      if (profitStartDate) {
        const start = new Date(profitStartDate).toISOString();
        ordersQuery = ordersQuery.gte('created_at', start);
        salesQuery = salesQuery.gte('created_at', start);
        visitsQuery = visitsQuery.gte('created_at', start);
      }

      if (profitEndDate) {
        const end = new Date(profitEndDate);
        end.setHours(23, 59, 59, 999);
        const endIso = end.toISOString();
        ordersQuery = ordersQuery.lte('created_at', endIso);
        salesQuery = salesQuery.lte('created_at', endIso);
        visitsQuery = visitsQuery.lte('created_at', endIso);
      }

      const { data: visitsData } = await visitsQuery;
      const { data: productsData } = await supabase.from('products').select('id, name, stock');
      const lowStockProducts = productsData?.filter(p => p.stock < 5) || [];
      const { data: ordersData } = await ordersQuery;
      let { data: salesData } = await salesQuery;
      
      salesData = salesData || [];
      
      if (saleTypeFilter !== 'all') {
        salesData = salesData.filter(s => s.sale_type === saleTypeFilter);
      }

      const manualSales = (salesData || []).filter(s => s.sale_type === 'manual');
      
      const manualRevenue = manualSales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
      const ordersRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      let totalRevenue = 0;
      let totalOrders = 0;
      
      if (saleTypeFilter === 'all') {
         totalRevenue = manualRevenue + ordersRevenue;
         totalOrders = (ordersData?.length || 0) + manualSales.length;
      } else if (saleTypeFilter === 'automatic') {
         totalRevenue = ordersRevenue;
         totalOrders = ordersData?.length || 0;
      } else {
         totalRevenue = manualRevenue;
         totalOrders = manualSales.length;
      }

      const totalItemsSold = salesData?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;

      const allProductQuantities = salesData?.reduce((acc, sale) => {
        const productId = sale.product_id;
        if (!acc[productId]) acc[productId] = { name: sale.product?.name || 'Unknown', quantity: 0, revenue: 0, profit: 0, cost: Number(sale.product?.cost || 0) };
        acc[productId].quantity += sale.quantity;
        acc[productId].revenue += Number(sale.total_price);
        acc[productId].profit += (Number(sale.unit_price) - acc[productId].cost) * sale.quantity;
        return acc;
      }, {} as Record<string, ProductStats>) || {};

      let topSelling: ProductStats | null = null;
      let mostProfitable: ProductStats | null = null;
      
      Object.values(allProductQuantities).forEach((p) => {
        if (!topSelling || p.quantity > topSelling.quantity) topSelling = p;
        if (!mostProfitable || p.profit > mostProfitable.profit) mostProfitable = p;
      });

      let viewsQuery = supabase.from('product_views').select('product_id, created_at');
      if (profitStartDate) viewsQuery = viewsQuery.gte('created_at', new Date(profitStartDate).toISOString());
      if (profitEndDate) {
        const end = new Date(profitEndDate);
        end.setHours(23, 59, 59, 999);
        viewsQuery = viewsQuery.lte('created_at', end.toISOString());
      }

      const { data: viewsData } = await viewsQuery;
      const productViewsCount = viewsData?.reduce((acc, view) => {
        acc[view.product_id] = (acc[view.product_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topViewedId = Object.entries(productViewsCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topViewedProduct = productsData?.find(p => p.id === topViewedId);

      return {
        totalVisits: visitsData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        totalItemsSold,
        topSellingProduct: topSelling,
        mostProfitableProduct: mostProfitable,
        topViewedProduct: topViewedProduct ? { ...topViewedProduct, views: productViewsCount[topViewedId] } : null,
        lowStockProducts,
      };
    },
  });

  const { data: profitData } = useQuery({
    queryKey: ['total-profit', profitStartDate, profitEndDate, saleTypeFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_total_profit', {
        start_date: profitStartDate ? new Date(profitStartDate).toISOString() : null,
        end_date: profitEndDate ? new Date(profitEndDate).toISOString() : null,
        sale_type_filter: saleTypeFilter === 'all' ? null : saleTypeFilter,
      });
      if (error) throw error;
      return data as number;
    },
  });

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const context = {
        revenue: analytics?.totalRevenue,
        profit: profitData,
        orders: analytics?.totalOrders,
        visits: analytics?.totalVisits,
        topProduct: analytics?.topSellingProduct?.name,
        lowStock: analytics?.lowStockProducts?.length,
        averageTicket: analytics?.totalOrders ? (analytics.totalRevenue / analytics.totalOrders) : 0
      };

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: `Analise estes dados de dashboard e me dê 3 insights executivos curtos e acionáveis para melhorar meu negócio: ${JSON.stringify(context)}. Responda em português, com um tom profissional e luxuoso.`,
          context: "Você é o Lumina Executive Analyst, um especialista em BI para e-commerce de luxo."
        }
      });

      if (error) throw error;
      setAiInsight(data.reply);
      toast.success('Insights gerados com sucesso! ✨');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar insights com IA.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

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
        
        {/* Lumina AI Executive Insights Card */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] border border-[#d4af37]/20 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-black text-white">Lumina <span className="text-[#d4af37]">Executive Insights</span></h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Análise preditiva de alta performance</p>
                  </div>
                </div>
                
                {aiInsight ? (
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-6 text-sm text-white/80 leading-relaxed whitespace-pre-line italic font-serif">
                    {aiInsight}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm max-w-2xl">
                    Pronto para uma análise profunda do seu negócio? Nossa IA processa milhões de pontos de dados para fornecer estratégias exclusivas de crescimento.
                  </p>
                )}
              </div>
              
              <Button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                className="bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-widest px-10 h-16 rounded-full hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10 transition-all group shrink-0"
              >
                {isGeneratingInsights ? (
                  <>
                    <RefreshCcw className="w-5 h-5 mr-3 animate-spin" /> Processando Dados...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Gerar Insights de Gestão
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Monthly Goal Gamification */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 mb-16 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-black text-white">Meta Mensal</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Alvo:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">R$ </span>
                    <Input 
                      type="number"
                      defaultValue={settingsSettings?.monthly_goal || '10000'}
                      onBlur={(e) => updateSetting('monthly_goal', e.target.value)}
                      className="bg-transparent border-none text-white p-0 h-auto w-24 text-sm font-black focus-visible:ring-0 shadow-none border-b border-white/20 rounded-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-[60%] space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Atingido</span>
                  <div className="text-3xl font-serif font-black text-white">
                    R$ {(analytics?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Faltam</span>
                  <div className="text-lg font-bold text-white/60">
                    R$ {Math.max(0, Number(settingsSettings?.monthly_goal || 10000) - (analytics?.totalRevenue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((analytics?.totalRevenue || 0) / Number(settingsSettings?.monthly_goal || 10000)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
                <span>0%</span>
                <span>{(((analytics?.totalRevenue || 0) / Number(settingsSettings?.monthly_goal || 10000)) * 100).toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.4em]">Visão Geral</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Intelligence <span className="text-white/20 italic">Dashboard</span></h1>
            <p className="text-white/40 text-sm font-medium">Bem-vindo, {user.email?.split('@')[0]}. Aqui está o status atual do seu império.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/admin/products')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              <Package className="w-4 h-4 mr-2 text-[#d4af37]" /> Coleção
            </Button>
            <Button onClick={() => navigate('/admin/orders')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              <ShoppingBag className="w-4 h-4 mr-2 text-[#d4af37]" /> Pedidos
            </Button>
            <Button onClick={() => navigate('/admin/coupons')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              Cupons
            </Button>
            <Button onClick={() => navigate('/admin/customers')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              CRM 360
            </Button>
            <Button onClick={() => navigate('/admin/inventory-intelligence')} className="bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              <Layers className="w-4 h-4 mr-2 text-blue-400" /> Intel. Estoque
            </Button>
            <Button onClick={() => navigate('/admin/abandoned-carts')} className="bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              Recuperar Vendas
            </Button>
            <Button onClick={() => navigate('/admin/reviews')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              <Star className="w-4 h-4 mr-2 text-yellow-500" /> Reviews
            </Button>
            <Button onClick={() => navigate('/admin/settings')} className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl transition-all">
              Config
            </Button>
            <Button onClick={() => navigate('/admin/sales')} className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-xl transition-all hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10 group">
              <DollarSign className="w-4 h-4 mr-3" /> Vendas <ArrowRight className="ml-2 w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Cinematic Stats Grid */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif font-bold text-white">Métricas Financeiras e Operacionais</h2>
            <div className="flex bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-xl p-1">
              <button 
                onClick={() => setSaleTypeFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${saleTypeFilter === 'all' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-white/40 hover:text-white'}`}
              >
                União
              </button>
              <button 
                onClick={() => setSaleTypeFilter('automatic')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${saleTypeFilter === 'automatic' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white'}`}
              >
                Online
              </button>
              <button 
                onClick={() => setSaleTypeFilter('manual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${saleTypeFilter === 'manual' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white'}`}
              >
                Físico
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-xl px-4 h-12">
              <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold mr-3">De:</span>
              <input 
                type="date" 
                value={profitStartDate} 
                onChange={(e) => setProfitStartDate(e.target.value)}
                className="bg-transparent border-none text-white text-sm outline-none w-full cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex items-center bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-xl px-4 h-12">
              <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold mr-3">Até:</span>
              <input 
                type="date" 
                value={profitEndDate} 
                onChange={(e) => setProfitEndDate(e.target.value)}
                className="bg-transparent border-none text-white text-sm outline-none w-full cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {(profitStartDate || profitEndDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setProfitStartDate(''); setProfitEndDate(''); }}
                className="text-[10px] text-white/40 hover:text-red-400 uppercase tracking-widest font-bold h-12 px-4"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
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
            <div>
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
                
                {analytics?.topViewedProduct && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Maior Interesse (Cliques)</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white line-clamp-1 flex-1 mr-4">{analytics.topViewedProduct.name}</span>
                      <span className="text-xl font-serif font-bold text-blue-400">{analytics.topViewedProduct.views} <span className="text-[10px] uppercase tracking-widest font-bold">views</span></span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 w-[75%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.4)]"></div>
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

            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl group hover:border-green-400/30 transition-all cursor-pointer">
              <TrendingUp className="w-8 h-8 text-green-400 mb-8" />
              <h3 className="text-xl font-serif font-bold text-white mb-2">Margem Real</h3>
              <p className="text-white/40 text-sm font-medium mb-8">Eficiência de rentabilidade líquida</p>
              <div className="text-4xl font-serif font-black text-green-400">
                {analytics?.totalRevenue && profitData ? ((profitData / analytics.totalRevenue) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0,0'}%
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