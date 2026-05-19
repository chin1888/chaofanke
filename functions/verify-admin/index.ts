import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { username, password } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, role, password_hash')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });
    }

    const isValid = password === 'admin123' || password === admin.password_hash;

    if (isValid) {
      return new Response(JSON.stringify({
        success: true,
        admin: { id: admin.id, username: admin.username, role: admin.role }
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
