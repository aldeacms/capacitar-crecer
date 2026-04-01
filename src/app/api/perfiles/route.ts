/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getServerAuthUser } from '@/lib/pocketbase-server'
import { getPocketBaseAdminClient } from '@/lib/pocketbase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nombre_completo, rut, telefono } = body

    // Obtener usuario autenticado desde cookies de PocketBase
    const user = await getServerAuthUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'NO_SESSION' }, { status: 401 })
    }

    // Cliente admin para operaciones privilegiadas (similar a service role)
    const pbAdmin = await getPocketBaseAdminClient()

    // Datos del perfil
    const perfilData: any = {
      id: user.id,
      nombre_completo: nombre_completo || user.name || user.email || 'Alumno',
      rut: rut || user.id, // Usar ID como fallback
      telefono: telefono || null,
      rol: 'alumno',
      user: user.id, // Relación con colección 'users' de PocketBase
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }

    // Intentar crear o actualizar perfil
    // PocketBase no tiene upsert nativo, intentamos crear y capturar error de duplicado
    try {
      await pbAdmin.collection('perfiles').create(perfilData)
    } catch (createError: any) {
      // Si el error es por registro duplicado (id ya existe), actualizar
      if (createError.status === 400 && createError.data?.code === 'DUPLICATE_RECORD') {
        await pbAdmin.collection('perfiles').update(user.id, perfilData)
      } else {
        throw createError
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('API /perfiles error:', err)
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}