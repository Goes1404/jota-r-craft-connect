import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Phone, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminAbandonedCarts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: carts, isLoading, refetch } = useQuery({
    queryKey: ['admin-abandoned-carts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('status', 'abandoned')
        .order('last_active_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, return empty array to avoid breaking the UI
        console.error(error);
        return [];
      }
      return data;
    },
    refetchInterval: 30000 // refresh every 30s
  });

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  const markAsRecovered = async (id: string) => {
    await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', id);
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      <div className="max-w-screen-xl mx-auto px-6 py-32">
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-[#d4af37] mb-8 uppercase text-xs tracking-widest font-bold hover:text-[#f2ca50] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold text-white">Carrinhos Abandonados</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1 font-bold">Recuperação de Vendas</p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="ghost" className="text-white/40 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-20 text-white/40 animate-pulse font-bold tracking-widest uppercase text-xs">
              Buscando oportunidades de venda...
            </div>
          ) : carts?.length === 0 ? (
            <div className="bg-[#0f0f0f]/60 p-12 rounded-[32px] border border-white/5 text-center">
              <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-white mb-2">Nenhum Carrinho Abandonado</h3>
              <p className="text-white/40 text-sm">Seus clientes estão finalizando todas as compras! Ou a tabela SQL ainda não foi criada.</p>
            </div>
          ) : (
            carts?.map(cart => {
              const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
              const isRecent = new Date().getTime() - new Date(cart.last_active_at).getTime() < 1000 * 60 * 60; // menos de 1h
              
              return (
                <div key={cart.id} className="bg-[#0f0f0f]/60 p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center">
                  
                  {/* Tempo */}
                  <div className="flex flex-col items-center justify-center bg-black/50 p-4 rounded-2xl border border-white/5 min-w-[120px]">
                    <Clock className={`w-6 h-6 mb-2 ${isRecent ? 'text-red-400 animate-pulse' : 'text-white/40'}`} />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-center text-white/60">
                      Há {formatDistanceToNow(new Date(cart.last_active_at), { locale: ptBR })}
                    </span>
                  </div>

                  {/* Dados do Cliente */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-white">{cart.name || 'Cliente (Preenchendo)'}</h3>
                    <p className="text-sm text-white/40">{cart.email}</p>
                    {cart.phone && (
                      <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {cart.phone}
                      </p>
                    )}
                  </div>

                  {/* Valor e Itens */}
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

                  {/* Ações */}
                  <div className="flex flex-col gap-3 min-w-[160px]">
                    {cart.phone ? (
                      <a 
                        href={`https://wa.me/${cart.phone.replace(/\D/g, '')}?text=Olá ${cart.name ? cart.name.split(' ')[0] : ''}, notamos que você deixou alguns itens no carrinho. Posso te ajudar a finalizar a compra com um cupom especial?`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full bg-[#25D366] text-black hover:bg-[#1DA851] font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl flex gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)]">
                          <Phone className="w-4 h-4" /> Chamar
                        </Button>
                      </a>
                    ) : (
                      <a href={`mailto:${cart.email}?subject=Você esqueceu algo no carrinho!`} className="w-full">
                        <Button className="w-full bg-white/10 text-white hover:bg-white/20 font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl">
                          Enviar E-mail
                        </Button>
                      </a>
                    )}
                    <Button onClick={() => markAsRecovered(cart.id)} variant="ghost" className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest h-8">
                      Ocultar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAbandonedCarts;
