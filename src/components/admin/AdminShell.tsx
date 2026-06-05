import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  Ticket,
  Users,
  Layers,
  ShoppingCart,
  Star,
  Sparkles,
  Settings,
  Menu,
  X,
  LogOut,
  Diamond,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
 * Navegação central do admin. Editar aqui reflete na sidebar (desktop),
 * na bottom-nav (mobile) e no drawer "Mais".
 * ──────────────────────────────────────────────────────────────────────────── */
export interface AdminNavItem {
  label: string;
  short: string;
  to: string;
  icon: React.ElementType;
  accent?: string; // cor do ícone/realce
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Dashboard', short: 'Início', to: '/admin/dashboard', icon: LayoutDashboard, accent: '#d4af37' },
  { label: 'Pedidos', short: 'Pedidos', to: '/admin/orders', icon: ShoppingBag, accent: '#fb923c' },
  { label: 'Produtos', short: 'Produtos', to: '/admin/products', icon: Package, accent: '#a78bfa' },
  { label: 'Vendas', short: 'Vendas', to: '/admin/sales', icon: DollarSign, accent: '#4ade80' },
  { label: 'Cupons', short: 'Cupons', to: '/admin/coupons', icon: Ticket, accent: '#f472b6' },
  { label: 'Clientes · CRM', short: 'Clientes', to: '/admin/customers', icon: Users, accent: '#60a5fa' },
  { label: 'Intel. Estoque', short: 'Estoque', to: '/admin/inventory-intelligence', icon: Layers, accent: '#38bdf8' },
  { label: 'Recuperar Vendas', short: 'Recuperar', to: '/admin/abandoned-carts', icon: ShoppingCart, accent: '#fb923c' },
  { label: 'Reviews', short: 'Reviews', to: '/admin/reviews', icon: Star, accent: '#facc15' },
  { label: 'Estúdio IA', short: 'Estúdio', to: '/admin/studio', icon: Sparkles, accent: '#d4af37' },
  { label: 'Configurações', short: 'Config', to: '/admin/settings', icon: Settings, accent: '#94a3b8' },
];

// As 4 seções fixas da barra inferior no mobile (a 5ª é "Mais").
const MOBILE_PRIMARY = ['/admin/dashboard', '/admin/orders', '/admin/products', '/admin/sales'];

function useActive() {
  const { pathname } = useLocation();
  return (to: string) =>
    to === '/admin/dashboard' ? pathname === to : pathname.startsWith(to);
}

/* ── Logo ─────────────────────────────────────────────────────────────────── */
const Brand: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-2.5 group">
    <div className="relative">
      <Diamond className="h-6 w-6 text-[#d4af37] transition-transform duration-500 group-hover:rotate-180" />
      <div className="absolute inset-0 blur-md bg-[#d4af37]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <span className="text-lg font-serif font-black text-[#d4af37] uppercase tracking-[0.22em]">
      JR <span className="text-white/80 italic lowercase font-light tracking-normal">admin</span>
    </span>
  </button>
);

interface AdminShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ title, subtitle, eyebrow, actions, children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isActive = useActive();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = MOBILE_PRIMARY.map((p) => ADMIN_NAV.find((n) => n.to === p)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      {/* Atmosfera / glow de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 right-0 w-[55%] h-[55%] rounded-full bg-[#f2ca50] opacity-[0.025] blur-[160px]" />
        <div className="absolute bottom-0 -left-24 w-[45%] h-[45%] rounded-full bg-[#d4af37] opacity-[0.015] blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.6) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="px-7 h-20 flex items-center border-b border-white/5">
          <Brand onClick={() => navigate('/')} />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-hide">
          <p className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Operação</p>
          {ADMIN_NAV.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-300 group ${
                  active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-side-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.7)]"
                  />
                )}
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: active ? `${item.accent}55` : 'rgba(255,255,255,0.06)',
                    backgroundColor: active ? `${item.accent}1a` : 'rgba(0,0,0,0.3)',
                    color: active ? item.accent : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span
                  className={`text-[13px] font-bold tracking-wide transition-colors ${
                    active ? 'text-white' : 'text-white/45 group-hover:text-white/80'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2 px-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sistema Online</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/5 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white/80 truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Administrador</p>
            </div>
            <button
              onClick={() => signOut()}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all"
              aria-label="Sair"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Top bar (mobile) ──────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <Brand onClick={() => navigate('/')} />
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <button
            onClick={() => setMoreOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 hover:text-[#d4af37] hover:bg-white/5 transition-all"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Conteúdo ──────────────────────────────────────────────────────── */}
      <div className="lg:pl-72 relative z-10">
        <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-28 lg:pb-16">
          {/* Cabeçalho da página */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-7 lg:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              {eyebrow && (
                <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.35em]">{eyebrow}</span>
              )}
              <h1 className="mt-1.5 text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-white/40">{subtitle}</p>}
            </motion.div>
            {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {primary.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5"
              >
                {active && (
                  <motion.span
                    layoutId="admin-bottom-active"
                    className="absolute top-0 h-[3px] w-9 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                  />
                )}
                <Icon
                  className="h-[22px] w-[22px] transition-colors"
                  style={{ color: active ? item.accent : 'rgba(255,255,255,0.4)' }}
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    active ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {item.short}
                </span>
              </NavLink>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-1 py-2.5">
            <Menu className="h-[22px] w-[22px] text-white/40" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Mais</span>
          </button>
        </div>
      </nav>

      {/* ── Drawer "Mais" (mobile) ────────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-[32px] border-t border-white/10 bg-[#0a0a0a] p-6 pb-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/15" />
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Todas as seções</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {ADMIN_NAV.map((item, i) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center justify-center gap-2.5 aspect-square rounded-3xl border p-2 text-center transition-all ${
                          active ? 'border-[#d4af37]/40 bg-[#d4af37]/10' : 'border-white/5 bg-white/[0.02] active:scale-95'
                        }`}
                      >
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                          style={{
                            borderColor: `${item.accent}40`,
                            backgroundColor: `${item.accent}14`,
                            color: item.accent,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-[10px] font-bold leading-tight text-white/70">{item.short}</span>
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-[11px] font-black uppercase tracking-widest text-red-400 active:scale-[0.98] transition-transform"
              >
                <LogOut className="h-4 w-4" /> Sair da conta
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminShell;
