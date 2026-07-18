import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { STORE } from '@/config/store';
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
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItemCount, setOrderItemCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const [abandonedCartId, setAbandonedCartId] = useState<string | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shippingOption, setShippingOption] = useState<'normal' | 'express'>('express');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingOptions, setShippingOptions] = useState<{ id: string; name: string; price: number; deadline: string }[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Desconto PIX de 5% — honra a promessa exibida na home e na página do
  // produto ("5% OFF no PIX"). Aplica sobre a mercadoria (não sobre o frete).
  const PIX_DISCOUNT_RATE = 0.05;
  const pixDiscount = paymentMethod === 'pix'
    ? Math.round((total - discount) * PIX_DISCOUNT_RATE * 100) / 100
    : 0;
  // cardTotal: valor sem desconto PIX — usado pelas carteiras digitais
  // (Apple/Google Pay), que são trilho de cartão independente do método selecionado.
  const cardTotal = total + shippingCost - discount;
  const finalTotal = cardTotal - pixDiscount;

  const [createAccount, setCreateAccount] = useState(false);
  // Snapshot dos itens no momento da compra — permite "Gerar novo PIX" quando expira
  const [orderItemsSnapshot, setOrderItemsSnapshot] = useState<typeof cartItems>([]);
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
    if (!createdOrderId || !orderSuccess || paymentStatus === 'expirado' || paymentStatus === 'pago') return;

    // Escuta em tempo real mudanças no status do pedido específico
    const channel = supabase
      .channel(`order-status-${createdOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${createdOrderId}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'Pago') {
            setPaymentStatus('pago');
            toast.success('Pagamento confirmado com sucesso!');
          }
        }
      )
      .subscribe();

    // Fallback: faz verificação manual a cada 10 segundos caso a conexão Realtime caia
    const checkInterval = setInterval(async () => {
      const { data } = await supabase.rpc('get_order_status', { p_order_id: createdOrderId } as any);
      if (data === 'Pago') {
        setPaymentStatus('pago');
      }
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(checkInterval);
    };
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
          setTimeout(() => numberInputRef.current?.focus(), 100);

          // Fetch real shipping rates from edge function
          setIsCalculatingShipping(true);
          try {
            const { data: shippingData } = await supabase.functions.invoke('shipping-calculate', {
              body: {
                cep: value.replace(/\D/g, ''),
                productValue: total,
                items: cartItems.map(i => ({ id: i.id, quantity: i.quantity })),
              },
            });
            if (shippingData?.options?.length) {
              const opts = shippingData.options.map((o: any, idx: number) => ({
                id: idx === 0 ? 'normal' : 'express',
                name: o.name ?? (idx === 0 ? 'Normal' : 'Expressa'),
                price: typeof o.price === 'number' ? o.price : (idx === 0 ? 15.90 : 0),
                // A função shipping-calculate retorna o prazo em `days` (e `arrivalLabel`),
                // não em `deadline`. Preferimos o prazo real; caímos no texto fixo só se faltar.
                deadline: o.days ?? o.arrivalLabel ?? o.deadline ?? (idx === 0 ? '7 a 10 dias úteis' : '2 a 4 dias úteis'),
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

      const { data: rpcOrderId, error: orderError } = await supabase.rpc('create_order', {
        p_customer_name: formData.fullName,
        p_customer_email: formData.email,
        p_customer_phone: formData.phone,
        p_shipping_address: `${formData.address}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''} — ${formData.neighborhood}, ${formData.city}/${formData.state} (${formData.cep})`,
        p_payment_method: 'credit_card',
        p_items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        p_total_amount: finalTotal,
      } as any);

      if (orderError) throw orderError;

      const orderId = rpcOrderId as unknown as string;
      setCreatedOrderId(orderId);

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

      const { data: rpcOrderId, error: orderError } = await supabase.rpc('create_order', {
        p_customer_name: formData.fullName,
        p_customer_email: formData.email,
        p_customer_phone: formData.phone,
        p_shipping_address: `${formData.address}, ${formData.number} ${formData.complement ? '- ' + formData.complement : ''} — ${formData.neighborhood}, ${formData.city}/${formData.state} (${formData.cep})`,
        p_payment_method: paymentMethod,
        p_items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        p_total_amount: finalTotal,
      } as any);

      if (orderError) throw orderError;
      const orderId = rpcOrderId as unknown as string;
      setCreatedOrderId(orderId);

      if (paymentMethod === 'pix') {
        const { data: pixResult, error: pixFnError } = await supabase.functions.invoke('create-pix-payment', {
          body: {
            orderId: orderId,
            totalAmount: finalTotal,
            payerEmail: formData.email || user?.email,
            payerCpf: formData.cpf,
            payerName: formData.fullName,
          }
        });
        if (pixFnError) throw new Error(pixFnError.message || 'Erro ao chamar serviço PIX.');
        if (!pixResult?.success) {
          throw new Error(pixResult?.error || 'Falha ao gerar QR Code PIX. Tente novamente.');
        }
        if (!pixResult.pix?.qrCodeBase64 && !pixResult.pix?.qrCode) {
          throw new Error('QR Code PIX não retornado pelo banco. Verifique a integração MercadoPago.');
        }
        setPixData({ qrCodeBase64: pixResult.pix.qrCodeBase64, qrCode: pixResult.pix.qrCode });
        await supabase.from('orders').update({
          pix_qr_code: pixResult.pix.qrCodeBase64,
          pix_qr_code_text: pixResult.pix.qrCode,
          payment_intent_id: String(pixResult.pix.paymentId),
        }).eq('id', orderId);
      } else {
        const { data: stripeResult } = await supabase.functions.invoke('create-stripe-payment', {
          body: { orderId: orderId, totalAmount: finalTotal }
        });
        if (!stripeResult?.success || !stripeResult.clientSecret) {
          throw new Error(stripeResult?.error || 'Falha ao iniciar pagamento via cartão. Tente novamente.');
        }
        setStripeClientSecret(stripeResult.clientSecret);
        await supabase.from('orders').update({ payment_intent_id: stripeResult.paymentIntentId }).eq('id', orderId);
      }

      if (abandonedCartId) {
        await (supabase as any).from('abandoned_carts').update({ status: 'purchased' }).eq('id', abandonedCartId);
      }

      setOrderTotal(finalTotal);
      setOrderItemCount(cartItems.reduce((acc, i) => acc + i.quantity, 0));
      setOrderItemsSnapshot(cartItems);
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
          <p className="text-white/40 max-w-md mb-2 leading-relaxed">
            {isPaid ? 'Seu pagamento foi recebido! Estamos preparando seu envio.' : isExpired ? 'O PIX expirou, mas seus itens estão guardados — gere um novo código abaixo.' : 'Escaneie o QR Code ou copie o código para pagar.'}
          </p>
          {createdOrderId && (
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d4af37]/60 mb-8">
              Pedido #{createdOrderId.slice(0, 8).toUpperCase()}
            </p>
          )}

          {/* Resumo do valor — sempre visível */}
          <div className="bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/20 rounded-3xl px-8 py-6 mb-8 w-full max-w-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]/60 mb-1">Valor Total</p>
            <p className="text-4xl font-serif font-black text-[#d4af37] drop-shadow-[0_0_16px_rgba(212,175,55,0.25)]">
              R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {orderItemCount > 0 && (
              <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                {orderItemCount} {orderItemCount === 1 ? 'item' : 'itens'}
              </p>
            )}
          </div>

          {paymentMethod === 'pix' && !isPaid && !isExpired && (
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[40px] mb-10 w-full max-w-sm">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20">
                  <Timer className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-sm font-bold tabular-nums text-[#d4af37]">
                    Expira em {String(Math.floor(pixTimeLeft / 60)).padStart(2, '0')}:{String(pixTimeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
                {pixData?.qrCodeBase64
                  ? <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
                  : <div className="flex flex-col items-center gap-3 text-zinc-400"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs font-medium">Gerando QR Code…</span></div>}
              </div>

              <p className="text-center text-[10px] text-white/20 font-medium mb-4 uppercase tracking-widest">ou use o código abaixo</p>

              {/* Botão Copiar */}
              <Button
                onClick={() => { navigator.clipboard.writeText(pixData?.qrCode || ''); setCopied(true); setTimeout(() => setCopied(false), 3000); }}
                disabled={!pixData?.qrCode}
                className="w-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] h-12 rounded-xl disabled:opacity-40 hover:bg-[#25D366]/20 transition-all"
              >
                {copied
                  ? <><Check className="w-4 h-4 mr-2" /> Código PIX Copiado!</>
                  : <><Copy className="w-4 h-4 mr-2" /> Copiar Código PIX (Copia e Cola)</>}
              </Button>

              {/* Passo a passo */}
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Como pagar</p>
                {[
                  { icon: '📱', title: 'Abra o app do seu banco', desc: 'Acesse a área PIX no menu principal' },
                  { icon: '📷', title: 'Escaneie o QR Code', desc: 'Ou escolha "PIX Copia e Cola" e cole o código copiado' },
                  { icon: '✅', title: 'Confirme o pagamento', desc: 'Revise o valor e o destinatário, depois confirme' },
                  { icon: '⚡', title: 'Aprovação automática', desc: 'Seu pedido é confirmado em segundos — sem espera' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/10 flex items-center justify-center text-sm shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white/70 leading-tight">{step.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nota de segurança */}
              <div className="mt-6 flex items-center gap-2 text-white/20">
                <Lock className="w-3 h-3 shrink-0" />
                <p className="text-[9px] leading-relaxed">Transação 100% segura. O valor exibido acima é o único que será cobrado.</p>
              </div>
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
            {isExpired && orderItemsSnapshot.length > 0 && (
              <Button
                onClick={() => {
                  orderItemsSnapshot.forEach(item => {
                    for (let i = 0; i < item.quantity; i++) addToCart(item);
                  });
                  setOrderSuccess(false);
                  setPaymentStatus('aguardando');
                  setPixData(null);
                  setPixTimeLeft(PIX_EXPIRATION_MINUTES * 60);
                }}
                className="bg-[#d4af37] text-black h-14 rounded-full px-12 font-bold uppercase tracking-widest text-[10px]"
              >
                Gerar Novo PIX
              </Button>
            )}
            <Button
              onClick={() => navigate(user ? '/pedidos' : `/pedidos?orderId=${createdOrderId}`)}
              className={isExpired && orderItemsSnapshot.length > 0
                ? 'bg-white/10 text-white h-14 rounded-full px-12 font-bold uppercase tracking-widest text-[10px] hover:bg-white/20'
                : 'bg-[#d4af37] text-black h-14 rounded-full px-12 font-bold uppercase tracking-widest text-[10px]'}
            >
              Acompanhar Pedido
            </Button>
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
      
      <main id="conteudo" tabIndex={-1} className="max-w-screen-2xl mx-auto px-6 py-32 relative z-10">
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
                    <Label htmlFor="checkout-fullName" className="text-[9px] font-black uppercase tracking-widest text-white/30">Nome Completo</Label>
                    <Input id="checkout-fullName" required name="fullName" autoComplete="name" value={formData.fullName} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="checkout-email" className="text-[9px] font-black uppercase tracking-widest text-white/30">E-mail</Label>
                    <Input id="checkout-email" required type="email" name="email" autoComplete="email" inputMode="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-cpf" className="text-[9px] font-black uppercase tracking-widest text-white/30">CPF</Label>
                    <Input id="checkout-cpf" required name="cpf" inputMode="numeric" maxLength={14} value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-phone" className="text-[9px] font-black uppercase tracking-widest text-white/30">Telefone</Label>
                    <Input id="checkout-phone" required type="tel" name="phone" inputMode="tel" autoComplete="tel-national" value={formData.phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-cep" className="text-[9px] font-black uppercase tracking-widest text-white/30">CEP</Label>
                    <Input id="checkout-cep" required name="cep" inputMode="numeric" maxLength={9} autoComplete="postal-code" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-neighborhood" className="text-[9px] font-black uppercase tracking-widest text-white/30">Bairro</Label>
                    <Input id="checkout-neighborhood" required name="neighborhood" autoComplete="address-level3" value={formData.neighborhood} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-city" className="text-[9px] font-black uppercase tracking-widest text-white/30">Cidade</Label>
                    <Input id="checkout-city" required name="city" autoComplete="address-level2" value={formData.city} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="checkout-address" className="text-[9px] font-black uppercase tracking-widest text-white/30">Endereço</Label>
                    <Input id="checkout-address" required name="address" autoComplete="address-line1" value={formData.address} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-number" className="text-[9px] font-black uppercase tracking-widest text-white/30">Número</Label>
                    <Input id="checkout-number" ref={numberInputRef} required name="number" inputMode="numeric" value={formData.number} onChange={handleInputChange} className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="checkout-complement" className="text-[9px] font-black uppercase tracking-widest text-white/30">Complemento</Label>
                    <Input id="checkout-complement" name="complement" autoComplete="address-line2" value={formData.complement} onChange={handleInputChange} placeholder="Apto 101, etc." className="bg-white/5 border-white/10 h-14 rounded-2xl" />
                  </div>

                  {!user && (
                    <div className="md:col-span-2 pt-6 border-t border-white/5 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="peer sr-only" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
                        <div aria-hidden="true" className={`w-5 h-5 rounded flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4af37] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black ${createAccount ? 'bg-[#d4af37]' : 'bg-white/5 border border-white/10 group-hover:border-white/30'}`}>
                          {createAccount && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <span className="text-[11px] font-bold text-white/60">Criar uma conta para acompanhar meu pedido (opcional)</span>
                      </label>
                      {createAccount && (
                        <div className="space-y-3 animate-in fade-in">
                          <Label htmlFor="checkout-password" className="text-[9px] font-black uppercase tracking-widest text-white/30">Senha para sua nova conta</Label>
                          <Input id="checkout-password" required type="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleInputChange} placeholder="Sua senha" className="bg-white/5 border-white/10 h-14 rounded-2xl" />
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
                  amount={cardTotal}
                  label={STORE.name}
                  onCreateOrder={createWalletOrder}
                  onSuccess={() => {
                    setOrderTotal(cardTotal);
                    setOrderItemCount(cartItems.reduce((acc, i) => acc + i.quantity, 0));
                    clearCart();
                    setPaymentStatus('pago');
                    setOrderSuccess(true);
                    toast.success('Pagamento via carteira digital confirmado!');
                  }}
                  onError={(msg) => toast.error(msg)}
                />

                <div role="group" aria-label="Forma de pagamento" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button type="button" aria-pressed={paymentMethod === 'pix'} onClick={() => setPaymentMethod('pix')} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'pix' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-4">
                      <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-[#25D366]' : 'text-white/20'}`} />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-white">PIX</p>
                        <p className="text-[9px] text-white/40"><span className="text-[#25D366] font-black">5% OFF</span> · Aprovação em segundos</p>
                      </div>
                    </div>
                    {paymentMethod === 'pix' && <CheckCircle2 className="w-5 h-5 text-[#25D366]" />}
                  </button>

                  <button type="button" aria-pressed={paymentMethod === 'credit_card'} onClick={() => setPaymentMethod('credit_card')} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${paymentMethod === 'credit_card' ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-white/5 bg-white/[0.02]'}`}>
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
                  <input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} aria-required="true" />
                  <div aria-hidden="true" className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4af37] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black ${acceptedTerms ? 'bg-[#d4af37]' : 'bg-white/5 border border-white/10 group-hover:border-white/30'}`}>
                    {acceptedTerms && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-[10px] text-white/50 leading-relaxed">
                    Eu li e concordo com os <a href="/termos" target="_blank" rel="noopener" className="text-[#d4af37] hover:underline">Termos e Condições</a> e a <a href="/privacidade" target="_blank" rel="noopener" className="text-[#d4af37] hover:underline">Política de Privacidade</a> da {STORE.name}. *
                  </span>
                </label>
              </div>

              <Button type="submit" disabled={isProcessing} className="w-full h-20 bg-[#d4af37] text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] shadow-2xl shadow-[#d4af37]/10 hover:bg-[#f2ca50] transition-all">
                {isProcessing
                  ? <span className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> Processando…</span>
                  : paymentMethod === 'pix'
                    ? <span className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Gerar QR Code PIX — R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    : <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Ir para Pagamento — R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
              </Button>
              <p className="text-center text-[9px] text-white/30 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-[#d4af37]/60" /> Pagamento criptografado · MercadoPago &amp; Stripe
              </p>
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
                      <img src={item.image} alt="" className="w-full h-full object-contain mix-blend-lighten" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold text-[#d4af37]">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>

              {/* Sugestão de produtos complementares */}
              {upsellProducts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in duration-1000">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Combine com</span>
                  </div>
                  <div className="space-y-4">
                    {upsellProducts.map(product => (
                      <div key={product.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-[24px] flex items-center justify-between group hover:border-[#d4af37]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black p-1">
                            <img src={product.image} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white leading-tight">{product.name}</p>
                            <p className="text-[9px] text-[#d4af37] font-bold mt-0.5">+ R$ {product.price.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          aria-label={`Adicionar ${product.name} ao carrinho`}
                          onClick={() => { addToCart(product); toast.success(`${product.name} adicionado!`); }}
                          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all"
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
                  {formData.cep.replace(/\D/g, '').length !== 8 && shippingOptions.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-3">
                      <Truck className="w-4 h-4 text-[#d4af37]/60 shrink-0" />
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Informe seu CEP acima para ver prazos e valores de entrega</p>
                    </div>
                  ) : (
                  <div role="group" aria-label="Opções de entrega" className="grid grid-cols-2 gap-4">
                    {(shippingOptions.length > 0 ? shippingOptions : [
                      { id: 'normal', name: 'Normal', price: 15.90, deadline: '7 a 10 dias úteis' },
                      { id: 'express', name: 'Expressa', price: 0, deadline: '2 a 4 dias úteis' },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={shippingOption === opt.id}
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
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="checkout-coupon" className="text-[9px] font-black uppercase tracking-widest text-white/30">Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <Input id="checkout-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Código" className="bg-white/5 border-white/10 h-12 rounded-xl flex-1 uppercase" />
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
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/70">
                  <span>Subtotal</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/70">
                  <span>Frete</span>
                  {formData.cep.replace(/\D/g, '').length !== 8 && shippingOptions.length === 0
                    ? <span className="text-white/40 normal-case tracking-normal">Informe o CEP</span>
                    : <span className={shippingCost === 0 ? "text-green-500" : ""}>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>}
                </div>
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#25D366]">
                    <span>Desconto PIX (5%)</span>
                    <span>- R$ {pixDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                    <span>Desconto</span>
                    <span>- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-6 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Valor Total</p>
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
