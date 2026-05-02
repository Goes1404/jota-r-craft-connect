import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  Package, 
  BrainCircuit,
  Loader2,
  Maximize2,
  Minimize2,
  Gift,
  Search,
  MessageCircle,
  Diamond
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AICopilot: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const isAdmin = user?.user_metadata?.role === 'admin';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize personality based on role
  useEffect(() => {
    if (messages.length === 0) {
      if (isAdmin) {
        setMessages([
          { role: 'assistant', content: 'Bem-vindo ao centro de comando, **Administrador**. Sou o Lumina Executive AI. Posso analisar suas métricas de venda, sugerir melhorias de SEO para produtos ou ajudar com a logística. Como vamos escalar hoje?' }
        ]);
      } else {
        setMessages([
          { role: 'assistant', content: 'Olá! Sou a **Lumina**, sua concierge digital. Estou aqui para ajudar você a encontrar o produto perfeito ou tirar qualquer dúvida sobre nossa coleção exclusiva. Como posso tornar sua experiência memorável?' }
        ]);
      }
    }
  }, [isAdmin, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: userMessage,
          history: messages.slice(-6),
          context: {
            role: isAdmin ? 'admin' : 'customer',
            page: location.pathname,
            userName: user?.user_metadata?.full_name || user?.email,
          }
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Desculpe, tive um problema ao processar sua solicitação.' }]);
    } catch (err: any) {
      console.error('AI Error:', err);
      toast.error('Erro na conexão com Lumina AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = isAdmin ? [
    { icon: TrendingUp, label: 'Analisar Vendas' },
    { icon: Package, label: 'Sugestão de Estoque' },
    { icon: BrainCircuit, label: 'Dicas de SEO' }
  ] : [
    { icon: Gift, label: 'Ideia para Presente' },
    { icon: Search, label: 'Mais Vendidos' },
    { icon: MessageCircle, label: 'Dúvida sobre Frete' }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-[#0a0a0a] border border-[#d4af37]/40 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.2)] flex items-center justify-center group hover:scale-110 transition-all duration-500 hover:border-[#d4af37]"
      >
        <Sparkles className="w-8 h-8 text-[#d4af37] group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-2 -right-2 bg-[#d4af37] text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(212,175,55,0.5)]">Lumina</div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 z-[100] w-[380px] md:w-[420px] flex flex-col transition-all duration-500 ${isMinimized ? 'h-20' : 'h-[600px] max-h-[80vh]'} bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300`}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#d4af37]/10 to-transparent border-b border-white/5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 opacity-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#f2ca50] flex items-center justify-center shadow-lg">
            <Diamond className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-black text-white uppercase tracking-widest">{isAdmin ? 'Lumina Executive' : 'Lumina Concierge'}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] font-bold text-[#d4af37] uppercase tracking-[0.2em]">{isAdmin ? 'Comando Ativo' : 'Online para você'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-10">
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-white/20 hover:text-white p-2 transition-colors">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-red-400 p-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-[#d4af37]/10 border-[#d4af37]/20 text-[#d4af37]'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-5 rounded-[24px] text-[11px] leading-relaxed font-medium ${msg.role === 'user' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/10' : 'bg-white/[0.03] text-white/80 border border-white/5 shadow-inner'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-4 items-center bg-white/[0.03] p-5 rounded-[24px] border border-white/5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-8 py-4 flex gap-3 overflow-x-auto scrollbar-hide border-t border-white/5 bg-black/20">
            {quickActions.map((action, i) => (
              <button 
                key={i} 
                onClick={() => setInput(action.label)}
                className="whitespace-nowrap px-4 py-2 bg-white/[0.05] hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all text-white/60 hover:text-[#d4af37]"
              >
                <action.icon className="w-3 h-3 inline-block mr-2" />
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-8 border-t border-white/5 bg-[#050505]">
            <div className="relative group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isAdmin ? "Comando estratégico..." : "Sua dúvida ou desejo..."}
                className="w-full bg-white/[0.03] border border-white/10 h-16 rounded-2xl pl-6 pr-16 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#d4af37]/40 focus:bg-white/[0.05] transition-all"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-3 w-10 h-10 bg-[#d4af37] hover:bg-[#f2ca50] disabled:bg-white/10 disabled:text-white/20 text-black rounded-xl flex items-center justify-center transition-all shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-20">
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white">Lumina Neural Protocol</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
