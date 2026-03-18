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
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}

