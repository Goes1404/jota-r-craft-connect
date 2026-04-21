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

const COLORS = ['#FFD700', '#B8860B', '#DAA520', '#C0C0C0', '#808080'];

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
      name: format(day, 'dd/MM', { locale: ptBR }),
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Chart */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm group hover:shadow-md transition-all">
        <h3 className="text-lg font-bold mb-6 font-serif text-primary">Tendência de Vendas (7 dias)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45 100% 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(45 100% 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(45 100% 60%)' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
              />
              <Area type="monotone" dataKey="vendas" stroke="hsl(45 100% 60%)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Pie Chart */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm group hover:shadow-md transition-all">
        <h3 className="text-lg font-bold mb-6 font-serif text-primary">Vendas por Categoria</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit vs Cost Bar Chart */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm lg:col-span-2 group hover:shadow-md transition-all">
        <h3 className="text-lg font-bold mb-6 font-serif text-primary">Lucro vs Custo</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitCostData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
              />
              <Legend />
              <Bar dataKey="custo" name="Custo" fill="hsl(0 0% 25%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(45 100% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
