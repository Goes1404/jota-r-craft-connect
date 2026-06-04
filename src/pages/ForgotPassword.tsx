import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Diamond, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar e-mail",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#d4af37] opacity-[0.05] blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-luxury-in">
        <div className="bg-[#0f0f0f]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-[60px]"></div>
          
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] mb-4">
              <Diamond className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">Recuperar <span className="text-[#d4af37] italic">Acesso</span></h1>
            <p className="text-white/30 text-sm font-medium">Insira seu e-mail para receber as instruções de redefinição.</p>
          </div>

          {!isSent ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">E-mail Cadastrado</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white outline-none focus:border-[#d4af37]/40 transition-all"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                {isLoading ? 'Processando...' : 'Enviar Link de Recuperação'}
              </Button>

              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o Login
              </Link>
            </form>
          ) : (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-xl tracking-tight">Tudo certo!</h3>
                <p className="text-white/40 text-sm">Enviamos um link de recuperação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e spam.</p>
              </div>
              <Button 
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest h-14 rounded-2xl hover:bg-white/10"
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-white/10 text-[9px] uppercase tracking-[0.3em] font-medium">JR Acessórios</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
