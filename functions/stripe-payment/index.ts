const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    if (action === 'create-payment-intent') {
      const { amount, currency = 'eur', orderId } = data;

      const params = new URLSearchParams();
      params.append('amount', (amount * 100).toString());
      params.append('currency', currency);
      params.append('metadata[order_id]', orderId);
      params.append('automatic_payment_methods[enabled]', 'true');

      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const paymentIntent = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: paymentIntent.error?.message || JSON.stringify(paymentIntent) }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'confirm-payment') {
      const { paymentIntentId } = data;

      const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      const paymentIntent = await response.json();

      return new Response(JSON.stringify({
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
