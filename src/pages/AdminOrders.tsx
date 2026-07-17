import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ShoppingBag, 
  Search, 
  Package, 
  Truck, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Save,
  User,
  Phone,
  Printer,
  ChevronRight,
  Eye,
  AlertCircle,
  MapPin,
  Calendar,
  Box,
  Diamond,
  Zap,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminShell } from '@/components/admin/AdminShell';
import { STORE } from '@/config/store';
import { AdminCardSkeleton, AdminEmptyState, AdminErrorState } from '@/components/admin/ui';

const AdminOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isSendingTracking, setIsSendingTracking] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        // Sem embed de profiles: orders não tem FK para profiles (o PostgREST não
        // consegue inferir a relação). Os dados do cliente já estão desnormalizados
        // em customer_name / customer_email / customer_phone na própria order.
        .select('*, items:order_items(quantity, total_price, unit_price, product:products(name, image))')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, tracking_code }: { id: string, status: string, tracking_code?: string }) => {
      const updateData: any = { status };
      if (tracking_code) updateData.tracking_code = tracking_code;
      
      const { error } = await supabase.from('orders').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-orders'] });
      toast.success(`Pedido atualizado para: ${variables.status}`);
      if (selectedOrder?.id === variables.id) {
        setSelectedOrder({ ...selectedOrder, status: variables.status, tracking_code: variables.tracking_code || selectedOrder.tracking_code });
      }
    }
  });

  const handleShipOrder = async () => {
    if (!trackingInput.trim() || !selectedOrder) return;
    setIsSendingTracking(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedOrder.id,
        status: 'Enviado',
        tracking_code: trackingInput.trim(),
      });
      // Send shipped email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'order_shipped',
          to: selectedOrder.customer_email,
          customerName: selectedOrder.customer_name,
          orderId: selectedOrder.id,
          trackingCode: trackingInput.trim(),
        },
      });
      // Send shipped WhatsApp
      const clientPhone = selectedOrder.customer_phone;
      if (clientPhone) {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'order_shipped',
            to: clientPhone,
            customerName: selectedOrder.customer_name,
            orderId: selectedOrder.id,
            trackingCode: trackingInput.trim(),
          },
        }).catch((err) => console.error('send-whatsapp shipping notification failed:', err));
      }
      toast.success('Pedido marcado como Enviado e cliente notificado por e-mail e WhatsApp!');
      setIsTrackingDialogOpen(false);
      setTrackingInput('');
    } catch {
      toast.error('Erro ao atualizar status do pedido.');
    } finally {
      setIsSendingTracking(false);
    }
  };

  const notifyWhatsApp = (order: any) => {
    const firstName = order.customer_name?.split(' ')[0] || 'Cliente';
    const statusText = order.status === 'Em Preparação' ? 'está sendo preparado com todo cuidado ✨' : 
                      order.status === 'Enviado' ? `acaba de ser enviado! 🚚\n\nCódigo de Rastreio: *${order.tracking_code || 'Em processamento'}*` : 
                      'foi entregue! Esperamos que você ame sua nova peça. 💎';
    
    const text = `Olá ${firstName}! Seu pedido da ${STORE.name} ${statusText}`;
    const phone = order.customer_phone?.replace(/\D/g, '') || order.shipping_address?.match(/\d{10,11}/)?.[0];
    
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      toast.error('Telefone não encontrado para este cliente.');
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
            o.customer_name?.toLowerCase().includes(term) ||
      o.customer_email?.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Em Preparação': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Enviado': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Aguardando Pagamento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const searchAction = (
    <div className="relative group w-full sm:w-72">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
      <Input
        placeholder="Buscar pedido, cliente, status…"
        className="bg-white/5 border-white/10 h-11 w-full pl-10 rounded-full text-xs focus:border-[#d4af37]/40 transition-all"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );

  return (
    <AdminShell
      eyebrow="Pedidos"
      title="Logistics Terminal"
      subtitle={`${filteredOrders.length} pedido(s) na fila`}
      actions={searchAction}
    >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Orders List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wider">Fila de Despacho</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{filteredOrders.length} Pedidos encontrados</span>
            </div>

            {isLoading && <AdminCardSkeleton count={5} />}
            {!isLoading && filteredOrders.length === 0 && (
              <AdminEmptyState
                icon={ShoppingBag}
                title="Nenhum pedido encontrado"
                description={searchTerm ? 'Tente outro termo de busca.' : 'Os pedidos aparecerão aqui assim que forem realizados.'}
              />
            )}
            <div className="space-y-4">
              {!isLoading && filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-[#0a0a0a] border ${selectedOrder?.id === order.id ? 'border-[#d4af37]/40 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'border-white/5'} p-6 rounded-[32px] cursor-pointer transition-all hover:border-white/20 group relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center">
                        <ShoppingBag className={`w-6 h-6 ${order.status === 'Pago' ? 'text-green-500 animate-pulse' : 'text-white/20'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-black text-white uppercase tracking-widest">#{order.id.slice(0, 8)}</p>
                          <Badge className={`${getStatusColor(order.status)} border text-[8px] font-black px-2 py-0.5`}>{order.status}</Badge>
                        </div>
                        <p className="text-xs font-bold text-white/40">{order.customer_name || 'Cliente'} • {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-serif font-black text-[#d4af37] mb-1">R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{order.items?.length || 0} Itens</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed View */}
          <div className="lg:col-span-4">
            <div className="sticky top-32">
              {selectedOrder ? (
                <div className="bg-[#0f0f0f] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500">
                  {/* Header */}
                  <div className="p-8 bg-gradient-to-br from-[#d4af37]/10 to-transparent border-b border-white/5">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-serif font-black text-white mb-2 tracking-tight">Detalhes do Pedido</h3>
                        <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Protocolo: {selectedOrder.id}</p>
                      </div>
                      <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="h-8 w-8 rounded-full p-0 text-white/20 hover:text-white">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center text-black shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white uppercase tracking-widest truncate">{selectedOrder.customer_name || 'Cliente'}</p>
                        <p className="text-[10px] text-white/40 font-bold">{selectedOrder.customer_phone || '—'}</p>
                        <p className="text-[10px] text-white/30 font-bold truncate">{selectedOrder.customer_email || '—'}</p>
                      </div>
                      <Button variant="ghost" onClick={() => notifyWhatsApp(selectedOrder)} className="ml-auto text-[#25D366] hover:bg-[#25D366]/10 p-2 shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto scrollbar-hide">
                    
                    {/* Status Actions */}
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Ações de Logística</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'Em Preparação' })}
                          className="bg-white/5 hover:bg-blue-500/20 border border-white/10 text-white text-[9px] font-black uppercase h-10 rounded-xl"
                        >
                          Preparar
                        </Button>
                        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-white/5 hover:bg-purple-500/20 border border-white/10 text-white text-[9px] font-black uppercase h-10 rounded-xl">
                              Enviar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[24px] max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-serif font-bold">Código de Rastreio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <p className="text-xs text-white/40">Informe o código para notificar o cliente por e-mail automaticamente.</p>
                              <Input
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                placeholder="Ex: BR123456789BR"
                                className="bg-white/5 border-white/10 h-12 rounded-xl uppercase tracking-widest"
                                onKeyDown={(e) => e.key === 'Enter' && handleShipOrder()}
                                autoFocus
                              />
                              <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setIsTrackingDialogOpen(false)} className="flex-1 text-white/40 hover:text-white text-[10px] font-black uppercase">
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleShipOrder}
                                  disabled={!trackingInput.trim() || isSendingTracking}
                                  className="flex-1 bg-[#d4af37] text-black font-black text-[10px] uppercase h-11 rounded-xl hover:bg-[#f2ca50] disabled:opacity-30"
                                >
                                  {isSendingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Envio'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'Entregue' })}
                          className="bg-white/5 hover:bg-green-500/20 border border-white/10 text-white text-[9px] font-black uppercase h-10 rounded-xl"
                        >
                          Entregue
                        </Button>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#d4af37]" />
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Endereço de Entrega</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[11px] text-white/60 leading-relaxed font-bold">{selectedOrder.shipping_address}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Itens para Packing ({selectedOrder.items?.length})</p>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-black rounded-xl border border-white/5">
                            <div className="w-10 h-10 rounded-lg bg-white/5 p-1">
                              <img src={item.product?.image} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-white uppercase line-clamp-1">{item.product?.name}</p>
                              <p className="text-[9px] text-[#d4af37] font-bold">Qtd: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-8 border-t border-white/5 bg-black/40 flex gap-3">
                    <Button className="flex-1 bg-[#d4af37] text-black h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                      <Printer className="w-4 h-4 mr-2" /> Imprimir Etiqueta
                    </Button>
                    <Button variant="ghost" className="w-12 h-12 rounded-2xl border border-white/10 text-red-400 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0f0f0f]/40 border border-white/5 border-dashed rounded-[40px] h-[600px] flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                    <Eye className="w-8 h-8 text-white/10" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white/40">Selecione um pedido</h3>
                  <p className="text-[10px] text-white/20 uppercase font-black mt-2 tracking-widest">Para ver detalhes e gerenciar logística</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </AdminShell>
  );
};

export default AdminOrders;
