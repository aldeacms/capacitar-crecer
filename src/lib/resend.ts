import { Resend } from 'resend'

// Resend es opcional - si no hay API key, funciones de email fallarán gracefully
let resend: Resend | null = null

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
} else {
  console.warn('⚠️ RESEND_API_KEY not configured - email functionality disabled')
}

export default resend
export { Resend }
