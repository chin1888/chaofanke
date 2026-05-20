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
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const [{ data: productsData }, { data: categoriesData }, { data: paidOrders }] = await Promise.all([
      supabaseAdmin.from('products').select('*, category:categories(name)').order('created_at', { ascending: false }),
      supabaseAdmin.from('categories').select('id, name').eq('is_active', true),
      supabaseAdmin.from('orders').select('id').eq('payment_status', 'paid'),
    ]);

    const paidOrderIds = paidOrders?.map(o => o.id) || [];
    let salesMap = new Map<string, number>();

    if (paidOrderIds.length > 0) {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .in('order_id', paidOrderIds);

      orderItems?.forEach((item: any) => {
        if (item.product_id) {
          const current = salesMap.get(item.product_id) || 0;
          salesMap.set(item.product_id, current + (item.quantity || 1));
        }
      });
    }

    const productsWithSales = (productsData || []).map((product: any) => ({
      ...product,
      sales_count: salesMap.get(product.id) || 0,
    }));

    return new Response(JSON.stringify({
      products: productsWithSales,
      categories: categoriesData || [],
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
