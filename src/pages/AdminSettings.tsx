import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: any = {};
      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        toast({ title: 'Credenciais atualizadas com sucesso!' });
        setPassword('');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-32">
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-[#d4af37] mb-8 uppercase text-xs tracking-widest font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <Shield className="w-10 h-10 text-[#d4af37]" />
          <h1 className="text-4xl font-serif font-bold text-white">Segurança Admin</h1>
        </div>

        <form onSubmit={handleSave} className="bg-[#0f0f0f]/60 p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-2">
            <Label className="text-[#d4af37] uppercase tracking-widest text-[10px] font-bold">E-mail Administrativo</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/50 border-white/10 h-12" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#d4af37] uppercase tracking-widest text-[10px] font-bold">Nova Senha (deixe em branco para não alterar)</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/50 border-white/10 h-12" />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full bg-[#d4af37] text-black font-bold h-14 rounded-xl hover:bg-[#f2ca50] transition-all">
            {isSaving ? 'SALVANDO...' : 'ATUALIZAR CREDENCIAIS'}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default AdminSettings;
