import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, MessageCircle, Diamond, ArrowRight, Instagram } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { INSTAGRAM_URL, WHATSAPP_LINK, WHATSAPP_NUMBER } from '@/config/constants';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Contact: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('contact');
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const whatsappMessage = encodeURIComponent(
      `Olá! Meu nome é ${data.name}.
      
📧 Email: ${data.email}
📱 Telefone: ${data.phone}

📝 Mensagem: ${data.message}`
    );

    const whatsappURL = `${WHATSAPP_LINK}?text=${whatsappMessage}`;
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: "Sua solicitação premium está sendo processada.",
    });

    window.open(whatsappURL, '_blank');
    reset();
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[150px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header Section */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 font-bold text-[10px] uppercase tracking-[0.3em] text-[#d4af37] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Diamond className="w-3 h-3 fill-[#d4af37]" />
              Atendimento Exclusivo
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Estamos à sua <span className="text-[#d4af37] italic">disposição.</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Seja para uma consultoria técnica ou para adquirir uma peça exclusiva, nossa equipe está pronta para oferecer um suporte de excelência.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            {/* Contact Information Side */}
            <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
              <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 hover:border-[#d4af37]/20 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">WhatsApp</h3>
                    <p className="text-lg font-serif font-bold text-white">{WHATSAPP_NUMBER}</p>
                  </div>
                </div>
                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full py-4 px-6 rounded-xl bg-primary text-black font-bold text-[10px] uppercase tracking-widest hover:bg-[#f2ca50] transition-all"
                >
                  Iniciar Conversa
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 hover:border-[#d4af37]/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Email</h3>
                    <p className="text-lg font-serif font-bold text-white">contato@jr-acessorios.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 hover:border-[#d4af37]/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Horário</h3>
                    <p className="text-sm font-medium text-white/80">Seg — Sex: 9h às 18h</p>
                    <p className="text-sm font-medium text-white/80">Sáb: 9h às 14h</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 hover:border-[#d4af37]/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Showroom</h3>
                    <p className="text-sm font-medium text-white/80">Rua Martim Afonso, 431</p>
                    <p className="text-sm font-medium text-white/40 italic">Piratininga, Osasco — SP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-400">
              <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[100px]"></div>
                
                <h2 className="font-serif text-3xl font-bold text-white mb-2">Envie sua Mensagem</h2>
                <p className="text-white/30 text-sm mb-12 uppercase tracking-[0.2em] font-bold">SOLICITAÇÃO DE ATENDIMENTO PREMIUM</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Nome Completo</label>
                      <input 
                        {...register('name', { required: 'O nome é essencial' })}
                        className="w-full bg-transparent border-b border-white/10 focus:border-[#d4af37] py-3 text-white placeholder:text-white/10 transition-all outline-none"
                        placeholder="Como podemos chamá-lo?"
                      />
                      {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Email</label>
                      <input 
                        {...register('email', { required: 'O email é essencial' })}
                        type="email"
                        className="w-full bg-transparent border-b border-white/10 focus:border-[#d4af37] py-3 text-white placeholder:text-white/10 transition-all outline-none"
                        placeholder="seu@email.com"
                      />
                      {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">WhatsApp para Contato</label>
                    <input 
                      {...register('phone', { required: 'O contato é essencial' })}
                      className="w-full bg-transparent border-b border-white/10 focus:border-[#d4af37] py-3 text-white placeholder:text-white/10 transition-all outline-none"
                      placeholder="(11) 99999-9999"
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">Mensagem ou Solicitação</label>
                    <textarea 
                      {...register('message', { required: 'Conte-nos sua necessidade' })}
                      rows={5}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-white placeholder:text-white/10 focus:border-[#d4af37]/40 transition-all outline-none resize-none"
                      placeholder="Descreva aqui o produto de interesse ou sua dúvida..."
                    />
                    {errors.message && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.message.message}</p>}
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full md:w-fit px-12 py-5 bg-[#d4af37] text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-[#f2ca50] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
                    type="submit"
                  >
                    {isSubmitting ? 'PROCESSANDO...' : 'ENVIAR SOLICITAÇÃO'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Luxury FAQ Section */}
          <div className="mt-40">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold text-white mb-4">Dúvidas Comuns</h2>
              <div className="w-16 h-1 bg-[#d4af37] mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { q: 'Como adquirir?', a: 'Navegue pela nossa seleção, adicione ao seu vault e finalize o atendimento via WhatsApp para uma consultoria personalizada de pagamento.' },
                { q: 'Prazo de entrega?', a: 'Produtos em estoque são enviados em até 24h. O prazo final varia de 2 a 7 dias úteis com seguro total da mercadoria.' },
                { q: 'É original?', a: 'Absolutamente. Todos os nossos produtos acompanham certificação de autenticidade, nota fiscal e garantia oficial do fabricante.' }
              ].map((faq, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-[#0f0f0f]/40 border border-white/5 hover:border-[#d4af37]/10 transition-all">
                  <h3 className="font-serif text-xl font-bold text-white mb-4">{faq.q}</h3>
                  <p className="text-sm text-white/30 leading-relaxed font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;