import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE } from '@/config/store';

const Payments: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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

        {/* Informational Panel */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 md:p-14 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center text-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <CreditCard className="w-9 h-9" />
            </div>

            <div className="space-y-4 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">Pagamento direto no checkout</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Você escolhe a forma de pagamento na hora de finalizar a compra: PIX com aprovação imediata
                e 5% OFF, ou cartão de crédito em até 10x. A {STORE.name} não armazena dados de cartão —
                cada transação é processada com segurança no momento do checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="px-5 py-2.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[10px] font-black uppercase tracking-widest">
                PIX · aprovação imediata + 5% OFF
              </span>
              <span className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest">
                Cartão · até 10x sem juros
              </span>
            </div>
          </div>
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
