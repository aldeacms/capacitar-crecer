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

    // TODO: Cuando se implemente sistema de pagos real, crear tabla 'pagos' y actualizar esta consulta.
    // Por ahora, esta consulta accede a matriculas.estado_pago_curso pero es inconsistente
    // porque enrollments y payments son conceptos separados.
    //
    // Schema futuro de tabla 'pagos':
    // - id (uuid)
    // - perfil_id (uuid, fk perfiles)
    // - curso_id (uuid, fk cursos)
    // - monto (numeric)
    // - metodo_pago (text: stripe, transferencia, etc)
    // - estado (enum: pendiente, completado, fallido)
    // - referencia_externa (text, ej: stripe_id)
    // - created_at (timestamp)
    //
    // Consulta futura:
    // SELECT SUM(pagos.monto) FROM pagos WHERE estado = 'completado'
    //
    // Por ahora, sin sistema de pagos real, ingresoTotal siempre debe ser 0:
    const ingresoTotal = 0

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
 * Obtener top cursos por matrículas
 */
export async function getTopCursos() {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { data } = await supabaseAdmin
      .from('matriculas')
      .select('curso_id, cursos(id, titulo)')
      .limit(100)

    // Agrupar por curso
    const grouped: Record<string, { titulo: string; count: number }> = {}
    data?.forEach((m: any) => {
      const cursoId = m.curso_id
      if (!grouped[cursoId]) {
        grouped[cursoId] = {
          titulo: m.cursos?.titulo || 'Curso desconocido',
          count: 0,
        }
      }
      grouped[cursoId].count += 1
    })

    // Ordenar por count descendente y retornar top 5
    return Object.entries(grouped)
      .map(([id, data]) => ({
        id,
        titulo: data.titulo,
        matriculas: data.count,
      }))
      .sort((a, b) => b.matriculas - a.matriculas)
      .slice(0, 5)
  } catch (error: unknown) {
    console.error('Error obteniendo top cursos:', error)
    return []
  }
}
