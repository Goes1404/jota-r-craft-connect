import React, { useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { TrendingUp, CreditCard, Smartphone, AlertCircle, Link2, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const fmt = (v: number) =>
  `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const AdminCommissions = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [connecting, setConnecting] = useState(false);

  // Status da conexão do marketplace MercadoPago (split automático do PIX).
  const { data: mpStatus, refetch: refetchMpStatus } = useQuery({
    queryKey: ['mp-marketplace-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('mp_marketplace_status');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? { connected: false }) as { connected: boolean; mp_user_id?: string };
    },
  });
  const mpConnected = !!mpStatus?.connected;

  // Feedback do retorno do fluxo OAuth (?mp=connected | ?mp=error).
  const mpReturn = searchParams.get('mp');

  const handleConnectMp = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mp-oauth-start');
      if (error || !data?.authUrl) throw new Error(data?.error || error?.message || 'Falha ao iniciar conexão');
      window.location.href = data.authUrl as string;
    } catch (e) {
      alert(`Não foi possível iniciar a conexão com o MercadoPago: ${(e as Error).message}`);
      setConnecting(false);
    }
  };

  React.useEffect(() => {
    if (mpReturn === 'connected') refetchMpStatus();
  }, [mpReturn, refetchMpStatus]);

  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-commissions', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, platform_fee_amount, payment_method, created_at, customer_name')
        .eq('status', 'Pago')
        .not('platform_fee_amount', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as {
        id: string;
        total_amount: number;
        platform_fee_amount: number;
        payment_method: string;
        created_at: string;
        customer_name: string;
      }[];
    }
  });

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  const cardOrders = orders.filter(o => o.payment_method !== 'pix');
  const pixOrders  = orders.filter(o => o.payment_method === 'pix');
  const cardTotal  = cardOrders.reduce((s, o) => s + (o.platform_fee_amount || 0), 0);
  const pixTotal   = pixOrders.reduce((s, o) => s + (o.platform_fee_amount || 0), 0);
  const total      = cardTotal + pixTotal;

  const yearOptions = [2025, 2026, 2027];

  return (
    <AdminShell
      eyebrow="Financeiro"
      title="Minhas Comissões"
      subtitle="10% de cada venda pago ao desenvolvedor"
    >
      {/* Seletor de período */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
        >
          {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#111]">{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
        >
          {yearOptions.map(y => <option key={y} value={y} className="bg-[#111]">{y}</option>)}
        </select>
      </div>

      {/* Feedback do retorno OAuth */}
      {mpReturn === 'connected' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-400/30 bg-green-400/10 px-5 py-4">
          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
          <p className="text-sm text-green-300">
            Conta MercadoPago conectada! A partir de agora os 10% do PIX são repassados automaticamente para sua conta de desenvolvedor.
          </p>
        </div>
      )}
      {mpReturn === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">
            Não foi possível conectar a conta MercadoPago{searchParams.get('detail') ? ` (${searchParams.get('detail')})` : ''}. Tente novamente.
          </p>
        </div>
      )}

      {/* Conexão do split automático do PIX (MercadoPago Marketplace) */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${mpConnected ? 'bg-green-400/10 border-green-400/30' : 'bg-amber-400/10 border-amber-400/30'}`}>
            {mpConnected
              ? <CheckCircle2 className="w-[18px] h-[18px] text-green-400" />
              : <Link2 className="w-[18px] h-[18px] text-amber-400" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Split automático do PIX</p>
            <p className="text-xs text-white/40 truncate">
              {mpConnected
                ? 'Conta MercadoPago conectada · 10% repassados automaticamente'
                : 'Conecte a conta MercadoPago do lojista para repassar os 10% sozinho'}
            </p>
          </div>
        </div>
        {!mpConnected && (
          <button
            onClick={handleConnectMp}
            disabled={connecting}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#e5c14e] transition-colors disabled:opacity-60"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {connecting ? 'Abrindo…' : 'Conectar MercadoPago'}
          </button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/30">
              <TrendingUp className="w-[18px] h-[18px] text-[#d4af37]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Total do mês</span>
          </div>
          <p className="text-3xl font-serif font-bold text-white">
            {isLoading ? <span className="opacity-40">…</span> : fmt(total)}
          </p>
          <p className="mt-1 text-xs text-white/30">{orders.length} pedidos pagos</p>
        </motion.div>

        {/* Cartão */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="bg-white/[0.04] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 border border-violet-400/20">
              <CreditCard className="w-[18px] h-[18px] text-violet-400" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Cartão</span>
          </div>
          <p className="text-2xl font-serif font-bold text-white">
            {isLoading ? <span className="opacity-40">…</span> : fmt(cardTotal)}
          </p>
          <p className="mt-1 text-xs text-white/30">{cardOrders.length} pedidos · coletado via Stripe</p>
        </motion.div>

        {/* PIX */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="bg-white/[0.04] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-400/10 border border-green-400/20">
              <Smartphone className="w-[18px] h-[18px] text-green-400" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">PIX</span>
          </div>
          <p className="text-2xl font-serif font-bold text-white">
            {isLoading ? <span className="opacity-40">…</span> : fmt(pixTotal)}
          </p>
          <p className="mt-1 text-xs text-white/30">
            {pixOrders.length} pedidos · {mpConnected ? 'repasse automático' : 'cobrar do cliente'}
          </p>
        </motion.div>
      </div>

      {/* Aviso PIX — só quando o split automático NÃO está conectado */}
      {!isLoading && pixTotal > 0 && !mpConnected && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-400/20 bg-green-400/5 px-5 py-4">
          <AlertCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
          <p className="text-sm text-green-300">
            Você tem <span className="font-bold">{fmt(pixTotal)}</span> de comissão via PIX a cobrar do cliente este mês.
            Conecte a conta MercadoPago acima para o repasse virar automático.
          </p>
        </div>
      )}

      {/* Tabela de pedidos */}
      <div className="bg-[#0f0f0f]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
            Detalhamento · {MONTHS[month].slice(0, 3)} {year}
          </h2>
          {!isLoading && orders.length > 0 && (
            <span className="text-[10px] font-black text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full px-3 py-1">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-white/30">Carregando…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-white/30">Nenhuma comissão neste período.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{o.customer_name || 'Cliente'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30">
                      {new Date(o.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        o.payment_method === 'pix'
                          ? 'text-green-400 border-green-400/30 bg-green-400/10'
                          : 'text-violet-400 border-violet-400/30 bg-violet-400/10'
                      }`}
                    >
                      {o.payment_method === 'pix' ? 'PIX' : 'Cartão'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/30">Venda: {fmt(o.total_amount)}</p>
                  <p className="text-base font-bold text-[#d4af37]">{fmt(o.platform_fee_amount)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminCommissions;
