import React, { useState, useRef, useCallback } from 'react';
import { Truck, MapPin, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingOption {
  name: string;
  price: number;
  days: string;
  arrivalLabel: string;
  highlight?: boolean;
}

interface EdgeFunctionResponse {
  city: string;
  state: string;
  options: ShippingOption[];
  freeThreshold: number;
  error?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ResultSkeleton = () => (
  <div aria-hidden="true" className="space-y-2 animate-pulse">
    <div className="h-3 bg-white/5 rounded w-40" />
    <div className="h-12 bg-white/5 rounded-xl" />
    <div className="h-12 bg-white/5 rounded-xl" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  totalValue?: number;
  source?: string;
  /** Itens para cálculo de frete pelas dimensões reais (ex.: [{ id, quantity }]). */
  items?: { id: string; quantity: number }[];
}

export const ShippingCalculator: React.FC<Props> = ({
  totalValue = 0,
  source = 'web',
  items,
}) => {
  const [cep, setCep] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [freeThreshold, setFreeThreshold] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCepRef = useRef('');

  const calculate = useCallback(async (rawCep: string) => {
    if (rawCep.length !== 8) return;
    latestCepRef.current = rawCep;
    setLoading(true);
    setError('');
    setOptions(null);
    setLocationLabel('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke<EdgeFunctionResponse>(
        'shipping-calculate',
        { body: { cep: rawCep, productValue: totalValue, source, items } },
      );

      // Guard against stale responses if the user typed a different CEP
      if (latestCepRef.current !== rawCep) return;

      if (fnError || !data) {
        throw new Error(fnError?.message ?? 'Erro desconhecido');
      }
      if (data.error) {
        throw new Error(data.error);
      }

      setLocationLabel(`${data.city}, ${data.state}`);
      setOptions(data.options);
      setFreeThreshold(data.freeThreshold);
    } catch (err: unknown) {
      if (latestCepRef.current !== rawCep) return;
      const msg = err instanceof Error ? err.message : 'Erro ao calcular frete.';
      setError(msg);
    } finally {
      if (latestCepRef.current === rawCep) setLoading(false);
    }
  }, [totalValue, source, items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    const masked = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(masked);
    setOptions(null);
    setError('');
    setLocationLabel('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.length === 8) {
      debounceRef.current = setTimeout(() => calculate(raw), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      calculate(cep.replace(/\D/g, ''));
    }
  };

  const handleRetry = () => calculate(cep.replace(/\D/g, ''));

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
        <span id="shipping-calc-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
          Calcular Frete
        </span>
      </div>

      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          inputMode="numeric"
          value={cep}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="00000-000"
          aria-labelledby="shipping-calc-label"
          aria-label="CEP para cálculo de frete"
          aria-busy={loading}
          aria-describedby={error ? 'shipping-error' : undefined}
          autoComplete="postal-code"
          className="w-full bg-white/[0.04] border border-white/10 focus:border-[#d4af37]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/30 pl-9 pr-10 h-10 rounded-xl text-white placeholder:text-white/20 transition-colors text-sm font-mono tracking-widest"
        />
        {loading && (
          <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#d4af37] animate-spin" aria-hidden="true" />
        )}
        {!loading && options && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500" aria-hidden="true" />
        )}
        {!loading && error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" aria-hidden="true" />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2" role="alert">
          <p id="shipping-error" className="text-red-400 text-[10px] font-medium flex-1">{error}</p>
          <button
            onClick={handleRetry}
            aria-label="Tentar novamente"
            className="text-red-400/60 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 rounded p-0.5"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && <ResultSkeleton />}

      {/* Results */}
      <div role="region" aria-live="polite" aria-label="Opções de frete">
        {options && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-400">
            {locationLabel && (
              <p className="text-[10px] text-white/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" aria-hidden="true" />
                Entregando em{' '}
                <span className="text-white/50 font-bold">{locationLabel}</span>
              </p>
            )}

            {options.map((opt, i) => (
              <div
                key={i}
                className={`flex items-start justify-between px-4 py-3 rounded-xl border transition-all ${
                  opt.highlight
                    ? 'bg-[#d4af37]/5 border-[#d4af37]/30'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${opt.highlight ? 'text-[#d4af37]' : 'text-white/50'}`}>
                    {opt.name}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">{opt.days}</p>
                  <p className="text-[9px] text-white/30 mt-0.5 font-medium">{opt.arrivalLabel}</p>
                </div>
                <span
                  className={`text-sm font-black tabular-nums shrink-0 mt-0.5 ${opt.price === 0 ? 'text-green-400' : 'text-white'}`}
                  aria-label={opt.price === 0 ? 'Grátis' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                >
                  {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            ))}

            {totalValue < freeThreshold && (
              <p className="text-[9px] text-white/20 text-center pt-1">
                Frete grátis acima de{' '}
                <span className="text-[#d4af37]/60">
                  R$ {freeThreshold.toLocaleString('pt-BR')}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
