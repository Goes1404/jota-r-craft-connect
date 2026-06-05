import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Package,
  TrendingUp,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  Trophy,
  ShoppingBag,
  MessageCircle,
  LayoutGrid,
  Target,
  Eye,
  Diamond,
  Sparkles,
  Bot,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { useAppSettings } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { DashboardCharts } from '@/components/DashboardCharts';
import { AdminShell } from '@/components/admin/AdminShell';

interface ProductStats {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}

const fmtBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

/* ── Stat card ──────────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  gold?: boolean;
  index: number;
}> = ({ label, value, icon: Icon, color, gold, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl border transition-all duration-500 group hover:-translate-y-1 ${
      gold
        ? 'bg-gradient-to-br from-[#d4af37]/15 to-[#d4af37]/[0.03] border-[#d4af37]/30'
        : 'bg-[#0f0f0f]/50 border-white/5 hover:border-white/15'
    }`}
  >
    <div className="relative z-10">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${
          gold ? 'bg-[#d4af37] text-black' : 'bg-black border border-white/5'
        }`}
        style={!gold ? { color } : undefined}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</p>
      <h3
        className={`mt-1 font-serif font-bold tracking-tight text-xl sm:text-2xl ${
          gold ? 'text-[#d4af37]' : 'text-white'
        }`}
      >
        {value}
      </h3>
    </div>
    <Icon className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 rotate-12 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]" />
  </motion.div>
);

const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-[#0f0f0f]/50 backdrop-blur-2xl border border-white/5 rounded-[28px] sm:rounded-[36px] shadow-2xl ${className}`}>
    {children}
  </div>
);

const StatSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-32 sm:h-40 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse" />
    ))}
  </div>
);

const AdminDashboard = () => {
  const { user, loading } = useAuth();
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
    const ordersSubscription = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast.success('Novo Pedido Recebido! 🛍️', {
          description: `Um novo pedido de ${fmtBRL(Number(payload.new.total_amount))} foi realizado.`,
          action: { label: 'Ver Pedido', onClick: () => navigate('/admin/orders') },
          duration: 10000,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      })
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
      const lowStockProducts = productsData?.filter((p) => p.stock < 5) || [];
      const { data: ordersData } = await ordersQuery;
      let { data: salesData } = await salesQuery;
      salesData = salesData || [];

      if (saleTypeFilter !== 'all') {
        salesData = salesData.filter((s) => s.sale_type === saleTypeFilter);
      }

      const manualSales = (salesData || []).filter((s) => s.sale_type === 'manual');
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

      const allProductQuantities =
        salesData?.reduce((acc, sale) => {
          const productId = sale.product_id;
          if (!acc[productId])
            acc[productId] = {
              name: sale.product?.name || 'Unknown',
              quantity: 0,
              revenue: 0,
              profit: 0,
              cost: Number(sale.product?.cost || 0),
            };
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
      const productViewsCount =
        viewsData?.reduce((acc, view) => {
          acc[view.product_id] = (acc[view.product_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
      const topViewedId = Object.entries(productViewsCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topViewedProduct = productsData?.find((p) => p.id === topViewedId);

      return {
        totalVisits: visitsData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalOrders,
        totalRevenue,
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
      const metrics = {
        receita: analytics?.totalRevenue,
        lucro: profitData,
        pedidos: analytics?.totalOrders,
        visitas: analytics?.totalVisits,
        produtoTop: analytics?.topSellingProduct?.name,
        estoqueBaixo: analytics?.lowStockProducts?.length,
        ticketMedio: analytics?.totalOrders ? analytics.totalRevenue / analytics.totalOrders : 0,
      };

      // A função ai-assistant espera { prompt, context } e retorna { text }.
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt:
            'Você é o Lumina Executive Analyst, BI para e-commerce de luxo. Analise estes dados do dashboard e dê 3 insights executivos curtos e acionáveis (markdown, tom profissional e sofisticado): ' +
            JSON.stringify(metrics),
          context: metrics,
        },
      });

      if (error) throw error;
      const text = data?.text || data?.reply;
      if (!text) throw new Error('Resposta vazia da IA.');
      setAiInsight(text);
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

  if (!loading && !user) return <Navigate to="/admin/login" replace />;

  const goal = Number(settingsSettings?.monthly_goal || 10000);
  const achieved = analytics?.totalRevenue || 0;
  const pct = Math.min(100, (achieved / goal) * 100);
  const avgTicket = analytics?.totalOrders ? analytics.totalRevenue / analytics.totalOrders : 0;
  const margin = analytics?.totalRevenue && profitData ? (profitData / analytics.totalRevenue) * 100 : 0;

  const headerActions = (
    <>
      <Button
        onClick={() => navigate('/admin/studio')}
        className="h-11 rounded-xl border border-[#d4af37]/40 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 px-5 text-[10px] font-bold uppercase tracking-widest text-[#d4af37] hover:from-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
      >
        <Sparkles className="mr-2 h-4 w-4" /> Estúdio IA
      </Button>
      <Button
        onClick={() => navigate('/admin/sales')}
        className="group h-11 rounded-xl bg-[#d4af37] px-5 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#f2ca50] shadow-xl shadow-[#d4af37]/10"
      >
        <DollarSign className="mr-2 h-4 w-4" /> Vendas
        <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
      </Button>
    </>
  );

  return (
    <AdminShell
      eyebrow="Visão Geral"
      title="Intelligence Dashboard"
      subtitle={`Bem-vindo, ${user?.email?.split('@')[0] || 'admin'}. Status atual do seu império.`}
      actions={headerActions}
    >
      {/* ── Lumina AI Insights ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8 overflow-hidden rounded-[28px] sm:rounded-[36px] border border-[#d4af37]/20 bg-gradient-to-br from-[#0f0f0f] to-[#171717] p-6 sm:p-9 shadow-2xl"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#d4af37]/5 blur-[100px]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-white">
                  Lumina <span className="text-[#d4af37]">Executive Insights</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Análise preditiva de alta performance
                </p>
              </div>
            </div>
            {aiInsight ? (
              <div className="rounded-2xl border border-white/5 bg-black/40 p-5 text-sm leading-relaxed text-white/80 whitespace-pre-line font-serif italic">
                {aiInsight}
              </div>
            ) : (
              <p className="max-w-2xl text-sm text-white/60">
                Pronto para uma análise profunda do seu negócio? A IA processa seus dados e entrega estratégias
                exclusivas de crescimento.
              </p>
            )}
          </div>
          <Button
            onClick={generateAIInsights}
            disabled={isGeneratingInsights}
            className="group h-14 w-full shrink-0 rounded-full bg-[#d4af37] px-8 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-[#d4af37]/10 transition-all hover:bg-[#f2ca50] lg:w-auto"
          >
            {isGeneratingInsights ? (
              <>
                <RefreshCcw className="mr-3 h-5 w-5 animate-spin" /> Processando…
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" /> Gerar Insights
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* ── Meta mensal ─────────────────────────────────────────────────── */}
      <Panel className="mb-8 overflow-hidden p-6 sm:p-8 relative">
        <div className="pointer-events-none absolute top-0 left-0 h-56 w-56 rounded-full bg-[#d4af37]/5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#d4af37]">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white">Meta Mensal</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Alvo: R$</span>
                <Input
                  type="number"
                  defaultValue={settingsSettings?.monthly_goal || '10000'}
                  onBlur={(e) => updateSetting('monthly_goal', e.target.value)}
                  className="h-auto w-24 rounded-none border-0 border-b border-white/20 bg-transparent p-0 text-sm font-black text-white shadow-none focus:border-[#d4af37] focus-visible:ring-0"
                />
              </div>
            </div>
          </div>
          <div className="w-full space-y-3 md:w-[58%]">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Atingido</span>
                <div className="text-2xl sm:text-3xl font-serif font-black text-white">{fmtBRL(achieved)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Faltam</span>
                <div className="text-base sm:text-lg font-bold text-white/60">{fmtBRL(Math.max(0, goal - achieved))}</div>
              </div>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/5 bg-black/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] shadow-[0_0_15px_rgba(212,175,55,0.5)]"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
              <span>0%</span>
              <span className="text-[#d4af37]">{pct.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Filtros + Stats ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-serif font-bold text-white">Métricas Financeiras</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-xl border border-white/5 bg-[#0f0f0f]/50 p-1">
            {([
              { k: 'all', label: 'União', cls: 'bg-[#d4af37] text-black' },
              { k: 'automatic', label: 'Online', cls: 'bg-blue-500 text-white' },
              { k: 'manual', label: 'Físico', cls: 'bg-purple-500 text-white' },
            ] as const).map((f) => (
              <button
                key={f.k}
                onClick={() => setSaleTypeFilter(f.k)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  saleTypeFilter === f.k ? f.cls : 'text-white/40 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={profitStartDate}
              onChange={(e) => setProfitStartDate(e.target.value)}
              className="h-11 rounded-xl border border-white/5 bg-[#0f0f0f]/50 px-3 text-xs text-white outline-none"
              style={{ colorScheme: 'dark' }}
            />
            <input
              type="date"
              value={profitEndDate}
              onChange={(e) => setProfitEndDate(e.target.value)}
              className="h-11 rounded-xl border border-white/5 bg-[#0f0f0f]/50 px-3 text-xs text-white outline-none"
              style={{ colorScheme: 'dark' }}
            />
            {(profitStartDate || profitEndDate) && (
              <button
                onClick={() => {
                  setProfitStartDate('');
                  setProfitEndDate('');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red-400"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {analyticsLoading ? (
        <StatSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          <StatCard index={0} label="Visitas" value={analytics?.totalVisits || 0} icon={Eye} color="#60a5fa" />
          <StatCard index={1} label="Itens" value={analytics?.totalProducts || 0} icon={Package} color="#a78bfa" />
          <StatCard index={2} label="Pedidos" value={analytics?.totalOrders || 0} icon={ShoppingBag} color="#fb923c" />
          <StatCard index={3} label="Receita Bruta" value={fmtBRL(analytics?.totalRevenue || 0)} icon={DollarSign} color="#4ade80" />
          <StatCard index={4} label="Lucro Líquido" value={fmtBRL(profitData || 0)} icon={PiggyBank} color="#d4af37" gold />
        </div>
      )}

      {/* ── Alerta estoque ──────────────────────────────────────────────── */}
      {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[28px] border border-orange-500/20 bg-orange-500/10 p-5 sm:p-7"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Inventário requer atenção</h3>
                <p className="text-sm text-white/40">
                  {analytics.lowStockProducts.length} produto(s) com estoque abaixo do limite de segurança.
                </p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {analytics.lowStockProducts.slice(0, 3).map((p) => (
                <span
                  key={p.id}
                  className="whitespace-nowrap rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold text-orange-400"
                >
                  {p.name} ({p.stock})
                </span>
              ))}
              {analytics.lowStockProducts.length > 3 && (
                <span className="whitespace-nowrap rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/40">
                  +{analytics.lowStockProducts.length - 3}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Charts + Performance ────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Panel className="p-5 sm:p-8 xl:col-span-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Trajetória de Crescimento</h3>
              <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                Análise temporal de vendas
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-[#d4af37]/40" />
          </div>
          <DashboardCharts sales={allSales} />
        </Panel>

        <div className="space-y-6 xl:col-span-4">
          <Panel className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-3xl" />
            <Trophy className="mb-6 h-8 w-8 text-[#d4af37]" />
            <h3 className="mb-7 text-lg font-serif font-bold text-white">Performance d'Elite</h3>
            <div className="space-y-7">
              {[
                analytics?.topSellingProduct && {
                  label: 'Mais Vendido',
                  name: analytics.topSellingProduct.name,
                  value: `${analytics.topSellingProduct.quantity} un`,
                  color: '#d4af37',
                  w: '80%',
                },
                analytics?.mostProfitableProduct && {
                  label: 'Maior Rentabilidade',
                  name: analytics.mostProfitableProduct.name,
                  value: `R$ ${analytics.mostProfitableProduct.profit?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
                  color: '#4ade80',
                  w: '65%',
                },
                analytics?.topViewedProduct && {
                  label: 'Maior Interesse',
                  name: analytics.topViewedProduct.name,
                  value: `${analytics.topViewedProduct.views} views`,
                  color: '#60a5fa',
                  w: '75%',
                },
              ]
                .filter(Boolean)
                .map((row: any, i) => (
                  <div key={i} className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{row.label}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="line-clamp-1 flex-1 text-base font-bold text-white">{row.name}</span>
                      <span className="font-serif text-lg font-black" style={{ color: row.color }}>
                        {row.value}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: row.w }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: row.color, boxShadow: `0 0 10px ${row.color}66` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Panel>

          <div className="rounded-[28px] sm:rounded-[36px] bg-[#d4af37] p-6 sm:p-8 shadow-2xl">
            <PiggyBank className="mb-6 h-8 w-8 text-black" />
            <h3 className="text-lg font-serif font-bold text-black">Ticket Médio</h3>
            <p className="mb-6 text-sm font-medium text-black/60">Eficiência por pedido</p>
            <div className="font-serif text-3xl sm:text-4xl font-black text-black">{fmtBRL(avgTicket)}</div>
          </div>

          <Panel className="p-6 sm:p-8 transition-all hover:border-green-400/30">
            <TrendingUp className="mb-6 h-8 w-8 text-green-400" />
            <h3 className="text-lg font-serif font-bold text-white">Margem Real</h3>
            <p className="mb-6 text-sm font-medium text-white/40">Rentabilidade líquida</p>
            <div className="font-serif text-3xl sm:text-4xl font-black text-green-400">
              {margin.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Configurações de identidade ─────────────────────────────────── */}
      <Panel className="mt-8 p-6 sm:p-10">
        <div className="mb-10 flex items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Configurações de Identidade</h3>
            <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
              Personalização da experiência
            </p>
          </div>
          <Diamond className="h-7 w-7 shrink-0 text-[#d4af37]/40" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black text-[#d4af37]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60">WhatsApp Business</Label>
            </div>
            <Input
              placeholder="Ex: 5511999999999"
              defaultValue={settingsSettings?.whatsapp_number || ''}
              onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
              className="h-14 rounded-2xl border-white/10 bg-black/40 text-white focus:border-[#d4af37]/40"
            />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Com código do país (55)</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black text-[#d4af37]">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60">Cenário Hero</Label>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/5 bg-black/40">
              <ImageUpload
                currentImage={settingsSettings?.hero_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                onImageUpload={(url) => updateSetting('hero_image', url)}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black text-[#d4af37]">
                <Diamond className="h-5 w-5" />
              </div>
              <Label className="text-sm font-bold uppercase tracking-widest text-white/60">Narrativa História</Label>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/5 bg-black/40">
              <ImageUpload
                currentImage={settingsSettings?.story_image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'}
                onImageUpload={(url) => updateSetting('story_image', url)}
              />
            </div>
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
};

export default AdminDashboard;
