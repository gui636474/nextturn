import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, email, password } = await req.json()

    // 1. Validação básica de campos
    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios: username, email e password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'O nome de usuário deve conter de 3 a 30 caracteres alfanuméricos ou sublinhado (_).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve possuir no mínimo 8 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Extração confiável do IP do cabeçalho da requisição (Supabase Edge / Cloudflare)
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown'

    // 3. Geração do HMAC-SHA256 do IP (Não armazena IP puro por privacidade e segurança)
    const ipSecret = Deno.env.get('IP_HASH_SECRET') || 'nextturn-production-ip-secret-key-32chars'
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ipSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(clientIp))
    const ipHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 4. Instância administrativa do Supabase (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // 5. Verificação de Whitelist (Redes compartilhadas autorizadas)
    const { data: whitelist } = await supabaseAdmin
      .from('ip_whitelist')
      .select('id')
      .eq('ip_hash', ipHash)
      .maybeSingle()

    // 6. Rate Limiting / Limite de Contas por IP (se não estiver na whitelist)
    if (!whitelist) {
      const { count } = await supabaseAdmin
        .from('account_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)

      if ((count ?? 0) >= 2) {
        return new Response(
          JSON.stringify({
            error: 'Limite de contas atingido para esta rede. Se você está em uma rede compartilhada (universidade, lan house), contate o suporte administrativo.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 7. Checar se o username já existe
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Este nome de usuário já está em uso.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Criar usuário no Supabase Auth com email confirmado inicialmente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: username,
      },
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Falha ao registrar usuário.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. Registrar o hash do IP na tabela account_registrations
    await supabaseAdmin.from('account_registrations').insert({
      ip_hash: ipHash,
      user_id: authData.user.id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta criada com sucesso!',
        user: { id: authData.user.id, email: authData.user.email, username }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const error = err as Error
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
