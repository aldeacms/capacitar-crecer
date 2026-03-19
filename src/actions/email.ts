'use server'

import resend from '@/lib/resend'

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
    if (!process.env.RESEND_API_KEY) {
      return { error: 'RESEND_API_KEY no configurado. Los correos no pueden ser enviados.' }
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Capacitar y Crecer <no-reply@resend.dev>',
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>¡Bienvenido a Capacitar y Crecer!</h2>

      <p>Hola <strong>${data.nombre}</strong>,</p>

      <p>Tu cuenta ha sido creada exitosamente. Aquí están tus datos de acceso:</p>

      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Contraseña temporal:</strong> ${data.password}</p>
      </div>

      <p style="color: #666;">
        <em>Te recomendamos cambiar tu contraseña una vez que ingreses por primera vez a la plataforma.</em>
      </p>

      <a href="${appUrl}/login" style="display: inline-block; background-color: #28B4AD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
        Inicia Sesión
      </a>

      <p style="margin-top: 40px; color: #999; font-size: 12px;">
        Si no reconoces esta cuenta, ignora este correo.
      </p>
    </div>
  `

  return enviarEmail({
    to: data.email,
    subject: 'Bienvenido a Capacitar y Crecer - Datos de Acceso',
    html
  })
}
