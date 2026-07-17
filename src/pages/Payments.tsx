import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Diamond,
  ShieldCheck,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { STORE } from '@/config/store';

const Payments: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data for saved cards
  const [cards, setCards] = useState([
    { id: '1', brand: 'Mastercard', last4: '8842', expiry: '12/28', primary: true, type: 'Black' },
    { id: '2', brand: 'Visa', last4: '4410', expiry: '08/26', primary: false, type: 'Infinite' }
  ]);

  const handleDelete = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    toast({
      title: "Cartão Removido",
      description: "Sua forma de pagamento foi excluída com segurança.",
    });
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
              Métodos de <span className="text-[#d4af37] italic">Pagamento</span>
              <ShieldCheck className="w-8 h-8 text-[#d4af37]" />
            </h1>
            <p className="text-white/30 text-sm font-medium">Gerencie suas formas de pagamento para uma experiência de checkout ultra-rápida.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="group relative bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 rounded-[32px] p-8 overflow-hidden transition-all duration-500 hover:border-[#d4af37]/30 hover:shadow-2xl hover:shadow-[#d4af37]/5"
            >
              {/* Chip Visual */}
              <div className="w-12 h-9 bg-gradient-to-br from-[#d4af37]/40 to-[#d4af37]/10 rounded-lg mb-8 border border-[#d4af37]/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_40%,transparent_40%,transparent_60%,#000_60%,#000_80%,transparent_80%)] bg-[length:4px_4px]"></div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Cartão {card.type}</span>
                    <h3 className="text-base sm:text-xl font-mono font-bold text-white tracking-wide sm:tracking-widest whitespace-nowrap">•••• •••• •••• {card.last4}</h3>
                  </div>
                  <div className="text-[#d4af37] font-serif italic font-bold">{card.brand}</div>
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Validade</span>
                    <p className="text-sm font-bold text-white/60">{card.expiry}</p>
                  </div>
                  <Button 
                    onClick={() => handleDelete(card.id)}
                    variant="ghost" 
                    className="p-0 h-auto text-white/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {card.primary && (
                <div className="absolute top-6 right-6">
                  <div className="px-3 py-1 rounded-full bg-[#d4af37] text-black text-[9px] font-black uppercase tracking-widest">Primário</div>
                </div>
              )}
            </div>
          ))}

          {/* Add Card Placeholder */}
          <button 
            className="group relative border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 transition-all hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#d4af37] group-hover:text-black transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Adicionar Novo Método</span>
              <span className="text-[9px] font-bold text-white/10 group-hover:text-[#d4af37]/60">Cartão de Crédito ou Débito</span>
            </div>
          </button>
        </div>

        {/* Security Badge */}
        <section className="mt-16 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-lg font-serif font-bold text-white">Segurança de Nível Bancário</h3>
            <p className="text-white/30 text-sm max-w-xl">
              Seus dados de pagamento são criptografados e processados seguindo os mais rigorosos padrões de segurança (PCI-DSS). 
              A {STORE.name} nunca armazena o número completo do seu cartão.
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/10 hidden md:block" />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Payments;
