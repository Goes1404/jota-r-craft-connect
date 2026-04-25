import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

const AdminReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name), auth.users!user_id(email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Avaliação removida!' });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
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
          <Star className="w-10 h-10 text-[#d4af37]" />
          <h1 className="text-4xl font-serif font-bold text-white">Moderação de Avaliações</h1>
        </div>

        <div className="grid gap-6">
          {isLoading ? <p>Carregando...</p> : reviews?.length === 0 ? <p className="text-white/40">Nenhuma avaliação encontrada.</p> : reviews?.map((r: any) => (
            <div key={r.id} className="bg-[#0f0f0f]/60 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded-full">{r.products?.name}</span>
                </div>
                <p className="text-white text-lg mb-2">"{r.comment}"</p>
                <p className="text-white/40 text-sm">Por {r.auth?.users?.email} em {new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Button variant="ghost" onClick={() => deleteMutation.mutate(r.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 shrink-0">
                <Trash2 className="w-5 h-5 mr-2" /> Remover
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminReviews;
