import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

const NAMES = [
  'Lucas S.', 'Ana M.', 'Gabriel R.', 'Mariana F.', 'Rafael B.',
  'Fernanda L.', 'Diego C.', 'Camila P.', 'Thiago A.', 'Beatriz N.',
  'Felipe H.', 'Larissa V.', 'Bruno T.', 'Juliana K.', 'Mateus O.',
];
const CITIES = [
  'São Paulo', 'Osasco', 'Guarulhos', 'Campinas', 'Santos',
  'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Barueri', 'Cotia',
  'Mauá', 'São Bernardo', 'Diadema', 'Taboão da Serra',
];
const TIME_LABELS = ['agora mesmo', 'há 2 min', 'há 5 min', 'há 8 min', 'há 11 min', 'há 15 min'];

interface Notification {
  name: string;
  city: string;
  product: string;
  image: string;
  timeLabel: string;
}

export const SocialProofToast: React.FC = () => {
  const { data: products = [] } = useProducts();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rand = (arr: unknown[]) => arr[Math.floor(Math.random() * arr.length)];

  const showNext = useCallback(() => {
    const available = products.filter(p => p.stock > 0);
    if (!available.length) return;
    const p = available[Math.floor(Math.random() * available.length)];
    setNotification({
      name: rand(NAMES) as string,
      city: rand(CITIES) as string,
      product: p.name,
      image: p.image || '/placeholder.svg',
      timeLabel: rand(TIME_LABELS) as string,
    });
    setVisible(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setVisible(false), 5500);
  }, [products]);

  useEffect(() => {
    if (!products.length) return;
    const initial = setTimeout(() => {
      showNext();
      intervalRef.current = setInterval(showNext, 32000);
    }, 14000);
    return () => {
      clearTimeout(initial);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [products, showNext]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-24 left-4 z-40 max-w-[290px] transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-[#0c0c0c]/96 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
          <img
            src={notification.image}
            alt={notification.product}
            className="w-full h-full object-contain mix-blend-lighten"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{notification.timeLabel}</span>
          </div>
          <p className="text-[11px] text-white font-bold leading-tight">
            {notification.name} <span className="text-white/40 font-normal">de</span> {notification.city}
          </p>
          <p className="text-[9px] text-[#d4af37] font-black uppercase tracking-wide mt-0.5 truncate">
            comprou: {notification.product}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/15 hover:text-white/50 transition-colors flex-shrink-0 p-1 rounded-full hover:bg-white/5"
          aria-label="Fechar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
