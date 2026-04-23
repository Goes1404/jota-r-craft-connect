import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  ShoppingBag, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Package, 
  ArrowLeft,
  Diamond,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Orders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from('sales')
        .select('*, product:products(name, image_url)')
        .eq('order_id', selectedOrder.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'entregue':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
      case 'pendente':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'shipped':
      case 'enviado':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/20';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.01] blur-[120px]"></div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Perfil
            </button>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight">Meus <span className="text-[#d4af37] italic">Pedidos</span></h1>
            <p className="text-white/30 text-sm font-medium">Acompanhe o status e histórico de todas as suas aquisições exclusivas.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0f0f0f]/60 backdrop-blur-xl p-4 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Total de Pedidos</span>
              <span className="text-xl font-serif font-bold text-white">{orders?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {ordersLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full bg-white/5 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 transition-all duration-500 hover:border-[#d4af37]/30 group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-white/20 group-hover:text-[#d4af37] transition-colors">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">ID do Pedido</span>
                        <span className="text-xs font-mono font-bold text-white/60">#{order.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white">Pedido Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')}</h3>
                      <div className="flex items-center gap-4 pt-2">
                        <span className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {order.status || 'Em Processamento'}
                        </span>
                        <span className="text-xs text-white/30 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {order.tracking_code && (
                        <div className="pt-3 flex items-center gap-3">
                          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 group/track">
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Rastreio:</span>
                            <span className="text-[10px] font-mono font-bold text-[#d4af37] tracking-wider">{order.tracking_code}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(order.tracking_code);
                                // Toast is handled by context but I'll add a local simple feedback if needed
                              }}
                              className="p-1 hover:bg-white/10 rounded-md transition-colors"
                              title="Copiar Código"
                            >
                              <ExternalLink className="w-3 h-3 text-white/20 group-hover/track:text-[#d4af37]" />
                            </button>
                          </div>
                          <a 
                            href={`https://www.linkcorreios.com.br/?id=${order.tracking_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]/60 hover:text-[#d4af37] transition-colors"
                          >
                            Rastrear Agora
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-4 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">Valor Total</span>
                      <span className="text-2xl font-serif font-bold text-[#d4af37]">R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <Button 
                      onClick={() => setSelectedOrder(order)}
                      variant="ghost" 
                      className="text-white/40 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest gap-2 group-hover:text-[#d4af37] transition-all"
                    >
                      Ver Detalhes <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-8 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px]">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative">
              <ShoppingBag className="w-10 h-10 text-white/10" />
              <div className="absolute inset-0 bg-[#d4af37]/5 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-white">Nenhum pedido encontrado</h3>
              <p className="text-sm text-white/30 max-w-xs mx-auto">Sua coleção está aguardando para ser iniciada. Explore nossas peças exclusivas.</p>
            </div>
            <Button 
              onClick={() => navigate('/produtos')}
              className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-10 py-6 rounded-full hover:bg-[#f2ca50] transition-all shadow-xl shadow-[#d4af37]/10"
            >
              Iniciar Coleção
            </Button>
          </div>
        )}

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl bg-black/95 backdrop-blur-2xl border-white/10 text-white p-0 overflow-hidden rounded-[32px]">
            <DialogHeader className="p-8 border-b border-white/5 bg-[#0a0a0a]">
              <DialogTitle className="flex items-center gap-3">
                <Diamond className="h-5 w-5 text-[#d4af37]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Detalhes do Pedido</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {itemsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-20 w-full bg-white/5 rounded-2xl animate-pulse"></div>)}
                </div>
              ) : orderItems && orderItems.length > 0 ? (
                <div className="space-y-6">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#d4af37]/20 transition-all group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black border border-white/5">
                        <img 
                          src={item.product?.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338'} 
                          alt={item.product?.name} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-white uppercase tracking-tight">{item.product?.name || 'Produto Exclusivo'}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.quantity} unidades</span>
                          <span className="text-sm font-serif font-bold text-[#d4af37]">R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white/40 py-12">Não foi possível carregar os itens deste pedido.</p>
              )}
            </div>

            <div className="p-8 bg-[#0a0a0a] border-t border-white/5 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Total Investido</span>
                <span className="text-3xl font-serif font-bold text-[#d4af37] block">
                  R$ {selectedOrder && Number(selectedOrder.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button 
                onClick={() => setSelectedOrder(null)}
                className="bg-white/10 hover:bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-6 rounded-2xl transition-all"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Need Help Section */}
        <section className="mt-20 p-8 rounded-[32px] bg-[#d4af37]/5 border border-[#d4af37]/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37] flex items-center justify-center text-black shadow-lg shadow-[#d4af37]/20">
              <Diamond className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Atendimento Personalizado</h3>
              <p className="text-white/40 text-xs">Dúvidas sobre seu pedido? Nosso concierge está à disposição.</p>
            </div>
          </div>
          <Link to="/contato">
            <Button className="bg-white/5 border border-white/10 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 text-white font-bold text-[10px] uppercase tracking-widest px-8 py-6 rounded-2xl transition-all flex items-center gap-2">
              Contatar Concierge <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
