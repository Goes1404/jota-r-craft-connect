import React, { useSyncExternalStore } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, NotebookPen } from 'lucide-react';
import { salePhotoStore } from '@/lib/salePhotoStore';

/**
 * Indicador flutuante global: a leitura da foto do caderno roda em segundo
 * plano (o estado vive fora da tela de Vendas, em salePhotoStore), então sem
 * isso o lojista que navegar para outra página perde de vista que ainda há
 * leitura em andamento ou páginas prontas esperando revisão.
 */
export const SalePhotoStatusPill: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const state = useSyncExternalStore(salePhotoStore.subscribe, salePhotoStore.getState);

  // Na própria tela de Vendas o diálogo já mostra o progresso — pill some lá.
  if (pathname === '/admin/sales') return null;
  if (!salePhotoStore.hasPendingWork()) return null;

  const analyzing = state.step === 'analyzing';

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/sales')}
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-8 z-30 flex items-center gap-2.5 rounded-full border border-[#d4af37]/30 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/40 hover:border-[#d4af37]/60 transition-all max-w-[calc(100vw-2rem)]"
    >
      {analyzing
        ? <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin shrink-0" />
        : <NotebookPen className="w-4 h-4 text-[#d4af37] shrink-0" />}
      <span className="text-[10px] font-black uppercase tracking-widest text-white/80 truncate">
        {analyzing
          ? (state.batchProgress
              ? `Lendo foto ${state.batchProgress.current}/${state.batchProgress.total}…`
              : 'Lendo foto do caderno…')
          : `${state.pages.length} ${state.pages.length === 1 ? 'página pronta' : 'páginas prontas'} — revisar`}
      </span>
    </button>
  );
};

export default SalePhotoStatusPill;
