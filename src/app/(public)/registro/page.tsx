'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { ArrowRight, Mail, Lock, User, AlertCircle, Fingerprint, Phone } from 'lucide-react'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validarRut = (rut: string) => {
    // Limpiar el rut de puntos y guion para la validación si es necesario, 
    // pero el regex espera el guion.
    const cleanRut = rut.replace(/\./g, '');
    if (!/^[0-9]+-[0-9kK]{1}$/.test(cleanRut)) return false;
    const tmp = cleanRut.split('-');
    let digv = tmp[1]; 
    const num = tmp[0];
    if (digv == 'K') digv = 'k';
    
    let m = 0, s = 1;
    let t = parseInt(num);
    for (; t; t = Math.floor(t / 10))
      s = (s + t % 10 * (9 - m++ % 6)) % 11;
    return (s ? s - 1 : 'k') == digv;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!validarRut(rut)) {
      setError('El RUT ingresado no es válido. Usa el formato 12345678-9')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: nombre,
          rut: rut,
          telefono: telefono
        },
        emailRedirectTo: `${window.location.origin}/auth/callback` 
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Create perfil server-side to avoid client-side DB writes and FK issues
    if (data.user) {
      try {
        await fetch('/api/perfiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre_completo: nombre, rut, telefono })
        })
      } catch (e) {
        console.error('Error creating perfil via API:', e)
      }
    }

    // Forzamos el login inmediato tras el registro exitoso
    await supabase.auth.signInWithPassword({ email, password })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-[#0a0f1d] pt-36 pb-24 px-4 text-center relative border-b border-white/10">
        <h2 className="relative z-10 text-3xl md:text-4xl font-black text-white">Crea tu cuenta</h2>
        <p className="relative z-10 mt-3 text-sm text-slate-300">¿Ya tienes cuenta? <Link href="/login" className="font-bold text-[#2DB3A7]">Inicia sesión</Link></p>
      </div>
      <div className="flex-1 px-4 -mt-16 relative z-20 pb-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-slate-100">
            <form className="space-y-5" onSubmit={handleRegister}>
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={18}/>{error}</div>}
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
                  <input type="text" required value={nombre} onChange={(e)=>setNombre(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="Ej. Juan Pérez" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">RUT</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
                  <input type="text" required value={rut} onChange={(e)=>setRut(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="12.345.678-9" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3 h-5 w-5 text-slate-500" />
                  <input type="tel" required value={telefono} onChange={(e)=>setTelefono(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="+56 9 1234 5678" />
                </div>
              </div>

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
                  <input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2DB3A7]" placeholder="Mínimo 6 caracteres" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all disabled:opacity-50">
                {loading ? 'Creando...' : 'Registrarme'} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
