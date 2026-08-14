import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Shield, Truck, Tag } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAppSettings } from '@/hooks/useProducts';
import { useQueryClient } from '@tanstack/react-query';

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isSavingAuth, setIsSavingAuth] = useState(false);

  const { data: settings } = useAppSettings();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('500');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerBadge, setBannerBadge] = useState('Oferta Relâmpago');
  const [bannerText, setBannerText] = useState('Até 20% OFF em acessórios selecionados');
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Shipping Configuration states
  const [shippingConfigId, setShippingConfigId] = useState<string | null>(null);
  const [originZip, setOriginZip] = useState('06233-030');
  const [melhorEnvioEnabled, setMelhorEnvioEnabled] = useState(false);
  const [melhorEnvioToken, setMelhorEnvioToken] = useState('');
  const [baseFee, setBaseFee] = useState('12.90');
  const [sedexMultiplier, setSedexMultiplier] = useState('1.80');

  useEffect(() => {
    if (!settings) return;
    if (settings.free_shipping_threshold) setFreeShippingThreshold(settings.free_shipping_threshold);
    if (settings.offer_banner_enabled !== undefined) setBannerEnabled(settings.offer_banner_enabled !== 'false');
    if (settings.offer_banner_badge) setBannerBadge(settings.offer_banner_badge);
    if (settings.offer_banner_text) setBannerText(settings.offer_banner_text);
  }, [settings]);

  useEffect(() => {
    const fetchShippingConfig = async () => {
      const { data } = await supabase
        .from('shipping_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setShippingConfigId(data.id);
        setOriginZip(data.origin_zip);
        setMelhorEnvioEnabled(data.melhor_envio_enabled);
        setMelhorEnvioToken(data.melhor_envio_token || '');
        setBaseFee(String(data.base_fee));
        setSedexMultiplier(String(data.sedex_multiplier));
        setFreeShippingThreshold(String(data.free_shipping_threshold));
      }
    };
    fetchShippingConfig();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  };

  const handleSaveAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAuth(true);
    try {
      const updates: any = {};
      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        toast({ title: 'Credenciais atualizadas com sucesso!' });
        setPassword('');
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingAuth(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    try {
      const threshold = Number(freeShippingThreshold);
      if (isNaN(threshold) || threshold < 0) throw new Error('Valor inválido para frete grátis.');

      const parsedBaseFee = Number(baseFee);
      const parsedSedexMultiplier = Number(sedexMultiplier);
      if (isNaN(parsedBaseFee) || parsedBaseFee < 0) throw new Error('Valor inválido para taxa base de envio.');
      if (isNaN(parsedSedexMultiplier) || parsedSedexMultiplier < 0) throw new Error('Valor inválido para multiplicador do Sedex.');

      // 1. Save general settings
      await Promise.all([
        saveSetting('free_shipping_threshold', String(threshold)),
        saveSetting('offer_banner_enabled', String(bannerEnabled)),
        saveSetting('offer_banner_badge', bannerBadge),
        saveSetting('offer_banner_text', bannerText),
      ]);

      // 2. Save shipping config in shipping_config table
      const shippingData = {
        origin_zip: originZip,
        base_fee: parsedBaseFee,
        free_shipping_threshold: threshold,
        sedex_multiplier: parsedSedexMultiplier,
        melhor_envio_enabled: melhorEnvioEnabled,
        melhor_envio_token: melhorEnvioToken || null,
        is_active: true,
      };

      if (shippingConfigId) {
        const { error: shipError } = await supabase
          .from('shipping_config')
          .update(shippingData)
          .eq('id', shippingConfigId);
        if (shipError) throw shipError;
      } else {
        const { data: newRow, error: shipError } = await supabase
          .from('shipping_config')
          .insert(shippingData)
          .select()
          .single();
        if (shipError) throw shipError;
        if (newRow) setShippingConfigId(newRow.id);
      }

      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Configurações salvas!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingStore(false);
    }
  };

  if (!user || user.app_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return (
    <AdminShell eyebrow="Sistema" title="Configurações">
      <div className="w-full min-w-0 max-w-3xl space-y-10 sm:space-y-16">

        {/* ── Store Settings ── */}
        <section className="min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 text-[#d4af37]" />
            <h1 className="min-w-0 text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white break-words">
              Configurações da Loja
            </h1>
          </div>

          <form onSubmit={handleSaveStore} className="bg-[#0f0f0f]/60 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-6 sm:space-y-8">
            {/* Free Shipping */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Truck className="w-4 h-4 shrink-0 text-[#d4af37]" />
                <span className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Frete Grátis</span>
              </div>
              <div className="space-y-2">
                <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Valor mínimo para Frete Grátis (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={freeShippingThreshold}
                  onChange={e => setFreeShippingThreshold(e.target.value)}
                  className="bg-black/50 border-white/10 h-12"
                  placeholder="500"
                />
                <p className="text-white/20 text-[10px]">Valor exibido no carrinho e na página inicial como limite para frete grátis.</p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Offer Banner */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 shrink-0 text-[#d4af37]" />
                <span className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Banner de Oferta (Página Inicial)</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => setBannerEnabled(v => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${bannerEnabled ? 'bg-[#d4af37]' : 'bg-white/10'}`}
                  aria-label="Ativar/desativar banner"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bannerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`min-w-0 text-[11px] sm:text-xs font-bold uppercase tracking-widest break-words ${bannerEnabled ? 'text-[#d4af37]' : 'text-white/30'}`}>
                  {bannerEnabled ? 'Banner Ativo' : 'Banner Inativo'}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Badge / Título do Banner</Label>
                <Input
                  value={bannerBadge}
                  onChange={e => setBannerBadge(e.target.value)}
                  className="bg-black/50 border-white/10 h-12"
                  placeholder="Oferta Relâmpago"
                />
              </div>
              <div className="space-y-2">
                <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Texto da Oferta</Label>
                <Input
                  value={bannerText}
                  onChange={e => setBannerText(e.target.value)}
                  className="bg-black/50 border-white/10 h-12"
                  placeholder="Até 20% OFF em acessórios selecionados"
                />
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Shipping Config */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Truck className="w-4 h-4 shrink-0 text-[#d4af37]" />
                <span className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Cálculo de Frete do Mercado</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">CEP de Origem (Somente números)</Label>
                  <Input
                    value={originZip}
                    onChange={e => setOriginZip(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="bg-black/50 border-white/10 h-12"
                    placeholder="06233030"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Taxa Base (Contingência SP - R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseFee}
                    onChange={e => setBaseFee(e.target.value)}
                    className="bg-black/50 border-white/10 h-12"
                    placeholder="12.90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="block text-white/50 uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Multiplicador do Sedex (Contingência)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={sedexMultiplier}
                    onChange={e => setSedexMultiplier(e.target.value)}
                    className="bg-black/50 border-white/10 h-12"
                    placeholder="1.80"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => setMelhorEnvioEnabled(v => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${melhorEnvioEnabled ? 'bg-[#d4af37]' : 'bg-white/10'}`}
                    aria-label="Ativar cotação do Melhor Envio"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${melhorEnvioEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`min-w-0 text-[11px] sm:text-xs font-bold uppercase tracking-widest break-words ${melhorEnvioEnabled ? 'text-[#d4af37]' : 'text-white/30'}`}>
                    {melhorEnvioEnabled ? 'Melhor Envio Ativo' : 'Melhor Envio Inativo'}
                  </span>
                </div>
                <p className="text-white/20 text-[10px] leading-relaxed">
                  Ao ativar, o sistema consultará as tarifas reais das transportadoras (PAC, Sedex, Jadlog) no Melhor Envio. Desativado, usará a tabela fixa por Estado.
                </p>
              </div>

              {melhorEnvioEnabled && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Token de API do Melhor Envio</Label>
                  <Input
                    type="password"
                    value={melhorEnvioToken}
                    onChange={e => setMelhorEnvioToken(e.target.value)}
                    className="bg-black/50 border-white/10 h-12 font-mono text-xs"
                    placeholder="Token JWT do painel do Melhor Envio"
                  />
                  <p className="text-white/20 text-[10px]">Gerado nas configurações de desenvolvedor do seu painel do Melhor Envio.</p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSavingStore} className="w-full bg-[#d4af37] text-black font-bold text-xs sm:text-sm h-12 sm:h-14 rounded-xl hover:bg-[#f2ca50] transition-all whitespace-normal">
              {isSavingStore ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
            </Button>
          </form>
        </section>

        {/* ── Security ── */}
        <section className="min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 text-[#d4af37]" />
            <h1 className="min-w-0 text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white break-words">
              Segurança Admin
            </h1>
          </div>

          <form onSubmit={handleSaveAuth} className="bg-[#0f0f0f]/60 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-6">
            <div className="space-y-2">
              <Label className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">E-mail Administrativo</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/50 border-white/10 h-12" />
            </div>
            <div className="space-y-2">
              <Label className="block text-[#d4af37] uppercase tracking-widest text-[10px] font-bold leading-snug break-words">Nova Senha (deixe em branco para não alterar)</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/50 border-white/10 h-12" />
            </div>
            <Button type="submit" disabled={isSavingAuth} className="w-full bg-[#d4af37] text-black font-bold text-xs sm:text-sm h-12 sm:h-14 rounded-xl hover:bg-[#f2ca50] transition-all whitespace-normal">
              {isSavingAuth ? 'SALVANDO...' : 'ATUALIZAR CREDENCIAIS'}
            </Button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
};

export default AdminSettings;
