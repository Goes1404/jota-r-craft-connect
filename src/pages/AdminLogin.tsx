import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Falha na Autenticação",
          description: error.message || "Email ou senha incorretos.",
        });
      } else {
        toast({
          title: "Acesso Concedido",
          description: "Bem-vindo de volta.",
        });
        // Here we need to check the user role from supabase
        // Since we don't have the user object yet, we let useEffect handle the redirect!
        // The user object will be updated in the AuthContext.
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer login. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f2ca50]"></div>
      </div>
    );
  }

  if (user) {
    const isAdmin = user.user_metadata?.role === 'admin';
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/perfil"} replace />;
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <main className="min-h-screen flex flex-col md:flex-row">
        {/* Left Side - Luxury Image */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-black">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 to-transparent"></div>
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeLHo5Ehx9q9FpW9v8-7eIJ67f8FyyHA4yhMlNI4KmanKguIwHrvRfMIAwENgZYtZl9mGx9BVObyWxmYhZTQtLHBgurk0nXWG_GFRMMCcBXJH0rvU2PF5IoieUSXoEm9ZWXbyQY7WHxi-0YOFAs3ImqlxhoZ-ZoelM5Rn0oWvcMAtKeN9KW82CmG9H9nF_knHUp42sB18coKUKeYeNbpvTVTu3U3lxy05CGPu5dTF460FMH9vk6u7w9gZFUwjq880DUaRogtWedEg" 
            alt="Luxury Watch Background"
          />
          <div className="relative z-20 flex flex-col justify-end p-12 h-full">
            <h2 className="font-serif text-5xl font-bold text-[#d4af37] mb-4 leading-tight">Excelência em cada segundo.</h2>
            <p className="text-lg text-white/60 max-w-md">Acesse sua coleção exclusiva de peças atemporais e acessórios de luxo em edição limitada.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative">
          <Link to="/" className="absolute top-8 left-8 text-white/40 hover:text-[#f2ca50] transition-colors flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs uppercase tracking-widest font-semibold">Voltar ao Início</span>
          </Link>

          <div className="w-full max-w-md">
            <div className="mb-12 text-center md:text-left">
              <span className="font-serif text-2xl font-light tracking-[0.3em] text-[#d4af37]">JR ACESSÓRIOS</span>
            </div>

            <div className="mb-10">
              <h1 className="font-serif text-3xl font-semibold text-white mb-2">Bem-vindo de volta</h1>
              <p className="text-white/40">Por favor, insira suas credenciais para acessar o painel administrativo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30" htmlFor="email">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#f2ca50] transition-colors" />
                  <input 
                    className="w-full bg-transparent border-b border-white/10 focus:border-[#f2ca50] focus:ring-0 transition-all py-3 px-8 text-white placeholder:text-white/10 outline-none" 
                    id="email" 
                    name="email" 
                    placeholder="admin@jr-acessorios.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30" htmlFor="password">Senha</label>
                  <button type="button" className="text-[10px] text-[#d4af37] font-bold hover:text-[#f2ca50] transition-colors uppercase tracking-widest">Esqueceu a senha?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#f2ca50] transition-colors" />
                  <input 
                    className="w-full bg-transparent border-b border-white/10 focus:border-[#f2ca50] focus:ring-0 transition-all py-3 px-8 text-white placeholder:text-white/10 outline-none" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                disabled={isLoading}
                className="w-full bg-[#f2ca50] text-[#3c2f00] font-bold py-4 rounded-sm uppercase tracking-[0.2em] text-xs transition-all hover:bg-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
              >
                {isLoading ? 'Autenticando...' : 'Entrar no Painel'}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                <span className="bg-[#131313] px-4 text-white/20">
                  {window.location.pathname.includes('/admin') ? 'Identidade Administrativa' : 'Acesso Cliente'}
                </span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-white/30 text-xs">
                {window.location.pathname.includes('/admin') 
                  ? 'Exclusivo para administradores JR Acessórios.' 
                  : 'Acesse para ver seus pedidos e benefícios.'}
              </p>
              <p className="text-white/30 text-xs">
                Novo por aqui? 
                <Link to="/register" className="text-[#d4af37] hover:text-[#f2ca50] font-bold ml-2 uppercase tracking-widest">Solicite acesso</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-black/50 border-t border-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-sm font-serif font-bold text-[#d4af37] tracking-[0.3em]">JR ACESSÓRIOS</span>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/20">© 2024 JR ACESSÓRIOS. LUXO DEFINIDO.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {['Privacidade', 'Segurança', 'Termos', 'Suporte'].map((item) => (
            <button key={item} className="text-[9px] tracking-[0.2em] uppercase text-white/20 hover:text-white transition-colors duration-300">
              {item}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;