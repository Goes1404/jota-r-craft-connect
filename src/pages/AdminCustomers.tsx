import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Users, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

const AdminCustomers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: newsletters, isLoading } = useQuery({
    queryKey: ['admin-newsletter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('newsletter').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-32">
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-[#d4af37] mb-8 uppercase text-xs tracking-widest font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <Users className="w-10 h-10 text-[#d4af37]" />
          <h1 className="text-4xl font-serif font-bold text-white">Leads e Clientes</h1>
        </div>

        <div className="bg-[#0f0f0f]/60 p-8 rounded-3xl border border-white/10 mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Mail className="w-5 h-5 text-[#d4af37]"/> Inscritos na Newsletter</h2>
          <div className="grid gap-4">
            {isLoading ? <p>Carregando...</p> : newsletters?.length === 0 ? <p className="text-white/40">Nenhum inscrito ainda.</p> : newsletters?.map(n => (
              <div key={n.id} className="bg-black/50 border border-white/5 p-4 rounded-xl flex justify-between">
                <span className="font-medium">{n.email}</span>
                <span className="text-white/40 text-sm">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminCustomers;
