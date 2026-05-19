import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../supabase/client';

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

interface StripePaymentFormProps {
  amount: number;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({ amount, orderId, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getSupabaseUrl()}/functions/v1/stripe-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'create-payment-intent',
          data: { amount, orderId },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        onError(result.error || 'Failed to initialize payment');
        return;
      }

      setClientSecret(result.clientSecret);
    } catch (err) {
      onError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (error) {
      setPaymentStatus('error');
      onError(error.message || 'Payment failed');
    } else if (paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
      onSuccess(paymentIntent.id);
    } else {
      setPaymentStatus('error');
      onError('Payment not completed');
    }

    setLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  if (paymentStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">Your order has been confirmed.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-gray-900" />
        <h2 className="text-xl font-bold text-gray-900">Card Payment</h2>
        <Lock className="w-4 h-4 text-green-600 ml-auto" />
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount to Pay</span>
          <span className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
          <div className="p-4 border rounded-lg focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {paymentStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Payment failed. Please try again.</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!stripe || loading || !clientSecret}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </motion.button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secured by Stripe. Your card information is encrypted.
      </p>
    </motion.div>
  );
}

export default function StripePaymentWrapper(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
