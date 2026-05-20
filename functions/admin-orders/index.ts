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

    const [{ data: ordersData }, { data: itemsData }, { data: productsData }, { data: categoriesData }] = await Promise.all([
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('order_items').select('order_id, product_id, quantity, total_price'),
      supabaseAdmin.from('products').select('id, category_id'),
      supabaseAdmin.from('categories').select('id, name'),
    ]);

    const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);
    const productMap = new Map(productsData?.map(p => [p.id, p.category_id]) || []);

    const stats: Record<string, { category_id: string; category_name: string; total_quantity: number; total_amount: number }> = {};
    const ordersWithCats = (ordersData || []).map((order: any) => {
      const orderItems = itemsData?.filter((i: any) => i.order_id === order.id) || [];
      const catIds = new Set<string>();
      orderItems.forEach((item: any) => {
        const catId = productMap.get(item.product_id);
        if (catId) {
          catIds.add(catId);
          if (!stats[catId]) {
            stats[catId] = { category_id: catId, category_name: categoryMap.get(catId) || 'Unknown', total_quantity: 0, total_amount: 0 };
          }
          stats[catId].total_quantity += item.quantity || 0;
          stats[catId].total_amount += item.total_price || 0;
        }
      });
      return { ...order, categories: Array.from(catIds).map((id: string) => categoryMap.get(id) || 'Unknown') };
    });

    return new Response(JSON.stringify({
      orders: ordersWithCats,
      categoryStats: Object.values(stats),
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
