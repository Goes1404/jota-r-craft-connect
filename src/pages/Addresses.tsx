import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  ArrowLeft,
  Home,
  Building,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Addresses: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (addressData: any) => {
      if (!user) return;
      
      if (addressData.is_default) {
        // Unset other defaults first
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingId) {
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_addresses')
          .insert([{ ...addressData, user_id: user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        street: '', number: '', complement: '', neighborhood: '',
        city: '', state: '', zip_code: '', is_default: false
      });
      toast({ title: "Endereço salvo com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Erro ao salvar", 
        description: error.message 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({ title: "Endereço removido." });
    }
  });

  const handleZipChange = (value: string) => {
    setFormData(prev => ({ ...prev, zip_code: value }));
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      fetch(`https://viacep.com.br/ws/${digits}/json/`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.erro) {
            setFormData(prev => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
          }
        })
        .catch(() => {
          // Silent: user can still fill the address manually
        });
    }
  };

  const handleEdit = (address: any) => {
    setFormData({
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] -right-[5%] w-[40%] h-[40%] rounded-full bg-[#f2ca50] opacity-[0.02] blur-[120px]"></div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Perfil
            </button>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight">Meus <span className="text-[#d4af37] italic">Endereços</span></h1>
            <p className="text-white/30 text-sm font-medium">Gerencie seus locais de entrega para uma experiência de compra sem atritos.</p>
          </div>
          
          {!isAdding && (
            <Button 
              onClick={() => setIsAdding(true)}
              className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-4 md:px-8 py-6 rounded-2xl hover:bg-[#f2ca50] transition-all flex items-center gap-2 shadow-xl shadow-[#d4af37]/10"
            >
              <Plus className="w-4 h-4" /> Novo Endereço
            </Button>
          )}
        </div>

        {isAdding ? (
          <div className="bg-[#0f0f0f]/60 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl animate-luxury-in">
            <h2 className="text-2xl font-serif font-bold text-white mb-8">
              {editingId ? 'Editar Endereço' : 'Novo Endereço de Entrega'}
            </h2>
            
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">CEP</Label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="00000-000"
                  className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                  required
                />
                <p className="text-[10px] text-white/30 font-medium pt-1">
                  Digite o CEP e preenchemos o endereço para você.
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Logradouro (Rua/Avenida)</Label>
                <Input 
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Ex: Rua das Esmeraldas"
                  className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Número</Label>
                <Input 
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123"
                  className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Complemento</Label>
                <Input 
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto 42, Bloco B"
                  className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Bairro</Label>
                <Input 
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Seu Bairro"
                  className="bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Cidade / UF</Label>
                <div className="flex gap-4">
                  <Input 
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                    className="flex-1 bg-black/40 border-white/10 h-14 rounded-2xl text-white outline-none focus:border-[#d4af37]/40"
                    required
                  />
                  <Input 
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="UF"
                    maxLength={2}
                    className="w-20 bg-black/40 border-white/10 h-14 rounded-2xl text-white text-center outline-none focus:border-[#d4af37]/40"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 py-4">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${formData.is_default ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-white/10 bg-black/40'}`}
                >
                  {formData.is_default && <Check className="w-4 h-4" />}
                </button>
                <span className="text-xs text-white/60">Definir como endereço principal</span>
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-4 pt-8">
                <Button 
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest py-8 rounded-2xl hover:bg-[#f2ca50] transition-all"
                >
                  {saveMutation.isPending ? 'SALVANDO...' : (editingId ? 'ATUALIZAR ENDEREÇO' : 'SALVAR ENDEREÇO')}
                </Button>
                <Button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); }}
                  variant="ghost"
                  className="bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest py-8 rounded-2xl px-6 md:px-12"
                >
                  CANCELAR
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {addressesLoading ? (
              [1, 2].map(i => <div key={i} className="h-40 w-full bg-white/5 rounded-[32px] animate-pulse"></div>)
            ) : addresses && addresses.length > 0 ? (
              addresses.map((address: any) => (
                <div 
                  key={address.id} 
                  className={`bg-[#0f0f0f]/40 backdrop-blur-2xl border rounded-[32px] p-8 transition-all duration-500 relative overflow-hidden group ${address.is_default ? 'border-[#d4af37]/30' : 'border-white/5 hover:border-white/10'}`}
                >
                  {address.is_default && (
                    <div className="absolute top-0 right-0 bg-[#d4af37] text-black text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                      Principal
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${address.is_default ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'bg-black border border-white/5 text-white/20'}`}>
                        {address.number ? <Home className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-bold text-white">{address.street}, {address.number}</h3>
                        <p className="text-white/40 text-sm font-medium">
                          {address.neighborhood} {address.complement && `• ${address.complement}`}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                          <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {address.city} - {address.state}</span>
                          <span>{address.zip_code}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button 
                        onClick={() => handleEdit(address)}
                        variant="ghost" 
                        className="flex-1 md:w-12 h-12 rounded-xl bg-white/5 text-white/40 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex-1 md:w-12 h-12 rounded-xl bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0f0f0f] border border-white/10 rounded-[32px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-serif text-white">Remover endereço?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/40">
                              {address.street}, {address.number} — {address.city}/{address.state} será removido permanentemente da sua conta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(address.id)}
                              className="bg-red-500/90 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-4 md:px-8 text-center space-y-8 bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px]">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-white/10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-white">Nenhum endereço salvo</h3>
                  <p className="text-sm text-white/30 max-w-xs mx-auto">Adicione um endereço para agilizar o processo de entrega de suas peças.</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="bg-[#d4af37] text-black font-black text-[10px] uppercase tracking-widest px-10 py-6 rounded-full hover:bg-[#f2ca50] transition-all"
                >
                  Adicionar Endereço
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Addresses;
