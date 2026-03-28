import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Manejador del callback de autenticación de Supabase.
 * Supabase redirige aquí tras confirmar email, password reset, o OAuth.
 *
 * El hash (#access_token=...&type=...) lo procesa el cliente JS de Supabase
 * automáticamente al cargar cualquier página — solo necesitamos redirigir
 * al destino correcto según el tipo de evento.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const msg = encodeURIComponent(errorDescription ?? error)
    return NextResponse.redirect(new URL(`/login?error=${msg}`, req.url))
  }

  // Intercambiar code por sesión (PKCE flow)
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(new URL('/login?error=link_invalido', req.url))
    }

    // Si es reset de contraseña, ir a la página para ingresarla
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/restablecer-contrasena', req.url))
    }

    return NextResponse.redirect(new URL(next, req.url))
  }

  // Confirmación de email sin code (link mágico) — Supabase lo maneja con hash
  // Redirigir al dashboard; el cliente JS de Supabase procesa el hash automáticamente
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
