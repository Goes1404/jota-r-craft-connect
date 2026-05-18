import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { StripeCardForm } from '@/components/StripeCardForm';
import { PaymentRequestButton } from '@/components/PaymentRequestButton';
import { useProducts } from '@/hooks/useProducts';
import { 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Lock, 
  ChevronLeft,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Loader2,
  AlertTriangle,
  Timer,
  MessageCircle,
  Plus,
  Sparkles,
  Zap,
  Diamond
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/config/constants';

const PIX_EXPIRATION_MINUTES = 30;

const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    const sum = digits.slice(0, len).split('').reduce((acc, d, i) => acc + Number(d) * (len + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
};

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart, addToCart } = useCart();
  const total = getTotalPrice();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allProducts = [] } = useProducts();
  
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64?: string; qrCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>();
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'aguardando' | 'pago' | 'expirado'>('aguardando');
  const [pixTimeLeft, setPixTimeLeft] = useState(PIX_EXPIRATION_MINUTES * 60);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [abandonedCartId, setAbandonedCartId] = useState<string | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shippingOption, setShippingOption] = useState<'normal' | 'express'>('express');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingOptions, setShippingOptions] = useState<{ id: string; name: string; price: number; deadline: string }[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const finalTotal = total + shippingCost - discount;

  const [createAccount, setCreateAccount] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    password: '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Smart Upsell Logic
  const upsellProducts = useMemo(() => {
    if (cartItems.length === 0) return [];
    const cartIds = cartItems.map(i => i.id);
    
    // Suggest items from 'Protection', 'Power' or 'Audio' categories that are NOT in cart
    return allProducts
      .filter(p => !cartIds.includes(p.id) && (p.category === 'Protection' || p.category === 'Power' || p.category === 'Audio'))
      .sort((a, b) => a.price - b.price) // Lower price first (impulse buy)
      .slice(0, 2);
  }, [allProducts, cartItems]);

  useEffect(() => {
    if (cartItems.length === 0 && !orderSuccess) {
      navigate('/produtos');
    }
  }, [cartItems, orderSuccess, navigate]);

  // Abandoned cart tracking
  useEffect(() => {
    if (cartItems.length === 0 || orderSuccess) return;
    
    const saveAbandonedCart = async () => {
      try {
        const db = supabase as any;
        if (abandonedCartId) {
          await db.from('abandoned_carts').update({
            email: user?.email || 'anon@checkout.com',
            phone: formData.phone,
            name: formData.fullName,
            cart_items: cartItems,
            total_amount: total,
            last_active_at: new Date().toISOString()
          }).eq('id', abandonedCartId);
        } else if (user?.email) {
          const { data } = await db.from('abandoned_carts').insert({
            user_id: user.id,
            email: user.email,
            phone: formData.phone,
            name: formData.fullName,
            cart_items: cartItems,
            total_amount: total
          }).select('id').single();

          if (data?.id) {
            setAbandonedCartId(data.id);
          }
        }
      } catch (err) {
        console.log('Abandoned cart tracking: error', err);
      }
    };

    const timeout = setTimeout(saveAbandonedCart, 2000);
    return () => clearTimeout(timeout);
  }, [cartItems, formData.phone, formData.fullName, user, total, abandonedCartId, orderSuccess]);

  // PIX and Status Logic... (remains same as before but keeping it for context)
  useEffect(() => {
    if (!orderSuccess || paymentMethod !== 'pix' || paymentStatus === 'pago') return;
    timerRef.current = setInterval(() => {
      setPixTimeLeft(prev => {
        if (prev <= 1) {
          setPaymentStatus('expirado');
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [orderSuccess, paymentMethod, paymentStatus]);

  useEffect(() => {
    if (!createdOrderId || !orderSuccess || paymentStatus === 'expirado') return;
    const checkPaymentStatus = async () => {
      const { data } = await supabase.from('orders').select('status').eq('id', createdOrderId).single();
      if (data?.status === 'Pago') {
        setPaymentStatus('pago');
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    pollingRef.current = setInterval(checkPaymentStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [createdOrderId, orderSuccess, paymentStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setFormData({ ...formData, cpf: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
    setFormData({ ...formData, phone: value });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, '')}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        if (data.erro) {
          toast.error('CEP não encontrado. Verifique o número digitado.');
        } else {
          setFormData(prev => ({ ...prev, address: data.logradouro || prev.address, neighborhood: data.bairro || prev.neighborhood, city: data.localidade || prev.city, state: data.uf || prev.state }));
          toast.success('Endereço autocompletado!');

          // Fetch real shipping rates from edge function
          setIsCalculatingShipping(true);
          try {
            const { data: shippingData } = await supabase.functions.invoke('shipping-calculate', {
              body: { cep: value.replace(/\D/g, ''), productValue: total },
            });
            if (shippingData?.options?.length) {
              const opts = shippingData.options.map((o: any, idx: number) => ({
                id: idx === 0 ? 'normal' : 'express',
                name: o.name ?? (idx === 0 ? 'Normal' : 'Expressa'),
                price: typeof o.price === 'number' ? o.price : (idx === 0 ? 15.90 : 0),
                deadline: o.deadline ?? (idx === 0 ? '7 a 10 dias úteis' : '2 a 4 dias úteis'),
              }));
              setShippingOptions(opts);
              // Default to first option
              setShippingOption('normal');
              setShippingCost(opts[0].price);
            }
          } catch {
            // Shipping fetch failed — keep UI defaults
          } finally {
            setIsCalculatingShipping(false);
          }
        }
      } catch (error) {
        toast.error('Não foi possível buscar o CEP. Preencha o endereço manualmente.');
      }
    }
  };

  // Apple Pay / Google Pay — cria o pedido e retorna o clientSecret.
  // A confirmação do pagamento é feita pelo PaymentRequestButton (que tem acesso ao stripe).
  const createWalletOrder = async (paymentMethodId: string): Promise<{ clientSecret: string } | null> => {
    if (!isValidCPF(formData.cpf)) {
      toast.error('CPF inválido. Preencha o formulário antes de usar Apple Pay / Google Pay.');
      return null;
    }
    if (!formData.fullName || !formData.email || !formData.cep || !formData.address) {
      toast.error('Preencha os dados de entrega antes de usar o pagamento expresso.');
      return null;
    }
    if (!acceptedTerms) {
      toast.error('Aceite os Termos e Condições para continuar.');
      return null;
    }

    setIsProcessing(true);
    try {
      const { data: currentProducts } = await supabase
        .from('products')
        .select('id, name, stock')
        .in('id', cartItems.map(i => i.id));

      for (const cartItem of cartItems) {
        const product = currentProducts?.find(p => p.id === cartItem.id);
        if (!product || product.stock < cartItem.quantity) {
          toast.error(`Estoque insuficiente para "${cartItem.name}". Disponível: ${product?.stock ?? 0}`);
          return null;
        }
      }

      let finalUserId = user?.id || null;
      if (!user && createAccount && formData.password) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.fullName } }
        });
        if (signUpError) throw signUpError;
        if (signUpData.user) finalUserId = signUpData.user.id;
      }

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: finalUserId,
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        customer_email: formData.email,
        total_amount: finalTotal,
        status: 'Aguardando Pagamento',
        shipping_address: `${formData.address}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''} — ${formData.neighborhood}, ${formData.city}/${formData.state} (${formData.cep})`,
        payment_method: 'credit_card'
      } as any).select().single();

      if (orderError) throw orderError;

      const orderId = orderData.id;
      setCreatedOrderId(orderId);

      await supabase.from('order_items').insert(
        cartItems.map(item => ({
          order_id: orderId,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      );

      const { data: stripeResult } = await supabase.functions.invoke('create-stripe-payment', {
        body: { orderId, totalAmount: finalTotal }
      });

      if (!stripeResult?.success || !stripeResult.clientSecret) {
        throw new Error('Falha ao iniciar pagamento via carteira digital.');
      }

      return { clientSecret: stripeResult.clientSecret };
    } catch (error: any) {
      toast.error('Erro ao preparar pagamento: ' + error.message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!isValidCPF(formData.cpf)) {
      toast.error('CPF inválido. Verifique os números digitados.');
      return;
    }

    if (!formData.email) {
      toast.error('E-mail é obrigatório.');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Você deve aceitar os Termos e Condições para continuar.');
      return;
    }

    setIsProcessing(true);

    try {
      // Validate stock before creating the order
      const { data: currentProducts } = await supabase
        .from('products')
        .select('id, name, stock')
        .in('id', cartItems.map(i => i.id));

      for (const cartItem of cartItems) {
        const product = currentProducts?.find(p => p.id === cartItem.id);
        if (!product || product.stock < cartItem.quantity) {
          toast.error(`Estoque insuficiente para "${cartItem.name}". Disponível: ${product?.stock ?? 0}`);
          setIsProcessing(false);
          return;
        }
      }

      let finalUserId = user?.id || null;

      if (!user && createAccount && formData.password) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });
        if (signUpError) {
          toast.error('Erro ao criar conta: ' + signUpError.message);
          setIsProcessing(false);
          return;
        }
        if (signUpData.user) {
          finalUserId = signUpData.user.id;
        }
      }

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: finalUserId,
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        customer_email: formData.email,
        total_amount: finalTotal,
        status: 'Aguardando Pagamento',
        shipping_address: `${formData.address}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''} — ${formData.neighborhood}, ${formData.city}/${formData.state} (${formData.cep})`,
        payment_method: paymentMethod
      } as any).select().single();

      if (orderError) throw orderError;
      const orderId = orderData.id;
      setCreatedOrderId(orderId);

      await supabase.from('order_items').insert(cartItems.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })));

      if (paymentMethod === 'pix') {
        const { data: pixResult } = await supabase.functions.invoke('create-pix-payment', {
          body: { orderId: orderId, totalAmount: finalTotal, payerEmail: formData.email || user?.email }
        });
        if (pixResult?.success && pixResult.pix) {
          setPixData({ qrCodeBase64: pixResult.pix.qrCodeBase64, qrCode: pixResult.pix.qrCode });
          await supabase.from('orders').update({
            pix_qr_code: pixResult.pix.qrCodeBase64,
            pix_qr_code_text: pixResult.pix.qrCode,
            payment_intent_id: String(pixResult.pix.paymentId),
          }).eq('id', orderId);
        }
      } else {
        const { data: stripeResult } = await supabase.functions.invoke('create-stripe-payment', {
          body: { orderId: orderId, totalAmount: finalTotal }
        });
        if (stripeResult?.success && stripeResult.clientSecret) {
          setStripeClientSecret(stripeResult.clientSecret);
          await supabase.from('orders').update({ payment_intent_id: stripeResult.paymentIntentId }).eq('id', orderId);
        }
      }

      if (abandonedCartId) {
        await (supabase as any).from('abandoned_carts').update({ status: 'purchased' }).eq('id', abandonedCartId);
      }

      clearCart();
      setOrderSuccess(true);
    } catch (error: any) {
      toast.error('Erro ao processar pedido: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    const isPaid = paymentStatus === 'pago';
    const isExpired = paymentStatus === 'expirado';
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pt-32 pb-20">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border animate-in zoom-in duration-700 ${isPaid ? 'bg-green-500/10 border-green-500/20' : isExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-[#d4af37]/10 border-[#d4af37]/20'}`}>
            {isPaid ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : isExpired ? <AlertTriangle className="w-12 h-12 text-red-400" /> : <Clock className="w-12 h-12 text-[#d4af37] animate-pulse" />}
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4">{isPaid ? 'Pagamento Confirmado!' : isExpired ? 'PIX Expirado' : 'Aguardando Pagamento'}</h1>
          <p className="text-white/40 max-w-md mb-8 leading-relaxed">
            {isPaid ? 'Seu pagamento foi recebido! Estamos preparando seu envio.' : isExpired ? 'O PIX expirou. Refaça o pedido.' : 'Pague o PIX abaixo para garantir seu estoque.'}
          </p>

          {paymentMethod === 'pix' && !isPaid && !isExpired && (
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[40px] mb-10 w-full max-w-sm">
              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
                {pixData?.qrCodeBase64 && <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code" className="w-full h-full object-contain" />}
              </div>
              <Button onClick={() => { navigator.clipboard.writeText(pixData?.qrCode || ''); setCopied(true); setTimeout(() => setCopied(false), 3000); }} className="w-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] h-12 rounded-xl">
                {copied ? 'Copiado!' : 'Copiar Código PIX'}
              </Button>
            </div>
          )}

          {paymentMethod === 'credit_card' && !isPaid && stripeClientSecret && (
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[40px] mb-10 w-full max-w-md text-left">
              <h2 className="text-xl font-bold text-white mb-6">Dados do Cartão</h2>
              <StripeCardForm
                clientSecret={stripeClientSecret}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onSuccess={() => {
                  setPaymentStatus('pago');
                  toast.success('Pagamento confirmado com sucesso!');
                }}
                onError={(msg) => toast.error(msg)}
                onSubmit={() => {}}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate('/pedidos')} className="bg-[#d4af37] text-black h-14 rounded-full px-12 font-bold uppercase tracking-widest text-[10px]">Acompanhar Pedido</Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="text-white/40 hover:text-white uppercase tracking-[0.2em] text-[10px] h-14">Voltar para Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      <main className="max-w-screen-2xl mx-auto px-6 py-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Form Side */}
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/20 hover:text-[#d4af37] text-[10px] font-black uppercase tracking-widest">
                <ChevronLeft className="w-4 h-4" /> Voltar ao Carrinho
              </button>
              <h1 className="text-4xl font-serif font-black text-white">Finalizar Compra</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full w-fit">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Checkout 100% Seguro</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-10">
              {/* Delivery */}
              <div className="bg-[#0a0a0a] border border-white/5 p-8 md:p-12 rounded-[48px] space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Endereço de Entrega</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Nome Completo</Label>
                    <Input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">E-mail</Label>
                    <Input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">CPF</Label>
                    <Input required name="cpf" value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Telefone</Label>
                    <Input required name="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">CEP</Label>
                    <Input required name="cep" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Bairro</Label>
                    <Input required name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Cidade</Label>
                    <Input required name="city" value={formData.city} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Endereço</Label>
                    <Input required name="address" value={formData.address} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Número</Label>
                    <Input required name="number" value={formData.number} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Complemento</Label>
                    <Input name="complement" value={formData.complement} onChange={handleInputChange} placeholder="Apto 101, etc." className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>

                  {!user && (
                    <div className="md:col-span-2 pt-6 border-t border-white/5 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${createAccount ? 'bg-[#d4af37]' : 'bg-white/5 border border-white/10 group-hover:border-white/30'}`}>
                          {createAccount && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
                        <span className="text-[11px] font-bold text-white/60">Criar uma conta para acompanhar meu pedido (opcional)</span>
                      </label>
                      {createAccount && (
                        <div className="space-y-3 animate-in fade-in">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Senha para sua nova conta</Label>
                          <Input required type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Sua senha" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-[#0a0a0a] border border-white/5 p-8 md:p-12 rounded-[48px] space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Forma de Pagamento</h2>
                </div>

                <PaymentRequestButton
                  amount={finalTotal}
                  label="JR Acessórios"
                  onCreateOrder={createWalletOrder}
                  onSuccess={() => {
                    clearCart();
                    setPaymentStatus('pago');
                    setOrderSuccess(true);
                    toast.success('Pagamento via carteira digital confirmado!');
                  }}
                  onError={(msg) => toast.error(msg)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button type="button" onClick={() => setPaymentMethod('pix')} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'pix' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-4">
                      <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-[#25D366]' : 'text-white/20'}`} />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-white">PIX</p>
                        <p className="text-[9px] text-white/40">Aprovação em segundos</p>
                      </div>
                    </div>
                    {paymentMethod === 'pix' && <CheckCircle2 className="w-5 h-5 text-[#25D366]" />}
                  </button>

                  <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'credit_card' ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-4">
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'credit_card' ? 'text-[#d4af37]' : 'text-white/20'}`} />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-white">Cartão</p>
                        <p className="text-[9px] text-white/40">Até 10x sem juros</p>
                      </div>
                    </div>
                    {paymentMethod === 'credit_card' && <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all ${acceptedTerms ? 'bg-[#d4af37]' : 'bg-white/5 border border-white/10 group-hover:border-white/30'}`}>
                    {acceptedTerms && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                  <span className="text-[10px] text-white/40 leading-relaxed">
                    Eu li e concordo com os <a href="#" className="text-[#d4af37] hover:underline">Termos e Condições</a> e a <a href="#" className="text-[#d4af37] hover:underline">Política de Privacidade</a> da JR Acessórios. *
                  </span>
                </label>
              </div>

              <Button type="submit" disabled={isProcessing} className="w-full h-20 bg-[#d4af37] text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] shadow-2xl shadow-[#d4af37]/10 hover:bg-[#f2ca50] transition-all">
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Finalizar Pedido — R$ ${finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </Button>
            </form>
          </div>

          {/* Summary Side */}
          <div className="w-full lg:w-[450px] space-y-8">
            <div className="bg-[#0f0f0f] border border-white/5 p-8 md:p-10 rounded-[48px] sticky top-32">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/30 mb-8">Sua Seleção</h2>
              
              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 p-2">
                      <img src={item.image} className="w-full h-full object-contain mix-blend-lighten" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold text-[#d4af37]">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>

              {/* Lumina Upsell Intelligence Section */}
              {upsellProducts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in duration-1000">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Lumina Recommendations</span>
                  </div>
                  <div className="space-y-4">
                    {upsellProducts.map(product => (
                      <div key={product.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-[24px] flex items-center justify-between group hover:border-[#d4af37]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black p-1">
                            <img src={product.image} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white leading-tight">{product.name}</p>
                            <p className="text-[9px] text-[#d4af37] font-bold mt-0.5">+ R$ {product.price.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => { addToCart(product); toast.success(`${product.name} adicionado!`); }}
                          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Opções de Entrega</Label>
                    {isCalculatingShipping && <Loader2 className="w-3 h-3 text-[#d4af37] animate-spin" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(shippingOptions.length > 0 ? shippingOptions : [
                      { id: 'normal', name: 'Normal', price: 15.90, deadline: '7 a 10 dias úteis' },
                      { id: 'express', name: 'Expressa', price: 0, deadline: '2 a 4 dias úteis' },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setShippingOption(opt.id as 'normal' | 'express'); setShippingCost(opt.price); }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${shippingOption === opt.id ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/5 bg-white/[0.02]'}`}
                      >
                        <p className="text-[10px] font-bold text-white uppercase">{opt.name}</p>
                        <p className="text-[9px] text-white/40 mt-1">{opt.deadline}</p>
                        <p className={`text-[10px] font-bold mt-2 ${opt.price === 0 ? 'text-green-500' : 'text-[#d4af37]'}`}>
                          {opt.price === 0 ? 'Grátis' : `R$ ${opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Código" className="bg-white/5 border-white/10 h-12 rounded-xl flex-1 uppercase" />
                    <Button type="button" onClick={async () => {
                      if (!couponCode.trim()) return;
                      const { data, error } = await (supabase as any).rpc('apply_coupon', { p_code: couponCode.trim() });
                      const result = data?.[0];
                      if (!error && result?.valid) {
                        setDiscount(total * (result.discount_percentage / 100));
                        toast.success(`Cupom aplicado: ${result.discount_percentage}% OFF!`);
                      } else {
                        setDiscount(0);
                        toast.error(result?.message || 'Cupom inválido.');
                      }
                    }} className="h-12 bg-white/10 text-white rounded-xl font-bold text-[10px] px-6 uppercase hover:bg-white/20">Aplicar</Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span>Subtotal</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span>Frete</span>
                  <span className={shippingCost === 0 ? "text-green-500" : ""}>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                    <span>Desconto</span>
                    <span>- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-6 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Valor Total</p>
                    <p className="text-3xl font-serif font-black text-white">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Diamond className="w-6 h-6 text-[#d4af37]/20" />
                </div>
              </div>
            </div>

            {/* Social Proof / Urgency */}
            <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 p-6 rounded-[32px] flex items-center gap-4">
              <Zap className="w-5 h-5 text-[#d4af37] animate-pulse" />
              <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">
                <span className="text-[#d4af37]">Oferta Garantida:</span> Reservamos seus itens por 30 minutos.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
