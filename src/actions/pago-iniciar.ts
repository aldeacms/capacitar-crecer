'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { getPaymentConfigInternal } from '@/actions/pagos-config'
import type { Gateway } from '@/lib/payment-constants'
import { createTransbankPayment } from '@/lib/gateways/transbank'
import { createFlowPayment } from '@/lib/gateways/flow'
import { createMercadoPagoPayment } from '@/lib/gateways/mercadopago'
import { headers } from 'next/headers'
import { enviarConfirmacionPago } from '@/actions/email'

export async function iniciarPago(
  cursoId: string,
  gateway: Gateway
): Promise<{ redirectUrl: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión' }

  const admin = getSupabaseAdmin()

  // Obtener curso
  const { data: curso } = await admin
    .from('cursos')
    .select('id, titulo, precio_curso')
    .eq('id', cursoId)
    .single()

  if (!curso) return { error: 'Curso no encontrado' }
  if (!curso.precio_curso || curso.precio_curso <= 0) return { error: 'El curso no tiene precio configurado' }

  // Obtener config del gateway
  const config = await getPaymentConfigInternal(gateway)
  if (!config) return { error: `Gateway ${gateway} no está habilitado` }

  // Crear o reutilizar matrícula pendiente
  const { data: matriculaExistente } = await admin
    .from('matriculas')
    .select('id')
    .eq('perfil_id', user.id)
    .eq('curso_id', cursoId)
    .eq('estado_pago_curso', false)
    .single()

  let matriculaId: string

  if (matriculaExistente) {
    matriculaId = matriculaExistente.id
  } else {
    const { data: nuevaMatricula, error: errMatricula } = await admin
      .from('matriculas')
      .insert({
        perfil_id: user.id,
        curso_id: cursoId,
        estado_pago_curso: false,
      })
      .select('id')
      .single()

    if (errMatricula || !nuevaMatricula) {
      return { error: 'Error creando matrícula' }
    }
    matriculaId = nuevaMatricula.id
  }

  // Obtener email del usuario
  const { data: perfil } = await admin
    .from('perfiles')
    .select('email:id')
    .eq('id', user.id)
    .single()

  const email = user.email ?? ''

  // Crear registro de pago
  const { data: pago, error: errPago } = await admin
    .from('pagos')
    .insert({
      matricula_id: matriculaId,
      usuario_id: user.id,
      gateway,
      monto: curso.precio_curso,
      estado: 'pendiente',
      modo: config.modo,
      metadata: { curso_titulo: curso.titulo },
    })
    .select('id')
    .single()

  if (errPago || !pago) return { error: 'Error registrando pago' }

  // Construir URLs de retorno
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const returnUrl = `${baseUrl}/api/pagos/${gateway}/return?pago_id=${pago.id}`
  // Flow y Transbank: webhook incluye pago_id en la URL
  // MercadoPago: usa external_reference para identificar el pago (no necesita pago_id en la URL)
  const webhookUrl = gateway === 'mercadopago'
    ? `${baseUrl}/api/pagos/mercadopago/webhook`
    : `${baseUrl}/api/pagos/${gateway}/webhook?pago_id=${pago.id}`

  const commonParams = {
    pagoId: pago.id,
    monto: curso.precio_curso,
    descripcion: `Curso: ${curso.titulo}`,
    email,
    returnUrl,
    webhookUrl,
    modo: config.modo,
    credenciales: config.credenciales,
  }

  try {
    let result
    if (gateway === 'transbank') {
      result = await createTransbankPayment(commonParams)
    } else if (gateway === 'flow') {
      result = await createFlowPayment(commonParams)
    } else {
      result = await createMercadoPagoPayment(commonParams)
    }

    // Guardar gateway_order_id
    await admin
      .from('pagos')
      .update({ gateway_order_id: result.gatewayOrderId })
      .eq('id', pago.id)

    return { redirectUrl: result.redirectUrl }
  } catch (err: unknown) {
    console.error(`Error iniciando pago ${gateway}:`, err)
    // Limpiar pago fallido
    await admin.from('pagos').delete().eq('id', pago.id)
    const msg = err instanceof Error ? err.message : 'Error al conectar con el medio de pago'
    return { error: msg }
  }
}

/** Confirma el pago y actualiza matrícula — usado por API routes */
export async function confirmarPago(
  pagoId: string,
  aprobado: boolean,
  gatewayOrderId?: string
): Promise<void> {
  const admin = getSupabaseAdmin()

  const estado = aprobado ? 'aprobado' : 'rechazado'

  const updates: Record<string, unknown> = { estado }
  if (gatewayOrderId) updates.gateway_order_id = gatewayOrderId

  await admin.from('pagos').update(updates).eq('id', pagoId)

  if (aprobado) {
    const { data: pago } = await admin
      .from('pagos')
      .select('matricula_id, gateway, monto, gateway_order_id, usuario_id, metadata')
      .eq('id', pagoId)
      .single()

    if (pago) {
      await admin
        .from('matriculas')
        .update({ estado_pago_curso: true })
        .eq('id', pago.matricula_id)

      // Email de confirmación — obtener datos del usuario y curso
      try {
        const { data: matricula } = await admin
          .from('matriculas')
          .select('curso_id')
          .eq('id', pago.matricula_id)
          .single()

        if (matricula) {
          const [{ data: curso }, { data: perfil }] = await Promise.all([
            admin.from('cursos').select('titulo, slug').eq('id', matricula.curso_id).single(),
            admin.from('perfiles').select('nombre_completo, id').eq('id', pago.usuario_id).single(),
          ])

          // Obtener email del usuario desde auth.users vía admin
          const { data: authUser } = await admin.auth.admin.getUserById(pago.usuario_id)

          if (curso && authUser?.user?.email) {
            enviarConfirmacionPago({
              email: authUser.user.email,
              nombre: perfil?.nombre_completo || authUser.user.email,
              cursoTitulo: curso.titulo,
              cursoSlug: curso.slug,
              monto: pago.monto,
              gateway: pago.gateway,
              ordenId: pago.gateway_order_id ?? undefined,
            }).catch(() => {})
          }
        }
      } catch {
        // El email es no bloqueante — el pago ya fue confirmado
      }
    }
  }
}
