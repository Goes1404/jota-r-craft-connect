import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, { full_name: name, role: 'client', phone: phone });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: error.message,
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar o cadastro.",
        });
        navigate('/login');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#f2ca50] opacity-[0.04] blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full bg-[#f2ca50] opacity-[0.03] blur-[150px]"></div>
      </div>

      <main className="w-full max-w-[1280px] px-8 py-12 flex flex-col md:flex-row gap-16 items-center justify-center relative z-10">
        {/* Brand Visual Side */}
        <div className="hidden md:flex md:w-1/2 flex-col space-y-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-[#f2ca50]/20 blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              alt="Luxury watch and gold rings" 
              className="relative w-full aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 rounded-lg shadow-2xl opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKlX6h-inb4JJ3njwOeX1MJO0Zv_nyiF8RbWwLC92lth9H0mAMpo7UKhDzV-Uv5BObiGLSzF02mEwDrq62otVqIUPwNQcLAWG992_hFg6DrWRJxvwxTKG6HurU9IxYco8M-huA_0yleK6y2RYJCvf3QGBtR2a0E0R8ogVIg9z4FHaDcr3RYE97dUz-Pns1tBBtUWChbSuohTnMO6ICjlDXq_j4rM0Dq9Bi15MdkvNlkPMCuKxW-jaqrgVZEFC-crdi2JKXQnWVnvs" 
            />
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-5xl font-bold text-[#d4af37] italic leading-tight">Exclusividade em cada detalhe.</h2>
            <p className="text-lg text-white/40 max-w-md">Descubra uma curadoria única de acessórios que definem o seu estilo com a precisão e elegância que você merece.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-[500px] flex flex-col items-center bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 p-8 md:p-12 rounded-3xl shadow-2xl relative">
          <Link to="/admin/login" className="absolute top-8 left-8 text-white/20 hover:text-[#f2ca50] transition-colors flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Voltar</span>
          </Link>

          <div className="mb-12 text-center">
            <div className="text-[#f2ca50] font-serif text-5xl mb-4 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(242,202,80,0.3)]">JR</div>
            <h1 className="font-serif text-2xl font-semibold text-white">Junte-se à Experiência</h1>
            <p className="text-white/30 mt-2 text-[10px] uppercase tracking-[0.2em] font-bold">CADASTRE-SE PARA ACESSO EXCLUSIVO</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest" htmlFor="name">Nome Completo</label>
              <div className="bg-[#1b1b1b]/50 border border-[#d4af37]/20 focus-within:border-[#d4af37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 rounded-lg overflow-hidden">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/10 py-3 px-4 outline-none" 
                  id="name" 
                  name="name" 
                  placeholder="Seu nome" 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest" htmlFor="email">E-mail</label>
              <div className="bg-[#1b1b1b]/50 border border-[#d4af37]/20 focus-within:border-[#d4af37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 rounded-lg overflow-hidden">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/10 py-3 px-4 outline-none" 
                  id="email" 
                  name="email" 
                  placeholder="seu@email.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest" htmlFor="phone">WhatsApp / Telefone</label>
              <div className="bg-[#1b1b1b]/50 border border-[#d4af37]/20 focus-within:border-[#d4af37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 rounded-lg overflow-hidden">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/10 py-3 px-4 outline-none" 
                  id="phone" 
                  name="phone" 
                  placeholder="(11) 99999-9999" 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest" htmlFor="password">Senha</label>
              <div className="bg-[#1b1b1b]/50 border border-[#d4af37]/20 focus-within:border-[#d4af37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 rounded-lg overflow-hidden">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/10 py-3 px-4 outline-none" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest" htmlFor="confirm_password">Confirmar Senha</label>
              <div className="bg-[#1b1b1b]/50 border border-[#d4af37]/20 focus-within:border-[#d4af37] focus-within:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 rounded-lg overflow-hidden">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/10 py-3 px-4 outline-none" 
                  id="confirm_password" 
                  name="confirm_password" 
                  placeholder="••••••••" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={isLoading}
              className="w-full bg-[#d4af37] text-black py-4 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-[#f2ca50] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-[0.98] mt-4 disabled:opacity-50" 
              type="submit"
            >
              {isLoading ? 'PROCESSANDO...' : 'CRIAR CONTA EXCLUSIVA'}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center my-10 gap-4">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">OU CONTINUE COM</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          {/* Social Login */}
          <div className="w-full grid grid-cols-2 gap-4 mb-10">
            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 py-3 rounded-lg hover:bg-white/10 transition-all group">
              <img 
                alt="Google" 
                className="w-4 h-4 grayscale opacity-50 group-hover:opacity-100 transition-opacity" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdYy-ahw4esC7h5Dkki8nQGd16ZogjdmKeOSpq9wpmBTbgASLI_aDPJ422XCR9zecI3hPyMKGJRjZr8jy7ZTU54ZzIEhFoitIGUuUpL5xnxwKv6Y33Vs0F1QVFGuf_g50VBpghMaTPF49rgQGu70TFa-CZA63B66zvtlhb5wMlk4MGQc8CMqzAJezKCgCHonxGTXbGk5k2SgIWKrtoTPAV5rXiX7pmk3-UmISnlhN8ByeDhaX8rRUDkrYztLT0G0hyU9OSJrNkNUg" 
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">GOOGLE</span>
            </button>
            <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 py-3 rounded-lg hover:bg-white/10 transition-all group">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">APPLE</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-white/30 text-xs">
              Já possui uma conta? 
              <Link to="/login" className="text-[#d4af37] hover:text-[#f2ca50] hover:underline underline-offset-8 transition-all font-bold ml-2 uppercase tracking-widest">Entre aqui</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Aesthetic */}
      <footer className="mt-auto py-8 w-full text-center opacity-20">
        <p className="text-[9px] tracking-[0.3em] uppercase">JR Acessórios — Pure Luxury Lifestyle</p>
      </footer>
    </div>
  );
};

export default Register;
