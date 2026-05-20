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

    const [{ data: reviewsData }, { data: productsData }, { data: likesData }, { data: sharesData }] = await Promise.all([
      supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('products').select('id, name, likes_count, shares_count'),
      supabaseAdmin.from('product_likes').select('*'),
      supabaseAdmin.from('product_shares').select('*'),
    ]);

    const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

    const reviews = (reviewsData || []).map((review: any) => {
      const product = productMap.get(review.product_id);
      return {
        ...review,
        product_name: product?.name || 'Unknown',
        likes_count: product?.likes_count || 0,
        shares_count: product?.shares_count || 0,
        replies_count: 0,
      };
    });

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
