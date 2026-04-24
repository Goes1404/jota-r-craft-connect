import React, { useState, useEffect, useRef } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/config/constants';

const PIX_EXPIRATION_MINUTES = 30;

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const total = getTotalPrice();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64?: string; qrCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>();
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'aguardando' | 'pago' | 'expirado'>('aguardando');
  const [pixTimeLeft, setPixTimeLeft] = useState(PIX_EXPIRATION_MINUTES * 60); // seconds
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // PIX expiration countdown
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orderSuccess, paymentMethod, paymentStatus]);

  // Real-time payment status polling
  useEffect(() => {
    if (!createdOrderId || !orderSuccess || paymentStatus === 'expirado') return;

    const checkPaymentStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', createdOrderId)
        .single();

      if (data?.status === 'Pago') {
        setPaymentStatus('pago');
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.success('Pagamento confirmado! Seu pedido está sendo preparado.');
      }
    };

    // Check every 5 seconds
    pollingRef.current = setInterval(checkPaymentStatus, 5000);
    // Also check immediately
    checkPaymentStatus();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [createdOrderId, orderSuccess, paymentStatus]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setFormData({ ...formData, cpf: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    
    setFormData({ ...formData, phone: value });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    
    setFormData(prev => ({ ...prev, cep: value }));

    const rawCep = value.replace(/\D/g, '');
    if (rawCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          toast.success('Endereço encontrado pelo CEP!');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) { toast.error('Seu carrinho está vazio.'); return; }
    if (!user) { toast.error('Faça login para continuar.'); navigate('/login?redirect=/checkout'); return; }
    setIsProcessing(true);

    try {
      // 1. Create order with "Aguardando Pagamento" status
      // NOTE: Stock is NOT deducted here. It is only deducted by the webhook
      // after the payment gateway confirms the money has been received.
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'Aguardando Pagamento',
          shipping_address: `${formData.address}, ${formData.number} — ${formData.city}/${formData.state} (${formData.cep})`,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError.message);
        throw orderError;
      }
      const orderId = orderData.id;
      setCreatedOrderId(orderId);

      // 2. Save order items (stock remains unchanged until payment confirmation)
      await supabase.from('order_items').insert(
        cartItems.map(item => ({
          order_id: orderId,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      );

      // 3. Call Edge Functions to create payment
      if (paymentMethod === 'pix') {
        const { data: pixResult } = await supabase.functions.invoke('create-pix-payment', {
          body: { orderId: orderId, totalAmount: total, payerEmail: user.email }
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
          body: { orderId: orderId, totalAmount: total }
        });
        if (stripeResult?.success && stripeResult.clientSecret) {
          setStripeClientSecret(stripeResult.clientSecret);
          await supabase.from('orders').update({
            payment_intent_id: stripeResult.paymentIntentId,
          }).eq('id', orderId);
        }
      }

      clearCart();
      setOrderSuccess(true);
    } catch (error: any) {
      toast.error('Erro ao processar pedido: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Screen with Real-Time Payment Monitoring
  if (orderSuccess) {
    const isPaid = paymentStatus === 'pago';
    const isExpired = paymentStatus === 'expirado';
    
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pt-32 pb-20">
          
          {/* Status Icon */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border animate-in zoom-in duration-700 ${
            isPaid 
              ? 'bg-green-500/10 border-green-500/20' 
              : isExpired
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-[#d4af37]/10 border-[#d4af37]/20'
          }`}>
            {isPaid ? (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            ) : isExpired ? (
              <AlertTriangle className="w-12 h-12 text-red-400" />
            ) : (
              <Clock className="w-12 h-12 text-[#d4af37] animate-pulse" />
            )}
          </div>

          {/* Status Text */}
          <h1 className="text-4xl font-serif font-bold mb-4">
            {isPaid ? 'Pagamento Confirmado!' : isExpired ? 'PIX Expirado' : 'Aguardando Pagamento'}
          </h1>
          <p className="text-white/60 max-w-md mb-6 leading-relaxed">
            {isPaid 
              ? 'Seu pagamento foi recebido com sucesso! Estamos preparando seu pedido para envio.' 
              : isExpired
                ? 'O tempo para pagamento via PIX expirou. Você pode realizar um novo pedido.'
                : paymentMethod === 'pix' 
                  ? 'Escaneie o QR Code abaixo ou copie o código PIX para efetuar o pagamento.'
                  : 'Aguarde a confirmação do pagamento pelo cartão.'
            }
          </p>

          {/* Important notice — order only confirmed after payment */}
          {!isPaid && !isExpired && (
            <div className="bg-amber-500/5 border border-amber-500/20 px-6 py-4 rounded-2xl mb-8 max-w-md">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-1">Compra Segura</p>
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    Seu pedido só será confirmado e o estoque reservado <strong className="text-white/60">após o pagamento ser recebido</strong> na nossa conta. Sem risco para você.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PIX Timer */}
          {paymentMethod === 'pix' && !isPaid && !isExpired && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full mb-6">
              <Timer className="w-4 h-4 text-white/40" />
              <span className={`text-sm font-mono font-bold tracking-widest ${
                pixTimeLeft < 300 ? 'text-red-400' : pixTimeLeft < 600 ? 'text-yellow-400' : 'text-white/60'
              }`}>
                {formatTime(pixTimeLeft)}
              </span>
              <span className="text-[9px] text-white/30 uppercase tracking-widest">para pagar</span>
            </div>
          )}

          {/* Real-time status badge */}
          {!isPaid && !isExpired && (
            <div className="flex items-center gap-3 bg-[#d4af37]/10 border border-[#d4af37]/20 px-6 py-3 rounded-full mb-8 animate-pulse">
              <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />
              <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest">Monitorando pagamento...</span>
            </div>
          )}

          {isPaid && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-full mb-8">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Pagamento recebido ✓ · Estoque reservado</span>
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-full mb-8">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Pedido não confirmado · Nenhum valor cobrado</span>
            </div>
          )}

          {/* PIX QR Code (only while waiting) */}
          {paymentMethod === 'pix' && !isPaid && !isExpired && (
            <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[40px] mb-10 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-700">
              <p className="text-[#25D366] text-[10px] font-black uppercase tracking-widest mb-6">Escaneie para pagar</p>
              
              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
                {pixData?.qrCodeBase64 ? (
                  <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-full h-full text-black opacity-80" />
                )}
              </div>

              {pixData?.qrCode ? (
                <Button
                  onClick={handleCopyPix}
                  className="w-full bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] font-mono text-xs rounded-xl h-12 flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                </Button>
              ) : (
                <p className="text-white/30 text-[10px] text-center">O código PIX aparecerá aqui quando o gateway estiver configurado.</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/pedidos')}
              className="bg-[#d4af37] text-black hover:bg-[#f2ca50] rounded-full px-10 font-bold uppercase tracking-widest text-[10px] h-14"
            >
              Acompanhar Meu Pedido
            </Button>
            {isPaid && (
              <Button 
                onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C+acabei+de+realizar+um+pedido+na+loja.+Meu+pedido+é+o+%23${createdOrderId?.slice(0,8)}`, '_blank')}
                variant="outline"
                className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 rounded-full px-10 font-bold uppercase tracking-widest text-[10px] h-14 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Suporte no WhatsApp
              </Button>
            )}
            {isExpired && (
              <Button 
                onClick={() => navigate('/produtos')}
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-full px-10 font-bold uppercase tracking-widest text-[10px] h-14"
              >
                Fazer Novo Pedido
              </Button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-sans selection:bg-[#f2ca50]/30 selection:text-[#f2ca50]">
      <Header />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] rounded-full bg-[#d4af37] opacity-[0.03] blur-[120px]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="flex items-center gap-4 mb-12">
          <ShieldCheck className="w-8 h-8 text-[#d4af37]" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Checkout Seguro</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Criptografia 256-bit · PCI-DSS Compliant
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Shipping */}
            <section className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <Truck className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-serif font-bold text-white">Dados de Entrega</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Nome Completo', name: 'fullName', span: false },
                  { label: 'CPF', name: 'cpf', placeholder: '000.000.000-00', span: false, onChange: handleCpfChange },
                  { label: 'Telefone (WhatsApp)', name: 'phone', placeholder: '(11) 99999-9999', span: true, onChange: handlePhoneChange },
                  { label: 'CEP', name: 'cep', placeholder: '00000-000', span: false, onChange: handleCepChange },
                  { label: 'Endereço', name: 'address', span: true },
                  { label: 'Número', name: 'number', span: false },
                  { label: 'Cidade', name: 'city', span: false },
                  { label: 'Estado (UF)', name: 'state', span: false },
                ].map((field) => (
                  <div key={field.name} className={`space-y-3 ${field.span ? 'md:col-span-2' : ''}`}>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{field.label}</Label>
                    <Input
                      required
                      name={field.name}
                      value={(formData as any)[field.name]}
                      onChange={(field as any).onChange || handleInputChange}
                      placeholder={(field as any).placeholder || ''}
                      className="bg-black/60 border-white/10 h-12 rounded-xl focus:border-[#d4af37]/40 transition-all"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <CreditCard className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-xl font-serif font-bold text-white">Método de Pagamento</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { value: 'pix' as const, icon: QrCode, label: 'PIX', sub: 'Aprovação Imediata', color: '#25D366' },
                  { value: 'credit_card' as const, icon: CreditCard, label: 'Cartão', sub: 'Até 10x Sem Juros', color: '#d4af37' }
                ].map(({ value, icon: Icon, label, sub, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    style={paymentMethod === value ? { borderColor: color, color } : {}}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      paymentMethod === value ? 'bg-white/5' : 'border-white/5 bg-black/40 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-8 h-8 mb-3" />
                    <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                    <span className="text-[9px] mt-1 opacity-70">{sub}</span>
                  </button>
                ))}
              </div>

              {/* Stripe Card Input */}
              {paymentMethod === 'credit_card' && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                  <StripeCardForm
                    onSuccess={(id) => toast.success(`Cartão validado: ${id.slice(0, 12)}...`)}
                    onError={(msg) => toast.error(msg)}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    clientSecret={stripeClientSecret}
                    onSubmit={() => {}}
                  />
                </div>
              )}

              {paymentMethod === 'pix' && (
                <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-2xl p-6 text-center animate-in fade-in duration-300">
                  <QrCode className="w-8 h-8 text-[#25D366] mx-auto mb-3" />
                  <p className="text-[#25D366] text-sm font-bold mb-1">PIX — Pagamento Instantâneo</p>
                  <p className="text-white/40 text-xs">O QR Code será gerado após a confirmação. Pague e seu pedido é aprovado automaticamente.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#0f0f0f]/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 sticky top-32">
              <h2 className="text-xl font-serif font-bold text-white mb-8 border-b border-white/5 pb-6">Resumo do Pedido</h2>
              
              <div className="space-y-5 mb-8 max-h-[280px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/5 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Qtd: {item.quantity}</span>
                    </div>
                    <span className="text-sm font-serif font-black text-[#d4af37]">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6 mb-8">
                <div className="flex justify-between text-sm text-white/50">
                  <span>Subtotal</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-white/50">
                  <span>Frete</span>
                  <span className="text-green-400 font-bold">Grátis</span>
                </div>
                <div className="flex justify-between text-2xl font-serif font-black text-white pt-4 border-t border-white/5">
                  <span>Total</span>
                  <span className="text-[#d4af37]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isProcessing || cartItems.length === 0}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] transition-all h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    Processando...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {paymentMethod === 'pix' ? 'Gerar PIX e Confirmar' : 'Pagar com Segurança'}
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-3 mt-6">
                {['Stripe', 'MP', 'PIX'].map((badge) => (
                  <span key={badge} className="text-[8px] font-black uppercase tracking-widest text-white/10 border border-white/5 px-2 py-1 rounded-md">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
