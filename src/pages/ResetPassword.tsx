import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Diamond, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // Give it a short delay to allow Supabase to process URL fragment
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          setIsValidSession(!!delayedSession);
        }, 1500);
      }
    };

    verifySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Senha redefinida!",
        description: "Sua nova senha foi salva com sucesso.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao redefinir",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Validando sessão...</p>
        </div>
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-500 opacity-[0.03] blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md animate-luxury-in">
          <div className="bg-[#0f0f0f]/60 backdrop-blur-3xl border border-red-500/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-red-500/5 rounded-full blur-[60px]"></div>
            
            <div className="text-center mb-10 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Sessão <span className="text-red-500 italic">Inválida</span></h1>
              <p className="text-white/30 text-xs font-medium leading-relaxed">O link de redefinição de senha é inválido, expirou ou você acessou a página sem um token ativo de recuperação.</p>
            </div>

            <Button 
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              Solicitar Novo Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#d4af37] opacity-[0.05] blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-luxury-in">
        <div className="bg-[#0f0f0f]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-[60px]"></div>
          
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">Nova <span className="text-[#d4af37] italic">Senha</span></h1>
            <p className="text-white/30 text-sm font-medium">Crie uma senha forte para proteger sua conta premium.</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">Nova Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white outline-none focus:border-[#d4af37]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">Confirmar Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d4af37] transition-colors" />
                  <Input 
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white outline-none focus:border-[#d4af37]/40 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              {isLoading ? 'Redefinindo...' : 'Atualizar Senha'}
            </Button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-white/10 text-[9px] uppercase tracking-[0.3em] font-medium">Lumina Tech — Luxury Access Control</p>
      </div>
    </div>
  );
};

export default ResetPassword;
