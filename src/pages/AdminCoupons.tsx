import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Calendar, Hash } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminErrorState,
  AdminFormCard,
  AdminBadge,
  AdminConfirmDialog,
  AdminSectionHeader,
} from '@/components/admin/ui';

const AdminCoupons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: coupons, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error('Informe o código do cupom');
      const pct = parseInt(discount);
      if (!pct || pct < 1 || pct > 100) throw new Error('Desconto deve ser entre 1% e 100%');
      const { error } = await supabase.from('coupons').insert({
        code: code.toUpperCase().trim(),
        discount_percentage: pct,
        active: true,
        ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom criado com sucesso!');
      setCode('');
      setDiscount('');
      setExpiresAt('');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('coupons').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
    onError: () => toast.error('Erro ao atualizar cupom'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom excluído');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error('Erro ao excluir cupom'),
  });

  if (!user || user.user_metadata?.role !== 'admin') return <Navigate to="/admin/login" />;

  return (
    <AdminShell eyebrow="Marketing" title="Cupons de Desconto" subtitle="Gerencie os códigos promocionais da loja">
      <div className="max-w-3xl space-y-8">

        {/* ── Criar cupom ─────────────────────────────────────────────── */}
        <AdminFormCard title="Novo Cupom" description="Crie um código de desconto para seus clientes" icon={Plus}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> Código
              </label>
              <Input
                placeholder="EX: NATAL20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-black/40 border-white/10 h-11 font-black tracking-widest text-sm uppercase focus:border-[#d4af37]/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                <Percent className="h-3 w-3" /> Desconto
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="10"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="bg-black/40 border-white/10 h-11 pr-8 focus:border-[#d4af37]/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/30">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Expira em <span className="text-white/20 font-normal normal-case tracking-normal ml-1">(opcional)</span>
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-black/40 border-white/10 h-11 focus:border-[#d4af37]/40"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !code || !discount}
              className="h-11 px-8 bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#f2ca50] rounded-xl disabled:opacity-40"
            >
              {createMutation.isPending ? 'Criando…' : <><Plus className="w-3.5 h-3.5 mr-2" />Criar Cupom</>}
            </Button>
          </div>
        </AdminFormCard>

        {/* ── Lista de cupons ──────────────────────────────────────────── */}
        <div>
          <AdminSectionHeader icon={Ticket} title="Cupons cadastrados" count={coupons?.length} />

          {isLoading && <AdminCardSkeleton count={3} />}
          {error && <AdminErrorState onRetry={() => refetch()} />}

          {!isLoading && !error && coupons?.length === 0 && (
            <AdminEmptyState
              icon={Ticket}
              title="Nenhum cupom cadastrado"
              description="Crie o primeiro cupom de desconto usando o formulário acima."
            />
          )}

          {!isLoading && !error && (coupons?.length ?? 0) > 0 && (
            <div className="space-y-3">
              {coupons!.map((c: any) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-4 rounded-[20px] border p-4 transition-all ${
                      c.active && !expired
                        ? 'border-white/[0.07] bg-[#0f0f0f]/60'
                        : 'border-white/[0.03] bg-white/[0.01] opacity-60'
                    }`}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 ${
                      c.active && !expired ? 'bg-[#d4af37]/10 border-[#d4af37]/20' : 'bg-white/[0.03] border-white/5'
                    }`}>
                      <Ticket className={`h-5 w-5 ${c.active && !expired ? 'text-[#d4af37]' : 'text-white/20'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black tracking-widest text-white uppercase">{c.code}</span>
                        <AdminBadge label={expired ? 'Expirado' : c.active ? 'Ativo' : 'Inativo'} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-bold text-[#d4af37]">{c.discount_percentage}% de desconto</span>
                        {c.expires_at && (
                          <span className="text-[10px] text-white/30">
                            Expira: {format(new Date(c.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
                        title={c.active ? 'Desativar' : 'Ativar'}
                      >
                        {c.active
                          ? <ToggleRight className="h-5 w-5 text-green-400" />
                          : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AdminConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir cupom?"
        description="Esta ação não pode ser desfeita. O cupom será removido permanentemente."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </AdminShell>
  );
};

export default AdminCoupons;
