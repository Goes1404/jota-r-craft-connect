import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { STORE } from '@/config/store';
import { AdminCardSkeleton, AdminEmptyState, AdminErrorState } from '@/components/admin/ui';
import {
  Users,
  Mail,
  Search,
  Phone,
  Star,
  User,
  Sparkles,
  Bot,
  MessageCircle,
  Copy,
  Zap
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminCustomers = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isGeneratingApproach, setIsGeneratingApproach] = useState(false);
  const [aiApproach, setAiApproach] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
      if (profileError) throw profileError;

      const { data: orders, error: orderError } = await supabase.from('orders').select('id, user_id, total_amount, created_at, status');
      if (orderError) throw orderError;

      const customerMap = profiles.map(profile => {
        const userOrders = orders.filter(o => o.user_id === profile.id);
        const validOrders = userOrders.filter(o => o.status !== 'Cancelado');
        const ltv = validOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const totalOrders = validOrders.length;
        const averageTicket = totalOrders > 0 ? ltv / totalOrders : 0;
        
        let lastOrderDate = null;
        if (userOrders.length > 0) {
          lastOrderDate = userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at;
        }

        let tags = [];
        if (ltv >= 1000) tags.push({ label: 'VIP', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' });
        if (totalOrders >= 3) tags.push({ label: 'Recorrente', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' });
        if (!lastOrderDate) tags.push({ label: 'Novo', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' });
        else if ((new Date().getTime() - new Date(lastOrderDate).getTime()) > 60 * 24 * 60 * 60 * 1000) {
          tags.push({ label: 'Esfriando', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' });
        }

        return {
          ...profile,
          ltv,
          totalOrders,
          averageTicket,
          lastOrderDate,
          tags,
          ordersList: userOrders
        };
      });

      return customerMap.sort((a, b) => b.ltv - a.ltv);
    }
  });

  const generateAIApproach = async (customer: any) => {
    setIsGeneratingApproach(true);
    setAiApproach(null);
    try {
      const context = {
        name: customer.full_name,
        ltv: customer.ltv,
        totalOrders: customer.totalOrders,
        tags: customer.tags.map((t: any) => t.label),
        lastOrder: customer.lastOrderDate,
        notes: customer.admin_notes
      };

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: `Gere uma mensagem de abordagem de vendas para WhatsApp para este cliente da ${STORE.name}: ${JSON.stringify(context)}. Chame pelo primeiro nome, mencione brevemente o histórico se for cliente recorrente, e ofereça ajuda de forma amigável e direta. Responda APENAS o texto da mensagem.`,
          context: `Você é o assistente de vendas da ${STORE.name}, especializado em atendimento ao cliente e produtos da loja.`
        }
      });

      if (error) throw error;
      setAiApproach(data.text || data.reply);
      toast.success('Abordagem gerada pela Lumina AI! ✨');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar abordagem com IA.');
    } finally {
      setIsGeneratingApproach(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensagem copiada para a área de transferência!');
  };

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
      const { error } = await supabase.from('profiles').update({ admin_notes: notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Anotações salvas com sucesso!');
    }
  });

  const openCustomerProfile = (customer: any) => {
    setSelectedCustomer(customer);
    setNotes(customer.admin_notes || '');
    setAiApproach(null);
  };

  const { data: newsletters, isLoading: newsLoading } = useQuery({
    queryKey: ['admin-newsletter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('newsletter').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  if (!user || user.app_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  const filteredCustomers = customers?.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminShell
      eyebrow="CRM"
      title="Visão 360"
      actions={
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border-white/10 pl-10 rounded-full h-11 text-xs focus:border-[#d4af37]/40 transition-all"
          />
        </div>
      }
    >

      {/* Customer Profile Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-5xl bg-[#0a0a0a] border-white/10 text-white rounded-[32px] overflow-hidden p-0">
          <div className="p-8 border-b border-white/5 bg-black/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                <User className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                  {selectedCustomer?.full_name || 'Cliente'}
                  {selectedCustomer?.tags?.some((t: any) => t.label === 'VIP') && <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />}
                </DialogTitle>
                <DialogDescription className="text-white/40 text-xs font-bold mt-1 uppercase tracking-widest">
                  {selectedCustomer?.email} {selectedCustomer?.phone && `• ${selectedCustomer.phone}`}
                </DialogDescription>
              </div>
            </div>
            
            <Button 
              onClick={() => generateAIApproach(selectedCustomer)}
              disabled={isGeneratingApproach}
              className="bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-black font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-full shadow-lg shadow-[#d4af37]/20 hover:scale-105 transition-all"
            >
              {isGeneratingApproach ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" /> Analisando Perfil...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Gerar Abordagem com IA
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Notes Section */}
            <div className="p-8 border-r border-white/5 bg-[#0f0f0f] space-y-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Anotações Internas</h4>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cliente prefere embalagem para presente. Filha se chama Maria..."
                  className="min-h-[200px] bg-black/40 border-white/10 text-white resize-none rounded-2xl focus:border-[#d4af37]/40 text-sm p-4"
                />
                <Button 
                  onClick={() => updateNotesMutation.mutate({ id: selectedCustomer.id, notes })}
                  disabled={updateNotesMutation.isPending}
                  className="w-full mt-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[9px] h-10 rounded-xl hover:bg-white/10 transition-all"
                >
                  {updateNotesMutation.isPending ? 'Salvando...' : 'Salvar Notas'}
                </Button>
              </div>
            </div>
            
            {/* AI Approach Section */}
            <div className="p-8 border-r border-white/5 bg-[#0a0a0a] space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37] mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Lumina Concierge Suggestion
              </h4>
              
              {aiApproach ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 p-6 rounded-2xl text-sm italic text-white/90 leading-relaxed font-serif relative group">
                    "{aiApproach}"
                    <Button 
                      onClick={() => copyToClipboard(aiApproach)}
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const phone = selectedCustomer.phone?.replace(/\D/g, '');
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(aiApproach)}`, '_blank');
                      }}
                      className="flex-1 bg-[#25D366] text-black font-black text-[9px] uppercase tracking-widest h-10 rounded-xl hover:bg-[#25D366]/80"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Enviar WhatsApp
                    </Button>
                    <Button 
                      onClick={() => setAiApproach(null)}
                      variant="ghost"
                      className="text-white/20 hover:text-white text-[9px] uppercase font-black"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-relaxed">
                    Clique no botão acima para gerar uma <br /> estratégia exclusiva de vendas.
                  </p>
                </div>
              )}
            </div>

            {/* History Section */}
            <div className="p-8 bg-[#0f0f0f] overflow-y-auto max-h-[600px] custom-scrollbar">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex justify-between">
                <span>Histórico de Pedidos</span>
                <span className="text-[#d4af37]">LTV: R$ {selectedCustomer?.ltv?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </h4>
              
              <div className="space-y-4">
                {selectedCustomer?.ordersList?.length > 0 ? (
                  selectedCustomer.ordersList.map((order: any) => (
                    <div key={order.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-white uppercase">Pedido #{order.id.slice(0,6)}</p>
                          <p className="text-[9px] text-white/40">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <Badge className="bg-black text-[#d4af37] text-[8px] font-black uppercase tracking-widest border border-white/10">
                          R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Status: <span className="text-white">{order.status}</span></p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40">Nenhum pedido finalizado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* CRM 360 Table */}
          <div className="flex-1 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-black/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]"><Users className="w-5 h-5" /></div>
                <h3 className="text-xl font-serif font-bold text-white">Gestão de Clientes e LTV</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{filteredCustomers?.length || 0} Clientes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="py-6 px-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cliente</th>
                    <th className="py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-white/30">LTV (Lifetime Value)</th>
                    <th className="py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Pedidos</th>
                    <th className="py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Tags Segmentação</th>
                    <th className="py-6 px-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/40">Carregando CRM...</td>
                    </tr>
                  ) : filteredCustomers?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/40">Nenhum cliente encontrado.</td>
                    </tr>
                  ) : filteredCustomers?.map(customer => (
                    <tr key={customer.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            {customer.full_name || 'Usuário Sem Nome'}
                            {customer.tags.some((t: any) => t.label === 'VIP') && <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />}
                          </span>
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{customer.email}</span>
                          {customer.phone && (
                            <span className="text-[9px] font-bold text-green-400/70 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-serif font-black text-[#d4af37]">R$ {customer.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Tkt Médio: R$ {customer.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="py-6 text-center text-white/60 font-bold">
                        {customer.totalOrders}
                      </td>
                      <td className="py-6">
                        <div className="flex flex-wrap gap-2">
                          {customer.tags.map((tag: any, idx: number) => (
                            <Badge key={idx} className={`${tag.color} uppercase text-[9px] font-black tracking-widest px-2 py-0.5`}>
                              {tag.label}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={() => openCustomerProfile(customer)}
                            variant="ghost" 
                            size="sm" 
                            className="text-white/40 hover:text-white hover:bg-white/5 h-8 rounded-lg"
                          >
                            <User className="w-4 h-4" />
                          </Button>
                          {customer.phone && (
                            <a 
                              href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=Olá ${customer.full_name?.split(' ')[0]}, tudo bem?`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-black h-8 rounded-lg">
                                <Phone className="w-3 h-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="w-full lg:w-80 space-y-8">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
              <h3 className="text-lg font-serif font-bold text-white mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#d4af37]" /> Inscritos (Newsletter)
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {newsLoading ? <p className="text-white/40 text-xs">Carregando...</p> : newsletters?.length === 0 ? <p className="text-white/40 text-xs">Nenhum inscrito ainda.</p> : newsletters?.map(n => (
                  <div key={n.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                    <span className="block text-xs font-bold text-white mb-1 truncate">{n.email}</span>
                    <span className="text-white/30 text-[9px] uppercase tracking-widest">{format(new Date(n.created_at), 'dd/MM/yyyy')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminCustomers;
