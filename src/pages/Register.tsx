import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, User, Lock, Phone, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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
        <p id={`${id}-error`} role="alert" className="text-[10px] text-red-400 font-medium pl-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

const Register: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const strength = passwordStrength(form.password);

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (form.name.trim().length < 2) e.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Informe um telefone válido.';
    if (form.password.length < 8) e.password = 'Mínimo de 8 caracteres.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'As senhas não coincidem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !accepted) return;
    setIsLoading(true);
    try {
      const { error } = await signUp(form.email, form.password, {
        full_name: form.name,
        role: 'client',
        phone: form.phone,
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar conta', description: error.message });
      } else {
        toast({
          title: 'Conta criada! ✨',
          description: 'Verifique seu e-mail para confirmar o cadastro.',
        });
        navigate('/login');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#f2ca50] opacity-[0.04] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[150px]" />
      </div>

      <main className="relative z-10 min-h-screen grid lg:grid-cols-2">

        {/* ── Lado esquerdo: Branding ── */}
        <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-white/5 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.12),transparent_65%)]">
          <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded">
            <span className="font-serif text-2xl font-light tracking-widest text-white">JR</span>
            <span className="font-serif italic text-2xl text-[#d4af37]">acessorios</span>
          </Link>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl xl:text-5xl font-bold leading-[1.05] text-white">
                Junte-se à{' '}
                <span className="italic text-[#d4af37]">elite</span>
                <br />da tecnologia premium.
              </h2>
              <p className="text-white/40 max-w-md text-base leading-relaxed">
                Curadoria digital com IA, atendimento exclusivo e entrega no mesmo dia em Osasco/SP.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                'Ofertas exclusivas para cadastrados',
                'Frete grátis acima de R$ 500',
                'Garantia total · Troca em 7 dias',
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/60">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
                    <Check className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['Rafaela', 'Carlos', 'Marcos'].map((seed) => (
                  <img
                    key={seed}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                    alt={seed}
                    className="w-9 h-9 rounded-full border-2 border-black bg-[#1a1a1a]"
                  />
                ))}
              </div>
              <p className="text-xs text-white/30">
                <span className="text-white font-bold">+500 clientes</span> já fazem parte
              </p>
            </div>
          </div>

          <p className="text-xs text-white/15 tracking-widest uppercase">© 2025 JR Acessórios</p>
        </aside>

        {/* ── Lado direito: Formulário ── */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">

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
                <span className="font-serif text-lg text-white">JR</span>
                <span className="font-serif italic text-lg text-[#d4af37]">acessorios</span>
              </Link>
            </div>

            <header className="mb-8">
              <h1 className="font-serif text-3xl font-semibold text-white leading-tight">
                Crie sua conta
              </h1>
              <p className="mt-2 text-sm text-white/30">
                Leva menos de 30 segundos. Sem spam, prometido.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Nome */}
              <Field id="name" label="Nome Completo" icon={<User className="w-4 h-4" />} error={errors.name}>
                <input
                  id="name" name="name" type="text" autoComplete="name"
                  placeholder="Seu nome completo"
                  value={form.name} onChange={handleChange('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
              </Field>

              {/* E-mail */}
              <Field id="email" label="E-mail" icon={<Mail className="w-4 h-4" />} error={errors.email}>
                <input
                  id="email" name="email" type="email" autoComplete="email" inputMode="email"
                  placeholder="voce@email.com"
                  value={form.email} onChange={handleChange('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
              </Field>

              {/* WhatsApp */}
              <Field id="phone" label="WhatsApp / Telefone" icon={<Phone className="w-4 h-4" />} error={errors.phone}>
                <input
                  id="phone" name="phone" type="tel" autoComplete="tel" inputMode="numeric"
                  placeholder="(11) 99999-9999"
                  value={form.phone} onChange={handleChange('phone')}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
              </Field>

              {/* Senha */}
              <Field id="password" label="Senha" icon={<Lock className="w-4 h-4" />} error={errors.password}>
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mín. 8 caracteres"
                  value={form.password} onChange={handleChange('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : 'password-strength'}
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

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div id="password-strength" aria-live="polite" className="-mt-1 px-0.5">
                  <div className="flex gap-1.5 mb-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i < strength ? strengthColor[strength] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30">
                    Força da senha: <span className="font-bold text-white/50">{strengthLabel[strength]}</span>
                  </p>
                </div>
              )}

              {/* Confirmar Senha */}
              <Field id="confirmPassword" label="Confirmar Senha" icon={<Lock className="w-4 h-4" />} error={errors.confirmPassword}>
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-12 py-3 text-white placeholder:text-white/15 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Esconder confirmação' : 'Mostrar confirmação'}
                  aria-pressed={showConfirm}
                  className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-white/25
                    hover:text-[#d4af37] hover:bg-white/5 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>

              {/* Termos */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent accent-[#d4af37]
                    focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                />
                <span className="text-xs text-white/30 leading-relaxed">
                  Li e concordo com os{' '}
                  <Link to="/termos" className="text-[#d4af37] hover:text-[#f2ca50] underline underline-offset-2 transition-colors">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacidade" className="text-[#d4af37] hover:text-[#f2ca50] underline underline-offset-2 transition-colors">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !accepted}
                className="w-full mt-2 rounded-full bg-[#d4af37] text-black font-black text-[11px] uppercase tracking-[0.2em]
                  py-4 shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)]
                  hover:bg-[#f2ca50] hover:shadow-[0_12px_40px_-8px_rgba(242,202,80,0.5)]
                  active:scale-[0.99] transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#d4af37]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando sua conta...
                  </span>
                ) : (
                  'Criar Conta Exclusiva'
                )}
              </button>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <span className="relative mx-auto block w-fit bg-black px-4 text-[9px] uppercase tracking-[0.2em] text-white/20">
                  ou continue com
                </span>
              </div>

              {/* Social login (UI only — não implementado) */}
              <div className="grid grid-cols-2 gap-3">
                {['Google', 'Apple'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    disabled
                    className="flex items-center justify-center gap-2 py-3 rounded-xl
                      bg-white/[0.03] border border-white/5 text-white/25
                      text-[9px] font-bold uppercase tracking-widest
                      disabled:cursor-not-allowed"
                  >
                    {provider}
                  </button>
                ))}
              </div>

              {/* Login link */}
              <p className="text-center text-xs text-white/30">
                Já tem conta?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#d4af37] hover:text-[#f2ca50] uppercase tracking-widest transition-colors underline-offset-4 hover:underline"
                >
                  Entrar agora →
                </Link>
              </p>

            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;
