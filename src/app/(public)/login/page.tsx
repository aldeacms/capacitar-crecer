'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas o usuario no confirmado.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center relative border-b border-white/10">
        <h2 className="relative z-10 text-3xl md:text-4xl font-black text-white">Inicia sesión</h2>
        <p className="relative z-10 mt-3 text-sm text-slate-300">¿No tienes cuenta? <Link href="/registro" className="font-bold text-[#2DB3A7]">Regístrate</Link></p>
      </div>
      <div className="flex-1 px-4 -mt-16 relative z-20 pb-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-slate-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={18}/>{error}</div>}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Correo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
                  <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="tu@correo.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
                  <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all disabled:opacity-50">
                {loading ? 'Cargando...' : 'Entrar a mis cursos'} <ArrowRight size={18} />
              </button>
              <div className="text-center">
                <Link href="/olvide-mi-contrasena" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
