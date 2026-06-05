import React, { useState } from 'react';
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
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Sale } from '@/types/database';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardChartsProps {
  sales: Sale[];
}

const GOLD_PALETTE = ['#d4af37', '#f2ca50', '#8c7026', '#b8860b', '#ffd700', '#daa520', '#c5a028'];
const BLUE_PALETTE = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#2563eb'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[160px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
            <p className="text-xs font-bold text-white">
              {entry.name}: <span style={{ color: entry.color }}>
                {typeof entry.value === 'number' && (entry.name?.toLowerCase().includes('r$') || entry.name?.toLowerCase().includes('valor') || entry.name?.toLowerCase().includes('lucro') || entry.name?.toLowerCase().includes('custo') || entry.name?.toLowerCase().includes('receita') || entry.name?.toLowerCase().includes('revenue'))
                  ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : entry.value
                }
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sales: salesProp }) => {
  const [trendRange, setTrendRange] = useState<7 | 30>(7);

  // Blindagem: ignora vendas sem sale_date válido para nunca quebrar os gráficos
  // (parseISO em data inválida lançaria e derrubaria todo o dashboard).
  const sales = React.useMemo(
    () => (salesProp || []).filter((s) => s?.sale_date && !isNaN(parseISO(s.sale_date).getTime())),
    [salesProp],
  );

  if (sales.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-white/10 bg-white/[0.01] text-center">
        <TrendingUp className="h-8 w-8 text-white/15" />
        <p className="text-sm font-bold text-white/40">Sem dados de vendas no período</p>
        <p className="text-[10px] uppercase tracking-widest text-white/20">Os gráficos aparecem assim que houver vendas</p>
      </div>
    );
  }

  // ── 1. Sales Trend (7 or 30 days) ──────────────────────────────────────
  const trendDays = eachDayOfInterval({
    start: subDays(new Date(), trendRange - 1),
    end: new Date(),
  }).map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySales = sales.filter(s => format(parseISO(s.sale_date), 'yyyy-MM-dd') === dateStr);
    return {
      name: trendRange === 7
        ? format(day, 'dd MMM', { locale: ptBR })
        : format(day, 'dd/MM'),
      receita: daySales.reduce((a, s) => a + Number(s.total_price), 0),
      qtd: daySales.reduce((a, s) => a + s.quantity, 0),
    };
  });

  // ── 2. Monthly Revenue (last 6 months) ────────────────────────────────
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  }).map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthSales = sales.filter(s => {
      const d = parseISO(s.sale_date);
      return d >= start && d <= end;
    });
    const prevMonth = subMonths(month, 1);
    const prevStart = startOfMonth(prevMonth);
    const prevEnd = endOfMonth(prevMonth);
    const prevSales = sales.filter(s => {
      const d = parseISO(s.sale_date);
      return d >= prevStart && d <= prevEnd;
    });
    const current = monthSales.reduce((a, s) => a + Number(s.total_price), 0);
    const previous = prevSales.reduce((a, s) => a + Number(s.total_price), 0);
    return {
      name: format(month, 'MMM/yy', { locale: ptBR }),
      receita: current,
      anterior: previous,
    };
  });

  // ── 3. Category Distribution (Pie) ────────────────────────────────────
  const categoryData = Object.values(
    sales.reduce((acc, sale) => {
      const key = (sale as any).product?.category || sale.category || 'Geral';
      if (!acc[key]) acc[key] = { name: key, value: 0, qty: 0 };
      acc[key].value += Number(sale.total_price);
      acc[key].qty += sale.quantity;
      return acc;
    }, {} as Record<string, { name: string; value: number; qty: number }>)
  ).sort((a, b) => b.value - a.value);

  // ── 4. Profit vs Cost (stacked bars) ──────────────────────────────────
  const profitCostData = Object.values(
    sales.reduce((acc, sale) => {
      const dateStr = format(parseISO(sale.sale_date), 'dd/MM');
      if (!acc[dateStr]) acc[dateStr] = { name: dateStr, lucro: 0, custo: 0 };
      const cost = Number(sale.cost_at_sale ?? (sale as any).product?.cost ?? 0) * sale.quantity;
      acc[dateStr].custo += cost;
      acc[dateStr].lucro += Number(sale.total_price) - cost;
      return acc;
    }, {} as Record<string, { name: string; lucro: number; custo: number }>)
  ).slice(-10);

  // ── 5. Top 5 Products (horizontal bar) ────────────────────────────────
  const topProducts = Object.values(
    sales.reduce((acc, sale) => {
      const name = (sale as any).product?.name || `Produto ${sale.product_id?.slice(0, 6)}`;
      if (!acc[name]) acc[name] = { name, receita: 0, qty: 0 };
      acc[name].receita += Number(sale.total_price);
      acc[name].qty += sale.quantity;
      return acc;
    }, {} as Record<string, { name: string; receita: number; qty: number }>)
  )
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 6)
    .map(p => ({ ...p, name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name }));

  // ── 6. Sales by Hour of Day (heatmap-style bar) ────────────────────────
  const hourData = Array.from({ length: 24 }, (_, h) => {
    const count = sales.filter(s => getHours(parseISO(s.sale_date)) === h).length;
    return { hora: `${String(h).padStart(2, '0')}h`, vendas: count };
  }).filter((_, i) => i >= 6 && i <= 23);

  // ── 7. ABC Curve ───────────────────────────────────────────────────────
  const allProducts = Object.values(
    sales.reduce((acc, sale) => {
      const name = (sale as any).product?.name || (sale as any).name || `#${sale.product_id?.slice(0, 6)}`;
      if (!acc[name]) acc[name] = { name, receita: 0 };
      acc[name].receita += Number(sale.total_price);
      return acc;
    }, {} as Record<string, { name: string; receita: number }>)
  ).sort((a, b) => b.receita - a.receita);

  const totalRevAll = allProducts.reduce((a, p) => a + p.receita, 0);
  let cumulative = 0;
  const abcData = allProducts.map(p => {
    cumulative += p.receita;
    const pct = totalRevAll > 0 ? (cumulative / totalRevAll) * 100 : 0;
    const curve = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    return { ...p, pct, curve };
  });
  const aCount = abcData.filter(p => p.curve === 'A').length;
  const bCount = abcData.filter(p => p.curve === 'B').length;
  const cCount = abcData.filter(p => p.curve === 'C').length;

  // ── 8. Revenue growth percentage ──────────────────────────────────────
  const thisMonth = last6Months[last6Months.length - 1]?.receita || 0;
  const lastMonth = last6Months[last6Months.length - 2]?.receita || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <div className="space-y-10">

      {/* ── Row 1: Trend + Monthly ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Sales Trend */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Volume Transacional</h3>
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Receita × Unidades Vendidas</p>
            </div>
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
              {([7, 30] as const).map(r => (
                <button key={r} onClick={() => setTrendRange(r)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${trendRange === r ? 'bg-[#d4af37] text-black' : 'text-white/30 hover:text-white'}`}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendDays}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
                <YAxis yAxisId="left" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={v => `R$${v}`} />
                <YAxis yAxisId="right" orientation="right" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="receita" name="Receita" stroke="#d4af37" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRevenue)" />
                <Bar yAxisId="right" dataKey="qtd" name="Qtd" fill="rgba(212,175,55,0.15)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue YoY */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Receita Mensal</h3>
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Comparativo mês anterior</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-black px-3 py-1 rounded-lg ${growth > 0 ? 'bg-green-500/10 text-green-400' : growth < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/40'}`}>
              {growth > 0 ? <TrendingUp className="w-3 h-3" /> : growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(growth).toFixed(1)}%
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
                <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Bar dataKey="anterior" name="Mês Anterior" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="receita" name="Mês Atual" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Category Pie + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Category Donut */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Mix por Categoria</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Participação na Receita Total</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-[220px] w-full max-w-[240px] sm:w-[240px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={GOLD_PALETTE[index % GOLD_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:flex-1 space-y-3">
              {categoryData.slice(0, 6).map((cat, i) => {
                const total = categoryData.reduce((a, c) => a + c.value, 0);
                const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0';
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest truncate max-w-[90px]">{cat.name}</span>
                      <span className="text-[9px] font-black text-white/40">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD_PALETTE[i % GOLD_PALETTE.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 6 Products */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Top Produtos por Receita</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Ranking de performance</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" width={90} fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.4)" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="receita" name="Receita" radius={[0, 6, 6, 0]}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#d4af37' : i === 1 ? '#f2ca50' : `rgba(212,175,55,${0.5 - i * 0.07})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: Profit/Cost + Hour Heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Profit vs Cost */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Eficiência de Margem</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Lucro vs Custo Operacional</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitCostData} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" />
                <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Bar dataKey="custo" name="Custo" stackId="a" fill="rgba(255,255,255,0.06)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" stackId="a" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Horário de Pico de Vendas</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Distribuição por hora do dia</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="hora" fontSize={8} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" interval={2} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.2)" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vendas" name="Vendas" radius={[4, 4, 0, 0]}>
                  {hourData.map((entry, i) => (
                    <Cell key={i} fill={entry.vendas > 0 ? `rgba(212,175,55,${Math.min(1, 0.2 + entry.vendas * 0.3)})` : 'rgba(255,255,255,0.04)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 4: ABC Curve Summary ── */}
      <div className="bg-white/[0.02] border border-white/5 p-5 sm:p-8 rounded-[28px] sm:rounded-[32px] hover:border-[#d4af37]/20 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Curva ABC — Classificação de Portfólio</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">A = 80% da receita &nbsp;|&nbsp; B = 15% &nbsp;|&nbsp; C = 5%</p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Classe A', count: aCount, color: '#d4af37', desc: 'Estrelas' },
              { label: 'Classe B', count: bCount, color: '#60a5fa', desc: 'Em Crescimento' },
              { label: 'Classe C', count: cCount, color: 'rgba(255,255,255,0.2)', desc: 'Revisar' },
            ].map(cls => (
              <div key={cls.label} className="text-center px-4 py-3 rounded-2xl border border-white/5 bg-black/30">
                <div className="text-2xl font-serif font-black" style={{ color: cls.color }}>{cls.count}</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-white/40">{cls.label}</div>
                <div className="text-[8px] font-bold text-white/20">{cls.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 text-[9px] font-black uppercase tracking-widest text-white/20">Produto</th>
                <th className="text-right py-3 text-[9px] font-black uppercase tracking-widest text-white/20">Receita</th>
                <th className="text-right py-3 text-[9px] font-black uppercase tracking-widest text-white/20">% Acumulado</th>
                <th className="text-center py-3 text-[9px] font-black uppercase tracking-widest text-white/20">Classe</th>
              </tr>
            </thead>
            <tbody>
              {abcData.slice(0, 8).map((p, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                  <td className="py-3 text-xs font-bold text-white/70">{i + 1}. {p.name}</td>
                  <td className="py-3 text-right text-xs font-serif font-black text-[#d4af37]">R$ {p.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 text-right text-xs font-bold text-white/40">{p.pct.toFixed(1)}%</td>
                  <td className="py-3 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      p.curve === 'A' ? 'bg-[#d4af37]/20 text-[#d4af37]' :
                      p.curve === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/5 text-white/30'
                    }`}>{p.curve}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
