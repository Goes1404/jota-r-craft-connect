import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw, LucideIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// ─── AdminSkeleton ──────────────────────────────────────────────────────────

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`} />
);

export const AdminCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-[24px] border border-white/5 bg-white/[0.02] p-5 space-y-3 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/[0.04]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-white/[0.04]" />
            <div className="h-2.5 w-1/2 rounded bg-white/[0.03]" />
          </div>
          <div className="h-3 w-16 rounded bg-white/[0.04]" />
        </div>
      </div>
    ))}
  </div>
);

export const AdminTableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-[24px] border border-white/5 overflow-hidden">
    <div className="border-b border-white/5 p-4 grid gap-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-2.5 rounded bg-white/[0.06]" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="border-b border-white/[0.03] p-4 grid gap-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-3 rounded bg-white/[0.03]" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
      </div>
    ))}
  </div>
);

export const AdminStatSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-32 rounded-[24px] border border-white/5 bg-white/[0.02] animate-pulse" />
    ))}
  </div>
);

// ─── AdminEmptyState ────────────────────────────────────────────────────────

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-8 text-center"
  >
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/5 bg-white/[0.02]">
      <Icon className="h-8 w-8 text-white/15" />
    </div>
    <h3 className="text-base font-serif font-bold text-white/50">{title}</h3>
    {description && <p className="mt-2 text-xs text-white/25 max-w-xs leading-relaxed">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-6 h-10 px-6 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/20 transition-all"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

// ─── AdminErrorState ────────────────────────────────────────────────────────

interface AdminErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const AdminErrorState: React.FC<AdminErrorStateProps> = ({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-red-500/20 bg-red-500/5">
      <AlertCircle className="h-7 w-7 text-red-400" />
    </div>
    <p className="text-sm font-bold text-white/40">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-5 flex items-center gap-2 h-9 px-5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:border-white/20 transition-all"
      >
        <RefreshCcw className="h-3 w-3" /> Tentar novamente
      </button>
    )}
  </div>
);

// ─── AdminPageCard ──────────────────────────────────────────────────────────

interface AdminPageCardProps {
  className?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const AdminPageCard: React.FC<AdminPageCardProps> = ({ className = '', children, noPadding }) => (
  <div className={`bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/[0.06] rounded-[28px] shadow-xl ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

// ─── AdminStatCard ──────────────────────────────────────────────────────────

interface AdminStatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color?: string;
  gold?: boolean;
  index?: number;
  trend?: { value: number; label?: string };
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = '#d4af37',
  gold,
  index = 0,
  trend,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden p-5 rounded-[24px] border transition-all duration-500 group hover:-translate-y-0.5 ${
      gold
        ? 'bg-gradient-to-br from-[#d4af37]/15 to-[#d4af37]/[0.03] border-[#d4af37]/30'
        : 'bg-[#0f0f0f]/50 border-white/5 hover:border-white/10'
    }`}
  >
    <div className="relative z-10">
      <div
        className={`mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl ${
          gold ? 'bg-[#d4af37] text-black' : 'bg-black/60 border border-white/[0.06]'
        }`}
        style={!gold ? { color } : undefined}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</p>
      <h3 className={`mt-1 font-serif font-bold tracking-tight text-xl ${gold ? 'text-[#d4af37]' : 'text-white'}`}>
        {value}
      </h3>
      {trend && (
        <p className={`mt-1.5 text-[10px] font-bold ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
        </p>
      )}
    </div>
    <Icon className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 rotate-12 opacity-[0.025] transition-opacity duration-500 group-hover:opacity-[0.07]" />
  </motion.div>
);

// ─── AdminFormCard ──────────────────────────────────────────────────────────

interface AdminFormCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const AdminFormCard: React.FC<AdminFormCardProps> = ({ title, description, icon: Icon, children, className = '' }) => (
  <AdminPageCard className={className}>
    <div className="mb-5 flex items-center gap-3">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20">
          <Icon className="h-4 w-4 text-[#d4af37]" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {description && <p className="text-[10px] text-white/30 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="border-t border-white/[0.05] pt-5">{children}</div>
  </AdminPageCard>
);

// ─── AdminBadge ─────────────────────────────────────────────────────────────

type BadgeVariant = 'pago' | 'pendente' | 'preparacao' | 'enviado' | 'entregue' | 'cancelado' | 'ativo' | 'inativo' | 'vip' | 'novo' | 'recorrente' | 'esfriando';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  pago:       'bg-green-500/10 text-green-400 border-green-500/20',
  pendente:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  preparacao: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  enviado:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  entregue:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelado:  'bg-red-500/10 text-red-400 border-red-500/20',
  ativo:      'bg-green-500/10 text-green-400 border-green-500/20',
  inativo:    'bg-white/5 text-white/30 border-white/10',
  vip:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  novo:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  recorrente: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  esfriando:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const STATUS_LABEL: Record<string, BadgeVariant> = {
  'Pago':                 'pago',
  'Aguardando Pagamento': 'pendente',
  'Em Preparação':        'preparacao',
  'Enviado':              'enviado',
  'Entregue':             'entregue',
  'Cancelado':            'cancelado',
  'Ativo':                'ativo',
  'Inativo':              'inativo',
  'VIP':                  'vip',
  'Novo':                 'novo',
  'Recorrente':           'recorrente',
  'Esfriando':            'esfriando',
};

interface AdminBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ label, variant, className = '' }) => {
  const v = variant ?? STATUS_LABEL[label] ?? 'inativo';
  return (
    <span className={`inline-flex items-center border px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${BADGE_STYLES[v]} ${className}`}>
      {label}
    </span>
  );
};

// ─── AdminConfirmDialog ──────────────────────────────────────────────────────

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  destructive = true,
  loading,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-[#0d0d0d] border border-white/10 rounded-[24px] text-white max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="font-serif text-lg font-bold text-white">{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription className="text-sm text-white/40">{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2 mt-2">
        <AlertDialogCancel
          className="flex-1 bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest"
        >
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest ${
            destructive
              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              : 'bg-[#d4af37] text-black hover:bg-[#f2ca50]'
          }`}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// ─── AdminSectionHeader ──────────────────────────────────────────────────────

interface AdminSectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export const AdminSectionHeader: React.FC<AdminSectionHeaderProps> = ({ icon: Icon, title, count, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="h-4 w-4 text-[#d4af37]" />}
      <h2 className="text-sm font-black uppercase tracking-widest text-white/70">{title}</h2>
      {count !== undefined && (
        <span className="text-[9px] font-black text-white/20 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase">
          {count}
        </span>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);
