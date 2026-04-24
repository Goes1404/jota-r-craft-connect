import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronLeft,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Aguardando Pagamento': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Clock, label: 'Aguardando Pagamento' },
  'Aguardando PIX': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Clock, label: 'Aguardando PIX' },
  'Processando Cartão': { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Clock, label: 'Processando Cartão' },
  'Pago': { color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: CheckCircle2, label: 'Pago — Preparando Envio' },
  'Enviado': { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Truck, label: 'Enviado' },
  'Entregue': { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Package, label: 'Entregue' },
  'Cancelado': { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle, label: 'Cancelado' },
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10s to catch payment updates
  });

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] rounded-full bg-[#d4af37] opacity-[0.03] blur-[120px]"></div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="flex items-center gap-4 mb-12">
          <Package className="w-8 h-8 text-[#d4af37]" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Meus Pedidos</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} registrado{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-16 h-16 text-white/10 mb-6" />
            <h2 className="text-xl font-serif font-bold text-white/40 mb-2">Nenhum pedido ainda</h2>
            <p className="text-white/20 text-sm mb-8">Seus pedidos aparecerão aqui após sua primeira compra.</p>
            <Button 
              onClick={() => navigate('/produtos')}
              className="bg-[#d4af37] text-black hover:bg-[#f2ca50] rounded-full px-8 font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Explorar Produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              const config = statusConfig[order.status] || statusConfig['Aguardando Pagamento'];
              const StatusIcon = config.icon;
              const isPaid = order.status === 'Pago' || order.status === 'Enviado' || order.status === 'Entregue';
              const isWaiting = order.status === 'Aguardando Pagamento' || order.status === 'Aguardando PIX';

              return (
                <div 
                  key={order.id} 
                  className={`bg-[#0f0f0f]/60 backdrop-blur-2xl border rounded-[32px] p-8 transition-all hover:border-white/10 ${
                    isPaid ? 'border-green-500/10' : isWaiting ? 'border-yellow-500/10' : 'border-white/5'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Order Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-white/20">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{config.label}</span>
                        {isWaiting && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                      </div>

                      {/* Address */}
                      {order.shipping_address && (
                        <p className="text-white/30 text-xs flex items-center gap-2">
                          <Truck className="w-3 h-3" /> {order.shipping_address}
                        </p>
                      )}

                      {/* Tracking */}
                      {order.tracking_code && (
                        <p className="text-[#d4af37] text-xs font-mono">
                          Rastreio: {order.tracking_code}
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total</span>
                      <span className="text-2xl font-serif font-black text-[#d4af37]">
                        R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-white/20 uppercase tracking-widest mt-1">
                        {order.payment_method === 'pix' ? 'PIX' : 'Cartão'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
