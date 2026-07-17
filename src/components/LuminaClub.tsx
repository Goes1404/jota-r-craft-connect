import React from 'react';
import { 
  Diamond, 
  Crown, 
  Zap, 
  Gift, 
  Truck, 
  ShieldCheck, 
  Star, 
  Lock,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Progress } from './ui/progress';

interface LuminaClubProps {
  totalSpent: number;
}

export const LuminaClub: React.FC<LuminaClubProps> = ({ totalSpent }) => {
  const points = Math.floor(totalSpent * 10);
  
  const tiers = [
    { name: 'Black', min: 0, icon: ShieldCheck, color: 'text-white/40', bg: 'bg-white/5' },
    { name: 'Platinum', min: 2500, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Prestige', min: 10000, icon: Star, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' },
    { name: 'Lumina Elite', min: 25000, icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const currentTier = [...tiers].reverse().find(t => totalSpent >= t.min) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progress = nextTier ? Math.min((totalSpent / nextTier.min) * 100, 100) : 100;

  const benefits = [
    { icon: Gift, title: 'Cashback Progressivo', desc: `Você tem ${totalSpent > 10000 ? '5%' : '2%'} de volta em pontos.` },
    { icon: Truck, title: 'Frete Prioritário', desc: 'Sua entrega é processada antes de todas.', active: totalSpent > 5000 },
    { icon: Lock, title: 'Vault Secreto', desc: 'Acesso a produtos de edição limitada.', active: totalSpent > 15000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Main Loyalty Card */}
      <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentTier.bg} border border-white/5`}>
                <currentTier.icon className={`w-5 h-5 ${currentTier.color}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Status: <span className={currentTier.color}>{currentTier.name}</span></span>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Pontos Acumulados</p>
              <h2 className="text-4xl sm:text-6xl font-serif font-black text-white tracking-tighter break-all">
                {points.toLocaleString('pt-BR')}
              </h2>
            </div>

            {nextTier && (
              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Progresso para {nextTier.name}</span>
                  <span className="text-[9px] font-black text-[#d4af37]">R$ {totalSpent.toLocaleString('pt-BR')} / R$ {nextTier.min.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] shadow-[0_0_20px_rgba(212,175,55,0.4)]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-auto flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-[32px] bg-gradient-to-tr from-[#d4af37] to-[#f2ca50] p-1 shadow-2xl rotate-3">
                <div className="w-full h-full bg-black rounded-[28px] flex flex-col items-center justify-center gap-2">
                  <currentTier.icon className={`w-10 h-10 ${currentTier.color}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white">{currentTier.name}</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-[#d4af37]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((b, i) => (
          <div key={i} className={`p-8 rounded-[32px] border border-white/5 transition-all group ${b.active ? 'bg-[#d4af37]/5 border-[#d4af37]/20' : 'bg-white/[0.02] opacity-40 grayscale'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${b.active ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-white/20 border-white/10'}`}>
              <b.icon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-bold text-white mb-2">{b.title}</h4>
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">{b.desc}</p>
            {!b.active && (
              <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#d4af37]">
                <Lock className="w-3 h-3" /> Bloqueado
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Missions Section */}
      <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-serif font-bold text-white">Missões Lumina</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">Complete para ganhar pontos extras</p>
          </div>
          <TrendingUp className="w-6 h-6 text-[#d4af37]/20" />
        </div>

        <div className="space-y-4">
          {[
            { label: 'Indique um Amigo', points: 500, done: false },
            { label: 'Avalie 3 Compras', points: 300, done: true },
            { label: 'Primeira Compra acima de R$ 5k', points: 1000, done: totalSpent > 5000 },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.done ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-white/10 text-white/10'}`}>
                  {m.done && <ShieldCheck className="w-3 h-3" />}
                </div>
                <span className={`text-xs font-bold ${m.done ? 'text-white/40 line-through' : 'text-white'}`}>{m.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#d4af37]">+{m.points} pts</span>
                <ChevronRight className="w-4 h-4 text-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
