import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import StripePaymentWrapper from '../components/StripePaymentForm';
import SEO from '../components/SEO';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = parseFloat(searchParams.get('amount') || '0');
  const orderNumber = searchParams.get('orderNumber') || '';

  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!orderId || amount <= 0) {
      setError('Invalid payment parameters');
      setLoading(false);
      return;
    }
    fetchStripeConfig();
  }, [orderId, amount]);

  const fetchStripeConfig = async () => {
    const { data } = await supabase
      .from('payment_gateways')
      .select('api_key, test_mode')
      .eq('code', 'stripe')
      .single();

    if (data?.api_key) {
      setStripeKey(data.api_key);
    } else {
      setError('Stripe is not configured. Please set up Stripe API keys in the admin panel.');
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Update order payment status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    setPaymentSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-900" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your order {orderNumber} has been confirmed.</p>
          <p className="text-sm text-gray-500">Redirecting to homepage...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Payment - E-Hookan | Secure Checkout" description="Complete your payment securely with Stripe." />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/checkout')} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkout
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
            <p className="text-gray-600 mt-1">
              Order: <span className="font-medium">{orderNumber}</span>
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Payment Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {stripeKey && !error && (
            <StripePaymentWrapper
              amount={amount}
              orderId={orderId!}
              publishableKey={stripeKey}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      </div>
    </>
  );
}
