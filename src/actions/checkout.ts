'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Valida un cupón de descuento
 * Retorna los datos del cupón si es válido
 */
export async function validarCupon(
  codigo: string
): Promise<{ data: { codigo: string; descuento_porcentaje: number } } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data: cupon, error } = await supabase
      .from('cupones')
      .select('codigo, descuento_porcentaje, activo, usos_maximos, usos_actuales')
      .eq('codigo', codigo.toUpperCase())
      .eq('activo', true)
      .single()

    if (error || !cupon) {
      return { error: 'Cupón no válido o expirado' }
    }

    // Verificar si ha superado el límite de usos
    if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
      return { error: 'Este cupón ha alcanzado el límite de usos' }
    }

    return {
      data: {
        codigo: cupon.codigo,
        descuento_porcentaje: cupon.descuento_porcentaje,
      },
    }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

/**
 * Inscribe un usuario en un curso de pago, aplicando un cupón de descuento si aplica
 * Si el cupón es 100%, inscribe directamente sin requerir pago
 * Si el cupón es menor, retorna estado pendiente de pago (para integración futura con Transbank)
 */
export async function inscribirConCupon(
  cursoId: string,
  codigoCupon: string
): Promise<
  | { success: true; mensaje: string }
  | { error: string; requierePago?: boolean; precioFinal?: number }
> {
  try {
    // Verificar sesión
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No autenticado' }
    }

    // Usar admin para escrituras
    const admin = getSupabaseAdmin()

    // Verificar que el usuario tenga perfil
    const { data: perfil } = await admin
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!perfil) {
      return { error: 'Perfil no encontrado' }
    }

    // Obtener datos del curso
    const { data: curso, error: cursoError } = await admin
      .from('cursos')
      .select('id, tipo_acceso, precio_curso')
      .eq('id', cursoId)
      .single()

    if (cursoError || !curso) {
      return { error: 'Curso no encontrado' }
    }

    // Verificar que sea un curso de pago
    if (curso.tipo_acceso !== 'pago') {
      return { error: 'Este curso no requiere pago' }
    }

    // Verificar si ya está inscrito
    const { data: yaInscrito } = await admin
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfil.id)
      .eq('curso_id', cursoId)
      .maybeSingle()

    if (yaInscrito) {
      return { error: 'Ya estás inscrito en este curso' }
    }

    // Validar cupón
    const cuponValidacion = await validarCupon(codigoCupon)
    if ('error' in cuponValidacion) {
      return { error: cuponValidacion.error }
    }

    const cupon = cuponValidacion.data
    const precioOriginal = curso.precio_curso || 0
    const descuentoAplicado = Math.round(precioOriginal * (cupon.descuento_porcentaje / 100))
    const precioFinal = precioOriginal - descuentoAplicado

    // Si descuento es 100%, inscribir directamente
    if (cupon.descuento_porcentaje === 100) {
      const { error: insertError } = await admin
        .from('matriculas')
        .insert({
          perfil_id: perfil.id,
          curso_id: cursoId,
          estado_pago_curso: true,
          progreso_porcentaje: 0,
        })

      if (insertError) {
        return { error: `Error al inscribirse: ${insertError.message}` }
      }

      // Registrar uso del cupón
      const { data: cuponData } = await admin
        .from('cupones')
        .select('id, usos_actuales')
        .eq('codigo', codigoCupon.toUpperCase())
        .single()

      if (cuponData) {
        await admin
          .from('cupones')
          .update({ usos_actuales: (cuponData.usos_actuales || 0) + 1 })
          .eq('id', cuponData.id)
      }

      // Registrar uso del cupón en matriculas
      const { data: matriculaInsertada } = await admin
        .from('matriculas')
        .select('id')
        .eq('perfil_id', perfil.id)
        .eq('curso_id', cursoId)
        .single()

      if (matriculaInsertada && cuponData) {
        await admin.from('matriculas_cupones').insert({
          matricula_id: matriculaInsertada.id,
          cupon_id: cuponData.id,
          descuento_aplicado: descuentoAplicado,
        })
      }

      revalidatePath('/dashboard')
      revalidatePath('/')

      return { success: true, mensaje: 'Inscripción completada exitosamente con 100% de descuento' }
    }

    // Para descuentos parciales, crear matrícula en estado "pendiente de pago"
    // (En el futuro aquí se integraría Transbank/Stripe)
    const { error: insertError } = await admin
      .from('matriculas')
      .insert({
        perfil_id: perfil.id,
        curso_id: cursoId,
        estado_pago_curso: false, // Pendiente de pago
        progreso_porcentaje: 0,
      })

    if (insertError) {
      return { error: `Error al crear inscripción: ${insertError.message}` }
    }

    // Registrar cupón en la matrícula
    const { data: matriculaInsertada } = await admin
      .from('matriculas')
      .select('id')
      .eq('perfil_id', perfil.id)
      .eq('curso_id', cursoId)
      .single()

    const { data: cuponData } = await admin
      .from('cupones')
      .select('id')
      .eq('codigo', codigoCupon.toUpperCase())
      .single()

    if (matriculaInsertada && cuponData) {
      await admin.from('matriculas_cupones').insert({
        matricula_id: matriculaInsertada.id,
        cupon_id: cuponData.id,
        descuento_aplicado: descuentoAplicado,
      })
    }

    revalidatePath('/dashboard')

    return {
      error: 'Pago incompleto',
      requierePago: true,
      precioFinal: precioFinal,
    }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}
