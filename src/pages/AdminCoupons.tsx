import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AdminShell } from '@/components/admin/AdminShell';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';

const AdminCoupons = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!code || !discount) throw new Error("Preencha todos os campos");
      const { error } = await supabase.from('coupons').insert({
        code: code.toUpperCase(),
        discount_percentage: parseInt(discount),
        active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Cupom criado com sucesso!' });
      setCode('');
      setDiscount('');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Cupom excluído!' });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    }
  });

  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return (
    <AdminShell eyebrow="Marketing" title="Gestão de Cupons">
      <div className="max-w-4xl">

        <div className="bg-[#0f0f0f]/60 p-8 rounded-3xl border border-white/10 mb-12 flex gap-4">
          <Input placeholder="CÓDIGO" value={code} onChange={e => setCode(e.target.value)} className="bg-black/50 border-white/10 h-12" />
          <Input type="number" placeholder="% Desconto" value={discount} onChange={e => setDiscount(e.target.value)} className="bg-black/50 border-white/10 h-12 w-32" />
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-[#d4af37] text-black h-12 px-8">
            <Plus className="w-4 h-4 mr-2" /> CRIAR
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? <p>Carregando...</p> : coupons?.map(c => (
            <div key={c.id} className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#d4af37]">{c.code}</h3>
                <p className="text-white/40">{c.discount_percentage}% de desconto</p>
              </div>
              <Button variant="ghost" onClick={() => deleteMutation.mutate(c.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminCoupons;
