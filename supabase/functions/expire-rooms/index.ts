import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req: Request) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // Chama a função atômica expire_rooms no PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('expire_rooms')
    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rotina de expiração executada com sucesso',
        expired_rooms_count: data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const error = err as Error
    return new Response(
      JSON.stringify({ error: error.message || 'Falha ao processar expiração de salas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
