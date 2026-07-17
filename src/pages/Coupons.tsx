import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { STORE } from '@/config/store';
import { Footer } from '@/components/Footer';
import { 
  Tag, 
  Copy, 
  Clock, 
  Gift, 
  ArrowLeft,
  Diamond,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Coupons: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['user-coupons'],
    queryFn: async () => {
      // In a real scenario, you might have a junction table for user-coupons
      // or just global active coupons. We'll fetch active global ones for now.
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) return []; // Fallback to empty list if table doesn't exist yet
      return data;
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código Copiado!",
      description: `O cupom ${code} foi copiado para sua área de transferência.`,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  // Placeholder coupons if DB is empty/not ready
  const displayCoupons = coupons && coupons.length > 0 ? coupons : [
    { id: '1', code: 'BEMVINDO10', discount_percentage: 10, description: 'Desconto de boas-vindas para sua primeira aquisição premium.', expiry_date: '2024-12-31' },
    { id: '2', code: 'JRLUXO', discount_percentage: 15, description: `Cupom exclusivo para membros do Programa ${STORE.name}.`, expiry_date: '2024-10-15' }
  ];

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#d4af37] opacity-[0.02] blur-[120px]"></div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Perfil
            </button>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight flex items-center gap-4">
              Meus <span className="text-[#d4af37] italic">Benefícios</span>
              <Sparkles className="w-8 h-8 text-[#d4af37] animate-pulse" />
            </h1>
            <p className="text-white/30 text-sm font-medium">Cupons exclusivos e ofertas selecionadas para sua experiência premium.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {couponsLoading ? (
            [1, 2].map(i => <div key={i} className="h-48 w-full bg-white/5 rounded-[32px] animate-pulse"></div>)
          ) : displayCoupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className="group relative bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 overflow-hidden transition-all duration-500 hover:border-[#d4af37]/30"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-3xl group-hover:bg-[#d4af37]/10 transition-all"></div>
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 rounded-full bg-[#d4af37] text-black text-[10px] font-black uppercase tracking-widest">
                  {coupon.discount_percentage}% OFF
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-xl font-serif font-bold text-white uppercase tracking-tight">{coupon.code}</h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  Expira em: {new Date(coupon.expiry_date).toLocaleDateString('pt-BR')}
                </div>
                <Button 
                  onClick={() => copyToClipboard(coupon.code)}
                  variant="ghost"
                  className="bg-white/5 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-xl transition-all flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Loyalty Progress Reminder */}
        <section className="mt-16 p-8 rounded-[40px] bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-6 relative z-10 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl bg-[#d4af37] flex items-center justify-center text-black shadow-xl shadow-[#d4af37]/20">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Mais Benefícios em Breve</h3>
              <p className="text-white/40 text-sm max-w-sm">Continue acumulando pontos para desbloquear cupons de até 30% e brindes exclusivos.</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/produtos')}
            className="bg-black border border-[#d4af37]/30 hover:border-[#d4af37] text-white font-bold text-[10px] uppercase tracking-widest px-4 md:px-8 py-6 rounded-2xl transition-all relative z-10"
          >
            Ver Coleção
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Coupons;
