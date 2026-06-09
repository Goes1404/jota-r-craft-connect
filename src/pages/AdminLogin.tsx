import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation';
import { STORE } from '@/config/store';

// ─── Subcomponente: Field ─────────────────────────────────────────────────────

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-xl bg-[#1b1b1b]/60 border transition-all duration-300
          focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]
          ${error
            ? 'border-red-500/60 focus-within:border-red-500'
            : 'border-white/10 focus-within:border-[#d4af37]'
          }`}
      >
        <span className="pointer-events-none absolute left-3.5 text-white/25 flex items-center">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[10px] text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      const isAdmin = user.user_metadata?.role === 'admin';
      navigate(isAdmin ? '/admin/dashboard' : '/perfil');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Informe um e-mail válido.');
      return;
    }
    setEmailError('');
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Falha na autenticação',
          description: 'E-mail ou senha incorretos.',
        });
      } else {
        toast({ title: 'Bem-vindo de volta! ✨' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    const isAdmin = user.user_metadata?.role === 'admin';
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/perfil'} replace />;
  }

  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-[#f2ca50] opacity-[0.04] blur-[120px]" />
        <div className="absolute top-[50%] -left-[10%] w-[40%] h-[60%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[140px]" />
      </div>

      <main className="relative z-10 min-h-screen grid lg:grid-cols-2">

        {/* ── Lado esquerdo: Imagem / Branding ── */}
        <aside className="hidden lg:flex flex-col justify-between p-12 overflow-hidden relative border-r border-white/5">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center brightness-[0.35]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" aria-hidden="true" />

          <Link to="/" className="relative z-10 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded w-fit">
            <span className="font-serif text-2xl font-light tracking-widest text-white">JR</span>
            <span className="font-serif italic text-2xl text-[#d4af37]">acessorios</span>
          </Link>

          <div className="relative z-10 space-y-4">
            <h2 className="font-serif text-4xl xl:text-5xl font-bold text-white leading-tight">
              Excelência em<br />
              <span className="italic text-[#d4af37]">cada segundo.</span>
            </h2>
            <p className="text-white/50 max-w-md text-base leading-relaxed">
              Acesse sua coleção exclusiva de acessórios premium com curadoria digital e IA.
            </p>
          </div>

          <p className="relative z-10 text-xs text-white/15 tracking-widest uppercase">© {new Date().getFullYear()} {STORE.name}</p>
        </aside>

        {/* ── Lado direito: Formulário ── */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <SmokeBackground smokeColor="#d4af37" />
          </div>
          <div className="mx-auto w-full max-w-md relative z-10">

            {/* Back + Logo mobile */}
            <div className="flex items-center justify-between mb-10 lg:mb-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-white/30 hover:text-[#d4af37] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
              </Link>
              <Link to="/" className="lg:hidden flex items-center gap-1.5">
                <span className="font-serif text-lg text-[#d4af37]">{STORE.name}</span>
              </Link>
            </div>

            <header className="mb-8">
              <h1 className="font-serif text-3xl font-semibold text-white leading-tight">
                Bem-vindo de volta
              </h1>
              <p className="mt-2 text-sm text-white/30">
                {isAdminPath
                  ? `Acesso exclusivo para administradores ${STORE.name}.`
                  : 'Entre para ver seus pedidos e benefícios exclusivos.'}
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* E-mail */}
              <Field id="email" label="E-mail" icon={<Mail className="w-4 h-4" />} error={emailError}>
                <input
                  id="email" name="email" type="email" autoComplete="email" inputMode="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
              </Field>

              {/* Senha */}
              <Field id="password" label="Senha" icon={<Lock className="w-4 h-4" />}>
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25
                    hover:text-[#d4af37] hover:bg-white/5 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>

              {/* Esqueci senha */}
              <div className="flex justify-end -mt-1">
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]/60
                    hover:text-[#d4af37] transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded"
                >
                  Esqueci minha senha
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 rounded-full bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                  py-4 shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)]
                  hover:bg-[#f2ca50] hover:shadow-[0_12px_40px_-8px_rgba(242,202,80,0.5)]
                  active:scale-[0.99] transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <span className="relative mx-auto block w-fit bg-black px-4 text-[9px] uppercase tracking-[0.2em] text-white/20">
                  {isAdminPath ? 'Identidade Administrativa' : 'Acesso Cliente'}
                </span>
              </div>

              {/* Register link */}
              {!isAdminPath && (
                <p className="text-center text-xs text-white/30">
                  Novo por aqui?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-[#d4af37] hover:text-[#f2ca50] uppercase tracking-widest transition-colors hover:underline underline-offset-4"
                  >
                    Criar conta →
                  </Link>
                </p>
              )}

            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-white/15">{STORE.name} © {new Date().getFullYear()}</span>
        <div className="flex gap-6">
          {['Privacidade', 'Termos', 'Suporte'].map((item) => (
            <button key={item} className="text-[9px] tracking-widest uppercase text-white/15 hover:text-white/40 transition-colors">
              {item}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;
