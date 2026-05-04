import React, { useState } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, CreditCard } from 'lucide-react';

// Stripe publishable key — safe to expose in frontend
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const stripeElementStyle = {
  base: {
    color: '#e2e2e2',
    fontFamily: '"Inter", sans-serif',
    fontSize: '14px',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: 'rgba(226, 226, 226, 0.2)' },
  },
  invalid: {
    color: '#ef4444',
    iconColor: '#ef4444',
  },
};

interface StripeCardFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  clientSecret?: string;
}

const StripeCardFormInner: React.FC<StripeCardFormProps> = ({
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  clientSecret,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onError('Stripe não carregado. Tente novamente.');
      return;
    }

    setIsProcessing(true);
    setCardError('');

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    if (clientSecret) {
      // Confirm a real payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber },
      });

      if (error) {
        setCardError(error.message || 'Erro no pagamento.');
        onError(error.message || 'Erro no pagamento.');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } else {
      // Demo mode: just create a payment method to validate the card fields
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
      });

      if (error) {
        setCardError(error.message || 'Cartão inválido.');
        onError(error.message || 'Cartão inválido.');
      } else {
        onSuccess(paymentMethod.id);
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      <div className="space-y-3">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
          <CreditCard className="w-3 h-3" /> Número do Cartão
        </Label>
        <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#d4af37]/40 transition-all">
          <CardNumberElement options={{ style: stripeElementStyle, showIcon: true }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Validade</Label>
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#d4af37]/40 transition-all">
            <CardExpiryElement options={{ style: stripeElementStyle }} />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">CVC</Label>
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#d4af37]/40 transition-all">
            <CardCvcElement options={{ style: stripeElementStyle }} />
          </div>
        </div>
      </div>

      {cardError && (
        <p className="text-red-500 text-xs font-bold animate-in fade-in">{cardError}</p>
      )}

      <Button type="submit" disabled={isProcessing} className="w-full bg-[#d4af37] text-black hover:bg-[#f2ca50] font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl">
        {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
      </Button>

      <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest pt-2">
        <Lock className="w-3 h-3" />
        Dados criptografados via Stripe. Nenhum dado de cartão toca nossos servidores.
      </div>
    </form>
  );
};

// Exported wrapper — includes the Elements provider
export const StripeCardForm: React.FC<StripeCardFormProps & { onSubmit: () => void }> = (props) => {
  if (!stripePromise) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
        <CreditCard className="w-8 h-8 text-[#d4af37] mx-auto" />
        <p className="text-white/60 text-sm font-medium">Pagamento via cartão em breve</p>
        <p className="text-white/30 text-xs">Configure a chave do Stripe para ativar esta opção.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
};

// Export the inner form for use inside an existing Elements context
export { StripeCardFormInner };
