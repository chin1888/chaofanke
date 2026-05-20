import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://ncncgpmfkgccsgkbuqss.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Fetch all stats with service role (bypasses RLS)
    const [
      profilesResult,
      ordersResult,
      productsResult,
      reviewsResult,
      paidOrdersResult,
      monthlyOrdersResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('total_amount, created_at').eq('payment_status', 'paid'),
      supabaseAdmin.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', startOfMonth),
    ]);

    const users = profilesResult.count || 0;
    const orders = ordersResult.count || 0;
    const products = productsResult.count || 0;
    const reviews = reviewsResult.count || 0;
    const paidOrders = paidOrdersResult.data?.length || 0;
    const totalSales = paidOrdersResult.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const conversionRate = users > 0 && paidOrders > 0 ? Math.round((paidOrders / users) * 100) : 0;

    // Calculate monthly sales trend (last 12 months)
    const monthlyData = new Array(12).fill(0);
    paidOrdersResult.data?.forEach(o => {
      const date = new Date(o.created_at);
      const month = date.getMonth();
      monthlyData[month] += o.total_amount || 0;
    });

    return new Response(JSON.stringify({
      totalUsers: users,
      totalOrders: orders,
      totalProducts: products,
      totalReviews: reviews,
      totalSales,
      paidOrders,
      conversionRate,
      monthlyData: monthlyData.map(v => Math.round(v / 100)),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
