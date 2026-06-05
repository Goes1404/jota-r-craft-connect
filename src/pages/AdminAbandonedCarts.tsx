import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { AdminShell } from '@/components/admin/AdminShell';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Phone, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Zap, 
  Bot, 
  MessageCircle,
  Copy
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const AdminAbandonedCarts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});

  const { data: carts, isLoading, refetch } = useQuery({
    queryKey: ['admin-abandoned-carts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('status', 'abandoned')
        .order('last_active_at', { ascending: false });
      
      if (error) {
        console.error(error);
        return [];
      }
      return data;
    },
    refetchInterval: 30000 
  });

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  const generateAIRecoveryMessage = async (cart: any) => {
    setIsGenerating(cart.id);
    try {
      const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
      const context = {
        name: cart.name,
        total: cart.total_amount,
        itemCount: items.length,
        items: items.map((i: any) => i.name).join(', ')
      };

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: `Gere uma mensagem irresistível de recuperação de carrinho para o WhatsApp. Cliente: ${JSON.stringify(context)}. O tom deve ser luxuoso, amigável e oferecer uma solução (como tirar dúvidas ou um cupom surpresa). Seja curto e direto. Responda APENAS o texto da mensagem.`,
          context: "Você é o Lumina Recovery Agent, especialista em conversão de vendas abandonadas."
        }
      });

      if (error) throw error;
      setAiMessages(prev => ({ ...prev, [cart.id]: data.reply }));
      toast.success('Mensagem de recuperação gerada! ✨');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar mensagem com IA.');
    } finally {
      setIsGenerating(null);
    }
  };

  const markAsRecovered = async (id: string) => {
    await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', id);
    refetch();
    toast.success('Carrinho marcado como recuperado!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <AdminShell
      eyebrow="Recuperação"
      title="Carrinhos Abandonados"
      subtitle="Lumina AI Sales Recovery"
      actions={
        <Button onClick={() => refetch()} variant="ghost" className="text-white/40 hover:text-white">
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      }
    >

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-20 text-white/40 animate-pulse font-bold tracking-widest uppercase text-xs">
              Buscando oportunidades de venda...
            </div>
          ) : carts?.length === 0 ? (
            <div className="bg-[#0f0f0f]/60 p-12 rounded-[32px] border border-white/5 text-center">
              <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-white mb-2">Nenhum Carrinho Abandonado</h3>
              <p className="text-white/40 text-sm">Seus clientes estão finalizando todas as compras!</p>
            </div>
          ) : (
            carts?.map(cart => {
              const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
              const isRecent = new Date().getTime() - new Date(cart.last_active_at).getTime() < 1000 * 60 * 60;
              const aiMsg = aiMessages[cart.id];
              
              return (
                <div key={cart.id} className="bg-[#0f0f0f]/60 overflow-hidden rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    {/* Time */}
                    <div className="flex flex-col items-center justify-center bg-black/50 p-4 rounded-2xl border border-white/5 min-w-[120px]">
                      <Clock className={`w-6 h-6 mb-2 ${isRecent ? 'text-red-400 animate-pulse' : 'text-white/40'}`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-center text-white/60">
                        Há {formatDistanceToNow(new Date(cart.last_active_at), { locale: ptBR })}
                      </span>
                    </div>

                    {/* Customer Data */}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-bold text-white">{cart.name || 'Cliente (Preenchendo)'}</h3>
                      <p className="text-sm text-white/40">{cart.email}</p>
                      {cart.phone && (
                        <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                          <Phone className="w-3 h-3" /> {cart.phone}
                        </p>
                      )}
                    </div>

                    {/* Value and Items */}
                    <div className="flex-1">
                      <p className="text-2xl font-serif font-black text-[#d4af37] mb-2">
                        R$ {Number(cart.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                          {items.length} item(s) no carrinho
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <Button 
                        onClick={() => generateAIRecoveryMessage(cart)}
                        disabled={isGenerating === cart.id}
                        className="w-full bg-white/5 border border-white/10 text-[#d4af37] hover:bg-[#d4af37]/10 font-black text-[9px] uppercase tracking-widest h-12 rounded-xl flex gap-2"
                      >
                        {isGenerating === cart.id ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} 
                        {aiMsg ? 'Regerar com IA' : 'Sugerir com IA'}
                      </Button>
                      
                      {cart.phone && (
                        <a 
                          href={`https://wa.me/${cart.phone.replace(/\D/g, '')}?text=${encodeURIComponent(aiMsg || `Olá ${cart.name ? cart.name.split(' ')[0] : ''}, notamos que você deixou alguns itens no carrinho. Posso te ajudar?`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button className="w-full bg-[#25D366] text-black hover:bg-[#1DA851] font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl flex gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)]">
                            <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* AI Message Preview */}
                  {aiMsg && (
                    <div className="bg-orange-500/5 border-t border-white/5 p-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-orange-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Lumina AI Strategy</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(aiMsg)} className="h-6 text-white/40">
                          <Copy className="w-3 h-3 mr-2" /> Copiar
                        </Button>
                      </div>
                      <p className="text-sm italic font-serif text-white/80 leading-relaxed px-4 border-l-2 border-orange-500/40">
                        "{aiMsg}"
                      </p>
                      <div className="flex justify-end mt-4">
                        <Button onClick={() => markAsRecovered(cart.id)} variant="ghost" className="text-[9px] uppercase tracking-widest text-white/20 hover:text-green-400">
                          Marcar como Recuperado
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
    </AdminShell>
  );
};

export default AdminAbandonedCarts;
