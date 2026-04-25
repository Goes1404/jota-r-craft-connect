import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  Tag, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Star, 
  Diamond, 
  Bell,
  User,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: totalSpent = 0 } = useQuery({
    queryKey: ['user-total-spent', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.reduce((sum, order) => sum + Number(order.total_amount), 0);
    },
    enabled: !!user,
  });

  const points = Math.floor(totalSpent * 10);
  const nextLevelPoints = 50000;
  const progress = Math.min((points / nextLevelPoints) * 100, 100);
  const pointsToNextLevel = Math.max(nextLevelPoints - points, 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const userName = user?.user_metadata?.full_name || 'Usuário Premium';
  const userEmail = user?.email || 'contato@luxo.com.br';
  const joinDate = user?.created_at ? new Date(user.created_at).getFullYear() : '2024';

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editWhatsApp, setEditWhatsApp] = useState(user?.user_metadata?.whatsapp || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: editEmail !== userEmail ? editEmail : undefined,
        data: { full_name: editName }
      });

      if (error) throw error;
      
      toast.success("Perfil Atualizado: Suas informações foram salvas.");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Carbon Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#f2ca50 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>

      <main className="max-w-3xl mx-auto px-6 py-32 flex flex-col gap-8 relative z-10">
        {/* User Header */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-[#d4af37]/40 p-1 transition-all duration-500 relative z-10 bg-black shadow-[0_0_20px_rgba(212,175,55,0.1)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] group-hover:border-[#d4af37]">
              <img 
                alt="Profile Avatar" 
                className="w-full h-full object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk58welPfgG2y5VXWC4Bes3oCzOWrlzy9915tMRm_KXVoDukA_HaI7Ier_VaHh0Hxemh9LS7--a9P5cKiHStUFlbp9iM5a0n1F8xbnB0ToaGPoax2LIMhhTC1JCwJ9PlXX6ZhYeABRDDhYdrIHJD_Us92uerKOFUJrfIL3bIBXAlYcS95uxizp8HWmd4VD6h_LNmqRo8NCcvmbnZBpROkzV4y92upAyrzloeSm1eCobwwUotwuJYDCSxTp8meZz2OkT8eB4DvnlSk" 
              />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-[#d4af37]/20 blur-2xl scale-110 opacity-30 group-hover:opacity-60 transition-opacity duration-500 z-0"></div>
          </div>
          
          <div className="flex-1 space-y-4 pt-4">
            {!isEditing ? (
              <>
                <h1 className="font-serif text-4xl font-bold text-white mb-3 tracking-tight">{userName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 font-bold text-[10px] uppercase tracking-widest text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Star className="w-3 h-3 fill-[#d4af37]" />
                    Luxury Member
                  </span>
                  <span className="text-white/30 text-xs font-medium tracking-wider">Membro desde {joinDate} • {userEmail}</span>
                </div>
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all mt-4"
                >
                  Editar Perfil
                </Button>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-6 w-full max-w-md mx-auto md:mx-0 animate-luxury-in">
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">Nome Completo</Label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-white outline-none focus:border-[#d4af37]/40"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">E-mail</Label>
                    <Input 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-white outline-none focus:border-[#d4af37]/40"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">WhatsApp</Label>
                    <Input 
                      value={editWhatsApp}
                      onChange={(e) => setEditWhatsApp(e.target.value)}
                      placeholder="+55 11 91234-5678"
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-white outline-none focus:border-[#d4af37]/40"
                    />
                  </div>
                </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">Nome Completo</Label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-white outline-none focus:border-[#d4af37]/40"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">E-mail</Label>
                    <Input 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-white outline-none focus:border-[#d4af37]/40"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-[#d4af37] text-black font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl hover:bg-[#f2ca50] transition-all"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="ghost"
                    className="bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Loyalty Card */}
        <section className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-all duration-500 hover:border-[#d4af37]/30 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[100px] group-hover:bg-[#d4af37]/10 transition-all duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex-1 w-full">
              <h2 className="text-[10px] font-bold text-[#d4af37]/60 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Diamond className="w-3 h-3" />
                Programa JR Acessórios
              </h2>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-serif text-5xl font-bold text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  {points.toLocaleString('pt-BR')}
                </span>
                <span className="text-white/40 text-sm font-medium tracking-wide">Pontos Acumulados</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                <div 
                  className="h-full bg-[#d4af37] rounded-full relative shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <p className="text-white/40 text-xs font-medium italic">
                {pointsToNextLevel > 0 
                  ? <>Faltam <span className="text-[#d4af37] font-bold">{pointsToNextLevel.toLocaleString('pt-BR')}</span> pontos para atingir o nível <span className="text-[#d4af37] font-bold">Prestige</span></>
                  : <>Você atingiu o nível máximo <span className="text-[#d4af37] font-bold">Prestige</span>!</>
                }
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 shadow-2xl group-hover:border-[#d4af37]/40 transition-all min-w-[140px]">
              <Diamond className="w-10 h-10 text-[#d4af37] mb-3 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Black Tier</span>
            </div>
          </div>
        </section>

        {/* Navigation Menu */}
        <section className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <nav className="flex flex-col">
            {[
              { icon: ShoppingBag, label: 'Meus Pedidos', sub: 'Acompanhe suas aquisições', path: '/pedidos', active: false },
              { icon: Heart, label: 'Meus Favoritos', sub: 'Sua seleção pessoal', path: '/favoritos', active: false },
              { icon: MapPin, label: 'Endereços', sub: 'Gerencie seus locais de entrega', path: '/enderecos', active: false },
              { icon: CreditCard, label: 'Pagamentos', sub: 'Suas formas de pagamento salvas', path: '/pagamentos', active: false },
              { icon: Tag, label: 'Benefícios', sub: 'Cupons e ofertas exclusivas', path: '/cupons', badge: '1 Novo', active: true },
              { icon: ShieldCheck, label: 'Segurança', sub: 'Privacidade e acesso à conta', active: false },
              { icon: Settings, label: 'Preferências', sub: 'Configurações do aplicativo', active: false },
            ].map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                  className="flex items-center justify-between p-6 transition-all duration-300 hover:bg-white/5 border-b border-white/5 last:border-0 group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-[#d4af37] group-hover:border-[#d4af37]/30 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-serif text-lg font-medium text-white/80 group-hover:text-white transition-colors flex items-center gap-3">
                        {item.label}
                        {item.badge && (
                          <span className="bg-[#d4af37] text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                            {item.badge}
                          </span>
                        )}
                      </span>
                      <span className="text-white/30 text-xs">{item.sub}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all" />
                  
                  {/* Hover Indicator */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#d4af37] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                </div>
            ))}
          </nav>
        </section>

        {/* Logout Section */}
        <div className="flex justify-center pt-4 pb-12">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-8 py-4 rounded-full border border-white/5 bg-[#0f0f0f]/40 text-white/30 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/5 hover:border-[#ffb4ab]/20 transition-all group tracking-widest text-[10px] font-bold uppercase"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Sair da Experiência
          </button>
        </div>
      </main>

      <Footer />

      {/* Mobile Nav Bar - Specific for Profile */}
      <nav className="md:hidden bg-black/95 backdrop-blur-xl fixed bottom-0 w-full z-50 border-t border-white/5 flex justify-around items-center px-4 pt-4 pb-8">
        <button className="flex flex-col items-center gap-1 text-white/20 hover:text-white transition-colors">
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Loja</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/20 hover:text-white transition-colors">
          <Diamond className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#d4af37] relative">
          <User className="w-6 h-6" />
          <span className="text-[8px] uppercase font-bold tracking-widest">Conta</span>
          <span className="absolute -bottom-2 w-1 h-1 bg-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
        </button>
      </nav>
    </div>
  );
};

export default Profile;
