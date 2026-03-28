'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export default function OlvideMiContrasenaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center border-b border-white/10">
          <h2 className="text-3xl font-black text-white">Revisa tu correo</h2>
        </div>
        <div className="flex-1 px-4 -mt-16 relative z-20 pb-20">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-slate-100 text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Email enviado</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Si <strong>{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Revisa también tu carpeta de spam.
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-[#28B4AD] hover:underline text-sm font-semibold"
              >
                <ArrowLeft size={16} />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center border-b border-white/10">
        <h2 className="text-3xl font-black text-white">Recuperar contraseña</h2>
        <p className="mt-3 text-sm text-slate-300">
          Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>
      <div className="flex-1 px-4 -mt-16 relative z-20 pb-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-slate-100">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Volver al inicio de sesión
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
