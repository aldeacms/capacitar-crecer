'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export default function RestablecerContrasenaPage() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exitoso, setExitoso] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setExitoso(true)
    setTimeout(() => router.push('/dashboard'), 3000)
  }

  if (exitoso) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center border-b border-white/10">
          <h2 className="text-3xl font-black text-white">Contraseña actualizada</h2>
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
                <h3 className="text-xl font-bold text-gray-900">¡Listo!</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Tu contraseña ha sido actualizada. Serás redirigido a tu dashboard en unos segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center border-b border-white/10">
        <h2 className="text-3xl font-black text-white">Nueva contraseña</h2>
        <p className="mt-3 text-sm text-slate-300">
          Elige una nueva contraseña para tu cuenta.
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
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]"
                    placeholder="Repite tu nueva contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
