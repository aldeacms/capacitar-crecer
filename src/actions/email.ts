'use server'

import resend from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM = process.env.RESEND_FROM_EMAIL || 'Capacitar y Crecer <onboarding@resend.dev>'

/**
 * Enviar un email
 */
export async function enviarEmail(data: {
  to: string
  subject: string
  html: string
}) {
  try {
    // Verificar que RESEND_API_KEY está configurado
    if (!process.env.RESEND_API_KEY || !resend) {
      return { error: 'RESEND_API_KEY no configurado. Los correos no pueden ser enviados.' }
    }

    const result = await resend.emails.send({
      from: FROM,
      to: data.to,
      subject: data.subject,
      html: data.html
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { success: true, id: result.data?.id }
  } catch (error: unknown) {
    console.error('Error en enviarEmail:', error)
    return { error: (error as Error).message || 'Error desconocido al enviar email' }
  }
}

/**
 * Enviar email de bienvenida a nuevo usuario
 */
export async function enviarBienvenida(data: {
  email: string
  nombre: string
  password: string
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;">¡Bienvenido, ${data.nombre}!</h2>
    <p style="color:#4a5568;">Tu cuenta ha sido creada exitosamente. Aquí están tus datos de acceso:</p>
    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin:0;"><strong>Contraseña temporal:</strong> ${data.password}</p>
    </div>
    <p style="color:#718096;font-size:14px;">Te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
    <a href="${APP_URL}/login" style="${btnStyle}">Inicia Sesión</a>
  `)

  return enviarEmail({
    to: data.email,
    subject: 'Bienvenido — Tus datos de acceso',
    html,
  })
}

export async function enviarConfirmacionInscripcion(data: {
  email: string
  nombre: string
  cursoTitulo: string
  cursoSlug: string
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;">Inscripción confirmada</h2>
    <p style="color:#4a5568;">Hola <strong>${data.nombre}</strong>, ya tienes acceso al curso:</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#166534;">${data.cursoTitulo}</p>
    </div>
    <a href="${APP_URL}/dashboard/cursos/${data.cursoSlug}" style="${btnStyle}">Ir al curso</a>
  `)

  return enviarEmail({
    to: data.email,
    subject: `Inscripción confirmada — ${data.cursoTitulo}`,
    html,
  })
}

export async function enviarConfirmacionPago(data: {
  email: string
  nombre: string
  cursoTitulo: string
  cursoSlug: string
  monto: number
  gateway: string
  ordenId?: string
}) {
  const montoFormateado = `$${data.monto.toLocaleString('es-CL')}`

  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;">Pago recibido</h2>
    <p style="color:#4a5568;">Hola <strong>${data.nombre}</strong>, confirmamos la recepción de tu pago.</p>
    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong>Curso:</strong> ${data.cursoTitulo}</p>
      <p style="margin:0 0 8px;"><strong>Monto:</strong> ${montoFormateado}</p>
      <p style="margin:0 0 8px;"><strong>Medio de pago:</strong> ${data.gateway}</p>
      ${data.ordenId ? `<p style="margin:0;color:#718096;font-size:13px;">Orden: ${data.ordenId}</p>` : ''}
    </div>
    <a href="${APP_URL}/dashboard/cursos/${data.cursoSlug}" style="${btnStyle}">Ir al curso</a>
  `)

  return enviarEmail({
    to: data.email,
    subject: `Pago confirmado — ${data.cursoTitulo}`,
    html,
  })
}

// ─── Helpers internos ────────────────────────────────────────────────────────

const btnStyle = 'display:inline-block;background-color:#28B4AD;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;margin-top:20px;'

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            <tr>
              <td style="background:#0a0f1d;padding:24px 32px;">
                <span style="font-size:20px;font-weight:900;color:#28B4AD;letter-spacing:-0.5px;">Capacitar y Crecer</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">Si no reconoces esta actividad, ignora este correo.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}
