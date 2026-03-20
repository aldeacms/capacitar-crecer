/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { inscribir } from '@/app/actions/inscribir.server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cursoId } = body

    if (!cursoId) return NextResponse.json({ ok: false, error: 'MISSING_CURSO_ID' }, { status: 400 })

    await inscribir(cursoId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('API /inscribir error:', err)

    // Extraer mensaje de error - puede venir de Supabase o ser un Error regular
    let errorMessage = 'Error desconocido al inscribir'

    if (err?.message) {
      errorMessage = err.message
    } else if (err?.error_description) {
      errorMessage = err.error_description
    } else if (typeof err === 'string') {
      errorMessage = err
    } else if (err?.error) {
      errorMessage = err.error
    }

    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
  }
}

