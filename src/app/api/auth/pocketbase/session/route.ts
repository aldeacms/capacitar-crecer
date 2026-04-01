import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

export async function POST(request: NextRequest) {
  try {
    const { token, model } = await request.json()

    if (!token || !model) {
      return NextResponse.json(
        { error: 'token y model son requeridos' },
        { status: 400 }
      )
    }

    // Crear instancia de PocketBase
    const pb = new PocketBase(POCKETBASE_URL)
    
    // Establecer el token y model en el authStore
    pb.authStore.save(token, model)

    // Crear respuesta exitosa
    const response = NextResponse.json({ success: true })

    // Exportar cookie de autenticación
    // pb.authStore.exportToCookie() requiere un objeto response (como de Express)
    // En Next.js, podemos establecer la cookie manualmente
    // La cookie debe tener el mismo formato que PocketBase espera
    // PocketBase por defecto usa cookie llamada 'pb_auth' con valor JSON stringificado
    const cookieValue = JSON.stringify((pb.authStore as any).export())
    
    response.cookies.set({
      name: 'pb_auth',
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 días (similar a Supabase)
    })

    return response
  } catch (error: any) {
    console.error('Error estableciendo sesión PocketBase:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Limpiar sesión
  const response = NextResponse.json({ success: true })
  response.cookies.delete('pb_auth')
  return response
}