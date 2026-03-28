'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

export interface DashboardMetrics {
  totalUsuarios: number
  usuariosActivos: number
  totalCursos: number
  cursosActivos: number
  totalMatriculas: number
  certificadosEmitidos: number
  ingresoTotal: number
}

/**
 * Obtener métricas del dashboard para admin
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics | { error: string }> {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Total de usuarios
    const { count: totalUsuarios } = await supabaseAdmin
      .from('perfiles')
      .select('*', { count: 'exact', head: true })

    // Usuarios activos (con matrícula en últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: usuariosActivos } = await supabaseAdmin
      .from('matriculas')
      .select('perfil_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    // Total de cursos
    const { count: totalCursos } = await supabaseAdmin
      .from('cursos')
      .select('*', { count: 'exact', head: true })

    // Cursos activos (con al menos una matrícula)
    const { data: cursosConMatriculas } = await supabaseAdmin
      .from('matriculas')
      .select('curso_id')

    const cursosActivosSet = new Set(cursosConMatriculas?.map((m: any) => m.curso_id) || [])
    const cursosActivos = cursosActivosSet.size

    // Total de matrículas
    const { count: totalMatriculas } = await supabaseAdmin
      .from('matriculas')
      .select('*', { count: 'exact', head: true })

    // Certificados emitidos
    const { count: certificadosEmitidos } = await supabaseAdmin
      .from('certificate_downloads')
      .select('*', { count: 'exact', head: true })
      .is('invalidado_at', null)

    // Calcular ingresos totales desde matrículas pagadas
    // Selecciona matrículas con estado_pago_curso=true y suma precio_curso
    const { data: matriculasPagadas } = await supabaseAdmin
      .from('matriculas')
      .select('cursos(precio_curso)')
      .eq('estado_pago_curso', true)

    const ingresoTotal = (matriculasPagadas || []).reduce((sum: number, m: any) => {
      return sum + ((m.cursos as any)?.precio_curso || 0)
    }, 0)

    return {
      totalUsuarios: totalUsuarios || 0,
      usuariosActivos: usuariosActivos || 0,
      totalCursos: totalCursos || 0,
      cursosActivos,
      totalMatriculas: totalMatriculas || 0,
      certificadosEmitidos: certificadosEmitidos || 0,
      ingresoTotal,
    }
  } catch (error: unknown) {
    console.error('Error obteniendo métricas del dashboard:', error)
    return { error: 'Error al cargar métricas' }
  }
}

/**
 * Obtener datos de matriculas por fecha (últimos 30 días)
 */
export async function getMatriculasChart() {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: matriculas } = await supabaseAdmin
      .from('matriculas')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    // Agrupar por fecha
    const grouped: Record<string, number> = {}
    matriculas?.forEach((m: any) => {
      const date = new Date(m.created_at).toLocaleDateString('es-CL')
      grouped[date] = (grouped[date] || 0) + 1
    })

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      matriculas: count,
    }))
  } catch (error: unknown) {
    console.error('Error obteniendo gráfico de matrículas:', error)
    return []
  }
}

/**
 * Obtener top 5 cursos por número de matrículas
 * Consulta desde cursos con conteo de matrículas anidado para evitar
 * el problema de límite de filas al agrupar desde la tabla matriculas
 */
export async function getTopCursos() {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data: cursos, error } = await supabaseAdmin
      .from('cursos')
      .select('id, titulo, matriculas(count)')

    if (error) throw new Error(error.message)

    type CursoConConteo = { id: string; titulo: string; matriculas: number }

    return (cursos || [])
      .map((curso: any): CursoConConteo => ({
        id: curso.id,
        titulo: curso.titulo,
        matriculas: (curso.matriculas?.[0]?.count as number) ?? 0,
      }))
      .sort((a: CursoConConteo, b: CursoConConteo) => b.matriculas - a.matriculas)
      .slice(0, 5)
  } catch (error: unknown) {
    console.error('Error obteniendo top cursos:', error)
    return []
  }
}
