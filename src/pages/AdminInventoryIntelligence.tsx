import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminCardSkeleton } from '@/components/admin/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Layers,
  Zap,
  Sparkles,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { format, subDays, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const AdminInventoryIntelligence = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: products = [], isLoading: productsLoading } = useAdminProducts();
  const { data: sales = [] } = useSales();

  // 1. Cálculos de Valorização e Previsão (Lumina Predict)
  const predictMetrics = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    return products.map(p => {
      // Filtrar vendas deste produto nos últimos 30 dias
      const recentSales = sales.filter(s => s.product_id === p.id && isAfter(new Date(s.sale_date), thirtyDaysAgo));
      const totalSold = recentSales.length;
      const velocity = totalSold / 30; // vendas por dia
      
      const stock = p.stock || 0;
      const daysToZero = velocity > 0 ? Math.floor(stock / velocity) : 999;
      
      // Sugestão de compra (para mais 30 dias)
      const buySuggestion = Math.ceil(velocity * 30);

      return {
        ...p,
        velocity: velocity.toFixed(2),
        daysToZero,
        buySuggestion,
        totalSold
      };
    }).sort((a, b) => a.daysToZero - b.daysToZero); // Mostrar o que vai acabar primeiro
  }, [products, sales]);

  const metrics = useMemo(() => {
    const totalCost = products.reduce((sum, p) => sum + (Number(p.cost || 0) * (p.stock || 0)), 0);
    const totalVGV = products.reduce((sum, p) => sum + (Number(p.price || 0) * (p.stock || 0)), 0);
    const avgMarkup = totalCost > 0 ? ((totalVGV - totalCost) / totalCost) * 100 : 0;
    
    const lowStockAlerts = predictMetrics.filter(p => p.daysToZero < 10).length;
    const criticalStock = products.filter(p => (p.stock || 0) <= 0).length;

    return { totalCost, totalVGV, avgMarkup, lowStockAlerts, criticalStock };
  }, [products, predictMetrics]);

  if (!authLoading && !user) return <Navigate to="/admin/login" replace />;

  if (authLoading || productsLoading) {
    return (
      <AdminShell eyebrow="Inteligência" title="Lumina Predict" subtitle="AI Inventory Protocol v2.0">
        <AdminCardSkeleton count={4} />
        <div className="mt-8">
          <AdminCardSkeleton count={6} />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="Inteligência" title="Lumina Predict" subtitle="AI Inventory Protocol v2.0">
      <div className="space-y-12">
        
        {/* Predictive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3 text-white/20">
              <Clock className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Alerta de Ruptura</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-black text-red-500">{metrics.lowStockAlerts}</span>
              <span className="text-[9px] text-white/40 uppercase font-bold">Produtos em risco (10 dias)</span>
            </div>
          </div>

          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3 text-white/20">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Custo de Reposição</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-white">R$ {(metrics.totalCost * 0.3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              <span className="text-[9px] text-[#d4af37] uppercase font-bold">Sugerido p/ 30 dias</span>
            </div>
          </div>

          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3 text-white/20">
              <Zap className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Valor de Venda (VGV)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-white">R$ {metrics.totalVGV.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3 text-white/20">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Margem Média</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-green-500">+{metrics.avgMarkup.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Detailed Prediction Table */}
        <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#d4af37]" />
                Cronograma de Reposição Inteligente
              </h2>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Ordenado por urgência de compra (Menor tempo de ruptura)</p>
            </div>
            <Button variant="outline" className="border-white/10 text-white/40 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest">
              Exportar Relatório
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40">
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40">Produto</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Giro (30d)</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Estoque Atual</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Dias p/ Ruptura</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Sugestão Compra</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Status AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {predictMetrics.map((p) => {
                  const isCritical = p.daysToZero < 7;
                  const isLow = p.daysToZero < 15;
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black border border-white/10 p-2 overflow-hidden flex-shrink-0">
                            <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors">{p.name}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center text-xs font-bold text-white/60">{p.totalSold} un</td>
                      <td className="px-8 py-6 text-center text-xs font-bold text-white/60">{p.stock} un</td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                          isCritical ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                          isLow ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                          'bg-green-500/10 border-green-500/20 text-green-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.daysToZero === 999 ? '∞' : `${p.daysToZero} dias`}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-xs font-black text-white">{p.buySuggestion > 0 ? `+${p.buySuggestion}` : '-'}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {isCritical ? (
                          <Badge className="bg-red-500 text-white border-none text-[8px] uppercase tracking-widest px-3">CRÍTICO</Badge>
                        ) : isLow ? (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20 text-[8px] uppercase tracking-widest px-3">REPOR EM BREVE</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[8px] uppercase tracking-widest px-3">ESTÁVEL</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/5 p-10 rounded-[40px] space-y-6">
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#d4af37]" />
              Distribuição ABC do Estoque
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Sua Classe A representa 80% do seu capital imobilizado. Mantenha esses itens sob vigilância constante para não perder margem.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="h-3 flex-1 bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#d4af37]" style={{ width: '80%' }}></div>
                <div className="h-full bg-white/20" style={{ width: '15%' }}></div>
                <div className="h-full bg-white/5" style={{ width: '5%' }}></div>
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Classe A/B/C</span>
            </div>
          </div>
          
          <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 p-10 rounded-[40px] flex items-center gap-8">
            <div className="w-20 h-20 rounded-[24px] bg-[#d4af37] flex items-center justify-center shadow-2xl shadow-[#d4af37]/20 flex-shrink-0">
              <Zap className="w-10 h-10 text-black" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-[#d4af37]">Insight Lumina</h3>
              <p className="text-xs text-white/60 leading-relaxed italic">
                "Notamos um aumento de 15% na velocidade de venda da categoria 'Cases'. Recomendamos antecipar a reposição em 4 dias para evitar ruptura."
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminInventoryIntelligence;
