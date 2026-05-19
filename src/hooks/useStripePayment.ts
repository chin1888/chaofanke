import { useState, useCallback } from 'react';
import { supabase, getSupabaseUrl } from '../supabase/client';

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export function useStripePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async (amount: number, orderId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getSupabaseUrl()}/functions/v1/clever-processor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'create-payment-intent',
          data: { amount, orderId },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create payment intent');
        return null;
      }

      return result.clientSecret;
    } catch (err) {
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (paymentIntentId: string): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getSupabaseUrl()}/functions/v1/clever-processor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'confirm-payment',
          data: { paymentIntentId },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to confirm payment');
        return { success: false, error: result.error };
      }

      return { success: result.status === 'succeeded', paymentIntentId };
    } catch (err) {
      setError('Network error');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPaymentIntent,
    confirmPayment,
    loading,
    error,
    clearError: () => setError(null),
  };
}
