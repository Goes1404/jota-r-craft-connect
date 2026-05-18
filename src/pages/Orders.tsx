import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShoppingBag, 
  ChevronRight,
  ArrowRight,
  Box,
  MapPin,
  Calendar,
  Zap,
  ShieldCheck,
  Star,
  Sparkles,
  Diamond
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(quantity, total_price, product:products(name, image))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Pago': return 1;
      case 'Em Preparação': return 2;
      case 'Enviado': return 3;
      case 'Entregue': return 4;
      default: return 1;
    }
  };

  const steps = [
    { id: 1, label: 'Confirmado', desc: 'Sua reserva foi garantida com sucesso.', icon: ShieldCheck },
    { id: 2, label: 'Curadoria', desc: 'Preparando sua peça sob padrões de luxo.', icon: Sparkles },
    { id: 3, label: 'Em Trânsito', desc: 'Transporte seguro iniciado para seu endereço.', icon: Truck },
    { id: 4, label: 'Entregue', desc: 'Experiência concluída. Aproveite seu item.', icon: Diamond },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Orders Sidebar */}
          <div className="w-full lg:w-[400px] space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-serif font-black text-white uppercase tracking-wider">Histórico</h1>
              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-none text-[8px] uppercase tracking-widest px-3">{orders.length} Pedidos</Badge>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left p-6 rounded-[32px] border transition-all duration-500 group relative overflow-hidden ${
                    selectedOrderId === order.id 
                      ? 'bg-[#d4af37]/10 border-[#d4af37]/40 shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Pedido</p>
                      <p className="text-sm font-black text-white uppercase tracking-widest">#{order.id.slice(0, 8)}</p>
                    </div>
                    <p className="text-xs font-serif font-black text-[#d4af37]">R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                      {format(new Date(order.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'Pago' || order.status === 'Entregue' ? 'bg-green-500' : 'bg-[#d4af37]'} animate-pulse`}></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{order.status}</span>
                    </div>
                  </div>
                </button>
              ))}

              {orders.length === 0 && (
                <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                  <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-6" />
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Nenhum pedido encontrado</p>
                  <Button onClick={() => navigate('/produtos')} variant="link" className="text-[#d4af37] mt-4 text-[10px] uppercase font-black">Começar a comprar</Button>
                </div>
              )}
            </div>
          </div>

          {/* Luxury Timeline Experience */}
          <div className="flex-1">
            {selectedOrder ? (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700">
                {/* Header Section */}
                <div className="p-10 md:p-16 bg-gradient-to-br from-[#d4af37]/5 to-transparent border-b border-white/5 relative">
                  <div className="absolute top-10 right-10 opacity-10">
                    <Zap className="w-32 h-32 text-[#d4af37]" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                      <h2 className="text-4xl font-serif font-black text-white mb-4 tracking-tighter">Status da <span className="text-[#d4af37]">Experiência</span></h2>
                      <div className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                        <span>Ref: {selectedOrder.id.slice(0, 12)}</span>
                        <span>•</span>
                        <span className="text-[#d4af37]">Tracking: {selectedOrder.tracking_code || 'Em processamento'}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-auto p-4 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#d4af37] flex items-center justify-center shadow-lg">
                        <Box className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Método</p>
                        <p className="text-sm font-bold text-white uppercase">{selectedOrder.payment_method === 'pix' ? 'PIX' : 'Cartão'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-10 md:p-16 bg-black/40">
                  <div className="relative space-y-12 before:absolute before:left-7 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                    {steps.map((step) => {
                      const isActive = getStatusStep(selectedOrder.status) >= step.id;
                      const isCurrent = getStatusStep(selectedOrder.status) === step.id;
                      
                      return (
                        <div key={step.id} className={`relative pl-20 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                          <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 ${
                            isActive 
                              ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                              : 'bg-black border-white/10 text-white/20'
                          }`}>
                            <step.icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />
                            {isCurrent && (
                              <div className="absolute inset-0 rounded-2xl border-2 border-[#d4af37] animate-ping opacity-20"></div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className={`text-lg font-serif font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-white/20'}`}>{step.label}</h4>
                            <p className="text-xs text-white/40 leading-relaxed font-medium">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="p-10 md:p-16 border-t border-white/5 bg-[#0a0a0a] grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-[#d4af37]" />
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Destino do Envio</h4>
                    </div>
                    <p className="text-sm text-white/60 font-medium leading-relaxed">{selectedOrder.shipping_address}</p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Itens da Coleção</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white/5 p-1 border border-white/5">
                            <img src={item.product?.image} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-[10px] font-bold text-white/80">{item.product?.name} <span className="text-[#d4af37]">x{item.quantity}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-10 border-t border-white/5 bg-black/60 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Garantia de Autenticidade Ativada</p>
                  </div>
                  <Button variant="outline" className="border-white/10 text-white/40 hover:text-white rounded-full px-10 h-14 text-[9px] font-black uppercase tracking-widest">
                    Solicitar Suporte Concierge
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] bg-white/[0.01] border border-white/5 border-dashed rounded-[48px] flex flex-col items-center justify-center text-center p-20">
                <Box className="w-16 h-16 text-white/5 mb-8" />
                <h3 className="text-2xl font-serif font-black text-white/20 mb-4 uppercase tracking-widest">Selecione uma aquisição</h3>
                <p className="text-xs text-white/10 max-w-xs font-bold uppercase tracking-widest">Clique em um pedido ao lado para visualizar a jornada completa da sua peça.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
