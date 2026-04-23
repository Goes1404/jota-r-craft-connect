import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Lock, 
  ChevronLeft,
  Truck,
  CheckCircle2
} from 'lucide-react';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    city: '',
    state: ''
  });

  // Credit Card State
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio.');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para finalizar a compra.');
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create the order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: paymentMethod === 'pix' ? 'Aguardando PIX' : 'Processando Cartão',
          shipping_address: `${formData.address}, ${formData.number} - ${formData.city}/${formData.state} (${formData.cep})`,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Simulate network request to Payment Gateway
      await new Promise(resolve => setTimeout(resolve, 2000));

      setOrderSuccess(true);
      clearCart();
      
    } catch (error: any) {
      toast.error('Erro ao processar pedido: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pt-32">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4">Pedido Confirmado!</h1>
          <p className="text-white/60 max-w-md mb-8">
            Sua aquisição exclusiva foi registrada com sucesso. 
            Você receberá os detalhes da entrega em seu e-mail em instantes.
          </p>
          {paymentMethod === 'pix' && (
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[32px] mb-8 w-full max-w-md">
              <h3 className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] mb-4">Escaneie para pagar</h3>
              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
                <QrCode className="w-full h-full text-black" />
              </div>
              <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-xs">
                Copiar Código PIX
              </Button>
            </div>
          )}
          <Button 
            onClick={() => navigate('/pedidos')}
            className="bg-[#d4af37] text-black hover:bg-[#f2ca50] rounded-full px-8 font-bold uppercase tracking-widest text-[10px] h-12"
          >
            Acompanhar Pedido
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      {/* Background Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] rounded-full bg-[#d4af37] opacity-[0.03] blur-[120px]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-4 mb-12">
          <ShieldCheck className="w-8 h-8 text-[#d4af37]" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Checkout Seguro</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Ambiente Criptografado 256-bit
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Delivery Section */}
            <section className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <Truck className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-serif font-bold text-white">Dados de Entrega</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nome Completo</Label>
                  <Input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">CPF</Label>
                  <Input required name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Telefone (WhatsApp)</Label>
                  <Input required name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">CEP</Label>
                  <Input required name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Endereço</Label>
                  <Input required name="address" value={formData.address} onChange={handleInputChange} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Número</Label>
                  <Input required name="number" value={formData.number} onChange={handleInputChange} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cidade</Label>
                  <Input required name="city" value={formData.city} onChange={handleInputChange} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Estado (UF)</Label>
                  <Input required name="state" value={formData.state} onChange={handleInputChange} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40" />
                </div>
              </div>
            </section>

            {/* Payment Section */}
            <section className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <CreditCard className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-serif font-bold text-white">Método de Pagamento</h2>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-[#25D366] bg-[#25D366]/5 text-[#25D366]' 
                      : 'border-white/5 bg-black/40 text-white/40 hover:border-white/20'
                  }`}
                >
                  <QrCode className="w-8 h-8 mb-3" />
                  <span className="text-xs font-bold uppercase tracking-widest">PIX</span>
                  <span className="text-[9px] mt-1 opacity-70">Aprovação Imediata</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'credit_card' 
                      ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]' 
                      : 'border-white/5 bg-black/40 text-white/40 hover:border-white/20'
                  }`}
                >
                  <CreditCard className="w-8 h-8 mb-3" />
                  <span className="text-xs font-bold uppercase tracking-widest">Cartão</span>
                  <span className="text-[9px] mt-1 opacity-70">Até 10x Sem Juros</span>
                </button>
              </div>

              {/* Credit Card Form (Conditional) */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 fade-in">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Número do Cartão</Label>
                    <Input required name="number" value={cardData.number} onChange={handleCardChange} placeholder="0000 0000 0000 0000" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40 font-mono" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nome Impresso no Cartão</Label>
                    <Input required name="name" value={cardData.name} onChange={handleCardChange} placeholder="NOME DO TITULAR" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40 uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Validade</Label>
                      <Input required name="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="MM/AA" className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40 font-mono" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">CVC</Label>
                      <Input required name="cvc" value={cardData.cvc} onChange={handleCardChange} placeholder="123" type="password" maxLength={4} className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40 font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* PIX Instructions (Conditional) */}
              {paymentMethod === 'pix' && (
                <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-2xl p-6 text-center animate-in slide-in-from-top-4 fade-in">
                  <p className="text-[#25D366] text-sm font-medium mb-2">Pague via PIX e ganhe prioridade no envio.</p>
                  <p className="text-white/40 text-xs">O QR Code será gerado na próxima tela após a confirmação do pedido.</p>
                </div>
              )}

            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 sticky top-32">
              <h2 className="text-xl font-serif font-bold text-white mb-8 border-b border-white/5 pb-6">Resumo do Pedido</h2>
              
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/5 overflow-hidden flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.name}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Qtd: {item.quantity}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-serif font-black text-[#d4af37]">
                        R$ {(item.product.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6 mb-8">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Subtotal</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>Frete Expresso Seguro</span>
                  <span className="text-green-400 font-bold">Grátis</span>
                </div>
                <div className="flex justify-between text-2xl font-serif font-black text-white pt-4 border-t border-white/5">
                  <span>Total</span>
                  <span className="text-[#d4af37]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isProcessing || items.length === 0}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                {isProcessing ? 'Processando Autenticação...' : (
                  <>
                    <Lock className="w-4 h-4" /> 
                    {paymentMethod === 'pix' ? 'Gerar PIX e Finalizar' : 'Pagar com Cartão Seguro'}
                  </>
                )}
              </Button>
              
              <p className="text-center text-[9px] uppercase tracking-widest text-white/20 mt-6 flex justify-center items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Proteção Total ao Comprador
              </p>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
