// supabase/functions/gerenciar-usuarios/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Lida com a requisição OPTIONS (necessária para CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lógica para CRIAR um novo usuário
    if (req.method === 'POST') {
      const { email, password, fullName, role } = await req.json();

      // Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Já marca o e-mail como confirmado
        user_metadata: { full_name: fullName } // Passa o nome para o trigger
      });

      if (authError) throw authError;

      // Atualiza a "role" na tabela de perfis
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: role, full_name: fullName })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return new Response(JSON.stringify(authData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Adicione aqui futuramente a lógica para GET (listar), PUT (atualizar) e DELETE (excluir)

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});