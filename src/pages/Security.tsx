import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';

// ─── Strength meter (same pattern as Register) ───────────────────────────────

function passwordStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}
const strengthLabel = ['', 'Fraca', 'Média', 'Boa', 'Forte'];
const strengthColor  = ['', 'bg-red-500', 'bg-amber-500', 'bg-[#d4af37]', 'bg-emerald-400'];

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  id, label, error, children,
}: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
        {label}
      </label>
      <div className={`relative flex items-center rounded-xl bg-[#1b1b1b]/60 border transition-all duration-300
        focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]
        ${error ? 'border-red-500/60 focus-within:border-red-500' : 'border-white/10 focus-within:border-[#d4af37]'}`}>
        <span className="pointer-events-none absolute left-3.5 text-white/25">
          <Lock className="w-4 h-4" />
        </span>
        {children}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-[10px] text-red-400 font-medium">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Security: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [current,  setCurrent]  = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const strength = passwordStrength(newPwd);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Informe sua senha atual.';
    if (newPwd.length < 8) e.newPwd = 'Mínimo de 8 caracteres.';
    if (newPwd === current) e.newPwd = 'A nova senha deve ser diferente da atual.';
    if (newPwd !== confirm) e.confirm = 'As senhas não coincidem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: current,
      });
      if (signInError) {
        setErrors({ current: 'Senha atual incorreta.' });
        return;
      }
      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;

      setSuccess(true);
      setCurrent(''); setNewPwd(''); setConfirm('');
      toast.success('Senha atualizada com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar senha.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    await signOut();
    toast.success('Todas as sessões foram encerradas.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.025] blur-[120px]" />
      </div>

      <Header />

      <main className="relative z-10 max-w-xl mx-auto px-6 pt-28 pb-20">

        {/* Back */}
        <Link
          to="/perfil"
          className="inline-flex items-center gap-2 text-white/30 hover:text-[#d4af37] transition-colors mb-8 group
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar ao Perfil
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">Segurança da Conta</h1>
            <p className="text-xs text-white/30 mt-0.5">Gerencie sua senha e acesso</p>
          </div>
        </div>

        {/* Success state */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-400">Senha atualizada!</p>
              <p className="text-xs text-emerald-400/60">Use a nova senha no próximo acesso.</p>
            </div>
          </div>
        )}

        {/* Change password card */}
        <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 mb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-5">Alterar Senha</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Senha atual */}
            <Field id="current" label="Senha atual" error={errors.current}>
              <input
                id="current" type={showCur ? 'text' : 'password'}
                autoComplete="current-password" placeholder="••••••••"
                value={current} onChange={e => { setCurrent(e.target.value); setErrors(p => ({ ...p, current: '' })); }}
                aria-invalid={!!errors.current}
                className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
              />
              <button type="button" onClick={() => setShowCur(v => !v)} aria-label={showCur ? 'Esconder' : 'Mostrar'}
                className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#d4af37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            {/* Nova senha */}
            <Field id="newPwd" label="Nova senha" error={errors.newPwd}>
              <input
                id="newPwd" type={showNew ? 'text' : 'password'}
                autoComplete="new-password" placeholder="Mín. 8 caracteres"
                value={newPwd} onChange={e => { setNewPwd(e.target.value); setErrors(p => ({ ...p, newPwd: '' })); }}
                aria-invalid={!!errors.newPwd}
                aria-describedby="strength-indicator"
                className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} aria-label={showNew ? 'Esconder' : 'Mostrar'}
                className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#d4af37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            {/* Strength meter */}
            {newPwd.length > 0 && (
              <div id="strength-indicator" aria-live="polite" className="-mt-1 px-0.5">
                <div className="flex gap-1.5 mb-1">
                  {[0,1,2,3].map(i => (
                    <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300
                      ${i < strength ? strengthColor[strength] : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className="text-[10px] text-white/30">
                  Força: <span className="font-bold text-white/50">{strengthLabel[strength]}</span>
                </p>
              </div>
            )}

            {/* Confirmar nova senha */}
            <Field id="confirm" label="Confirmar nova senha" error={errors.confirm}>
              <input
                id="confirm" type={showCon ? 'text' : 'password'}
                autoComplete="new-password" placeholder="Repita a nova senha"
                value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                aria-invalid={!!errors.confirm}
                className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
              />
              <button type="button" onClick={() => setShowCon(v => !v)} aria-label={showCon ? 'Esconder' : 'Mostrar'}
                className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25 hover:text-[#d4af37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">
                {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            <button type="submit" disabled={loading}
              className="w-full mt-2 rounded-full bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                py-3.5 shadow-[0_8px_32px_-8px_rgba(212,175,55,0.4)]
                hover:bg-[#f2ca50] active:scale-[0.99] transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Atualizando...
                </span>
              ) : 'Atualizar Senha'}
            </button>
          </form>
        </div>

        {/* Danger zone — revogar sessões */}
        <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-red-500/10 rounded-2xl p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-red-400/60 mb-1">Zona de Risco</h2>
          <p className="text-xs text-white/30 mb-4 leading-relaxed">
            Encerra todas as sessões ativas em todos os dispositivos. Você precisará fazer login novamente.
          </p>
          <button
            onClick={handleRevokeAllSessions}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/20 text-red-400/70
              hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Encerrar todas as sessões
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Security;
