import React, { useState } from 'react';
import { Truck, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShippingOption {
  name: string;
  price: number;
  days: string;
  highlight?: boolean;
}

const FREE_THRESHOLD = 500;

// Flat-rate table by Brazilian state (PAC price, Sedex price, PAC days, Sedex days)
const RATES: Record<string, [number, number, string, string]> = {
  SP: [12.90, 22.90, '1-2 dias úteis', 'Mesmo dia (Osasco/SP)'],
  RJ: [25.90, 38.90, '3-4 dias úteis', '2-3 dias úteis'],
  MG: [25.90, 36.90, '3-4 dias úteis', '2-3 dias úteis'],
  ES: [28.90, 40.90, '4-5 dias úteis', '3-4 dias úteis'],
  PR: [28.90, 40.90, '3-4 dias úteis', '2-3 dias úteis'],
  SC: [28.90, 42.90, '4-5 dias úteis', '3-4 dias úteis'],
  RS: [30.90, 44.90, '5-6 dias úteis', '3-4 dias úteis'],
  BA: [30.90, 46.90, '5-7 dias úteis', '3-5 dias úteis'],
  GO: [30.90, 44.90, '4-6 dias úteis', '3-4 dias úteis'],
  DF: [30.90, 44.90, '4-6 dias úteis', '3-4 dias úteis'],
};

function getOptions(uf: string, total: number): ShippingOption[] {
  if (total >= FREE_THRESHOLD) {
    return [{ name: 'Frete Cortesia', price: 0, days: '1-5 dias úteis', highlight: true }];
  }
  const r = RATES[uf] ?? [35.90, 52.90, '6-8 dias úteis', '4-6 dias úteis'];
  return [
    { name: 'PAC Correios', price: r[0], days: r[2] },
    { name: 'Sedex', price: r[1], days: r[3], highlight: true },
  ];
}

interface Props {
  totalValue?: number;
  compact?: boolean;
}

export const ShippingCalculator: React.FC<Props> = ({ totalValue = 0, compact = false }) => {
  const [cep, setCep] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCep(raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw);
    setOptions(null);
    setError('');
    setLocationLabel('');
  };

  const calculate = async () => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) { setError('Digite um CEP válido com 8 dígitos.'); return; }
    setLoading(true);
    setError('');
    setOptions(null);
    setLocationLabel('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) throw new Error('not_found');
      const data = await res.json();
      if (data.erro) throw new Error('not_found');
      setLocationLabel(`${data.localidade}, ${data.uf}`);
      setOptions(getOptions(data.uf, totalValue));
    } catch {
      setError('CEP não encontrado. Verifique o número e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-[#d4af37] shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
          Calcular Frete
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            value={cep}
            onChange={handleChange}
            placeholder="00000-000"
            onKeyDown={e => e.key === 'Enter' && calculate()}
            aria-label="CEP para cálculo de frete"
            className="w-full bg-white/[0.04] border border-white/10 focus:border-[#d4af37]/50 pl-9 pr-3 h-10 rounded-xl text-white placeholder:text-white/20 outline-none transition-colors text-sm font-mono tracking-widest"
          />
        </div>
        <Button
          onClick={calculate}
          disabled={loading || cep.replace(/\D/g, '').length !== 8}
          className="bg-[#d4af37] text-black hover:bg-[#f2ca50] h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'OK'}
        </Button>
      </div>

      {error && (
        <p className="text-red-400 text-[10px] font-medium">{error}</p>
      )}

      {options && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-400">
          {locationLabel && (
            <p className="text-[10px] text-white/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              Entregando em <span className="text-white/50 font-bold">{locationLabel}</span>
            </p>
          )}
          {options.map((opt, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
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
              </div>
              <span className={`text-sm font-black tabular-nums ${opt.price === 0 ? 'text-green-400' : 'text-white'}`}>
                {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
          ))}
          {totalValue < FREE_THRESHOLD && (
            <p className="text-[9px] text-white/20 text-center pt-1">
              Frete grátis acima de{' '}
              <span className="text-[#d4af37]/60">
                R$ {FREE_THRESHOLD.toLocaleString('pt-BR')}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
