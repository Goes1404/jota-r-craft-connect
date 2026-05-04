import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

function passwordStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const strengthLabel = ['', 'Fraca', 'Média', 'Boa', 'Forte'];
const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-[#d4af37]', 'bg-emerald-400'];
const strengthTextColor = ['', 'text-red-400', 'text-amber-400', 'text-[#d4af37]', 'text-emerald-400'];

const TIPS = [
  'Use pelo menos 8 caracteres',
  'Inclua letras maiúsculas e minúsculas',
  'Adicione números e símbolos (!@#$%)',
  'Evite senhas óbvias como "123456"',
];

const Seguranca: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A nova senha deve ter pelo menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'Confirme sua nova senha corretamente.' });
      return;
    }
    if (strength < 2) {
      toast({ variant: 'destructive', title: 'Senha muito fraca', description: 'Use uma combinação de letras, números e símbolos.' });
      return;
    }

    setIsLoading(true);
    try {
      // First, verify current password by re-authenticating
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) {
          toast({ variant: 'destructive', title: 'Senha atual incorreta', description: 'Verifique sua senha atual e tente novamente.' });
          setIsLoading(false);
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar senha', description: error.message });
      } else {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({ title: 'Senha atualizada! 🔐', description: 'Sua nova senha está ativa. Guarde-a em local seguro.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/40">Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e2e2e2] font-sans">
      <SEO
        title="Segurança da Conta — JR Acessórios"
        description="Altere sua senha e gerencie a segurança da sua conta JR Acessórios."
      />
      <Header />

      <main className="pt-28 pb-32">
        <div className="max-w-2xl mx-auto px-6">
          {/* Back navigation */}
          <Link
            to="/perfil"
            className="inline-flex items-center gap-2 text-white/30 hover:text-[#D4AF37] transition-colors text-xs font-bold uppercase tracking-widest mb-8 group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Voltar ao Perfil
          </Link>

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-black text-white">Segurança da Conta</h1>
                <p className="text-white/30 text-sm mt-0.5">{user.email}</p>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Mantenha sua conta segura alterando sua senha periodicamente. Recomendamos trocas a cada 3 meses.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 md:p-8">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#D4AF37] mb-6">Alterar Senha</h2>

                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20 mb-6"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-400 font-medium">Senha atualizada com sucesso!</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Current password */}
                  <div className="space-y-1.5">
                    <label htmlFor="current-password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Senha Atual
                    </label>
                    <div className="relative flex items-center rounded-xl bg-[#1b1b1b]/60 border border-white/10 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                      <Lock className="absolute left-3.5 w-4 h-4 text-white/20 pointer-events-none" />
                      <input
                        id="current-password"
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Sua senha atual"
                        autoComplete="current-password"
                        required
                        className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(v => !v)}
                        aria-label={showCurrent ? 'Esconder senha' : 'Mostrar senha'}
                        className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#D4AF37] transition-colors"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors underline underline-offset-2">
                        Esqueci minha senha
                      </Link>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/5" />
                    </div>
                    <span className="relative mx-auto block w-fit bg-[#0f0f0f] px-4 text-[9px] uppercase tracking-widest text-white/15">
                      nova senha
                    </span>
                  </div>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Nova Senha
                    </label>
                    <div className="relative flex items-center rounded-xl bg-[#1b1b1b]/60 border border-white/10 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                      <Lock className="absolute left-3.5 w-4 h-4 text-white/20 pointer-events-none" />
                      <input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Mín. 8 caracteres"
                        autoComplete="new-password"
                        required
                        className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        aria-label={showNew ? 'Esconder senha' : 'Mostrar senha'}
                        className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#D4AF37] transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {newPassword.length > 0 && (
                      <div className="pt-1">
                        <div className="flex gap-1.5 mb-1.5">
                          {[0, 1, 2, 3].map(i => (
                            <span
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < strength ? strengthColor[strength] : 'bg-white/10'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-bold ${strengthTextColor[strength]}`}>
                          Força: {strengthLabel[strength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative flex items-center rounded-xl bg-[#1b1b1b]/60 border border-white/10 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                      <Lock className="absolute left-3.5 w-4 h-4 text-white/20 pointer-events-none" />
                      <input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                        required
                        className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        aria-label={showConfirm ? 'Esconder senha' : 'Mostrar senha'}
                        className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#D4AF37] transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> As senhas não coincidem
                      </p>
                    )}
                    {confirmPassword.length > 0 && newPassword === confirmPassword && confirmPassword.length >= 8 && (
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> As senhas coincidem
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full mt-2 py-4 rounded-full bg-[#D4AF37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                      shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)]
                      hover:bg-[#f2ca50] hover:shadow-[0_12px_40px_-8px_rgba(242,202,80,0.5)]
                      transition-all duration-200
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#D4AF37] disabled:shadow-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Atualizando...
                      </span>
                    ) : (
                      'Atualizar Senha'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Tips sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Tips */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4">Dicas de Segurança</h3>
                <ul className="space-y-3">
                  {TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]/50 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security info */}
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#D4AF37]" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Proteção Ativa</p>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">
                  Suas senhas são armazenadas com criptografia de ponta através do Supabase Auth. Nunca temos acesso à sua senha em texto puro.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Seguranca;
