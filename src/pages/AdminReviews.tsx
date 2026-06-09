import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { toast } from 'sonner';
import { Star, Trash2, MessageSquare, Package } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminErrorState,
  AdminConfirmDialog,
  AdminSectionHeader,
} from '@/components/admin/ui';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-white/10'}`} />
    ))}
    <span className="ml-1.5 text-[10px] font-bold text-white/30">{rating}/5</span>
  </div>
);

const AdminReviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const { data: reviews, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name), profiles!user_id(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação removida');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: () => toast.error('Erro ao remover avaliação'),
  });

  if (!user || user.user_metadata?.role !== 'admin') return <Navigate to="/admin/login" />;

  const filtered = reviews?.filter((r: any) => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'negative') return r.rating <= 2;
    return true;
  });

  const avgRating = reviews?.length
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const filterBtn = (value: typeof filter, label: string) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      className={`h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
        filter === value
          ? 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]'
          : 'border border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AdminShell
      eyebrow="Comunidade"
      title="Avaliações"
      subtitle={reviews?.length ? `Média: ${avgRating.toFixed(1)} ★ · ${reviews.length} avaliações` : undefined}
      actions={<div className="flex items-center gap-2">{filterBtn('all', 'Todas')}{filterBtn('positive', '★ 4-5')}{filterBtn('negative', '★ 1-2')}</div>}
    >
      <div className="max-w-3xl">
        <AdminSectionHeader icon={MessageSquare} title="Avaliações dos clientes" count={filtered?.length} />

        {isLoading && <AdminCardSkeleton count={4} />}
        {error && <AdminErrorState onRetry={() => refetch()} />}

        {!isLoading && !error && (filtered?.length ?? 0) === 0 && (
          <AdminEmptyState
            icon={Star}
            title={filter === 'all' ? 'Nenhuma avaliação ainda' : 'Nenhuma avaliação nesse filtro'}
            description={filter === 'all' ? 'As avaliações dos clientes aparecerão aqui quando publicadas.' : 'Tente outro filtro.'}
          />
        )}

        {!isLoading && !error && (filtered?.length ?? 0) > 0 && (
          <div className="space-y-3">
            {filtered!.map((r: any) => (
              <div key={r.id} className="rounded-[20px] border border-white/[0.06] bg-[#0f0f0f]/60 p-5 transition-all hover:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <StarRating rating={r.rating} />
                      <span className="flex items-center gap-1.5 text-[10px] text-white/30 border border-white/[0.06] rounded-full px-2.5 py-0.5">
                        <Package className="h-3 w-3" />{r.products?.name || 'Produto'}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-white/70 leading-relaxed mb-3">&ldquo;{r.comment}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-white/25">
                      Por <span className="text-white/40 font-bold">{r.profiles?.full_name || 'Anônimo'}</span>
                      {' · '}{format(new Date(r.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Remover avaliação?"
        description="A avaliação será excluída permanentemente."
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </AdminShell>
  );
};

export default AdminReviews;
