import React, { useEffect, useRef, useState } from 'react';
import { Elements, useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { stripePromise } from '@/components/StripeCardForm';
import { Smartphone } from 'lucide-react';

interface PaymentRequestButtonProps {
  amount: number; // BRL (e.g. 149.90)
  label: string;
  /** Called when the user authenticates in the native payment sheet.
   *  Must return { clientSecret } on success, or null if order creation failed
   *  (a toast error should already be shown before returning null). */
  onCreateOrder: (paymentMethodId: string) => Promise<{ clientSecret: string } | null>;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const PaymentRequestButtonInner: React.FC<PaymentRequestButtonProps> = ({
  amount,
  label,
  onCreateOrder,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  const callbacksRef = useRef({ onCreateOrder, onSuccess, onError });
  useEffect(() => { callbacksRef.current = { onCreateOrder, onSuccess, onError }; });

  // Initialize once when stripe becomes available
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'BR',
      currency: 'brl',
      total: { label, amount: Math.round(amount * 100) },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result: any) => {
      if (result) setPaymentRequest(pr);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe]);

  // Keep the amount in sync when shipping option or discounts change
  useEffect(() => {
    if (!paymentRequest) return;
    paymentRequest.update({ total: { label, amount: Math.round(amount * 100) } });
  }, [amount, label, paymentRequest]);

  // Register paymentmethod event handler — uses ref to always call latest callbacks
  useEffect(() => {
    if (!paymentRequest || !stripe) return;

    const handler = async (event: any) => {
      const { onCreateOrder, onSuccess, onError } = callbacksRef.current;

      const result = await onCreateOrder(event.paymentMethod.id);
      if (!result) {
        event.complete('fail');
        return;
      }

      const { error } = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: event.paymentMethod.id,
      });

      if (error) {
        event.complete('fail');
        onError(error.message || 'Pagamento recusado.');
      } else {
        event.complete('success');
        onSuccess();
      }
    };

    paymentRequest.on('paymentmethod', handler);
    return () => paymentRequest.off('paymentmethod', handler);
  }, [paymentRequest, stripe]);

  if (!paymentRequest) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-[#d4af37]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37]">
          Pagamento Expresso
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden">
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'buy',
                theme: 'dark',
                height: '52px',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
          ou pague com
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
    </div>
  );
};

// Self-contained: wraps in its own Elements context so the parent never needs one
export const PaymentRequestButton: React.FC<PaymentRequestButtonProps> = (props) => {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise}>
      <PaymentRequestButtonInner {...props} />
    </Elements>
  );
};
