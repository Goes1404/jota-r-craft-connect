import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle, 
  Diamond, 
  ArrowRight, 
  Send,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from '@/config/constants';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Contact: React.FC = () => {
  const { usePageVisit } = useAnalytics();
  usePageVisit('contact');
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Bem-vindo à área de atendimento exclusivo da JR Acessórios. Eu sou a Lumina, sua assistente pessoal de luxo. Como posso elevar sua experiência hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: userMessage,
          context: "Você é a Lumina, a concierge de luxo virtual da JR Acessórios. Você responde dúvidas sobre produtos Apple, capas premium, envios e a marca. Seja extremamente polida, use um tom sofisticado e responda de forma concisa. Se a pergunta for muito complexa, sugira que o cliente clique no botão 'Atendimento Humano' para falar com um consultor via WhatsApp."
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Erro no Concierge:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: 'Perdão, minha conexão com os servidores centrais sofreu uma pequena oscilação. Por favor, tente enviar novamente ou fale diretamente com um de nossos consultores.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#d4af37] opacity-[0.03] blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#d4af37] opacity-[0.02] blur-[150px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 font-bold text-[10px] uppercase tracking-[0.3em] text-[#d4af37] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Diamond className="w-3 h-3 fill-[#d4af37]" />
              Atendimento Exclusivo
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Lumina Virtual <span className="text-[#d4af37] italic">Concierge.</span>
            </h1>
            <p className="text-sm text-white/40 max-w-xl mx-auto font-bold uppercase tracking-widest leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Inteligência Artificial de ponta dedicada a resolver suas necessidades instantaneamente, 24 horas por dia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            
            {/* AI Concierge Chat Side */}
            <div className="lg:col-span-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
              <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                {/* Chat Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#f2ca50] p-[2px]">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                          <Bot className="w-6 h-6 text-[#d4af37]" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></div>
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-white leading-tight">Lumina AI</h2>
                      <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.2em]">Online e Pronta</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-white/10" />
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0 border border-[#d4af37]/20">
                          <Bot className="w-4 h-4 text-[#d4af37]" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] rounded-3xl p-4 ${
                        msg.role === 'user' 
                          ? 'bg-[#d4af37] text-black rounded-br-sm' 
                          : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-sm'
                      }`}>
                        <p className={`text-sm ${msg.role === 'user' ? 'font-medium' : 'leading-relaxed'}`}>
                          {msg.content}
                        </p>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-end gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0 border border-[#d4af37]/20">
                        <Bot className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-3xl rounded-bl-sm p-4 flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/5 bg-black/60 z-10">
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Faça sua pergunta para a Lumina..."
                      className="w-full bg-white/5 border border-white/10 rounded-full h-14 pl-6 pr-16 text-sm text-white placeholder:text-white/30 focus:border-[#d4af37]/50 focus:bg-white/10 outline-none transition-all"
                      disabled={isLoading}
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center text-black disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 transition-all hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Classic Contact Sidebar */}
            <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-400">
              <div className="bg-gradient-to-br from-[#d4af37] to-[#f2ca50] rounded-[32px] p-8 shadow-[0_0_40px_rgba(212,175,55,0.2)] text-black relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 text-black/10 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                  <MessageCircle className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-2">Atendimento Humano</h3>
                  <p className="text-2xl font-serif font-black mb-6 leading-tight">Prefere falar com um especialista?</p>
                  <a 
                    href={WHATSAPP_LINK} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full py-4 px-6 rounded-2xl bg-black text-white font-bold text-[10px] uppercase tracking-widest hover:bg-black/80 transition-all"
                  >
                    Chamar no WhatsApp
                    <ArrowRight className="w-4 h-4 text-[#d4af37]" />
                  </a>
                </div>
              </div>

              <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-[#d4af37]/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Email Corporativo</h3>
                    <p className="text-sm font-bold text-white">contato@jr-acessorios.com</p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-white/5 my-4"></div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[#d4af37]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Horário de Operação</h3>
                    <p className="text-sm font-bold text-white">Seg-Sex: 9h às 18h</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;