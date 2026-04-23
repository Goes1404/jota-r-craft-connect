import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Sale } from '@/types/database';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardChartsProps {
  sales: Sale[];
}

const GOLD_PALETTE = ['#d4af37', '#f2ca50', '#8c7026', '#3c2f00', '#1a1a1a'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sales }) => {
  // 1. Sales Trend (Last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySales = sales.filter(s => format(parseISO(s.sale_date), 'yyyy-MM-dd') === dateStr);
    const total = daySales.reduce((acc, s) => acc + s.total_price, 0);
    return {
      name: format(day, 'dd MMM', { locale: ptBR }),
      vendas: total,
    };
  });

  // 2. Category Distribution
  const categoryData = sales.reduce((acc, sale) => {
    const category = sale.category || 'Geral';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += sale.total_price;
    } else {
      acc.push({ name: category, value: sale.total_price });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // 3. Profit vs Cost
  const profitCostData = sales.reduce((acc, sale) => {
    const dateStr = format(parseISO(sale.sale_date), 'dd/MM');
    const existing = acc.find(item => item.name === dateStr);
    const cost = (sale.cost_at_sale ?? sale.product?.cost ?? 0) * sale.quantity;
    const profit = sale.total_price - cost;
    
    if (existing) {
      existing.lucro += profit;
      existing.custo += cost;
    } else {
      acc.push({ name: dateStr, lucro: profit, custo: cost });
    }
    return acc;
  }, [] as { name: string; lucro: number; custo: number }[]).slice(-7);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm font-bold text-white">
                {entry.name}: <span className="text-[#d4af37]">R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Chart */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] group hover:border-[#d4af37]/20 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Volume Transacional</h3>
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Últimos 7 dias</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
                <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={(value) => `R$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] group hover:border-[#d4af37]/20 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Mix de Coleções</h3>
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Distribuição %</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GOLD_PALETTE[index % GOLD_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Profit vs Cost Bar Chart */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] group hover:border-[#d4af37]/20 transition-all">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Eficiência de Margem</h3>
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Rentabilidade Real</span>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
              <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={(value) => `R$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <Bar dataKey="custo" name="Custo Operativo" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" name="Lucro Alpha" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
